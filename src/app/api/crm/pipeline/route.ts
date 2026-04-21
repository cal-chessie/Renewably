import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { pipelineMoveSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'
import { sendStageChangeEmail, sendWelcomeEmail, sendInternalNotification, isPostmarkConfigured } from '@/lib/postmark'

const PIPELINE_STAGES = [
  { stageKey: 'new_lead', stageName: 'New Lead' },
  { stageKey: 'contacted', stageName: 'Contacted' },
  { stageKey: 'discovery_call', stageName: 'Discovery' },
  { stageKey: 'demo_booked', stageName: 'Demo Booked' },
  { stageKey: 'demo_done', stageName: 'Demo Done' },
  { stageKey: 'proposal_sent', stageName: 'Proposal Sent' },
  { stageKey: 'negotiation', stageName: 'Negotiation' },
  { stageKey: 'closed_won', stageName: 'Closed Won' },
  { stageKey: 'closed_lost', stageName: 'Closed Lost' },
] as const

function computeDaysInStage(updatedAt: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - updatedAt.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function computeDealScore(daysInStage: number, stageIndex: number): 'hot' | 'warm' | 'cold' {
  if (daysInStage <= 3 && stageIndex >= 3) return 'hot'
  if (daysInStage <= 7) return 'warm'
  if (daysInStage > 14 && stageIndex <= 2) return 'cold'
  return 'warm'
}

/* ------------------------------------------------------------------ */
/*  Raw Supabase row shape (snake_case)                               */
/* ------------------------------------------------------------------ */
interface RawContact {
  id: string
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  role: string | null
  is_decision_maker: boolean | null
}

interface RawCompany {
  id: string
  name: string
  counties: string[] | null
  status: string | null
  contacts: RawContact[]
}

interface RawActivity {
  id: string
  deal_id: string | null
  user_id: string | null
  type: string | null
  title: string | null
  content: string | null
  created_at: string
  profiles: { id: string; name: string } | null
}

interface RawDeal {
  id: string
  company_id: string | null
  product: string | null
  mrr: number | null
  setup_fee: number | null
  stage: string
  value: number | null
  notes: string | null
  updated_at: string
  created_at: string
  companies: RawCompany | null
  deal_activities: RawActivity[]
}

/* ------------------------------------------------------------------ */
/*  Enrichment helpers – snake_case → camelCase for the frontend      */
/* ------------------------------------------------------------------ */
function mapContact(c: RawContact) {
  return {
    id: c.id,
    companyId: c.company_id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    role: c.role,
    isDecisionMaker: c.is_decision_maker,
  }
}

function mapActivity(a: RawActivity) {
  return {
    id: a.id,
    dealId: a.deal_id,
    userId: a.user_id,
    type: a.type,
    title: a.title,
    content: a.content,
    createdAt: new Date(a.created_at),
    user: a.profiles ? { id: a.profiles.id, name: a.profiles.name } : null,
  }
}

function enrichDeal(raw: RawDeal) {
  const updatedAt = new Date(raw.updated_at)
  const createdAt = new Date(raw.created_at)
  const daysInStage = computeDaysInStage(updatedAt)
  const allStageKeys = PIPELINE_STAGES.map(s => s.stageKey)
  const stageIndex = allStageKeys.indexOf(raw.stage as typeof PIPELINE_STAGES[number]['stageKey'])
  const dealScore = computeDealScore(daysInStage, stageIndex)

  // Sort activities newest-first
  const sortedActivities = [...(raw.deal_activities || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const allContacts = raw.companies?.contacts || []
  const decisionMakerRaw =
    allContacts.find(c => c.is_decision_maker === true) || null

  return {
    id: raw.id,
    companyId: raw.company_id,
    product: raw.product,
    mrr: raw.mrr,
    setupFee: raw.setup_fee,
    stage: raw.stage,
    value: raw.value,
    notes: raw.notes,
    updatedAt,
    createdAt,
    company: raw.companies
      ? {
          id: raw.companies.id,
          name: raw.companies.name,
          counties: raw.companies.counties,
          status: raw.companies.status,
          contacts: allContacts.map(mapContact),
        }
      : null,
    assignedTo: null,
    _count: { activities: sortedActivities.length },
    activities: sortedActivities.slice(0, 1).map(mapActivity),
    daysInStage,
    dealScore,
    lastActivity: sortedActivities[0] ? mapActivity(sortedActivities[0]) : null,
    decisionMaker: decisionMakerRaw ? mapContact(decisionMakerRaw) : null,
  }
}

/* ------------------------------------------------------------------ */
/*  Shared Supabase select string for deal enrichment                 */
/* ------------------------------------------------------------------ */
const DEAL_ENRICH_SELECT = `
  id, company_id, product, mrr, setup_fee, stage, value, notes, updated_at, created_at,
  companies!company_id (
    id, name, counties, status,
    contacts!company_id (id, company_id, name, email, phone, role, is_decision_maker)
  ),
  deal_activities!deal_id (
    id, deal_id, user_id, type, title, content, created_at,
    profiles!user_id (id, name)
  )
`

/* ------------------------------------------------------------------ */
/*  GET /api/crm/pipeline                                             */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`pipeline:${getClientIp(request)}`, {
      maxAttempts: 30,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
          },
        },
      )
    }

    const { searchParams } = new URL(request.url)
    const includeClosed = searchParams.get('includeClosed') === 'true'
    const search = searchParams.get('search')?.trim() || ''
    const product = searchParams.get('product')?.trim() || ''

    const supabase = createServiceClient()

    const pipelineStageKeys = includeClosed
      ? PIPELINE_STAGES.map(s => s.stageKey)
      : PIPELINE_STAGES.filter(s => s.stageKey !== 'closed_won' && s.stageKey !== 'closed_lost').map(s => s.stageKey)

    let query = supabase
      .from('deals')
      .select(DEAL_ENRICH_SELECT)
      .in('stage', pipelineStageKeys)
      .order('updated_at', { ascending: false })
      .limit(500)

    if (product && product !== 'all') {
      query = query.eq('product', product)
    }

    const { data: rawDeals, error } = await query

    if (error) {
      logger.error('Pipeline Supabase query error', {
        error: error.message,
        code: error.code,
        details: error.details,
      })
      return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 })
    }

    // Company-name search must be applied client-side because it targets the
    // joined companies table (PostgREST can't filter on nested relations).
    const filteredDeals = search
      ? (rawDeals || []).filter(d =>
          (d.companies as any[])[0]?.name?.toLowerCase().includes(search.toLowerCase()),
        )
      : rawDeals || []

    const enrichedDeals = filteredDeals.map((d) => enrichDeal(d as unknown as RawDeal))

    const visibleStages = includeClosed
      ? PIPELINE_STAGES
      : PIPELINE_STAGES.filter(s => s.stageKey !== 'closed_won' && s.stageKey !== 'closed_lost')

    const stages = visibleStages.map(stageDef => ({
      stageKey: stageDef.stageKey,
      stageName: stageDef.stageName,
      deals: enrichedDeals.filter(deal => deal.stage === stageDef.stageKey),
    }))

    // ---- Summary statistics ----
    const totalDealCount = enrichedDeals.length
    const totalValue = enrichedDeals.reduce((sum, d) => sum + (d.value || 0), 0)
    const totalMRR = enrichedDeals.reduce((sum, d) => sum + (d.mrr || 0), 0)
    const wonCount = enrichedDeals.filter(d => d.stage === 'closed_won').length
    const avgDaysInPipeline =
      totalDealCount > 0
        ? Math.round(
            enrichedDeals.reduce((sum, d) => sum + d.daysInStage, 0) / totalDealCount,
          )
        : 0

    return NextResponse.json(
      {
        stages,
        summary: {
          totalDeals: totalDealCount,
          totalValue,
          totalMRR,
          wonCount,
          lostCount: 0,
          winRate:
            totalDealCount > 0
              ? Math.round((wonCount / totalDealCount) * 100)
              : 0,
          avgDealSize:
            totalDealCount > 0 ? Math.round(totalValue / totalDealCount) : 0,
          avgDaysInPipeline,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    )
  } catch (error) {
    logger.error('Pipeline error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/crm/pipeline                                             */
/* ------------------------------------------------------------------ */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`pipeline_move:${getClientIp(request)}`, {
      maxAttempts: 30,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
          },
        },
      )
    }

    let body: z.infer<typeof pipelineMoveSchema>
    try {
      body = pipelineMoveSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: formatZodError(error) },
          { status: 400 },
        )
      }
      throw error
    }
    const { dealId, stage } = body

    const supabase = createServiceClient()

    const { data: rawDeal, error } = await supabase
      .from('deals')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', dealId)
      .select(DEAL_ENRICH_SELECT)
      .single()

    if (error || !rawDeal) {
      logger.error('Pipeline update Supabase error', {
        error: error?.message,
        code: error?.code,
        dealId,
      })
      return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
    }

    const enriched = enrichDeal(rawDeal as unknown as RawDeal)

    // ─── Postmark: Trigger stage-change email ────────────────────────────────
    // Fire-and-forget — don't block the response
    const stageName = PIPELINE_STAGES.find(s => s.stageKey === stage)?.stageName || stage
    const company = enriched.company
    const dm = enriched.decisionMaker

    if (company && dm?.email && isPostmarkConfigured()) {
      sendStageChangeEmail({
        to: dm.email,
        companyName: company.name,
        contactName: dm.name,
        productName: enriched.product || 'SolarPilot',
        stageName,
        dealId: dealId,
        companyId: company.id,
        contactId: dm.id,
        userId: user.id,
        dealValue: enriched.value ?? undefined,
        mrr: enriched.mrr ?? undefined,
      }).catch(err => {
        logger.warn('Postmark stage-change email failed (non-fatal)', {
          error: err instanceof Error ? err.message : String(err),
          dealId,
          stage,
        })
      })
    }

    // Internal notification for closed_won
    if (stage === 'closed_won' && isPostmarkConfigured()) {
      sendInternalNotification({
        to: 'hello@renewably.ie',
        title: `Deal Won: ${company?.name || 'Unknown'}`,
        message: `Deal ${dealId} for ${company?.name || 'Unknown'} (${enriched.product}) moved to Closed Won. Value: €${(enriched.value || 0).toLocaleString()}, MRR: €${(enriched.mrr || 0).toLocaleString()}/mo.`,
        type: 'deal_won',
        userId: user.id,
        dealId,
        companyId: company?.id,
      }).catch(err => {
        logger.warn('Postmark internal notification failed (non-fatal)', {
          error: err instanceof Error ? err.message : String(err),
          dealId,
        })
      })

      // Also send welcome email to the client
      if (dm?.email) {
        sendWelcomeEmail({
          to: dm.email,
          companyName: company?.name || '',
          contactName: dm.name,
          productName: enriched.product || 'SolarPilot',
          dealId,
          companyId: company?.id || dealId,
          contactId: dm.id,
          userId: user.id,
        }).catch(err => {
          logger.warn('Postmark welcome email failed (non-fatal)', {
            error: err instanceof Error ? err.message : String(err),
            dealId,
          })
        })
      }
    }

    // Log activity in deal_activities (non-blocking)
    try {
      const activityClient = createServiceClient()
      await activityClient.from('deal_activities').insert({
        deal_id: dealId,
        user_id: user.id,
        type: 'stage_change',
        title: `Stage changed to ${stageName}`,
        content: `Moved from previous stage to ${stageName}`,
        created_at: new Date().toISOString(),
      })
    } catch { /* non-fatal: activity log is best-effort */ }

    return NextResponse.json({ deal: enriched })
  } catch (error) {
    logger.error('Pipeline update error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
