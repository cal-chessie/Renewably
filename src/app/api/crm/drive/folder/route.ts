// ============================================================================
// DRIVE FOLDER API - create-or-get a per-lead Google Drive folder
// ============================================================================
// Backs the cockpit "Drive folder" action. ENV-GATED via src/lib/drive.ts:
// with no GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_DRIVE_FOLDER_ID this
// returns an honest { ok:false, reason:'Drive not connected' } (HTTP 200 - a
// legitimate "not connected" state, not a server error) and NEVER fabricates a
// folder or link (Cal's truth rule). Reuses the same Google OAuth connection as
// the calendar routes (`google_calendar_connections`).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createServiceClient } from '@/lib/supabase'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import { ensureLeadFolder, isDriveConfigured, refreshAccessToken } from '@/lib/drive'

const NOT_CONNECTED = 'Drive not connected'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`drive_folder:${getClientIp(request)}`, {
      maxAttempts: 20,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, reason: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } },
      )
    }

    const body = await request.json().catch(() => ({}))
    const company = typeof body?.company === 'string' ? body.company.trim() : ''
    if (!company) {
      return NextResponse.json({ ok: false, reason: 'A company name is required' }, { status: 400 })
    }

    // Config gate first: honest not-connected, no DB round-trip needed.
    if (!isDriveConfigured()) {
      return NextResponse.json({ ok: false, reason: NOT_CONNECTED })
    }

    // Reuse the Google OAuth connection the calendar routes store. Single-tenant:
    // this signed-in staff member's own connection is "the" Google account.
    const supabase = createServiceClient()
    const { data: connection } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!connection || !connection.access_token) {
      return NextResponse.json({ ok: false, reason: `${NOT_CONNECTED} (no authorised Google account)` })
    }

    // Refresh the access token if it has expired (mirrors the calendar push route).
    let accessToken: string = connection.access_token
    if (connection.expires_at && new Date() > new Date(connection.expires_at)) {
      const refreshed = await refreshAccessToken(connection.refresh_token)
      if (!refreshed.ok) {
        return NextResponse.json({ ok: false, reason: refreshed.reason })
      }
      accessToken = refreshed.data.accessToken
      await supabase
        .from('google_calendar_connections')
        .update({
          access_token: refreshed.data.accessToken,
          expires_at: new Date(Date.now() + refreshed.data.expiresIn * 1000).toISOString(),
        })
        .eq('user_id', user.id)
    }

    const result = await ensureLeadFolder(company, accessToken)
    if (!result.ok) {
      // Honest failure/not-connected state surfaced to the cockpit as { ok:false }.
      return NextResponse.json({ ok: false, reason: result.reason })
    }

    return NextResponse.json({
      ok: true,
      url: result.data.url,
      name: result.data.name,
      created: result.data.created,
    })
  } catch (error) {
    logger.error('Drive folder route error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ ok: false, reason: 'Internal server error' }, { status: 500 })
  }
}
