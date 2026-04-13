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
import { createPortalSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { installerId } = body

    if (!installerId || typeof installerId !== 'string') {
      return NextResponse.json({ error: 'installerId is required' }, { status: 400 })
    }

    // Look up the installer profile
    const installer = await db.installerProfile.findUnique({
      where: { id: installerId },
      select: {
        id: true,
        stripeCustomerId: true,
      },
    })

    if (!installer) {
      return NextResponse.json({ error: 'Installer profile not found' }, { status: 404 })
    }

    if (!installer.stripeCustomerId) {
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
      customerId: installer.stripeCustomerId,
      returnUrl,
    })

    return NextResponse.json({
      portalUrl: session.url,
    })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
