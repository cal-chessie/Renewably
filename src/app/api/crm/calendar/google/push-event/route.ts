import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { meetingId } = body

    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId is required' }, { status: 400 })
    }

    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
      include: {
        contact: { select: { email: true, firstName: true, lastName: true } },
      },
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const connection = await db.googleCalendarConnection.findUnique({
      where: { userId: session.userId },
    })

    if (!connection || !connection.isActive) {
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

    let accessToken = connection.accessToken
    if (new Date() > connection.expiresAt) {
      const clientId = process.env.GOOGLE_CLIENT_ID!
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!

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

      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json()
        accessToken = tokens.access_token
        await db.googleCalendarConnection.update({
          where: { userId: session.userId },
          data: {
            accessToken: tokens.access_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          },
        })
      }
    }

    const calendarId = connection.calendarId || 'primary'
    const attendees = meeting.contact?.email
      ? [{ email: meeting.contact.email }]
      : []

    const eventBody = {
      summary: meeting.title,
      description: meeting.description || '',
      location: meeting.location || undefined,
      start: { dateTime: new Date(meeting.date).toISOString(), timeZone: 'Europe/Dublin' },
      end: { dateTime: new Date(meeting.endDate).toISOString(), timeZone: 'Europe/Dublin' },
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
    console.error('Google Calendar push error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
