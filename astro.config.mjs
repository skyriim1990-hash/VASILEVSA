import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

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
 * Swapping hosts is a swap of this import and this one line — @astrojs/vercel,
 * @astrojs/netlify and @astrojs/cloudflare are drop-in alternatives. Node was
 * chosen because it runs anywhere, including here, which is what makes the
 * admin panel testable locally.
 */
export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'ignore',
  adapter: node({ mode: 'standalone' }),
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
