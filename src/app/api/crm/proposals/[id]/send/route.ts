import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import { isPostmarkConfigured, getFromEmail, buildProposalEmail, sendEmail } from '@/lib/postmark'

const fmtEuro = (v: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

// ---------------------------------------------------------------------------
// POST /api/crm/proposals/[id]/send — Email the proposal via Postmark, log it,
// and flip status to 'sent' ONLY on a successful dispatch.
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(
      `proposal_send:${getClientIp(request)}`,
      { maxAttempts: 10, windowMs: 60_000 },
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        },
      )
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch proposal + related contact/company/deal (do NOT flip status yet)
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select(
        '*, contact:contacts(id, name, email, do_not_email), company:companies(id, name), deal:deals(id, product), proposal_line_items:proposal_line_items(*)',
      )
      .eq('id', id)
      .single()

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Require a recipient email — never dispatch (or flip status) without one
    const recipientEmail = (proposal.contact?.email ?? '').trim()
    if (!recipientEmail) {
      return NextResponse.json(
        { ok: false, reason: 'No recipient email on the linked contact', error: 'No recipient email on the linked contact' },
        { status: 400 },
      )
    }

    // Respect do_not_email — never email a contact who has opted out
    if (proposal.contact?.do_not_email === true) {
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
    const { subject, htmlBody, textBody } = buildProposalEmail({
      companyName: proposal.company?.name || 'your company',
      contactName: proposal.contact?.name || 'there',
      contactEmail: recipientEmail,
      productName: 'Solar',
      stageName: 'Proposal Sent',
      dealValue: proposal.total_amount ? fmtEuro(Number(proposal.total_amount)) : undefined,
    })

    const sendResult = await sendEmail({
      to: recipientEmail,
      subject,
      htmlBody,
      textBody,
      tag: 'proposal-sent',
      replyTo: getFromEmail(),
      metadata: { proposalId: id, proposalTitle: proposal.title ?? '' },
      dealId: proposal.deal_id || undefined,
      companyId: proposal.company_id || undefined,
      contactId: proposal.contact_id || undefined,
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
      .from('proposals')
      .update({ status: 'sent', sent_at: sentAt, updated_at: sentAt })
      .eq('id', id)
      .select(
        '*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product), proposal_line_items:proposal_line_items(*)',
      )
      .single()

    if (updateError) {
      // Email went out but the status flip failed — report honestly, don't claim clean success
      logger.error('Proposal emailed but status update failed', { error: updateError.message, proposalId: id })
      return NextResponse.json(
        { ok: false, reason: 'Email sent but failed to update proposal status', error: 'Email sent but failed to update proposal status' },
        { status: 500 },
      )
    }

    // Log activity in deal_activities — honest wording, only if deal_id is present
    if (updated.deal_id) {
      const { error: actError } = await supabase
        .from('deal_activities')
        .insert({
          deal_id: updated.deal_id,
          user_id: user.id,
          type: 'email',
          title: `Proposal emailed: ${updated.title}`,
          content: `Proposal "${updated.title}" (${fmtEuro(Number(updated.total_amount ?? 0))}) was emailed to ${updated.contact?.name || 'contact'} <${recipientEmail}>.`,
          created_at: sentAt,
        })

      if (actError) {
        // Non-blocking — don't fail the request for activity logging
        logger.warn('Send proposal activity logging failed', { error: actError.message })
      }
    }

    // Transform to match frontend shape
    const transformedProposal = {
      ...updated,
      contact: updated.contact
        ? {
            id: updated.contact.id,
            firstName: '',
            lastName: updated.contact.name ?? '',
            email: updated.contact.email ?? '',
            name: updated.contact.name ?? '',
          }
        : null,
      deal: updated.deal
        ? {
            id: updated.deal.id,
            title: updated.deal.product ?? '',
            product: updated.deal.product ?? '',
          }
        : null,
      lineItems: (updated.proposal_line_items || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((item: any) => ({
          id: item.id,
          name: item.description,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.amount,
          sortOrder: item.sort_order,
        })),
    }

    // Remove raw PostgREST join key
    delete (transformedProposal as Record<string, unknown>).proposal_line_items

    return NextResponse.json({ ok: true, proposal: transformedProposal, messageId: sendResult.messageId })
  } catch (error) {
    logger.error('Send proposal error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
