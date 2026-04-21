import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/crm-auth'
import { updateSettingsSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// PATCH /api/crm/settings/profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    let body: z.infer<typeof updateSettingsSchema>
    try {
      body = updateSettingsSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    // Build update object — only include fields that were provided
    const updates: Record<string, unknown> = {}
    if (body.companyName) updates.name = body.companyName
    if (body.companyEmail !== undefined) updates.email = body.companyEmail
    if (body.companyPhone !== undefined) updates.phone = body.companyPhone
    if (body.companyAddress !== undefined) updates.address = body.companyAddress
    if (body.companyVat !== undefined) updates.vat = body.companyVat
    if (body.invoicePrefix !== undefined) updates.invoice_prefix = body.invoicePrefix
    if (body.paymentTerms !== undefined) updates.payment_terms = body.paymentTerms
    if (body.taxRate !== undefined) updates.tax_rate = body.taxRate
    if (body.currency !== undefined) updates.currency = body.currency

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // If email is being changed, also update via Supabase Auth
    if (updates.email) {
      const { error: authEmailError } = await supabase.auth.admin.updateUserById(user.userId, {
        email: updates.email as string,
      })
      if (authEmailError) {
        logger.error('Auth email update error', { error: authEmailError.message })
        return NextResponse.json({ error: 'Failed to update email in auth' }, { status: 500 })
      }
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.userId)
      .select('id, user_id, email, name, role, avatar, phone')
      .single()

    if (error) {
      logger.error('Profile update error', { error: error.message })
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatar: updated.avatar,
        phone: updated.phone,
      },
    })
  } catch (error) {
    logger.error('Profile update error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
