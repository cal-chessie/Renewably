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
      select: { id: true, companyId: true, contactId: true, userId: true, companyName: true },
    })
    if (!installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Fetch activities related to this installer's company, contact, or user
    const activities = await db.activity.findMany({
      where: {
        OR: [
          { companyId: installer.companyId },
          { contactId: installer.contactId },
          { userId: installer.userId },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Also generate synthetic onboarding timeline events from the installer profile
    const installerFull = await db.installerProfile.findUnique({
      where: { id },
      include: { signedDocuments: true, equipment: true, subscription: true },
    })

    const onboardingEvents: Array<Record<string, unknown>> = []
    if (installerFull) {
      onboardingEvents.push({
        id: 'created',
        type: 'system',
        subject: 'Installer profile created',
        description: `${installer.companyName} was added to the platform`,
        createdAt: installerFull.createdAt,
      })

      if (installerFull.onboardingComplete) {
        onboardingEvents.push({
          id: 'onboarding-complete',
          type: 'system',
          subject: 'Onboarding completed',
          description: 'All 10 onboarding steps have been finished',
          createdAt: installerFull.updatedAt,
        })
      }

      if (installerFull.trialStartAt) {
        onboardingEvents.push({
          id: 'trial-start',
          type: 'system',
          subject: 'Trial period started',
          description: `14-day trial began on ${installerFull.trialStartAt.toISOString()}`,
          createdAt: installerFull.trialStartAt,
        })
      }

      for (const doc of installerFull.signedDocuments) {
        if (doc.signedAt) {
          onboardingEvents.push({
            id: `doc-${doc.id}`,
            type: 'system',
            subject: `${doc.docName} signed`,
            description: `Legal document "${doc.docName}" was signed`,
            createdAt: doc.signedAt,
          })
        }
      }

      if (installerFull.subscription) {
        onboardingEvents.push({
          id: `sub-${installerFull.subscription.id}`,
          type: 'system',
          subject: `Subscription ${installerFull.subscription.status}`,
          description: `Subscription status set to ${installerFull.subscription.status}`,
          createdAt: installerFull.subscription.createdAt,
        })
      }
    }

    // Merge and sort all events
    const allEvents = ([
      ...activities.map(a => ({
        id: a.id,
        type: a.type,
        subject: a.subject,
        description: a.description,
        createdAt: a.createdAt,
        userName: a.user?.name || null,
        userAvatar: a.user?.avatar || null,
        contactName: a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : null,
      })),
      ...onboardingEvents.map(e => ({
        ...e,
        userName: null,
        userAvatar: null,
        contactName: null,
      })),
    ] as unknown as Array<Record<string, unknown>>).sort((a, b) => new Date(a.createdAt as Date).getTime() - new Date(b.createdAt as Date).getTime())

    // Apply type filter from query params
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type') || ''
    const filtered = typeFilter
      ? (allEvents as Array<Record<string, unknown>>).filter(e => e.type === typeFilter)
      : allEvents

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
      select: { id: true, companyId: true, contactId: true, companyName: true },
    })
    if (!installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    const activity = await db.activity.create({
      data: {
        type,
        subject,
        description: description || null,
        userId: user.id,
        companyId: installer.companyId,
        contactId: installer.contactId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
