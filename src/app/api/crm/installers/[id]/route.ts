import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'
import { validString, isValidEmail, isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// Helper to parse JSON string fields on an installer record
function parseJsonFields(installer: Record<string, unknown>) {
  try {
    if (typeof installer.serviceCounties === 'string') {
      installer.serviceCounties = JSON.parse(installer.serviceCounties)
    }
  } catch { /* keep as-is */ }
  try {
    if (typeof installer.integrations === 'string') {
      installer.integrations = JSON.parse(installer.integrations)
    }
  } catch { /* keep as-is */ }
  try {
    if (typeof installer.securityFeatures === 'string') {
      installer.securityFeatures = JSON.parse(installer.securityFeatures)
    }
  } catch { /* keep as-is */ }
  return installer
}

// Helper to stringify JSON fields before storing
function stringifyJsonFields(fields: Record<string, unknown>) {
  if (fields.serviceCounties !== undefined && !Array.isArray(fields.serviceCounties)) {
    fields.serviceCounties = JSON.stringify(fields.serviceCounties)
  }
  if (Array.isArray(fields.serviceCounties)) {
    fields.serviceCounties = JSON.stringify(fields.serviceCounties)
  }
  if (fields.integrations !== undefined && !Array.isArray(fields.integrations)) {
    fields.integrations = JSON.stringify(fields.integrations)
  }
  if (Array.isArray(fields.integrations)) {
    fields.integrations = JSON.stringify(fields.integrations)
  }
  if (fields.securityFeatures !== undefined && !Array.isArray(fields.securityFeatures)) {
    fields.securityFeatures = JSON.stringify(fields.securityFeatures)
  }
  if (Array.isArray(fields.securityFeatures)) {
    fields.securityFeatures = JSON.stringify(fields.securityFeatures)
  }
  return fields
}

// GET: Single installer with full details including equipment, documents, subscription
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

    const installer = await db.installerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true, role: true, isActive: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, source: true } },
        company: { select: { id: true, name: true, industry: true, phone: true, website: true, address: true, city: true, country: true } },
        equipment: {
          orderBy: { createdAt: 'desc' },
        },
        signedDocuments: {
          orderBy: { createdAt: 'desc' },
        },
        subscription: true,
      },
    })

    if (!installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    const parsedInstaller = parseJsonFields(installer as unknown as Record<string, unknown>)

    return NextResponse.json({ installer: parsedInstaller })
  } catch (error) {
    logger.error('Installer detail error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update installer profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const existing = await db.installerProfile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Explicit allowlist of safe-to-update fields — prevents mass assignment
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
              updateData[key] = JSON.parse(value)
            } catch {
              updateData[key] = value
            }
          } else {
            updateData[key] = v
          }
        }
      } else if (ALLOWED_NUMBER_FIELDS.includes(key) && typeof value === 'number') {
        updateData[key] = value >= 0 ? value : 0
      } else if (ALLOWED_BOOLEAN_FIELDS.includes(key) && typeof value === 'boolean') {
        updateData[key] = value
      } else if (key === 'businessEmail' && typeof value === 'string') {
        if (!isValidEmail(value)) {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }
        updateData[key] = value
      }
      // All other keys (id, userId, contactId, companyId, user, contact, company,
      // equipment, signedDocuments, subscription, createdAt, updatedAt, stripeCustomerId,
      // planId, billingEmail, isActive, subscriptionId, trialStartAt, trialEndsAt)
      // are silently ignored
    }

    // Update the installer profile
    const installer = await db.installerProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, industry: true } },
        subscription: true,
        equipment: true,
        signedDocuments: true,
      },
    })

    const parsedInstaller = parseJsonFields(installer as unknown as Record<string, unknown>)

    return NextResponse.json({ installer: parsedInstaller })
  } catch (error: unknown) {
    logger.error('Update installer error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete installer profile (cascades to equipment, documents, subscription)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const existing = await db.installerProfile.findUnique({
      where: { id },
      select: { id: true, companyName: true, contactId: true, companyId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Delete the installer profile (cascade will handle equipment, documents, subscription)
    await db.installerProfile.delete({ where: { id } })

    // Optionally clean up the linked contact and company if they are no longer referenced
    // (contact.companyId is nullable, but the Company and Contact may be shared elsewhere)
    // We leave them in place since they may have other CRM relationships (deals, notes, etc.)

    return NextResponse.json({
      success: true,
      message: `Installer "${existing.companyName}" deleted successfully`,
    })
  } catch (error: unknown) {
    logger.error('Delete installer error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
