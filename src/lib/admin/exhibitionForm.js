/**
 * ADMIN — THE EXHIBITION FORM, SERVER SIDE
 *
 * The same shape as artworkForm.js, for the exhibitions table. Kept as two
 * files rather than one generic one: the two records share three field names
 * and nothing else, and a generic version would be a schema description in
 * JavaScript sitting next to the schema it describes.
 */

import { str, bool, int, intOrNull, dateOrNull, ensureSlug, slugify, validUrl } from './forms.js';
import { insertExhibition, updateExhibition } from './queries.js';
import { applyImage } from './artworkForm.js';
import { describeWriteError } from './artworkForm.js';

/** Matches the exhibitions_type_allowed CHECK constraint exactly. */
export const EXHIBITION_TYPES = [
  { value: '', label: '— Not specified —' },
  { value: 'solo', label: 'Solo' },
  { value: 'group', label: 'Group' },
];

export function readExhibitionForm(form, existing = null) {
  const errors = [];

  const title = str(form, 'title');
  const year = intOrNull(form, 'year');
  const start_date = dateOrNull(form, 'start_date');
  const end_date = dateOrNull(form, 'end_date');
  const url = str(form, 'url');
  const exhibition_type = str(form, 'exhibition_type');

  if (year !== null && (year < 1800 || year > 2200)) {
    errors.push('Year must be between 1800 and 2200, or left empty.');
  }

  /* exhibitions_dates_ordered */
  if (start_date && end_date && end_date < start_date) {
    errors.push('The closing date is before the opening date.');
  }

  /* exhibitions_url_shape */
  if (!validUrl(url)) {
    errors.push('The link must start with http:// or https://, or be left empty.');
  }

  /* exhibitions_type_allowed */
  if (!EXHIBITION_TYPES.some((t) => t.value === exhibition_type)) {
    errors.push('Choose Solo, Group, or leave the type unspecified.');
  }

  const slugInput = str(form, 'slug');

  if (slugInput && !slugify(slugInput)) {
    errors.push('The slug needs at least one letter or number.');
  }

  /* An exhibition is often identified by where it was rather than by a title,
     so the slug falls back through title, then venue, then a generated one. */
  const slug = slugInput
    ? ensureSlug(slugInput, 'exhibition')
    : existing?.slug || ensureSlug(title || str(form, 'venue'), 'exhibition');

  return {
    errors,
    values: {
      slug,
      title,
      venue: str(form, 'venue'),
      city: str(form, 'city'),
      country: str(form, 'country'),
      year,
      start_date,
      end_date,
      exhibition_type,
      description: str(form, 'description'),
      url,
      is_published: bool(form, 'is_published'),
      sort_order: int(form, 'sort_order', 0),
    },
  };
}

export async function createExhibition(supabase, form) {
  const { values, errors } = readExhibitionForm(form, null);
  if (errors.length) return { id: null, errors };

  /* Exhibition documentation shares the artworks bucket. A fourth bucket for a
     handful of installation shots would be three more storage policies to keep
     in step for no gain — the media library filters by bucket, and the record
     that owns each file is what actually distinguishes them. */
  const { mediaId, error: imageError } = await applyImage(supabase, form, {
    existingMediaId: null,
    defaultBucket: 'artworks',
  });

  if (imageError) return { id: null, errors: [imageError] };

  const { data, error } = await insertExhibition(supabase, {
    ...values,
    media_id: mediaId ?? null,
  });

  if (error) return { id: null, errors: [describeWriteError(error, 'exhibition')] };

  return { id: data.id, errors: [] };
}

export async function saveExhibition(supabase, form, existing) {
  const { values, errors } = readExhibitionForm(form, existing);
  if (errors.length) return { ok: false, errors };

  const { mediaId, error: imageError } = await applyImage(supabase, form, {
    existingMediaId: existing.media_id,
    defaultBucket: 'artworks',
  });

  if (imageError) return { ok: false, errors: [imageError] };

  const payload = { ...values };
  if (mediaId !== undefined) payload.media_id = mediaId;

  const { error } = await updateExhibition(supabase, existing.id, payload);

  if (error) return { ok: false, errors: [describeWriteError(error, 'exhibition')] };

  return { ok: true, errors: [] };
}
