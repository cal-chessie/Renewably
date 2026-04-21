// ============================================================================
// RENEWABLY.IE — CRM BILLING: CUSTOMER PORTAL
// ============================================================================
// POST /api/crm/billing/portal
// Creates a Stripe Customer Portal session so an installer can manage their
// subscription, payment methods, and view invoices.
// Body: { installerId }
// Returns: { portalUrl }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { createPortalSession } from '@/lib/stripe'
import { billingPortalSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`billing_portal:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const parsed = billingPortalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { installerId } = body

    if (!installerId || typeof installerId !== 'string') {
      return NextResponse.json({ error: 'installerId is required' }, { status: 400 })
    }

    if (!isValidUuid(installerId)) {
      return NextResponse.json({ error: 'Invalid installerId format' }, { status: 400 })
    }

    // Look up the installer profile
    const installer = await db.installerProfile.findUnique({
      where: { id: installerId },
    })

    if (!installer) {
      return NextResponse.json({ error: 'Installer profile not found' }, { status: 404 })
    }

    const stripeCustomerId = (installer as Record<string, unknown>).stripeCustomerId as string | undefined

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found for this installer. Please complete checkout first.' },
        { status: 400 },
      )
    }

    // Build return URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const returnUrl = `${origin}/crm/installers?installer=${installerId}`

    // Create the portal session
    const session = await createPortalSession({
      customerId: stripeCustomerId,
      returnUrl,
    })

    return NextResponse.json({
      portalUrl: session.url,
    })
  } catch (error) {
    logger.error('Billing portal error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
