import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { db } from '@/lib/db'

async function refreshAccessToken(connection: { refreshToken: string; userId: string }) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    const newToken = `mock_access_token_refreshed_${Date.now()}`
    await db.googleCalendarConnection.update({
      where: { userId: connection.userId },
      data: {
        accessToken: newToken,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        lastSyncedAt: new Date(),
      },
    })
    return newToken
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: connection.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token')
  }

  const tokens = await tokenResponse.json()

  await db.googleCalendarConnection.update({
    where: { userId: connection.userId },
    data: {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      lastSyncedAt: new Date(),
    },
  })

  return tokens.access_token
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const connection = await db.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    })

    if (!connection || !connection.isActive) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    let accessToken = connection.accessToken
    if (new Date() > connection.expiresAt) {
      accessToken = await refreshAccessToken(connection)
    }

    const calendarId = connection.calendarId || 'primary'

    const isMock = !process.env.GOOGLE_CLIENT_ID
    const now = new Date()
    let events: Array<{
      id: string
      summary: string
      description?: string
      start: { dateTime?: string; date?: string }
      end: { dateTime?: string; date?: string }
      location?: string
      htmlLink?: string
      status: string
    }> = []

    if (isMock) {
      events = [
        {
          id: 'mock-gcal-1',
          summary: 'Team Standup',
          description: 'Daily standup with the team',
          start: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString() },
          end: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString() },
          location: 'Zoom',
          htmlLink: 'https://calendar.google.com',
          status: 'confirmed',
        },
        {
          id: 'mock-gcal-2',
          summary: 'Client Lunch Meeting',
          description: 'Lunch with potential partner',
          start: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0).toISOString() },
          end: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 13, 30).toISOString() },
          location: 'The Green Room, Dublin',
          htmlLink: 'https://calendar.google.com',
          status: 'confirmed',
        },
        {
          id: 'mock-gcal-3',
          summary: 'Quarterly Planning',
          description: 'Q3 planning session',
          start: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0).toISOString() },
          end: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 16, 0).toISOString() },
          location: 'Conference Room A',
          htmlLink: 'https://calendar.google.com',
          status: 'confirmed',
        },
        {
          id: 'mock-gcal-4',
          summary: 'Industry Webinar: Solar Trends 2026',
          description: 'Online webinar about upcoming solar industry trends',
          start: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 10, 0).toISOString() },
          end: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 11, 30).toISOString() },
          htmlLink: 'https://calendar.google.com',
          status: 'confirmed',
        },
        {
          id: 'mock-gcal-5',
          summary: 'Board Meeting',
          description: 'Monthly board meeting',
          start: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 15, 0).toISOString() },
          end: { dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 17, 0).toISOString() },
          location: 'Board Room',
          htmlLink: 'https://calendar.google.com',
          status: 'confirmed',
        },
      ]
    } else {
      const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

      const calResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (!calResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch Google Calendar events' }, { status: 500 })
      }

      const calData = await calResponse.json()
      events = calData.items || []
    }

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.summary || '(No title)',
      description: event.description || null,
      startDate: event.start?.dateTime || event.start?.date || '',
      endDate: event.end?.dateTime || event.end?.date || '',
      location: event.location || null,
      isAllDay: !event.start?.dateTime,
      htmlLink: event.htmlLink || null,
      status: event.status,
      isGoogleEvent: true,
    }))

    return NextResponse.json({
      events: formattedEvents,
      syncedAt: new Date().toISOString(),
      total: formattedEvents.length,
    })
  } catch (error) {
    console.error('Google Calendar sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
