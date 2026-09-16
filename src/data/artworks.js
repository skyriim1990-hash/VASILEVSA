/**
 * ARTWORK DATA
 *
 * Single source of truth for every artwork shown on the site.
 * The grids, the filters, the detail pages and the prev/next navigation
 * are all generated from this array — nothing is hardcoded in a component.
 *
 * ---------------------------------------------------------------------------
 * HOW TO ADD A REAL ARTWORK
 * ---------------------------------------------------------------------------
 * 1. Drop the photograph in  /public/artworks/  (e.g. untitled-2019.jpg)
 * 2. Fill in `image` with the path:  "/artworks/untitled-2019.jpg"
 * 3. Fill in title / year / medium / dimensions / description.
 * 4. Leave `ratio` set to the true aspect ratio of the photograph so the
 *    layout reserves the correct space and nothing shifts while loading.
 *
 * As long as `image` is empty the site renders a clearly labelled
 * placeholder in exactly the same box. Adding real photography therefore
 * requires NO redesign and NO layout change.
 *
 * ---------------------------------------------------------------------------
 * FIELDS
 * ---------------------------------------------------------------------------
 * id          string   URL slug, must stay unique and stable
 * title       string   real title, or "" while unknown
 * year        string   real year, or "" while unknown
 * category    string   one of the CATEGORY ids below (used by the filters)
 * medium      string   e.g. "Oil on canvas", or "" while unknown
 * dimensions  string   e.g. "180 × 140 cm", or "" while unknown
 * image       string   path to the photograph, or "" for a placeholder
 * alt         string   alt text; auto-derived from the title when empty
 * description string   short curatorial note, or "" while unknown
 * ratio       string   CSS aspect-ratio, e.g. "3 / 4"
 * selected    boolean  true = part of SELECTED WORKS + homepage shortlist
 * feature     boolean  true = allowed to occupy a large slot in the grid
 */

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'paintings', label: 'Paintings' },
  { id: 'action-painting', label: 'Action Painting' },
  { id: 'figurative', label: 'Figurative' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'selected', label: 'Selected Works' },
];

export const artworks = [
  {
    id: 'artwork-01',
    title: '',
    year: '',
    category: 'abstract',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '3 / 4',
    selected: true,
    feature: true,
  },
  {
    id: 'artwork-02',
    title: '',
    year: '',
    category: 'action-painting',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '4 / 3',
    selected: true,
    feature: false,
  },
  {
    id: 'artwork-03',
    title: '',
    year: '',
    category: 'figurative',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '1 / 1',
    selected: true,
    feature: false,
  },
  {
    id: 'artwork-04',
    title: '',
    year: '',
    category: 'paintings',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '4 / 5',
    selected: true,
    feature: false,
  },
  {
    id: 'artwork-05',
    title: '',
    year: '',
    category: 'abstract',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '3 / 2',
    selected: false,
    feature: true,
  },
  {
    id: 'artwork-06',
    title: '',
    year: '',
    category: 'action-painting',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '2 / 3',
    selected: false,
    feature: false,
  },
  {
    id: 'artwork-07',
    title: '',
    year: '',
    category: 'figurative',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '1 / 1',
    selected: true,
    feature: false,
  },
  {
    id: 'artwork-08',
    title: '',
    year: '',
    category: 'paintings',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '4 / 3',
    selected: false,
    feature: false,
  },
  {
    id: 'artwork-09',
    title: '',
    year: '',
    category: 'abstract',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '3 / 4',
    selected: false,
    feature: false,
  },
  {
    id: 'artwork-10',
    title: '',
    year: '',
    category: 'action-painting',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '5 / 4',
    selected: true,
    feature: true,
  },
  {
    id: 'artwork-11',
    title: '',
    year: '',
    category: 'figurative',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '2 / 3',
    selected: false,
    feature: false,
  },
  {
    id: 'artwork-12',
    title: '',
    year: '',
    category: 'paintings',
    medium: '',
    dimensions: '',
    image: '',
    alt: '',
    description: '',
    ratio: '1 / 1',
    selected: false,
    feature: false,
  },
];

/** Sequential display number, e.g. "04" — also used on the placeholders. */
export function artworkIndex(id) {
  const i = artworks.findIndex((a) => a.id === id);
  return String(i + 1).padStart(2, '0');
}

/** `selected: true` items, in data order — used on the homepage. */
export const selectedArtworks = artworks.filter((a) => a.selected);

/** Neighbours for the prev / next control on a detail page. Wraps around. */
export function neighbours(id) {
  const i = artworks.findIndex((a) => a.id === id);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: artworks[(i - 1 + artworks.length) % artworks.length],
    next: artworks[(i + 1) % artworks.length],
  };
}
