import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Storage admin client — used only by the studio upload endpoint.
 *
 * The service-role key bypasses RLS, so this module is server-only and every
 * caller must already have passed `getOwnerSession()`.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media'

let cached: SupabaseClient | null = null

/** Returns `null` when storage env is missing so callers can answer 503 instead of crashing. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null
  cached ??= createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

/** Names the env vars that are still missing, for the 503 body. */
export function missingStorageEnv(): string[] {
  const missing: string[] = []
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  return missing
}

/** Public URL for an object already written to the bucket. */
export function publicUrlFor(client: SupabaseClient, path: string): string {
  return client.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
}
