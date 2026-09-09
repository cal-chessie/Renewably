// ============================================================================
// Cal.com Booking Client - demo scheduling for Relay CRM
// ============================================================================
// ENV-GATED. If CALCOM_API_KEY is absent every API call no-ops honestly with
// { ok: false, reason: 'Cal.com not configured' } - it NEVER fakes a booking and
// NEVER fabricates data (Cal's truth rule). The public booking LINK is gated
// separately on CALCOM_BOOKING_URL (a public scheduling page needs no API key).
//
// Server-only: the API key and webhook secret are secrets and must NEVER carry
// a NEXT_PUBLIC_ prefix. Do not import this into a client component.
//
// ---------------------------------------------------------------------------
// TODO(relay): verify against a live Cal.com account. The v2 request/response
// and webhook shapes below are built to Cal.com's DOCUMENTED v2 API
// (https://cal.com/docs/api-reference/v2) but were NOT verified against a live
// key at build time. Confirm: base URL, the `cal-api-version` header value, the
// create-booking body (eventTypeId vs eventTypeSlug + username), the booking
// response envelope ({ status, data }), and the webhook signature header name
// (X-Cal-Signature-256) + payload field casing (BOOKING_CREATED). Adjust the
// CONSTANTS + mappers below once confirmed; the env gate stays as-is.
// ---------------------------------------------------------------------------

import crypto from 'crypto'
import { logger } from '@/lib/logger'

// ─── Config ─────────────────────────────────────────────────────────────────

const CALCOM_API_KEY = process.env.CALCOM_API_KEY || ''
const CALCOM_WEBHOOK_SECRET = process.env.CALCOM_WEBHOOK_SECRET || ''
/** Public scheduling page, e.g. https://cal.com/renewably/relay-demo (self-hosted allowed). */
const CALCOM_BOOKING_URL = process.env.CALCOM_BOOKING_URL || ''
/** Numeric event type id for programmatic createBooking(). Optional. */
const CALCOM_EVENT_TYPE_ID = process.env.CALCOM_EVENT_TYPE_ID || ''

const CALCOM_API_BASE = process.env.CALCOM_API_BASE_URL || 'https://api.cal.com/v2'
// TODO(relay): confirm the version string this account's endpoints expect.
const CALCOM_API_VERSION = process.env.CALCOM_API_VERSION || '2024-08-13'

const NOT_CONFIGURED = 'Cal.com not configured'
const WEBHOOK_NOT_CONFIGURED = 'Cal.com webhook not configured'

/** True only when the Cal.com API key is present (create/fetch a booking). */
export function isCalcomConfigured(): boolean {
  return !!CALCOM_API_KEY
}

/** True only when the webhook signing secret is present (verify inbound events). */
export function isCalcomWebhookConfigured(): boolean {
  return !!CALCOM_WEBHOOK_SECRET
}

/** True only when a public scheduling URL is set (booking link). */
export function isCalcomBookingLinkConfigured(): boolean {
  return !!CALCOM_BOOKING_URL
}

// ─── Types ──────────────────────────────────────────────────────────────────

/** Honest result envelope: never a fabricated success. */
export type CalcomResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string; status?: number }

export interface CalcomAttendee {
  name: string
  email: string
  /** IANA tz, e.g. 'Europe/Dublin'. Defaults to Europe/Dublin. */
  timeZone?: string
}

export interface CreateBookingParams {
  /** ISO 8601 start time, e.g. '2026-09-15T10:00:00Z'. */
  start: string
  attendee: CalcomAttendee
  /** Overrides CALCOM_EVENT_TYPE_ID when supplied. */
  eventTypeId?: number
  /** Relay deal this booking belongs to - echoed back on the webhook. */
  dealId?: string
  /** Extra metadata merged into the booking (stringified by Cal.com). */
  metadata?: Record<string, string>
}

/** A trimmed booking shape - only the fields Relay reads. */
export interface CalcomBooking {
  /** Cal.com booking uid (the stable public id). */
  uid: string
  /** Numeric id, when present. */
  id?: number
  status?: string
  start?: string
  end?: string
  attendees?: CalcomAttendee[]
  metadata?: Record<string, string>
}

export interface BookingLinkParams {
  /** Prefill the attendee name on the scheduling page. */
  name?: string
  /** Prefill the attendee email on the scheduling page. */
  email?: string
  /** Relay deal id - carried through as metadata so the webhook can match it. */
  dealId?: string
}

/** The pieces Relay pulls out of a booking.created webhook payload. */
export interface ParsedBookingCreated {
  uid: string | null
  /** Deal id from booking metadata, when the booking was created via a Relay link. */
  dealId: string | null
  /** First attendee's email - the fallback way to match a deal. */
  attendeeEmail: string | null
  /** ISO start time of the booked slot (maps to deals.demo_at). */
  startTime: string | null
}

// ─── Internal fetch helper ──────────────────────────────────────────────────

async function calcomFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<CalcomResult<T>> {
  if (!CALCOM_API_KEY) {
    return { ok: false, reason: NOT_CONFIGURED }
  }

  const url = path.startsWith('http') ? path : `${CALCOM_API_BASE}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
        // TODO(relay): confirm header name/value against the live account.
        'cal-api-version': CALCOM_API_VERSION,
        ...(init.headers ?? {}),
      },
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    logger.error('Cal.com request failed (network)', { path, reason })
    return { ok: false, reason }
  }

  let payload: unknown = null
  try {
    payload = await res.json()
  } catch {
    /* empty / non-JSON body tolerated */
  }

  if (!res.ok) {
    const reason =
      (payload as { error?: { message?: string }; message?: string } | null)?.error
        ?.message ??
      (payload as { message?: string } | null)?.message ??
      `Cal.com request failed (${res.status})`
    logger.warn('Cal.com API error', { path, status: res.status, reason })
    return { ok: false, reason, status: res.status }
  }

  // Cal.com v2 wraps successful responses as { status: 'success', data: {...} }.
  // TODO(relay): verify the envelope; we unwrap `.data` when present.
  const data = (payload as { data?: T } | null)?.data ?? (payload as T)
  return { ok: true, data }
}

// ─── Booking link (no API key required) ──────────────────────────────────────

/**
 * Build a public Cal.com scheduling link for a prospect, prefilled with their
 * name/email and carrying the Relay deal id as metadata so the booking.created
 * webhook can tie the resulting booking back to the deal.
 *
 * Gated on CALCOM_BOOKING_URL (the public scheduling page). Without it, returns
 * { ok: false, reason: 'Cal.com not configured' } - never a fabricated URL.
 */
export function getBookingLink(params: BookingLinkParams = {}): CalcomResult<string> {
  if (!CALCOM_BOOKING_URL) {
    return { ok: false, reason: NOT_CONFIGURED }
  }

  let url: URL
  try {
    url = new URL(CALCOM_BOOKING_URL)
  } catch {
    logger.warn('Cal.com booking URL is not a valid URL', { CALCOM_BOOKING_URL })
    return { ok: false, reason: 'Cal.com booking URL is invalid' }
  }

  if (params.name) url.searchParams.set('name', params.name)
  if (params.email) url.searchParams.set('email', params.email)
  // Cal.com prefills custom metadata via metadata[key] query params.
  // TODO(relay): confirm the metadata prefill query-param syntax for this account.
  if (params.dealId) url.searchParams.set('metadata[dealId]', params.dealId)

  return { ok: true, data: url.toString() }
}

// ─── Create / fetch a booking (API key required) ─────────────────────────────

/**
 * Create a booking programmatically via the Cal.com v2 API.
 * Gated on CALCOM_API_KEY. Without it, no-ops with { ok: false, reason }.
 */
export async function createBooking(
  params: CreateBookingParams,
): Promise<CalcomResult<CalcomBooking>> {
  if (!CALCOM_API_KEY) {
    return { ok: false, reason: NOT_CONFIGURED }
  }

  const eventTypeId =
    params.eventTypeId ??
    (CALCOM_EVENT_TYPE_ID ? Number(CALCOM_EVENT_TYPE_ID) : undefined)

  if (!eventTypeId || Number.isNaN(eventTypeId)) {
    return {
      ok: false,
      reason: 'Cal.com event type id not configured (set CALCOM_EVENT_TYPE_ID or pass eventTypeId)',
    }
  }

  const metadata: Record<string, string> = { ...(params.metadata ?? {}) }
  if (params.dealId) metadata.dealId = params.dealId

  // TODO(relay): verify this body against the live v2 create-booking endpoint.
  const body = {
    start: params.start,
    eventTypeId,
    attendee: {
      name: params.attendee.name,
      email: params.attendee.email,
      timeZone: params.attendee.timeZone || 'Europe/Dublin',
    },
    ...(Object.keys(metadata).length ? { metadata } : {}),
  }

  const result = await calcomFetch<Record<string, unknown>>('/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!result.ok) return result
  return { ok: true, data: normaliseBooking(result.data) }
}

/**
 * Fetch a booking by its Cal.com uid.
 * Gated on CALCOM_API_KEY. Without it, no-ops with { ok: false, reason }.
 */
export async function getBooking(uid: string): Promise<CalcomResult<CalcomBooking>> {
  if (!CALCOM_API_KEY) {
    return { ok: false, reason: NOT_CONFIGURED }
  }
  if (!uid) {
    return { ok: false, reason: 'Booking uid is required' }
  }

  const result = await calcomFetch<Record<string, unknown>>(
    `/bookings/${encodeURIComponent(uid)}`,
    { method: 'GET' },
  )

  if (!result.ok) return result
  return { ok: true, data: normaliseBooking(result.data) }
}

// ─── Webhook helpers ─────────────────────────────────────────────────────────

/**
 * Verify a Cal.com webhook signature (HMAC-SHA256 hex of the RAW request body,
 * keyed with CALCOM_WEBHOOK_SECRET). Returns false when the secret is not
 * configured (the caller then returns an honest not-configured state) or when
 * the signature does not match - never throws.
 *
 * TODO(relay): confirm the header name (X-Cal-Signature-256) and that the
 * digest is hex-encoded over the exact raw body for this account.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!CALCOM_WEBHOOK_SECRET) return false
  if (!signature) return false

  const expected = crypto
    .createHmac('sha256', CALCOM_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex')

  // Some senders prefix the algorithm (e.g. 'sha256=<hex>'); tolerate both.
  const provided = signature.includes('=') ? signature.split('=').pop()! : signature

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Header names Cal.com may use for the HMAC signature (first match wins). */
export const CALCOM_SIGNATURE_HEADERS = [
  'x-cal-signature-256',
  'x-cal-signature',
] as const

/**
 * Extract the fields Relay needs from a booking.created webhook body. Accepts
 * both the documented casings (BOOKING_CREATED / booking.created) and reads the
 * deal id from booking metadata (set by getBookingLink) with an attendee-email
 * fallback. Returns null when the body is not a booking-created event.
 */
export function parseBookingCreated(body: unknown): ParsedBookingCreated | null {
  if (!body || typeof body !== 'object') return null

  const evt = body as {
    triggerEvent?: string
    type?: string
    payload?: Record<string, unknown>
  }

  const trigger = String(evt.triggerEvent ?? evt.type ?? '').toUpperCase()
  // TODO(relay): confirm the exact trigger string ('BOOKING_CREATED').
  const isCreated =
    trigger === 'BOOKING_CREATED' || trigger === 'BOOKING.CREATED'
  if (!isCreated) return null

  const payload = (evt.payload ?? {}) as Record<string, unknown>

  const uid =
    (payload.uid as string) ??
    (payload.bookingUid as string) ??
    (typeof payload.bookingId !== 'undefined' ? String(payload.bookingId) : null)

  const metadata = (payload.metadata as Record<string, unknown> | undefined) ?? {}
  const dealId =
    (typeof metadata.dealId === 'string' && metadata.dealId) ||
    (typeof metadata.dealid === 'string' && metadata.dealid) ||
    null

  const attendees = Array.isArray(payload.attendees)
    ? (payload.attendees as Array<Record<string, unknown>>)
    : []
  const attendeeEmail =
    (attendees.find((a) => typeof a.email === 'string')?.email as string) ?? null

  const startTime =
    (payload.startTime as string) ??
    (payload.start as string) ??
    null

  return {
    uid: uid ?? null,
    dealId: dealId ?? null,
    attendeeEmail,
    startTime,
  }
}

// ─── Internal ────────────────────────────────────────────────────────────────

function normaliseBooking(raw: unknown): CalcomBooking {
  const b = (raw ?? {}) as Record<string, unknown>
  const attendeesRaw = Array.isArray(b.attendees)
    ? (b.attendees as Array<Record<string, unknown>>)
    : []
  return {
    uid: String(b.uid ?? b.bookingUid ?? b.id ?? ''),
    id: typeof b.id === 'number' ? b.id : undefined,
    status: typeof b.status === 'string' ? b.status : undefined,
    start: (b.start as string) ?? (b.startTime as string) ?? undefined,
    end: (b.end as string) ?? (b.endTime as string) ?? undefined,
    attendees: attendeesRaw.map((a) => ({
      name: String(a.name ?? ''),
      email: String(a.email ?? ''),
      timeZone: typeof a.timeZone === 'string' ? a.timeZone : undefined,
    })),
    metadata: (b.metadata as Record<string, string>) ?? undefined,
  }
}

export { NOT_CONFIGURED as CALCOM_NOT_CONFIGURED, WEBHOOK_NOT_CONFIGURED as CALCOM_WEBHOOK_NOT_CONFIGURED }
