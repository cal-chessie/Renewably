import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { INTAKE_VERSION } from '@/lib/relay-setup-fields'
import { buildRelayHandover, findValidRelayInvite, missingFieldIds, normaliseAnswers, type RelaySetupAsset } from '@/lib/relay-setup'
import { createServiceClient } from '@/lib/supabase'

const submitSchema = z.object({ answers: z.record(z.string(), z.union([z.string(), z.boolean()])) })

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await findValidRelayInvite(token)
  if (!invite) return NextResponse.json({ error: 'Setup link is unavailable' }, { status: 404 })
  const parsed = submitSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid setup data' }, { status: 400 })

  const answers = normaliseAnswers(parsed.data.answers)
  const missing = missingFieldIds(answers)
  if (missing.length) return NextResponse.json({ error: 'Please complete the remaining required items', missingFieldIds: missing }, { status: 422 })

  const supabase = createServiceClient()
  const { data: existing } = await supabase.from('relay_setup_intakes').select('assets').eq('invite_id', invite.id).maybeSingle()
  const assets = Array.isArray(existing?.assets) ? existing.assets as RelaySetupAsset[] : []
  const handover = buildRelayHandover({ inviteId: invite.id, companyName: invite.company_name, contactName: invite.contact_name, answers, assets })
  const now = new Date().toISOString()
  const { error } = await supabase.from('relay_setup_intakes').upsert({
    invite_id: invite.id,
    intake_version: INTAKE_VERSION,
    current_stage: 8,
    answers,
    assets,
    missing_field_ids: [],
    builder_handover: handover,
    status: 'submitted_for_review',
    updated_at: now,
  }, { onConflict: 'invite_id' })
  if (error) return NextResponse.json({ error: 'Could not submit setup' }, { status: 500 })

  await supabase.from('relay_setup_invites').update({ status: 'submitted_for_review', submitted_at: now }).eq('id', invite.id)
  return NextResponse.json({ ok: true, next: 'HUMAN_REVIEW_REQUIRED' })
}
