import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { escapeHtml as esc, isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET: Generate branded PDF invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`pdf:${getClientIp(request)}`, { maxAttempts: 5, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        contact: true,
        company: true,
        deal: true,
        proposal: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const paidAmount = invoice.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    // Generate HTML for the PDF
    const html = generateInvoiceHtml(invoice, paidAmount)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.html"`,
      },
    })
  } catch (error) {
    logger.error('Generate PDF error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function generateInvoiceHtml(invoice: any, paidAmount: number): string {
  const clientName = esc(invoice.company?.name ||
    `${invoice.contact?.firstName || ''} ${invoice.contact?.lastName || ''}`.trim() || 'Client')
  const clientEmail = esc(invoice.contact?.email || '')
  const clientAddress = esc(invoice.company?.address || invoice.company?.city || '')
  const clientCity = esc(invoice.company?.city || '')
  const clientCountry = esc(invoice.company?.country || '')

  const remainingAmount = invoice.totalAmount - paidAmount

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header-bar { height: 6px; background: #F3D840; margin-bottom: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .company-info h1 { font-size: 24px; font-weight: 700; color: #1A1A1A; }
    .company-info p { font-size: 13px; color: #666; margin-top: 4px; }
    .invoice-badge { text-align: right; }
    .invoice-badge h2 { font-size: 32px; font-weight: 700; color: #374151; }
    .invoice-badge .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-draft { background: #f3f4f6; color: #6b7280; }
    .status-sent { background: #eff6ff; color: #3b82f6; }
    .status-paid { background: #f0fdf4; color: #22c55e; }
    .status-overdue { background: #fef2f2; color: #ef4444; }
    .status-partially_paid { background: #fffbeb; color: #f59e0b; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
    .detail-box { background: #f9fafb; border-radius: 8px; padding: 16px; }
    .detail-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 8px; }
    .detail-box p { font-size: 14px; color: #374151; }
    .detail-box .name { font-weight: 600; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead th { text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #e5e7eb; }
    tbody td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #fafafa; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals .row { display: flex; justify-content: space-between; padding: 8px 16px; font-size: 14px; color: #6b7280; }
    .totals .row.total { border-top: 2px solid #F3D840; font-weight: 700; font-size: 18px; color: #1A1A1A; padding: 12px 16px; }
    .payment-section { background: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 30px; }
    .payment-section h3 { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; }
    .payment-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer p { font-size: 12px; color: #9ca3af; }
    .footer .thanks { font-size: 16px; color: #374151; font-weight: 500; margin-bottom: 8px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 120px; font-weight: 700; color: rgba(243, 216, 64, 0.06); pointer-events: none; z-index: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="watermark">RENEWABLY</div>
  <div class="page">
    <div class="header-bar"></div>

    <div class="header">
      <div class="company-info">
        <h1>Renewably</h1>
        <p>Renewably, Ireland</p>
        <p>cal@renewably.ie</p>
        <p>+353 873958424</p>
      </div>
      <div class="invoice-badge">
        <h2>${invoice.invoiceNumber}</h2>
        <span class="status status-${invoice.status}">${invoice.status.replace(/_/g, ' ')}</span>
      </div>
    </div>

    <div class="details-grid">
      <div class="detail-box">
        <h3>Bill To</h3>
        <p class="name">${clientName}</p>
        ${clientEmail ? `<p>${esc(clientEmail)}</p>` : ''}
        ${clientAddress ? `<p>${esc(clientAddress)}</p>` : ''}
        ${clientCity ? `<p>${esc(clientCity)}</p>` : ''}
        ${clientCountry ? `<p>${esc(clientCountry)}</p>` : ''}
      </div>
      <div class="detail-box">
        <h3>Invoice Details</h3>
        <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
        <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
        ${invoice.proposal ? `<p><strong>Proposal:</strong> ${esc(invoice.proposal.title)}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lineItems.map((item: any) => `
        <tr>
          <td>
            <strong>${esc(item.name)}</strong>
            ${item.description ? `<br><span style="color:#9ca3af;font-size:12px">${esc(item.description)}</span>` : ''}
          </td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          <td class="text-right"><strong>${formatCurrency(item.total)}</strong></td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${formatCurrency(invoice.subtotal)}</span></div>
      ${invoice.taxRate > 0 ? `<div class="row"><span>Tax (${invoice.taxRate}%)</span><span>${formatCurrency(invoice.taxAmount)}</span></div>` : ''}
      <div class="row total"><span>Total</span><span>${formatCurrency(invoice.totalAmount)}</span></div>
      ${paidAmount > 0 ? `<div class="row" style="color:#22c55e;font-weight:600"><span>Paid</span><span>-${formatCurrency(paidAmount)}</span></div>` : ''}
      ${remainingAmount > 0 && paidAmount > 0 ? `<div class="row" style="color:#f59e0b;font-weight:600"><span>Remaining</span><span>${formatCurrency(remainingAmount)}</span></div>` : ''}
    </div>

    ${invoice.payments.length > 0 ? `
    <div class="payment-section">
      <h3>Payment History</h3>
      ${invoice.payments.filter((p: any) => p.status === 'completed').map((p: any) => `
      <div class="payment-item">
        <span>${formatDate(p.paidAt)} - ${esc(p.method.replace(/_/g, ' '))}${p.reference ? ` (${esc(p.reference)})` : ''}</span>
        <span style="font-weight:600">${formatCurrency(p.amount)}</span>
      </div>
      `).join('')}
    </div>
    ` : ''}

    ${invoice.notes ? `
    <div style="margin-top:30px;padding:16px;background:#f9fafb;border-radius:8px;">
      <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin-bottom:8px;">Notes</h3>
      <p style="font-size:14px;color:#374151;">${esc(invoice.notes)}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p class="thanks">Thank you for your business!</p>
      <p>Payment terms: Net 30 days from invoice date unless otherwise agreed.</p>
      <p style="margin-top:8px">&copy; ${new Date().getFullYear()} Renewably. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}
