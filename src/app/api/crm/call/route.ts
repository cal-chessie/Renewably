import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contactId, duration, notes, outcome, subject } = body

    // Build a descriptive subject from available data
    let callSubject = subject || 'Call with contact'
    if (outcome && !subject) {
      callSubject = `Call — ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`
    }

    // Create the call activity
    const activity = await db.activity.create({
      data: {
        type: 'call',
        subject: callSubject,
        description: notes || '',
        status: 'completed',
        duration: duration || null,
        completedAt: new Date(),
        contactId: contactId || null,
        userId: user.id,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Update contact's lastContactAt if contactId provided
    if (contactId) {
      await db.contact.update({
        where: { id: contactId },
        data: { lastContactAt: new Date() },
      }).catch(() => {
        // Contact might not exist — ignore gracefully
      })
    }

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      activity,
    })
  } catch (error) {
    console.error('Call log error:', error)
    return NextResponse.json(
      { error: 'Failed to log call' },
      { status: 500 }
    )
  }
}
