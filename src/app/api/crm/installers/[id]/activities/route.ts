import { supabase } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET: Activity timeline for an installer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params

    // Verify installer exists
    const { data: installer, error } = await supabase
      .from('installer_profiles')
      .select('id, company_id, contact_id, user_id, company_name, onboarding_complete, trial_start_at, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Generate synthetic onboarding timeline events from the installer profile
    const onboardingEvents: Array<Record<string, unknown>> = []

    onboardingEvents.push({
      id: 'created',
      type: 'system',
      subject: 'Installer profile created',
      description: `${installer.company_name} was added to the platform`,
      createdAt: installer.created_at,
    })

    if (installer.onboarding_complete) {
      onboardingEvents.push({
        id: 'onboarding-complete',
        type: 'system',
        subject: 'Onboarding completed',
        description: 'All onboarding steps have been finished',
        createdAt: installer.updated_at,
      })
    }

    if (installer.trial_start_at) {
      onboardingEvents.push({
        id: 'trial-start',
        type: 'system',
        subject: 'Trial period started',
        description: `Trial began on ${new Date(installer.trial_start_at).toISOString()}`,
        createdAt: installer.trial_start_at,
      })
    }

    // Sort events
    const sorted = onboardingEvents.sort(
      (a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime(),
    )

    // Apply type filter from query params
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type') || ''
    const filtered = typeFilter
      ? sorted.filter(e => e.type === typeFilter)
      : sorted

    return NextResponse.json({ activities: filtered })
  } catch (error) {
    console.error('Activities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new activity for an installer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const body = await request.json()

    const { type, subject, description } = body
    if (!type || !subject) {
      return NextResponse.json({ error: 'Type and subject are required' }, { status: 400 })
    }

    const { data: installer, error } = await supabase
      .from('installer_profiles')
      .select('id, company_name')
      .eq('id', id)
      .single()

    if (error || !installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Return a synthetic activity record (no Activity model in DB)
    const activity = {
      id: Date.now().toString(),
      type,
      subject,
      description: description || null,
      createdAt: new Date(),
      user: { id: user.id, name: (user as Record<string, unknown>).name || null },
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
