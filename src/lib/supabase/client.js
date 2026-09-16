/**
 * SUPABASE — BROWSER CLIENT
 *
 * For code that runs in the visitor's browser: a signed-in admin session, a
 * file upload with progress, a realtime subscription.
 *
 * Carries the anon key only. Everything it is allowed to see or change is
 * decided by Row Level Security on the database, not by this file.
 *
 * ---------------------------------------------------------------------------
 * WHY createBrowserClient RATHER THAN createClient
 * ---------------------------------------------------------------------------
 * `createBrowserClient` from @supabase/ssr stores the session in a cookie
 * instead of localStorage. That cookie is the one thing the server can also
 * read, which is what lets a page be rendered already knowing who is signed
 * in. A plain `createClient` keeps the session in localStorage, invisible to
 * the server, and the two halves of the app then disagree about the user.
 *
 * Nothing on the public site imports this today. It is here so the admin
 * panel has a correct client waiting for it.
 */

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY, assertSupabaseConfigured } from './env.js';

/* Supabase warns when two auth clients share one browser context, and two
   clients would race each other refreshing the same token. One instance per
   page, created on first use. */
let instance = null;

/**
 * Returns the shared browser client, creating it on first call.
 * Throws if the environment variables are missing — in the browser that is
 * always a misconfiguration, never a legitimate state.
 */
export function getSupabaseBrowserClient() {
  if (instance) return instance;

  assertSupabaseConfigured();
  instance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  return instance;
}
