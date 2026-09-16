/**
 * ADMIN — THE ARTWORK FORM, SERVER SIDE
 *
 * Reading the form, validating it, dealing with the image and writing the row
 * — shared by /admin/works/new and /admin/works/[id] so the two cannot drift
 * apart. A field added to the form is added once.
 */

import {
  str, bool, int, intOrNull, uuidOrNull,
  ensureSlug, normaliseRatio, slugify,
} from './forms.js';
import { attachImage, hasUpload, removeMedia } from './media.js';
import { insertArtwork, updateArtwork } from './queries.js';

/**
 * FormData -> { values, errors }.
 *
 * `values` is shaped for the artworks table. `errors` is a list of sentences
 * to print; an empty list means the payload is acceptable.
 *
 * @param {FormData} form
 * @param {object|null} existing  the row being edited, or null on create
 */
export function readArtworkForm(form, existing = null) {
  const errors = [];

  const title = str(form, 'title');
  const year = intOrNull(form, 'year');

  if (year !== null && (year < 1800 || year > 2200)) {
    /* mirrors the artworks_year_range CHECK constraint */
    errors.push('Year must be between 1800 and 2200, or left empty.');
  }

  const ratioInput = str(form, 'aspect_ratio') || '3 / 4';
  const aspect_ratio = normaliseRatio(ratioInput);

  if (!aspect_ratio) {
    errors.push(`Aspect ratio “${ratioInput}” is not a ratio. Write it as width / height, e.g. 3 / 4.`);
  }

  /* The slug is editable but not required. Left blank it is derived from the
     title, and from a random token when there is no title either — an untitled
     work still needs a stable, unique URL. An existing slug is never
     regenerated behind the editor's back: changing it would break any link
     already pointing at the public page. */
  const slugInput = str(form, 'slug');

  if (slugInput && !slugify(slugInput)) {
    /* Typed something, and none of it survived: "###" or an emoji. Refused
       rather than quietly swapped for a generated slug, because the editor
       would then not know what the URL had become. */
    errors.push('The slug needs at least one letter or number.');
  }

  const slug = slugInput
    ? ensureSlug(slugInput, 'artwork')
    : existing?.slug || ensureSlug(title, 'artwork');

  return {
    errors,
    values: {
      slug,
      title,
      year,
      year_display: str(form, 'year_display'),
      category_id: uuidOrNull(form, 'category_id'),
      medium: str(form, 'medium'),
      dimensions: str(form, 'dimensions'),
      description: str(form, 'description'),
      aspect_ratio: aspect_ratio || '3 / 4',
      is_selected: bool(form, 'is_selected'),
      is_featured: bool(form, 'is_featured'),
      is_published: bool(form, 'is_published'),
      sort_order: int(form, 'sort_order', 0),
    },
  };
}

/**
 * Applies whatever the image half of the form asked for.
 *
 * Three possible requests, in this order of precedence:
 *   a new file          -> upload, attach, drop the old one if unused
 *   "remove" ticked     -> detach, delete the file if unused
 *   neither             -> leave media_id alone, but save alt and caption
 *
 * A new file wins over the remove checkbox. Ticking both is contradictory, and
 * of the two readings "replace this image" is the one someone plausibly meant.
 *
 * @returns {{ mediaId: string|null|undefined, error: string }}
 *          `undefined` means "do not touch media_id".
 */
export async function applyImage(supabase, form, { existingMediaId = null, defaultBucket = 'artworks' } = {}) {
  const file = form.get('image');
  const alt = str(form, 'alt');
  const caption = str(form, 'caption');
  const bucket = str(form, 'bucket') || defaultBucket;

  if (hasUpload(file)) {
    const { mediaId, error } = await attachImage(supabase, {
      file,
      bucket,
      alt,
      caption,
      width: intOrNull(form, 'image_width'),
      height: intOrNull(form, 'image_height'),
      name: str(form, 'title') || str(form, 'heading'),
      previousMediaId: existingMediaId,
    });

    return { mediaId, error };
  }

  if (bool(form, 'remove_image') && existingMediaId) {
    const { ok, error, inUse } = await removeMedia(supabase, existingMediaId);

    if (!ok && inUse > 0) {
      /* Still detached from this record — that is what was asked for. The file
         survives because something else is using it, which is the correct
         outcome and not an error worth blocking the save over. */
      return { mediaId: null, error: '' };
    }

    return { mediaId: null, error: ok ? '' : error };
  }

  /* No file and no removal: the alt and caption boxes may still have been
     edited, and they belong to the media row rather than to the artwork. */
  if (existingMediaId) {
    await supabase.from('media').update({ alt, caption }).eq('id', existingMediaId);
  }

  return { mediaId: undefined, error: '' };
}

/**
 * Create.
 * @returns {{ id: string|null, errors: string[] }}
 */
export async function createArtwork(supabase, form) {
  const { values, errors } = readArtworkForm(form, null);
  if (errors.length) return { id: null, errors };

  const { mediaId, error: imageError } = await applyImage(supabase, form, {
    existingMediaId: null,
    defaultBucket: 'artworks',
  });

  if (imageError) return { id: null, errors: [imageError] };

  const { data, error } = await insertArtwork(supabase, {
    ...values,
    media_id: mediaId ?? null,
  });

  if (error) return { id: null, errors: [describeWriteError(error, 'artwork')] };

  return { id: data.id, errors: [] };
}

/**
 * Update.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export async function saveArtwork(supabase, form, existing) {
  const { values, errors } = readArtworkForm(form, existing);
  if (errors.length) return { ok: false, errors };

  const { mediaId, error: imageError } = await applyImage(supabase, form, {
    existingMediaId: existing.media_id,
    defaultBucket: 'artworks',
  });

  if (imageError) return { ok: false, errors: [imageError] };

  const payload = { ...values };
  /* undefined means the image was not part of this submission. Spreading it in
     would send `media_id: undefined`, which PostgREST drops — the same result
     by accident rather than on purpose. This makes the intent explicit. */
  if (mediaId !== undefined) payload.media_id = mediaId;

  const { error } = await updateArtwork(supabase, existing.id, payload);

  if (error) return { ok: false, errors: [describeWriteError(error, 'artwork')] };

  return { ok: true, errors: [] };
}

/**
 * Turns a Postgres error into something an editor can act on.
 *
 * Only the constraints someone can actually hit from the form are translated.
 * Everything else keeps its original message: a wrong guess about what went
 * wrong is worse than an unfamiliar sentence, because it sends the reader
 * looking in the wrong place.
 */
export function describeWriteError(error, subject = 'record') {
  const message = error?.message ?? 'Unknown error';

  if (error?.code === '23505' || /duplicate key/i.test(message)) {
    return `That slug is already used by another ${subject}. Slugs have to be unique — edit the Slug field.`;
  }

  if (error?.code === '42501' || /row-level security/i.test(message)) {
    return 'The database refused the write. This account is not on the administrator allowlist.';
  }

  if (error?.code === '23514') {
    return `The database rejected a value: ${message}`;
  }

  return message;
}
