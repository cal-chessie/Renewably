// ============================================================================
// RENEWABLY CRM — RESET PASSWORD API
// ============================================================================
// POST /api/crm/auth/reset-password
//
// Updates a user's password using the access_token from the reset email link.
// The Supabase reset email includes #access_token and #type=recovery fragments,
// which are read by the reset-password page and sent to this endpoint.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const body = await request.json()
    const { accessToken, newPassword } = body

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing reset token. Please request a new password reset link.' },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    // Supabase requires passwords to be at least 6 characters
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Max length to prevent DoS on bcrypt hashing
    if (newPassword.length > 128) {
      return NextResponse.json(
        { error: 'Password must be less than 128 characters' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Reset password: Supabase env vars not configured')
      return NextResponse.json(
        { error: 'Password reset is not configured' },
        { status: 500 }
      )
    }

    // Use the access_token from the reset link to set the session, then update password
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Set the recovery session so updateUser has the right auth context
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    })

    if (sessionError) {
      logger.warn('Reset password: failed to set session', {
        error: sessionError.message,
      })
      return NextResponse.json(
        { error: 'This reset link has expired or is invalid. Please request a new one.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      logger.warn('Reset password: Supabase returned error', {
        error: error.message,
        status: error.status,
      })

      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'This reset link has expired or is invalid. Please request a new one.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to reset password. Please request a new reset link.' },
        { status: 400 }
      )
    }

    logger.info('Reset password: password updated successfully', {
      userId: data.user?.id,
    })

    return NextResponse.json({
      message: 'Password updated successfully. You can now sign in with your new password.',
    })
  } catch (error) {
    logger.error('Reset password: unhandled error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
