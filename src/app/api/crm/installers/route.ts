import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createInstallerSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'
import { clampPagination, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'

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

// GET: List installer profiles with search/filter
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`installers:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const plan = searchParams.get('plan') || ''
    const onboarding = searchParams.get('onboarding') || ''
    const county = searchParams.get('county') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)

    const where: Record<string, unknown> = {}

    // Search across companyName, contactName, and user email
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { user: { email: { contains: search } } },
      ]
    }

    // Filter by plan
    if (plan && ['starter', 'pro', 'enterprise'].includes(plan)) {
      where.planId = plan
    }

    // Filter by onboarding completion status
    if (onboarding === 'complete') {
      where.onboardingComplete = true
    } else if (onboarding === 'incomplete') {
      where.onboardingComplete = false
    }

    // Filter by service county (match within JSON array string)
    if (county) {
      where.serviceCounties = { contains: county }
    }

    const [installers, total] = await Promise.all([
      db.installerProfile.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, avatar: true } },
          subscriptions: { select: { id: true, status: true, planId: true, billingCycle: true, currentPeriodStart: true, currentPeriodEnd: true } },
          _count: { select: { documents: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.installerProfile.count({ where }),
    ])

    // Parse JSON fields on each record
    const parsedInstallers = installers.map((installer) =>
      parseJsonFields(installer as unknown as Record<string, unknown>) as typeof installer
    )

    return NextResponse.json({
      installers: parsedInstallers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Installers list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new installer profile (also creates Contact + Company + Subscription)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`installers_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const result = createInstallerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const data = result.data

    // Verify the referenced user exists
    const targetUser = await db.user.findUnique({ where: { id: data.userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Referenced user not found' }, { status: 404 })
    }

    // Check if installer profile already exists for this user
    const existingProfile = await db.installerProfile.findUnique({ where: { userId: data.userId } })
    if (existingProfile) {
      return NextResponse.json({ error: 'Installer profile already exists for this user' }, { status: 409 })
    }

    const nameParts = data.contactName.trim().split(/\s+/)
    const firstName = nameParts[0] || data.contactName
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

    // Create Company record
    const company = await db.company.create({
      data: {
        name: data.companyName,
        industry: 'Solar Installation',
        address: data.businessAddress || null,
        phone: data.phone || null,
      },
    })

    // Create Contact record linked to the company
    const contact = await db.contact.create({
      data: {
        firstName,
        lastName,
        email: data.email || null,
        phone: data.phone || null,
        jobTitle: 'Solar Installer',
        source: 'installer_onboarding',
        status: 'customer',
        companyId: company.id,
        address: data.businessAddress || null,
      },
    })

    // Create Installer Profile
    const installer = await db.installerProfile.create({
      data: {
        userId: data.userId,
        contactId: contact.id,
        companyId: company.id,
        companyName: data.companyName,
        contactName: data.contactName,
        phone: data.phone || null,
        vatNumber: data.vatNumber || null,
        businessAddress: data.businessAddress || null,
        serviceCounties: data.serviceCounties ? (typeof data.serviceCounties === 'string' ? data.serviceCounties : JSON.stringify(data.serviceCounties)) : '[]',
        planId: data.planId,
        billingCycle: data.billingCycle,
        billingEmail: data.billingEmail || null,
        billingAddress: data.billingAddress || null,
        billingCity: data.billingCity || null,
        billingCounty: data.billingCounty || null,
        billingEircode: data.billingEircode || null,
        stripeCustomerId: data.stripeCustomerId || null,
        integrations: data.integrations ? (typeof data.integrations === 'string' ? data.integrations : JSON.stringify(data.integrations)) : '[]',
        securityFeatures: data.securityFeatures ? (typeof data.securityFeatures === 'string' ? data.securityFeatures : JSON.stringify(data.securityFeatures)) : '[]',
        yearsInBusiness: data.yearsInBusiness ?? null,
        publicLiability: data.publicLiability ?? null,
        seaiRegistered: data.seaiRegistered,
        seaiNumber: data.seaiNumber || null,
        reciRegistered: data.reciRegistered,
        reciNumber: data.reciNumber || null,
        maxProjectsMonth: data.maxProjectsMonth ?? null,
        avgProjectValue: data.avgProjectValue ?? null,
        avgInstallDays: data.avgInstallDays ?? null,
        teamSize: data.teamSize ?? null,
        qualifiedElectricians: data.qualifiedElectricians ?? null,
        vanFleetSize: data.vanFleetSize ?? null,
        hasDrone: data.hasDrone,
        hasScaffolding: data.hasScaffolding,
        maxLeadsMonth: data.maxLeadsMonth ?? null,
        minLeadValue: data.minLeadValue ?? null,
        responseTimeHours: data.responseTimeHours ?? null,
        quotationTurnaround: data.quotationTurnaround ?? null,
        maxTravelKm: data.maxTravelKm ?? null,
        ruralSpecialist: data.ruralSpecialist,
        commercialSpecialist: data.commercialSpecialist,
        heritageExperience: data.heritageExperience,
        offersEvCharger: data.offersEvCharger,
        offersHeatPump: data.offersHeatPump,
        acceptsFinancing: data.acceptsFinancing,
        leadTargetMonth: data.leadTargetMonth ?? null,
        installsMonth: data.installsMonth ?? null,
        revenueTarget: data.revenueTarget ?? null,
        trialStartAt: data.trialStartAt ? new Date(data.trialStartAt) : null,
        trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
      },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
        subscriptions: true,
        documents: true,
      },
    })

    // Create a default trial subscription
    const subscription = await db.subscription.create({
      data: {
        installerId: installer.id,
        planId: installer.planId,
        status: 'trialing',
        billingCycle: installer.billingCycle,
        currentPeriodStart: installer.trialStartAt || new Date(),
        currentPeriodEnd: installer.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })

    const parsedInstaller = parseJsonFields(installer as unknown as Record<string, unknown>)

    return NextResponse.json(
      { installer: parsedInstaller, subscription },
      { status: 201 }
    )
  } catch (error: unknown) {
    logger.error('Create installer error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'A record with this unique constraint already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
