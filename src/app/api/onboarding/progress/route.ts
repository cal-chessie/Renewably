// @ts-nocheck — pending migration to Supabase
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeObject } from '@/lib/sanitize'
import { logger } from '@/lib/logger'

// GET /api/onboarding/progress?email=xxx — load saved onboarding progress
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const submission = await db.onboardingSubmission.findUnique({
      where: { email: normalizedEmail },
    })

    if (!submission || submission.status === 'completed') {
      return NextResponse.json({ found: false })
    }

    let formData: Record<string, unknown> = {}
    let savedStep = 0
    try {
      const parsed = JSON.parse(submission.formData || '{}')
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

    await db.onboardingSubmission.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        formData: JSON.stringify(payload),
        status: 'in_progress',
      },
      update: {
        formData: JSON.stringify(payload),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Save onboarding progress error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
