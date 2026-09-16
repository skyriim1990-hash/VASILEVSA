-- =============================================================================
-- ADMIN ACCESS — Vasilevsa
-- =============================================================================
-- The first migration created the tables and locked them: read published rows,
-- write nothing. This one opens writing to a named list of people and to nobody
-- else.
--
-- -----------------------------------------------------------------------------
-- WHY AN ALLOWLIST TABLE AND NOT THE SERVICE-ROLE KEY
-- -----------------------------------------------------------------------------
-- The obvious way to make an admin panel write is to hand the server the
-- service-role key, which bypasses Row Level Security entirely. That works, and
-- it means every bug in every admin route is one step away from full database
-- access, because the database is no longer checking anything.
--
-- Instead, permission is a fact stored in Postgres: a row in admin_users. The
-- admin panel signs in as an ordinary Supabase user and every statement it
-- issues is still filtered by RLS. A route that forgets its guard, or a stolen
-- session belonging to a non-admin, still writes nothing — the database refuses
-- it. SUPABASE_SERVICE_ROLE_KEY stays empty.
--
-- -----------------------------------------------------------------------------
-- ACTION REQUIRED AFTER RUNNING THIS
-- -----------------------------------------------------------------------------
-- This migration creates no admin. It cannot: no account exists yet, and one is
-- not invented here.
--
--   1. Supabase dashboard -> Authentication -> Users -> Add user
--      Create the account with a real email and password. Tick
--      "Auto Confirm User" so no confirmation email is needed.
--
--   2. Run this in the SQL Editor, with that email:
--
--        insert into public.admin_users (user_id, email)
--        select id, email from auth.users where email = 'you@example.com'
--        on conflict (user_id) do nothing;
--
--   3. Sign in at /admin/login.
--
-- Until step 2 is done the account can sign in and will see an explicit
-- "not an administrator" page. That is the intended behaviour, not a fault.
-- =============================================================================


-- =============================================================================
-- ADMIN ALLOWLIST
-- =============================================================================
-- `email` is a copy kept for display in the admin panel only. auth.users is the
-- authority on it; nothing here reads this column to make a decision.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null default '',
  note       text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Allowlist of Supabase auth users permitted to write site content.';

alter table public.admin_users enable row level security;

-- No policy grants INSERT, UPDATE or DELETE here on purpose. Admins are added
-- and removed from the SQL Editor by whoever owns the Supabase project. An
-- admin panel that can promote its own users is an admin panel where one
-- compromised session is permanent.
create policy "Admins can see the allowlist"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.admin_users from anon, authenticated;
revoke select on public.admin_users from anon;


-- =============================================================================
-- THE PREDICATE
-- =============================================================================
-- SECURITY DEFINER so the check itself is not subject to the policies it is
-- used by — without it, a policy on a table would consult a table whose own
-- policy consults it back.
--
-- STABLE lets the planner call it once per statement rather than once per row.
-- An empty search_path means every name inside is resolved explicitly and
-- nothing is picked up from the caller's path.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
  );
$$;

comment on function public.is_admin() is
  'True when the current request carries a session listed in admin_users.';

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- =============================================================================
-- POLICIES
-- =============================================================================
-- Postgres ORs permissive policies together, so these sit alongside the
-- "published is readable by everyone" policies from the first migration rather
-- than replacing them. The public read path is unchanged.
--
-- For each table: admins may read everything (drafts included), and may write.
-- `with check` is repeated on UPDATE because `using` alone tests the row as it
-- was, not as it will be.

-- --- categories --------------------------------------------------------------
create policy "Admins read all categories"
  on public.categories for select to authenticated using (public.is_admin());

create policy "Admins insert categories"
  on public.categories for insert to authenticated with check (public.is_admin());

create policy "Admins update categories"
  on public.categories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete categories"
  on public.categories for delete to authenticated using (public.is_admin());

-- --- media -------------------------------------------------------------------
create policy "Admins read all media"
  on public.media for select to authenticated using (public.is_admin());

create policy "Admins insert media"
  on public.media for insert to authenticated with check (public.is_admin());

create policy "Admins update media"
  on public.media for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete media"
  on public.media for delete to authenticated using (public.is_admin());

-- --- artworks ----------------------------------------------------------------
create policy "Admins read all artworks"
  on public.artworks for select to authenticated using (public.is_admin());

create policy "Admins insert artworks"
  on public.artworks for insert to authenticated with check (public.is_admin());

create policy "Admins update artworks"
  on public.artworks for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete artworks"
  on public.artworks for delete to authenticated using (public.is_admin());

-- --- exhibitions -------------------------------------------------------------
create policy "Admins read all exhibitions"
  on public.exhibitions for select to authenticated using (public.is_admin());

create policy "Admins insert exhibitions"
  on public.exhibitions for insert to authenticated with check (public.is_admin());

create policy "Admins update exhibitions"
  on public.exhibitions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete exhibitions"
  on public.exhibitions for delete to authenticated using (public.is_admin());

-- --- content_sections --------------------------------------------------------
create policy "Admins read all content sections"
  on public.content_sections for select to authenticated using (public.is_admin());

create policy "Admins insert content sections"
  on public.content_sections for insert to authenticated with check (public.is_admin());

create policy "Admins update content sections"
  on public.content_sections for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete content sections"
  on public.content_sections for delete to authenticated using (public.is_admin());


-- -----------------------------------------------------------------------------
-- Privileges
-- -----------------------------------------------------------------------------
-- A policy permits; it does not grant. RLS narrows what a role may touch among
-- the rows it already has the privilege to touch at all — if the privilege is
-- missing, Postgres refuses with 42501 before any policy is consulted.
--
-- This project needs both halves stated explicitly.
--
-- SELECT, verified against the live database: reading public.artworks as anon
-- returned `42501 permission denied for table artworks` even with the
-- "Published artworks are readable by everyone" policy in place. The policy was
-- correct and unreachable. Without the grant below the public site can never
-- read a single published row, and the symptom is a site that silently keeps
-- rendering placeholders while the database fills up.
grant usage on schema public to anon, authenticated;

grant select on public.categories       to anon, authenticated;
grant select on public.media            to anon, authenticated;
grant select on public.artworks         to anon, authenticated;
grant select on public.exhibitions      to anon, authenticated;
grant select on public.content_sections to anon, authenticated;

-- WRITE, deliberately narrower. The first migration revoked these from
-- `authenticated` as a second layer under RLS; they have to come back for the
-- admin policies above to have anything to permit. The grant reaches every
-- signed-in user and the policy is what narrows it to admins — which is why
-- both layers matter and neither is redundant.
--
-- anon is not included and still cannot write.
grant insert, update, delete on public.categories       to authenticated;
grant insert, update, delete on public.media            to authenticated;
grant insert, update, delete on public.artworks         to authenticated;
grant insert, update, delete on public.exhibitions      to authenticated;
grant insert, update, delete on public.content_sections to authenticated;


-- =============================================================================
-- STORAGE
-- =============================================================================
-- Creates the three buckets the code already names in src/lib/supabase/storage.js.
--
-- ---------------------------------------------------------------------------
-- ON `public = true`
-- ---------------------------------------------------------------------------
-- These buckets are readable without a token. That is a decision, not a
-- shortcut, and it is worth being explicit about what it costs.
--
-- The site is a static build: the artwork photographs are baked into prerendered
-- HTML as plain <img src>. A private bucket would mean signed URLs, which expire
-- — a URL signed at build time is dead long before the page is. Serving the
-- gallery from a private bucket would mean making the public pages server-
-- rendered, which is a change to the whole site, not to the admin panel.
--
-- The exposure this accepts: someone who guesses an object path can fetch an
-- image belonging to an unpublished draft. Paths carry a random suffix, so
-- guessing is not practical, but the images are not secret and are not
-- protected as though they were. Nothing else is public — the rows describing
-- those images stay behind RLS, so a draft's title, year and notes are not
-- readable.
--
-- Writing is a different matter and is closed: upload, update and delete are
-- admin-only, by the policies below.
insert into storage.buckets (id, name, public)
values
  ('artworks',  'artworks',  true),
  ('portraits', 'portraits', true),
  ('artsport',  'artsport',  true)
on conflict (id) do update set public = excluded.public;


-- Supabase ships a permissive default on storage.objects in some project
-- templates. Dropped by name if present, so this migration is the only thing
-- describing who may write.
drop policy if exists "Public Access" on storage.objects;

create policy "Site buckets are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('artworks', 'portraits', 'artsport'));

create policy "Admins upload to site buckets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('artworks', 'portraits', 'artsport')
    and public.is_admin()
  );

create policy "Admins update site bucket objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('artworks', 'portraits', 'artsport')
    and public.is_admin()
  )
  with check (
    bucket_id in ('artworks', 'portraits', 'artsport')
    and public.is_admin()
  );

create policy "Admins delete site bucket objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('artworks', 'portraits', 'artsport')
    and public.is_admin()
  );


-- =============================================================================
-- USAGE LOOKUP
-- =============================================================================
-- Answers "is this image still attached to anything?" in one query, so the
-- media library can warn before a delete instead of discovering the breakage
-- afterwards. A view rather than three queries in JavaScript: the join belongs
-- where the foreign keys are.
--
-- security_invoker means the view is read with the caller's rights, so RLS on
-- the underlying tables still applies and this is not a way around it.
create or replace view public.media_usage
with (security_invoker = true)
as
  select
    m.id as media_id,
    coalesce(aw.n, 0) as artwork_count,
    coalesce(ex.n, 0) as exhibition_count,
    coalesce(cs.n, 0) as section_count,
    coalesce(aw.n, 0) + coalesce(ex.n, 0) + coalesce(cs.n, 0) as total_count
  from public.media m
  left join (
    select media_id, count(*) as n from public.artworks
    where media_id is not null group by media_id
  ) aw on aw.media_id = m.id
  left join (
    select media_id, count(*) as n from public.exhibitions
    where media_id is not null group by media_id
  ) ex on ex.media_id = m.id
  left join (
    select media_id, count(*) as n from public.content_sections
    where media_id is not null group by media_id
  ) cs on cs.media_id = m.id;

comment on view public.media_usage is
  'Reference count per media row, for the delete warning in the media library.';

grant select on public.media_usage to authenticated;
