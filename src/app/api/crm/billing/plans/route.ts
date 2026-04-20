// ============================================================================
// RENEWABLY.IE — CRM BILLING: AVAILABLE PLANS
// ============================================================================
// GET /api/crm/billing/plans
// Returns static plan configuration for starter, pro, and enterprise tiers.
// Protected by requireAuth.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { logger } from '@/lib/logger'

interface PlanFeature {
  name: string
  included: boolean
}

interface PlanTier {
  id: string
  name: string
  description: string
  monthlyPrice: number | null
  annualPrice: number | null
  currency: string
  features: PlanFeature[]
  maxLeadsPerMonth: number | null
  highlight: boolean
}

const PLANS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for new installers getting started with lead generation.',
    monthlyPrice: null,
    annualPrice: null,
    currency: 'EUR',
    features: [
      { name: 'Up to 20 leads per month', included: true },
      { name: 'Basic installer profile', included: true },
      { name: 'Email support', included: true },
      { name: 'CRM access', included: true },
      { name: 'Proposal templates', included: false },
      { name: 'Advanced reporting', included: false },
      { name: 'API access', included: false },
    ],
    maxLeadsPerMonth: 20,
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For established installers looking to grow their pipeline.',
    monthlyPrice: null,
    annualPrice: null,
    currency: 'EUR',
    features: [
      { name: 'Up to 100 leads per month', included: true },
      { name: 'Enhanced installer profile', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Full CRM access', included: true },
      { name: 'Proposal templates', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'API access', included: false },
    ],
    maxLeadsPerMonth: 100,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large installation companies with high-volume needs.',
    monthlyPrice: null,
    annualPrice: null,
    currency: 'EUR',
    features: [
      { name: 'Unlimited leads', included: true },
      { name: 'Premium installer profile', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Full CRM access', included: true },
      { name: 'Proposal templates', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'API access', included: true },
    ],
    maxLeadsPerMonth: null,
    highlight: false,
  },
]

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    return NextResponse.json({ plans: PLANS })
  } catch (error) {
    logger.error('Billing plans error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Failed to retrieve plans' }, { status: 500 })
  }
}
