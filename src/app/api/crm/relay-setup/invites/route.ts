import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin, unauthorized } from '@/lib/crm-auth'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'
import { createRelaySetupToken, hashRelaySetupToken } from '@/lib/relay-setup'
import { createServiceClient } from '@/lib/supabase'

const inviteSchema = z.object({
  contactName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  expiresInDays: z.number().int().min(1).max(30).default(14),
})

/**
 * Staff-only. This issues a setup link; it does not create a customer account,
 * CRM admin, subscription, or production deployment.
 */
export async function POST(request: NextRequest) {
  const user = await requireAdmin(request)
  if (!user || !validateCsrfOrigin(request)) return unauthorized()

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid invitation details' }, { status: 400 })

  const data = parsed.data
  const token = createRelaySetupToken()
  const expiresAt = new Date(Date.now() + data.expiresInDays * 86_400_000).toISOString()
  const supabase = createServiceClient()

  const { data: invite, error } = await supabase
    .from('relay_setup_invites')
    .insert({
      token_hash: hashRelaySetupToken(token),
      email: data.email.toLowerCase(),
      contact_name: data.contactName,
      company_name: data.companyName,
      expires_at: expiresAt,
      created_by_profile_id: user.id,
    })
    .select('id, expires_at')
    .single()

  if (error || !invite) return NextResponse.json({ error: 'Could not issue setup invitation' }, { status: 500 })

  const origin = new URL(request.url).origin
  return NextResponse.json({
    inviteId: invite.id,
    expiresAt: invite.expires_at,
    setupUrl: `${origin}/setup/${token}`,
    delivery: 'manual_until_postmark_invites_are_configured',
  }, { status: 201 })
}
