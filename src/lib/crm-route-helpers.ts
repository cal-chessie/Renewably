// ============================================================================
// Renewably CRM — Shared API Route Helpers (Rate Limit + Validation)
// ============================================================================

import type { NextRequest, NextResponse } from 'next/server'
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

// ─── withHandler (unified wrapper) ────────────────────────────────────────

/**
 * Convenience wrapper that combines auth, rate limiting, and validation.
 * Applies: rate limit → validate body → run handler.
 */
export function withHandler<T>(
  options: {
    rateLimit?: RateLimitOptions
    schema?: z.ZodType<T>
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
