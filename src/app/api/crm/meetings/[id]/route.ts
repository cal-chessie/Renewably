import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

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

// ── Validation ───────────────────────────────────────────────────────────────

const updateMeetingBody = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  date: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  meetingType: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

// ── GET: Single meeting ─────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: activity, error } = await supabase
      .from('deal_activities')
      .select(SELECT_WITH_JOINS)
      .eq('id', id)
      .eq('type', 'meeting')
      .single()

    if (error || !activity) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json({ meeting: formatMeeting(activity as RawActivity) })
  } catch (error) {
    logger.error('Get meeting error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH: Update meeting ───────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`meetings_update:${getClientIp(request)}`, {
      maxAttempts: 20,
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

    let body: z.infer<typeof updateMeetingBody>
    try {
      body = updateMeetingBody.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map(e => ({ field: e.path.join('.'), message: e.message })),
          },
          { status: 400 }
        )
      }
      throw error
    }

    const supabase = createServiceClient()

    // Fetch existing activity to merge content metadata
    const { data: existing, error: fetchError } = await supabase
      .from('deal_activities')
      .select('id, type, content')
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

    // Merge updated fields into metadata
    if (body.description !== undefined) meta.description = body.description
    if (body.meetingType !== undefined) meta.meetingType = body.meetingType
    if (body.status !== undefined) meta.status = body.status
    if (body.contactId !== undefined) meta.contactId = body.contactId
    if (body.companyId !== undefined) meta.companyId = body.companyId
    if (body.notes !== undefined) meta.notes = body.notes

    // Build update payload
    const updateData: Record<string, unknown> = {
      content: JSON.stringify(meta),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.date !== undefined) updateData.created_at = body.date
    if (body.assignedTo !== undefined) updateData.user_id = body.assignedTo ?? null
    if (body.dealId !== undefined) updateData.deal_id = body.dealId ?? null

    const { data: activity, error } = await supabase
      .from('deal_activities')
      .update(updateData)
      .eq('id', id)
      .select(SELECT_WITH_JOINS)
      .single()

    if (error) {
      logger.error('Meeting update DB error', { error: error.message, code: error.code, id })
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to update meeting', details: error.message },
        { status: 400 }
      )
    }

    if (!activity) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json({ meeting: formatMeeting(activity as RawActivity) })
  } catch (error) {
    logger.error('Update meeting error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE: Delete meeting ──────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`meetings_delete:${getClientIp(request)}`, {
      maxAttempts: 20,
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

    const { error } = await supabase
      .from('deal_activities')
      .delete()
      .eq('id', id)
      .eq('type', 'meeting')

    if (error) {
      logger.error('Meeting delete DB error', { error: error.message, code: error.code, id })
      return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete meeting error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
