import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { logger } from '@/lib/logger'

/**
 * GET /api/crm/calendar/google/auth-url
 * Returns the Google OAuth consent screen URL for the authenticated user.
 * If GOOGLE_CLIENT_ID is not set, reports that the integration is not configured
 * rather than returning a fake consent URL that would fake a connection.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/calendar/google/callback`

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Calendar is not configured', configured: false },
        { status: 501 },
      )
    }

    // TODO(relay): confirm Drive scope on the OAuth consent screen. `drive.file`
    // lets Relay create/read the per-lead folders it makes under
    // GOOGLE_DRIVE_FOLDER_ID (see src/lib/drive.ts). The scope must also be
    // listed on the Google Cloud consent screen, and existing accounts must
    // re-authorise, before Drive calls succeed. If the root folder was not
    // created by this app, the broader `drive` scope may be required.
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' ')

    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', scopes)
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('state', state)

    return NextResponse.json({ url: url.toString(), mock: false })
  } catch (error) {
    logger.error('Google auth URL error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
