// @ts-nocheck — installer routes pending migration to Supabase
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'

// PUT: Bulk update multiple installers
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Installer IDs are required' }, { status: 400 })
    }

    if (!action || !['change_plan', 'set_onboarding', 'set_status'].includes(action.type)) {
      return NextResponse.json({ error: 'Valid action type is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    switch (action.type) {
      case 'change_plan':
        if (!['starter', 'pro', 'enterprise'].includes(action.value)) {
          return NextResponse.json({ error: 'Invalid plan value' }, { status: 400 })
        }
        updateData.planId = action.value
        break
      case 'set_onboarding':
        const step = parseInt(action.value as string)
        if (isNaN(step) || step < 0 || step > 10) {
          return NextResponse.json({ error: 'Onboarding step must be 0-10' }, { status: 400 })
        }
        updateData.onboardingStep = step
        updateData.onboardingComplete = step === 10
        break
      case 'set_status': {
        // Update subscription status
        const { value: status, installerIds } = action as { value: string; installerIds: string[] }
        if (!['active', 'trialing', 'past_due', 'cancelled'].includes(status)) {
          return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 })
        }
        // Update subscription records for these installers
        await db.subscription.updateMany({
          where: { installerId: { in: ids } },
          data: {
            status,
            ...(status === 'cancelled' ? { cancelledAt: new Date() } : {}),
          },
        })
        return NextResponse.json({
          success: true,
          updated: ids.length,
          message: `Updated subscription status to "${status}" for ${ids.length} installer(s)`,
        })
      }
    }

    const result = await db.installerProfile.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `Updated ${result.count} installer(s)`,
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Bulk delete multiple installers
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Installer IDs are required' }, { status: 400 })
    }

    // Delete installers (cascade handles equipment, documents, subscription)
    const result = await db.installerProfile.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} installer(s)`,
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
