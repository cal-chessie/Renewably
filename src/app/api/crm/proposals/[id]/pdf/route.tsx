import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1A1A1A', lineHeight: 1.5 },
  headerBar: { height: 5, backgroundColor: '#F3D840', marginBottom: 30 },
  coverSection: { backgroundColor: '#0A0A0A', borderRadius: 8, padding: 30, marginBottom: 24, alignItems: 'center' },
  coverCompany: { fontSize: 12, fontWeight: 700, color: '#F3D840', marginBottom: 8 },
  coverTitle: { fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 },
  coverDate: { fontSize: 10, color: '#9CA3AF' },
  coverPrepared: { fontSize: 10, color: '#D1D5DB', marginTop: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: '#F3D840' },
  sectionBody: { marginBottom: 20 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#E5E7EB', paddingBottom: 6, marginBottom: 4 },
  tableColHeader: { fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#9CA3AF', fontWeight: 600 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 8 },
  tableRowEven: { backgroundColor: '#FAFAFA' },
  itemName: { fontSize: 10, fontWeight: 600, color: '#1A1A1A' },
  itemDesc: { fontSize: 8, color: '#9CA3AF', marginTop: 1 },
  itemCell: { fontSize: 10, color: '#374151' },
  itemCellBold: { fontSize: 10, color: '#374151', fontWeight: 600 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 2, borderTopColor: '#F3D840', fontSize: 16, fontWeight: 700, color: '#0A0A0A', alignSelf: 'flex-end', width: 260, marginTop: 12 },
  tAndC: { fontSize: 9, color: '#666666', lineHeight: 1.6, marginBottom: 4 },
  roiBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 14, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#F3D840' },
  roiTitle: { fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 6 },
  roiItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 9, color: '#374151' },
  roiValue: { fontWeight: 600, color: '#0A0A0A' },
  signatureArea: { flexDirection: 'row', gap: 24, marginTop: 20 },
  signatureBox: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 14 },
  signatureLabel: { fontSize: 9, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#D1D5DB', borderBottomStyle: 'dashed' as const, marginBottom: 8, paddingBottom: 4 },
  signatureHint: { fontSize: 8, color: '#9CA3AF' },
  footer: { marginTop: 30, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', textAlign: 'center' as const },
  footerText: { fontSize: 9, color: '#9CA3AF', marginBottom: 2 },
})

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function fmtDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}

function calcROI(lineItems: Array<{ name: string; quantity: number; unitPrice: number }>): { systemKwp: number; annualGen: number; annualSavings: number; paybackYears: number; savings25yr: number } | null {
  const panelItem = lineItems.find(i => i.name.toLowerCase().includes('panel'))
  if (!panelItem) return null
  const wattPerPanel = 410
  const systemKwp = (panelItem.quantity * wattPerPanel) / 1000
  const annualGen = Math.round(systemKwp * 950)
  const ratePerKwh = 0.35
  const annualSavings = Math.round(annualGen * ratePerKwh * 0.7)
  const totalCost = lineItems.filter(i => i.unitPrice >= 0).reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const paybackYears = annualSavings > 0 ? Math.round((totalCost / annualSavings) * 10) / 10 : 0
  const savings25yr = annualSavings * 25
  return { systemKwp, annualGen, annualSavings, paybackYears, savings25yr }
}

function ProposalDocument({ proposal }: { proposal: any }) {
  const companyName = proposal.company?.name || 'Your Company'
  const contactName = proposal.contact ? `${proposal.contact.firstName || ''} ${proposal.contact.lastName || ''}`.trim() : 'Valued Customer'
  const roi = proposal.lineItems ? calcROI(proposal.lineItems) : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar} />
        <View style={styles.coverSection}>
          <Text style={styles.coverCompany}>{companyName}</Text>
          <Text style={styles.coverTitle}>{proposal.title}</Text>
          <Text style={styles.coverDate}>Prepared on {fmtDate(proposal.createdAt)}</Text>
          {proposal.validUntil && <Text style={styles.coverDate}>Valid until {fmtDate(proposal.validUntil)}</Text>}
          <Text style={styles.coverPrepared}>Prepared for: {contactName}</Text>
        </View>

        <View style={styles.sectionBody}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={{ fontSize: 10, color: '#666666', lineHeight: 1.6 }}>
            {proposal.clientDescription || proposal.notes || 'Please find our detailed proposal for your solar energy installation below. We are committed to providing you with the highest quality solar PV system tailored to your specific requirements.'}
          </Text>
        </View>

        {roi && (
          <View style={styles.roiBox}>
            <Text style={styles.roiTitle}>Savings Projection</Text>
            <View style={styles.roiItem}><Text>System Size</Text><Text style={styles.roiValue}>{roi.systemKwp.toFixed(1)} kWp</Text></View>
            <View style={styles.roiItem}><Text>Est. Annual Generation</Text><Text style={styles.roiValue}>{roi.annualGen.toLocaleString()} kWh</Text></View>
            <View style={styles.roiItem}><Text>Est. Annual Savings</Text><Text style={styles.roiValue}>{fmtCurrency(roi.annualSavings)}</Text></View>
            <View style={styles.roiItem}><Text>Payback Period</Text><Text style={styles.roiValue}>{roi.paybackYears} years</Text></View>
            <View style={styles.roiItem}><Text>25-Year Cumulative Savings</Text><Text style={styles.roiValue}>{fmtCurrency(roi.savings25yr)}</Text></View>
          </View>
        )}

        <View style={styles.sectionBody}>
          <Text style={styles.sectionTitle}>Investment Breakdown</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, { flex: 3 }]}>Item</Text>
            <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>Qty</Text>
            <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}>Unit Price</Text>
            <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
          </View>
          {proposal.lineItems?.map((item: any, idx: number) => (
            <View key={item.id || String(idx)} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <View style={{ flex: 3 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
              </View>
              <Text style={[styles.itemCell, { flex: 1, textAlign: 'right' }]}>{item.quantity}</Text>
              <Text style={[styles.itemCell, { flex: 1.5, textAlign: 'right' }]}>{fmtCurrency(item.unitPrice)}</Text>
              <Text style={[styles.itemCellBold, { flex: 1.5, textAlign: 'right' }]}>{fmtCurrency(item.total)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text>Total Investment</Text>
            <Text>{fmtCurrency(proposal.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.sectionBody}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.tAndC}>• This proposal is valid for 30 days from the date of issue unless otherwise stated.</Text>
          <Text style={styles.tAndC}>• Installation will commence within 2–4 weeks of acceptance, weather permitting.</Text>
          <Text style={styles.tAndC}>• All panels carry a 25-year linear performance warranty and 12-year product warranty.</Text>
          <Text style={styles.tAndC}>• Inverter warranty is 5 years (extendable to 10 years).</Text>
          <Text style={styles.tAndC}>• Payment terms: 50% deposit upon acceptance, 50% upon completion.</Text>
          <Text style={styles.tAndC}>• SEAI grant application assistance is included where applicable.</Text>
        </View>

        <View style={styles.signatureArea}>
          <View style={[styles.signatureBox, { borderColor: '#10B981' }]}>
            <Text style={[styles.signatureLabel, { color: '#10B981' }]}>I Accept This Proposal</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureHint}>Signature</Text>
            <View style={[styles.signatureLine, { marginTop: 8 }]} />
            <Text style={styles.signatureHint}>Date</Text>
          </View>
          <View style={[styles.signatureBox, { borderColor: '#EF4444' }]}>
            <Text style={[styles.signatureLabel, { color: '#EF4444' }]}>I Decline This Proposal</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureHint}>Signature</Text>
            <View style={[styles.signatureLine, { marginTop: 8 }]} />
            <Text style={styles.signatureHint}>Date</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© {new Date().getFullYear()} {companyName}. All rights reserved.</Text>
          <Text style={styles.footerText}>Generated by SolarPilot CRM</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, city: true, country: true } },
        deal: { select: { id: true, title: true, value: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const pdfStream = await pdf(<ProposalDocument proposal={proposal} />).toBlob()
    const arrayBuffer = await pdfStream.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="proposal-${proposal.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Generate proposal PDF error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
