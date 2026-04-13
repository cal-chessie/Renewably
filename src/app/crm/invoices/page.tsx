'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Send,
  CheckCircle2,
  Receipt,
  Euro,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
  CreditCard,
  Download,
  Clock,
  FileText,
  Building2,
  User,
  GripVertical,
  Calendar,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { toast } from 'sonner'

// ── Helpers ──

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-[#A0A0A0]', bgColor: 'bg-[#1A1A1A]' },
  sent: { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  viewed: { label: 'Viewed', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  paid: { label: 'Paid', color: 'text-green-600', bgColor: 'bg-green-50' },
  partially_paid: { label: 'Partial', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  overdue: { label: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-50' },
  cancelled: { label: 'Cancelled', color: 'text-[#A0A0A0]', bgColor: 'bg-[#1A1A1A]' },
}

interface InvoiceLineItem {
  id: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  sortOrder: number
}

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  reference: string | null
  notes: string | null
  paidAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  dueDate: string | null
  sentAt: string | null
  paidAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  contact: { id: string; firstName: string; lastName: string; email: string } | null
  company: { id: string; name: string } | null
  deal: { id: string; title: string } | null
  proposal: { id: string; title: string } | null
  _count?: { lineItems: number; payments: number }
  lineItems?: InvoiceLineItem[]
  payments?: Payment[]
}

// ── Status Badge ──

function InvoiceStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  )
}

// ── Stats Cards ──

function StatsCards({ stats }: { stats: { totalInvoiced: number; outstanding: number; overdueAmount: number; paidThisMonth: number } | null }) {
  if (!stats) return null
  const cards = [
    { label: 'Total Invoiced', value: formatCurrency(stats.totalInvoiced), icon: Euro, color: 'text-[#374151]' },
    { label: 'Outstanding', value: formatCurrency(stats.outstanding), icon: Clock, color: 'text-amber-600' },
    { label: 'Overdue', value: formatCurrency(stats.overdueAmount), icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Paid This Month', value: formatCurrency(stats.paidThisMonth), icon: CheckCircle2, color: 'text-green-600' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg p-4 shadow-sm border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-1">
            <card.icon className={`h-4 w-4 ${card.color}`} />
            <span className="text-xs text-[#A0A0A0]">{card.label}</span>
          </div>
          <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ── Create/Edit Invoice Dialog ──

function InvoiceForm({
  invoice,
  contacts,
  companies,
  deals,
  proposals,
  onClose,
}: {
  invoice?: Invoice
  contacts: Array<{ id: string; firstName: string; lastName: string }>
  companies: Array<{ id: string; name: string }>
  deals: Array<{ id: string; title: string }>
  proposals: Array<{ id: string; title: string; status: string; lineItems?: InvoiceLineItem[]; contact?: { id: string; firstName: string; lastName: string } | null; company?: { id: string; name: string } | null; deal?: { id: string; title: string } | null }>
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEditing = !!invoice

  const [form, setForm] = useState({
    contactId: invoice?.contact?.id || '',
    companyId: invoice?.company?.id || '',
    dealId: invoice?.deal?.id || '',
    proposalId: invoice?.proposal?.id || '',
    taxRate: invoice?.taxRate?.toString() || '0',
    dueDate: invoice?.dueDate?.split('T')[0] || '',
    notes: invoice?.notes || '',
  })

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice?.lineItems?.length
      ? invoice.lineItems
      : [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1, unitPrice: 0, total: 0, sortOrder: 0 }]
  )

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxRate = parseFloat(form.taxRate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const totalAmount = subtotal + taxAmount

  const loadProposal = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId)
    if (!proposal?.lineItems?.length) return
    setLineItems(proposal.lineItems.map(item => ({ ...item, id: crypto.randomUUID() })))
    if (proposal.contact) setForm(f => ({ ...f, contactId: proposal.contact!.id }))
    if (proposal.company) setForm(f => ({ ...f, companyId: proposal.company!.id }))
    if (proposal.deal) setForm(f => ({ ...f, dealId: proposal.deal!.id }))
    toast.success(`Loaded items from "${proposal.title}"`)
  }

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updated = [...lineItems]
    const item = { ...updated[index] }
    ;(item as Record<string, unknown>)[field] = value
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice
    }
    updated[index] = item
    setLineItems(updated)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { id: crypto.randomUUID(), name: '', description: '', quantity: 1, unitPrice: 0, total: 0, sortOrder: lineItems.length }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        contactId: form.contactId || null,
        companyId: form.companyId || null,
        dealId: form.dealId || null,
        proposalId: form.proposalId || null,
        taxRate: parseFloat(form.taxRate) || 0,
        dueDate: form.dueDate || null,
        notes: form.notes || null,
        lineItems: lineItems.map((item, i) => ({ ...item, sortOrder: i })),
      }

      if (isEditing) {
        const res = await fetch(`/api/crm/invoices/${invoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to update') }
        return res.json()
      } else {
        const res = await fetch('/api/crm/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to create') }
        return res.json()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success(isEditing ? 'Invoice updated' : 'Invoice created')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>{isEditing ? `Edit ${invoice.invoiceNumber}` : 'Create New Invoice'}</DialogTitle>
        <DialogDescription>{isEditing ? 'Update invoice details' : 'Add line items and set billing details'}</DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto space-y-4 py-2">
        {/* Proposal Selector */}
        <div className="space-y-2">
          <Label>Load from Proposal (optional)</Label>
          <Select value={form.proposalId} onValueChange={loadProposal}>
            <SelectTrigger>
              <SelectValue placeholder="Select proposal to pre-fill..." />
            </SelectTrigger>
            <SelectContent>
              {proposals.filter(p => p.status === 'accepted').map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact, Company, Deal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Contact</Label>
            <Select value={form.contactId} onValueChange={v => setForm(f => ({ ...f, contactId: v }))}>
              <SelectTrigger><SelectValue placeholder="Contact" /></SelectTrigger>
              <SelectContent>
                {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Select value={form.companyId} onValueChange={v => setForm(f => ({ ...f, companyId: v }))}>
              <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deal</Label>
            <Select value={form.dealId} onValueChange={v => setForm(f => ({ ...f, dealId: v }))}>
              <SelectTrigger><SelectValue placeholder="Deal" /></SelectTrigger>
              <SelectContent>
                {deals.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due Date & Tax */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input type="number" min={0} max={100} step={0.5} value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Line Items</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="text-xs border-[#F3D840] text-[#374151] hover:bg-[#F3D840]/10">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>

          <div className="space-y-2 overflow-x-auto">
            {lineItems.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-[#666666] shrink-0" />
                  <Input value={item.name} onChange={e => updateLineItem(index, 'name', e.target.value)} placeholder="Item name *" className="flex-1 h-8 text-sm" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-[#666666] hover:text-red-500" onClick={() => removeLineItem(index)} disabled={lineItems.length <= 1}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {isEditing && <Input value={item.description} onChange={e => updateLineItem(index, 'description', e.target.value)} placeholder="Description (optional)" className="h-7 text-xs pl-7" />}
                <div className="grid grid-cols-3 gap-2 pl-6">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-[#666666] font-medium">Qty</span>
                    <Input type="number" min={1} value={item.quantity} onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-[#666666] font-medium">Unit Price</span>
                    <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={e => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-[#666666] font-medium">Total</span>
                    <div className="h-8 flex items-center px-3 rounded-md border text-sm font-medium" style={{ color: '#FFFFFF' }}>{formatCurrency(item.total)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-[#F3D840]/10 border border-[#F3D840]/30 rounded-lg p-4 space-y-1">
            <div className="flex justify-between text-sm text-[#A0A0A0]"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {taxRate > 0 && <div className="flex justify-between text-sm text-[#A0A0A0]"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmount)}</span></div>}
            <div className="flex justify-between pt-2 border-t border-[#F3D840]/30">
              <span className="font-semibold text-[#A0A0A0]">Total</span>
              <span className="text-2xl font-bold text-[#374151]">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, additional info..." rows={2} />
        </div>
      </div>

      <DialogFooter className="pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832]">
          {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Payment Form ──

function PaymentForm({
  invoiceId,
  invoiceNumber,
  remainingAmount,
  onClose,
}: {
  invoiceId: string
  invoiceNumber: string
  remainingAmount: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    amount: remainingAmount > 0 ? remainingAmount.toFixed(2) : '0',
    method: 'bank_transfer',
    reference: '',
    notes: '',
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          method: form.method,
          reference: form.reference || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to add payment') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      toast.success('Payment recorded')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Record Payment - {invoiceNumber}</DialogTitle>
        <DialogDescription>Remaining: {formatCurrency(remainingAmount)}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Amount (€)</Label>
          <Input type="number" min={0.01} step={0.01} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Reference / Transaction ID</Label>
          <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g., TXN-12345" />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !parseFloat(form.amount) || parseFloat(form.amount) <= 0} className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832]">
          {mutation.isPending ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Branded Invoice Preview ──

function BrandedInvoicePreview({ invoice, paidAmount }: { invoice: Invoice; paidAmount: number }) {
  const clientName = invoice.company?.name || `${invoice.contact?.firstName || ''} ${invoice.contact?.lastName || ''}`.trim() || 'Client'
  const clientEmail = invoice.contact?.email || ''
  const remaining = invoice.totalAmount - paidAmount

  return (
    <div style={{ backgroundColor: '#1A1A1A' }} className="rounded-lg shadow-sm border border-[#2A2A2A] overflow-hidden">
      {/* Yellow accent bar */}
      <div className="h-1.5 bg-[#F3D840]" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">Renewably</h2>
            <p className="text-xs text-[#A0A0A0] mt-0.5">Renewably, Ireland</p>
            <p className="text-xs text-[#A0A0A0]">cal@renewably.ie</p>
            <p className="text-xs text-[#A0A0A0]">+353 873958424</p>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold text-[#374151]">{invoice.invoiceNumber}</h3>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg p-3">
            <span className="text-[10px] uppercase text-[#666666] font-medium">Bill To</span>
            <p style={{ color: '#FFFFFF' }} className="text-sm font-semibold mt-1">{clientName}</p>
            {clientEmail && <p className="text-xs text-[#A0A0A0]">{clientEmail}</p>}
          </div>
          <div className="rounded-lg p-3">
            <span className="text-[10px] uppercase text-[#666666] font-medium">Invoice Details</span>
            <p className="text-xs text-[#A0A0A0] mt-1"><span className="text-[#666666]">Date:</span> {formatDate(invoice.createdAt)}</p>
            <p className="text-xs text-[#A0A0A0]"><span className="text-[#666666]">Due:</span> {formatDate(invoice.dueDate)}</p>
            {invoice.proposal && <p className="text-xs text-[#A0A0A0]"><span className="text-[#666666]">Proposal:</span> {invoice.proposal.title}</p>}
          </div>
        </div>

        {/* Line Items */}
        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#141414]">
                  <th className="text-left text-[10px] uppercase text-[#666666] font-medium px-3 py-2">Item</th>
                  <th className="text-right text-[10px] uppercase text-[#666666] font-medium px-3 py-2 w-14">Qty</th>
                  <th className="text-right text-[10px] uppercase text-[#666666] font-medium px-3 py-2 w-24">Price</th>
                  <th className="text-right text-[10px] uppercase text-[#666666] font-medium px-3 py-2 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className={invoice.lineItems!.indexOf(item) % 2 === 1 ? '50' : ''}>
                    <td className="px-3 py-2">
                      <p style={{ color: '#FFFFFF' }} className="text-sm font-medium">{item.name}</p>
                      {item.description && <p className="text-[11px] text-[#666666]">{item.description}</p>}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-[#A0A0A0]">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-sm text-[#A0A0A0]">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2 text-right text-sm font-medium" style={{ color: '#FFFFFF' }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {invoice.taxRate > 0 && (
                  <tr className="border-t border-[#2A2A2A]">
                    <td colSpan={3} className="px-3 py-2 text-xs text-[#A0A0A0] text-right">Subtotal</td>
                    <td className="px-3 py-2 text-right text-sm text-[#A0A0A0]">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                )}
                {invoice.taxRate > 0 && (
                  <tr className="border-t border-[#2A2A2A]">
                    <td colSpan={3} className="px-3 py-2 text-xs text-[#A0A0A0] text-right">Tax ({invoice.taxRate}%)</td>
                    <td className="px-3 py-2 text-right text-sm text-[#A0A0A0]">{formatCurrency(invoice.taxAmount)}</td>
                  </tr>
                )}
                <tr className="bg-[#F3D840]/10 border-t-2 border-[#F3D840]/50">
                  <td colSpan={3} className="px-3 py-3 text-sm font-semibold text-[#A0A0A0] text-right">Total</td>
                  <td className="px-3 py-3 text-right text-lg font-bold text-[#374151]">{formatCurrency(invoice.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#FFFFFF" }}>Payment History</h4>
            <div className="space-y-1">
              {invoice.payments.map(p => (
                <div key={p.id} className="flex justify-between items-center py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-[#A0A0A0]">{formatDate(p.paidAt)} - {p.method.replace(/_/g, ' ')}</span>
                    {p.reference && <span className="text-[11px] text-[#666666]">({p.reference})</span>}
                  </div>
                  <span className="font-semibold text-green-600">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
            {paidAmount > 0 && remaining > 0 && (
              <div className="mt-2 pt-2 border-t border-[#2A2A2A] flex justify-between text-sm">
                <span className="text-amber-600 font-medium">Remaining</span>
                <span className="font-bold text-amber-600">{formatCurrency(remaining)}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="rounded-lg p-3">
            <span className="text-[10px] uppercase text-[#666666] font-medium">Notes</span>
            <p className="text-xs text-[#A0A0A0] mt-1 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2 border-t border-[#2A2A2A]">
          <p className="text-sm text-[#A0A0A0] font-medium">Thank you for your business!</p>
          <p className="text-[11px] text-[#666666] mt-1">Payment terms: Net 30 days. &copy; {new Date().getFullYear()} Renewably.</p>
        </div>
      </div>
    </div>
  )
}

// ── Invoice Detail Sheet ──

function InvoiceDetail({
  invoice,
  onClose,
  onEdit,
}: {
  invoice: Invoice
  onClose: () => void
  onEdit: (inv: Invoice) => void
}) {
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details')

  const { data: detailData } = useQuery({
    queryKey: ['invoice', invoice.id],
    queryFn: () => fetch(`/api/crm/invoices/${invoice.id}`).then(r => r.json()),
    refetchInterval: 5000,
  })

  const fullInvoice = detailData?.invoice || invoice
  const paidAmount = detailData?.paidAmount || 0
  const remainingAmount = detailData?.remainingAmount || fullInvoice.totalAmount

  const sendMutation = useMutation({
    mutationFn: () => fetch(`/api/crm/invoices/${invoice.id}/send`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] }); toast.success('Invoice sent!') },
    onError: () => toast.error('Failed to send'),
  })

  const markPaidMutation = useMutation({
    mutationFn: () => fetch(`/api/crm/invoices/${invoice.id}/mark-paid`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] }); toast.success('Invoice marked as paid!') },
    onError: () => toast.error('Failed to mark as paid'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/crm/invoices/${invoice.id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted'); onClose() },
    onError: () => toast.error('Failed to delete'),
  })

  const downloadPdf = () => {
    window.open(`/api/crm/invoices/${invoice.id}/pdf`, '_blank')
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-lg">{fullInvoice.invoiceNumber}</SheetTitle>
              <SheetDescription>Created {formatDate(fullInvoice.createdAt)}</SheetDescription>
            </div>
            <InvoiceStatusBadge status={fullInvoice.status} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {(['details', 'preview'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === tab ? 'bg-[#F3D840] text-[#374151]' : 'text-[#A0A0A0] hover:bg-[#1A1A1A]'}`}>
                {tab === 'details' ? 'Details' : 'Preview'}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'preview' ? (
            <div className="p-6">
              <BrandedInvoicePreview invoice={{ ...fullInvoice, lineItems: fullInvoice.lineItems || invoice.lineItems, payments: fullInvoice.payments || [] }} paidAmount={paidAmount} />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                {fullInvoice.contact && (
                  <div className="rounded-lg p-3">
                    <span className="text-[10px] uppercase text-[#666666] font-medium">Contact</span>
                    <p style={{ color: '#FFFFFF' }} className="text-sm font-medium mt-0.5">{fullInvoice.contact.firstName} {fullInvoice.contact.lastName}</p>
                    <p className="text-xs text-[#A0A0A0]">{fullInvoice.contact.email}</p>
                  </div>
                )}
                {fullInvoice.company && (
                  <div className="rounded-lg p-3">
                    <span className="text-[10px] uppercase text-[#666666] font-medium">Company</span>
                    <p style={{ color: '#FFFFFF' }} className="text-sm font-medium mt-0.5">{fullInvoice.company.name}</p>
                  </div>
                )}
                <div className="rounded-lg p-3">
                  <span className="text-[10px] uppercase text-[#666666] font-medium">Total Amount</span>
                  <p className="text-lg font-bold text-[#374151] mt-0.5">{formatCurrency(fullInvoice.totalAmount)}</p>
                </div>
                <div className="rounded-lg p-3">
                  <span className="text-[10px] uppercase text-[#666666] font-medium">Due Date</span>
                  <p style={{ color: '#FFFFFF' }} className="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />{formatDate(fullInvoice.dueDate)}
                  </p>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-[#F3D840]/5 border border-[#F3D840]/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-[#A0A0A0]">Subtotal</span><span>{formatCurrency(fullInvoice.subtotal)}</span></div>
                {fullInvoice.taxRate > 0 && <div className="flex justify-between text-sm"><span className="text-[#A0A0A0]">Tax ({fullInvoice.taxRate}%)</span><span>{formatCurrency(fullInvoice.taxAmount)}</span></div>}
                <div className="flex justify-between text-base font-bold border-t border-[#F3D840]/30 pt-2"><span>Total</span><span className="text-[#374151]">{formatCurrency(fullInvoice.totalAmount)}</span></div>
                {paidAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Paid</span><span>-{formatCurrency(paidAmount)}</span></div>}
                {remainingAmount > 0 && paidAmount > 0 && <div className="flex justify-between text-sm font-semibold text-amber-600"><span>Remaining</span><span>{formatCurrency(remainingAmount)}</span></div>}
              </div>

              {/* Line Items Table */}
              {fullInvoice.lineItems && fullInvoice.lineItems.length > 0 && (
                <div>
                  <h3 style={{ color: '#FFFFFF' }} className="text-sm font-semibold mb-2">Line Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead><tr className="bg-[#141414]"><th className="text-left text-[10px] uppercase text-[#666666] font-medium px-3 py-2">Item</th><th className="text-right text-[10px] uppercase text-[#666666] font-medium px-3 py-2 w-12">Qty</th><th className="text-right text-[10px] uppercase text-[#666666] font-medium px-3 py-2 w-20">Price</th><th className="text-right text-[10px] uppercase text-[#666666] font-medium px-3 py-2 w-20">Total</th></tr></thead>
                      <tbody>
                        {fullInvoice.lineItems.map(item => (
                          <tr key={item.id} className="border-t border-[#2A2A2A]">
                            <td className="px-3 py-2"><p style={{ color: '#FFFFFF' }} className="text-sm font-medium">{item.name}</p></td>
                            <td className="px-3 py-2 text-right text-sm text-[#A0A0A0]">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-sm text-[#A0A0A0]">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-right text-sm font-medium" style={{ color: '#FFFFFF' }}>{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {fullInvoice.payments && fullInvoice.payments.length > 0 && (
                <div>
                  <h3 style={{ color: '#FFFFFF' }} className="text-sm font-semibold mb-2">Payment History</h3>
                  <div className="space-y-2">
                    {fullInvoice.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <div>
                            <p style={{ color: '#FFFFFF' }} className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                            <p className="text-[11px] text-[#A0A0A0]">{p.method.replace(/_/g, ' ')} - {formatDateTime(p.paidAt)}{p.reference ? ` (${p.reference})` : ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {fullInvoice.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#FFFFFF" }}>Notes</h3>
                  <div className="rounded-lg p-3 text-sm text-[#A0A0A0] whitespace-pre-wrap">{fullInvoice.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-4 space-y-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {fullInvoice.status === 'draft' && (
              <Button size="sm" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending} className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832]">
                <Send className="h-3.5 w-3.5 mr-1.5" /> {sendMutation.isPending ? 'Sending...' : 'Send Invoice'}
              </Button>
            )}
            {!['paid', 'cancelled'].includes(fullInvoice.status) && (
              <>
                <Button size="sm" variant="outline" onClick={() => markPaidMutation.mutate()} disabled={markPaidMutation.isPending} className="border-green-400 text-green-600 hover:bg-green-500/10">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark Paid
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)} className="border-[#F3D840] text-[#374151] hover:bg-[#F3D840]/10">
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Add Payment
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={downloadPdf} className="text-[#A0A0A0]">
              <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(fullInvoice)} className="text-[#A0A0A0]">
              <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)} className="text-red-500 border-red-200 hover:bg-red-500/10">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Delete Invoice</DialogTitle>
            <DialogDescription>Are you sure you want to delete &quot;{fullInvoice.invoiceNumber}&quot;? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <PaymentForm invoiceId={fullInvoice.id} invoiceNumber={fullInvoice.invoiceNumber} remainingAmount={remainingAmount} onClose={() => setPaymentOpen(false)} />
      </Dialog>
    </>
  )
}

// ── Main Invoices Page ──

export default function InvoicesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '100')
      return fetch(`/api/crm/invoices?${params}`).then(r => r.json())
    },
    refetchInterval: 10000,
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-mini'],
    queryFn: () => fetch('/api/crm/contacts?limit=100').then(r => r.json()),
  })

  const { data: companiesData } = useQuery({
    queryKey: ['companies-mini'],
    queryFn: () => fetch('/api/crm/companies?limit=100').then(r => r.json()),
  })

  const { data: dealsData } = useQuery({
    queryKey: ['deals-mini'],
    queryFn: () => fetch('/api/crm/deals?limit=100').then(r => r.json()),
  })

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals-invoices'],
    queryFn: () => fetch('/api/crm/proposals?limit=100').then(r => r.json()),
  })

  const { data: detailData } = useQuery({
    queryKey: ['invoice', selectedInvoice?.id],
    queryFn: () => fetch(`/api/crm/invoices/${selectedInvoice!.id}`).then(r => r.json()),
    enabled: !!selectedInvoice && detailOpen,
  })

  const fullInvoice = detailData?.invoice || selectedInvoice
  const invoices: Invoice[] = invoicesData?.invoices || []
  const contacts = contactsData?.contacts || []
  const companies = companiesData?.companies || []
  const deals = dealsData?.deals || []
  const proposals = proposalsData?.proposals || []
  const stats = invoicesData?.stats || null

  const handleOpenDetail = useCallback((inv: Invoice) => {
    setSelectedInvoice(inv)
    setDetailOpen(true)
  }, [])

  const handleOpenEdit = useCallback((inv: Invoice) => {
    setEditingInvoice(inv)
    setEditOpen(true)
  }, [])

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }} className="min-h-full px-4 pt-2 pb-6 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ color: '#FFFFFF' }} className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-[#F3D840]" />
            Invoices
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">Manage invoices and track payments</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832] font-medium">
          <Plus className="h-4 w-4 mr-2" /> Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#1A1A1A' }} className="rounded-lg shadow-sm border border-[#2A2A2A] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-[#F3D840] border-t-transparent rounded-full" /></div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#666666]">
            <Receipt className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No invoices found</p>
            <p className="text-xs mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left text-[11px] uppercase text-[#666666] font-medium px-4 py-3">Invoice #</th>
                  <th className="text-left text-[11px] uppercase text-[#666666] font-medium px-4 py-3">Client</th>
                  <th className="text-right text-[11px] uppercase text-[#666666] font-medium px-4 py-3">Amount</th>
                  <th className="text-center text-[11px] uppercase text-[#666666] font-medium px-4 py-3">Status</th>
                  <th className="text-left text-[11px] uppercase text-[#666666] font-medium px-4 py-3">Due Date</th>
                  <th className="text-right text-[11px] uppercase text-[#666666] font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: 'rgba(243,216,64,0.04)' }}
                    className="border-b border-[#2A2A2A] cursor-pointer"
                    onClick={() => handleOpenDetail(inv)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#666666]" />
                        <span style={{ color: "#FFFFFF" }} className="text-sm font-semibold">{inv.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ color: '#FFFFFF' }} className="text-sm">
                        {inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`.trim() || '—'}
                      </div>
                      {inv.proposal && <p className="text-[11px] text-[#666666]">{inv.proposal.title}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold" style={{ color: "#FFFFFF" }}>{formatCurrency(inv.totalAmount)}</span>
                      {inv._count && inv._count.payments > 0 && (
                        <p className="text-[11px] text-green-600">{inv._count.payments} payment{inv._count.payments > 1 ? 's' : ''}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#A0A0A0]">{formatDate(inv.dueDate)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenEdit(inv) }} className="h-7 w-7 p-0 text-[#666666] hover:text-[#A0A0A0]">
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent style={{ backgroundColor: "#1A1A1A" }} className="w-full sm:max-w-xl overflow-hidden">
          {fullInvoice && (
            <InvoiceDetail invoice={fullInvoice} onClose={() => setDetailOpen(false)} onEdit={(inv) => { setDetailOpen(false); handleOpenEdit(inv) }} />
          )}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <InvoiceForm contacts={contacts} companies={companies} deals={deals} proposals={proposals} onClose={() => setIsCreating(false)} />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {editingInvoice && (
          <InvoiceForm invoice={editingInvoice} contacts={contacts} companies={companies} deals={deals} proposals={proposals} onClose={() => { setEditOpen(false); setEditingInvoice(null) }} />
        )}
      </Dialog>
    </div>
  )
}
