// ============================================================================
// GET /api/crm/auth/me — Get current authenticated user from Supabase session
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const ACCESS_TOKEN_COOKIE = 'sb-access-token'
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token'

async function getProfile(userId: string) {
  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('profiles')
    .select('id, user_id, email, name, role, avatar, phone, is_active')
    .eq('user_id', userId)
    .single()

  if (error) {
    logger.error('Failed to fetch profile for /auth/me', {
      userId,
      error: error.message,
    })
    return null
  }
  return data
}

function clearAuthCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  response.headers.append(
    'Set-Cookie',
    `${ACCESS_TOKEN_COOKIE}=; Path=/; HttpOnly; ${secure}SameSite=lax; Max-Age=0`
  )
  response.headers.append(
    'Set-Cookie',
    `${REFRESH_TOKEN_COOKIE}=; Path=/; HttpOnly; ${secure}SameSite=lax; Max-Age=0`
  )
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Validate the JWT by calling getUser() with the token
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser(accessToken)

    if (authError || !user) {
      logger.warn('Session validation failed for /auth/me', {
        error: authError?.message,
      })
      const response = NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
      clearAuthCookies(response)
      return response
    }

    const profile = await getProfile(user.id)
    if (!profile) {
      const response = NextResponse.json(
        { error: 'User profile not found' },
        { status: 401 }
      )
      clearAuthCookies(response)
      return response
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
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
    })

    return response
  } catch (error) {
    logger.error('Auth check error (/auth/me)', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
