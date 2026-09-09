import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

/** Lazy singleton - only creates the client when first accessed at runtime */
let _supabase: SupabaseClient | null = null
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const { url, anonKey } = getConfig()
      if (!url || !anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
      _supabase = createClient(url, anonKey)
    }
    return (_supabase as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Server-side client with service role (for API routes)
export function createServiceClient() {
  const { url } = getConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(url, serviceRoleKey)
}

/**
 * Lazy singleton service-role client for SERVER-ONLY code (API routes, server
 * libs). Same ergonomics as `supabase` above, but authenticates with the
 * service role so it works with the authenticated-only RLS lockdown. Privileged
 * server reads/writes must NOT use the anon `supabase` client — that runs as the
 * public `anon` role, which the CRM tables now deny. Never import this into a
 * client component (the service key is not present in the browser).
 */
let _supabaseAdmin: SupabaseClient | null = null
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) _supabaseAdmin = createServiceClient()
    return (_supabaseAdmin as unknown as Record<string | symbol, unknown>)[prop]
  },
})
