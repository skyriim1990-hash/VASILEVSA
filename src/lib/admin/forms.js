/**
 * ADMIN — FORM PARSING
 *
 * Turns FormData into values the database will accept, or into a list of
 * errors. Every admin form goes through here, so a rule is written once.
 *
 * ---------------------------------------------------------------------------
 * WHY THE DATABASE CONSTRAINTS ARE RESTATED IN JAVASCRIPT
 * ---------------------------------------------------------------------------
 * They are not restated as the check — the CHECK constraints in the migration
 * are the check, and they hold whether or not this file is correct. These
 * exist so a typo produces "Year must be between 1800 and 2200" next to the
 * field rather than a Postgres constraint name in a 500 page.
 *
 * Where the two could drift, the constraint name is quoted in a comment.
 */

/** A trimmed string. Missing, null and whitespace all become ''. */
export function str(form, name) {
  const raw = form.get(name);
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Checkbox: present in the payload at all means checked. */
export function bool(form, name) {
  return form.get(name) !== null;
}

/** Integer, or `fallback` when the field is blank or not a number. */
export function int(form, name, fallback = 0) {
  const raw = str(form, name);
  if (raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Integer or null — for genuinely optional numbers like `year`. */
export function intOrNull(form, name) {
  const raw = str(form, name);
  if (raw === '') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/** ISO date string or null. An empty date input submits ''. */
export function dateOrNull(form, name) {
  const raw = str(form, name);
  return raw === '' ? null : raw;
}

/** A uuid, or null. Used for the `— none —` option on a select. */
export function uuidOrNull(form, name) {
  const raw = str(form, name);
  return UUID_RE.test(raw) ? raw : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when a string is a well-formed uuid — for validating route params. */
export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Turns a title into a url-safe slug matching the database's slug CHECK
 * constraints: lowercase alphanumerics joined by single hyphens.
 *
 * Cyrillic is transliterated rather than stripped. Dropping it would turn
 * "Композиция" into an empty slug, and an artwork with a Bulgarian title would
 * silently become "artwork-<random>" instead of something readable.
 */
export function slugify(input) {
  const source = String(input ?? '').toLowerCase();

  /* U+0400–U+04FF, the Cyrillic block. Noted here because the second range
     further down is combining marks, which render as nothing in an editor. */
  const transliterated = source.replace(/[Ѐ-ӿ]/g, (ch) => CYRILLIC[ch] ?? '');

  return transliterated
    /* strips accents: é -> e, rather than é -> '' */
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
  т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht',
  ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
};

/**
 * A slug that is guaranteed non-empty.
 *
 * `slug` is NOT NULL UNIQUE with a format CHECK, so a work saved before it has
 * a title still needs one. The random tail is not decoration — two untitled
 * works saved in the same second would otherwise collide on the unique index.
 */
export function ensureSlug(preferred, prefix = 'item') {
  const base = slugify(preferred);
  if (base) return base;
  return `${prefix}-${randomToken(6)}`;
}

/** Lowercase alphanumeric token. Math.random is fine — this is not a secret. */
export function randomToken(length = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Validates a CSS aspect-ratio against `artworks_aspect_ratio_format`.
 * Accepts "3 / 4", "3/4", "1.5 / 1". Returns a normalised "3 / 4" or ''.
 */
export function normaliseRatio(input) {
  const match = String(input ?? '').trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (!match) return '';

  const [, w, h] = match;
  if (Number(w) <= 0 || Number(h) <= 0) return '';

  return `${w} / ${h}`;
}

/** Mirrors `exhibitions_url_shape`: empty, or an http(s) address. */
export function validUrl(input) {
  const raw = String(input ?? '').trim();
  if (raw === '') return true;
  return /^https?:\/\//i.test(raw);
}

/**
 * Redirects back to a form with a message, using a query string rather than a
 * session flash.
 *
 * A flash needs somewhere to live between two requests — a store, or a signed
 * cookie. This panel has neither, and adding one to carry the word "Saved"
 * across a redirect is not a trade worth making. The cost is a visible ?saved=
 * in the address bar, which the next navigation clears.
 */
export function redirectWith(context, path, params = {}) {
  const url = new URL(path, context.url);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return context.redirect(url.pathname + url.search, 303);
}

/**
 * Human text for the codes put in the URL by redirectWith.
 * Kept as codes rather than free text so nothing user-supplied is ever echoed
 * back into the page from a query parameter.
 */
export const MESSAGES = {
  saved: 'Saved.',
  created: 'Created.',
  deleted: 'Deleted.',
  'image-removed': 'Image removed.',
  'media-deleted': 'File deleted.',
  'media-saved': 'File details saved.',
  uploaded: 'Uploaded.',
  'not-found': 'That record no longer exists.',
  'delete-blocked': 'Still in use — detach it from the content that uses it first.',
  'upload-failed': 'The file could not be uploaded.',
  'save-failed': 'The change was not saved.',
  forbidden: 'You do not have permission to do that.',
};

/** Looks a code up, ignoring anything unrecognised. */
export function messageFor(code) {
  if (!code) return '';
  return Object.prototype.hasOwnProperty.call(MESSAGES, code) ? MESSAGES[code] : '';
}

/** Codes that report a failure rather than a success. */
export function isErrorCode(code) {
  return (
    code === 'not-found' ||
    code === 'delete-blocked' ||
    code === 'upload-failed' ||
    code === 'save-failed' ||
    code === 'forbidden'
  );
}
