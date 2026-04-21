import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sanitizeObject } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

// GET /api/onboarding/progress?email=xxx — load saved onboarding progress
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const supabase = createServiceClient()

    const { data: submission, error } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (error || !submission || submission.status === 'completed') {
      return NextResponse.json({ found: false })
    }

    let formData: Record<string, unknown> = {}
    let savedStep = 0
    try {
      const rawFormData = submission.form_data as Record<string, unknown> | string | null
      const parsed = typeof rawFormData === 'string' ? JSON.parse(rawFormData || '{}') : (rawFormData || {})
      formData = parsed
      savedStep = typeof parsed.__step === 'number' ? parsed.__step : 0
    } catch {
      // Corrupt JSON — treat as not found
      return NextResponse.json({ found: false })
    }

    // Remove internal tracking field before returning
    const { __step, ...cleanData } = formData

    return NextResponse.json({
      found: true,
      step: savedStep,
      formData: cleanData,
    })
  } catch (error) {
    logger.error('Load onboarding progress error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 })
  }
}

// PUT /api/onboarding/progress — save incremental onboarding progress
export async function PUT(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const sanitized = sanitizeObject(body)

    const email = sanitized.email as string | undefined
    const step = sanitized.step as number | undefined
    const formData = (sanitized.formData || {}) as Record<string, unknown>

    if (!email || typeof step !== 'number' || step < 0) {
      return NextResponse.json({ error: 'Email and step are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const payload = { ...formData, __step: step }
    const supabase = createServiceClient()

    // Check for existing record
    const { data: existing, error: fetchError } = await supabase
      .from('onboarding_submissions')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not found), which is fine
      logger.error('Failed to check existing onboarding submission', {
        error: fetchError.message,
      })
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('onboarding_submissions')
        .update({
          form_data: payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        logger.error('Failed to update onboarding progress', {
          error: updateError.message,
        })
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('onboarding_submissions')
        .insert({
          email: normalizedEmail,
          form_data: payload,
          status: 'in_progress',
        })

      if (insertError) {
        logger.error('Failed to insert onboarding progress', {
          error: insertError.message,
        })
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Save onboarding progress error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
