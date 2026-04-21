// ============================================================================
// RENEWABLY.IE — STRIPE BILLING HELPERS
// ============================================================================
// Singleton Stripe instance + helper functions for checkout, customer
// management, subscription handling, and webhook verification.
// ============================================================================

import Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia' as const,
    })
  }
  return _stripe
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create or retrieve a Stripe Customer.
 * If an existing Stripe customer ID is provided we simply fetch it;
 * otherwise we create a new customer with the given email and name.
 */
export async function getOrCreateCustomer(params: {
  email: string
  name?: string
  existingStripeId?: string | null
}): Promise<Stripe.Customer> {
  const stripe = getStripe()

  // If we already have a Stripe customer ID, retrieve it
  if (params.existingStripeId) {
    try {
      return await stripe.customers.retrieve(params.existingStripeId) as Stripe.Customer
    } catch {
      // Fall through to create a new one if retrieval fails
    }
  }

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name || undefined,
  })

  return customer
}

/**
 * Create a Stripe Checkout Session for an installer subscription.
 */
export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  installerId: string
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: params.customerId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      installerId: params.installerId,
    },
    subscription_data: {
      metadata: {
        installerId: params.installerId,
      },
    },
  })

  return session
}

/**
 * Cancel a Stripe subscription (at period end so the customer keeps access
 * until the current billing period finishes).
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripe()
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Retrieve a Stripe subscription by ID.
 */
export async function getSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripe()
  return stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Verify a Stripe webhook signature and return the parsed event.
 * Throws on invalid signatures.
 */
export function verifyWebhook(rawBody: string, signature: string): Stripe.Event {
  const stripe = getStripe()
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
}

/**
 * Create a Stripe Customer Portal session so the customer can manage their
 * subscription, payment methods, and billing history.
 */
export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe()
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  })
}

// ---------------------------------------------------------------------------
// Plan → Price ID mapping (reads from env vars)
// ---------------------------------------------------------------------------

export function getPriceIdForPlan(planId: string): string {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  }

  const priceId = map[planId]
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${planId}`)
  }

  return priceId
}
