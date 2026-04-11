import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await db.googleCalendarConnection.findUnique({
      where: { userId: session.userId },
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
