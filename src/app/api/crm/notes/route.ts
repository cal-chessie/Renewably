import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: List notes
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId') || ''
    const dealId = searchParams.get('dealId') || ''
    const companyId = searchParams.get('companyId') || ''

    const where: Record<string, unknown> = {}

    if (contactId) {
      where.contactId = contactId
    }
    if (dealId) {
      where.dealId = dealId
    }
    if (companyId) {
      where.companyId = companyId
    }

    const notes = await db.note.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Notes list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create note
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, contactId, dealId, companyId, taskId } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const note = await db.note.create({
      data: {
        content,
        contactId: contactId || null,
        dealId: dealId || null,
        companyId: companyId || null,
        taskId: taskId || null,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        task: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
