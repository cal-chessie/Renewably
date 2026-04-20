import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/crm-session'

export async function requireAuth(request: NextRequest) {
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
