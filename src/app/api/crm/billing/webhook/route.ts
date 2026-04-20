// ============================================================================
// RENEWABLY.IE — CRM BILLING: WEBHOOK HANDLER
// ============================================================================
// POST /api/crm/billing/webhook
// Receives Stripe webhook events and syncs the Subscription table.
// This route is EXEMPT from requireAuth — Stripe sends the webhook directly.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyWebhook } from '@/lib/stripe'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

/**
 * Map a Stripe subscription status to our internal Subscription.status enum.
 */
function mapSubscriptionStatus(stripeStatus: string): string {
  const mapping: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    paused: 'active',   // treat paused as active for our purposes
  }
  return mapping[stripeStatus] || 'active'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const event = verifyWebhook(body, signature)

    // Handle each event type
    switch (event.type) {
      // ---------------------------------------------------------------
      // Checkout completed — activate subscription
      // ---------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const installerId = session.metadata?.installerId
        const stripeCustomerId = session.customer as string

        if (!installerId) break

        // Look up the Stripe subscription attached to this checkout session
        const subscriptionId = session.subscription as string
        if (!subscriptionId) break

        const stripe = (await import('@/lib/stripe')).getStripe()
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Upsert the Subscription record
        await db.subscription.upsert({
          where: { installerId },
          update: {
            status: mapSubscriptionStatus(stripeSubscription.status),
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            billingCycle: stripeSubscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
          },
          create: {
            installerId,
            planId: stripeSubscription.metadata?.planId || 'pro',
            status: mapSubscriptionStatus(stripeSubscription.status),
            billingCycle: stripeSubscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          },
        })

        // Save the Stripe customer ID on the installer profile
        await db.installerProfile.update({
          where: { id: installerId },
          data: { stripeCustomerId },
        })

        break
      }

      // ---------------------------------------------------------------
      // Subscription updated — sync status and period dates
      // ---------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const installerId = subscription.metadata?.installerId

        if (!installerId) break

        await db.subscription.upsert({
          where: { installerId },
          update: {
            status: mapSubscriptionStatus(subscription.status),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            billingCycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
            // If cancel_at_period_end was set, record the cancellation
            cancelledAt: subscription.cancel_at_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
          create: {
            installerId,
            planId: subscription.metadata?.planId || 'pro',
            status: mapSubscriptionStatus(subscription.status),
            billingCycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })

        break
      }

      // ---------------------------------------------------------------
      // Subscription deleted — mark as cancelled
      // ---------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const installerId = subscription.metadata?.installerId

        if (!installerId) break

        await db.subscription.upsert({
          where: { installerId },
          update: {
            status: 'canceled',
            cancelledAt: new Date(),
          },
          create: {
            installerId,
            planId: subscription.metadata?.planId || 'pro',
            status: 'canceled',
            billingCycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelledAt: new Date(),
          },
        })

        break
      }

      // ---------------------------------------------------------------
      // Invoice payment failed — mark as past_due
      // ---------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null

        if (!subscriptionId) break

        // Find our Subscription record by matching the Stripe subscription ID
        // stored in metadata. We look up via the installer profiles.
        // Since we store installerId in Stripe subscription metadata, we
        // need to find the matching subscription. The most reliable way is
        // to look at the invoice's customer and then the linked installer.
        const stripe = (await import('@/lib/stripe')).getStripe()
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
        const installerId = stripeSubscription.metadata?.installerId

        if (!installerId) break

        await db.subscription.updateMany({
          where: { installerId },
          data: { status: 'past_due' },
        })

        break
      }

      // ---------------------------------------------------------------
      // Invoice payment succeeded — mark as active
      // ---------------------------------------------------------------
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null

        if (!subscriptionId) break

        const stripe = (await import('@/lib/stripe')).getStripe()
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
        const installerId = stripeSubscription.metadata?.installerId

        if (!installerId) break

        await db.subscription.updateMany({
          where: { installerId },
          data: {
            status: mapSubscriptionStatus(stripeSubscription.status),
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          },
        })

        break
      }

      default:
        // Unhandled event type — ignore gracefully
        break
    }

    // Always return 200 so Stripe doesn't retry
    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Stripe webhook error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 })
  }
}
