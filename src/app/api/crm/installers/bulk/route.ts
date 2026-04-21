import { createServiceClient } from '@/lib/supabase'
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

    const supabase = createServiceClient()

    switch (action.type) {
      case 'change_plan': {
        if (!['starter', 'pro', 'enterprise'].includes(action.value)) {
          return NextResponse.json({ error: 'Invalid plan value' }, { status: 400 })
        }
        const { error } = await supabase
          .from('installer_profiles')
          .update({ plan_id: action.value })
          .in('id', ids)
        if (error) {
          console.error('Bulk change_plan error:', error)
          return NextResponse.json({ error: 'Failed to update installers' }, { status: 500 })
        }
        return NextResponse.json({
          success: true,
          updated: ids.length,
          message: `Updated plan to "${action.value}" for ${ids.length} installer(s)`,
        })
      }
      case 'set_onboarding': {
        const step = parseInt(action.value as string)
        if (isNaN(step) || step < 0 || step > 10) {
          return NextResponse.json({ error: 'Onboarding step must be 0-10' }, { status: 400 })
        }
        const { error } = await supabase
          .from('installer_profiles')
          .update({
            onboarding_step: step,
            onboarding_complete: step === 10,
          })
          .in('id', ids)
        if (error) {
          console.error('Bulk set_onboarding error:', error)
          return NextResponse.json({ error: 'Failed to update installers' }, { status: 500 })
        }
        return NextResponse.json({
          success: true,
          updated: ids.length,
          message: `Updated onboarding step to ${step} for ${ids.length} installer(s)`,
        })
      }
      case 'set_status': {
        const { value: status } = action as { value: string; installerIds: string[] }
        if (!['active', 'trialing', 'past_due', 'cancelled'].includes(status)) {
          return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 })
        }
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status,
            ...(status === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
          })
          .in('installer_id', ids)
        if (error) {
          console.error('Bulk set_status error:', error)
          return NextResponse.json({ error: 'Failed to update subscriptions' }, { status: 500 })
        }
        return NextResponse.json({
          success: true,
          updated: ids.length,
          message: `Updated subscription status to "${status}" for ${ids.length} installer(s)`,
        })
      }
    }
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

    const supabase = createServiceClient()

    const { error, count } = await supabase
      .from('installer_profiles')
      .delete({ count: 'exact' })
      .in('id', ids)

    if (error) {
      console.error('Bulk delete error:', error)
      return NextResponse.json({ error: 'Failed to delete installers' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: count ?? ids.length,
      message: `Deleted ${count ?? ids.length} installer(s)`,
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
