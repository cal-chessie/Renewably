// ============================================================================
// RENEWABLY.IE — CRM AUTHENTICATION API (Supabase Auth)
// ============================================================================
// POST: Login with email/password via supabase.auth.signInWithPassword()
// GET:  Validate current session via supabase.auth.getUser()
// DELETE: Logout via supabase.auth.signOut()
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase, createServiceClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

const ACCESS_TOKEN_COOKIE = 'sb-access-token'
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token'

// ============================================================================
// Helper: Fetch user profile from public.profiles
// ============================================================================
async function getProfile(userId: string) {
  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('profiles')
    .select('id, user_id, email, name, role, avatar, phone, is_active')
    .eq('user_id', userId)
    .single()

  if (error) {
    logger.error('Failed to fetch user profile', {
      userId,
      error: error.message,
    })
    return null
  }

  return data
}

// ============================================================================
// Helper: Build session cookie headers
// ============================================================================
function buildSessionCookies(accessToken: string, refreshToken: string) {
  const accessCookie = `${ACCESS_TOKEN_COOKIE}=${accessToken}; Path=${COOKIE_OPTIONS.path}; HttpOnly; ${COOKIE_OPTIONS.secure ? 'Secure; ' : ''}SameSite=${COOKIE_OPTIONS.sameSite}; Max-Age=${COOKIE_OPTIONS.maxAge}`
  const refreshCookie = `${REFRESH_TOKEN_COOKIE}=${refreshToken}; Path=${COOKIE_OPTIONS.path}; HttpOnly; ${COOKIE_OPTIONS.secure ? 'Secure; ' : ''}SameSite=${COOKIE_OPTIONS.sameSite}; Max-Age=${COOKIE_OPTIONS.maxAge}`
  return [accessCookie, refreshCookie]
}

// ============================================================================
// Helper: Build logout cookie headers (clear cookies)
// ============================================================================
function buildLogoutCookies() {
  const accessCookie = `${ACCESS_TOKEN_COOKIE}=; Path=${COOKIE_OPTIONS.path}; HttpOnly; ${COOKIE_OPTIONS.secure ? 'Secure; ' : ''}SameSite=${COOKIE_OPTIONS.sameSite}; Max-Age=0`
  const refreshCookie = `${REFRESH_TOKEN_COOKIE}=; Path=${COOKIE_OPTIONS.path}; HttpOnly; ${COOKIE_OPTIONS.secure ? 'Secure; ' : ''}SameSite=${COOKIE_OPTIONS.sameSite}; Max-Age=0`
  return [accessCookie, refreshCookie]
}

// ============================================================================
// Helper: Read tokens from cookies
// ============================================================================
function getTokensFromCookies(request: NextRequest): {
  accessToken: string | null
  refreshToken: string | null
} {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null
  return { accessToken, refreshToken }
}

// ============================================================================
// POST: Login with email/password
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      logger.warn('Supabase auth sign-in failed', {
        email: email.toLowerCase(),
        error: error.message,
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Fetch profile from public.profiles
    const profile = await getProfile(data.user.id)
    if (!profile) {
      logger.error('User authenticated but no profile found', {
        userId: data.user.id,
        email: data.user.email,
      })
      // Sign out since we have no profile
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 403 }
      )
    }

    if (!profile.is_active) {
      logger.warn('Inactive user attempted login', {
        userId: data.user.id,
        email: profile.email,
      })
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Account is inactive. Please contact an administrator.' },
        { status: 403 }
      )
    }

    // Build response with session cookies
    const response = NextResponse.json({
      user: {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        phone: profile.phone,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
      },
    })

    const cookies = buildSessionCookies(
      data.session.access_token,
      data.session.refresh_token
    )
    for (const cookie of cookies) {
      response.headers.append('Set-Cookie', cookie)
    }

    logger.info('User logged in successfully', {
      userId: data.user.id,
      email: profile.email,
      role: profile.role,
    })

    return response
  } catch (error) {
    logger.error('Login failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET: Validate current session
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = getTokensFromCookies(request)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Create a Supabase client with the user's access token to validate
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })

    // Validate the token and get the user
    const { data: { user }, error: authError } = await userClient.auth.getUser(accessToken)

    if (authError || !user) {
      logger.warn('Session validation failed', {
        error: authError?.message,
      })
      // Clear cookies on invalid session
      const response = NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
      const cookies = buildLogoutCookies()
      for (const cookie of cookies) {
        response.headers.append('Set-Cookie', cookie)
      }
      return response
    }

    // Fetch profile
    const profile = await getProfile(user.id)
    if (!profile) {
      const response = NextResponse.json(
        { error: 'User profile not found' },
        { status: 401 }
      )
      const cookies = buildLogoutCookies()
      for (const cookie of cookies) {
        response.headers.append('Set-Cookie', cookie)
      }
      return response
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      )
    }

    // If we have a refresh token and the access token might be close to expiring,
    // attempt to refresh the session
    if (refreshToken) {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        const response = NextResponse.json({
          user: {
            id: profile.id,
            user_id: profile.user_id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            avatar: profile.avatar,
            phone: profile.phone,
          },
        })

        // Refresh the cookies with new tokens if they've changed
        if (
          sessionData.session.access_token !== accessToken ||
          sessionData.session.refresh_token !== refreshToken
        ) {
          const cookies = buildSessionCookies(
            sessionData.session.access_token,
            sessionData.session.refresh_token
          )
          for (const cookie of cookies) {
            response.headers.append('Set-Cookie', cookie)
          }
        }

        return response
      }
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        phone: profile.phone,
      },
    })
  } catch (error) {
    logger.error('Session check failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE: Logout
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const { accessToken } = getTokensFromCookies(request)

    // Attempt to sign out from Supabase if we have a token
    if (accessToken) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      })

      await userClient.auth.signOut()
    }

    // Always clear cookies regardless of signOut result
    const response = NextResponse.json({ success: true })
    const cookies = buildLogoutCookies()
    for (const cookie of cookies) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (error) {
    logger.error('Logout failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    // Still clear cookies even on error
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    const cookies = buildLogoutCookies()
    for (const cookie of cookies) {
      response.headers.append('Set-Cookie', cookie)
    }
    return response
  }
}
