/**
 * ADMIN — DATABASE QUERIES
 *
 * Every read and write the admin panel makes, in one file, so a column rename
 * is one search rather than a hunt through fourteen route files.
 *
 * ---------------------------------------------------------------------------
 * THE CLIENT IS ALWAYS A PARAMETER
 * ---------------------------------------------------------------------------
 * Nothing here imports a Supabase client. The caller passes the request-scoped
 * one from `locals`, which carries the signed-in admin's session, so every
 * statement below is filtered by Row Level Security as that person.
 *
 * That is the difference between this file being safe and being a liability.
 * If it imported a client of its own it would need a credential, the only
 * credential that works outside a request is the service role, and a helper
 * module that quietly holds the service role is how an admin panel turns into
 * an open database.
 *
 * ---------------------------------------------------------------------------
 * ERRORS
 * ---------------------------------------------------------------------------
 * Supabase returns { data, error } and does not throw. These functions return
 * the same shape rather than unwrapping it, because "no rows" and "RLS refused
 * this" are different answers and a route needs to tell them apart.
 */

/* Columns pulled for a list row. The joined media is what renders the
   thumbnail; selecting it in the same round trip avoids one query per row. */
const MEDIA_FIELDS = 'id, bucket, path, alt, caption, mime_type, width, height, byte_size, is_published, created_at';
const ARTWORK_FIELDS = `
  id, slug, title, year, year_display, category_id, medium, dimensions,
  description, media_id, aspect_ratio, is_selected, is_featured, is_published,
  sort_order, created_at, updated_at,
  media:media_id ( ${MEDIA_FIELDS} ),
  category:category_id ( id, slug, label )
`;
const EXHIBITION_FIELDS = `
  id, slug, title, venue, city, country, year, start_date, end_date,
  exhibition_type, description, url, media_id, is_published, sort_order,
  created_at, updated_at,
  media:media_id ( ${MEDIA_FIELDS} )
`;
const SECTION_FIELDS = `
  id, page_key, section_key, heading, body, media_id, sort_order,
  is_published, created_at, updated_at,
  media:media_id ( ${MEDIA_FIELDS} )
`;

/* ========================================================================== */
/* CATEGORIES                                                                 */
/* ========================================================================== */

export function listCategories(supabase) {
  return supabase
    .from('categories')
    .select('id, slug, label, sort_order, is_published, created_at')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });
}

export function insertCategory(supabase, values) {
  return supabase.from('categories').insert(values).select('id').single();
}

export function updateCategory(supabase, id, values) {
  return supabase.from('categories').update(values).eq('id', id).select('id').single();
}

export function deleteCategory(supabase, id) {
  return supabase.from('categories').delete().eq('id', id);
}

/* ========================================================================== */
/* ARTWORKS                                                                   */
/* ========================================================================== */

/**
 * A page of artworks, filtered and counted in one round trip.
 *
 * `count: 'exact'` is what lets the pager know how many pages there are. It
 * costs a second scan; at the scale of an artist's archive that is nothing,
 * and the alternative — a "load more" button with no idea of the total — is
 * worse to use.
 *
 * @param {object} opts
 * @param {string} [opts.search]      matches title or slug
 * @param {string} [opts.categoryId]  uuid, or 'none' for uncategorised
 * @param {string} [opts.status]      'published' | 'draft' | ''
 * @param {number} [opts.page]        1-based
 * @param {number} [opts.perPage]
 */
export function listArtworks(supabase, opts = {}) {
  const { search = '', categoryId = '', status = '', page = 1, perPage = 25 } = opts;

  let query = supabase
    .from('artworks')
    .select(ARTWORK_FIELDS, { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (search) {
    /* escapeFilter below is not optional — see the comment on it. */
    const term = `%${escapeFilter(search)}%`;
    query = query.or(`title.ilike.${term},slug.ilike.${term}`);
  }

  if (categoryId === 'none') query = query.is('category_id', null);
  else if (categoryId) query = query.eq('category_id', categoryId);

  if (status === 'published') query = query.eq('is_published', true);
  else if (status === 'draft') query = query.eq('is_published', false);

  const from = Math.max(0, (page - 1) * perPage);
  return query.range(from, from + perPage - 1);
}

export function getArtwork(supabase, id) {
  return supabase.from('artworks').select(ARTWORK_FIELDS).eq('id', id).maybeSingle();
}

export function insertArtwork(supabase, values) {
  return supabase.from('artworks').insert(values).select('id').single();
}

export function updateArtwork(supabase, id, values) {
  return supabase.from('artworks').update(values).eq('id', id).select('id').single();
}

export function deleteArtwork(supabase, id) {
  return supabase.from('artworks').delete().eq('id', id);
}

/* ========================================================================== */
/* EXHIBITIONS                                                                */
/* ========================================================================== */

export function listExhibitions(supabase, opts = {}) {
  const { search = '', status = '', page = 1, perPage = 25 } = opts;

  let query = supabase
    .from('exhibitions')
    .select(EXHIBITION_FIELDS, { count: 'exact' })
    /* nullsFirst: false keeps undated entries at the end, matching
       byYearDescending() in src/data/exhibitions.js. */
    .order('year', { ascending: false, nullsFirst: false })
    .order('sort_order', { ascending: true });

  if (search) {
    const term = `%${escapeFilter(search)}%`;
    query = query.or(`title.ilike.${term},venue.ilike.${term},city.ilike.${term}`);
  }

  if (status === 'published') query = query.eq('is_published', true);
  else if (status === 'draft') query = query.eq('is_published', false);

  const from = Math.max(0, (page - 1) * perPage);
  return query.range(from, from + perPage - 1);
}

export function getExhibition(supabase, id) {
  return supabase.from('exhibitions').select(EXHIBITION_FIELDS).eq('id', id).maybeSingle();
}

export function insertExhibition(supabase, values) {
  return supabase.from('exhibitions').insert(values).select('id').single();
}

export function updateExhibition(supabase, id, values) {
  return supabase.from('exhibitions').update(values).eq('id', id).select('id').single();
}

export function deleteExhibition(supabase, id) {
  return supabase.from('exhibitions').delete().eq('id', id);
}

/* ========================================================================== */
/* CONTENT SECTIONS                                                           */
/* ========================================================================== */

export function listSections(supabase, pageKey) {
  return supabase
    .from('content_sections')
    .select(SECTION_FIELDS)
    .eq('page_key', pageKey)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
}

export function getSection(supabase, id) {
  return supabase.from('content_sections').select(SECTION_FIELDS).eq('id', id).maybeSingle();
}

export function insertSection(supabase, values) {
  return supabase.from('content_sections').insert(values).select('id').single();
}

export function updateSection(supabase, id, values) {
  return supabase.from('content_sections').update(values).eq('id', id).select('id').single();
}

export function deleteSection(supabase, id) {
  return supabase.from('content_sections').delete().eq('id', id);
}

/* ========================================================================== */
/* MEDIA                                                                      */
/* ========================================================================== */

export function listMedia(supabase, opts = {}) {
  const { bucket = '', search = '', page = 1, perPage = 24 } = opts;

  let query = supabase
    .from('media')
    .select(MEDIA_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (bucket) query = query.eq('bucket', bucket);
  if (search) query = query.ilike('path', `%${escapeFilter(search)}%`);

  const from = Math.max(0, (page - 1) * perPage);
  return query.range(from, from + perPage - 1);
}

export function getMedia(supabase, id) {
  return supabase.from('media').select(MEDIA_FIELDS).eq('id', id).maybeSingle();
}

export function insertMedia(supabase, values) {
  return supabase.from('media').insert(values).select(MEDIA_FIELDS).single();
}

export function updateMedia(supabase, id, values) {
  return supabase.from('media').update(values).eq('id', id).select('id').single();
}

export function deleteMedia(supabase, id) {
  return supabase.from('media').delete().eq('id', id);
}

/**
 * Reference counts for a set of media ids, keyed by id.
 *
 * Reads public.media_usage, the view created in the admin-access migration.
 * Returns a plain object so a template can ask `usage[id]?.total_count` without
 * a lookup helper.
 */
export async function mediaUsage(supabase, ids = []) {
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from('media_usage')
    .select('media_id, artwork_count, exhibition_count, section_count, total_count')
    .in('media_id', ids);

  if (error || !data) return {};

  return Object.fromEntries(data.map((row) => [row.media_id, row]));
}

/* ========================================================================== */
/* DASHBOARD                                                                  */
/* ========================================================================== */

/**
 * The five counts on the dashboard.
 *
 * `head: true` with `count: 'exact'` asks Postgres for the number and no rows,
 * so counting two hundred artworks transfers nothing. Each is a real query —
 * none of these numbers is derived, estimated or made up.
 */
export async function dashboardCounts(supabase) {
  const count = (table, apply = (q) => q) =>
    apply(supabase.from(table).select('id', { count: 'exact', head: true }));

  const [artworks, published, featured, exhibitions, media] = await Promise.all([
    count('artworks'),
    count('artworks', (q) => q.eq('is_published', true)),
    count('artworks', (q) => q.eq('is_featured', true)),
    count('exhibitions'),
    count('media'),
  ]);

  /* One failure is reported rather than smoothed into a zero: a dashboard that
     shows "0 artworks" when the truth is "the query was refused" is worse than
     one that says it could not read. */
  const failed = [artworks, published, featured, exhibitions, media].find((r) => r.error);

  return {
    error: failed?.error ?? null,
    counts: {
      artworks: artworks.count ?? 0,
      published: published.count ?? 0,
      featured: featured.count ?? 0,
      exhibitions: exhibitions.count ?? 0,
      media: media.count ?? 0,
    },
  };
}

/* ========================================================================== */

/**
 * Escapes a search term for PostgREST's filter grammar.
 *
 * Commas separate filters inside .or(), parentheses group them, and a bare
 * term containing either is parsed as structure instead of as text. A comma in
 * a search box would otherwise produce a 400 — or, with the wrong term, a
 * filter the user did not write. The percent and underscore are LIKE
 * wildcards and are escaped so a search for "100_x" means those characters.
 */
function escapeFilter(term) {
  return String(term)
    .replace(/[\\%_]/g, '\\$&')
    .replace(/[(),]/g, ' ')
    .trim();
}
