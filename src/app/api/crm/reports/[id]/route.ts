import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// Minimal schema — camelCase from frontend, converted to snake_case for Supabase
const updateBodySchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  type: z.string().min(1).max(100).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  isScheduled: z.boolean().optional(),
  schedule: z.string().max(500).optional(),
})

// GET: Fetch a single report by ID
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

    const supabase = createServiceClient()

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Get report error from Supabase', { error: error.message, code: error.code, id })
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    logger.error('Get report error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update a report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`reports_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = updateBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 },
      )
    }
    const { name, description, type, config, isScheduled, schedule } = parsed.data

    // Build full updates map (camelCase → snake_case)
    const fullUpdates: Record<string, unknown> = {}
    if (name) fullUpdates.name = name
    if (description !== undefined) fullUpdates.description = description
    if (type) fullUpdates.type = type
    if (config !== undefined) fullUpdates.config = config
    if (isScheduled !== undefined) fullUpdates.is_scheduled = isScheduled
    if (schedule !== undefined) fullUpdates.schedule = schedule

    // Build minimal updates map (only columns that definitely exist)
    const minimalUpdates: Record<string, unknown> = {}
    if (name) minimalUpdates.name = name
    if (type) minimalUpdates.type = type

    const supabase = createServiceClient()

    // Try full update first
    let report, error

    const fullResult = await supabase
      .from('reports')
      .update(fullUpdates)
      .eq('id', id)
      .select('*')
      .single()

    if (fullResult.error && (fullResult.error.code === '42703' || fullResult.error.message?.includes('column'))) {
      // Column doesn't exist — fall back to minimal update
      logger.warn('Reports table missing optional columns, falling back to minimal update', {
        code: fullResult.error.code,
        message: fullResult.error.message,
        id,
      })
      const minimalResult = await supabase
        .from('reports')
        .update(minimalUpdates)
        .eq('id', id)
        .select('*')
        .single()
      report = minimalResult.data
      error = minimalResult.error
    } else {
      report = fullResult.data
      error = fullResult.error
    }

    if (error) {
      logger.error('Update report error from Supabase', { error: error.message, code: error.code, id })
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    logger.error('Update report error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`reports_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Delete report error from Supabase', { error: error.message, code: error.code, id })
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete report error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
