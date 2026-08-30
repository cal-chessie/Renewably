import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

import {
  RELAY_SETUP_ALLOWED_MIME_TYPES,
  RELAY_SETUP_BUCKET,
  RELAY_SETUP_MAX_UPLOAD_BYTES,
  findValidRelayInvite,
  type RelaySetupAsset,
} from '@/lib/relay-setup'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await findValidRelayInvite(token)
  if (!invite) return NextResponse.json({ error: 'Setup link is unavailable' }, { status: 404 })

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a file to upload' }, { status: 400 })
  if (!RELAY_SETUP_ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'That file type is not accepted. Use PDF, DOCX, CSV, JPG, PNG or WebP.' }, { status: 415 })
  }
  if (file.size === 0 || file.size > RELAY_SETUP_MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Files must be between 1 byte and 25 MB.' }, { status: 413 })
  }

  const extension = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')}` : ''
  const storagePath = `${invite.id}/${randomUUID()}${extension}`
  const supabase = createServiceClient()
  const { error: uploadError } = await supabase.storage
    .from(RELAY_SETUP_BUCKET)
    .upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: 'Could not store that file' }, { status: 500 })

  const asset: RelaySetupAsset = {
    id: randomUUID(),
    originalName: file.name.replace(/[\r\n]/g, '').slice(0, 180),
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath,
    uploadedAt: new Date().toISOString(),
  }
  const { data: existing } = await supabase.from('relay_setup_intakes').select('assets, answers, current_stage').eq('invite_id', invite.id).maybeSingle()
  const assets = [...(Array.isArray(existing?.assets) ? existing.assets : []), asset]
  const { error: saveError } = await supabase.from('relay_setup_intakes').upsert({
    invite_id: invite.id,
    intake_version: 'renewably-relay-v1',
    current_stage: existing?.current_stage ?? 1,
    answers: existing?.answers ?? {},
    assets,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'invite_id' })
  if (saveError) return NextResponse.json({ error: 'File was stored but could not be attached to setup. Contact us before continuing.' }, { status: 500 })
  return NextResponse.json({ asset }, { status: 201 })
}
