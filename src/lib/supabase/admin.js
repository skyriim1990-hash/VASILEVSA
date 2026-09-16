/**
 * SUPABASE — ADMIN CLIENT (SERVICE ROLE)
 *
 * Full access. Row Level Security does not apply to this client. It can read,
 * rewrite and delete every row in the project regardless of who is asking.
 *
 * ---------------------------------------------------------------------------
 * RULES
 * ---------------------------------------------------------------------------
 * - Server-side only. Never import this from a component that hydrates, from
 *   a <script> block, or from anything under a `client:` directive.
 * - Reach for it only when RLS genuinely cannot express the operation — a
 *   migration, a scheduled job, a webhook with no user attached.
 * - Ordinary admin-panel work does NOT belong here. A signed-in editor should
 *   go through `server.js` and be authorised by RLS policies, so that a bug in
 *   a page cannot escalate into full database access.
 *
 * Two independent things keep the key out of the browser: the variable has no
 * PUBLIC_ prefix, so Astro will not inline it into client code, and the guard
 * below throws if this ever executes in a browser anyway.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, readServiceRoleKey } from './env.js';

/**
 * Builds a service-role client.
 *
 * Not cached: a module-level instance would sit in memory holding the most
 * privileged credential in the project for the lifetime of the process, and
 * would be created merely by importing this file. Callers create one when
 * they have an actual reason to.
 */
export function createSupabaseAdminClient() {
  /* The load-bearing line of this file. */
  if (typeof window !== 'undefined') {
    throw new Error(
      'The Supabase service-role client was imported into browser code. ' +
        'This key bypasses Row Level Security entirely and must never reach ' +
        'the client. Use getSupabaseBrowserClient() or createSupabaseServerClient() instead.'
    );
  }

  const serviceRoleKey = readServiceRoleKey();

  if (!SUPABASE_URL || !serviceRoleKey) {
    throw new Error(
      'The Supabase service-role client needs PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY in .env (Supabase dashboard → Project ' +
        'Settings → API). Keep SUPABASE_SERVICE_ROLE_KEY out of version control.'
    );
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      /* No user is signing in here, so there is no session to keep and no
         token to refresh. Persisting one would leave the service-role
         credential in whatever storage the runtime happens to offer. */
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
