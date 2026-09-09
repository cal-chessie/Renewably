import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import {
  parseBookingCreated,
  verifyWebhookSignature,
  isCalcomWebhookConfigured,
  CALCOM_SIGNATURE_HEADERS,
  CALCOM_WEBHOOK_NOT_CONFIGURED,
} from '@/lib/calcom'

// ============================================================================
// POST /api/crm/calcom/webhook - Cal.com booking events
// ============================================================================
// On a booking.created event, sets the matching deal's cal_com_booking_id +
// demo_at and moves it to stage 'demo_booked'. The deal is matched by the
// dealId carried in booking metadata (set by getBookingLink) first, then by the
// attendee email -> contact -> most-recent open deal.
//
// ENV-GATED on CALCOM_WEBHOOK_SECRET. Without the secret the request cannot be
// trusted, so the route no-ops honestly with
// { ok: false, reason: 'Cal.com webhook not configured' } - it NEVER fakes a
// booking and NEVER fabricates a deal update (Cal's truth rule).
//
// TODO(relay): verify against a live Cal.com account - the signature header,
// the trigger casing (BOOKING_CREATED), and the payload field names are built
// to Cal.com's DOCUMENTED v2 shape (see src/lib/calcom.ts) but were not
// verified against a live key at build time.
// ============================================================================

// Stages that are still "open" enough to accept a demo booking (most-recent wins).
const OPEN_STAGES = ['new_lead', 'contacted', 'discovery_call', 'demo_booked']

export async function POST(request: NextRequest) {
  // Env gate: no configured secret means we cannot verify the caller.
  if (!isCalcomWebhookConfigured()) {
    return NextResponse.json(
      { ok: false, reason: CALCOM_WEBHOOK_NOT_CONFIGURED },
      { status: 200 },
    )
  }

  // Raw body is required for HMAC verification - read it before parsing.
  const rawBody = await request.text()

  const signature =
    CALCOM_SIGNATURE_HEADERS.map((h) => request.headers.get(h)).find(Boolean) ?? null

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Cal.com webhook: signature verification failed')
    return NextResponse.json({ ok: false, reason: 'Invalid signature' }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: false, reason: 'Invalid JSON body' }, { status: 400 })
  }

  const event = parseBookingCreated(body)
  if (!event) {
    // Some other Cal.com event (booking.cancelled, rescheduled, etc.) - ack, nothing to do here yet.
    return NextResponse.json({ ok: true, handled: false })
  }

  if (!event.uid) {
    logger.warn('Cal.com webhook: booking.created without a uid')
    return NextResponse.json({ ok: true, handled: false, reason: 'No booking uid' })
  }

  try {
    const supabase = createServiceClient()
    const dealId = await resolveDealId(supabase, event.dealId, event.attendeeEmail)

    if (!dealId) {
      logger.warn('Cal.com webhook: no matching deal', {
        bookingUid: event.uid,
        metadataDealId: event.dealId,
        attendeeEmail: event.attendeeEmail,
      })
      // Ack so Cal.com does not retry indefinitely; nothing was fabricated.
      return NextResponse.json({ ok: true, handled: false, reason: 'No matching deal' })
    }

    const updateData: Record<string, unknown> = {
      cal_com_booking_id: event.uid,
      stage: 'demo_booked',
    }
    if (event.startTime) {
      const parsed = new Date(event.startTime)
      if (!Number.isNaN(parsed.getTime())) {
        updateData.demo_at = parsed.toISOString()
        // next_touch is a DATE column - the day of the demo.
        updateData.next_touch = parsed.toISOString().slice(0, 10)
      }
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', dealId)
      .select('id, stage, demo_at, cal_com_booking_id')
      .single()

    if (error || !deal) {
      logger.error('Cal.com webhook: failed to update deal', {
        dealId,
        bookingUid: event.uid,
        error: error?.message,
      })
      // 500 so Cal.com retries a transient DB failure.
      return NextResponse.json({ ok: false, reason: 'Failed to update deal' }, { status: 500 })
    }

    // Best-effort activity log - never block the ack on it.
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        type: 'meeting',
        title: 'Demo booked via Cal.com',
        content: `Booking ${event.uid}${event.startTime ? ` for ${event.startTime}` : ''}`,
        created_at: new Date().toISOString(),
      })
      .then(({ error: actErr }) => {
        if (actErr) {
          logger.warn('Cal.com webhook: activity log failed (non-fatal)', {
            dealId,
            error: actErr.message,
          })
        }
      })

    logger.info('Cal.com webhook: deal moved to demo_booked', {
      dealId,
      bookingUid: event.uid,
      demoAt: updateData.demo_at,
    })

    return NextResponse.json({ ok: true, handled: true, dealId, bookingUid: event.uid })
  } catch (err) {
    logger.error('Cal.com webhook error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ ok: false, reason: 'Webhook processing failed' }, { status: 500 })
  }
}

// ─── Deal matching ────────────────────────────────────────────────────────────

/**
 * Resolve the deal this booking belongs to:
 *  1. metadata dealId (set by getBookingLink) - most reliable.
 *  2. attendee email -> contact -> that contact's most-recent OPEN deal.
 * Returns null when nothing matches (the caller then acks without fabricating).
 */
async function resolveDealId(
  supabase: ReturnType<typeof createServiceClient>,
  metadataDealId: string | null,
  attendeeEmail: string | null,
): Promise<string | null> {
  // 1. Trust the metadata dealId when it is a real, existing deal.
  if (metadataDealId && isValidUuid(metadataDealId)) {
    const { data } = await supabase
      .from('deals')
      .select('id')
      .eq('id', metadataDealId)
      .single()
    if (data?.id) return data.id
  }

  // 2. Fall back to matching the attendee email to a contact, then a deal.
  if (attendeeEmail) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, company_id')
      .ilike('email', attendeeEmail)
      .limit(1)
      .maybeSingle()

    if (contact?.id) {
      // Prefer a deal already tied to this contact.
      const { data: byContact } = await supabase
        .from('deals')
        .select('id, stage, created_at')
        .eq('contact_id', contact.id)
        .in('stage', OPEN_STAGES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (byContact?.id) return byContact.id

      // Else the most recent open deal for the contact's company.
      if (contact.company_id) {
        const { data: byCompany } = await supabase
          .from('deals')
          .select('id, stage, created_at')
          .eq('company_id', contact.company_id)
          .in('stage', OPEN_STAGES)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (byCompany?.id) return byCompany.id
      }
    }
  }

  return null
}
