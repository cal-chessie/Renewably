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
    const { to, subject, body: emailBody, contactId } = body

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'To, subject, and body are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Create the email activity
    const activity = await db.activity.create({
      data: {
        type: 'email',
        subject: `${subject} → ${to}`,
        description: emailBody,
        status: 'completed',
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
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Failed to log email' },
      { status: 500 }
    )
  }
}
