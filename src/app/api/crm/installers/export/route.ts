// @ts-nocheck — installer routes pending migration to Supabase
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'

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

    const where: Record<string, unknown> = {}

    if (ids) {
      where.id = { in: ids.split(',') }
    } else {
      if (search) {
        where.OR = [
          { companyName: { contains: search } },
          { contactName: { contains: search } },
          { user: { email: { contains: search } } },
        ]
      }
      if (plan && ['starter', 'pro', 'enterprise'].includes(plan)) {
        where.planId = plan
      }
      if (onboarding === 'complete') {
        where.onboardingComplete = true
      } else if (onboarding === 'incomplete') {
        where.onboardingComplete = false
      }
      if (county) {
        where.serviceCounties = { contains: county }
      }
    }

    const installers = await db.installerProfile.findMany({
      where,
      include: {
        user: { select: { email: true } },
        contact: { select: { email: true, phone: true } },
        company: { select: { website: true, address: true, city: true } },
        subscription: { select: { status: true, planId: true, billingCycle: true } },
        equipment: { select: { category: true } },
        signedDocuments: { select: { docType: true, signedAt: true } },
        _count: { select: { equipment: true, signedDocuments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit export to 500
    })

    // CSV header
    const headers = [
      'Company Name', 'Contact Name', 'Email', 'Phone', 'Plan',
      'Subscription Status', 'Onboarding Step', 'Onboarding Complete',
      'SEAI Registered', 'RECI Registered', 'Team Size', 'Avg Project Value',
      'Counties', 'Equipment Categories', 'MRR', 'Created At',
    ]

    const rows = installers.map(inst => {
      let counties: string[] = []
      try { counties = JSON.parse(inst.serviceCounties) } catch { /* empty */ }

      const subscription = inst.subscription
      const planId = inst.planId
      const billingCycle = subscription?.billingCycle || 'monthly'
      const basePrice = PLAN_PRICES[planId] || 0
      const mrr = billingCycle === 'yearly' ? Math.round(basePrice / 12) : basePrice

      const equipmentCategories = [...new Set(inst.equipment.map(e => e.category))]
      const email = inst.user?.email || inst.contact?.email || ''
      const phone = inst.contact?.phone || inst.phone || ''

      return [
        `"${(inst.companyName || '').replace(/"/g, '""')}"`,
        `"${(inst.contactName || '').replace(/"/g, '""')}"`,
        email,
        phone,
        planId,
        subscription?.status || 'none',
        inst.onboardingStep,
        inst.onboardingComplete ? 'Yes' : 'No',
        inst.seaiRegistered ? 'Yes' : 'No',
        inst.reciRegistered ? 'Yes' : 'No',
        inst.teamSize || '',
        inst.avgProjectValue || '',
        `"${counties.join(', ')}"`,
        `"${equipmentCategories.join(', ')}"`,
        mrr,
        new Date(inst.createdAt).toISOString(),
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="installers-export.csv"',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
