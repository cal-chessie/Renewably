// ============================================================================
// POST /api/crm/auth/logout — Logout (clears Supabase session + cookies)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

const ACCESS_TOKEN_COOKIE = 'sb-access-token'
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token'

const CLEAR_COOKIE = (name: string) => {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  return `${name}=; Path=/; HttpOnly; ${secure}SameSite=lax; Max-Age=0`
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value

    // Attempt to revoke the session server-side
    if (accessToken) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      })

      await userClient.auth.signOut()
    }

    const response = NextResponse.json({ success: true })
    response.headers.append('Set-Cookie', CLEAR_COOKIE(ACCESS_TOKEN_COOKIE))
    response.headers.append('Set-Cookie', CLEAR_COOKIE(REFRESH_TOKEN_COOKIE))

    return response
  } catch (error) {
    logger.error('Logout error (/auth/logout)', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Still clear cookies even on failure
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.append('Set-Cookie', CLEAR_COOKIE(ACCESS_TOKEN_COOKIE))
    response.headers.append('Set-Cookie', CLEAR_COOKIE(REFRESH_TOKEN_COOKIE))
    return response
  }
}
