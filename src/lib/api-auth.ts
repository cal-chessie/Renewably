import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getLogoutCookies } from '@/lib/crm-session'

export async function withAuth(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { user, error: null }
}

export { getCurrentUser, getLogoutCookies }
