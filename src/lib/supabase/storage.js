/**
 * SUPABASE — STORAGE
 *
 * Where artwork photography will live once it is uploaded through the admin
 * panel, instead of being dropped into /public by hand.
 *
 * ---------------------------------------------------------------------------
 * HOW THIS MEETS THE EXISTING SITE
 * ---------------------------------------------------------------------------
 * Every image on the site already goes through one component, Media.astro,
 * which takes a `src` string. It does not care whether that string points at
 * /artworks/foo.jpg or at a Supabase URL. So switching the archive over to
 * Storage later is a change to what `image` holds in the data, not a change
 * to any layout or component.
 *
 * Nothing here runs yet. The buckets below still have to be created in the
 * Supabase dashboard, and no bucket is created by this file.
 */

import { SUPABASE_URL } from './env.js';

/**
 * Bucket names, in one place so a rename is one edit.
 *
 * Suggested setup in the dashboard — public read, writes restricted to
 * authenticated users by policy:
 *   artworks   the archive
 *   portraits  the artist portrait
 *   artsport   Art × Sport documentation
 */
export const BUCKETS = {
  artworks: 'artworks',
  portraits: 'portraits',
  artsport: 'artsport',
};

/**
 * Public URL for an object in a public bucket.
 *
 * Built by string rather than by calling the SDK, so a prerendered page can
 * produce the URL without opening a connection. The shape is Supabase's
 * documented public path and is stable.
 *
 * Returns '' when Supabase is unconfigured or either argument is missing —
 * and '' is exactly what Media.astro treats as "render the placeholder", so
 * a missing image degrades into the existing placeholder rather than a broken
 * <img>.
 *
 * @param {string} bucket  bucket name, e.g. BUCKETS.artworks
 * @param {string} objectPath  path inside the bucket, e.g. 'artwork-01.jpg'
 */
export function publicUrl(bucket, objectPath) {
  if (!SUPABASE_URL || !bucket || !objectPath) return '';

  const clean = String(objectPath).replace(/^\/+/, '');

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURI(clean)}`;
}

const PUBLIC_OBJECT = '/storage/v1/object/public/';
const RENDER_IMAGE = '/storage/v1/render/image/public/';

/**
 * URL of a resized copy of a public Supabase image, served by Storage's image
 * transformations. The original object is left as it is.
 *
 * `resize=contain` is required. Without it Supabase defaults to `cover`, which
 * with only a width crops the picture to that width and keeps the original
 * height instead of scaling it. `contain` keeps the aspect ratio and never
 * enlarges past the original.
 *
 * Returns '' for anything that is not a public Supabase object URL, so a caller
 * can fall back to the original `src`.
 *
 * @param {string} url  a URL made by publicUrl()
 * @param {{ width: number, quality?: number }} options
 */
export function transformUrl(url, { width, quality = 85 }) {
  const source = String(url ?? '');
  if (!source.includes(PUBLIC_OBJECT) || !width) return '';

  return `${source.replace(PUBLIC_OBJECT, RENDER_IMAGE)}?width=${width}&resize=contain&quality=${quality}`;
}

/**
 * A `srcset` value for a public Supabase image, or '' when there is none.
 *
 * @param {string} url
 * @param {number[]} widths
 * @param {number} [quality]
 */
export function imageSrcSet(url, widths, quality) {
  const entries = widths
    .map((width) => {
      const resized = transformUrl(url, { width, quality });
      return resized ? `${resized} ${width}w` : '';
    })
    .filter(Boolean);

  return entries.join(', ');
}

/**
 * Uploads a file. Browser or server, whichever client is passed in.
 *
 * The client is a parameter rather than an import so this file never decides
 * which credential is used — the caller does, and the admin panel will pass
 * the session-scoped client so uploads are attributable to a signed-in user.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket
 * @param {string} objectPath
 * @param {File|Blob|ArrayBuffer} file
 * @param {{ upsert?: boolean, contentType?: string }} [options]
 */
export async function uploadFile(supabase, bucket, objectPath, file, options = {}) {
  const { upsert = false, contentType } = options;

  return supabase.storage.from(bucket).upload(objectPath, file, {
    /* false by default so an upload cannot quietly overwrite an existing
       photograph — the admin panel should ask before replacing one. */
    upsert,
    contentType,
    cacheControl: '3600',
  });
}
