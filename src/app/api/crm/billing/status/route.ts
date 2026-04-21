// ============================================================================
// RENEWABLY.IE — CRM BILLING: SUBSCRIPTION STATUS
// ============================================================================
// GET /api/crm/billing/status?installerId=xxx
// Returns the current billing status for an installer.
// Protected by requireAuth.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const installerId = searchParams.get('installerId')

    if (!installerId) {
      return NextResponse.json({ error: 'installerId query parameter is required' }, { status: 400 })
    }

    if (!isValidUuid(installerId)) {
      return NextResponse.json({ error: 'Invalid installerId format' }, { status: 400 })
    }

    // Fetch the subscription for this installer
    const supabase = createServiceClient()
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('installer_id', installerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError || !subscription) {
      return NextResponse.json({
        subscription: null,
        isActive: false,
        message: 'No subscription found for this installer',
      })
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planId: subscription.plan_id,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
      },
      isActive: subscription.status === 'active' || subscription.status === 'trialing',
    })
  } catch (error) {
    logger.error('Billing status error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Failed to retrieve billing status' }, { status: 500 })
  }
}
