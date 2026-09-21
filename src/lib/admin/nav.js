/**
 * ADMIN — NAVIGATION
 *
 * The sidebar, defined once. `match` is the path prefix that counts as "you
 * are here", which is what makes /admin/works/new highlight WORKS rather than
 * nothing.
 *
 * Deliberately not merged with ROUTES in src/i18n/utils.js. That list is the
 * public site's navigation and appears in the header of every page a visitor
 * sees; adding an admin entry to it is exactly the mistake that puts a link to
 * /admin in the footer of a live site.
 */

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', match: '/admin', exact: true },
  { label: 'Homepage', href: '/admin/homepage', match: '/admin/homepage' },
  { label: 'Works', href: '/admin/works', match: '/admin/works' },
  { label: 'Exhibitions', href: '/admin/exhibitions', match: '/admin/exhibitions' },
  { label: 'Art × Sport', href: '/admin/art-sport', match: '/admin/art-sport' },
  { label: 'About', href: '/admin/about', match: '/admin/about' },
  { label: 'Media', href: '/admin/media', match: '/admin/media' },
  { label: 'Settings', href: '/admin/settings', match: '/admin/settings' },
];

/** True when `pathname` is the item's page or a page beneath it. */
export function isCurrent(item, pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/admin';

  if (item.exact) return clean === item.match;

  return clean === item.match || clean.startsWith(`${item.match}/`);
}
