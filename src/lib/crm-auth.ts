// ============================================================================
// RENEWABLY.IE — CRM API AUTH HELPER
// ============================================================================
// Shared authentication guard for all CRM API routes.
// Import this instead of duplicating getAuthUser in every route file.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

/**
 * Authenticate a CRM API request.
 * Returns the authenticated User record, or null if not logged in.
 *
 * Usage:
 *   import { requireAuth } from '@/lib/crm-auth'
 *
 *   export async function GET(request: NextRequest) {
 *     const user = await requireAuth(request)
 *     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *     // ... proceed with user
 *   }
 */
export async function requireAuth(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      isActive: true,
    },
  })

  // Return null if user not found or deactivated
  if (!user || !user.isActive) return null

  return user
}

/**
 * Shorthand: return a 401 response for unauthenticated requests.
 */
export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Require admin role. Returns user if admin, null otherwise.
 */
export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user || user.role !== 'admin') return null
  return user
}
