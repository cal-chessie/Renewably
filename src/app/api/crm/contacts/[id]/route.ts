import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { updateContactSchema, formatZodError } from '@/lib/crm-schemas'
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
 * Map camelCase body fields to the real snake_case contacts columns
 * (see supabase/migrations/20260909_relay_baseline.sql). Only canonical
 * columns are writable; drift fields (source, status, city, address, linkedin,
 * country, description, firstName/lastName) are intentionally absent.
 */
const CONTACT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  greetingName: 'greeting_name',
  email: 'email',
  phone: 'phone',
  mobile: 'mobile',
  numberType: 'number_type',
  doNotEmail: 'do_not_email',
  role: 'role',
  jobTitle: 'job_title',
  isDecisionMaker: 'is_decision_maker',
  companyId: 'company_id',
  notes: 'notes',
}

/** Boolean columns must be written as real booleans, not String()-coerced. */
const BOOLEAN_CONTACT_COLUMNS = new Set(['do_not_email', 'is_decision_maker'])

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

    // Notes written against this contact (notes table) — surfaced on the Notes tab.
    // `result.notes` stays the contact's free-text notes column; the note entries
    // live under `noteEntries` so both the Overview text and the Notes list work.
    const { data: noteRows } = await supabase
      .from('notes')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })

    result.noteEntries = (noteRows ?? []).map((n) => {
      const row = n as Record<string, unknown>
      const text = (row.body ?? row.content ?? '') as string
      return {
        id: row.id,
        body: text,
        content: text,
        author: row.author ?? null,
        createdAt: row.created_at,
      }
    })

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

    let body: z.infer<typeof updateContactSchema>
    try {
      body = updateContactSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    // Build the snake_case update payload from canonical fields present in the body.
    // undefined -> skip (leave column untouched); null -> clear a nullable column;
    // booleans stay booleans; company_id never receives an empty string.
    const updateData: Record<string, unknown> = {}
    for (const [camelKey, snakeKey] of Object.entries(CONTACT_FIELD_MAP)) {
      const value = (body as Record<string, unknown>)[camelKey]
      if (value === undefined) continue
      if (BOOLEAN_CONTACT_COLUMNS.has(snakeKey)) {
        updateData[snakeKey] = Boolean(value)
      } else if (snakeKey === 'company_id') {
        updateData[snakeKey] = value || null
      } else {
        updateData[snakeKey] = value === null ? null : String(value)
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
