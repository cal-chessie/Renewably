// @ts-nocheck — installer routes pending migration to Supabase
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET: Activity timeline for an installer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params

    // Verify installer exists
    const installer = await db.installerProfile.findUnique({
      where: { id },
      select: { id: true, companyId: true, contactId: true, userId: true, companyName: true, onboardingComplete: true, trialStartAt: true, createdAt: true, updatedAt: true },
    })
    if (!installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Generate synthetic onboarding timeline events from the installer profile
    const onboardingEvents: Array<Record<string, unknown>> = []

    onboardingEvents.push({
      id: 'created',
      type: 'system',
      subject: 'Installer profile created',
      description: `${installer.companyName} was added to the platform`,
      createdAt: installer.createdAt,
    })

    if (installer.onboardingComplete) {
      onboardingEvents.push({
        id: 'onboarding-complete',
        type: 'system',
        subject: 'Onboarding completed',
        description: 'All onboarding steps have been finished',
        createdAt: installer.updatedAt,
      })
    }

    if (installer.trialStartAt) {
      onboardingEvents.push({
        id: 'trial-start',
        type: 'system',
        subject: 'Trial period started',
        description: `Trial began on ${installer.trialStartAt.toISOString()}`,
        createdAt: installer.trialStartAt,
      })
    }

    // Sort events
    const sorted = (onboardingEvents as unknown as Array<Record<string, unknown>>).sort(
      (a, b) => new Date(a.createdAt as Date).getTime() - new Date(b.createdAt as Date).getTime()
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
  { params }: { params: Promise<{ id: string }> }
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

    const installer = await db.installerProfile.findUnique({
      where: { id },
      select: { id: true, companyName: true },
    })
    if (!installer) {
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
