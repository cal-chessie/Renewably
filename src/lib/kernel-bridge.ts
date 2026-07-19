/**
 * kernel-bridge — Door B (cross-database) emission into the AIOS kernel.
 *
 * The Renewably CRM has its own database; the kernel is a separate Supabase
 * project. A Postgres trigger cannot write across databases, so this module
 * implements the outbox pattern the architecture doc flagged as unsolved:
 *
 *   1. queueKernelEvent() writes an intent row to KernelOutbox — call it
 *      inside (or immediately after) the business write. If the local write
 *      fails, nothing is queued. If the network is down, the intent survives.
 *   2. flushKernelOutbox() delivers pending rows to public.kernel_emit()
 *      with retry + attempt tracking. Call it opportunistically after
 *      queueing and from the cron route /api/crm/kernel/flush.
 *
 * THE LAW (from KERNEL_INTELLIGENCE.md — do not bend it here):
 *   - Tenant is EXPLICIT (RENEWABLY_TENANT_ID env). No tenant → refuse to
 *     queue loudly. Never a default.
 *   - Payloads carry REFERENCES ONLY. No names, no emails, no phone numbers,
 *     no message bodies. The kernel is append-only; PII in a chain is a GDPR
 *     wound that cannot heal. Pass ids, counts, stages, hashes.
 *   - Event types must be registered in kernel.event_types before use.
 *   - Server-side only. The service key must never be NEXT_PUBLIC_.
 */

import { db } from '@/lib/db'

const KERNEL_URL = process.env.KERNEL_SUPABASE_URL // https://<kernel-project>.supabase.co
const KERNEL_SERVICE_KEY = process.env.KERNEL_SERVICE_ROLE_KEY // server-only, never NEXT_PUBLIC_
const TENANT_ID = process.env.RENEWABLY_TENANT_ID // explicit — the law

const MAX_ATTEMPTS = 8

/** Queue an event for delivery to the kernel. Refs only in payload. */
export async function queueKernelEvent(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!TENANT_ID) {
    // Fail loud, not silent — but don't break the business operation.
    console.error(
      `[kernel-bridge] RENEWABLY_TENANT_ID not set — ${eventType} NOT queued. ` +
        'Set it or this deployment writes no history.'
    )
    return
  }
  try {
    await db.kernelOutbox.create({
      data: { eventType, payload: JSON.stringify({ v: 1, ...payload }) },
    })
  } catch (err) {
    console.error(`[kernel-bridge] Failed to queue ${eventType}:`, err)
  }
}

/** Deliver pending outbox rows to the kernel. Returns { sent, failed, pending }. */
export async function flushKernelOutbox(limit = 25): Promise<{
  sent: number
  failed: number
  pending: number
}> {
  if (!KERNEL_URL || !KERNEL_SERVICE_KEY || !TENANT_ID) {
    console.warn('[kernel-bridge] Kernel env not configured — flush skipped.')
    const pending = await db.kernelOutbox.count({ where: { status: 'pending' } })
    return { sent: 0, failed: 0, pending }
  }

  const rows = await db.kernelOutbox.findMany({
    where: { status: 'pending', attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  let sent = 0
  let failed = 0

  for (const row of rows) {
    try {
      const res = await fetch(`${KERNEL_URL}/rest/v1/rpc/kernel_emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: KERNEL_SERVICE_KEY,
          Authorization: `Bearer ${KERNEL_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          p_tenant: TENANT_ID,
          p_type: row.eventType,
          p_payload: JSON.parse(row.payload),
        }),
      })

      if (res.ok) {
        await db.kernelOutbox.update({
          where: { id: row.id },
          data: { status: 'sent', sentAt: new Date(), attempts: row.attempts + 1 },
        })
        sent++
      } else {
        const errText = (await res.text()).slice(0, 500)
        const attempts = row.attempts + 1
        await db.kernelOutbox.update({
          where: { id: row.id },
          data: {
            attempts,
            lastError: `${res.status}: ${errText}`,
            // Unregistered event type / bad tenant won't fix themselves — park
            // as failed at max attempts for manual review, keep retrying 5xx.
            status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
          },
        })
        failed++
        console.error(`[kernel-bridge] emit ${row.eventType} → ${res.status}: ${errText}`)
      }
    } catch (err) {
      const attempts = row.attempts + 1
      await db.kernelOutbox.update({
        where: { id: row.id },
        data: {
          attempts,
          lastError: err instanceof Error ? err.message.slice(0, 500) : 'network error',
          status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
        },
      })
      failed++
    }
  }

  const pending = await db.kernelOutbox.count({ where: { status: 'pending' } })
  return { sent, failed, pending }
}
