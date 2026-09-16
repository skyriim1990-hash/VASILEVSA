/**
 * SUPABASE — ENTRY POINT
 *
 * Import from '../lib/supabase/index.js' rather than reaching into the
 * individual files, so call sites stay stable if the internals move.
 *
 * Deliberately absent: the service-role client. It is NOT re-exported here,
 * because a barrel file is exactly how a privileged credential ends up
 * imported into browser code by accident. Anything that truly needs it
 * imports './admin.js' directly and makes that choice visible in the diff.
 */

export {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
  assertSupabaseConfigured,
} from './env.js';

export { getSupabaseBrowserClient } from './client.js';

export { createSupabaseServerClient, getSessionUser } from './server.js';

export { BUCKETS, publicUrl, uploadFile } from './storage.js';
