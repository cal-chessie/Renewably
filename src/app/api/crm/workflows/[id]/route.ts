import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// GET: Get single rule with recent executions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params

    const rule = await db.workflowRule.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Get workflow rule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update rule (toggle active/inactive, or update fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const body = await request.json()

    const existing = await db.workflowRule.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.triggerType !== undefined) updateData.triggerType = body.triggerType
    if (body.triggerConfig !== undefined) updateData.triggerConfig = JSON.stringify(body.triggerConfig)
    if (body.actions !== undefined) updateData.actions = JSON.stringify(body.actions)

    const rule = await db.workflowRule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Update workflow rule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params

    const existing = await db.workflowRule.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    await db.workflowRule.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete workflow rule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
