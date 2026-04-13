// ============================================================================
// RENEWABLY.IE — CRM AUTHENTICATION API
// ============================================================================
// POST: Login (with legacy password auto-upgrade)
// GET:  Validate current session
// DELETE: Logout
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyPassword,
  hashPassword,
  isLegacyHash,
  getSessionFromRequest,
  parseCookies,
  createSession as createSessionToken,
  createSessionCookie,
  createLogoutCookie,
  deleteSession,
  checkRateLimit,
  clearRateLimit,
} from '@/lib/auth'

// Helper to extract client IP from request headers
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

// POST: Login (with rate limiting)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIp(request)
    const rateCheck = await checkRateLimit(ip)
    if (!rateCheck.allowed) {
      const retryAfterSecs = Math.ceil(rateCheck.retryAfterMs / 1000)
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${retryAfterSecs} minutes.`, retryAfter: retryAfterSecs },
        { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Auto-upgrade legacy SHA-256 password to PBKDF2
    if (isLegacyHash(user.password)) {
      const newHash = await hashPassword(password)
      await db.user.update({
        where: { id: user.id },
        data: { password: newHash },
      })
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    })

    response.headers.append('Set-Cookie', createSessionCookie(token))
    // Clear rate limit on successful login
    await clearRateLimit(ip)
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Logout
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (session) {
      await deleteSession(
        parseCookies(request.headers.get('cookie') || '')['crm_session'] || ''
      )
    }

    const response = NextResponse.json({ success: true })
    response.headers.append('Set-Cookie', createLogoutCookie())
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Current session
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
      },
    })

    if (!user || !user.isActive) {
      const response = NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
      response.headers.append('Set-Cookie', createLogoutCookie())
      return response
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
