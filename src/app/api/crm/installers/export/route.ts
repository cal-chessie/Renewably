import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { sanitizeSearchQuery } from '@/lib/crm-validation'

const PLAN_PRICES: Record<string, number> = {
  starter: 1000,
  pro: 1250,
  enterprise: 1500,
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const plan = searchParams.get('plan') || ''
    const onboarding = searchParams.get('onboarding') || ''
    const county = searchParams.get('county') || ''
    const ids = searchParams.get('ids') || ''

    const supabase = createServiceClient()

    // ── Build query ─────────────────────────────────────────────────────
    let query = supabase
      .from('installer_profiles')
      .select(
        '*, profiles!installer_profiles_user_id_fkey(email), contacts(email, phone), companies(website, address, city), subscriptions(status, plan_id, billing_cycle), installer_documents(document_type, signed_at)'
      )
      .order('created_at', { ascending: false })
      .limit(500)

    // ── Apply filters ──────────────────────────────────────────────────
    if (ids) {
      query = query.in('id', ids.split(','))
    } else {
      if (search) {
        const escaped = sanitizeSearchQuery(search)
        query = query.or(
          `company_name.ilike.%${escaped}%,contact_name.ilike.%${escaped}%,email.ilike.%${escaped}%`
        )
      }
      if (plan && ['starter', 'pro', 'enterprise'].includes(plan)) {
        query = query.eq('plan_id', plan)
      }
      if (onboarding === 'complete') {
        query = query.eq('onboarding_complete', true)
      } else if (onboarding === 'incomplete') {
        query = query.eq('onboarding_complete', false)
      }
      if (county) {
        query = query.contains('service_counties', [county])
      }
    }

    const { data: rows, error } = await query

    if (error) {
      logger.error('Export query failed', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to export installers' }, { status: 500 })
    }

    // ── CSV header ──────────────────────────────────────────────────────
    const headers = [
      'Company Name', 'Contact Name', 'Email', 'Phone', 'Plan',
      'Subscription Status', 'Onboarding Step', 'Onboarding Complete',
      'SEAI Registered', 'RECI Registered', 'Team Size', 'Avg Project Value',
      'Counties', 'Equipment Categories', 'MRR', 'Created At',
    ]

    const csvRows = (rows ?? []).map((installer) => {
      const row = installer as Record<string, unknown>

      // ── Parse JSONB service_counties (may already be an array) ────────
      const serviceCountiesRaw = row.service_counties
      const counties: string[] = Array.isArray(serviceCountiesRaw)
        ? serviceCountiesRaw
        : typeof serviceCountiesRaw === 'string'
          ? (() => { try { return JSON.parse(serviceCountiesRaw) } catch { return [] } })()
          : []

      // ── Subscription data (one-to-many, take first) ───────────────────
      const subscriptionRows = (row.subscriptions ?? []) as Record<string, unknown>[]
      const subscription = subscriptionRows[0]
      const subscriptionStatus = (subscription?.status as string) || 'none'
      const subscriptionBillingCycle = (subscription?.billing_cycle as string) || 'monthly'

      // ── Profile email from joined profiles table ──────────────────────
      const profileRow = row.profiles as Record<string, unknown> | null
      const profileEmail = (profileRow?.email as string) || ''

      // ── Contact data from joined contacts table ───────────────────────
      const contactRow = row.contacts as Record<string, unknown> | null
      const contactEmail = (contactRow?.email as string) || ''
      const contactPhone = (contactRow?.phone as string) || ''

      // ── MRR calculation ───────────────────────────────────────────────
      const planId = (row.plan_id as string) || 'pro'
      const basePrice = PLAN_PRICES[planId] || 0
      const mrr = subscriptionBillingCycle === 'annual' ? Math.round(basePrice / 12) : basePrice

      // ── Equipment categories: use installer_documents document_type ──
      const documentRows = (row.installer_documents ?? []) as Record<string, unknown>[]
      const equipmentCategories = [...new Set(documentRows.map(d => d.document_type as string).filter(Boolean))]

      // ── Resolve email and phone ───────────────────────────────────────
      const email = (row.email as string) || profileEmail || contactEmail || ''
      const phone = (row.phone as string) || contactPhone || ''

      return [
        `"${((row.company_name as string) || '').replace(/"/g, '""')}"`,
        `"${((row.contact_name as string) || '').replace(/"/g, '""')}"`,
        email,
        phone,
        planId,
        subscriptionStatus,
        (row.onboarding_step as number) ?? 0,
        (row.onboarding_complete as boolean) ? 'Yes' : 'No',
        (row.seai_registered as boolean) ? 'Yes' : 'No',
        (row.reci_registered as boolean) ? 'Yes' : 'No',
        (row.team_size as number) ?? '',
        (row.avg_project_value as number) ?? '',
        `"${counties.join(', ')}"`,
        `"${equipmentCategories.join(', ')}"`,
        mrr,
        new Date(row.created_at as string).toISOString(),
      ].join(',')
    })

    const csv = [headers.join(','), ...csvRows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="installers-export.csv"',
      },
    })
  } catch (error) {
    logger.error('Export error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
