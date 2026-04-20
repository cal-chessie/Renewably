import { NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createServiceClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
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
      return NextResponse.json({ connected: false })
    }

    const isExpired = new Date() > new Date(connection.expires_at)

    return NextResponse.json({
      connected: true,
      email: connection.email,
      calendarId: connection.calendar_id,
      lastSyncedAt: connection.last_synced_at || null,
      isTokenExpired: isExpired,
    })
  } catch (error) {
    logger.error('Google Calendar status error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
