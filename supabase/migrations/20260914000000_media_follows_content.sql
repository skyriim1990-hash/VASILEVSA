-- =============================================================================
-- MEDIA VISIBILITY FOLLOWS THE CONTENT THAT USES IT
-- =============================================================================
-- Found during the audit, against the live database.
--
-- The first migration gave public.media the same policy as everything else:
--
--     using (is_published)
--
-- and src/lib/admin/media.js writes every uploaded row with is_published = true,
-- because a published artwork whose media row is hidden renders with no image.
--
-- The two together mean an image uploaded to an unpublished draft is listed to
-- anyone. Not the draft's title, year or description — those stay behind the
-- artworks policy and are genuinely private. But the media row carries `bucket`
-- and `path`, the buckets are public-read, and so the photograph itself can be
-- fetched by anyone who reads the table.
--
-- Verified: as anon, before this migration,
--   select bucket, path from media  ->  1 row, for an artwork that is a draft.
--
-- For a painter this is the wrong default. Work in progress, or work held back
-- for a show, should not be visible because it was uploaded early.
--
-- -----------------------------------------------------------------------------
-- WHAT THIS CHANGES
-- -----------------------------------------------------------------------------
-- A media row becomes readable by the public only while something published
-- points at it. Attach an image to a draft and it is invisible; publish the
-- draft and the image appears with it; unpublish it and the image goes back
-- out of view. No flag to remember, because it is derived rather than stored.
--
-- is_published on media is kept and still respected — it is now the editor's
-- own override, ANDed with the rule above, so a file can be withdrawn by hand
-- without unpublishing the artwork.
--
-- -----------------------------------------------------------------------------
-- WHAT THIS DOES NOT CHANGE
-- -----------------------------------------------------------------------------
-- The buckets stay public-read, so a path that was already published, guessed
-- or shared can still be fetched directly. This removes the listing, not the
-- object. Closing that too means private buckets and signed URLs, which the
-- admin-access migration rejected for a reason that still holds: the public
-- pages are prerendered, and a URL signed at build time expires long before
-- the page does.
--
-- So: this raises the cost of finding an unpublished image from "read one
-- table" to "guess a path with a random suffix". It is an improvement, not a
-- guarantee, and anything genuinely embargoed should not be uploaded until it
-- is ready to be seen.
--
-- -----------------------------------------------------------------------------
-- ON RECURSION
-- -----------------------------------------------------------------------------
-- A policy that queries another table applies that table's policies too, which
-- is how two tables referring to each other deadlock. Safe here: the policies
-- on artworks, exhibitions and content_sections are plain `using (is_published)`
-- and name no other table, so the chain ends one step down.
--
-- The explicit `is_published` in each EXISTS below is therefore redundant under
-- anon — RLS has already filtered those rows. It is written out anyway, so the
-- rule does not quietly change meaning if one of those policies is ever
-- broadened.
-- =============================================================================

drop policy if exists "Published media is readable by everyone" on public.media;

-- Postgres has no CREATE POLICY IF NOT EXISTS, so running this file twice would
-- stop on 42710 "policy already exists" — with the old policy already dropped
-- by the line above, leaving media readable by nobody until the create ran.
-- Dropping the new name first makes the file safe to re-run.
drop policy if exists "Media in published content is readable by everyone" on public.media;

create policy "Media in published content is readable by everyone"
  on public.media for select
  to anon, authenticated
  using (
    is_published
    and (
      exists (
        select 1 from public.artworks a
        where a.media_id = media.id and a.is_published
      )
      or exists (
        select 1 from public.exhibitions e
        where e.media_id = media.id and e.is_published
      )
      or exists (
        select 1 from public.content_sections s
        where s.media_id = media.id and s.is_published
      )
    )
  );

-- The admin policies from the previous migration are untouched: an
-- administrator still reads every media row, published or not, which is what
-- the media library needs in order to list files nothing uses yet.

comment on policy "Media in published content is readable by everyone" on public.media is
  'Public visibility is derived from the content referencing the file, not stored on it.';


-- -----------------------------------------------------------------------------
-- The indexes this relies on already exist
-- -----------------------------------------------------------------------------
--   artworks_media_idx, exhibitions_media_idx, content_sections_media_idx
-- from the first migration. Listed here so a later cleanup does not drop one
-- and turn every public media read into three sequential scans.
