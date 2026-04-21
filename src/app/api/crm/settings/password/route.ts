import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/crm-auth'
import { changePasswordSchema, formatZodError } from '@/lib/crm-schemas'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// PATCH /api/crm/settings/password
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`settings-password:${ip}`, { maxAttempts: 5, windowMs: 300_000 })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } })
    }

    let body: z.infer<typeof changePasswordSchema>
    try {
      body = changePasswordSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const { currentPassword, newPassword } = body

    const supabase = createServiceClient()

    // Get the user's auth metadata to verify current password
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.userId)
    if (authError || !authUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password by attempting to sign in
    const cookieHeader = request.headers.get('cookie') || ''
    const email = user.email
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError) {
      // Sign back in with session
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    // Update the password via Supabase Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.userId, {
      password: newPassword,
    })

    if (updateError) {
      logger.error('Password update error from Supabase', { error: updateError.message })
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Password change error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
