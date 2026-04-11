import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// Helper to check auth
async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

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
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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
    console.error('Installer detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update installer profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify installer exists
    const existing = await db.installerProfile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Separate out fields that need JSON stringification
    const jsonFields = ['serviceCounties', 'integrations', 'securityFeatures']
    const updateData: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(body)) {
      // Skip id and nested relational fields
      if (key === 'id' || key === 'userId' || key === 'contactId' || key === 'companyId') continue
      if (key === 'createdAt' || key === 'updatedAt') continue
      if (key === 'user' || key === 'contact' || key === 'company' || key === 'equipment' || key === 'signedDocuments' || key === 'subscription') continue

      if (jsonFields.includes(key) && value !== undefined) {
        updateData[key] = typeof value === 'string' ? value : JSON.stringify(value)
      } else if (value !== undefined) {
        updateData[key] = value
      }
    }

    // Handle date fields
    if (body.trialStartAt !== undefined) {
      updateData.trialStartAt = body.trialStartAt ? new Date(body.trialStartAt) : null
    }
    if (body.trialEndsAt !== undefined) {
      updateData.trialEndsAt = body.trialEndsAt ? new Date(body.trialEndsAt) : null
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
    console.error('Update installer error:', error)
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
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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
    console.error('Delete installer error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
