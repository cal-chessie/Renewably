import { NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const connection = await db.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    })

    if (!connection || !connection.isActive) {
      return NextResponse.json({ connected: false })
    }

    const isExpired = new Date() > connection.expiresAt

    return NextResponse.json({
      connected: true,
      email: connection.email,
      calendarId: connection.calendarId,
      lastSyncedAt: connection.lastSyncedAt?.toISOString() || null,
      isTokenExpired: isExpired,
    })
  } catch (error) {
    console.error('Google Calendar status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
