import { supabase } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'
import { validString, isValidEmail, isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
}

/** Convert a flat snake_case DB row to camelCase */
function toCamelRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v
  return out
}

/** Parse text fields that may still be stored as JSON strings */
function parseJsonFields(installer: Record<string, unknown>) {
  try {
    if (typeof installer.serviceCounties === 'string') {
      installer.serviceCounties = JSON.parse(installer.serviceCounties as string)
    }
  } catch { /* keep as-is */ }
  return installer
}

/** Fetch relations for a single installer and assemble the full response object */
async function fetchInstallerWithRelations(id: string) {
  const { data: installer, error } = await supabase
    .from('installer_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !installer) return null

  // Fetch relations in parallel
  const [profilesRes, contactRes, companyRes, docsRes, subsRes] = await Promise.all([
    installer.user_id
      ? supabase.from('profiles').select('user_id, email, name, avatar, role, is_active').eq('user_id', installer.user_id).single()
      : Promise.resolve({ data: null }),
    installer.contact_id
      ? supabase.from('contacts').select('id, first_name, last_name, email, phone, status, source').eq('id', installer.contact_id).single()
      : Promise.resolve({ data: null }),
    installer.company_id
      ? supabase.from('companies').select('id, name, industry, phone, website, address, city, country').eq('id', installer.company_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('installer_documents').select('*').eq('installer_id', id).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*').eq('installer_id', id),
  ])

  const mapped = parseJsonFields(toCamelRow(installer as Record<string, unknown>))

  const profile = profilesRes.data
  const contact = contactRes.data
  const company = companyRes.data

  return {
    ...mapped,
    user: profile
      ? {
          id: profile.user_id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          role: profile.role,
          isActive: profile.is_active,
        }
      : installer.user_id
        ? { id: installer.user_id, email: mapped.email || null, name: mapped.contactName || null, avatar: null, role: null, isActive: null }
        : null,
    contact: contact
      ? {
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          status: contact.status,
          source: contact.source,
        }
      : null,
    company: company
      ? {
          id: company.id,
          name: company.name,
          industry: company.industry,
          phone: company.phone,
          website: company.website,
          address: company.address,
          city: company.city,
          country: company.country,
        }
      : null,
    // equipment table doesn't exist — return empty array
    equipment: [],
    // signedDocuments from installer_documents table
    signedDocuments: (docsRes.data ?? []).map((r: Record<string, unknown>) => toCamelRow(r)),
    // subscription (singular) — first subscription
    subscription: subsRes.data && subsRes.data.length > 0
      ? toCamelRow(subsRes.data[0] as Record<string, unknown>)
      : null,
  }
}

// ── GET: Single installer with full details ────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const installer = await fetchInstallerWithRelations(id)
    if (!installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    return NextResponse.json({ installer })
  } catch (error) {
    logger.error('Installer detail error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PUT: Update installer profile ──────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`installers_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const body = await request.json()

    // Verify installer exists
    const { data: existing, error: findError } = await supabase
      .from('installer_profiles')
      .select('id')
      .eq('id', id)
      .single()
    if (findError || !existing) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Explicit allowlist of safe-to-update fields
    const ALLOWED_STRING_FIELDS = [
      'companyName', 'companyDescription', 'serviceCounties', 'integrations', 'securityFeatures',
      'vatNumber', 'seaiNumber', 'reciNumber', 'eircode', 'website',
      'businessEmail', 'businessPhone', 'companySize',
      'averageInstallSize', 'panelCapacity', 'primaryInverterBrand',
      'certifications', 'insuranceDetails', 'notes', 'billingAddress',
    ]
    const ALLOWED_NUMBER_FIELDS = [
      'teamSize', 'installsPerYear', 'averageInstallCost',
    ]
    const ALLOWED_BOOLEAN_FIELDS = [
      'onboardingComplete', 'hasPublicLiability', 'hasEmployerLiability',
    ]
    const ALLOWED_JSON_FIELDS = ['serviceCounties', 'integrations', 'securityFeatures']

    const updateData: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_STRING_FIELDS.includes(key) && typeof value === 'string') {
        const v = validString(value, { maxLen: 10000 })
        if (v !== null) {
          if (ALLOWED_JSON_FIELDS.includes(key)) {
            try {
              updateData[toSnake(key)] = JSON.parse(value)
            } catch {
              updateData[toSnake(key)] = value
            }
          } else {
            updateData[toSnake(key)] = v
          }
        }
      } else if (ALLOWED_NUMBER_FIELDS.includes(key) && typeof value === 'number') {
        updateData[toSnake(key)] = value >= 0 ? value : 0
      } else if (ALLOWED_BOOLEAN_FIELDS.includes(key) && typeof value === 'boolean') {
        updateData[toSnake(key)] = value
      } else if (key === 'businessEmail' && typeof value === 'string') {
        if (!isValidEmail(value)) {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }
        updateData.business_email = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the installer profile
    const { data: updated, error: updateError } = await supabase
      .from('installer_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error('Update installer failed', { error: updateError.message })
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update installer' }, { status: 500 })
    }

    const installer = await fetchInstallerWithRelations(id)

    return NextResponse.json({ installer })
  } catch (error: unknown) {
    logger.error('Update installer error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE: Delete installer profile ───────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`installers_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    // Verify installer exists before deleting
    const { data: existing, error: findError } = await supabase
      .from('installer_profiles')
      .select('id, company_name, contact_id, company_id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Delete the installer profile
    const { error: deleteError } = await supabase
      .from('installer_profiles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Delete installer failed', { error: deleteError.message })
      return NextResponse.json({ error: 'Failed to delete installer' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Installer "${existing.company_name}" deleted successfully`,
    })
  } catch (error: unknown) {
    logger.error('Delete installer error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
