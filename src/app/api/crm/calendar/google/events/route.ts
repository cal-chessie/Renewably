import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await db.googleCalendarConnection.findUnique({
      where: { userId: session.userId },
    })

    if (!connection || !connection.isActive) {
      return NextResponse.json({ events: [], connected: false })
    }

    const isMock = !process.env.GOOGLE_CLIENT_ID
    const now = new Date()

    const events = isMock
      ? [
          {
            id: 'mock-gcal-1',
            title: 'Team Standup',
            description: 'Daily standup with the team',
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString(),
            location: 'Zoom',
            isAllDay: false,
            isGoogleEvent: true,
          },
          {
            id: 'mock-gcal-2',
            title: 'Client Lunch Meeting',
            description: 'Lunch with potential partner',
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 13, 30).toISOString(),
            location: 'The Green Room, Dublin',
            isAllDay: false,
            isGoogleEvent: true,
          },
          {
            id: 'mock-gcal-3',
            title: 'Quarterly Planning',
            description: 'Q3 planning session',
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 16, 0).toISOString(),
            location: 'Conference Room A',
            isAllDay: false,
            isGoogleEvent: true,
          },
          {
            id: 'mock-gcal-4',
            title: 'Industry Webinar: Solar Trends 2026',
            description: 'Online webinar about upcoming solar industry trends',
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 10, 0).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 11, 30).toISOString(),
            location: null,
            isAllDay: false,
            isGoogleEvent: true,
          },
          {
            id: 'mock-gcal-5',
            title: 'Board Meeting',
            description: 'Monthly board meeting',
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 15, 0).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 17, 0).toISOString(),
            location: 'Board Room',
            isAllDay: false,
            isGoogleEvent: true,
          },
        ]
      : []

    return NextResponse.json({
      events,
      connected: true,
      email: connection.email,
      lastSyncedAt: connection.lastSyncedAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('Google Calendar events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
