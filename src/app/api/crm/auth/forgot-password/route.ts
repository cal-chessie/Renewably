// ============================================================================
// RENEWABLY CRM — FORGOT PASSWORD API
// ============================================================================
// POST /api/crm/auth/forgot-password
//
// Sends a password reset email via Supabase Auth.
// Uses Supabase's built-in resetPasswordForEmail() which sends a link
// with a #access_token and #type=recovery fragment.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

// In-memory rate limit: max 3 reset requests per 15 minutes per IP
const resetRateLimits = new Map<string, { count: number; expiresAt: number }>()

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of resetRateLimits) {
      if (entry.expiresAt <= now) resetRateLimits.delete(key)
    }
  }, 60_000).unref()
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const clientIp = getClientIp(request)

    // Rate limiting: max 3 requests per 15 minutes per IP
    const now = Date.now()
    const entry = resetRateLimits.get(clientIp)
    if (entry && now < entry.expiresAt && entry.count >= 3) {
      const retryAfterSec = Math.ceil((entry.expiresAt - now) / 1000)
      return NextResponse.json(
        { error: `Too many reset attempts. Please try again in ${retryAfterSec} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      )
    }
    if (!entry || now >= entry.expiresAt) {
      resetRateLimits.set(clientIp, { count: 1, expiresAt: now + 15 * 60 * 1000 })
    } else {
      entry.count++
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Forgot password: Supabase env vars not configured')
      return NextResponse.json(
        { error: 'Password reset is not configured' },
        { status: 500 }
      )
    }

    // Create a new client instance (anon key) for password reset email
    // which respects Supabase email templates and redirect config
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://renewably.ie'}/crm/reset-password`,
    })

    if (error) {
      logger.warn('Forgot password: Supabase returned error', {
        error: error.message,
        status: error.status,
        email: email.trim(),
      })

      // Always return success to prevent email enumeration
      // But log the error for debugging
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
    }

    // Always return the same success message to prevent email enumeration
    logger.info('Forgot password: reset email sent (or user not found)', {
      email: email.trim(),
    })

    return NextResponse.json({
      message: 'If an account exists with that email, you will receive a password reset link.',
    })
  } catch (error) {
    logger.error('Forgot password: unhandled error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
