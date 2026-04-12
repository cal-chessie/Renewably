import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.googleCalendarConnection.delete({
      where: { userId: session.userId },
    })

    return NextResponse.json({ success: true, message: 'Google Calendar disconnected' })
  } catch (error) {
    console.error('Google Calendar disconnect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
