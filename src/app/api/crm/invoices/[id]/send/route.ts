import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import { isPostmarkConfigured, getFromEmail, buildInvoiceEmail, sendEmail } from '@/lib/postmark'

const fmtEuro = (v: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v)

// POST: Email the invoice via Postmark, log it, and flip status to 'sent'
// ONLY on a successful dispatch.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoice_send:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const supabase = createServiceClient()
    const { id } = await params

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    // Fetch invoice + related contact/company (do NOT flip status yet)
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, contact:contacts(id, name, email, do_not_email), company:companies(id, name)')
      .eq('id', id)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Require a recipient email — never dispatch (or flip status) without one
    const recipientEmail = (invoice.contact?.email ?? '').trim()
    if (!recipientEmail) {
      return NextResponse.json(
        { ok: false, reason: 'No recipient email on the linked contact', error: 'No recipient email on the linked contact' },
        { status: 400 },
      )
    }

    // Respect do_not_email — never email a contact who has opted out
    if (invoice.contact?.do_not_email === true) {
      return NextResponse.json(
        { ok: false, reason: 'Contact is marked do-not-email', error: 'Contact is marked do-not-email' },
        { status: 409 },
      )
    }

    // Env gate: if Postmark isn't configured, be honest and do NOT flip status
    if (!isPostmarkConfigured()) {
      return NextResponse.json(
        { ok: false, reason: 'Email not configured', error: 'Email not configured' },
        { status: 503 },
      )
    }

    // Render + dispatch the real email through the existing Postmark infra.
    // sendEmail() also writes the email_logs audit row.
    const { subject, htmlBody, textBody } = buildInvoiceEmail({
      companyName: invoice.company?.name || 'your company',
      contactName: invoice.contact?.name || 'there',
      invoiceNumber: invoice.invoice_number || id,
      amount: fmtEuro(Number(invoice.total_amount ?? 0)),
      dueDate: invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
        : undefined,
    })

    const sendResult = await sendEmail({
      to: recipientEmail,
      subject,
      htmlBody,
      textBody,
      tag: 'invoice-sent',
      replyTo: getFromEmail(),
      metadata: { invoiceId: id, invoiceNumber: invoice.invoice_number ?? '' },
      dealId: invoice.deal_id || undefined,
      companyId: invoice.company_id || undefined,
      contactId: invoice.contact_id || undefined,
      userId: user.id,
    })

    // Only flip status on a genuine successful send
    if (!sendResult.success) {
      return NextResponse.json(
        { ok: false, reason: sendResult.error || 'Email send failed', error: sendResult.error || 'Email send failed' },
        { status: 502 },
      )
    }

    const sentAt = new Date().toISOString()
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: sentAt })
      .eq('id', id)
      .select('*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product), proposal:proposals(id, title), invoice_line_items(*), payments(*)')
      .single()

    if (updateError) {
      // Email went out but the status flip failed — report honestly
      logger.error('Invoice emailed but status update failed', { error: updateError.message, invoiceId: id })
      return NextResponse.json(
        { ok: false, reason: 'Email sent but failed to update invoice status', error: 'Email sent but failed to update invoice status' },
        { status: 500 },
      )
    }

    // Log activity via deal_activities — honest wording, only if deal_id exists
    if (updated.deal_id) {
      try {
        await supabase.from('deal_activities').insert({
          deal_id: updated.deal_id,
          user_id: user.id,
          type: 'email',
          title: `Invoice ${updated.invoice_number} emailed`,
          content: `Invoice ${updated.invoice_number} (${fmtEuro(Number(updated.total_amount ?? 0))}) was emailed to ${updated.contact?.name || 'contact'} <${recipientEmail}>.`,
          created_at: sentAt,
        })
      } catch (err) {
        logger.warn('Failed to log invoice send activity', { error: err instanceof Error ? err.message : String(err) })
      }
    }

    const mappedInvoice = {
      ...updated,
      lineItems: (updated.invoice_line_items || []),
      invoice_line_items: undefined,
    }

    return NextResponse.json({ ok: true, invoice: mappedInvoice, messageId: sendResult.messageId })
  } catch (error) {
    logger.error('Send invoice error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
