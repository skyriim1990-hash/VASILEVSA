/**
 * CONTENT — the public site's data source
 *
 * One module the pages import instead of reaching into artworks.js and
 * exhibitions.js directly. It asks Supabase for published content and falls
 * back to those two files when there is none.
 *
 * ---------------------------------------------------------------------------
 * WHY A SWITCH AND NOT A REPLACEMENT
 * ---------------------------------------------------------------------------
 * The database is empty today. Pointing the site straight at it would replace
 * a working page of twelve marked placeholders with a blank one — a visible
 * regression in exchange for an architecture nobody can see yet.
 *
 * So: real content wins, and when there is none the site renders exactly what
 * it rendered before. src/data/artworks.js and src/data/exhibitions.js keep
 * their current job and are not touched. The changeover happens the first time
 * a work is published in the admin panel, with no code change and no migration
 * of the placeholder rows — they were never content, and they are not worth
 * carrying into a database.
 *
 * ---------------------------------------------------------------------------
 * WHEN THIS RUNS
 * ---------------------------------------------------------------------------
 * At build time, once, during `astro build` — the public pages are prerendered
 * and this module is evaluated while they are generated. A visitor's browser
 * never runs any of it and never contacts Supabase.
 *
 * The consequence, which is worth stating plainly: publishing a work in the
 * admin panel does not change the live site until the site is rebuilt.
 *
 * The client is a plain createClient, not the browser or server one. There is
 * no request and no cookie during a build, so there is no session — it reads
 * as an anonymous visitor, and Row Level Security is what limits it to
 * published rows. Unpublished work cannot reach a page from here even if a
 * query forgot to ask.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../lib/supabase/env.js';
import { publicUrl } from '../lib/supabase/storage.js';

import {
  artworks as fallbackArtworks,
  CATEGORIES as FALLBACK_CATEGORIES,
  PERIODS,
} from './artworks.js';

/* src/data/exhibitions.js is deliberately NOT imported. Its rows are prose
   placeholders, and the public page now shows an empty state instead of them —
   see the comment on `exhibitions` below. The file stays where it is. */

/* ------------------------------------------------------------------ fetch */

/**
 * Reads published content, or returns nulls.
 *
 * Every failure path ends the same way — a null, and the fallback below. A
 * build must not break because a database is unreachable, and a site that has
 * been rendering placeholders for months should not start failing to compile
 * the day someone revokes a key.
 */
async function load() {
  if (!isSupabaseConfigured) return { artworks: null, exhibitions: null, categories: null, home: null };

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [works, shows, cats, home] = await Promise.all([
      supabase
        .from('artworks')
        .select(`
          id, slug, title, year, year_display, medium, dimensions, description,
          aspect_ratio, is_selected, is_featured, sort_order, media_id,
          media:media_id ( bucket, path, alt, width, height ),
          category:category_id ( slug, label )
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),

      supabase
        .from('exhibitions')
        .select('slug, title, venue, city, country, year, exhibition_type, url, sort_order')
        .order('year', { ascending: false, nullsFirst: false })
        .order('sort_order', { ascending: true }),

      supabase
        .from('categories')
        .select('slug, label, sort_order')
        .order('sort_order', { ascending: true }),

      /* The three opening images of the homepage, chosen in Admin → Homepage.
         Read as anon like everything else here, so RLS returns published rows
         only, and a joined media row only while this published section points
         at it. */
      supabase
        .from('content_sections')
        .select('section_key, media:media_id ( id, bucket, path, alt, caption, width, height )')
        .eq('page_key', 'home'),
    ]);

    return {
      artworks: works.error ? null : works.data,
      exhibitions: shows.error ? null : shows.data,
      categories: cats.error ? null : cats.data,
      home: home.error ? null : home.data,
    };
  } catch {
    /* Unreachable host, DNS failure, a malformed URL in .env. Nothing here is
       worth failing a build over. */
    return { artworks: null, exhibitions: null, categories: null, home: null };
  }
}

/* Top-level await: this module is only ever evaluated on the server, during
   the build, and every page that imports it needs the answer before it can
   render. */
const remote = await load();

/* ---------------------------------------------------------------------------
   Why this block exists
   ---------------------------------------------------------------------------
   The await above runs ONCE per module load. `astro dev` loads this module the
   first time a page needs it and then holds the result for the life of the
   process — no source file changed, so Vite never invalidates it. Publish a
   work in the admin panel, reload /works, and the page is unchanged. Nothing
   on screen says why, and the obvious conclusion is that the database was
   never wired up. That conclusion has already been reached once here, and it
   cost an afternoon.

   So dev says out loud what it read. It prints to the server terminal, never
   to the page. `import.meta.env.DEV` is replaced with false in a production
   build, so the whole block is dropped from the output.
--------------------------------------------------------------------------- */
if (import.meta.env.DEV) {
  const n = Array.isArray(remote.artworks) ? remote.artworks.length : 0;

  console.info(
    n > 0
      ? `[content] ${n} published artwork(s) read from Supabase at ${new Date().toLocaleTimeString()}. ` +
        'Cached until this dev server restarts — anything published after now will not appear until it does.'
      : '[content] Supabase returned no published artworks, so the page is rendering the placeholders ' +
        'in src/data/artworks.js. Cached until this dev server restarts.'
  );
}

/* ----------------------------------------------------------------- shapes */

/**
 * A database row in the shape the existing components already expect.
 *
 * The field names are the ones in src/data/artworks.js, deliberately. Renaming
 * them to match the database would mean editing ArtworkCard, ArtworkGrid,
 * ArtworkDetailView, HomeView and ArtSportView — five templates changed to
 * rename a property, with the site's appearance riding on getting all of them
 * right. The mapping lives here instead, where it is one function.
 */
function toArtwork(row) {
  return {
    id: row.slug,
    title: row.title ?? '',
    /* year_display carries a span like "2014–2015"; `year` is the sortable
       number behind it. The site prints one string, so the display form wins
       when it exists. */
    year: row.year_display || (row.year ? String(row.year) : ''),
    category: row.category?.slug ?? '',
    medium: row.medium ?? '',
    dimensions: row.dimensions ?? '',
    image: row.media ? publicUrl(row.media.bucket, row.media.path) : '',
    alt: row.media?.alt ?? '',
    /* Lets the homepage recognise an image chosen in Admin → Homepage as this
       work's photograph, and link the frame to the work as it does today. */
    mediaId: row.media_id ?? '',
    description: row.description ?? '',
    ratio: ratioFor(row),
    selected: Boolean(row.is_selected),
    feature: Boolean(row.is_featured),
  };
}

/**
 * The proportions to reserve for a work's photograph.
 *
 * ---------------------------------------------------------------------------
 * WHY THE FILE WINS OVER THE FIELD
 * ---------------------------------------------------------------------------
 * `aspect_ratio` is a text field on the artwork, and the form fills it with
 * "3 / 4" unless someone types something else. Nobody does — measured against
 * the live database, all eight published works carried "3 / 4" while the files
 * themselves ran from 0.434 to 1.839. Media reserves a box from that field and
 * `object-fit: cover` then crops the photograph to fill it, so a landscape
 * stored as 3:4 lost around sixty per cent of its width. The paintings were
 * being cut to fit a number nobody had looked at.
 *
 * `media.width` and `media.height` are not a second opinion — they are the
 * file's own pixel dimensions, read from the image at upload. When they exist
 * they are the truth, so they win, and `object-fit: cover` goes back to being
 * what it was meant to be: a safety net for a box that is a rounding error
 * out, rather than the thing doing the cropping.
 *
 * The field is still honoured when the dimensions are missing — an upload made
 * with JavaScript disabled records no size — and "3 / 4" remains the last
 * resort. Nothing in the database changes; this only decides what to read.
 */
function ratioFor(row) {
  const { width, height } = row.media ?? {};

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return `${width} / ${height}`;
  }

  return row.aspect_ratio || '3 / 4';
}

function toExhibition(row) {
  return {
    year: row.year ? String(row.year) : '',
    title: row.title ?? '',
    venue: row.venue ?? '',
    city: row.city ?? '',
    country: row.country ?? '',
    type: row.exhibition_type ?? '',
    url: row.url ?? '',
  };
}

/* ------------------------------------------------------------------ state */

/** True when the archive on screen came from the database. */
export const usingDatabase = Array.isArray(remote.artworks) && remote.artworks.length > 0;

export const artworks = usingDatabase ? remote.artworks.map(toArtwork) : fallbackArtworks;

/**
 * The homepage's opening images, as chosen in Admin → Homepage.
 *
 * Rows in content_sections with page_key 'home':
 *   image-large    media = the large frame of the opening collage
 *   image-small-1  media = the upper small frame
 *   image-small-2  media = the lower small frame
 *
 * Each is null when nothing has been chosen, and HomeView keeps the frame it
 * has always had there. So an empty table, an unreachable database or a slot
 * left on "No image" renders exactly as the page did before this existed.
 */
function toHomeImage(media) {
  if (!media?.bucket || !media?.path) return null;

  return {
    src: publicUrl(media.bucket, media.path),
    alt: media.alt || media.caption || '',
    /* the published work this file belongs to, if any — the frame links to it */
    artwork: artworks.find((a) => a.mediaId && a.mediaId === media.id) ?? null,
  };
}

const homeRow = (key) => (Array.isArray(remote.home) ? remote.home.find((r) => r.section_key === key) : null);

export const homepage = {
  images: {
    large: toHomeImage(homeRow('image-large')?.media),
    small1: toHomeImage(homeRow('image-small-1')?.media),
    small2: toHomeImage(homeRow('image-small-2')?.media),
  },
};

const hasRemoteExhibitions = Array.isArray(remote.exhibitions) && remote.exhibitions.length > 0;

/**
 * Published exhibitions, or nothing at all.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS ONE DOES NOT FALL BACK, WHEN artworks ABOVE DOES
 * ---------------------------------------------------------------------------
 * The two placeholder sets are not the same kind of thing. A placeholder
 * artwork is a reserved frame — it says "a painting goes here" and reads as
 * production scaffolding. A placeholder exhibition is a row of prose: a title,
 * a venue, a city, SOLO or GROUP. However it is labelled, it renders as a
 * factual claim about where this artist has shown, which is exactly the thing
 * that must never be implied.
 *
 * So when the database has no exhibitions the page gets an empty list and says
 * so in a sentence. src/data/exhibitions.js is left on disk untouched; it is
 * simply no longer a source for the public page.
 */
export const exhibitions = hasRemoteExhibitions ? remote.exhibitions.map(toExhibition) : [];

/**
 * The filter row: the five periods, behind "All".
 *
 * ---------------------------------------------------------------------------
 * WHY THE DATABASE DOES NOT SIMPLY WIN HERE
 * ---------------------------------------------------------------------------
 * The periods are a closed vocabulary — the places the work was made in — so
 * unlike a genre list they are not something an editor invents. A category row
 * is therefore honoured when its slug is one of the five: the row's own label
 * and order are used, so a period can still be renamed or reordered from the
 * admin panel without a code change.
 *
 * A row with any other slug is ignored. That is what keeps the previous
 * project's genre categories, which are still sitting in the table, off the
 * public page without anyone having to delete them first.
 */
const ALL = FALLBACK_CATEGORIES.find((c) => c.id === 'all');
const isPeriod = new Set(PERIODS.map((p) => p.id));

const remotePeriods = Array.isArray(remote.categories)
  ? remote.categories.filter((c) => isPeriod.has(c.slug)).map((c) => ({ id: c.slug, label: c.label }))
  : [];

export const CATEGORIES = [ALL, ...(remotePeriods.length > 0 ? remotePeriods : PERIODS)];

/* ---------------------------------------------------------------- helpers */
/* Same signatures as the ones in artworks.js and exhibitions.js, so the call
   sites are unchanged. They close over the resolved list above rather than
   over the static one. */

/** Sequential display number, e.g. "04" — also used on the placeholders. */
export function artworkIndex(id) {
  const i = artworks.findIndex((a) => a.id === id);
  return String(i + 1).padStart(2, '0');
}

/** `selected: true` items, in order — used on the homepage. */
export const selectedArtworks = artworks.filter((a) => a.selected);

/**
 * The works the homepage composition draws on, best first.
 *
 * `selected` is the marker meant for this: src/data/artworks.js documents it as
 * "part of SELECTED WORKS + homepage shortlist". `feature` is documented as
 * permission to occupy a large slot in the grid — a size hint, not a homepage
 * signal — so it is only consulted second, and plain published order last.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS A FALLBACK AT ALL
 * ---------------------------------------------------------------------------
 * An archive can be entirely published with nothing ticked — which is exactly
 * what happens when someone uploads their first works and never opens the two
 * checkboxes, because nothing told them to. The homepage answered that with
 * four empty frames reading "ARTWORK PLACEHOLDER 00" while eight photographs
 * sat in the database. That looks broken rather than unconfigured, and it is
 * the wrong way round: the site should show what it has and improve when the
 * markers are set, not withhold everything until they are.
 *
 * Order is preserved and duplicates dropped, so ticking `selected` on one work
 * promotes it to the front without reshuffling anything else.
 *
 * @param {number} limit  how many slots the composition has
 */
export function homepageArtworks(limit) {
  const chosen = [];
  const seen = new Set();

  for (const group of [selectedArtworks, artworks.filter((a) => a.feature), artworks]) {
    for (const artwork of group) {
      if (seen.has(artwork.id)) continue;

      seen.add(artwork.id);
      chosen.push(artwork);

      if (chosen.length >= limit) return chosen;
    }
  }

  /* Fewer works than slots. Returned short rather than padded — the grid
     simply renders fewer cells, and a repeated painting would be a lie about
     how much work there is. */
  return chosen;
}

/** Neighbours for the prev / next control on a detail page. Wraps around. */
export function neighbours(id) {
  const i = artworks.findIndex((a) => a.id === id);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: artworks[(i - 1 + artworks.length) % artworks.length],
    next: artworks[(i + 1) % artworks.length],
  };
}

/**
 * True once at least one exhibition carries a year.
 *
 * No longer read by any view. It existed to hide a notice about the
 * placeholder rows, and those are gone — ExhibitionsView now branches on
 * whether the list is empty at all. Kept because this module mirrors the
 * exports of src/data/exhibitions.js, and because "are any of these dated"
 * is a question the timeline may want again.
 */
export const hasRealExhibitionData = exhibitions.some((e) => e.year !== '');

/** Newest first; undated entries keep their order and fall to the end. */
export function byYearDescending(list = exhibitions) {
  return [...list].sort((a, b) => (b.year || '').localeCompare(a.year || ''));
}
