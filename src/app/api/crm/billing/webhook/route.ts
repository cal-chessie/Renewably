// @ts-nocheck — pending migration to Supabase
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
        const sub = stripeSubscription as any
        const existing = await db.subscription.findFirst({ where: { installerId } })
        if (existing) {
          await db.subscription.update({
            where: { id: existing.id },
            data: {
              status: mapSubscriptionStatus(sub.status),
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              billingCycle: sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
            },
          })
        } else {
          await db.subscription.create({
            data: {
              installerId,
              planId: sub.metadata?.planId || 'pro',
              status: mapSubscriptionStatus(sub.status),
              billingCycle: sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          })
        }

        // Save the Stripe customer ID on the installer profile
        await db.installerProfile.update({
          where: { id: installerId },
          data: { stripeCustomerId } as any,
        })

        break
      }

      // ---------------------------------------------------------------
      // Subscription updated — sync status and period dates
      // ---------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const installerId = subscription.metadata?.installerId

        if (!installerId) break

        const existing = await db.subscription.findFirst({ where: { installerId } })
        if (existing) {
          await db.subscription.update({
            where: { id: existing.id },
            data: {
              status: mapSubscriptionStatus(subscription.status),
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              billingCycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
            },
          })
        } else {
          await db.subscription.create({
            data: {
              installerId,
              planId: subscription.metadata?.planId || 'pro',
              status: mapSubscriptionStatus(subscription.status),
              billingCycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })
        }

        break
      }

      // ---------------------------------------------------------------
      // Subscription deleted — mark as cancelled
      // ---------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const installerId = subscription.metadata?.installerId

        if (!installerId) break

        const existing = await db.subscription.findFirst({ where: { installerId } })
        if (existing) {
          await db.subscription.update({
            where: { id: existing.id },
            data: { status: 'canceled' },
          })
        } else {
          await db.subscription.create({
            data: {
              installerId,
              planId: subscription.metadata?.planId || 'pro',
              status: 'canceled',
              billingCycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })
        }

        break
      }

      // ---------------------------------------------------------------
      // Invoice payment failed — mark as past_due
      // ---------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string | null

        if (!subscriptionId) break

        // Find our Subscription record by matching the Stripe subscription ID
        // stored in metadata. We look up via the installer profiles.
        // Since we store installerId in Stripe subscription metadata, we
        // need to find the matching subscription. The most reliable way is
        // to look at the invoice's customer and then the linked installer.
        const stripe = (await import('@/lib/stripe')).getStripe()
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any
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
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string | null

        if (!subscriptionId) break

        const stripe = (await import('@/lib/stripe')).getStripe()
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any
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
