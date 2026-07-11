// ============================================================================
// Renewably CRM — Shared API Route Helpers (CSRF + Rate Limit + Validation)
// ============================================================================

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkApiRateLimit, getClientIp } from './crm-validation'
import { logger } from './logger'

// ─── Types ─────────────────────────────────────────────────────────────────

type RouteHandler = (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse>

type ValidatedRouteHandler<T = unknown> = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; body: T },
) => Promise<NextResponse>

interface RateLimitOptions {
  limit?: number
  windowMs?: number
}

// ─── CSRF Protection ───────────────────────────────────────────────────────
// Validates Origin/Referer on state-changing requests (POST, PUT, PATCH, DELETE).
// SameSite=Lax already blocks cross-site cookies, but this adds an explicit
// Origin check as defense-in-depth. Safe methods (GET, HEAD, OPTIONS) pass through.

/** Build the set of allowed origins from env */
function getAllowedOrigins(): Set<string> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const origins = new Set<string>()

  // Production base URL
  if (base) {
    try {
      origins.add(new URL(base).origin)
    } catch {
      origins.add(base)
    }
  }

  // Supabase project URL (for auth callbacks)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      origins.add(new URL(supabaseUrl).origin)
    } catch { /* ignore */ }
  }

  // ── ADDED: Vercel deployment URLs (production, preview, branch) ──────────
  // VERCEL_URL is injected at runtime on every deployment, including the
  // hashed preview URLs. Without this, every preview deploy fails CSRF.
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`)
  }
  if (process.env.VERCEL_BRANCH_URL) {
    origins.add(`https://${process.env.VERCEL_BRANCH_URL}`)
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  }
  // ────────────────────────────────────────────────────────────────────────

  // Dev environments
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000')
    origins.add('https://space.chatglm.site')
    origins.add('https://space.z.ai')
  }

  return origins
}
/**
 * Validates that the request's Origin or Referer header matches an allowed origin.
 * Returns true if the request is safe (GET/HEAD/OPTIONS) or if the origin is valid.
 * Returns false if a state-changing request has a mismatched or missing origin.
 */
export function validateCsrfOrigin(request: NextRequest): boolean {
  const method = request.method.toUpperCase()
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])
  if (safeMethods.has(method)) return true

  const allowedOrigins = getAllowedOrigins()
  if (allowedOrigins.size === 0) return true // no config — don't block

  // Check Origin header (sent on cross-origin and preflighted requests)
  const origin = request.headers.get('origin')
  if (origin) {
    return allowedOrigins.has(origin)
  }

  // Fall back to Referer (sent on most navigational requests)
  const referer = request.headers.get('referer')
  if (referer) {
    const refererOrigin = extractOrigin(referer)
    if (refererOrigin) {
      return allowedOrigins.has(refererOrigin)
    }
  }

  // No Origin and no Referer on a state-changing request.
  // Legitimate browsers always send at least one of these for same-origin mutations,
  // but some reverse proxies (e.g. dev preview tunnels) strip them.
  // In development, be lenient to avoid blocking legitimate requests.
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  return false
}

/**
 * Returns a 403 CSRF rejection response.
 */
export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'CSRF validation failed — missing or invalid origin header' },
    { status: 403 },
  )
}

// ─── Standardized Error Responses ──────────────────────────────────────────

/**
 * Returns a consistent JSON error response. Used across all CRM routes.
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown,
): NextResponse {
  const body: Record<string, unknown> = { error: message }
  if (details !== undefined) body.details = details
  return NextResponse.json(body, { status })
}

/**
 * Shorthand for 400 Bad Request with validation details.
 */
export function validationError(details: Array<{ field: string; message: string }>): NextResponse {
  return NextResponse.json(
    { error: 'Validation failed', details },
    { status: 400 },
  )
}

/**
 * Shorthand for 401 Unauthorized.
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}

/**
 * Shorthand for 403 Forbidden.
 */
export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
}

/**
 * Shorthand for 404 Not Found.
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

// ─── withRateLimit ─────────────────────────────────────────────────────────

/**
 * Wraps a Next.js route handler with in-memory rate limiting.
 * Uses the shared checkApiRateLimit from crm-validation.ts.
 * Returns 429 with standard headers if rate limited.
 */
export function withRateLimit(
  handler: RouteHandler,
  options: RateLimitOptions = {},
): RouteHandler {
  const { limit = 100, windowMs = 60000 } = options

  return async (request, context) => {
    const ip = getClientIp(request)
    const key = `rl:${limit}:${windowMs}:${ip}`
    const result = checkApiRateLimit(key, { maxAttempts: limit, windowMs })

    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        ip,
        path: request.nextUrl.pathname,
        limit,
        windowMs,
        retryAfterMs: result.retryAfterMs,
      })

      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfterMs: result.retryAfterMs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    return handler(request, context)
  }
}

// ─── withValidation ────────────────────────────────────────────────────────

/**
 * Wraps a Next.js route handler with Zod schema validation on POST/PUT/PATCH.
 * Validates request body and makes the parsed body available via `context.body`.
 * Returns 400 with detailed error messages if validation fails.
 */
export function withValidation<T>(
  handler: ValidatedRouteHandler<T>,
  schema: z.ZodType<T>,
): RouteHandler {
  return async (request, context) => {
    const method = request.method.toUpperCase()

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      let rawBody: unknown
      try {
        rawBody = await request.json()
      } catch {
        return errorResponse('Invalid JSON body', 400)
      }

      const result = schema.safeParse(rawBody)

      if (!result.success) {
        return validationError(
          result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        )
      }

      // Pass validated body to handler via extended context
      return handler(request, {
        params: context!.params,
        body: result.data,
      })
    }

    // For GET/DELETE, pass through with undefined body
    return handler(request, {
      params: context!.params,
      body: undefined as T,
    })
  }
}

// ─── withCsrf ──────────────────────────────────────────────────────────────

/**
 * Wraps a route handler with CSRF origin validation.
 * Safe methods (GET, HEAD, OPTIONS) always pass through.
 * State-changing methods (POST, PUT, PATCH, DELETE) require a matching Origin or Referer.
 * Returns 403 if validation fails.
 */
export function withCsrf(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    if (!validateCsrfOrigin(request)) {
      logger.warn('CSRF validation failed', {
        method: request.method,
        path: request.nextUrl.pathname,
        origin: request.headers.get('origin') || '(none)',
        referer: request.headers.get('referer') || '(none)',
        ip: getClientIp(request),
      })
      return csrfErrorResponse()
    }
    return handler(request, context)
  }
}

// ─── withHandler (unified wrapper) ────────────────────────────────────────

/**
 * Convenience wrapper that combines CSRF, rate limiting, and validation.
 * Applies: CSRF check → rate limit → validate body → run handler.
 * CSRF is always enabled on state-changing methods (POST/PUT/PATCH/DELETE).
 */
export function withHandler<T>(
  options: {
    rateLimit?: RateLimitOptions
    schema?: z.ZodType<T>
    /** Set to false to skip CSRF origin validation (e.g., for webhooks) */
    csrf?: boolean
  },
  handler: ValidatedRouteHandler<T>,
): RouteHandler {
  let wrapped: RouteHandler = handler as unknown as RouteHandler

  if (options.schema) {
    wrapped = withValidation(handler, options.schema)
  }

  if (options.rateLimit) {
    wrapped = withRateLimit(wrapped, options.rateLimit)
  }

  // CSRF wraps outermost (runs first before rate limit / validation)
  if (options.csrf !== false) {
    wrapped = withCsrf(wrapped)
  }

  return wrapped
}

// ─── Compose helpers ───────────────────────────────────────────────────────

/**
 * Composes multiple wrappers (withRateLimit, withValidation, etc.) into one.
 * Wrappers are applied right-to-left: compose(h, rateLimit, validation) applies validation first.
 */
export function compose(
  handler: RouteHandler,
  ...wrappers: Array<(h: RouteHandler) => RouteHandler>
): RouteHandler {
  return wrappers.reduceRight(
    (acc, wrapper) => wrapper(acc),
    handler,
  )
}
