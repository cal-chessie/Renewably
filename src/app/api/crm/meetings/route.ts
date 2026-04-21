import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
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

// ── Validation ───────────────────────────────────────────────────────────────

const createMeetingBody = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  endDate: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  meetingType: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

// ── GET: List meetings ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`meetings_list:${getClientIp(request)}`, {
      maxAttempts: 30,
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const contactId = searchParams.get('contactId')
    const meetingType = searchParams.get('meetingType')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit') || '0'), 100)

    const supabase = createServiceClient()
    const from = (page - 1) * limit
    const to = page * limit - 1

    // Build the base query
    let query = supabase
      .from('deal_activities')
      .select(
        'id, type, title, content, created_at, deal_id, user_id, deal:deals(id, stage, product, value, company:companies(id, name, status)), user:profiles(id, name)',
        { count: 'exact' }
      )
      .eq('type', 'meeting')
      .order('created_at', { ascending: false })
      .range(from, to)

    // Apply date range filters on created_at
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Client-side filtering for status, contactId, meetingType (stored in JSON content)
    // We apply them post-fetch since they are inside the content JSON field

    const { data: activities, error, count } = await query

    if (error) {
      logger.error('Meetings list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
    }

    let meetings = (activities ?? []).map((a) => formatMeeting(a as unknown as RawActivity))

    // Apply JSON-content filters client-side
    if (status) {
      meetings = meetings.filter(m => m.status === status)
    }
    if (meetingType) {
      meetings = meetings.filter(m => m.meetingType === meetingType)
    }
    if (contactId) {
      if (!isValidUuid(contactId)) {
        return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
      }
      meetings = meetings.filter(m => m.contactId === contactId)
    }

    const total = count ?? 0

    return NextResponse.json({
      meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Meetings list error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST: Create meeting ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`meetings_create:${getClientIp(request)}`, {
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

    let body: z.infer<typeof createMeetingBody>
    try {
      body = createMeetingBody.parse(await request.json())
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

    // Validate deal exists if provided
    if (body.dealId && isValidUuid(body.dealId)) {
      const { data: deal } = await supabase
        .from('deals')
        .select('id')
        .eq('id', body.dealId)
        .single()
      if (!deal) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      }
    }

    // Build the metadata stored in content
    const metadata: MeetingMetadata = {
      description: body.description ?? null,
      meetingType: body.meetingType ?? 'meeting',
      status: body.status ?? 'scheduled',
      contactId: body.contactId ?? null,
      companyId: body.companyId ?? null,
      notes: body.notes ?? null,
    }

    // Insert into deal_activities
    const { data: activity, error } = await supabase
      .from('deal_activities')
      .insert({
        type: 'meeting',
        title: body.title,
        content: JSON.stringify(metadata),
        deal_id: body.dealId ?? null,
        user_id: body.assignedTo ?? user.id,
        created_at: body.date,
      })
      .select(
        'id, type, title, content, created_at, deal_id, user_id, deal:deals(id, stage, product, value, company:companies(id, name, status)), user:profiles!user_id(id, name)'
      )
      .single()

    if (error) {
      logger.error('Meeting create DB error', { error: error.message, code: error.code })
      return NextResponse.json(
        { error: 'Failed to create meeting', details: error.message },
        { status: 400 }
      )
    }

    const meeting = formatMeeting(activity as unknown as RawActivity)

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    logger.error('Create meeting error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
