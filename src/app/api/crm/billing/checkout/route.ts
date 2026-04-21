// ============================================================================
// RENEWABLY.IE — CRM BILLING: CHECKOUT SESSION
// ============================================================================
// POST /api/crm/billing/checkout
// Creates a Stripe Checkout Session for an installer's subscription.
// Body: { installerId, planId }
// Returns: { checkoutUrl }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { getOrCreateCustomer, createCheckoutSession, getPriceIdForPlan } from '@/lib/stripe'
import { logger } from '@/lib/logger'

const VALID_PLANS = ['starter', 'pro', 'enterprise'] as const

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`billing-checkout:${ip}`, { maxAttempts: 5, windowMs: 300_000 })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const { installerId, planId } = body

    if (!installerId || typeof installerId !== 'string') {
      return NextResponse.json({ error: 'installerId is required' }, { status: 400 })
    }

    if (!isValidUuid(installerId)) {
      return NextResponse.json({ error: 'Invalid installerId format' }, { status: 400 })
    }

    if (!planId || !VALID_PLANS.includes(planId)) {
      return NextResponse.json(
        { error: `planId must be one of: ${VALID_PLANS.join(', ')}` },
        { status: 400 },
      )
    }

    // Look up the installer profile from the database
    const supabase = createServiceClient()
    const { data: installer, error: fetchError } = await supabase
      .from('installer_profiles')
      .select('*')
      .eq('id', installerId)
      .single()

    if (fetchError || !installer) {
      return NextResponse.json({ error: 'Installer profile not found' }, { status: 404 })
    }

    // Get or create a Stripe customer
    const customerEmail = installer.email
    const customerName = installer.contact_name

    const customer = await getOrCreateCustomer({
      email: customerEmail,
      name: customerName,
      existingStripeId: installer.stripe_customer_id as string | undefined,
    })

    // Persist the Stripe customer ID on the installer profile if new
    const stripeId = installer.stripe_customer_id as string | undefined
    if (!stripeId || stripeId !== customer.id) {
      await supabase
        .from('installer_profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', installer.id)
    }

    // Map planId to Stripe price ID
    const priceId = getPriceIdForPlan(planId)

    // Build success and cancel URLs (relative to the CRM origin)
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const successUrl = `${origin}/crm/installers?billing=success&installer=${installerId}`
    const cancelUrl = `${origin}/crm/installers?billing=cancelled&installer=${installerId}`

    // Create the Stripe Checkout Session
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      installerId: installer.id,
      successUrl,
      cancelUrl,
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    logger.error('Billing checkout error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
