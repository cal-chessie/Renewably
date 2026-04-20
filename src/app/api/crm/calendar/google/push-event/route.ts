import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createServiceClient } from '@/lib/supabase'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`calendar_push_event:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const { meetingId } = body

    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId is required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: meeting } = await supabase
      .from('meetings')
      .select('*, contact:contacts(email, first_name, last_name)')
      .eq('id', meetingId)
      .single()

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const { data: connection } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    const isMock = !process.env.GOOGLE_CLIENT_ID

    if (isMock) {
      const mockEventId = `gcal_${meetingId}_${Date.now()}`
      return NextResponse.json({
        success: true,
        googleEventId: mockEventId,
        message: 'Meeting pushed to Google Calendar (demo mode)',
      })
    }

    let accessToken = connection.access_token
    if (new Date() > new Date(connection.expires_at)) {
      const clientId = process.env.GOOGLE_CLIENT_ID!
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!

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

      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json()
        accessToken = tokens.access_token
        await supabase.from('google_calendar_connections').update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }).eq('user_id', user.id)
      }
    }

    const calendarId = connection.calendar_id || 'primary'
    const attendees = meeting.contact?.email
      ? [{ email: meeting.contact.email }]
      : []

    const eventBody = {
      summary: meeting.title,
      description: meeting.description || '',
      location: meeting.location || undefined,
      start: { dateTime: new Date(meeting.date).toISOString(), timeZone: 'Europe/Dublin' },
      end: { dateTime: new Date(meeting.end_date).toISOString(), timeZone: 'Europe/Dublin' },
      attendees,
      reminders: { useDefault: true },
    }

    const calResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody),
      }
    )

    if (!calResponse.ok) {
      return NextResponse.json({ error: 'Failed to create Google Calendar event' }, { status: 500 })
    }

    const calEvent = await calResponse.json()

    return NextResponse.json({
      success: true,
      googleEventId: calEvent.id,
      htmlLink: calEvent.htmlLink,
    })
  } catch (error) {
    logger.error('Google Calendar push error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
