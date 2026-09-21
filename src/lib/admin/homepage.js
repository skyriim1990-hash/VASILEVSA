/**
 * ADMIN — HOMEPAGE, SERVER SIDE
 *
 * The three images of the homepage's opening collage, kept in content_sections
 * under page_key = 'home' — the same table and the same admin policies as About
 * and Art × Sport, so no new table, policy or grant was needed.
 *
 *   section_key     media_id
 *   image-large     the large frame of the collage
 *   image-small-1   the upper small frame
 *   image-small-2   the lower small frame
 *
 * The keys are fixed, and all three are written in one upsert on
 * (page_key, section_key), so saving twice updates the same rows rather than
 * adding new ones. The homepage's text is not edited here.
 *
 * ---------------------------------------------------------------------------
 * IMAGES ARE REFERENCES, NEVER UPLOADS
 * ---------------------------------------------------------------------------
 * Every image is picked from the media library. Choosing another one, or none,
 * changes which row the section points at and nothing else: no file is
 * uploaded, and — unlike the section editors, which own their images — no file
 * is ever deleted from here, because the file belongs to the library and may
 * be an artwork's photograph as well.
 *
 * Because the reference is a real media_id, public.media_usage counts it, so a
 * file chosen here stops showing "Not used" in the library, and the media
 * policy from 20260914000000 makes it readable to the public site only while a
 * published row points at it.
 */

import { str, isUuid, redirectWith } from './forms.js';
import { getMedia } from './queries.js';
import { describeWriteError } from './artworkForm.js';

export const HOME_PAGE_KEY = 'home';

/** The three frames of the opening collage, in the order they appear. */
export const IMAGE_SLOTS = [
  {
    key: 'image-large',
    field: 'image_large',
    label: 'Large hero image',
    ratio: '3 / 2',
    hint: 'A wide landscape photograph. On desktop it fills the hero behind the title, fading into the page on the left; on a phone it is the lead image under the title. It is cropped to fill the space, so keep the subject away from the edges.',
  },
  {
    key: 'image-small-1',
    field: 'image_small_1',
    label: 'Small hero image 1',
    ratio: '4 / 3',
    hint: 'The upper frame on the right, shown at 4 : 3.',
  },
  {
    key: 'image-small-2',
    field: 'image_small_2',
    label: 'Small hero image 2',
    ratio: '1 / 1',
    hint: 'The lower frame on the right, shown square.',
  },
];

const MEDIA_FIELDS = 'id, bucket, path, alt, caption, mime_type, width, height, byte_size, is_published';

/**
 * The saved rows, keyed by section_key. A slot with no row simply has none —
 * the picker shows it as empty and the public page keeps its default frame.
 */
export async function loadHomepage(supabase) {
  const { data, error } = await supabase
    .from('content_sections')
    .select(`id, section_key, media_id, updated_at, media:media_id ( ${MEDIA_FIELDS} )`)
    .eq('page_key', HOME_PAGE_KEY)
    .in('section_key', IMAGE_SLOTS.map((slot) => slot.key));

  const rows = Object.fromEntries((data ?? []).map((row) => [row.section_key, row]));
  return { rows, error };
}

/**
 * The POST side of /admin/homepage.
 *
 * @returns {Promise<Response|string[]>} a redirect when saved, or the errors to show
 */
export async function saveHomepage(context) {
  const supabase = context.locals.supabase;
  const form = await context.request.formData();
  const errors = [];

  /* Each picker posts a media id, or '' for "no image". An id is accepted only
     if it is a real row the signed-in administrator can read — a hand-edited
     form cannot point the homepage at a row that does not exist. */
  const images = {};
  for (const slot of IMAGE_SLOTS) {
    const value = str(form, slot.field);

    if (!value) {
      images[slot.key] = null;
      continue;
    }

    if (!isUuid(value)) {
      errors.push(`${slot.label}: that is not a media id.`);
      continue;
    }

    const { data: media } = await getMedia(supabase, value);
    if (!media) {
      errors.push(`${slot.label}: the chosen file is no longer in the media library.`);
      continue;
    }

    images[slot.key] = media.id;
  }

  if (errors.length) return errors;

  /* Published on save: these rows exist only to be shown. A slot on "No image"
     is stored with no media, and the public page reads that as "keep the
     default frame" — so saving can never blank the collage. */
  const rows = IMAGE_SLOTS.map((slot, i) => ({
    page_key: HOME_PAGE_KEY,
    section_key: slot.key,
    heading: '',
    body: '',
    media_id: images[slot.key],
    sort_order: i,
    is_published: true,
  }));

  const { error } = await supabase
    .from('content_sections')
    .upsert(rows, { onConflict: 'page_key,section_key' });

  if (error) return [describeWriteError(error, 'homepage section')];

  return redirectWith(context, '/admin/homepage', { m: 'saved' });
}
