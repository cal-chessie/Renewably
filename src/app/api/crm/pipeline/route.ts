import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: Pipeline stages with deals
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stages = await db.pipelineStage.findMany({
      where: {},
      orderBy: { order: 'asc' },
      include: {
        deals: {
          include: {
            contact: { select: { id: true, firstName: true, lastName: true, email: true } },
            company: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, avatar: true } },
            tags: { include: { tag: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return NextResponse.json({ stages })
  } catch (error) {
    console.error('Pipeline error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update deal stage (drag & drop)
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dealId, stageId } = body

    if (!dealId || !stageId) {
      return NextResponse.json(
        { error: 'Deal ID and Stage ID are required' },
        { status: 400 }
      )
    }

    const deal = await db.deal.update({
      where: { id: dealId },
      data: { stageId },
      include: {
        stage: true,
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Pipeline update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
