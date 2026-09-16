import { CATEGORIES } from '../data/content.js';

/**
 * Presentation helpers.
 *
 * The rule these enforce: nothing is ever invented on screen. A missing
 * title becomes a marked placeholder label, a missing datum becomes an
 * em dash. Real values pass straight through.
 */

/** Title to print for an artwork — never a fabricated one. */
export function displayTitle(artwork, t, index) {
  return artwork.title || `${t('ph.artwork')} ${index}`;
}

/** Alt text — falls back to the placeholder label, so it is never empty. */
export function displayAlt(artwork, t, index) {
  if (artwork.alt) return artwork.alt;
  if (artwork.title) {
    return [artwork.title, artwork.year, artwork.medium].filter(Boolean).join(', ');
  }
  return `${t('ph.artwork')} ${index}`;
}

/** A datum, or an em dash when it has not been supplied. */
export function value(v) {
  return v ? v : '—';
}

/** Human label for a category id. */
export function categoryLabel(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.label : '—';
}

/** Cycles 1–4 so a run of placeholders gets varied paper tones. */
export function tone(i) {
  return (i % 4) + 1;
}
