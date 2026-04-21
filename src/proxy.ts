// ============================================================================
// RENEWABLY CRM — Next.js 16 Proxy (Auth Guard + Rate Limiting + Logging)
// ============================================================================
// In Next.js 16+, `proxy.ts` replaces `middleware.ts`. This file acts as
// the central authentication gate for all CRM routes.
//
// Authentication flow:
//   1. Read the `sb-access-token` cookie from the request.
//   2. Create a Supabase client with the anon key + user's access token.
//   3. Call getUser() — this validates the JWT against Supabase Auth.
//   4. If valid → allow the request through.
//   5. If invalid or missing:
//      - API routes (/api/crm/*): return 401 JSON.
//      - Page routes (/crm/*): redirect to /crm/login.
//
// Exempt routes (no auth required):
//   - /api/crm/auth/*        — login, register, token refresh
//   - /api/crm/billing/webhook — Stripe webhook (signature-verified)
//   - /api/crm/email/webhook   — Postmark webhook (signature-verified)
//   - /api/contact              — public contact form
//   - /api/chat-widget          — public AI chat widget
//   - /api/ai-agent             — public AI agent
//   - /crm/login                — login page itself
//   - Static assets             — _next/*, favicon, images, etc.
//   - Marketing pages           — /, /about, /services, /pricing, etc.
// ============================================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Configuration ──────────────────────────────────────────────────────────

// Lazy env var reads — avoids build-time failure when vars are missing
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return { url, key }
}

const ACCESS_TOKEN_COOKIE = 'sb-access-token'

// ── Login Rate Limiter (in-memory, edge-safe) ──────────────────────────────

const loginRateLimit = new Map<string, { count: number; resetAt: number }>()
const LOGIN_RATE_LIMIT = 10 // requests per window
const LOGIN_WINDOW_MS = 60_000 // 1 minute

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of loginRateLimit) {
      if (entry.resetAt <= now) loginRateLimit.delete(key)
    }
  }, 300_000)
  if (typeof timer.unref === 'function') timer.unref()
}

function isLoginRateLimited(ip: string): { limited: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = loginRateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    loginRateLimit.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return { limited: false, retryAfterMs: 0 }
  }
  entry.count++
  if (entry.count > LOGIN_RATE_LIMIT) {
    return { limited: true, retryAfterMs: entry.resetAt - now }
  }
  return { limited: false, retryAfterMs: 0 }
}

// ── Route Patterns ─────────────────────────────────────────────────────────

/** Routes that should skip authentication entirely. */
const PUBLIC_API_PREFIXES: string[] = [
  '/api/crm/auth',            // Login, register, token refresh, me, logout (exact + sub-routes)
  '/api/crm/billing/webhook', // Stripe webhook (signature-verified)
  '/api/crm/email/webhook',   // Postmark webhook (signature-verified)
  '/api/contact',             // Public contact form
  '/api/chat-widget',          // Public AI chat widget
  '/api/ai-agent',             // Public AI agent
]

/** CRM page routes that should skip auth. */
const PUBLIC_CRM_PREFIXES: string[] = [
  '/crm/login',
]

/** Static asset prefixes — always public. */
const STATIC_PREFIXES: string[] = [
  '/_next/',
  '/favicon',
  '/logo',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/og-image',
]

/** Marketing site pages — always public (exact match). */
const PUBLIC_EXACT_PATHS: string[] = [
  '/', '/about', '/services', '/pricing', '/blog', '/contact',
  '/privacy', '/terms', '/workforce', '/not-found',
]

// ── Route Classification Helpers ────────────────────────────────────────────

function isMarketingPage(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.includes(pathname)) return true
  if (pathname === '/blog' || pathname.startsWith('/blog/')) return true
  return false
}

function isStaticAsset(pathname: string): boolean {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.webp', '.woff', '.woff2', '.ttf', '.eot', '.map', '.json',
    '.webm', '.mp4', '.webmanifest', '.txt', '.xml',
  ]
  for (const ext of staticExtensions) {
    if (pathname.endsWith(ext)) return true
  }
  for (const prefix of STATIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}

function isPublicApiRoute(pathname: string): boolean {
  for (const prefix of PUBLIC_API_PREFIXES) {
    // Exact match OR starts with prefix + '/'
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return true
  }
  return false
}

function isPublicCrmPage(pathname: string): boolean {
  for (const prefix of PUBLIC_CRM_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}

// ── JWT Validation ─────────────────────────────────────────────────────────

/**
 * Validate a Supabase access token by calling getUser().
 * Returns the user object if valid, null otherwise.
 */
async function validateSupabaseToken(
  accessToken: string,
): Promise<{ id: string; email: string } | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const { url, key } = getSupabaseConfig()
    if (!url || !key) return null

    const supabaseWithToken = createClient(url, key, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    })
    const {
      data: { user },
      error,
    } = await supabaseWithToken.auth.getUser(accessToken)
    if (error || !user) return null
    return { id: user.id, email: user.email || '' }
  } catch {
    return null
  }
}

// ── Proxy Handler ──────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const start = Date.now()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // ── 1. Login rate limiting (before auth check) ────────────────────────
  if (pathname === '/api/crm/auth/login' && method === 'POST') {
    const rl = isLoginRateLimited(ip)
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)),
            'X-RateLimit-Limit': String(LOGIN_RATE_LIMIT),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }
  }

  // ── 2. Skip non-CRM routes entirely ───────────────────────────────────
  if (isStaticAsset(pathname) || isMarketingPage(pathname)) {
    return NextResponse.next()
  }

  // ── 3. Determine if this is a protected route ─────────────────────────
  const isCrmApi = pathname.startsWith('/api/crm/')
  const isCrmPage = pathname.startsWith('/crm/')

  if (!isCrmApi && !isCrmPage) {
    return NextResponse.next()
  }

  // ── 4. Check public route exemptions ──────────────────────────────────
  if (isCrmApi && isPublicApiRoute(pathname)) {
    return NextResponse.next()
  }
  if (isCrmPage && isPublicCrmPage(pathname)) {
    return NextResponse.next()
  }

  // ── 5. For protected routes, we need async auth ──────────────────────
  // Next.js 16 proxy returns a synchronous Response or a Promise<Response>.
  // We return a promise for the auth check.
  return handleAuth(request, pathname, isCrmApi, ip, start)
}

async function handleAuth(
  request: NextRequest,
  pathname: string,
  isCrmApi: boolean,
  ip: string,
  startTime: number,
): Promise<NextResponse> {
  // ── 6. Read and validate the access token ────────────────────────────
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value

  if (!accessToken) {
    if (isCrmApi) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'No access token found. Please log in to access this resource.',
        },
        { status: 401 },
      )
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/crm/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const user = await validateSupabaseToken(accessToken)

  if (!user) {
    if (isCrmApi) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Your session has expired or is invalid. Please log in again.',
        },
        { status: 401 },
      )
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/crm/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 7. Token is valid — pass through with metadata ───────────────────
  const response = NextResponse.next()
  response.headers.set('x-authenticated-user', user.id)
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)

  return response
}

export const config = { matcher: ['/crm/:path*', '/api/crm/:path*', '/api/:path*'] }
