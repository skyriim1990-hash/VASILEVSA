/**
 * MIDDLEWARE — the /admin gate
 *
 * Runs before every request. Its entire job is to make sure no admin route can
 * forget to check for a session: a new page under /admin/ is guarded the moment
 * the file exists, without a line of its own.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS AND IS NOT
 * ---------------------------------------------------------------------------
 * This is a redirect, not a security boundary. It sends the signed-out visitor
 * somewhere sensible. The boundary is Row Level Security in Postgres, which
 * refuses the query regardless of whether this file ran, was skipped, or was
 * deleted. A guard that is the only thing standing between a request and the
 * data is a guard one routing mistake away from being wrong.
 *
 * The resolved identity is placed on `locals` so pages do not each re-verify
 * the same token. `locals` is per-request and never shared between requests.
 *
 * Public pages return before any of this: they are prerendered, and the cost
 * of the check should not appear anywhere near them.
 */

import { defineMiddleware } from 'astro:middleware';
import { resolveAdmin } from './lib/admin/auth.js';
import { isSupabaseConfigured } from './lib/supabase/env.js';

/**
 * Reachable without a session, or without being on the allowlist.
 * Everything else under /admin/ is not.
 *
 * The three recovery paths have to be here for the obvious reason: they exist
 * for someone who cannot sign in, so a gate that requires signing in would
 * make them unreachable exactly when they are needed. None of them reads or
 * writes site content — see the note at the top of reset-password.astro.
 */
const OPEN_ADMIN_PATHS = new Set([
  '/admin/login',
  '/admin/logout',
  '/admin/no-access',
  '/admin/forgot-password',
  '/admin/auth/callback',
  '/admin/reset-password',
]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith('/admin')) return next();

  /* Without credentials there is nothing to verify against. Let the login page
     render and say so itself — throwing here would produce a 500 with no
     explanation of what is missing. */
  if (!isSupabaseConfigured) {
    context.locals.supabaseMissing = true;
    return next();
  }

  const normalised = pathname.replace(/\/+$/, '') || '/admin';
  const { supabase, user, isAdmin } = await resolveAdmin(context);

  context.locals.supabase = supabase;
  context.locals.user = user;
  context.locals.isAdmin = isAdmin;

  if (OPEN_ADMIN_PATHS.has(normalised)) return next();

  if (!user) {
    /* Carry the intended destination so the login redirect lands where the
       visitor was actually going. Read back through a strict allowlist in
       login.astro — an unvalidated `next` parameter is an open redirect. */
    const to = new URL('/admin/login', context.url);
    if (normalised !== '/admin') to.searchParams.set('next', normalised);
    return context.redirect(to.pathname + to.search, 302);
  }

  /* Signed in, but not on the allowlist in public.admin_users. Every query
     this session makes would be refused by RLS, so the pages would render as
     a grid of zeros and empty tables with no explanation. Say what is wrong
     instead. */
  if (!isAdmin) {
    return context.redirect('/admin/no-access', 302);
  }

  return next();
});
