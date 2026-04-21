import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a flat object's keys from snake_case to camelCase */
function keysToCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    out[camel] = v
  }
  return out
}

/**
 * Map camelCase body fields to snake_case columns for the contacts table.
 * Fields that don't exist in the DB (linkedin, country, description) are excluded.
 */
const CONTACT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  jobTitle: 'job_title',
  source: 'source',
  status: 'status',
  address: 'address',
  city: 'city',
  companyId: 'company_id',
  notes: 'notes',
}

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

    const supabase = createServiceClient()

    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const result = keysToCamel(contact as Record<string, unknown>)

    // Fetch company info if contact has a company_id
    if (contact.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('id', contact.company_id)
        .single()

      if (company) {
        result.company = keysToCamel(company as Record<string, unknown>)
      }
    }

    // Tags not yet available — return empty array (junction tables may not exist)
    result.tags = []

    return NextResponse.json({ contact: result })
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
    const supabase = createServiceClient()

    // Build snake_case update payload, only including fields present in the body
    // Fields not in CONTACT_FIELD_MAP (linkedin, country, description) are silently skipped
    const updateData: Record<string, unknown> = {}
    for (const [camelKey, snakeKey] of Object.entries(CONTACT_FIELD_MAP)) {
      const value = (body as Record<string, unknown>)[camelKey]
      if (value !== undefined) {
        if (camelKey === 'companyId') {
          // companyId can be null (unset) or a string
          updateData[snakeKey] = value || null
        } else {
          updateData[snakeKey] = String(value)
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Update contact DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const result = keysToCamel(contact as Record<string, unknown>)

    // Fetch company info if contact has a company_id
    if (contact.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('id', contact.company_id)
        .single()

      if (company) {
        result.company = keysToCamel(company as Record<string, unknown>)
      }
    }

    // Tags not yet available — return empty array
    result.tags = []

    return NextResponse.json({ contact: result })
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

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Delete contact DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete contact error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
