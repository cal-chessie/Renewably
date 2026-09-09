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
    throw new Error('Google Calendar is not configured')
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

    // Not configured — cannot sync; return an honest empty result, never fabricated events.
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ events: [], syncedAt: new Date().toISOString(), total: 0 })
    }

    let accessToken = connection.access_token
    if (new Date() > new Date(connection.expires_at)) {
      accessToken = await refreshAccessToken(connection)
    }

    const calendarId = connection.calendar_id || 'primary'

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
    const events: Array<{
      id: string
      summary: string
      description?: string
      start: { dateTime?: string; date?: string }
      end: { dateTime?: string; date?: string }
      location?: string
      htmlLink?: string
      status: string
    }> = calData.items || []

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
