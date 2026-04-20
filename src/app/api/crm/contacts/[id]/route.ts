import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { updateContactSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// GET: Single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, status: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    logger.error('Contact detail error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`contacts_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = String(body.name)
    if (body.email !== undefined) updateData.email = String(body.email)
    if (body.phone !== undefined) updateData.phone = String(body.phone)
    if (body.jobTitle !== undefined) updateData.jobTitle = String(body.jobTitle)
    if (body.linkedin !== undefined) updateData.linkedin = String(body.linkedin)
    if (body.source !== undefined) updateData.source = String(body.source)
    if (body.status !== undefined) updateData.status = String(body.status)
    if (body.address !== undefined) updateData.address = String(body.address)
    if (body.city !== undefined) updateData.city = String(body.city)
    if (body.country !== undefined) updateData.country = String(body.country)
    if (body.description !== undefined) updateData.description = String(body.description)
    if (body.companyId !== undefined) updateData.companyId = body.companyId || null
    if (body.notes !== undefined) updateData.notes = String(body.notes)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const contact = await db.contact.update({
      where: { id },
      data: updateData,
      include: {
        company: { select: { id: true, name: true, status: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    logger.error('Update contact error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`contacts_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    await db.contact.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete contact error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
