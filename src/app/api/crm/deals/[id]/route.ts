import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { updateDealSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'
import { sendStageChangeEmail, sendWelcomeEmail, sendProposalEmail, sendInternalNotification, isPostmarkConfigured } from '@/lib/postmark'

const STAGE_NAMES: Record<string, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  discovery_call: 'Discovery',
  demo_booked: 'Demo Booked',
  demo_done: 'Demo Done',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

// PATCH: Update deal (pipeline drag-and-drop, field edits)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`deals_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    let body: z.infer<typeof updateDealSchema>
    try {
      body = updateDealSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    const updateData: Record<string, unknown> = {}

    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.mrr !== undefined) updateData.mrr = body.mrr
    if (body.setupFee !== undefined) updateData.setup_fee = body.setupFee
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.assignedToId !== undefined) updateData.assigned_to_id = body.assignedToId || null
    if (body.value !== undefined) updateData.value = body.value
    if (body.qualifiedAnswers !== undefined) updateData.qualified_answers = body.qualifiedAnswers || null
    if (body.demoOutcome !== undefined) updateData.demo_outcome = body.demoOutcome || null
    if (body.closeReason !== undefined) updateData.close_reason = body.closeReason || null
    // next_touch (date) is the only real column here. `outcome` and `demoAt`
    // are NOT columns on deals; they are recorded as deal_activities after the
    // update (see below). Booking a demo also sets the follow-up date.
    if (body.nextTouch !== undefined) updateData.next_touch = body.nextTouch || null
    if (body.demoAt) {
      const d = new Date(body.demoAt)
      if (!isNaN(d.getTime())) updateData.next_touch = d.toISOString().slice(0, 10)
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Update deal DB error', { error: error.message, code: error.code, id })
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update deal', details: error.message }, { status: 400 })
    }

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Cockpit actions recorded as activities. deal_activities has real columns
    // (deals has no `outcome`/`demo_at`). Secondary effects: logged on failure,
    // never fail the request.
    const activityRows: Array<Record<string, unknown>> = []
    if (body.outcome) {
      activityRows.push({ deal_id: id, user_id: user.id, type: 'call_outcome', title: 'Call outcome logged', content: body.outcome, created_at: new Date().toISOString() })
    }
    if (body.demoAt) {
      activityRows.push({ deal_id: id, user_id: user.id, type: 'demo_booked', title: 'Demo booked', content: `Demo booked for ${body.demoAt}`, created_at: new Date().toISOString() })
    }
    if (activityRows.length > 0) {
      const { error: actErr } = await supabase.from('deal_activities').insert(activityRows)
      if (actErr) logger.warn('Deal activity log failed (non-fatal)', { error: actErr.message, dealId: id })
    }

    // Won -> client: mark the company a client via the real `status` column
    // (companies has no client_since). Secondary effect, logged on failure.
    if (body.stage === 'closed_won' && deal.company_id) {
      const { error: statusErr } = await supabase
        .from('companies')
        .update({ status: 'client' })
        .eq('id', deal.company_id)
      if (statusErr) {
        logger.warn('Won->client: failed to set companies.status=client (non-fatal)', {
          error: statusErr.message,
          companyId: deal.company_id,
          dealId: id,
        })
      }
    }

    // ─── Postmark: Stage change email ────────────────────────────────────────
    if (body.stage !== undefined && isPostmarkConfigured()) {
      const stageName = STAGE_NAMES[body.stage] || body.stage

      // Fetch company + decision maker for the email.
      // `deals -> companies` is a real FK and embeds. Contacts, however, have NO
      // FK to `deals` (contacts.company_id references companies, not deals), so
      // `contacts!company_id` off `deals` is an invalid embed — look them up
      // separately by company_id and stitch the decision maker in code.
      const emailClient = createServiceClient()
      emailClient
        .from('deals')
        .select(`
          company_id,
          companies!company_id(id, name)
        `)
        .eq('id', id)
        .single()
        .then(async ({ data: enriched }) => {
          if (!enriched?.companies) return
          const company = enriched.companies as any
          const { data: contactsData } = await emailClient
            .from('contacts')
            .select('id, name, email, is_decision_maker, do_not_email')
            .eq('company_id', (enriched as any).company_id)
          const contacts = (contactsData || []) as any[]
          const dm = contacts.find(c => c.is_decision_maker) || contacts[0]
          if (!dm?.email) return
          if (dm.do_not_email) return // respect do_not_email: never auto-email these contacts

          try {
            await sendStageChangeEmail({
              to: dm.email,
              companyName: company.name,
              contactName: dm.name,
              productName: deal.product || 'Relay',
              stageName,
              dealId: id,
              companyId: company.id,
              contactId: dm.id,
              userId: user.id,
              dealValue: deal.value ?? undefined,
              mrr: deal.mrr ?? undefined,
            })
          } catch (err) {
            logger.warn('Postmark deal stage email failed (non-fatal)', {
              error: err instanceof Error ? err.message : String(err),
              dealId: id,
            })
          }
        })

      // Internal notification for closed_won / closed_lost
      if (body.stage === 'closed_won' || body.stage === 'closed_lost') {
        sendInternalNotification({
          to: 'cal@renewably.ie',
          title: body.stage === 'closed_won' ? 'Deal Won' : 'Deal Lost',
          message: `Deal ${id} moved to ${stageName}. Product: ${deal.product || 'N/A'}, Value: €${(deal.value || 0).toLocaleString()}.`,
          type: body.stage === 'closed_won' ? 'deal_won' : 'deal_lost',
          userId: user.id,
          dealId: id,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ deal })
  } catch (error) {
    logger.error('Update deal error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Single deal
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

    // Fetch deal (with company + nested contacts, both real FKs) and activities
    // in parallel. `profiles` is not a table here and has no FK from
    // `deals.assigned_to_id` or `deal_activities.user_id`, so those embeds are
    // dropped; owner/author names are resolved by a separate lookup and stitched
    // in code (degrading to null when no profiles row exists).
    const [dealRes, activitiesRes] = await Promise.all([
      supabase
        .from('deals')
        .select(`
          *,
          companies!company_id(id, name, counties, status, website, logo_url,
            contacts(id, name, email, phone, role, is_decision_maker)
          )
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('deal_activities')
        .select('id, type, title, content, created_at, user_id')
        .eq('deal_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (dealRes.error || !dealRes.data) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const deal = dealRes.data
    const rawActivities = activitiesRes.data || []

    // Resolve user/owner names separately — no profiles FK/embed available.
    const userIds = [
      ...new Set(
        [
          deal.assigned_to_id as string | null,
          ...rawActivities.map((a: any) => a.user_id as string | null),
        ].filter(Boolean) as string[]
      ),
    ]
    const userMap: Record<string, { id: string; name: string; avatar: string | null }> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds)
      for (const u of users || []) {
        userMap[u.id] = { id: u.id, name: u.name, avatar: (u as any).avatar ?? null }
      }
    }

    const activities = rawActivities.map((a: any) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      content: a.content,
      createdAt: a.created_at,
      user: a.user_id ? userMap[a.user_id] ?? null : null,
    }))

    const company = deal.companies ? {
      id: deal.companies.id,
      name: deal.companies.name,
      counties: deal.companies.counties,
      status: deal.companies.status,
      website: deal.companies.website,
      logoUrl: deal.companies.logo_url,
      contacts: (deal.companies.contacts || []).map((c: any) => ({
        id: c.id, name: c.name, email: c.email, phone: c.phone, role: c.role,
        isDecisionMaker: c.is_decision_maker,
      })),
    } : null

    const assignedTo = deal.assigned_to_id ? userMap[deal.assigned_to_id as string] ?? null : null

    return NextResponse.json({
      deal: {
        id: deal.id,
        companyId: deal.company_id,
        product: deal.product,
        mrr: deal.mrr,
        setupFee: deal.setup_fee,
        stage: deal.stage,
        value: deal.value,
        notes: deal.notes,
        qualifiedAnswers: deal.qualified_answers,
        demoOutcome: deal.demo_outcome,
        closeReason: deal.close_reason,
        assignedTo,
        company,
        activities,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
      },
    })
  } catch (error) {
    logger.error('Deal detail error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`deals_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Delete deal DB error', { error: error.message, code: error.code, id })
      return NextResponse.json({ error: 'Failed to delete deal' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete deal error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
