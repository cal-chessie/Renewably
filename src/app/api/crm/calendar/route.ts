import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidActivityType } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`calendar:${getClientIp(request)}`, {
      maxAttempts: 30,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
          },
        },
      )
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const typeFilter = searchParams.get('type')

    // Validate date range
    if (!start || !end) {
      return NextResponse.json(
        { error: 'Missing required query params: start and end (ISO dates)' },
        { status: 400 },
      )
    }

    const startDate = new Date(start)
    const endDate = new Date(end)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO date strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)' },
        { status: 400 },
      )
    }

    // Validate type filter if provided
    if (typeFilter && !isValidActivityType(typeFilter)) {
      return NextResponse.json(
        { error: `Invalid activity type. Valid types: call, email, demo, meeting, note, proposal, task` },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    // Build query — fetch deal_activities with joined deal→company and user→profile
    let query = supabase
      .from('deal_activities')
      .select(
        `
        id,
        type,
        title,
        content,
        created_at,
        deal_id,
        user_id,
        deal:deals(
          id,
          company:companies(id, name)
        ),
        user:profiles!user_id(id, name)
      `,
      )
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true })

    // Apply type filter
    if (typeFilter) {
      query = query.eq('type', typeFilter)
    }

    const { data: activities, error } = await query

    if (error) {
      logger.error('Calendar activities query failed', {
        error: error.message,
        code: error.code,
      })
      return NextResponse.json({ error: 'Failed to fetch calendar activities' }, { status: 500 })
    }

    // Transform raw data into structured calendar events
    const transformedActivities = (activities ?? []).map((a) => {
      // Extract company name from nested join: deal → company
      const dealRow = a.deal as { id: string; company: { id: string; name: string } | null }[] | null
      const company = dealRow?.[0]?.company
      const dealId = dealRow?.[0]?.id ?? null

      // Extract user name from nested join: user → profiles
      const userRow = a.user as { id: string; name: string }[] | null

      return {
        id: a.id,
        type: a.type,
        title: a.title,
        content: a.content ?? null,
        companyName: company?.name ?? 'Unknown',
        dealId,
        userName: userRow?.[0]?.name ?? 'Unknown',
        createdAt: a.created_at,
      }
    })

    // Group activities by date (YYYY-MM-DD)
    const groupedByDate: Record<string, typeof transformedActivities> = {}
    for (const activity of transformedActivities) {
      const dateKey = activity.createdAt.slice(0, 10) // YYYY-MM-DD
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = []
      }
      groupedByDate[dateKey].push(activity)
    }

    return NextResponse.json({
      activities: transformedActivities,
      groupedByDate,
      total: transformedActivities.length,
      dateRange: { start, end },
    })
  } catch (error) {
    logger.error('Calendar API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
