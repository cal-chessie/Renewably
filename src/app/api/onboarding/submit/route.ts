import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, createSessionCookie } from '@/lib/auth'
import { sanitizeObject } from '@/lib/sanitize'
import { onboardingSubmitSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // 2. Sanitize input
    const sanitized = sanitizeObject(body)

    // 3. Validate with Zod schema
    const parsed = onboardingSubmitSchema.safeParse(sanitized)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodError(parsed.error) },
        { status: 400 }
      )
    }

    const data = parsed.data
    const normalizedEmail = data.email.toLowerCase().trim()

    // 4. Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }

    // 5. Hash the password
    const passwordHash = await hashPassword(data.password)

    // 6. Create all records in a transaction
    const result = await db.$transaction(async (tx) => {
      // 6a. Create User
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: data.contact_name,
          role: 'admin', // First user for this installer is admin
          phone: data.phone || null,
          isActive: true,
        },
      })

      // 6b. Create Company
      const company = await tx.company.create({
        data: {
          name: data.company_name,
          counties: Array.isArray(data.counties) ? data.counties.join(', ') : '',
          status: 'active',
          industry: 'Solar Installation',
          address: data.address || null,
          teamSize: parseTeamSize(data.size),
          seaiReg: data.vat || null,
        },
      })

      // 6c. Create Contact
      const nameParts = data.contact_name.trim().split(/\s+/)
      const contact = await tx.contact.create({
        data: {
          name: data.contact_name,
          email: normalizedEmail,
          phone: data.phone || null,
          role: 'Owner',
          isDecisionMaker: true,
          companyId: company.id,
          status: 'active',
          source: 'demo',
          city: data.city || null,
          address: data.address || null,
          jobTitle: data.demo_role || null,
        },
      })

      // 6d. Parse trial dates
      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      // 6e. Create InstallerProfile
      const installerProfile = await tx.installerProfile.create({
        data: {
          userId: user.id,
          contactId: contact.id,
          companyId: company.id,
          companyName: data.company_name,
          contactName: data.contact_name,
          email: normalizedEmail,
          phone: data.phone || null,
          vatNumber: data.vat || null,
          businessAddress: data.address || null,
          serviceCounties: JSON.stringify(data.counties || []),
          planId: data.plan,
          billingCycle: data.billing,
          billingEmail: data.invoice_email || null,
          billingAddress: data.billing_address || null,
          billingCity: data.billing_city || null,
          billingCounty: data.billing_county || null,
          billingEircode: data.billing_eircode || null,
          integrations: JSON.stringify(data.tech_integrations || []),
          securityFeatures: JSON.stringify(data.security_features || []),
          yearsInBusiness: data.founded ? parseInt(data.founded) || null : null,
          teamSize: parseTeamSize(data.size),
          onboardingComplete: true,
          onboardingStep: 9,
          signedDocuments: JSON.stringify(
            Object.entries(data.signedDocs || {})
              .filter(([, signed]) => signed)
              .map(([docId]) => ({
                docId,
                signedAt: now.toISOString(),
              }))
          ),
          teamMembers: JSON.stringify(
            (data.team || []).map(t => ({
              name: t.name || '',
              email: t.email || '',
              role: t.role || 'Consultant',
            }))
          ),
          dataRetentionMonths: data.data_retention,
          leadTargetMonth: data.leads_target,
          installsMonth: data.installs_target,
          revenueTarget: data.revenue_target,
          trialStartAt: now,
          trialEndsAt,
          demoBookingDate: data.demo_date ? new Date(data.demo_date) : null,
          demoBookingTime: data.demo_time || null,
          demoFocusAreas: JSON.stringify(data.demo_focus || []),
          demoCompanySize: data.demo_company_size || null,
          demoRole: data.demo_role || null,
        },
      })

      // 6f. Create Subscription (trialing, 14 days)
      const subscription = await tx.subscription.create({
        data: {
          installerId: installerProfile.id,
          planId: data.plan,
          status: 'trialing',
          billingCycle: data.billing,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          companyId: company.id,
        },
      })

      // 6g. Create installer documents for each signed doc
      const signedDocIds = Object.entries(data.signedDocs || {})
        .filter(([, signed]) => signed)
        .map(([docId]) => docId)

      if (signedDocIds.length > 0) {
        await tx.installerDocument.createMany({
          data: signedDocIds.map(docId => ({
            installerId: installerProfile.id,
            documentType: docId,
            signedAt: now,
          })),
        })
      }

      // 6h. Create Session (Redis-backed, not Supabase)
      const sessionToken = await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: null,
      })

      // 6i. Update OnboardingSubmission — mark as completed
      await tx.onboardingSubmission.upsert({
        where: { email: normalizedEmail },
        create: {
          email: normalizedEmail,
          formData: JSON.stringify(data),
          status: 'completed',
          userId: user.id,
          companyId: company.id,
          contactId: contact.id,
        },
        update: {
          formData: JSON.stringify(data),
          status: 'completed',
          userId: user.id,
          companyId: company.id,
          contactId: contact.id,
          updatedAt: now,
        },
      })

      // 6j. Create onboarding record for the company — tracks setup progress
      const stepChecks = [
        { step: 'account', done: true },
        { step: 'company', done: true },
        { step: 'territory', done: (data.counties || []).length > 0 },
        { step: 'integrations', done: true },
        { step: 'legal', done: signedDocIds.length >= 4 },
        { step: 'finance', done: !!data.plan },
        { step: 'tech', done: true },
        { step: 'training', done: true },
      ]
      const completedSteps = stepChecks.filter(s => s.done).length
      const progressPercent = Math.round((completedSteps / stepChecks.length) * 100)

      // Check if onboarding record already exists for this company
      const existingOnboarding = await tx.onboarding.findFirst({
        where: { companyId: company.id },
      })
      if (existingOnboarding) {
        await tx.onboarding.update({
          where: { id: existingOnboarding.id },
          data: {
            solarpilotProgress: progressPercent,
            solarpilotSteps: JSON.stringify(stepChecks),
            completedAt: now,
          },
        })
      } else {
        await tx.onboarding.create({
          data: {
            companyId: company.id,
            solarpilotProgress: progressPercent,
            aiWorkforceProgress: 0,
            solarpilotSteps: JSON.stringify(stepChecks),
            startedAt: now,
            completedAt: now,
          },
        })
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        company: {
          id: company.id,
          name: company.name,
        },
        contact: {
          id: contact.id,
          name: contact.name,
        },
        installerProfile: {
          id: installerProfile.id,
          companyName: installerProfile.companyName,
          planId: installerProfile.planId,
          trialEndsAt: installerProfile.trialEndsAt,
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
        },
        sessionToken,
      }
    })

    // 7. Build response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Onboarding complete! Welcome to SolarPilot.',
      ...result,
    })

    response.headers.append('Set-Cookie', createSessionCookie(result.sessionToken))

    logger.info('Onboarding completed', {
      email: normalizedEmail,
      companyName: data.company_name,
      planId: data.plan,
      userId: result.user.id,
    })

    return response
  } catch (error) {
    logger.error('Onboarding submission error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// Helper: Convert team size range string to approximate number
function parseTeamSize(size: string | undefined): number | null {
  if (!size) return null
  const sizeMap: Record<string, number> = {
    '1-5': 3,
    '6-15': 10,
    '16-30': 23,
    '31-50': 40,
    '50+': 60,
  }
  return sizeMap[size] || null
}
