import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { createTagSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if a Supabase error is a missing-relation error (table does not exist) */
function isMissingRelationError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42P01' ||
    (error.message?.toLowerCase().includes('relation') &&
     error.message?.toLowerCase().includes('does not exist'))
  )
}

/** Safely fetch tag counts from a junction table. Returns null if table doesn't exist. */
async function fetchTagCounts(
  supabase: ReturnType<typeof createServiceClient>,
  tableName: 'contact_tags' | 'deal_tags',
  tagColumnName: string,
): Promise<Record<string, number> | null> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(`${tagColumnName}`)

    if (error) {
      if (isMissingRelationError(error)) return null
      logger.warn(`Tag count query warning for ${tableName}`, { error: error.message })
      return null
    }

    const counts: Record<string, number> = {}
    if (data) {
      for (const row of data) {
        const tagId = (row as Record<string, unknown>)[tagColumnName] as string
        if (tagId) {
          counts[tagId] = (counts[tagId] || 0) + 1
        }
      }
    }
    return counts
  } catch {
    return null
  }
}

// GET: List tags
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`tags:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit')), 100, 1)

    const supabase = createServiceClient()

    // Fetch paginated tags
    const { data: tags, error, count } = await supabase
      .from('tags')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      logger.error('Tags list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    const total = count ?? 0

    // Try to get junction table counts (gracefully degrade if tables don't exist)
    const [contactTagCounts, dealTagCounts] = await Promise.all([
      fetchTagCounts(supabase, 'contact_tags', 'tag_id'),
      fetchTagCounts(supabase, 'deal_tags', 'tag_id'),
    ])

    // Enrich tags with counts
    const enrichedTags = (tags ?? []).map(tag => ({
      ...tag,
      contact_tag_count: contactTagCounts ? (contactTagCounts[tag.id] || 0) : 0,
      deal_tag_count: dealTagCounts ? (dealTagCounts[tag.id] || 0) : 0,
      _count: {
        contactTags: contactTagCounts ? (contactTagCounts[tag.id] || 0) : 0,
        dealTags: dealTagCounts ? (dealTagCounts[tag.id] || 0) : 0,
      },
    }))

    return NextResponse.json({
      tags: enrichedTags,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Tags list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create tag
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`tags_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const result = createTagSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const data = result.data

    const supabase = createServiceClient()

    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        name: data.name,
        color: data.color,
      })
      .select()
      .single()

    if (error) {
      logger.error('Create tag DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to create tag', details: error.message }, { status: 400 })
    }

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    logger.error('Create tag error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete tag
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`tags_delete:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid tag ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Delete tag DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete tag error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
