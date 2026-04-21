// ============================================================================
// RENEWABLY.IE — CRM BILLING: WEBHOOK HANDLER
// ============================================================================
// POST /api/crm/billing/webhook
// Receives Stripe webhook events and syncs the Subscription table.
// This route is EXEMPT from requireAuth — Stripe sends the webhook directly.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyWebhook, getStripe } from '@/lib/stripe'
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
    const supabase = createServiceClient()

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

        const stripe = getStripe()
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Upsert the Subscription record
        const sub = stripeSubscription as unknown as {
          status: string
          current_period_start: number
          current_period_end: number
          items: { data: Array<{ price: { recurring: { interval: string } } | null }> }
          metadata: { planId?: string } | null
        }

        const billingCycle = sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly'
        const status = mapSubscriptionStatus(sub.status)
        const currentPeriodStart = new Date(sub.current_period_start * 1000).toISOString()
        const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString()

        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('installer_id', installerId)
          .limit(1)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('subscriptions')
            .update({
              status,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              billing_cycle: billingCycle,
            })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('subscriptions')
            .insert({
              installer_id: installerId,
              plan_id: sub.metadata?.planId || 'pro',
              status,
              billing_cycle: billingCycle,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              stripe_subscription_id: subscriptionId,
            })
        }

        // Save the Stripe customer ID on the installer profile
        await supabase
          .from('installer_profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', installerId)

        break
      }

      // ---------------------------------------------------------------
      // Subscription updated — sync status and period dates
      // ---------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as unknown as {
          status: string
          current_period_start: number
          current_period_end: number
          items: { data: Array<{ price: { recurring: { interval: string } } | null }> }
          metadata: { planId?: string; installerId?: string } | null
        }
        const installerId = subscription.metadata?.installerId

        if (!installerId) break

        const billingCycle = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly'
        const status = mapSubscriptionStatus(subscription.status)
        const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString()
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('installer_id', installerId)
          .limit(1)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('subscriptions')
            .update({
              status,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              billing_cycle: billingCycle,
            })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('subscriptions')
            .insert({
              installer_id: installerId,
              plan_id: subscription.metadata?.planId || 'pro',
              status,
              billing_cycle: billingCycle,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
            })
        }

        break
      }

      // ---------------------------------------------------------------
      // Subscription deleted — mark as cancelled
      // ---------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as unknown as {
          status: string
          current_period_start: number
          current_period_end: number
          items: { data: Array<{ price: { recurring: { interval: string } } | null }> }
          metadata: { planId?: string; installerId?: string } | null
        }
        const installerId = subscription.metadata?.installerId

        if (!installerId) break

        const billingCycle = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly'
        const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString()
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('installer_id', installerId)
          .limit(1)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('subscriptions')
            .insert({
              installer_id: installerId,
              plan_id: subscription.metadata?.planId || 'pro',
              status: 'canceled',
              billing_cycle: billingCycle,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
            })
        }

        break
      }

      // ---------------------------------------------------------------
      // Invoice payment failed — mark as past_due
      // ---------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as {
          subscription: string | null
        }
        const subscriptionId = invoice.subscription

        if (!subscriptionId) break

        const stripe = getStripe()
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
          status: string
          metadata: { installerId?: string } | null
        }
        const installerId = stripeSubscription.metadata?.installerId

        if (!installerId) break

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('installer_id', installerId)

        break
      }

      // ---------------------------------------------------------------
      // Invoice payment succeeded — mark as active
      // ---------------------------------------------------------------
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as unknown as {
          subscription: string | null
        }
        const subscriptionId = invoice.subscription

        if (!subscriptionId) break

        const stripe = getStripe()
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
          status: string
          current_period_start: number
          current_period_end: number
          metadata: { installerId?: string } | null
        }
        const installerId = stripeSubscription.metadata?.installerId

        if (!installerId) break

        await supabase
          .from('subscriptions')
          .update({
            status: mapSubscriptionStatus(stripeSubscription.status),
            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          })
          .eq('installer_id', installerId)

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
