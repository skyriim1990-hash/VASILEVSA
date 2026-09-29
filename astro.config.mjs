import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

/**
 * IMPORTANT — before going live, replace `site` with the real domain.
 * It drives the canonical links, the hreflang pairs and the sitemap.
 * The same value appears once more in public/robots.txt.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS AN ADAPTER ON A STATIC SITE
 * ---------------------------------------------------------------------------
 * `output` stays 'static', so every public page is still prerendered to plain
 * HTML at build time exactly as before. The adapter exists for /admin, which
 * cannot be prerendered: a session lives in a cookie, and a cookie needs a
 * request.
 *
 * The admin routes opt out one by one with `export const prerender = false`.
 * Nothing else in src/pages carries that line, so nothing else changed shape.
 *
 * On Vercel the two halves land in different places: the prerendered pages are
 * served as static files from the CDN, and each `prerender = false` route
 * becomes a serverless function. Nothing in the admin panel keeps state on the
 * server between requests — the session is a cookie, read by @supabase/ssr on
 * every request — so there is nothing for a function that starts cold to have
 * lost.
 *
 * Swapping hosts is a swap of this import and this one line; @astrojs/node,
 * @astrojs/netlify and @astrojs/cloudflare are drop-in alternatives. Note that
 * `astro preview` does not work under this adapter — `astro dev` is unaffected,
 * because dev never loads an adapter at all.
 */
export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'ignore',
  adapter: vercel(),
  /* The two routes the previous concept owned. Nothing external links to them,
     but a redirect costs a line and means a shared URL still lands somewhere
     that exists rather than on a 404. */
  redirects: {
    '/art-sport': '/periods',
    '/exhibitions': '/periods',
  },
  integrations: [
    /* The admin pages are server-rendered, so the sitemap integration never
       sees them and would not list them anyway. The filter is here as a
       standing guarantee rather than a fix — if an admin route is ever
       prerendered by accident, it still stays out of the sitemap. */
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/admin'),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
