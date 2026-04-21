// ============================================================================
// RENEWABLY CRM — Auth helpers with CSRF protection
// ============================================================================
// requireAuth() validates the session AND checks CSRF origin on mutations.
// This covers ~80 authenticated API routes automatically.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/crm-session'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Authenticates the request and validates CSRF on state-changing methods.
 * Returns null for both unauthenticated AND CSRF-blocked requests
 * (caller returns 401 in both cases — attacker learns nothing).
 */
export async function requireAuth(request: NextRequest) {
  // CSRF check on mutations — reject silently (return null → 401, not 403)
  if (MUTATION_METHODS.has(request.method) && !validateCsrfOrigin(request)) {
    return null
  }
  return getCurrentUser(request)
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user || user.role !== 'admin') return null
  return user
}
