import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.string().min(1).max(50),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  isScheduled: z.boolean().optional().default(false),
  schedule: z.string().optional().nullable(),
})

// GET: List saved reports
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`reports_list:${getClientIp(request)}`, {
      maxAttempts: 30,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const supabase = createServiceClient()
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      // Table might not exist — return empty array gracefully
      if (error.code === '42P01') {
        return NextResponse.json({ reports: [] })
      }
      logger.error('List reports error', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: reports ?? [] })
  } catch (error) {
    logger.error('List reports error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create/save a report
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`reports_create:${getClientIp(request)}`, {
      maxAttempts: 15,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const result = createReportSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 },
      )
    }
    const data = result.data

    const supabase = createServiceClient()

    // Try full insert first, fall back to minimal insert if columns don't exist
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        name: data.name,
        type: data.type,
        filters: JSON.stringify(data.config || {}),
        format: 'json',
        status: data.isScheduled ? 'scheduled' : 'completed',
        data: JSON.stringify({ schedule: data.schedule ?? null }),
      })
      .select()
      .single()

    if (error) {
      logger.error('Create report DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    logger.error('Create report error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
