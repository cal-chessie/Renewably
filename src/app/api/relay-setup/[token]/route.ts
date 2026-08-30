import { NextRequest, NextResponse } from 'next/server'

import { findValidRelayInvite } from '@/lib/relay-setup'
import { createServiceClient } from '@/lib/supabase'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await findValidRelayInvite(token)
  if (!invite) return NextResponse.json({ error: 'Setup link is unavailable' }, { status: 404 })

  const supabase = createServiceClient()
  const { data: intake } = await supabase
    .from('relay_setup_intakes')
    .select('current_stage, answers, assets, status')
    .eq('invite_id', invite.id)
    .maybeSingle()

  if (invite.status === 'issued') {
    await supabase.from('relay_setup_invites').update({ status: 'in_progress', opened_at: new Date().toISOString() }).eq('id', invite.id)
  }

  return NextResponse.json({
    companyName: invite.company_name,
    contactName: invite.contact_name,
    currentStage: intake?.current_stage ?? 1,
    answers: intake?.answers ?? {},
    assets: intake?.assets ?? [],
    status: intake?.status ?? 'in_progress',
  })
}
