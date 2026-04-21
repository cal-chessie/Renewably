// ============================================================================
// POST /api/crm/auth/refresh — Refresh Supabase access token
// ============================================================================
// When the access token expires (default 1 hour), the frontend calls this
// endpoint with the refresh token cookie. If successful, new cookies are
// set and the refreshed user is returned.
//
// This is a PUBLIC route (no proxy auth gate) because the refresh token
// itself is the credential — the endpoint validates it against Supabase.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  getTokensFromCookies,
  buildSessionCookies,
  buildLogoutCookies,
  refreshSession,
  createAdminClient,
} from '@/lib/supabase-auth-helpers'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = getTokensFromCookies(request)

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      )
    }

    // Attempt to refresh the session
    const tokens = await refreshSession(refreshToken)

    if (!tokens) {
      logger.warn('Token refresh failed — clearing cookies')
      const response = NextResponse.json(
        { error: 'Refresh token expired. Please log in again.' },
        { status: 401 }
      )
      for (const cookie of buildLogoutCookies()) {
        response.headers.append('Set-Cookie', cookie)
      }
      return response
    }

    // Optionally fetch the profile to return user info
    // We need to validate the new access token to get the user ID
    const adminClient = await createAdminClient()
    // Use user client pattern to get the user from the new token
    const { createClient } = await import('@supabase/supabase-js')
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        },
      }
    )

    const { data: { user }, error: userError } = await anonClient.auth.getUser(tokens.accessToken)

    let profile: Record<string, unknown> | null = null
    if (user && !userError) {
      const { data, error: profileError } = await adminClient
        .from('profiles')
        .select('id, user_id, email, name, role, avatar, phone, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      if (data && !profileError) profile = data as Record<string, unknown>
    }

    const response = NextResponse.json({
      user: profile ? {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        phone: profile.phone,
      } : null,
      session: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: tokens.expiresIn,
        expires_at: tokens.expiresAt,
      },
    })

    // Set new cookies with refreshed tokens
    for (const cookie of buildSessionCookies(tokens.accessToken, tokens.refreshToken)) {
      response.headers.append('Set-Cookie', cookie)
    }

    logger.info('Session refreshed successfully', {
      userId: user?.id,
      email: profile?.email,
    })

    return response
  } catch (error) {
    logger.error('Token refresh error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
