import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { dealActivitySchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// ═══════════════════════════════════════════════════════════════════
// GET: List activities for a deal
// ═══════════════════════════════════════════════════════════════════

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(_request)
    if (!user) return unauthorized()

    const { id: dealId } = await params

    const rateLimitResult = checkApiRateLimit(
      `deal_activities_get:${getClientIp(_request)}`,
      { maxAttempts: 60, windowMs: 60_000 }
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
          },
        }
      )
    }

    const supabase = createServiceClient()

    // `profiles` is not a table here and has no FK from `deal_activities.user_id`,
    // so it cannot be embedded (that would 500 the query). Select the rows, then
    // resolve author names via a separate lookup and stitch them in code.
    const { data: activities, error } = await supabase
      .from('deal_activities')
      .select('id, deal_id, user_id, type, title, content, created_at')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch deal activities', {
        dealId,
        error: error.message,
        code: error.code,
      })
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    const rows = activities || []
    const userIds = [...new Set(rows.map(a => a.user_id).filter(Boolean) as string[])]
    const userMap: Record<string, { id: string; name: string; avatar: string | null }> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds)
      for (const u of users || []) {
        userMap[u.id] = { id: u.id, name: u.name, avatar: (u as any).avatar ?? null }
      }
    }

    // Convert snake_case to camelCase for the response
    const camelActivities = rows.map(a => ({
      id: a.id,
      dealId: a.deal_id,
      userId: a.user_id,
      type: a.type,
      title: a.title,
      content: a.content,
      createdAt: a.created_at,
      user: a.user_id ? userMap[a.user_id] ?? null : null,
    }))

    return NextResponse.json({ activities: camelActivities })
  } catch (error) {
    logger.error('Deal activities GET error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST: Create a deal activity
// ═══════════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id: dealId } = await params

    const rateLimitResult = checkApiRateLimit(
      `deal_activities_post:${getClientIp(request)}`,
      { maxAttempts: 30, windowMs: 60_000 }
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
          },
        }
      )
    }

    // Validate request body
    let body: z.infer<typeof dealActivitySchema>
    try {
      body = dealActivitySchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: formatZodError(error) },
          { status: 400 }
        )
      }
      throw error
    }

    const { type, title, content } = body

    const supabase = createServiceClient()

    // Insert the activity — user_id comes from the authenticated user's profile.
    // `profiles` has no FK from `deal_activities.user_id` (and no table here), so
    // it cannot be embedded; resolve the author name via a separate lookup.
    const { data: activity, error } = await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        type,
        title,
        content: content || '',
      })
      .select('id, deal_id, user_id, type, title, content, created_at')
      .single()

    if (error) {
      logger.error('Failed to create deal activity', {
        dealId,
        userId: user.id,
        type,
        error: error.message,
        code: error.code,
      })
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }

    // Resolve the author name separately (no profiles embed). Degrades to null.
    let activityUser: { id: string; name: string; avatar: string | null } | null = null
    if (activity.user_id) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .eq('id', activity.user_id)
        .limit(1)
      const u = users?.[0]
      if (u) activityUser = { id: u.id, name: u.name, avatar: (u as any).avatar ?? null }
    }

    // Convert to camelCase
    const camelActivity = {
      id: activity.id,
      dealId: activity.deal_id,
      userId: activity.user_id,
      type: activity.type,
      title: activity.title,
      content: activity.content,
      createdAt: activity.created_at,
      user: activityUser,
    }

    return NextResponse.json({ activity: camelActivity }, { status: 201 })
  } catch (error) {
    logger.error('Deal activities POST error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
