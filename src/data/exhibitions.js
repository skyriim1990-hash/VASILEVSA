/**
 * EXHIBITION DATA
 *
 * The Exhibitions page is a data-driven editorial timeline. Entries are
 * grouped by `year` automatically and sorted newest first.
 *
 * NOTE: no real exhibition history has been supplied yet, so every entry
 * below is an explicit placeholder. Nothing here is a claim about the
 * artist's record. Replace the placeholder strings with real data and the
 * timeline renders itself — no layout work required.
 *
 * FIELDS
 * year      string   e.g. "2015". Empty string = unknown, grouped last.
 * title     string   exhibition title
 * venue     string   gallery / museum / institution
 * city      string   city
 * country   string   country
 * type      string   "solo" | "group" | ""   (shown as a small label)
 * url       string   optional external link
 */

export const exhibitions = [
  { year: '', title: '', venue: '', city: '', country: '', type: 'solo', url: '' },
  { year: '', title: '', venue: '', city: '', country: '', type: 'group', url: '' },
  { year: '', title: '', venue: '', city: '', country: '', type: 'solo', url: '' },
  { year: '', title: '', venue: '', city: '', country: '', type: 'group', url: '' },
  { year: '', title: '', venue: '', city: '', country: '', type: '', url: '' },
  { year: '', title: '', venue: '', city: '', country: '', type: 'solo', url: '' },
  { year: '', title: '', venue: '', city: '', country: '', type: 'group', url: '' },
  { year: '', title: '', venue: '', city: '', country: '', type: '', url: '' },
];

/** True once at least one entry carries a real year — used to hide the notice. */
export const hasRealExhibitionData = exhibitions.some((e) => e.year !== '');

/**
 * Sorts entries newest first. Entries without a year keep their source order
 * and fall to the end, so the placeholder list renders as written.
 *
 * Call this from ExhibitionsView once real years are in the data.
 */
export function byYearDescending(list = exhibitions) {
  return [...list].sort((a, b) => (b.year || '').localeCompare(a.year || ''));
}
