// ============================================================================
// Google Drive Client - per-lead document folders for Relay CRM
// ============================================================================
// ENV-GATED. Drive is "connected" only when the Google OAuth web-app creds
// already used by the calendar routes (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)
// AND a root folder id (GOOGLE_DRIVE_FOLDER_ID) are all present. When any is
// absent every call no-ops honestly with { ok:false, reason:'Drive not
// connected' } - it NEVER fakes a folder id and NEVER fabricates a link
// (Cal's truth rule).
//
// Auth model: Drive reuses the SAME Google OAuth connection the calendar uses
// (the token stored in `google_calendar_connections`). This module is DB-free
// and pure: the caller resolves a fresh OAuth access token (see
// refreshAccessToken below) and passes it in, so the module stays testable and
// its only side effects are the Drive REST calls behind the guard.
//
// Server-only: the client secret is a secret and must NEVER carry a
// NEXT_PUBLIC_ prefix. Do not import this into a client component.
//
// ---------------------------------------------------------------------------
// TODO(relay): confirm Drive scope on the OAuth consent screen. The calendar
// connection currently requests calendar scopes only; the auth-url route now
// also requests `drive.file`, but the Google Cloud consent screen must list the
// Drive scope and each existing Google account must RE-AUTHORISE before a token
// can create folders (otherwise the Drive calls 403). If the root folder in
// GOOGLE_DRIVE_FOLDER_ID was not created by this app, `drive.file` is not enough
// to write into it - the broader `drive` scope (sensitive; needs Google app
// verification) is required. Confirm which scope this account needs before
// go-live. The env gate below stays as-is regardless.
// ---------------------------------------------------------------------------

import { logger } from '@/lib/logger'

// ─── Config ─────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
/** Drive folder id all per-lead folders are created under (the company root). */
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || ''

const NOT_CONFIGURED = 'Drive not connected'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files'
const GOOGLE_TOKEN_API = 'https://oauth2.googleapis.com/token'

/**
 * True only when both the Google OAuth creds AND the Drive root folder id are
 * present. This is what "Drive connected" means for the folder feature.
 */
export function isDriveConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET && !!GOOGLE_DRIVE_FOLDER_ID
}

// ─── Types ──────────────────────────────────────────────────────────────────

/** Honest result envelope: never a fabricated success. */
export type DriveResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string; status?: number }

export interface DriveFolder {
  /** Drive file id of the folder. */
  id: string
  /** Folder name (the lead / company name). */
  name: string
  /** Web link a human opens to view the folder. */
  url: string
  /** True when this call created the folder, false when it already existed. */
  created: boolean
}

// ─── Link helper ──────────────────────────────────────────────────────────────

/** Build the canonical web link for a Drive folder id. */
export function driveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`
}

// ─── OAuth token refresh (pure - no DB) ───────────────────────────────────────

/**
 * Exchange a stored Google refresh token for a fresh access token, using the
 * same OAuth web-app creds as the calendar routes. Honest failure envelope; no
 * fabricated tokens. The caller (a route behind requireAuth) reads the refresh
 * token from `google_calendar_connections` and persists the new access token.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<DriveResult<{ accessToken: string; expiresIn: number }>> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return { ok: false, reason: NOT_CONFIGURED }
  if (!refreshToken) return { ok: false, reason: NOT_CONFIGURED }
  try {
    const res = await fetch(GOOGLE_TOKEN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    })
    const data = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null
    if (!res.ok || !data?.access_token) {
      logger.error('Drive token refresh failed', { status: res.status })
      return { ok: false, reason: 'Could not refresh Google access token', status: res.status }
    }
    return { ok: true, data: { accessToken: data.access_token, expiresIn: data.expires_in ?? 3600 } }
  } catch (error) {
    logger.error('Drive token refresh threw', { error: error instanceof Error ? error.message : String(error) })
    return { ok: false, reason: 'Could not refresh Google access token' }
  }
}

// ─── Internal Drive fetch helper ──────────────────────────────────────────────

async function driveFetch<T>(
  url: string,
  init: RequestInit,
  accessToken: string,
): Promise<DriveResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })
    let payload: unknown = null
    try { payload = await res.json() } catch { /* empty body */ }
    if (!res.ok) {
      const msg =
        (payload as { error?: { message?: string } } | null)?.error?.message ||
        `Drive request failed (${res.status})`
      logger.error('Drive API error', { status: res.status, message: msg })
      return { ok: false, reason: msg, status: res.status }
    }
    return { ok: true, data: payload as T }
  } catch (error) {
    logger.error('Drive API request threw', { error: error instanceof Error ? error.message : String(error) })
    return { ok: false, reason: 'Drive request failed' }
  }
}

/** Escape a value for use inside a Drive `q` string literal ('...'). */
function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Create-or-get a per-lead folder named `company` directly under the Drive root
 * (GOOGLE_DRIVE_FOLDER_ID). Idempotent: a second call with the same company
 * name returns the existing folder rather than making a duplicate.
 *
 * @param company     The lead / company name used as the folder name.
 * @param accessToken A fresh Google OAuth access token (see refreshAccessToken).
 *                    Omit it and, when Drive is otherwise configured, the call
 *                    returns an honest not-connected state - never a fake folder.
 */
export async function ensureLeadFolder(
  company: string,
  accessToken?: string,
): Promise<DriveResult<DriveFolder>> {
  // Primary gate: Drive not configured -> honest, exact not-connected reason.
  if (!isDriveConfigured()) return { ok: false, reason: NOT_CONFIGURED }

  const name = (company || '').trim()
  if (!name) return { ok: false, reason: 'A company name is required to name the Drive folder' }

  // Configured, but no authorised Google account token to act with. Still an
  // honest not-connected state - we do NOT invent a folder id or link.
  if (!accessToken) return { ok: false, reason: `${NOT_CONFIGURED} (no authorised Google account)` }

  // 1. Look for an existing folder with this name under the root.
  const q = [
    `name = '${escapeQueryValue(name)}'`,
    `'${GOOGLE_DRIVE_FOLDER_ID}' in parents`,
    `mimeType = '${FOLDER_MIME}'`,
    'trashed = false',
  ].join(' and ')

  const searchUrl = new URL(DRIVE_FILES_API)
  searchUrl.searchParams.set('q', q)
  searchUrl.searchParams.set('fields', 'files(id,name,webViewLink)')
  searchUrl.searchParams.set('spaces', 'drive')
  searchUrl.searchParams.set('pageSize', '1')
  searchUrl.searchParams.set('supportsAllDrives', 'true')
  searchUrl.searchParams.set('includeItemsFromAllDrives', 'true')

  const searchRes = await driveFetch<{ files?: Array<{ id: string; name: string; webViewLink?: string }> }>(
    searchUrl.toString(),
    { method: 'GET' },
    accessToken,
  )
  if (!searchRes.ok) return searchRes

  const existing = searchRes.data.files?.[0]
  if (existing) {
    return {
      ok: true,
      data: {
        id: existing.id,
        name: existing.name,
        url: existing.webViewLink || driveFolderUrl(existing.id),
        created: false,
      },
    }
  }

  // 2. None found - create it under the root.
  const createUrl = new URL(DRIVE_FILES_API)
  createUrl.searchParams.set('fields', 'id,name,webViewLink')
  createUrl.searchParams.set('supportsAllDrives', 'true')

  const createRes = await driveFetch<{ id: string; name: string; webViewLink?: string }>(
    createUrl.toString(),
    {
      method: 'POST',
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      }),
    },
    accessToken,
  )
  if (!createRes.ok) return createRes

  const folder = createRes.data
  return {
    ok: true,
    data: {
      id: folder.id,
      name: folder.name,
      url: folder.webViewLink || driveFolderUrl(folder.id),
      created: true,
    },
  }
}
