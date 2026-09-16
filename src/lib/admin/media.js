/**
 * ADMIN — IMAGE HANDLING
 *
 * The file goes to Supabase Storage; a row describing it goes to public.media;
 * the content record points at that row. This file is the only place that
 * sequence is written, so attaching an image to an artwork, an exhibition and
 * an About section is the same three steps every time.
 *
 * ---------------------------------------------------------------------------
 * WHY THE UPLOAD RUNS ON THE SERVER
 * ---------------------------------------------------------------------------
 * The browser could upload straight to Storage with the session client — the
 * policies would still hold. It does not, for two reasons.
 *
 * First, the forms work without JavaScript. A plain multipart POST is handled
 * by the route whether or not a script ran.
 *
 * Second, a direct upload succeeds or fails on its own, before the database
 * knows anything. A failure between the two halves leaves a file in the bucket
 * that no row mentions. Doing both here means one place can clean up after
 * itself, which is what attachImage below does.
 *
 * The cost is that the file passes through the Astro server instead of going
 * straight to Supabase. For single photographs uploaded by one person that is
 * not a cost worth engineering around.
 */

import { BUCKETS, publicUrl } from '../supabase/storage.js';
import { insertMedia, deleteMedia, getMedia, mediaUsage } from './queries.js';
import { randomToken, slugify } from './forms.js';

/** Formats Storage will accept here. Anything else is refused before upload. */
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

/** 20 MB. A scan of a large canvas fits; an accidental video does not. */
export const MAX_BYTES = 20 * 1024 * 1024;

export { BUCKETS, publicUrl };

/** True when the form actually carried a file, rather than an empty file input. */
export function hasUpload(value) {
  return value && typeof value === 'object' && 'size' in value && value.size > 0;
}

/**
 * A storage path that cannot collide and cannot escape its folder.
 *
 * Shape: 2026/03/untitled-composition-a7f3k2.jpg
 *
 * The date folders keep a bucket browsable after a few hundred files. The
 * random token is what makes the path unique — two files with the same name
 * uploaded on the same day must not overwrite each other, and `upsert` is left
 * off so an accidental collision would fail loudly rather than destroy the
 * earlier photograph.
 *
 * The name is slugified, never taken from the client. A filename is attacker-
 * controlled input; "../../secret.jpg" is a valid thing for a browser to send.
 */
export function buildObjectPath(file, preferredName = '') {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  const base = slugify(preferredName) || slugify(stripExtension(file?.name ?? '')) || 'image';
  const ext = EXTENSIONS[file?.type] ?? 'jpg';

  return `${year}/${month}/${base.slice(0, 60)}-${randomToken(6)}.${ext}`;
}

function stripExtension(name) {
  return String(name).replace(/\.[^.]+$/, '');
}

/**
 * Checks a file before anything is sent anywhere.
 * @returns {string} an error message, or '' when the file is acceptable
 */
export function validateImage(file) {
  if (!hasUpload(file)) return 'No file was received.';

  if (!ALLOWED_TYPES.has(file.type)) {
    return `Unsupported format: ${file.type || 'unknown'}. Use JPEG, PNG, WebP, AVIF or GIF.`;
  }

  if (file.size > MAX_BYTES) {
    return `File is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_BYTES)}.`;
  }

  return '';
}

/**
 * Uploads a file and records it in public.media.
 *
 * `width` and `height` are measured in the browser and arrive as hidden form
 * fields — the server has no image decoder and adding one for two numbers is
 * not worth a native dependency. They stay null when JavaScript is off, which
 * costs nothing the database cares about.
 *
 * @returns {{ media: object|null, error: string }}
 */
export async function uploadImage(supabase, { file, bucket, alt = '', caption = '', width = null, height = null, name = '' }) {
  const problem = validateImage(file);
  if (problem) return { media: null, error: problem };

  const targetBucket = BUCKETS[bucket] ?? BUCKETS.artworks;
  const objectPath = buildObjectPath(file, name);

  const { error: uploadError } = await supabase.storage
    .from(targetBucket)
    .upload(objectPath, file, {
      /* deliberately not upsert: buildObjectPath already guarantees a fresh
         path, so a collision here means something is wrong and should say so */
      upsert: false,
      contentType: file.type,
      cacheControl: '3600',
    });

  if (uploadError) {
    return { media: null, error: describeStorageError(uploadError) };
  }

  const { data: media, error: rowError } = await insertMedia(supabase, {
    bucket: targetBucket,
    path: objectPath,
    alt,
    caption,
    mime_type: file.type,
    width,
    height,
    byte_size: file.size,
    /* Not "this image is public". Since the media-follows-content migration a
       media row is visible to a visitor only while something published points
       at it; this flag is ANDed with that, so it means "not withdrawn by
       hand". True is the right default — an image uploaded to a draft stays
       out of sight because the draft does, not because of this column. */
    is_published: true,
  });

  if (rowError) {
    /* The bytes are up but nothing references them. Remove the file rather
       than leave a stranger in the bucket; if this cleanup also fails there is
       nothing useful left to try, and the upload error is the one worth
       reporting. */
    await supabase.storage.from(targetBucket).remove([objectPath]).catch(() => {});
    return { media: null, error: `The file uploaded but could not be recorded: ${rowError.message}` };
  }

  return { media, error: '' };
}

/**
 * Deletes a media row and its file, unless something still points at it.
 *
 * @param {boolean} force  skip the in-use check — for the media library, where
 *                         the interface has already shown what will break
 * @returns {{ ok: boolean, error: string, inUse: number }}
 */
export async function removeMedia(supabase, mediaId, { force = false } = {}) {
  const { data: media, error: readError } = await getMedia(supabase, mediaId);

  if (readError) return { ok: false, error: readError.message, inUse: 0 };
  if (!media) return { ok: false, error: 'That file is no longer in the library.', inUse: 0 };

  if (!force) {
    const usage = await mediaUsage(supabase, [mediaId]);
    const total = usage[mediaId]?.total_count ?? 0;
    if (total > 0) return { ok: false, error: '', inUse: total };
  }

  /* Row first. The foreign keys are ON DELETE SET NULL, so deleting it detaches
     the image from whatever used it and leaves the content record intact.
     Doing the row first also means a storage failure leaves an unreferenced
     file — untidy — rather than a row pointing at bytes that no longer exist,
     which renders as a broken image on the public site. */
  const { error: rowError } = await deleteMedia(supabase, mediaId);
  if (rowError) return { ok: false, error: rowError.message, inUse: 0 };

  const { error: storageError } = await supabase.storage.from(media.bucket).remove([media.path]);

  if (storageError) {
    return {
      ok: true,
      error: `Removed from the library, but the file itself could not be deleted: ${storageError.message}`,
      inUse: 0,
    };
  }

  return { ok: true, error: '', inUse: 0 };
}

/**
 * Attaches a newly uploaded image to a record, replacing whatever was there.
 *
 * The old image is deleted only when nothing else uses it. Two artworks
 * sharing one photograph is unusual but legal, and replacing the image on one
 * of them must not blank the other.
 *
 * @returns {{ mediaId: string|null, error: string }}
 */
export async function attachImage(supabase, { file, bucket, alt, caption, width, height, name, previousMediaId }) {
  const { media, error } = await uploadImage(supabase, { file, bucket, alt, caption, width, height, name });
  if (error) return { mediaId: null, error };

  if (previousMediaId && previousMediaId !== media.id) {
    /* Not forced, and a failure here is swallowed on purpose: the new image is
       already attached and correct. An orphaned old file is a housekeeping
       matter for the media library, not a reason to fail the save the editor
       just made. */
    await removeMedia(supabase, previousMediaId).catch(() => {});
  }

  return { mediaId: media.id, error: '' };
}

/** Human file size. Used in the media library and in the size-limit message. */
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Storage errors arrive as a message and sometimes a status. The two worth
 * translating are the ones an editor can act on; everything else is passed
 * through rather than replaced with a vaguer sentence.
 */
function describeStorageError(error) {
  const message = error?.message ?? 'Unknown error';

  if (/bucket not found/i.test(message)) {
    return 'That storage bucket does not exist yet. Run the admin-access migration, or create it in the Supabase dashboard.';
  }

  if (/row-level security|not authorized|403/i.test(message)) {
    return 'Storage refused the upload. The signed-in account is not on the admin allowlist.';
  }

  return message;
}
