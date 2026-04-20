import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createServiceClient } from '@/lib/supabase'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

async function refreshAccessToken(connection: { refresh_token: string; user_id: string }) {
  const supabase = createServiceClient()
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    const newToken = `mock_access_token_refreshed_${Date.now()}`
    await supabase.from('google_calendar_connections').update({
      access_token: newToken,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      last_synced_at: new Date().toISOString(),
    }).eq('user_id', connection.user_id)
    return newToken
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: connection.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token')
  }

  const tokens = await tokenResponse.json()

  await supabase.from('google_calendar_connections').update({
    access_token: tokens.access_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    last_synced_at: new Date().toISOString(),
  }).eq('user_id', connection.user_id)

  return tokens.access_token
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`calendar_sync:${getClientIp(request)}`, { maxAttempts: 5, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const supabase = createServiceClient()
    const { data: connection } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    let accessToken = connection.access_token
    if (new Date() > new Date(connection.expires_at)) {
      accessToken = await refreshAccessToken(connection)
    }

    const calendarId = connection.calendar_id || 'primary'

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
    logger.error('Google Calendar sync error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
