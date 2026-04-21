// ============================================================================
// POST /api/crm/auth/login — Login alias (delegates to Supabase Auth)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase, createServiceClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

const ACCESS_TOKEN_COOKIE = 'sb-access-token'
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token'

const COOKIE_BASE = (value: string, maxAge: number) => {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  return `${value}; Path=/; HttpOnly; ${secure}SameSite=lax; Max-Age=${maxAge}`
}

async function getProfile(userId: string) {
  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('profiles')
    .select('id, user_id, email, name, role, avatar, phone, is_active')
    .eq('user_id', userId)
    .single()

  if (error) {
    logger.error('Failed to fetch user profile', { userId, error: error.message })
    return null
  }
  return data
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error || !data.user || !data.session) {
      logger.warn('Login failed via /auth/login', {
        email: email.toLowerCase(),
        error: error?.message ?? 'No session returned',
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const profile = await getProfile(data.user.id)
    if (!profile) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 403 }
      )
    }

    if (!profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Account is inactive. Please contact an administrator.' },
        { status: 403 }
      )
    }

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

    const maxAge = 60 * 60 * 24 * 7
    response.headers.append(
      'Set-Cookie',
      COOKIE_BASE(`${ACCESS_TOKEN_COOKIE}=${data.session.access_token}`, maxAge)
    )
    response.headers.append(
      'Set-Cookie',
      COOKIE_BASE(`${REFRESH_TOKEN_COOKIE}=${data.session.refresh_token}`, maxAge)
    )

    logger.info('User logged in via /auth/login', {
      userId: data.user.id,
      email: profile.email,
      role: profile.role,
    })

    return response
  } catch (error) {
    logger.error('Login error (/auth/login)', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
