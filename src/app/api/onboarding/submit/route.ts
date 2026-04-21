import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createSession, createSessionCookie } from '@/lib/auth'
import { sanitizeObject } from '@/lib/sanitize'
import { onboardingSubmitSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

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

    // 4. Check if user already exists in profiles table (mirrors Supabase Auth)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }

    // 5. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: data.contact_name,
        role: 'admin',
        phone: data.phone || null,
      },
    })

    if (authError) {
      logger.error('Failed to create auth user', {
        error: authError.message,
        email: normalizedEmail,
      })

      // Handle unique constraint / duplicate email from auth
      if (authError.message.toLowerCase().includes('already registered') || authError.status === 422) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      logger.error('Auth user created but no user returned', { email: normalizedEmail })
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    const userId = authUser.user.id

    // Track created IDs for potential cleanup
    const createdIds: string[] = []

    try {
      // 5b. Create profile in profiles table (login flow depends on it)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: normalizedEmail,
          name: data.contact_name,
          role: 'admin',
          phone: data.phone || null,
          is_active: true,
        })

      if (profileError) {
        logger.error('Failed to create user profile', { error: profileError.message })
        await cleanupAuthUser(supabase, userId)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      // 6. Create Company
      const teamSize = parseTeamSize(data.size)
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.company_name,
          counties: Array.isArray(data.counties) ? data.counties.join(', ') : '',
          status: 'active',
          industry: 'Solar Installation',
          address: data.address || null,
          team_size: teamSize,
          seai_reg: data.vat || null,
        })
        .select('id, name')
        .single()

      if (companyError) {
        logger.error('Failed to create company', { error: companyError.message })
        await cleanupAuthUser(supabase, userId)
        return NextResponse.json(
          { error: 'Failed to create company record' },
          { status: 500 }
        )
      }

      const companyId = company.id
      createdIds.push(companyId)

      // 7. Create Contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          name: data.contact_name,
          email: normalizedEmail,
          phone: data.phone || null,
          role: 'Owner',
          is_decision_maker: true,
          company_id: companyId,
          status: 'active',
          source: 'demo',
          city: data.city || null,
          address: data.address || null,
          job_title: data.demo_role || null,
        })
        .select('id, name')
        .single()

      if (contactError) {
        logger.error('Failed to create contact', { error: contactError.message })
        await cleanupCreatedRecords(supabase, createdIds, 'companies')
        await cleanupAuthUser(supabase, userId)
        return NextResponse.json(
          { error: 'Failed to create contact record' },
          { status: 500 }
        )
      }

      const contactId = contact.id
      createdIds.push(contactId)

      // 8. Parse trial dates
      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      // 9. Create InstallerProfile
      const signedDocs = Object.entries(data.signedDocs || {})
        .filter(([, signed]) => signed)
        .map(([docId]) => ({
          docId,
          signedAt: now.toISOString(),
        }))

      const teamMembers = (data.team || []).map(t => ({
        name: t.name || '',
        email: t.email || '',
        role: t.role || 'Consultant',
      }))

      const { data: installerProfile, error: installerError } = await supabase
        .from('installer_profiles')
        .insert({
          user_id: userId,
          contact_id: contactId,
          company_id: companyId,
          company_name: data.company_name,
          contact_name: data.contact_name,
          email: normalizedEmail,
          phone: data.phone || null,
          vat_number: data.vat || null,
          business_address: data.address || null,
          service_counties: data.counties || [],
          plan_id: data.plan,
          billing_cycle: data.billing,
          billing_email: data.invoice_email || null,
          billing_address: data.billing_address || null,
          billing_city: data.billing_city || null,
          billing_county: data.billing_county || null,
          billing_eircode: data.billing_eircode || null,
          integrations: data.tech_integrations || [],
          security_features: data.security_features || [],
          years_in_business: data.founded ? parseInt(data.founded) || null : null,
          team_size: teamSize,
          onboarding_complete: true,
          onboarding_step: 9,
          signed_documents: signedDocs,
          team_members: teamMembers,
          data_retention_months: data.data_retention,
          lead_target_month: data.leads_target,
          installs_month: data.installs_target,
          revenue_target: data.revenue_target,
          trial_start_at: now.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
          demo_booking_date: data.demo_date ? new Date(data.demo_date).toISOString() : null,
          demo_booking_time: data.demo_time || null,
          demo_focus_areas: data.demo_focus || [],
          demo_company_size: data.demo_company_size || null,
          demo_role: data.demo_role || null,
        })
        .select('id, company_name, plan_id, trial_ends_at')
        .single()

      if (installerError) {
        logger.error('Failed to create installer profile', { error: installerError.message })
        await cleanupCreatedRecords(supabase, createdIds, 'contacts')
        await cleanupCreatedRecords(supabase, [companyId], 'companies')
        await cleanupAuthUser(supabase, userId)
        return NextResponse.json(
          { error: 'Failed to create installer profile' },
          { status: 500 }
        )
      }

      const installerProfileId = installerProfile.id
      createdIds.push(installerProfileId)

      // 10. Create Subscription (trialing, 14 days)
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          installer_id: installerProfileId,
          plan_id: data.plan,
          status: 'trialing',
          billing_cycle: data.billing,
          current_period_start: now.toISOString(),
          current_period_end: trialEndsAt.toISOString(),
          company_id: companyId,
        })
        .select('id, status')
        .single()

      if (subscriptionError) {
        logger.error('Failed to create subscription', { error: subscriptionError.message })
        await cleanupCreatedRecords(supabase, createdIds, 'installer_profiles')
        await cleanupCreatedRecords(supabase, [companyId], 'companies')
        await cleanupAuthUser(supabase, userId)
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        )
      }

      // 11. Create installer documents for each signed doc
      const signedDocIds = Object.entries(data.signedDocs || {})
        .filter(([, signed]) => signed)
        .map(([docId]) => docId)

      if (signedDocIds.length > 0) {
        const documentsToInsert = signedDocIds.map(docId => ({
          installer_id: installerProfileId,
          document_type: docId,
          signed_at: now.toISOString(),
        }))

        const { error: docsError } = await supabase
          .from('installer_documents')
          .insert(documentsToInsert)

        if (docsError) {
          logger.error('Failed to create installer documents', { error: docsError.message })
          // Non-fatal — log but continue
        }
      }

      // 12. Create Session (Redis-backed, not Supabase)
      const sessionToken = await createSession({
        id: userId,
        email: normalizedEmail,
        name: data.contact_name,
        role: 'admin',
        avatar: null,
      })

      // 13. Upsert OnboardingSubmission — mark as completed
      const { data: existingSubmission, error: submissionFetchError } = await supabase
        .from('onboarding_submissions')
        .select('id')
        .eq('email', normalizedEmail)
        .single()

      if (submissionFetchError && submissionFetchError.code !== 'PGRST116') {
        logger.error('Failed to check existing onboarding submission', {
          error: submissionFetchError.message,
        })
        // Non-fatal — continue
      }

      if (existingSubmission) {
        const { error: submissionUpdateError } = await supabase
          .from('onboarding_submissions')
          .update({
            form_data: data,
            status: 'completed',
            user_id: userId,
            company_id: companyId,
            contact_id: contactId,
            updated_at: now.toISOString(),
          })
          .eq('id', existingSubmission.id)

        if (submissionUpdateError) {
          logger.error('Failed to update onboarding submission', {
            error: submissionUpdateError.message,
          })
          // Non-fatal — continue
        }
      } else {
        const { error: submissionInsertError } = await supabase
          .from('onboarding_submissions')
          .insert({
            email: normalizedEmail,
            form_data: data,
            status: 'completed',
            user_id: userId,
            company_id: companyId,
            contact_id: contactId,
          })

        if (submissionInsertError) {
          logger.error('Failed to insert onboarding submission', {
            error: submissionInsertError.message,
          })
          // Non-fatal — continue
        }
      }

      // 14. Create onboarding record for the company — tracks setup progress
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

      const { data: existingOnboarding, error: onboardingFetchError } = await supabase
        .from('onboardings')
        .select('id')
        .eq('company_id', companyId)
        .single()

      if (onboardingFetchError && onboardingFetchError.code !== 'PGRST116') {
        logger.error('Failed to check existing onboarding record', {
          error: onboardingFetchError.message,
        })
        // Non-fatal — continue
      }

      if (existingOnboarding) {
        const { error: onboardingUpdateError } = await supabase
          .from('onboardings')
          .update({
            solarpilot_progress: progressPercent,
            solarpilot_steps: stepChecks,
            completed_at: now.toISOString(),
          })
          .eq('id', existingOnboarding.id)

        if (onboardingUpdateError) {
          logger.error('Failed to update onboarding record', {
            error: onboardingUpdateError.message,
          })
          // Non-fatal — continue
        }
      } else {
        const { error: onboardingInsertError } = await supabase
          .from('onboardings')
          .insert({
            company_id: companyId,
            solarpilot_progress: progressPercent,
            ai_workforce_progress: 0,
            solarpilot_steps: stepChecks,
            started_at: now.toISOString(),
            completed_at: now.toISOString(),
          })

        if (onboardingInsertError) {
          logger.error('Failed to create onboarding record', {
            error: onboardingInsertError.message,
          })
          // Non-fatal — continue
        }
      }

      // 15. Build response with session cookie
      const result = {
        user: {
          id: userId,
          email: normalizedEmail,
          name: data.contact_name,
          role: 'admin',
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
          companyName: installerProfile.company_name,
          planId: installerProfile.plan_id,
          trialEndsAt: installerProfile.trial_ends_at,
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
        },
        sessionToken,
      }

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
        userId,
      })

      return response
    } catch (innerError) {
      // An error occurred during sequential record creation — attempt cleanup
      logger.error('Onboarding inner error, attempting cleanup', {
        error: innerError instanceof Error ? innerError.message : String(innerError),
        userId,
        createdIds,
      })

      // Best-effort cleanup of created database records (in reverse order)
      for (const table of ['installer_documents', 'subscriptions', 'installer_profiles', 'contacts', 'companies'] as const) {
        await cleanupCreatedRecords(supabase, createdIds, table)
      }
      await cleanupAuthUser(supabase, userId)

      throw innerError
    }
  } catch (error) {
    logger.error('Onboarding submission error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// ─── Cleanup helpers ───

async function cleanupAuthUser(supabase: ReturnType<typeof createServiceClient>, userId: string): Promise<void> {
  try {
    await supabase.auth.admin.deleteUser(userId)
  } catch (err) {
    logger.error('Failed to cleanup auth user during rollback', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

async function cleanupCreatedRecords(
  supabase: ReturnType<typeof createServiceClient>,
  ids: string[],
  table: string
): Promise<void> {
  if (ids.length === 0) return
  try {
    await supabase.from(table).delete().in('id', ids)
  } catch (err) {
    logger.error(`Failed to cleanup records in ${table} during rollback`, {
      ids,
      error: err instanceof Error ? err.message : String(err),
    })
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
