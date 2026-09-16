-- =============================================================================
-- CONTENT FOUNDATION — Vasilevsa
-- =============================================================================
-- Creates the tables the admin system will manage: categories, media, artworks,
-- exhibitions and the editorial sections behind About and Art x Sport.
--
-- This migration creates STRUCTURE ONLY. The single exception is the category
-- list, which is copied verbatim from src/data/artworks.js because the foreign
-- key on artworks cannot be satisfied without it. No artwork, exhibition or
-- biographical content is inserted — none has been supplied, and none is
-- invented here.
--
-- The public website is untouched by this migration. It still renders from
-- src/data/*.js and will continue to do so until it is explicitly pointed at
-- these tables.
--
-- -----------------------------------------------------------------------------
-- CONVENTIONS
-- -----------------------------------------------------------------------------
-- Text columns are NOT NULL DEFAULT '' rather than nullable. The existing code
-- already treats '' as "not supplied" (see value() in src/utils/display.js);
-- allowing NULL as well would create two kinds of empty to test for.
--
-- Every image reference is a foreign key into `media` rather than a bucket and
-- path repeated on each table. One place to manage a file, one place to fix a
-- wrong path.
--
-- `translations` is a JSONB column shaped { "bg": { "title": "...", ... } }.
-- Bulgarian was removed from the site, so no _bg columns are created; this
-- costs nothing while empty and needs no migration if a second language
-- returns.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
-- SECURITY INVOKER and an empty search_path are deliberate: the function runs
-- with the caller's rights and resolves nothing from a caller-controlled path.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger helper: stamps updated_at on every UPDATE.';


-- =============================================================================
-- CATEGORIES
-- =============================================================================
-- Replaces the hardcoded CATEGORIES array. Note that 'all' and 'selected' from
-- that array are NOT categories — they are filter controls in the UI — and are
-- deliberately not rows here.
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  label        text not null,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  translations jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_label_present check (length(btrim(label)) > 0)
);

comment on table public.categories is 'Artwork categories driving the Works filters.';


-- =============================================================================
-- MEDIA
-- =============================================================================
-- One row per file in Supabase Storage. Holds the metadata; the bytes live in
-- the bucket. `width`/`height` exist so a page can reserve the right space
-- before the image loads, which is what stops layout shift.
create table public.media (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null default 'artworks',
  path         text not null,
  alt          text not null default '',
  caption      text not null default '',
  mime_type    text not null default '',
  width        integer,
  height       integer,
  byte_size    bigint,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint media_bucket_path_unique unique (bucket, path),
  constraint media_path_present check (length(btrim(path)) > 0),
  constraint media_bucket_present check (length(btrim(bucket)) > 0),
  -- no leading slash: storage.js joins bucket and path itself
  constraint media_path_relative check (path !~ '^/'),
  constraint media_width_positive check (width is null or width > 0),
  constraint media_height_positive check (height is null or height > 0),
  constraint media_size_nonnegative check (byte_size is null or byte_size >= 0)
);

comment on table public.media is 'Registry of files held in Supabase Storage.';
comment on column public.media.path is 'Path within the bucket, no leading slash.';


-- =============================================================================
-- ARTWORKS
-- =============================================================================
create table public.artworks (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null default '',
  year          smallint,
  -- for a work that spans time, e.g. '2014-2015'. Empty when `year` says it all.
  year_display  text not null default '',
  category_id   uuid references public.categories (id) on delete set null,
  medium        text not null default '',
  dimensions    text not null default '',
  description   text not null default '',
  media_id      uuid references public.media (id) on delete set null,
  -- CSS aspect-ratio, passed straight to the existing Media.astro `ratio` prop
  aspect_ratio  text not null default '3 / 4',
  is_selected   boolean not null default false,
  is_featured   boolean not null default false,
  is_published  boolean not null default false,
  sort_order    integer not null default 0,
  translations  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint artworks_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- a sanity range, not a claim about the work; catches typos like 20199
  constraint artworks_year_range check (year is null or year between 1800 and 2200),
  constraint artworks_aspect_ratio_format
    check (aspect_ratio ~ '^[0-9]+(\.[0-9]+)?\s*/\s*[0-9]+(\.[0-9]+)?$')
);

comment on table public.artworks is 'The artwork archive.';
comment on column public.artworks.is_selected is 'Appears in the Selected Works shortlist.';
comment on column public.artworks.is_featured is 'May occupy a large slot in the grid.';

-- ON DELETE SET NULL above is deliberate on both keys: removing a category or
-- a photograph must never cascade into deleting the artwork record itself.


-- =============================================================================
-- EXHIBITIONS
-- =============================================================================
-- `year` is what the timeline groups by, mirroring byYearDescending() in
-- src/data/exhibitions.js. The two date columns are optional precision on top.
create table public.exhibitions (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null default '',
  venue           text not null default '',
  city            text not null default '',
  country         text not null default '',
  year            smallint,
  start_date      date,
  end_date        date,
  exhibition_type text not null default '',
  description     text not null default '',
  url             text not null default '',
  media_id        uuid references public.media (id) on delete set null,
  is_published    boolean not null default false,
  sort_order      integer not null default 0,
  translations    jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint exhibitions_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint exhibitions_year_range check (year is null or year between 1800 and 2200),
  -- matches the 'solo' | 'group' | '' vocabulary already used in the data file
  constraint exhibitions_type_allowed check (exhibition_type in ('solo', 'group', '')),
  constraint exhibitions_dates_ordered
    check (start_date is null or end_date is null or end_date >= start_date),
  constraint exhibitions_url_shape check (url = '' or url ~* '^https?://')
);

comment on table public.exhibitions is 'Exhibition history, rendered as a timeline.';


-- =============================================================================
-- CONTENT SECTIONS
-- =============================================================================
-- The skeleton for the editorial pages. `page_key` names the page ('about',
-- 'art-sport'), `section_key` the block within it ('intro', 'chapter-01').
--
-- Intentionally generic: the exact shape of those pages is settled in the
-- design, not in the database, and a table per page would have to be migrated
-- every time a section is added. Zero rows are created here.
create table public.content_sections (
  id           uuid primary key default gen_random_uuid(),
  page_key     text not null,
  section_key  text not null,
  heading      text not null default '',
  body         text not null default '',
  media_id     uuid references public.media (id) on delete set null,
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  translations jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint content_sections_unique unique (page_key, section_key),
  constraint content_sections_page_key_format check (page_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint content_sections_section_key_format check (section_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.content_sections is
  'Editorial blocks for About and Art x Sport.';


-- =============================================================================
-- TRIGGERS
-- =============================================================================
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger media_set_updated_at
  before update on public.media
  for each row execute function public.set_updated_at();

create trigger artworks_set_updated_at
  before update on public.artworks
  for each row execute function public.set_updated_at();

create trigger exhibitions_set_updated_at
  before update on public.exhibitions
  for each row execute function public.set_updated_at();

create trigger content_sections_set_updated_at
  before update on public.content_sections
  for each row execute function public.set_updated_at();


-- =============================================================================
-- INDEXES
-- =============================================================================
-- Shaped after the queries the site actually makes: a published list in
-- curator's order, a filter by category, and the two homepage shortlists.
-- UNIQUE constraints already index slug on every table, so those are not
-- repeated here.

create index categories_published_order_idx
  on public.categories (sort_order)
  where is_published;

create index media_published_idx
  on public.media (is_published);

create index artworks_published_order_idx
  on public.artworks (sort_order, created_at desc)
  where is_published;

create index artworks_category_idx
  on public.artworks (category_id)
  where is_published;

create index artworks_selected_idx
  on public.artworks (sort_order)
  where is_published and is_selected;

create index artworks_featured_idx
  on public.artworks (sort_order)
  where is_published and is_featured;

create index artworks_media_idx on public.artworks (media_id);

-- NULLS LAST so undated entries fall to the end, as the JS sort already does
create index exhibitions_published_year_idx
  on public.exhibitions (year desc nulls last, sort_order)
  where is_published;

create index exhibitions_media_idx on public.exhibitions (media_id);

create index content_sections_page_idx
  on public.content_sections (page_key, sort_order)
  where is_published;

create index content_sections_media_idx on public.content_sections (media_id);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Read: published rows only, for anonymous and signed-in visitors alike.
-- Write: no policy is created, so every INSERT, UPDATE and DELETE is refused.
--        In Postgres, RLS enabled with no matching policy denies by default —
--        an explicit "deny" rule is unnecessary and would only obscure that.
--
-- Admin write access arrives in a later migration, granted to authenticated
-- users who pass an explicit check. Nothing here is permissive in the meantime.

alter table public.categories       enable row level security;
alter table public.media            enable row level security;
alter table public.artworks         enable row level security;
alter table public.exhibitions      enable row level security;
alter table public.content_sections enable row level security;

create policy "Published categories are readable by everyone"
  on public.categories for select
  to anon, authenticated
  using (is_published);

create policy "Published media is readable by everyone"
  on public.media for select
  to anon, authenticated
  using (is_published);

create policy "Published artworks are readable by everyone"
  on public.artworks for select
  to anon, authenticated
  using (is_published);

create policy "Published exhibitions are readable by everyone"
  on public.exhibitions for select
  to anon, authenticated
  using (is_published);

create policy "Published content sections are readable by everyone"
  on public.content_sections for select
  to anon, authenticated
  using (is_published);


-- -----------------------------------------------------------------------------
-- Privileges — a second layer under RLS
-- -----------------------------------------------------------------------------
-- Supabase grants full table privileges to anon and authenticated by default,
-- relying on RLS alone to hold the line. Removing the write grants means a
-- future policy mistake is not enough on its own to open up writing.
revoke insert, update, delete on public.categories       from anon, authenticated;
revoke insert, update, delete on public.media            from anon, authenticated;
revoke insert, update, delete on public.artworks         from anon, authenticated;
revoke insert, update, delete on public.exhibitions      from anon, authenticated;
revoke insert, update, delete on public.content_sections from anon, authenticated;


-- =============================================================================
-- CATEGORY SEED
-- =============================================================================
-- Copied verbatim from CATEGORIES in src/data/artworks.js. These are existing
-- project values, not invented content. 'all' and 'selected' are omitted on
-- purpose: they are filter controls in the interface, not categories a work
-- can belong to.
--
-- Published on insert so the filters are usable as soon as artworks exist.
insert into public.categories (slug, label, sort_order, is_published) values
  ('paintings',       'Paintings',      1, true),
  ('action-painting', 'Action Painting', 2, true),
  ('figurative',      'Figurative',     3, true),
  ('abstract',        'Abstract',       4, true)
on conflict (slug) do nothing;
