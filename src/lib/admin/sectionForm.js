/**
 * ADMIN — EDITORIAL SECTIONS, SERVER SIDE
 *
 * The About and Art × Sport pages are both rows in content_sections, told
 * apart by page_key. This module handles both, and the routes for the two
 * pages are four lines each.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS DELIBERATELY DOES NOT DO
 * ---------------------------------------------------------------------------
 * It creates no sections, seeds no headings and writes no biography. The Art ×
 * Sport page in particular invites invented content — athlete names, events,
 * results — and none of that has been supplied. Both pages start empty and
 * stay empty until someone types into them.
 */

import { str, bool, int, slugify, ensureSlug, isUuid, redirectWith } from './forms.js';
import { insertSection, updateSection, getSection, deleteSection } from './queries.js';
import { applyImage, describeWriteError } from './artworkForm.js';
import { removeMedia } from './media.js';

/** Which bucket each editorial page's images belong in. */
export const PAGE_BUCKETS = {
  about: 'portraits',
  'art-sport': 'artsport',
};

export function readSectionForm(form, pageKey, existing = null) {
  const errors = [];

  const heading = str(form, 'heading');
  const keyInput = str(form, 'section_key');

  if (keyInput && !slugify(keyInput)) {
    errors.push('The section key needs at least one letter or number.');
  }

  /* content_sections is UNIQUE on (page_key, section_key), so an existing key
     is never regenerated — changing it would create a second row rather than
     rename the one being edited. */
  const section_key = existing
    ? existing.section_key
    : ensureSlug(keyInput || heading, 'section');

  return {
    errors,
    values: {
      page_key: pageKey,
      section_key,
      heading,
      body: str(form, 'body'),
      sort_order: int(form, 'sort_order', 0),
      is_published: bool(form, 'is_published'),
    },
  };
}

export async function createSection(supabase, form, pageKey) {
  const { values, errors } = readSectionForm(form, pageKey, null);
  if (errors.length) return { id: null, errors };

  const { mediaId, error: imageError } = await applyImage(supabase, form, {
    existingMediaId: null,
    defaultBucket: PAGE_BUCKETS[pageKey] ?? 'artworks',
  });

  if (imageError) return { id: null, errors: [imageError] };

  const { data, error } = await insertSection(supabase, {
    ...values,
    media_id: mediaId ?? null,
  });

  if (error) {
    /* The unique constraint here is on the pair, not on the key alone, so the
       generic duplicate message would point at the wrong field. */
    if (error.code === '23505') {
      return { id: null, errors: [`A section with the key “${values.section_key}” already exists on this page. Give it a different key.`] };
    }
    return { id: null, errors: [describeWriteError(error, 'section')] };
  }

  return { id: data.id, errors: [] };
}

export async function saveSection(supabase, form, existing) {
  const { values, errors } = readSectionForm(form, existing.page_key, existing);
  if (errors.length) return { ok: false, errors };

  const { mediaId, error: imageError } = await applyImage(supabase, form, {
    existingMediaId: existing.media_id,
    defaultBucket: PAGE_BUCKETS[existing.page_key] ?? 'artworks',
  });

  if (imageError) return { ok: false, errors: [imageError] };

  const payload = { ...values };
  if (mediaId !== undefined) payload.media_id = mediaId;

  const { error } = await updateSection(supabase, existing.id, payload);

  if (error) return { ok: false, errors: [describeWriteError(error, 'section')] };

  return { ok: true, errors: [] };
}

/**
 * The whole POST side of /admin/about and /admin/art-sport.
 *
 * Three actions arrive at the same URL, told apart by `_action`: create a
 * section, save one, delete one. Returning a Response means "handled, redirect
 * now"; returning a list of strings means "re-render with these errors".
 *
 * `pageKey` is taken from the route and never from the payload. A form field
 * naming its own page_key would let a POST to /admin/about write a row that
 * appears on Art × Sport.
 *
 * @returns {Promise<Response|string[]>}
 */
export async function handleSectionPost(context, pageKey) {
  const supabase = context.locals.supabase;
  const form = await context.request.formData();
  const action = str(form, '_action');
  const path = `/admin/${pageKey}`;

  if (action === 'create') {
    const { id, errors } = await createSection(supabase, form, pageKey);
    if (id) return redirectWith(context, path, { m: 'created' });
    return errors;
  }

  const id = str(form, 'id');

  if (!isUuid(id)) return redirectWith(context, path, { m: 'not-found' });

  const { data: section } = await getSection(supabase, id);

  /* Scoped to this page as well as to the id: a section id from Art × Sport
     posted to /admin/about is treated as missing rather than edited. */
  if (!section || section.page_key !== pageKey) {
    return redirectWith(context, path, { m: 'not-found' });
  }

  if (action === 'delete') {
    if (section.media_id) await removeMedia(supabase, section.media_id);

    const { error } = await deleteSection(supabase, section.id);
    if (error) return [describeWriteError(error, 'section')];

    return redirectWith(context, path, { m: 'deleted' });
  }

  const { ok, errors } = await saveSection(supabase, form, section);
  if (ok) return redirectWith(context, path, { m: 'saved' });

  return errors;
}
