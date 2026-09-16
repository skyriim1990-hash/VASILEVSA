/**
 * ADMIN — AUTHENTICATION
 *
 * One place that answers "who is making this request, and are they allowed in".
 *
 * ---------------------------------------------------------------------------
 * THE TWO CHECKS, AND WHY THERE ARE TWO
 * ---------------------------------------------------------------------------
 * 1. Signed in.  `supabase.auth.getUser()` — not `getSession()`. getSession()
 *    reads the cookie and believes it. getUser() sends the token to Supabase
 *    and asks. For a gate, only the verified answer counts.
 *
 * 2. On the allowlist.  A row in public.admin_users. Checked here so the panel
 *    can say so politely instead of rendering empty tables.
 *
 * Neither check is what actually protects the data. That is Row Level Security,
 * which applies to every statement this session issues whether or not these
 * functions were called. These exist to produce a good redirect and a clear
 * message; the database is what refuses the write.
 */

import { createSupabaseServerClient } from '../supabase/server.js';

/**
 * Resolves the current request into { supabase, user, isAdmin }.
 *
 * `user` is null when nobody is signed in. `isAdmin` is false both for a
 * visitor and for a signed-in account that is not on the allowlist — the two
 * are separated by `user` being null or not.
 *
 * @param {{ request: Request, cookies: any }} context  Astro context
 */
export async function resolveAdmin(context) {
  const supabase = createSupabaseServerClient(context);

  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : (data?.user ?? null);

  if (!user) return { supabase, user: null, isAdmin: false };

  /* Asks the database rather than trusting a claim in the token. The same
     function backs every RLS policy, so the panel and the data agree about
     who is an admin by construction. */
  const { data: allowed, error: rpcError } = await supabase.rpc('is_admin');

  return { supabase, user, isAdmin: rpcError ? false : allowed === true };
}

/**
 * The email to print in the interface. Falls back to the user id so the
 * settings page never shows a blank where an identity should be.
 */
export function adminLabel(user) {
  if (!user) return '';
  return user.email || user.id;
}
