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

// GET: List installer profiles with search/filter
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const plan = searchParams.get('plan') || ''
    const onboarding = searchParams.get('onboarding') || ''
    const county = searchParams.get('county') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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
          contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          company: { select: { id: true, name: true, industry: true, phone: true } },
          subscription: { select: { id: true, status: true, planId: true, billingCycle: true, currentPeriodStart: true, currentPeriodEnd: true } },
          _count: { select: { equipment: true, signedDocuments: true } },
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
    console.error('Installers list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new installer profile (also creates Contact + Company + Subscription)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      companyName,
      contactName,
      email,
      phone,
      vatNumber,
      businessAddress,
      serviceCounties,
      planId,
      billingCycle,
      billingEmail,
      billingAddress,
      billingCity,
      billingCounty,
      billingEircode,
      stripeCustomerId,
      integrations,
      securityFeatures,
      yearsInBusiness,
      publicLiability,
      seaiRegistered,
      seaiNumber,
      reciRegistered,
      reciNumber,
      maxProjectsMonth,
      avgProjectValue,
      avgInstallDays,
      teamSize,
      qualifiedElectricians,
      vanFleetSize,
      hasDrone,
      hasScaffolding,
      maxLeadsMonth,
      minLeadValue,
      responseTimeHours,
      quotationTurnaround,
      maxTravelKm,
      ruralSpecialist,
      commercialSpecialist,
      heritageExperience,
      offersEvCharger,
      offersHeatPump,
      acceptsFinancing,
      leadTargetMonth,
      installsMonth,
      revenueTarget,
      trialStartAt,
      trialEndsAt,
    } = body

    // Validate required fields
    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }
    if (!contactName) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify the referenced user exists
    const targetUser = await db.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Referenced user not found' }, { status: 404 })
    }

    // Check if installer profile already exists for this user
    const existingProfile = await db.installerProfile.findUnique({ where: { userId } })
    if (existingProfile) {
      return NextResponse.json({ error: 'Installer profile already exists for this user' }, { status: 409 })
    }

    // Split contactName into first and last name
    const nameParts = contactName.trim().split(/\s+/)
    const firstName = nameParts[0] || contactName
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

    // Create Company record
    const company = await db.company.create({
      data: {
        name: companyName,
        industry: 'Solar Installation',
        address: businessAddress || null,
        phone: phone || null,
      },
    })

    // Create Contact record linked to the company
    const contact = await db.contact.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        jobTitle: 'Solar Installer',
        source: 'installer_onboarding',
        status: 'customer',
        companyId: company.id,
        address: businessAddress || null,
      },
    })

    // Create Installer Profile
    const installer = await db.installerProfile.create({
      data: {
        userId,
        contactId: contact.id,
        companyId: company.id,
        companyName,
        contactName,
        phone: phone || null,
        vatNumber: vatNumber || null,
        businessAddress: businessAddress || null,
        serviceCounties: serviceCounties ? (typeof serviceCounties === 'string' ? serviceCounties : JSON.stringify(serviceCounties)) : '[]',
        planId: planId || 'pro',
        billingCycle: billingCycle || 'monthly',
        billingEmail: billingEmail || null,
        billingAddress: billingAddress || null,
        billingCity: billingCity || null,
        billingCounty: billingCounty || null,
        billingEircode: billingEircode || null,
        stripeCustomerId: stripeCustomerId || null,
        integrations: integrations ? (typeof integrations === 'string' ? integrations : JSON.stringify(integrations)) : '[]',
        securityFeatures: securityFeatures ? (typeof securityFeatures === 'string' ? securityFeatures : JSON.stringify(securityFeatures)) : '[]',
        yearsInBusiness: yearsInBusiness ?? null,
        publicLiability: publicLiability ?? null,
        seaiRegistered: seaiRegistered ?? false,
        seaiNumber: seaiNumber || null,
        reciRegistered: reciRegistered ?? false,
        reciNumber: reciNumber || null,
        maxProjectsMonth: maxProjectsMonth ?? null,
        avgProjectValue: avgProjectValue ?? null,
        avgInstallDays: avgInstallDays ?? null,
        teamSize: teamSize ?? null,
        qualifiedElectricians: qualifiedElectricians ?? null,
        vanFleetSize: vanFleetSize ?? null,
        hasDrone: hasDrone ?? false,
        hasScaffolding: hasScaffolding ?? false,
        maxLeadsMonth: maxLeadsMonth ?? null,
        minLeadValue: minLeadValue ?? null,
        responseTimeHours: responseTimeHours ?? null,
        quotationTurnaround: quotationTurnaround ?? null,
        maxTravelKm: maxTravelKm ?? null,
        ruralSpecialist: ruralSpecialist ?? false,
        commercialSpecialist: commercialSpecialist ?? false,
        heritageExperience: heritageExperience ?? false,
        offersEvCharger: offersEvCharger ?? false,
        offersHeatPump: offersHeatPump ?? false,
        acceptsFinancing: acceptsFinancing ?? true,
        leadTargetMonth: leadTargetMonth ?? null,
        installsMonth: installsMonth ?? null,
        revenueTarget: revenueTarget ?? null,
        trialStartAt: trialStartAt ? new Date(trialStartAt) : null,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
      },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, industry: true } },
        subscription: true,
        equipment: true,
        signedDocuments: true,
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
    console.error('Create installer error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'A record with this unique constraint already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
