// ============================================================================
// RENEWABLY — KERNEL OUTBOX FLUSH
// ============================================================================
// POST /api/crm/kernel/flush — delivers pending KernelOutbox rows to the
// kernel's public.kernel_emit(). Call from Vercel Cron (every minute) or
// manually. Auth: CRM session OR x-cron-key matching KERNEL_FLUSH_CRON_KEY
// (Vercel Cron can't hold a session).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { flushKernelOutbox } from '@/lib/kernel-bridge'

export async function POST(request: NextRequest) {
  try {
    const cronKey = process.env.KERNEL_FLUSH_CRON_KEY
    const headerKey = request.headers.get('x-cron-key')
    const cronAuthed = !!cronKey && headerKey === cronKey

    if (!cronAuthed) {
      const user = await requireAuth(request)
      if (!user) return unauthorized()
    }

    const result = await flushKernelOutbox()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[Kernel Flush] Error:', error)
    return NextResponse.json({ ok: false, error: 'flush failed' }, { status: 500 })
  }
}
