import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// GET: List saved reports
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const reports = await db.report.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { snapshots: true } },
      },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('List reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create/save a report
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { name, description, type, config, isScheduled, schedule } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const report = await db.report.create({
      data: {
        name,
        description: description || null,
        type,
        config: JSON.stringify(config || {}),
        isScheduled: isScheduled || false,
        schedule: schedule || null,
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
