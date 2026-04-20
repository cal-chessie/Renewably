// ============================================================================
// CRM Session — Reads Supabase session from cookies
// ============================================================================

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function parseCookie(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? match[1] : undefined
}

export async function getCurrentUser(request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const accessToken = parseCookie(cookieHeader, 'sb-access-token')

  if (!accessToken) return null

  try {
    // Validate the JWT by creating a Supabase client with the user's token as auth header
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseWithUserToken = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
    const { data: { user }, error } = await supabaseWithUserToken.auth.getUser(accessToken)

    if (error || !user) return null

    // Fetch the profile using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!profile) return null

    return {
      id: profile.id,
      userId: profile.user_id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar,
      phone: profile.phone,
    }
  } catch {
    return null
  }
}

// ── Cookie Helpers ──

export function getLogoutCookies(): string[] {
  return [
    'sb-access-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'sb-refresh-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  ]
}

// ── Legacy session support (for routes still using crm_session cookie) ──
export { getSession } from './sessions'
export { hashPassword, verifyPassword } from './auth'

/** @deprecated Use getLogoutCookies (plural) instead */
export function getLogoutCookie(): string {
  return 'sb-access-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}

/** Build a Set-Cookie header for a session token */
export function getSessionCookie(token: string): string {
  return `crm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
}

// ── Rate Limiting (in-memory) ──

const rateLimits = new Map<string, { count: number; expiresAt: number }>()

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimits) {
      if (entry.expiresAt <= now) rateLimits.delete(key)
    }
  }, 60_000).unref()
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = rateLimits.get(ip)

  if (!entry || now > entry.expiresAt) {
    rateLimits.set(ip, { count: 1, expiresAt: now + 60 * 1000 })
    return { allowed: true, retryAfterMs: 0 }
  }

  entry.count++
  if (entry.count >= 5) {
    return { allowed: false, retryAfterMs: entry.expiresAt - now }
  }

  return { allowed: true, retryAfterMs: 0 }
}

export function clearRateLimit(ip: string): void {
  rateLimits.delete(ip)
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
