// @ts-nocheck — pending migration to Supabase
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
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

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(body.companyName && { name: body.companyName }),
        ...(body.companyEmail !== undefined && { email: body.companyEmail }),
        ...(body.companyPhone !== undefined && { phone: body.companyPhone }),
      },
      select: { id: true, email: true, name: true, role: true, avatar: true, phone: true },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    logger.error('Profile update error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
