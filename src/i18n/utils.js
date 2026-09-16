import { ui, DEFAULT_LANG } from './ui.js';

export { DEFAULT_LANG };

/**
 * Returns a translator bound to `lang`.
 * Falls back to English if a key is missing from a translation, and to the
 * key itself if it is missing everywhere — so a typo is visible, never blank.
 */
export function useTranslations(lang) {
  const dict = ui[lang] ?? ui[DEFAULT_LANG];
  return function t(key) {
    return dict[key] ?? ui[DEFAULT_LANG][key] ?? key;
  };
}

/** Reads the active language out of a URL. `/bg/works` -> "bg". */
export function getLangFromUrl(url) {
  const [, first] = url.pathname.split('/');
  return first in ui ? first : DEFAULT_LANG;
}

/**
 * Prefixes an internal path with the language segment.
 * English is the default locale and stays unprefixed.
 *   path('/works', 'en') -> '/works'
 *   path('/works', 'bg') -> '/bg/works'
 */
export function path(to, lang = DEFAULT_LANG) {
  const clean = to === '/' ? '' : to.replace(/\/+$/, '');
  return lang === DEFAULT_LANG ? clean || '/' : `/${lang}${clean}`;
}

/** The route map, so nav and footer never disagree about a URL. */
export const ROUTES = [
  { key: 'nav.works', to: '/works' },
  { key: 'nav.artsport', to: '/art-sport' },
  { key: 'nav.exhibitions', to: '/exhibitions' },
  { key: 'nav.about', to: '/about' },
  { key: 'nav.contact', to: '/contact' },
];

/** True when `href` is the current page (or an ancestor section of it). */
export function isActive(pathname, href) {
  if (href === '/' || /^\/[a-z]{2}$/.test(href)) return pathname.replace(/\/$/, '') === href.replace(/\/$/, '');
  return pathname.startsWith(href);
}
