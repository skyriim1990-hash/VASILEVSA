/**
 * SUPABASE ENVIRONMENT
 *
 * Every Supabase credential the project reads is read here and nowhere else.
 * One file to look at when something is not connecting, and one file to
 * change if the variable names ever move.
 *
 * ---------------------------------------------------------------------------
 * THE TWO CLASSES OF KEY
 * ---------------------------------------------------------------------------
 * PUBLIC_SUPABASE_URL        safe in the browser
 * PUBLIC_SUPABASE_ANON_KEY   safe in the browser — it carries no privileges of
 *                            its own and is governed entirely by Row Level
 *                            Security. It is meant to ship to the client.
 *
 * SUPABASE_SERVICE_ROLE_KEY  NEVER safe in the browser. It bypasses RLS
 *                            completely. It has no PUBLIC_ prefix precisely so
 *                            that Astro refuses to inline it into a client
 *                            bundle, and `admin.js` refuses to run outside the
 *                            server on top of that.
 *
 * The PUBLIC_ prefix is not decoration — it is the switch Astro uses to decide
 * what may cross into browser code. Do not add it to the service-role key.
 *
 * ---------------------------------------------------------------------------
 * WHY THE ACCESS BELOW IS WRITTEN OUT LONGHAND
 * ---------------------------------------------------------------------------
 * Vite replaces `import.meta.env.SOME_NAME` at build time by matching that
 * exact expression in the source. A dynamic lookup like `import.meta.env[key]`
 * is not matched, so it silently yields undefined in a browser bundle. Hence
 * one spelled-out constant per variable rather than a tidy loop.
 */

/** Project URL, e.g. https://xxxxxxxxxxxx.supabase.co */
export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? '';

/** Anon / publishable key. Public by design, constrained by RLS. */
export const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * The origin this deployment is reached at, e.g. http://localhost:4321.
 *
 * Optional. Only the password-recovery email needs it, to tell Supabase where
 * to send the link back to; everything else derives the origin from the
 * request. Set it when a proxy sits in front of the app, because then the
 * request's own idea of its host is whatever the proxy forwarded.
 *
 * Not the same as `site` in astro.config.mjs — that one is the production
 * domain baked into canonical tags at build time, which is exactly the wrong
 * answer while developing on localhost.
 */
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? '';

/**
 * True once both public values are present.
 *
 * Callers use this to stay quiet when Supabase is not wired up yet: the site
 * is a static brochure today and must keep building and rendering with an
 * empty .env. Nothing here throws on import.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Reads the service-role key on the server.
 *
 * `import.meta.env` covers a value present at build time; `process.env` covers
 * one injected at runtime by a host or container once an SSR adapter exists.
 * Returns an empty string when unset — the caller decides whether that is
 * fatal, because it legitimately is not during a static build.
 */
export function readServiceRoleKey() {
  const inlined = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (inlined) return String(inlined);

  if (typeof process !== 'undefined' && process.env && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return String(process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return '';
}

/**
 * Throws with an instruction rather than a stack trace about undefined.
 * Call it from code that genuinely cannot proceed without a connection.
 */
export function assertSupabaseConfigured() {
  if (isSupabaseConfigured) return;

  throw new Error(
    'Supabase is not configured. Copy .env.example to .env and fill in ' +
      'PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY from the Supabase ' +
      'dashboard (Project Settings → API), then restart the dev server.'
  );
}
