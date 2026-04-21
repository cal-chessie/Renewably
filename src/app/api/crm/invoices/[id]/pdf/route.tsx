import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1A1A',
    lineHeight: 1.5,
  },
  headerBar: {
    height: 5,
    backgroundColor: '#F3D840',
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0A0A0A',
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 1,
  },
  invoiceBadge: {
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 28,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 4,
  },
  statusBadge: {
    display: 'inline-flex' as any,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    alignSelf: 'flex-end',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 30,
  },
  detailBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 14,
  },
  detailHeading: {
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  detailName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableColHeader: {
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: '#9CA3AF',
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  itemName: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1A1A1A',
  },
  itemDescription: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 1,
  },
  itemCell: {
    fontSize: 10,
    color: '#374151',
  },
  itemCellBold: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 600,
  },
  totalsContainer: {
    alignSelf: 'flex-end',
    width: 260,
    marginTop: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  totalsRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#F3D840',
    fontSize: 16,
    fontWeight: 700,
    color: '#0A0A0A',
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#22C55E',
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#F59E0B',
  },
  paymentSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 14,
    marginTop: 20,
  },
  paymentHeading: {
    fontSize: 11,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 9,
    color: '#374151',
  },
  paymentAmount: {
    fontWeight: 600,
  },
  notesSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 14,
    marginTop: 20,
  },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    textAlign: 'center' as const,
  },
  footerThanks: {
    fontSize: 13,
    color: '#374151',
    fontWeight: 500,
    marginBottom: 6,
  },
  footerText: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 4,
  },
})

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function fmtDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function statusColour(status: string): { bg: string; text: string } {
  switch (status) {
    case 'paid': return { bg: '#F0FDF4', text: '#22C55E' }
    case 'overdue': return { bg: '#FEF2F2', text: '#EF4444' }
    case 'partially_paid': return { bg: '#FFFBEB', text: '#F59E0B' }
    case 'sent': return { bg: '#EFF6FF', text: '#3B82F6' }
    default: return { bg: '#F3F4F6', text: '#6B7280' }
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF DOCUMENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function InvoiceDocument({
  invoice,
  paidAmount,
}: {
  invoice: any
  paidAmount: number
}) {
  const clientName =
    invoice.company?.name ||
    `${invoice.contact?.firstName || ''} ${invoice.contact?.lastName || ''}`.trim() ||
    'Client'
  const clientEmail = invoice.contact?.email || ''
  const clientAddress = invoice.company?.address || ''
  const clientCity = (invoice.company as any)?.city || ''
  const clientCountry = (invoice.company as any)?.country || ''

  const fromCompany = invoice.company?.name || 'Your Company'
  const fromEmail = (invoice.company as any)?.email || ''
  const fromPhone = (invoice.company as any)?.phone || ''

  const remainingAmount = invoice.totalAmount - paidAmount
  const sc = statusColour(invoice.status)
  const completedPayments = invoice.payments.filter(
    (p: any) => p.status === 'completed'
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Yellow accent bar */}
        <View style={styles.headerBar} />

        {/* Header: company info + invoice number */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{fromCompany}</Text>
            {fromEmail && <Text style={styles.companyDetail}>{fromEmail}</Text>}
            {fromPhone && <Text style={styles.companyDetail}>{fromPhone}</Text>}
          </View>
          <View style={styles.invoiceBadge}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: sc.bg, color: sc.text },
              ]}
            >
              <Text style={{ fontSize: 9, fontWeight: 600, color: sc.text }}>
                {statusLabel(invoice.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bill To + Invoice Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailBox}>
            <Text style={styles.detailHeading}>Bill To</Text>
            <Text style={styles.detailName}>{clientName}</Text>
            {clientEmail && <Text style={styles.detailText}>{clientEmail}</Text>}
            {clientAddress && (
              <Text style={styles.detailText}>{clientAddress}</Text>
            )}
            {clientCity && <Text style={styles.detailText}>{clientCity}</Text>}
            {clientCountry && (
              <Text style={styles.detailText}>{clientCountry}</Text>
            )}
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailHeading}>Invoice Details</Text>
            <Text style={styles.detailText}>
              <Text style={{ fontWeight: 600 }}>Date: </Text>
              {fmtDate(invoice.createdAt)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={{ fontWeight: 600 }}>Due Date: </Text>
              {fmtDate(invoice.dueDate)}
            </Text>
            {invoice.proposal && (
              <Text style={styles.detailText}>
                <Text style={{ fontWeight: 600 }}>Proposal: </Text>
                {invoice.proposal.title}
              </Text>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableColHeader, { flex: 3 }]}>Item</Text>
          <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>
            Qty
          </Text>
          <Text
            style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}
          >
            Unit Price
          </Text>
          <Text
            style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}
          >
            Total
          </Text>
        </View>

        {invoice.lineItems.map((item: any, idx: number) => (
          <View
            key={item.id || idx}
            style={[
              styles.tableRow,
              idx % 2 === 1 ? styles.tableRowEven : null,
            ].filter(Boolean) as any}
          >
            <View style={{ flex: 3 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDescription}>{item.description}</Text>
              )}
            </View>
            <Text style={[styles.itemCell, { flex: 1, textAlign: 'right' }]}>
              {item.quantity}
            </Text>
            <Text style={[styles.itemCell, { flex: 1.5, textAlign: 'right' }]}>
              {fmtCurrency(item.unitPrice)}
            </Text>
            <Text
              style={[styles.itemCellBold, { flex: 1.5, textAlign: 'right' }]}
            >
              {fmtCurrency(item.total)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{fmtCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text>Tax ({invoice.taxRate}%)</Text>
              <Text>{fmtCurrency(invoice.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalsRowTotal}>
            <Text>Total</Text>
            <Text>{fmtCurrency(invoice.totalAmount)}</Text>
          </View>
          {paidAmount > 0 && (
            <View style={styles.paidRow}>
              <Text>Paid</Text>
              <Text>-{fmtCurrency(paidAmount)}</Text>
            </View>
          )}
          {remainingAmount > 0 && paidAmount > 0 && (
            <View style={styles.remainingRow}>
              <Text>Remaining</Text>
              <Text>{fmtCurrency(remainingAmount)}</Text>
            </View>
          )}
        </View>

        {/* Payment History */}
        {completedPayments.length > 0 && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentHeading}>Payment History</Text>
            {completedPayments.map((p: any, idx: number) => (
              <View key={p.id || idx} style={styles.paymentItem}>
                <Text>
                  {fmtDate(p.paidAt)} — {p.method.replace(/_/g, ' ')}
                  {p.reference ? ` (${p.reference})` : ''}
                </Text>
                <Text style={styles.paymentAmount}>
                  {fmtCurrency(p.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.detailHeading}>Notes</Text>
            <Text style={{ fontSize: 10, color: '#374151', lineHeight: 1.5 }}>
              {invoice.notes}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerThanks}>Thank you for your business!</Text>
          <Text style={styles.footerText}>
            Payment terms: Net 30 days from invoice date unless otherwise agreed.
          </Text>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} {fromCompany}. All rights reserved.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

// GET: Generate branded PDF invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()
    const { id } = await params

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, contact:contacts(*), company:companies(*), deal:deals(*), proposal:proposals(*), invoice_line_items(*), payments(*)')
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Calculate paid amount
    const paidAmount = (invoice.payments || [])
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    // Transform data for PDF component compatibility
    const mappedInvoice = {
      ...invoice,
      invoiceNumber: invoice.invoice_number,
      totalAmount: invoice.total_amount,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      lineItems: (invoice.invoice_line_items || []).map((item: any) => ({
        ...item,
        name: item.description,
        total: item.amount,
        unitPrice: item.unit_price,
        sortOrder: item.sort_order,
      })).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      contact: invoice.contact ? {
        ...invoice.contact,
        firstName: '',
        lastName: invoice.contact.name,
      } : null,
      deal: invoice.deal ? {
        ...invoice.deal,
        title: invoice.deal.product,
      } : null,
      payments: invoice.payments || [],
      taxRate: invoice.subtotal_amount > 0 ? (invoice.tax_amount / invoice.subtotal_amount * 100) : 0,
      subtotal: invoice.subtotal_amount,
      taxAmount: invoice.tax_amount,
    }

    // Generate real PDF
    const pdfBytes = await pdf(
      <InvoiceDocument invoice={mappedInvoice} paidAmount={paidAmount} />
    ).toBuffer()

    return new NextResponse(pdfBytes as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Generate PDF error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
