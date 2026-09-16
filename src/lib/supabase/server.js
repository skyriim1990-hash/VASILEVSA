/**
 * SUPABASE — SERVER CLIENT
 *
 * For code that runs on the server during a request: reading the signed-in
 * user before a page renders, guarding an admin route, handling a form POST.
 *
 * Carries the anon key and acts strictly as the signed-in user. Row Level
 * Security still applies. This is not the escape hatch — that is `admin.js`.
 *
 * ---------------------------------------------------------------------------
 * REQUIRES AN SSR ADAPTER — NOT YET INSTALLED
 * ---------------------------------------------------------------------------
 * The site currently builds fully static (`output: 'static'`, no adapter), so
 * there is no request to read cookies from and nothing here executes. Writing
 * a cookie during a static build is a no-op.
 *
 * To bring it to life, when the admin panel is built:
 *   1. install an adapter for the chosen host
 *        @astrojs/node | @astrojs/vercel | @astrojs/netlify | @astrojs/cloudflare
 *   2. add it to astro.config.mjs
 *   3. put `export const prerender = false` on the routes that need a session
 *
 * The public pages stay prerendered and unchanged either way. Only the routes
 * that opt out become server-rendered.
 */

import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY, assertSupabaseConfigured } from './env.js';

/**
 * Builds a request-scoped Supabase client.
 *
 * One per request, never cached across requests — a cached client would hand
 * one visitor's session to the next.
 *
 * @param context  The Astro context: `Astro` in a page, or the `context`
 *                 argument in an endpoint or middleware. Needs `.request`
 *                 and `.cookies`.
 */
export function createSupabaseServerClient(context) {
  assertSupabaseConfigured();

  const { request, cookies } = context;

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        /* Astro exposes cookies one lookup at a time; @supabase/ssr wants the
           whole set, so it comes off the raw header. A cookie with no value is
           dropped rather than passed through as undefined, which the auth
           client would treat as a malformed session. */
        const header = request.headers.get('cookie') ?? '';

        return parseCookieHeader(header)
          .filter((cookie) => typeof cookie.value === 'string')
          .map(({ name, value }) => ({ name, value }));
      },

      setAll(cookiesToSet) {
        /* Called when the library rotates a token. In a static build there is
           no response to attach these to and Astro ignores the write, which is
           why this must not be relied on until an adapter is in place. */
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, options);
        }
      },
    },
  });
}

/**
 * The signed-in user for this request, or null.
 *
 * Uses `getUser()`, not `getSession()`. `getSession()` trusts whatever the
 * cookie claims; `getUser()` verifies it against the Supabase auth server.
 * For anything that gates access, only the verified answer is worth having.
 *
 * @returns {Promise<import('@supabase/supabase-js').User | null>}
 */
export async function getSessionUser(context) {
  const supabase = createSupabaseServerClient(context);
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;

  return data.user ?? null;
}
