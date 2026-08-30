import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { INTAKE_VERSION } from '@/lib/relay-setup-fields'
import { findValidRelayInvite, normaliseAnswers } from '@/lib/relay-setup'
import { createServiceClient } from '@/lib/supabase'

const progressSchema = z.object({
  currentStage: z.number().int().min(1).max(8),
  answers: z.record(z.string(), z.union([z.string(), z.boolean()])),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await findValidRelayInvite(token)
  if (!invite) return NextResponse.json({ error: 'Setup link is unavailable' }, { status: 404 })
  const parsed = progressSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid setup data' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('relay_setup_intakes').upsert({
    invite_id: invite.id,
    intake_version: INTAKE_VERSION,
    current_stage: parsed.data.currentStage,
    answers: normaliseAnswers(parsed.data.answers),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'invite_id' })
  if (error) return NextResponse.json({ error: 'Could not save your progress' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
