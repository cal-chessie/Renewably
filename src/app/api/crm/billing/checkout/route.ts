// ============================================================================
// RENEWABLY.IE — CRM BILLING: CHECKOUT SESSION
// ============================================================================
// POST /api/crm/billing/checkout
// Creates a Stripe Checkout Session for an installer's subscription.
// Body: { installerId, planId }
// Returns: { checkoutUrl }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { getOrCreateCustomer, createCheckoutSession, getPriceIdForPlan } from '@/lib/stripe'

const VALID_PLANS = ['starter', 'pro', 'enterprise'] as const

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { installerId, planId } = body

    if (!installerId || typeof installerId !== 'string') {
      return NextResponse.json({ error: 'installerId is required' }, { status: 400 })
    }

    if (!planId || !VALID_PLANS.includes(planId)) {
      return NextResponse.json(
        { error: `planId must be one of: ${VALID_PLANS.join(', ')}` },
        { status: 400 },
      )
    }

    // Look up the installer profile from the database
    const installer = await db.installerProfile.findUnique({
      where: { id: installerId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        contact: { select: { email: true } },
        subscription: true,
      },
    })

    if (!installer) {
      return NextResponse.json({ error: 'Installer profile not found' }, { status: 404 })
    }

    // Get or create a Stripe customer
    const customerEmail = installer.billingEmail || installer.contact?.email || installer.user.email
    const customerName = installer.contactName || installer.user.name

    const customer = await getOrCreateCustomer({
      email: customerEmail,
      name: customerName,
      existingStripeId: installer.stripeCustomerId,
    })

    // Persist the Stripe customer ID on the installer profile if new
    if (!installer.stripeCustomerId || installer.stripeCustomerId !== customer.id) {
      await db.installerProfile.update({
        where: { id: installer.id },
        data: { stripeCustomerId: customer.id },
      })
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
    console.error('Billing checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
