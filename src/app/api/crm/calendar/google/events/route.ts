import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createServiceClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()
    const { data: connection } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
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
      lastSyncedAt: connection.last_synced_at || null,
    })
  } catch (error) {
    logger.error('Google Calendar events error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
