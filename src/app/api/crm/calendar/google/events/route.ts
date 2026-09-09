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

    // Google OAuth is not configured — the connection cannot be genuine, so the
    // honest state is "not connected / no events", never fabricated meetings.
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ events: [], connected: false })
    }

    // TODO(relay): fetch live events from the Google Calendar API for this connection.
    // Until that's wired, return an honest empty list rather than invented events.
    return NextResponse.json({
      events: [],
      connected: true,
      email: connection.email,
      lastSyncedAt: connection.last_synced_at || null,
    })
  } catch (error) {
    logger.error('Google Calendar events error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
