// ============================================================================
// RENEWABLY.IE — PROXY (AUTH GUARD)
// ============================================================================
// Server-side route protection for CRM pages and API routes.
// Checks for the crm_session cookie existence.
// Full session validation happens in API route handlers + CRMProvider.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'

// Routes that require CRM authentication
const CRM_PAGE_ROUTES = ['/crm']
const CRM_API_ROUTES = ['/api/crm/']
const PUBLIC_CRM_ROUTES = ['/crm/login', '/api/crm/auth']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip non-CRM routes entirely
  const isCRMPage = CRM_PAGE_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
  const isCRMApi = CRM_API_ROUTES.some((route) => pathname.startsWith(route))
  const isPublicRoute = PUBLIC_CRM_ROUTES.some((route) => pathname.startsWith(route))

  if (!isCRMPage && !isCRMApi) {
    return NextResponse.next()
  }

  // Allow public CRM routes (login, auth endpoint)
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for session cookie
  const cookieHeader = request.headers.get('cookie') || ''
  const hasSession = cookieHeader.includes('crm_session=')

  if (!hasSession) {
    // For API routes, return 401
    if (isCRMApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/crm/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all CRM page routes
    '/crm/:path*',
    // Match all CRM API routes
    '/api/crm/:path*',
  ],
}
