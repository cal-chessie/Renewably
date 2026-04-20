import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// ── Types ────────────────────────────────────────────────────────────────────

interface MeetingMetadata {
  description?: string | null
  meetingType?: string | null
  status?: string | null
  contactId?: string | null
  companyId?: string | null
  notes?: string | null
}

interface RawActivity {
  id: string
  type: string
  title: string
  content: string | null
  created_at: string
  deal_id: string | null
  user_id: string | null
  deal: { id: string; stage: string; product: string | null; value: number | null; company: { id: string; name: string; status: string | null } | null } | null
  user: { id: string; name: string } | null
}

function formatMeeting(raw: RawActivity) {
  let meta: MeetingMetadata = {}
  try {
    meta = raw.content ? JSON.parse(raw.content) : {}
  } catch {
    meta = {}
  }

  const createdAt = new Date(raw.created_at)
  const endDate = new Date(createdAt.getTime() + 60 * 60 * 1000) // +1 hour

  return {
    id: raw.id,
    title: raw.title,
    description: meta.description ?? null,
    date: createdAt.toISOString(),
    endDate: endDate.toISOString(),
    meetingType: meta.meetingType ?? 'meeting',
    status: meta.status ?? 'scheduled',
    contactId: meta.contactId ?? null,
    companyId: meta.companyId ?? null,
    notes: meta.notes ?? null,
    deal: raw.deal
      ? {
          id: raw.deal.id,
          stage: raw.deal.stage,
          product: raw.deal.product,
          value: raw.deal.value,
          company: raw.deal.company ?? null,
        }
      : null,
    company: raw.deal?.company ?? null,
    assignedTo: raw.user
      ? { id: raw.user.id, name: raw.user.name }
      : null,
    createdAt: raw.created_at,
    updatedAt: raw.created_at,
  }
}

const SELECT_WITH_JOINS = 'id, type, title, content, created_at, deal_id, user_id, deal:deals(id, stage, product, value, company:companies(id, name, status)), user:profiles!user_id(id, name)'

// ── POST: Complete meeting ──────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`meeting_complete:${getClientIp(request)}`, {
      maxAttempts: 15,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        }
      )
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch existing activity and verify it is a meeting
    const { data: existing, error: fetchError } = await supabase
      .from('deal_activities')
      .select('id, type, title, content')
      .eq('id', id)
      .eq('type', 'meeting')
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Parse existing metadata
    let meta: MeetingMetadata = {}
    try {
      meta = existing.content ? JSON.parse(existing.content) : {}
    } catch {
      meta = {}
    }

    // Update title with checkmark prefix (avoid double prefix)
    const prefix = '✓ '
    const currentTitle = existing.title.startsWith(prefix)
      ? existing.title
      : `${prefix}${existing.title}`

    // Update metadata status to completed
    meta.status = 'completed'

    // Update the activity
    const { data: activity, error } = await supabase
      .from('deal_activities')
      .update({
        title: currentTitle,
        content: JSON.stringify(meta),
              })
      .eq('id', id)
      .select(SELECT_WITH_JOINS)
      .single()

    if (error) {
      logger.error('Complete meeting DB error', { error: error.message, code: error.code, id })
      return NextResponse.json({ error: 'Failed to complete meeting' }, { status: 400 })
    }

    return NextResponse.json({ meeting: formatMeeting(activity as RawActivity) })
  } catch (error) {
    logger.error('Complete meeting error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
