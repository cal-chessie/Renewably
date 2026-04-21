import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { updateReportSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

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

    let body: z.infer<typeof updateReportSchema>
    try {
      body = updateReportSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }
    const { name, description, type, config, isScheduled, schedule } = body

    // Build update data with snake_case column names for Supabase
    const updates: Record<string, unknown> = {}
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (type) updates.type = type
    if (config !== undefined) updates.config = config
    if (isScheduled !== undefined) updates.is_scheduled = isScheduled
    if (schedule !== undefined) updates.schedule = schedule

    const supabase = createServiceClient()

    let { data: report, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    // If update fails with "column does not exist", retry with safe columns only
    if (error && error.code === '42703') {
      logger.warn('Reports table missing columns — retrying with safe columns only', {
        missingColumns: error.message,
        id,
      })
      const safeUpdates: Record<string, unknown> = {}
      if (name) safeUpdates.name = name
      if (type) safeUpdates.type = type

      const retry = await supabase
        .from('reports')
        .update(safeUpdates)
        .eq('id', id)
        .select('*')
        .single()
      report = retry.data
      error = retry.error
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
