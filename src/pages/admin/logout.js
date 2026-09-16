/**
 * /admin/logout
 *
 * POST only. A sign-out reachable by GET can be triggered by anything that
 * makes the browser fetch a URL — an <img src> in an email, a prefetch hint, a
 * link someone is tricked into clicking. Harmless as attacks go, but it makes
 * the panel randomly log itself out, and the fix costs one method check.
 *
 * `signOut()` revokes the refresh token at Supabase and clears the session
 * cookies through the adapter on the server client, so the redirect that
 * follows carries the expiry.
 */

export const prerender = false;

import { createSupabaseServerClient } from '../../lib/supabase/server.js';
import { isSupabaseConfigured } from '../../lib/supabase/env.js';

export async function POST(context) {
  if (isSupabaseConfigured) {
    const supabase = createSupabaseServerClient(context);
    /* Deliberately not checked. A failure here means the token could not be
       revoked remotely, but the cookies are cleared either way and there is
       nothing useful to tell someone who is trying to leave. */
    await supabase.auth.signOut();
  }

  return context.redirect('/admin/login', 303);
}

/** A bookmarked /admin/logout lands here. Send it to the login page. */
export function GET(context) {
  return context.redirect('/admin/login', 303);
}
