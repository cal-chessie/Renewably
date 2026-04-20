// ============================================================================
// Supabase Auth Helpers — Centralised client factory & cookie utilities
// ============================================================================
// Eliminates duplicate createClient() calls across auth routes.
// Every route that needs user-scoped or service-scoped Supabase access
// should import from here instead of creating clients inline.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Env vars (lazy reads) ──────────────────────────────────────────────────

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

// ── Cookie names ────────────────────────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE = 'sb-access-token'
export const REFRESH_TOKEN_COOKIE = 'sb-refresh-token'

// ── Cookie builder ──────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === 'production'

function cookieString(name: string, value: string, maxAge: number) {
  const secure = isProduction ? 'Secure; ' : ''
  return `${name}=${value}; Path=/; HttpOnly; ${secure}SameSite=lax; Max-Age=${maxAge}`
}

export function buildSessionCookies(accessToken: string, refreshToken: string) {
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  return [
    cookieString(ACCESS_TOKEN_COOKIE, accessToken, maxAge),
    cookieString(REFRESH_TOKEN_COOKIE, refreshToken, maxAge),
  ]
}

export function buildLogoutCookies() {
  return [
    cookieString(ACCESS_TOKEN_COOKIE, '', 0),
    cookieString(REFRESH_TOKEN_COOKIE, '', 0),
  ]
}

// ── Client factories (lazy) ───────────────────────────────────────────────

async function createClient() {
  const { createClient: sbCreateClient } = await import('@supabase/supabase-js')
  return sbCreateClient
}

/**
 * Create a Supabase client scoped to a specific user's access token.
 * This client obeys RLS policies — use for operations that should be
 * restricted to the authenticated user's data.
 */
export async function createUserClient(accessToken: string): Promise<SupabaseClient> {
  const sbCreateClient = await createClient()
  const { url, anonKey } = getConfig()
  if (!url || !anonKey) throw new Error('Supabase URL/AnonKey not configured')
  return sbCreateClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  })
}

/**
 * Create a Supabase client with the service role key.
 * This bypasses RLS — use ONLY for server-side admin operations.
 */
export async function createAdminClient(): Promise<SupabaseClient> {
  const sbCreateClient = await createClient()
  const { url, serviceKey } = getConfig()
  if (!url || !serviceKey) throw new Error('Supabase URL/ServiceKey not configured')
  return sbCreateClient(url, serviceKey)
}

// ── Token helpers ───────────────────────────────────────────────────────────

export function getTokensFromCookies(request: Request): {
  accessToken: string | null
  refreshToken: string | null
} {
  const cookieHeader = request.headers.get('cookie') || ''
  const get = (name: string) => {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
    return match ? match[1] : null
  }
  return {
    accessToken: get(ACCESS_TOKEN_COOKIE),
    refreshToken: get(REFRESH_TOKEN_COOKIE),
  }
}

/**
 * Validate a Supabase access token and return the user if valid.
 * Returns null if the token is missing, expired, or invalid.
 */
export async function validateAccessToken(accessToken: string): Promise<{
  id: string
  email: string
} | null> {
  try {
    const userClient = await createUserClient(accessToken)
    const { data: { user }, error } = await userClient.auth.getUser(accessToken)
    if (error || !user) return null
    return { id: user.id, email: user.email || '' }
  } catch {
    return null
  }
}

/**
 * Attempt to refresh a session using a refresh token.
 * Returns new tokens if successful, null if refresh fails.
 */
export async function refreshSession(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
  expiresAt: number
} | null> {
  try {
    const { url, anonKey } = getConfig()
    if (!url || !anonKey) return null
    const sbCreateClient = await createClient()
    const userClient = sbCreateClient(url, anonKey)
    const { data, error } = await userClient.auth.refreshSession({
      refresh_token: refreshToken,
    })
    if (error || !data.session) return null
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      expiresAt: data.session.expires_at,
    }
  } catch {
    return null
  }
}

/**
 * Escape HTML entities to prevent XSS when interpolating user input
 * into HTML email templates or other rendered contexts.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
