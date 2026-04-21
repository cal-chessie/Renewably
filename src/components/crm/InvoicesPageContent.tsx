'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, FileText, Send, Eye, CheckCircle2, XCircle, Clock, Calendar,
  Building2, User, Euro, Trash2, Edit3, Copy, MoreHorizontal, X, AlertTriangle,
  Receipt, Mail, TrendingUp, BarChart3, Download, RefreshCw, Zap, Info,
  ChevronDown, Filter, ArrowUpDown, CheckSquare, Square, CreditCard,
  ArrowLeftRight, Sparkles, ExternalLink, Repeat, Percent, GripVertical,
  Ban, Bell, Banknote, FileWarning, Timer, Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ── Brand Constants ──
const BRAND_YELLOW = '#F3D840'
const BRAND_DARK = '#0A0A0A'
const BRAND_MUTED = '#666666'
const BRAND_SUBTLE = '#A0A0A0'
const BRAND_BORDER = '#2A2A2A'
const BRAND_SURFACE = '#1A1A1A'

const BRAND = { yellow: BRAND_YELLOW, dark: BRAND_DARK, surface: BRAND_SURFACE, border: BRAND_BORDER, muted: BRAND_MUTED, subtle: BRAND_SUBTLE } as const

// ── Helpers ──
function formatCurrency(value: number) { return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) }
function formatDate(date: string | Date | null | undefined) { if (!date) return '—'; return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date)) }
function formatDateTime(date: string | Date | null | undefined) { if (!date) return null; return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date)) }
function getDaysOverdue(dueDate: string | null): number { if (!dueDate) return 0; return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)) }
function applyTemplateVars(tpl: string, vars: Record<string, string>) { let r = tpl; for (const [k, v] of Object.entries(vars)) r = r.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v); return r }

// ── Status Config (with icons) ──
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: React.CSSProperties; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-[#A0A0A0]', bgColor: { backgroundColor: '#1A1A1A' }, icon: FileText },
  sent: { label: 'Sent', color: 'text-blue-500', bgColor: { backgroundColor: 'rgba(59,130,246,0.1)' }, icon: Send },
  viewed: { label: 'Viewed', color: 'text-indigo-500', bgColor: { backgroundColor: 'rgba(99,102,241,0.1)' }, icon: Eye },
  paid: { label: 'Paid', color: 'text-emerald-500', bgColor: { backgroundColor: 'rgba(16,185,129,0.1)' }, icon: CheckCircle2 },
  partially_paid: { label: 'Partial', color: 'text-amber-500', bgColor: { backgroundColor: 'rgba(245,158,11,0.1)' }, icon: Clock },
  overdue: { label: 'Overdue', color: 'text-red-500', bgColor: { backgroundColor: 'rgba(239,68,68,0.1)' }, icon: AlertTriangle },
  void: { label: 'Void', color: 'text-[#A0A0A0]', bgColor: { backgroundColor: '#1A1A1A' }, icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-[#A0A0A0]', bgColor: { backgroundColor: '#1A1A1A' }, icon: Ban },
}
const ALL_STATUSES = ['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'void', 'cancelled']

// ── Email Templates ──
const EMAIL_TEMPLATES = [
  { id: 'invoice_sent', name: 'Invoice Sent', icon: Send, subject: 'Invoice {{invoice_number}} from {{company_name}}', body: 'Dear {{contact_name}},\n\nPlease find attached invoice {{invoice_number}} for {{amount}}.\n\nPayment is due by {{due_date}}.\n\nKind regards,\nThe {{company_name}} Team' },
  { id: 'payment_reminder_7', name: 'Payment Reminder (7 days)', icon: Clock, subject: 'Friendly Reminder: Invoice {{invoice_number}} is due soon', body: 'Dear {{contact_name}},\n\nThis is a gentle reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nKind regards,\nThe {{company_name}} Team' },
  { id: 'payment_reminder_14', name: 'Payment Reminder (14 days)', icon: Bell, subject: 'Reminder: Invoice {{invoice_number}} — Action Required', body: 'Dear {{contact_name}},\n\nInvoice {{invoice_number}} for {{amount}} is now overdue.\n\nPlease arrange payment at your earliest convenience.\n\nKind regards,\nThe {{company_name}} Team' },
  { id: 'overdue_notice', name: 'Overdue Notice', icon: AlertTriangle, subject: 'URGENT: Overdue Invoice {{invoice_number}} — {{amount}}', body: 'Dear {{contact_name}},\n\nInvoice {{invoice_number}} for {{amount}} is now significantly overdue.\n\nPlease arrange payment immediately.\n\nKind regards,\nThe {{company_name}} Team' },
  { id: 'payment_receipt', name: 'Payment Receipt', icon: CheckCircle2, subject: 'Payment Received — Invoice {{invoice_number}}', body: 'Dear {{contact_name}},\n\nThank you for your payment of {{amount}} for invoice {{invoice_number}}.\n\nKind regards,\nThe {{company_name}} Team' },
  { id: 'first_notice', name: 'First Notice', icon: Mail, subject: 'Invoice {{invoice_number}} — Payment Required', body: 'Dear {{contact_name}},\n\nInvoice {{invoice_number}} for {{amount}} has been issued.\n\nPayment is due by {{due_date}}.\n\nKind regards,\nThe {{company_name}} Team' },
]

// ── Solar Package Shortcuts ──
const SOLAR_PACKAGES = [
  { name: '6-panel system (2kW)', amount: 3500 },
  { name: '10-panel system (3.5kW)', amount: 5500 },
  { name: '14-panel system (5kW)', amount: 7500 },
  { name: '20-panel system (7kW)', amount: 10500 },
  { name: 'Battery add-on', amount: 4500 },
  { name: 'EV charger install', amount: 1200 },
  { name: 'Hot water diverter', amount: 800 },
  { name: 'Full system + battery + EV', amount: 18000 },
]

// ── Default Company Profile ──
const DEFAULT_PROFILE = { name: 'Your Company', address: 'Ireland', email: '', phone: '', vatNumber: '', bank: '' } as const

// ── Types ──
interface InvoiceLineItem { id: string; name: string; description: string; quantity: number; unitPrice: number; total: number; sortOrder: number }
interface Payment { id: string; amount: number; method: string; status: string; reference: string | null; notes: string | null; paidAt: string }
interface Invoice {
  id: string; invoiceNumber: string; status: string; subtotal: number; taxRate: number; taxAmount: number; totalAmount: number
  dueDate: string | null; sentAt: string | null; paidAt: string | null; notes: string | null; createdAt: string; updatedAt: string
  stripePaymentIntent?: string | null; stripeCheckoutUrl?: string | null; isRecurring?: boolean; recurringFrequency?: string | null; recurringNextDate?: string | null
  contact: { id: string; firstName: string; lastName: string; email: string } | null
  company: { id: string; name: string } | null
  deal: { id: string; title: string } | null
  proposal: { id: string; title: string } | null
  _count?: { lineItems: number; payments: number }
  lineItems?: InvoiceLineItem[]
  payments?: Payment[]
}
interface CompanyProfile { name: string; address: string; email: string; phone: string; vatNumber: string; bank: string }
interface ActivityRecord { id: string; type: string; subject: string; description: string | null; createdAt: string }

// ── Status Badge (with icon, matching proposals style) ──
function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`} style={cfg.bgColor}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  )
}

// ── Quick Stats Bar (horizontal, 4 key metrics) ──
function QuickStatsBar({ invoices }: { invoices: Invoice[] }) {
  const total = invoices.length
  const outstanding = invoices.filter(inv => !['paid', 'void', 'cancelled'].includes(inv.status)).reduce((s, inv) => s + inv.totalAmount, 0)
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyRevenue = invoices.filter(inv => inv.paidAt && new Date(inv.paidAt) >= monthStart).reduce((s, inv) => s + inv.totalAmount, 0)

  const stats = [
    { label: 'Total Invoices', value: total.toString(), icon: Receipt, color: BRAND_YELLOW },
    { label: 'Outstanding', value: formatCurrency(outstanding), icon: Euro, color: '#d97706' },
    { label: 'Overdue', value: overdueCount.toString(), icon: AlertTriangle, color: '#dc2626' },
    { label: 'Monthly Revenue', value: formatCurrency(monthlyRevenue), icon: TrendingUp, color: '#059669' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon
        return (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-lg px-4 py-3 border flex items-center gap-3" style={{ borderColor: BRAND_BORDER, backgroundColor: BRAND_SURFACE }}>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
              <Icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-medium truncate" style={{ color: BRAND_SUBTLE }}>{s.label}</p>
              <p className="text-base font-bold" style={{ color: '#FFFFFF' }}>{s.value}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Invoice Aging Summary (horizontal stacked bar) ──
function InvoiceAgingSummary({ invoices }: { invoices: Invoice[] }) {
  const unpaid = useMemo(() => invoices.filter(inv => !['paid', 'void', 'cancelled'].includes(inv.status)), [invoices])

  const buckets = useMemo(() => {
    const notYetDue = unpaid.filter(inv => inv.dueDate && new Date(inv.dueDate) > new Date())
    const b30 = unpaid.filter(inv => { if (!inv.dueDate || new Date(inv.dueDate) > new Date()) return false; const d = getDaysOverdue(inv.dueDate); return d >= 0 && d <= 30 })
    const b60 = unpaid.filter(inv => { if (!inv.dueDate) return false; const d = getDaysOverdue(inv.dueDate); return d >= 31 && d <= 60 })
    const b90p = unpaid.filter(inv => { if (!inv.dueDate) return false; const d = getDaysOverdue(inv.dueDate); return d > 60 })

    return [
      { label: 'Current', sublabel: '0–30 days', amount: notYetDue.reduce((s, inv) => s + inv.totalAmount, 0) + b30.reduce((s, inv) => s + inv.totalAmount, 0), count: notYetDue.length + b30.length, color: '#16a34a' },
      { label: '31–60 Days', sublabel: '', amount: b60.reduce((s, inv) => s + inv.totalAmount, 0), count: b60.length, color: '#F3D840' },
      { label: '61–90 Days', sublabel: '', amount: unpaid.filter(inv => { if (!inv.dueDate) return false; const d = getDaysOverdue(inv.dueDate); return d >= 61 && d <= 90 }).reduce((s, inv) => s + inv.totalAmount, 0), count: unpaid.filter(inv => { if (!inv.dueDate) return false; const d = getDaysOverdue(inv.dueDate); return d >= 61 && d <= 90 }).length, color: '#f97316' },
      { label: '90+ Days', sublabel: '', amount: unpaid.filter(inv => { if (!inv.dueDate) return false; return getDaysOverdue(inv.dueDate) > 90 }).reduce((s, inv) => s + inv.totalAmount, 0), count: unpaid.filter(inv => { if (!inv.dueDate) return false; return getDaysOverdue(inv.dueDate) > 90 }).length, color: '#dc2626' },
    ]
  }, [unpaid])

  const total = buckets.reduce((s, b) => s + b.amount, 0)

  if (total === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="rounded-lg p-4" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold flex items-center gap-2" style={{ color: '#FFFFFF' }}>
          <BarChart3 className="h-3.5 w-3.5" style={{ color: BRAND_YELLOW }} />Invoice Ageing Summary
        </h3>
        <span className="text-[10px] font-semibold" style={{ color: BRAND_SUBTLE }}>Outstanding: {formatCurrency(total)}</span>
      </div>
      {/* Horizontal stacked bar */}
      <div className="h-8 rounded-full overflow-hidden flex" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        {buckets.map((bucket, i) => {
          const pct = total > 0 ? (bucket.amount / total) * 100 : 0
          if (pct === 0) return null
          return (
            <motion.div key={bucket.label} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' as const }}
              className="h-full relative group" style={{ backgroundColor: bucket.color, minWidth: bucket.amount > 0 ? '6px' : '0' }}
              title={`${bucket.label}: ${formatCurrency(bucket.amount)} (${bucket.count} invoices)`}>
              {pct > 10 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: bucket.color === '#F3D840' ? BRAND_DARK : '#FFFFFF' }}>
                  {formatCurrency(bucket.amount)}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {buckets.map(bucket => (
          <div key={bucket.label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bucket.color }} />
            <span className="text-[10px] font-medium" style={{ color: BRAND_SUBTLE }}>
              {bucket.label}{bucket.sublabel ? ` ${bucket.sublabel}` : ''} · {formatCurrency(bucket.amount)} ({bucket.count})
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Overdue Summary Card (pulsing red indicator) ──
function OverdueSummaryCard({ invoices }: { invoices: Invoice[] }) {
  const overdueInvoices = useMemo(() => invoices.filter(inv => inv.status === 'overdue'), [invoices])
  const totalOverdue = useMemo(() => overdueInvoices.reduce((s, inv) => s + inv.totalAmount, 0), [overdueInvoices])
  const count = overdueInvoices.length

  if (count === 0) return null

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
      className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
      {/* Pulsing red indicator */}
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
          <AlertTriangle className="h-5 w-5" style={{ color: '#dc2626' }} />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(239,68,68,0.4)' }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>Overdue Summary</p>
        <p className="text-[10px] mt-0.5" style={{ color: BRAND_MUTED }}>{count} invoice{count !== 1 ? 's' : ''} past due — immediate attention required</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold" style={{ color: '#dc2626' }}>{formatCurrency(totalOverdue)}</p>
        <p className="text-[10px]" style={{ color: BRAND_MUTED }}>total outstanding</p>
      </div>
    </motion.div>
  )
}

// ── Batch Action Bar ──
function BatchActionBar({ selectedIds, onClear, onBatchStatus }: { selectedIds: Set<string>; onClear: () => void; onBatchStatus: (status: string) => void }) {
  if (selectedIds.size === 0) return null
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="rounded-lg px-4 py-3 border flex items-center justify-between flex-wrap gap-3"
      style={{ borderColor: BRAND_YELLOW, backgroundColor: `${BRAND_YELLOW}10` }}>
      <div className="flex items-center gap-3">
        <CheckSquare className="h-4 w-4" style={{ color: BRAND_YELLOW }} />
        <span className="text-sm font-semibold" style={{ color: BRAND_DARK }}>{selectedIds.size} invoice{selectedIds.size > 1 ? 's' : ''} selected</span>
        <Button size="sm" variant="ghost" onClick={onClear} className="text-xs h-7">Clear</Button>
      </div>
      <div className="flex items-center gap-2">
        <Select onValueChange={onBatchStatus}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Change status..." /></SelectTrigger>
          <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </motion.div>
  )
}

// ── Payment Schedule Component ──
function PaymentSchedule({ invoice, paidAmount }: { invoice: Invoice; paidAmount: number }) {
  const total = invoice.totalAmount
  const pct = total > 0 ? Math.min((paidAmount / total) * 100, 100) : 0
  const remaining = Math.max(0, total - paidAmount)

  // Generate milestones based on typical solar project payment schedule
  const milestones = useMemo(() => [
    { label: 'Deposit', pct: 25, dueAt: invoice.createdAt, status: paidAmount >= total * 0.25 ? 'paid' : 'pending' },
    { label: 'Milestone', pct: 50, dueAt: invoice.dueDate, status: paidAmount >= total * 0.5 ? 'paid' : 'pending' },
    { label: 'Completion', pct: 100, dueAt: invoice.dueDate, status: paidAmount >= total ? 'paid' : 'pending' },
  ], [invoice.createdAt, invoice.dueDate, paidAmount, total])

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${BRAND_YELLOW}20` }}>
          <Timer className="h-3.5 w-3.5" style={{ color: BRAND_YELLOW }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>Payment Schedule</h3>
      </div>
      {/* Progress bar */}
      <div className="h-3 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' as const }}
          className="h-full rounded-full" style={{ backgroundColor: pct >= 100 ? '#059669' : BRAND_YELLOW }} />
      </div>
      <div className="flex justify-between text-xs mb-4" style={{ color: BRAND_SUBTLE }}>
        <span>{formatCurrency(paidAmount)} paid</span>
        <span style={{ color: remaining > 0 ? '#d97706' : '#059669' }}>{remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Fully paid'}</span>
      </div>
      {/* Milestones */}
      <div className="space-y-2">
        {milestones.map((m, i) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: m.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)' }}>
              {m.status === 'paid' ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#059669' }} /> : <div className="h-2 w-2 rounded-full" style={{ backgroundColor: BRAND_SUBTLE }} />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: '#FFFFFF' }}>{m.label} ({m.pct}%)</p>
              <p className="text-[10px]" style={{ color: BRAND_MUTED }}>{formatCurrency(total * m.pct / 100)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Activity Timeline ──
function ActivityTimeline({ invoiceId }: { invoiceId: string }) {
  const { data } = useQuery({
    queryKey: ['invoice-activities', invoiceId],
    queryFn: () => fetch(`/api/crm/activities?invoiceId=${invoiceId}&limit=20`).then(r => r.json()),
    refetchInterval: 5000,
  })
  const activities: ActivityRecord[] = data?.activities || []

  if (activities.length === 0) {
    return (
      <div className="rounded-lg p-4 text-center" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
        <Activity className="h-5 w-5 mx-auto mb-2" style={{ color: BRAND_MUTED }} />
        <p className="text-xs" style={{ color: BRAND_MUTED }}>No activity recorded yet</p>
      </div>
    )
  }

  const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
    email: { icon: Mail, color: '#3B82F6' },
    system: { icon: RefreshCw, color: '#8B5CF6' },
    payment: { icon: CreditCard, color: '#059669' },
    call: { icon: Phone, color: '#10B981' },
    note: { icon: FileText, color: '#6B7280' },
  }
  // Fallback for unknown types
  const defaultCfg = { icon: Activity, color: '#6B7280' }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {activities.slice(0, 15).map((a, i) => {
        const cfg = typeConfig[a.type] || defaultCfg
        const Icon = cfg.icon
        return (
          <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex gap-3">
            <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${cfg.color}15` }}>
              <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium truncate" style={{ color: '#FFFFFF' }}>{a.subject}</p>
                <span className="text-[10px] shrink-0" style={{ color: BRAND_MUTED }}>{formatDateTime(a.createdAt)}</span>
              </div>
              {a.description && <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: BRAND_MUTED }}>{a.description}</p>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Placeholder Phone icon since we import it conditionally
function Phone(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

// ── Client Payment Portal Link ──
function ClientPaymentPortalLink({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const [copied, setCopied] = useState(false)
  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/pay/${invoiceId}`
  const handleCopy = () => { navigator.clipboard.writeText(portalUrl); setCopied(true); toast.success('Payment portal link copied!'); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="rounded-lg p-4" style={{ borderColor: BRAND_BORDER, backgroundColor: BRAND_SURFACE }}>
      <div className="flex items-center gap-2 mb-2">
        <ExternalLink className="h-4 w-4" style={{ color: BRAND_YELLOW }} />
        <span className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>Client Payment Portal</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${BRAND_YELLOW}20`, color: BRAND_YELLOW }}>{invoiceNumber}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-[11px] px-3 py-2 rounded-md truncate" style={{ backgroundColor: BRAND_DARK, color: BRAND_SUBTLE, border: `1px solid ${BRAND_BORDER}` }}>{portalUrl}</code>
        <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 text-xs h-8">
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <p className="text-[10px] mt-2" style={{ color: BRAND_MUTED }}>Share this link with your client for online payment.</p>
    </div>
  )
}

// ── AI Payment Follow-up ──
function AIPaymentFollowUp({ invoice }: { invoice: Invoice }) {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const contactName = invoice.contact ? `${invoice.contact.firstName} ${invoice.contact.lastName}` : (invoice.company?.name || 'Customer')
  const days = getDaysOverdue(invoice.dueDate)

  const fetchSuggestion = useCallback(() => {
    setLoading(true)
    fetch('/api/crm/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `You are a solar industry CRM assistant for SolarPilot. Generate a polite but firm payment follow-up email for an overdue invoice. Invoice: ${invoice.invoiceNumber}, Amount: €${invoice.totalAmount}, Due: ${formatDate(invoice.dueDate)}, ${days} days overdue. Contact: ${contactName} at ${invoice.company?.name || 'N/A'}. Write a professional follow-up email with subject line. Be concise.`,
        context: 'invoice_follow_up',
      }),
    })
      .then(r => r.json())
      .then(data => setSuggestion(data.response || `Dear ${contactName},\n\nI'm writing regarding invoice ${invoice.invoiceNumber} for €${invoice.totalAmount} which is now ${days} days overdue.\n\nPlease arrange payment at your earliest convenience.\n\nKind regards,\n${invoice.company?.name || 'Your Company'}`))
      .catch(() => setSuggestion(`Dear ${contactName},\n\nI'm writing regarding invoice ${invoice.invoiceNumber} for €${invoice.totalAmount} which is now ${days} days overdue.\n\nPlease arrange payment at your earliest convenience.\n\nKind regards,\n${invoice.company?.name || 'Your Company'}`))
      .finally(() => setLoading(false))
  }, [invoice, contactName, days])

  const copySuggestion = () => { if (suggestion) { navigator.clipboard.writeText(suggestion); toast.success('Follow-up email copied!') } }

  if (invoice.status !== 'overdue') return null
  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={fetchSuggestion} disabled={loading} className="w-full text-sm" style={{ borderColor: BRAND_YELLOW, color: BRAND_DARK }}>
        <Sparkles className="h-4 w-4 mr-2" style={{ color: BRAND_YELLOW }} />
        {loading ? 'Generating follow-up...' : 'AI Payment Follow-up'}
      </Button>
      {suggestion && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="rounded-lg p-3 border" style={{ borderColor: BRAND_BORDER, backgroundColor: `${BRAND_YELLOW}05` }}>
            <pre className="text-xs whitespace-pre-wrap" style={{ color: BRAND_DARK }}>{suggestion}</pre>
          </div>
          <Button variant="outline" size="sm" onClick={copySuggestion} className="w-full text-xs gap-1">
            <Copy className="h-3 w-3" /> Copy to Clipboard
          </Button>
        </motion.div>
      )}
    </div>
  )
}

// ── Invoice Comparison Dialog ──
function InvoiceComparisonDialog({ invoices, open, onClose }: { invoices: Invoice[]; open: boolean; onClose: () => void }) {
  if (!open || invoices.length < 2) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" style={{ color: BRAND_YELLOW }} />Invoice Comparison</DialogTitle>
          <DialogDescription>Side-by-side comparison of {invoices.length} invoices</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: `2px solid ${BRAND_YELLOW}` }}>
              <th className="text-left py-3 px-2 text-[11px] uppercase" style={{ color: BRAND_MUTED, minWidth: 120 }}>Field</th>
              {invoices.map((inv, i) => (
                <th key={inv.id} className="text-left py-3 px-2" style={{ minWidth: 200 }}>
                  <div><p className="text-xs font-bold" style={{ color: BRAND_DARK }}>Invoice {i + 1}</p><p className="text-[11px] truncate" style={{ color: BRAND_MUTED }}>{inv.invoiceNumber}</p></div>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { label: 'Status', fn: (inv: Invoice) => <InvoiceStatusBadge status={inv.status} /> },
                { label: 'Contact', fn: (inv: Invoice) => inv.contact ? `${inv.contact.firstName} ${inv.contact.lastName}` : '—' },
                { label: 'Company', fn: (inv: Invoice) => inv.company?.name || '—' },
                { label: 'Total Amount', fn: (inv: Invoice) => <span className="font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(inv.totalAmount)}</span> },
                { label: 'Subtotal', fn: (inv: Invoice) => formatCurrency(inv.subtotal) },
                { label: 'VAT', fn: (inv: Invoice) => `${inv.taxRate}% — ${formatCurrency(inv.taxAmount)}` },
                { label: 'Due Date', fn: (inv: Invoice) => formatDate(inv.dueDate) },
                { label: 'Created', fn: (inv: Invoice) => formatDate(inv.createdAt) },
                { label: 'Line Items', fn: (inv: Invoice) => `${inv._count?.lineItems || inv.lineItems?.length || 0} items` },
                { label: 'Payments', fn: (inv: Invoice) => `${inv._count?.payments || 0} recorded` },
                { label: 'Recurring', fn: (inv: Invoice) => inv.isRecurring ? `${inv.recurringFrequency || 'N/A'}` : 'No' },
                { label: 'Stripe', fn: (inv: Invoice) => inv.stripePaymentIntent ? 'Connected' : '—' },
              ].map((row) => (
                <tr key={row.label} style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}>
                  <td className="py-2.5 px-2 font-medium text-xs" style={{ color: BRAND_MUTED }}>{row.label}</td>
                  {invoices.map(inv => <td key={inv.id} className="py-2.5 px-2 text-xs" style={{ color: BRAND_DARK }}>{row.fn(inv)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Credit Note Dialog ──
function CreditNoteDialog({ invoice, open, onClose }: { invoice: Invoice; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState(invoice.totalAmount.toString())

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/invoices/${invoice.id}/credit-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'No reason provided', amount: parseFloat(amount) || invoice.totalAmount }),
      })
      if (!res.ok) throw new Error('Failed to create credit note')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success(`Credit note ${data.invoice?.invoiceNumber} created`)
      onClose()
    },
    onError: () => toast.error('Failed to create credit note'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" style={{ color: '#dc2626' }} />Create Credit Note</DialogTitle>
          <DialogDescription>For invoice {invoice.invoiceNumber} ({formatCurrency(invoice.totalAmount)})</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Credit Amount (€)</Label>
            <Input type="number" min={0.01} max={invoice.totalAmount} step={0.01} value={amount} onChange={e => setAmount(e.target.value)} />
            <p className="text-[10px]" style={{ color: BRAND_MUTED }}>Max: {formatCurrency(invoice.totalAmount)}</p>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Goods returned, billing error, partial cancellation..." rows={3} />
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-[10px]" style={{ color: '#dc2626' }}>A credit note will be created as a new draft invoice with negative amounts. You can review and send it to the customer.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !parseFloat(amount)} style={{ backgroundColor: '#dc2626', color: '#FFFFFF' }}>
            {mutation.isPending ? 'Creating...' : 'Create Credit Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Company Profile Editor ──
function CompanyProfileEditor({ profile, onChange }: { profile: CompanyProfile; onChange: (p: CompanyProfile) => void }) {
  const update = (field: keyof CompanyProfile, value: string) => onChange({ ...profile, [field]: value })
  return (
    <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: `rgba(243,216,64,0.06)`, border: `1px solid rgba(243,216,64,0.2)` }}>
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="h-4 w-4" style={{ color: BRAND_YELLOW }} />
        <Label className="text-sm font-semibold" style={{ color: BRAND_YELLOW }}>Company Profile</Label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([['name', 'Company Name'], ['address', 'Address'], ['email', 'Email'], ['phone', 'Phone'], ['vatNumber', 'VAT Number'], ['bank', 'Bank Details']] as const).map(([field, label]) => (
          <div key={field} className="space-y-1">
            <Label className="text-xs" style={{ color: BRAND_SUBTLE }}>{label}</Label>
            <Input value={profile[field]} onChange={e => update(field, e.target.value)} className="h-8 text-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Quick Amount Shortcuts ──
function QuickAmountShortcuts({ onSelect }: { onSelect: (name: string, amount: number) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(!open)} className="text-xs gap-1" style={{ borderColor: BRAND_YELLOW, color: BRAND_DARK }}>
        <Sparkles className="h-3 w-3" />Solar Packages<ChevronDown className="h-3 w-3" />
      </Button>
      <AnimatePresence>{open && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
          className="absolute z-50 mt-1 w-64 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
          {SOLAR_PACKAGES.map(pkg => (
            <button key={pkg.name} type="button" className="w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex justify-between items-center hover:bg-[#F3D840]/10"
              onClick={() => { onSelect(pkg.name, pkg.amount); setOpen(false) }}>
              <span style={{ color: '#FFFFFF' }}>{pkg.name}</span>
              <span className="font-semibold" style={{ color: BRAND_YELLOW }}>{formatCurrency(pkg.amount)}</span>
            </button>
          ))}
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}

// ── Email Template Selector ──
function EmailTemplateSelector({ invoice, mode, onSelect, onClose }: { invoice: Invoice; mode: 'send' | 'reminder'; onSelect: (templateId: string) => void; onClose: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState(mode === 'send' ? 'invoice_sent' : 'payment_reminder_7')
  const contactName = invoice.contact ? `${invoice.contact.firstName} ${invoice.contact.lastName}` : (invoice.company?.name || 'Customer')
  const vars: Record<string, string> = { invoice_number: invoice.invoiceNumber, contact_name: contactName, amount: formatCurrency(invoice.totalAmount), due_date: formatDate(invoice.dueDate), company_name: invoice.company?.name || 'Your Company' }
  const filteredTemplates = mode === 'send' ? EMAIL_TEMPLATES : EMAIL_TEMPLATES.filter(t => ['payment_reminder_7', 'payment_reminder_14', 'overdue_notice', 'first_notice'].includes(t.id))
  const template = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" style={{ color: BRAND_YELLOW }} />{mode === 'send' ? 'Send Invoice Email' : 'Send Payment Reminder'}</DialogTitle>
        <DialogDescription>Select an email template and preview before sending.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Email Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{filteredTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {template && (
          <>
            <div className="space-y-1"><Label className="text-xs" style={{ color: BRAND_SUBTLE }}>Subject</Label>
              <div className="rounded-md px-3 py-2 text-sm" style={{ backgroundColor: 'rgba(243,216,64,0.06)', border: '1px solid rgba(243,216,64,0.15)', color: '#FFFFFF' }}>{applyTemplateVars(template.subject, vars)}</div>
            </div>
            <div className="space-y-1"><Label className="text-xs" style={{ color: BRAND_SUBTLE }}>Preview</Label>
              <div className="rounded-md px-3 py-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}`, color: BRAND_SUBTLE }}>{applyTemplateVars(template.body, vars)}</div>
            </div>
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSelect(selectedTemplate)} style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}><Send className="h-3.5 w-3.5 mr-1.5" />Send Email</Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Stripe Checkout Dialog ──
function StripeCheckoutDialog({ invoice, remainingAmount, onClose }: { invoice: Invoice; remainingAmount: number; onClose: () => void }) {
  const [form, setForm] = useState({ amount: remainingAmount.toFixed(2), mode: 'one_time', successUrl: '', cancelUrl: '' })
  const [checkoutUrl, setCheckoutUrl] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/invoices/${invoice.id}/stripe/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(form.amount), mode: form.mode, successUrl: form.successUrl || undefined, cancelUrl: form.cancelUrl || undefined }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: (data) => { if (data.url) { setCheckoutUrl(data.url); toast.success('Stripe checkout created!') } },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5" style={{ color: BRAND_YELLOW }} />Create Stripe Checkout</DialogTitle>
        <DialogDescription>Invoice {invoice.invoiceNumber} — Remaining: {formatCurrency(remainingAmount)}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2"><Label>Payment Amount (€)</Label><Input type="number" min={0.01} step={0.01} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Payment Mode</Label>
          <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="one_time">One-Time</SelectItem><SelectItem value="recurring">Recurring</SelectItem></SelectContent>
          </Select>
        </div>
        {checkoutUrl && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-lg p-3 space-y-2" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <p className="text-xs font-semibold" style={{ color: '#059669' }}>Checkout URL Generated</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded px-2 py-1 text-xs truncate" style={{ backgroundColor: BRAND_DARK, color: '#059669' }}>{checkoutUrl}</div>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(checkoutUrl); toast.success('Copied!') }} className="shrink-0 h-7 gap-1" style={{ borderColor: '#059669', color: '#059669' }}><Copy className="h-3 w-3" />Copy</Button>
            </div>
          </motion.div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !parseFloat(form.amount)} style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>{mutation.isPending ? 'Creating...' : 'Create Checkout'}</Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Invoice Form (Create/Edit) ──
function InvoiceForm({ invoice, contacts, companies, deals, proposals, companyProfile, onCompanyProfileChange, onClose }: {
  invoice?: Invoice; contacts: Array<{ id: string; firstName: string; lastName: string }>; companies: Array<{ id: string; name: string }>; deals: Array<{ id: string; title: string }>;
  proposals: Array<{ id: string; title: string; status: string; lineItems?: InvoiceLineItem[]; contact?: { id: string; firstName: string; lastName: string } | null; company?: { id: string; name: string } | null; deal?: { id: string; title: string } | null }>;
  companyProfile: CompanyProfile; onCompanyProfileChange: (p: CompanyProfile) => void; onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEditing = !!invoice
  const [showCompanyProfile, setShowCompanyProfile] = useState(false)
  const [form, setForm] = useState({
    contactId: invoice?.contact?.id || '', companyId: invoice?.company?.id || '', dealId: invoice?.deal?.id || '', proposalId: invoice?.proposal?.id || '',
    taxRate: invoice?.taxRate?.toString() || '23', dueDate: invoice?.dueDate?.split('T')[0] || '', notes: invoice?.notes || '',
    discountType: 'percentage', discountValue: '0', isRecurring: 'false', recurringFrequency: 'monthly',
  })
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(invoice?.lineItems?.length ? invoice.lineItems : [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1, unitPrice: 0, total: 0, sortOrder: 0 }])

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)
  const taxRate = parseFloat(form.taxRate) || 0
  const discountValue = parseFloat(form.discountValue) || 0
  const discountAmount = form.discountType === 'percentage' ? subtotal * (discountValue / 100) : discountValue
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const taxAmount = afterDiscount * (taxRate / 100)
  const totalAmount = afterDiscount + taxAmount

  const loadProposal = (pid: string) => {
    const p = proposals.find(pr => pr.id === pid)
    if (!p?.lineItems?.length) return
    setLineItems(p.lineItems.map(i => ({ ...i, id: crypto.randomUUID() })))
    if (p.contact) setForm(f => ({ ...f, contactId: p.contact!.id }))
    if (p.company) setForm(f => ({ ...f, companyId: p.company!.id }))
    if (p.deal) setForm(f => ({ ...f, dealId: p.deal!.id }))
    toast.success(`Loaded from "${p.title}"`)
  }

  const updateLineItem = (idx: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updated = [...lineItems]; const item = { ...updated[idx] }; (item as Record<string, unknown>)[field] = value
    if (field === 'quantity' || field === 'unitPrice') item.total = item.quantity * item.unitPrice
    updated[idx] = item; setLineItems(updated)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, contactId: form.contactId || null, companyId: form.companyId || null, dealId: form.dealId || null, proposalId: form.proposalId || null, taxRate, dueDate: form.dueDate || null, notes: form.notes || null, isRecurring: form.isRecurring === 'true', recurringFrequency: form.isRecurring === 'true' ? form.recurringFrequency : null, lineItems: lineItems.map((item, i) => ({ ...item, sortOrder: i })) }
      const url = isEditing ? `/api/crm/invoices/${invoice.id}` : '/api/crm/invoices'
      const res = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success(isEditing ? 'Invoice updated' : 'Invoice created'); onClose() },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>{isEditing ? `Edit ${invoice.invoiceNumber}` : 'Create New Invoice'}</DialogTitle>
        <DialogDescription>{isEditing ? 'Update invoice details' : 'Add line items and set billing details'}</DialogDescription>
      </DialogHeader>
      <div className="flex-1 overflow-y-auto space-y-4 py-2">
        <div>
          <button type="button" onClick={() => setShowCompanyProfile(!showCompanyProfile)} className="flex items-center gap-2 text-xs font-medium" style={{ color: BRAND_YELLOW }}>
            <Building2 className="h-3.5 w-3.5" />{showCompanyProfile ? 'Hide' : 'Edit'} Company Profile<ChevronDown className={`h-3 w-3 transition-transform ${showCompanyProfile ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>{showCompanyProfile && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
              <CompanyProfileEditor profile={companyProfile} onChange={onCompanyProfileChange} />
            </motion.div>
          )}</AnimatePresence>
        </div>
        <div className="space-y-2"><Label>Load from Proposal (optional)</Label>
          <Select value={form.proposalId} onValueChange={loadProposal}><SelectTrigger><SelectValue placeholder="Select proposal..." /></SelectTrigger>
            <SelectContent>{proposals.filter(p => p.status === 'accepted').map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([['contactId', 'Contact', contacts], ['companyId', 'Company', companies], ['dealId', 'Deal', deals]] as const).map(([field, label, items]) => (
            <div key={field} className="space-y-2"><Label>{label}</Label>
              <Select value={(form as Record<string, string>)[field]} onValueChange={v => setForm(f => ({ ...f, [field]: v }))}><SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent>{items.map(c => <SelectItem key={c.id} value={c.id}>{c.name || `${c.firstName} ${c.lastName}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
          <div className="space-y-2"><Label>VAT Rate (%)</Label><Input type="number" min={0} max={100} step={0.5} value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label className="flex items-center gap-1"><Percent className="h-3.5 w-3.5" style={{ color: BRAND_SUBTLE }} />Discount Type</Label>
            <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed (€)</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Discount Value</Label><Input type="number" min={0} step={0.01} value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label className="flex items-center gap-1"><Repeat className="h-3.5 w-3.5" style={{ color: BRAND_SUBTLE }} />Recurring</Label>
            <Select value={form.isRecurring} onValueChange={v => setForm(f => ({ ...f, isRecurring: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent></Select>
          </div>
          {form.isRecurring === 'true' && (
            <div className="space-y-2"><Label>Frequency</Label>
              <Select value={form.recurringFrequency} onValueChange={v => setForm(f => ({ ...f, recurringFrequency: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annually">Annually</SelectItem></SelectContent></Select>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label className="text-base font-semibold">Line Items</Label>
            <div className="flex items-center gap-2">
              <QuickAmountShortcuts onSelect={(n, a) => { setLineItems([...lineItems, { id: crypto.randomUUID(), name: n, description: '', quantity: 1, unitPrice: a, total: a, sortOrder: lineItems.length }]); toast.success(`Added "${n}"`) }} />
              <Button type="button" variant="outline" size="sm" onClick={() => setLineItems([...lineItems, { id: crypto.randomUUID(), name: '', description: '', quantity: 1, unitPrice: 0, total: 0, sortOrder: lineItems.length }])} className="text-xs gap-1" style={{ borderColor: BRAND_YELLOW, color: BRAND_DARK }}><Plus className="h-3.5 w-3.5" />Add Item</Button>
            </div>
          </div>
          <div className="space-y-2 overflow-x-auto">
            {lineItems.map((item, index) => (
              <motion.div key={item.id} layout className="rounded-lg p-3 space-y-2" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0" style={{ color: BRAND_MUTED }} />
                  <Input value={item.name} onChange={e => updateLineItem(index, 'name', e.target.value)} placeholder="Item name *" className="flex-1 h-8 text-sm" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" style={{ color: BRAND_MUTED }} onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))} disabled={lineItems.length <= 1}><X className="h-3.5 w-3.5" /></Button>
                </div>
                <Input value={item.description} onChange={e => updateLineItem(index, 'description', e.target.value)} placeholder="Description (optional)" className="h-7 text-xs pl-7" />
                <div className="grid grid-cols-3 gap-2 pl-6">
                  <div className="space-y-1"><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Qty</span><Input type="number" min={1} value={item.quantity} onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
                  <div className="space-y-1"><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Unit Price</span><Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={e => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                  <div className="space-y-1"><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Total</span><div className="h-8 flex items-center px-3 rounded-md border text-sm font-medium" style={{ color: '#FFFFFF' }}>{formatCurrency(item.total)}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="rounded-lg p-4 space-y-1" style={{ backgroundColor: 'rgba(243,216,64,0.06)', border: '1px solid rgba(243,216,64,0.2)' }}>
            <div className="flex justify-between text-sm" style={{ color: BRAND_SUBTLE }}><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discountValue > 0 && <div className="flex justify-between text-sm" style={{ color: '#059669' }}><span>Discount {form.discountType === 'percentage' ? `(${discountValue}%)` : ''}</span><span>-{formatCurrency(discountAmount)}</span></div>}
            {taxRate > 0 && <div className="flex justify-between text-sm" style={{ color: BRAND_SUBTLE }}><span>VAT ({taxRate}%)</span><span>{formatCurrency(taxAmount)}</span></div>}
            <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(243,216,64,0.3)' }}><span className="font-semibold" style={{ color: BRAND_SUBTLE }}>Total</span><span className="text-2xl font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(totalAmount)}</span></div>
          </div>
        </div>
        <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, additional info..." rows={2} /></div>
      </div>
      <DialogFooter className="pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>{saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}</Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Payment Form ──
function PaymentForm({ invoiceId, invoiceNumber, remainingAmount, onClose }: { invoiceId: string; invoiceNumber: string; remainingAmount: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ amount: remainingAmount > 0 ? remainingAmount.toFixed(2) : '0', method: 'bank_transfer', reference: '', notes: '' })

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/invoices/${invoiceId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(form.amount), method: form.method, reference: form.reference || null, notes: form.notes || null }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] }); toast.success('Payment recorded'); onClose() },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Record Payment — {invoiceNumber}</DialogTitle><DialogDescription>Remaining: {formatCurrency(remainingAmount)}</DialogDescription></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2"><Label>Amount (€)</Label><Input type="number" min={0.01} step={0.01} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Payment Method</Label>
          <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="credit_card">Credit Card</SelectItem><SelectItem value="stripe">Stripe</SelectItem><SelectItem value="paypal">PayPal</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-2"><Label>Reference / Transaction ID</Label><Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g., TXN-12345" /></div>
        <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..." rows={2} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !parseFloat(form.amount) || parseFloat(form.amount) <= 0} style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>{mutation.isPending ? 'Recording...' : 'Record Payment'}</Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Branded Invoice Preview ──
function BrandedInvoicePreview({ invoice, paidAmount, companyProfile }: { invoice: Invoice; paidAmount: number; companyProfile: CompanyProfile }) {
  const clientName = invoice.company?.name || `${invoice.contact?.firstName || ''} ${invoice.contact?.lastName || ''}`.trim() || 'Client'
  const clientEmail = invoice.contact?.email || ''
  const remaining = invoice.totalAmount - paidAmount
  const daysOverdue = getDaysOverdue(invoice.dueDate)

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-lg shadow-sm overflow-hidden">
      <div className="h-2" style={{ backgroundColor: BRAND_YELLOW }} />
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold shrink-0" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>{(companyProfile.name || 'Y')[0]}</div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: BRAND_DARK }}>{companyProfile.name}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{companyProfile.address}</p>
              <p className="text-xs" style={{ color: '#666666' }}>{companyProfile.email} {companyProfile.phone && `· ${companyProfile.phone}`}</p>
              {companyProfile.vatNumber && <p className="text-xs font-medium mt-1" style={{ color: '#374151' }}>VAT: {companyProfile.vatNumber}</p>}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold" style={{ color: BRAND_DARK }}>{invoice.invoiceNumber}</h3>
            <div className="mt-2"><InvoiceStatusBadge status={invoice.status} /></div>
            {daysOverdue > 0 && invoice.status === 'overdue' && <p className="text-xs font-semibold mt-1" style={{ color: '#dc2626' }}>{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-lg p-4" style={{ backgroundColor: '#f9fafb' }}>
            <span className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: '#9ca3af' }}>Bill To</span>
            <p className="text-base font-semibold mt-1" style={{ color: BRAND_DARK }}>{clientName}</p>
            {clientEmail && <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{clientEmail}</p>}
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: '#f9fafb' }}>
            <span className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: '#9ca3af' }}>Details</span>
            <div className="mt-1 space-y-1">
              <p className="text-xs" style={{ color: '#374151' }}><span style={{ color: '#9ca3af' }}>Date:</span> {formatDate(invoice.createdAt)}</p>
              <p className="text-xs" style={{ color: '#374151' }}><span style={{ color: '#9ca3af' }}>Due:</span> {formatDate(invoice.dueDate)}</p>
              {invoice.proposal && <p className="text-xs" style={{ color: '#374151' }}><span style={{ color: '#9ca3af' }}>Proposal:</span> {invoice.proposal.title}</p>}
            </div>
          </div>
        </div>
        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
            <table className="w-full">
              <thead><tr style={{ backgroundColor: '#f3f4f6' }}>
                <th className="text-left text-[10px] uppercase font-semibold px-4 py-3" style={{ color: '#6b7280' }}>Item</th>
                <th className="text-right text-[10px] uppercase font-semibold px-4 py-3 w-16" style={{ color: '#6b7280' }}>Qty</th>
                <th className="text-right text-[10px] uppercase font-semibold px-4 py-3 w-28" style={{ color: '#6b7280' }}>Price</th>
                <th className="text-right text-[10px] uppercase font-semibold px-4 py-3 w-28" style={{ color: '#6b7280' }}>Total</th>
              </tr></thead>
              <tbody>{invoice.lineItems.map((item, idx) => (
                <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td className="px-4 py-3"><p className="text-sm font-medium" style={{ color: BRAND_DARK }}>{item.name}</p>{item.description && <p className="text-[11px]" style={{ color: '#9ca3af' }}>{item.description}</p>}</td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: '#374151' }}>{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: '#374151' }}>{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: BRAND_DARK }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}</tbody>
              <tfoot>
                <tr style={{ borderTop: '1px solid #e5e7eb' }}><td colSpan={3} className="px-4 py-2 text-xs text-right" style={{ color: '#6b7280' }}>Subtotal</td><td className="px-4 py-2 text-right text-sm font-medium" style={{ color: '#374151' }}>{formatCurrency(invoice.subtotal)}</td></tr>
                {invoice.taxRate > 0 && <tr style={{ borderTop: '1px solid #e5e7eb' }}><td colSpan={3} className="px-4 py-2 text-xs text-right" style={{ color: '#6b7280' }}>VAT ({invoice.taxRate}%)</td><td className="px-4 py-2 text-right text-sm font-medium" style={{ color: '#374151' }}>{formatCurrency(invoice.taxAmount)}</td></tr>}
                <tr style={{ borderTop: `2px solid ${BRAND_YELLOW}`, backgroundColor: 'rgba(243,216,64,0.05)' }}><td colSpan={3} className="px-4 py-3 text-sm font-semibold text-right" style={{ color: BRAND_DARK }}>Total</td><td className="px-4 py-3 text-right text-xl font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(invoice.totalAmount)}</td></tr>
                {paidAmount > 0 && <tr style={{ borderTop: '1px solid #e5e7eb' }}><td colSpan={3} className="px-4 py-2 text-xs text-right" style={{ color: '#059669' }}>Paid</td><td className="px-4 py-2 text-right text-sm font-medium" style={{ color: '#059669' }}>-{formatCurrency(paidAmount)}</td></tr>}
                {remaining > 0 && paidAmount > 0 && <tr style={{ borderTop: '1px solid #e5e7eb' }}><td colSpan={3} className="px-4 py-2 text-xs font-semibold text-right" style={{ color: '#d97706' }}>Balance Due</td><td className="px-4 py-2 text-right text-sm font-bold" style={{ color: '#d97706' }}>{formatCurrency(remaining)}</td></tr>}
              </tfoot>
            </table>
          </div>
        )}
        {invoice.payments && invoice.payments.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: BRAND_DARK }}>Payment History</h4>
            <div className="space-y-2">{invoice.payments.map(p => (
              <div key={p.id} className="flex justify-between items-center py-2 text-sm rounded px-3" style={{ backgroundColor: '#f9fafb' }}>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" style={{ color: '#059669' }} /><span style={{ color: '#374151' }}>{formatDate(p.paidAt)} — {p.method.replace(/_/g, ' ')}</span>{p.reference && <span className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>({p.reference})</span>}</div>
                <span className="font-semibold" style={{ color: '#059669' }}>{formatCurrency(p.amount)}</span>
              </div>
            ))}</div>
          </div>
        )}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: BRAND_DARK }}><Banknote className="h-3.5 w-3.5 inline mr-1" />Please pay by bank transfer to:</p>
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#374151' }}><p><span style={{ color: '#9ca3af' }}>Bank:</span> {companyProfile.bank || '—'}</p><p><span style={{ color: '#9ca3af' }}>Reference:</span> {invoice.invoiceNumber}</p></div>
        </div>
        <div className="text-center pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
          <p className="text-sm font-medium" style={{ color: BRAND_DARK }}>Thank you for your business!</p>
          <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>Payment terms: Net 30 days. Late payments may incur interest at 2% per month.</p>
          <p className="text-[11px]" style={{ color: '#9ca3af' }}>© {new Date().getFullYear()} {companyProfile.name}. Registered in Ireland.</p>
        </div>
      </div>
    </div>
  )
}

// ── Invoice Detail Sheet ──
function InvoiceDetail({ invoice, companyProfile, onClose, onEdit }: { invoice: Invoice; companyProfile: CompanyProfile; onClose: () => void; onEdit: (inv: Invoice) => void }) {
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [stripeCheckoutOpen, setStripeCheckoutOpen] = useState(false)
  const [emailTemplateOpen, setEmailTemplateOpen] = useState(false)
  const [emailMode, setEmailMode] = useState<'send' | 'reminder'>('send')
  const [creditNoteOpen, setCreditNoteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'preview' | 'stripe' | 'emails' | 'activity'>('details')

  const { data: detailData } = useQuery({ queryKey: ['invoice', invoice.id], queryFn: () => fetch(`/api/crm/invoices/${invoice.id}`).then(r => r.json()), refetchInterval: 5000 })
  const fullInvoice = detailData?.invoice || invoice
  const paidAmount = detailData?.paidAmount || 0
  const remainingAmount = detailData?.remainingAmount || fullInvoice.totalAmount
  const daysOverdue = getDaysOverdue(fullInvoice.dueDate)

  const sendMutation = useMutation({ mutationFn: () => fetch(`/api/crm/invoices/${invoice.id}/send`, { method: 'POST' }).then(r => r.json()), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] }); toast.success('Invoice sent!') }, onError: () => toast.error('Failed') })
  const sendEmailMutation = useMutation({ mutationFn: async (templateId: string) => { const res = await fetch(`/api/crm/invoices/${invoice.id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }) }); if (!res.ok) throw new Error('Failed'); return res.json() }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] }); toast.success('Email sent!'); setEmailTemplateOpen(false) }, onError: () => toast.error('Failed') })
  const markPaidMutation = useMutation({ mutationFn: () => fetch(`/api/crm/invoices/${invoice.id}/mark-paid`, { method: 'POST' }).then(r => r.json()), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] }); toast.success('Marked as paid!') }, onError: () => toast.error('Failed') })
  const voidMutation = useMutation({ mutationFn: async () => { const res = await fetch(`/api/crm/invoices/${invoice.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'void' }) }); if (!res.ok) throw new Error(); return res.json() }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] }); toast.success('Voided') }, onError: () => toast.error('Failed') })
  const deleteMutation = useMutation({ mutationFn: () => fetch(`/api/crm/invoices/${invoice.id}`, { method: 'DELETE' }).then(r => r.json()), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Deleted'); onClose() }, onError: () => toast.error('Failed') })
  const duplicateMutation = useMutation({ mutationFn: () => fetch(`/api/crm/invoices/${invoice.id}/duplicate`, { method: 'POST' }).then(r => { if (!r.ok) throw new Error(); return r.json() }), onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success(`Duplicated as ${data.invoice?.invoiceNumber || 'new draft'}`) }, onError: () => toast.error('Failed to duplicate') })
  const stripePaymentLinkMutation = useMutation({ mutationFn: async () => { const res = await fetch(`/api/crm/invoices/${invoice.id}/payment-link`, { method: 'POST' }); if (!res.ok) throw new Error(); return res.json() }, onSuccess: (data) => { if (data.url) { navigator.clipboard.writeText(data.url); toast.success('Payment link copied!') } }, onError: () => toast.error('Failed') })

  return (
    <>
      <div className="flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-lg">{fullInvoice.invoiceNumber}</SheetTitle>
              <SheetDescription>Created {formatDate(fullInvoice.createdAt)}</SheetDescription>
              {daysOverdue > 0 && fullInvoice.status === 'overdue' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mt-1 px-2 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                  <AlertTriangle className="h-3 w-3" />{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                </motion.div>
              )}
              {fullInvoice.isRecurring && (
                <div className="flex items-center gap-1.5 mt-1"><Repeat className="h-3 w-3" style={{ color: BRAND_YELLOW }} /><span className="text-[10px]" style={{ color: BRAND_SUBTLE }}>Recurring: {fullInvoice.recurringFrequency || 'N/A'}</span></div>
              )}
            </div>
            <InvoiceStatusBadge status={fullInvoice.status} />
          </div>
          <div className="flex gap-1 mt-4 flex-wrap overflow-x-auto">
            {(['details', 'preview', 'stripe', 'emails', 'activity'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0"
                style={activeTab === tab ? { backgroundColor: BRAND_YELLOW, color: BRAND_DARK } : { color: BRAND_SUBTLE }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'preview' ? (
            <div className="p-6"><BrandedInvoicePreview invoice={{ ...fullInvoice, lineItems: fullInvoice.lineItems || invoice.lineItems, payments: fullInvoice.payments || [] }} paidAmount={paidAmount} companyProfile={companyProfile} /></div>
          ) : activeTab === 'stripe' ? (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#FFFFFF' }}><Zap className="h-4 w-4" style={{ color: '#6366f1' }} />Stripe Integration</h3>
                {fullInvoice.stripePaymentIntent ? (
                  <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono" style={{ color: '#6366f1' }}>{fullInvoice.stripePaymentIntent}</span>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" style={{ color: '#6366f1' }} onClick={() => { navigator.clipboard.writeText(fullInvoice.stripePaymentIntent || ''); toast.success('Copied!') }}><Copy className="h-3 w-3" />Copy</Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg p-4 text-center" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}><Zap className="h-8 w-8 mx-auto mb-2" style={{ color: BRAND_MUTED }} /><p className="text-xs" style={{ color: BRAND_SUBTLE }}>No Stripe payment linked yet.</p></div>
                )}
              </div>
              {(fullInvoice.status === 'sent' || fullInvoice.status === 'overdue') && (
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => stripePaymentLinkMutation.mutate()} disabled={stripePaymentLinkMutation.isPending} className="gap-1 text-xs" style={{ borderColor: BRAND_YELLOW, color: BRAND_DARK }}><CreditCard className="h-3 w-3" />Payment Link</Button>
                  <Button size="sm" variant="outline" onClick={() => setStripeCheckoutOpen(true)} className="gap-1 text-xs" style={{ borderColor: '#6366f1', color: '#6366f1' }}><ExternalLink className="h-3 w-3" />Create Checkout</Button>
                </div>
              )}
            </div>
          ) : activeTab === 'emails' ? (
            <div className="p-6"><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#FFFFFF' }}><Mail className="h-4 w-4" style={{ color: BRAND_YELLOW }} />Email History</h3><p className="text-xs" style={{ color: BRAND_MUTED }}>Email delivery records will appear here after sending.</p></div>
          ) : activeTab === 'activity' ? (
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#FFFFFF' }}><Activity className="h-4 w-4" style={{ color: BRAND_YELLOW }} />Activity Timeline</h3>
              <ActivityTimeline invoiceId={invoice.id} />
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {fullInvoice.contact && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
                    <span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Contact</span>
                    <a href={`/crm/contacts/${fullInvoice.contact.id}`} className="text-sm font-medium mt-0.5 hover:underline block" style={{ color: BRAND_YELLOW, textDecoration: 'none' }}>{fullInvoice.contact.firstName} {fullInvoice.contact.lastName}</a>
                    <p className="text-xs" style={{ color: BRAND_SUBTLE }}>{fullInvoice.contact.email}</p>
                  </div>
                )}
                {fullInvoice.company && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
                    <span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Company</span>
                    <a href="/crm/companies" className="text-sm font-medium mt-0.5 hover:underline block" style={{ color: BRAND_YELLOW, textDecoration: 'none' }}>{fullInvoice.company.name}</a>
                  </div>
                )}
                <div className="rounded-lg p-3" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
                  <span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Total</span>
                  <p className="text-lg font-bold mt-0.5" style={{ color: '#FFFFFF' }}>{formatCurrency(fullInvoice.totalAmount)}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
                  <span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Due Date</span>
                  <p className="text-sm font-medium mt-0.5 flex items-center gap-1.5" style={{ color: '#FFFFFF' }}><Calendar className="h-3.5 w-3.5" />{formatDate(fullInvoice.dueDate)}</p>
                  {daysOverdue > 0 && fullInvoice.status === 'overdue' && <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#dc2626' }}>{daysOverdue}d overdue</p>}
                </div>
              </div>

              {/* Payment Schedule */}
              <PaymentSchedule invoice={fullInvoice} paidAmount={paidAmount} />

              {/* Amount Breakdown */}
              <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'rgba(243,216,64,0.04)', border: '1px solid rgba(243,216,64,0.15)' }}>
                <div className="flex justify-between text-sm" style={{ color: BRAND_SUBTLE }}><span>Subtotal</span><span>{formatCurrency(fullInvoice.subtotal)}</span></div>
                {fullInvoice.taxRate > 0 && <div className="flex justify-between text-sm" style={{ color: BRAND_SUBTLE }}><span>VAT ({fullInvoice.taxRate}%)</span><span>{formatCurrency(fullInvoice.taxAmount)}</span></div>}
                <div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: '1px solid rgba(243,216,64,0.2)' }}><span>Total</span><span style={{ color: BRAND_DARK }}>{formatCurrency(fullInvoice.totalAmount)}</span></div>
                {paidAmount > 0 && <div className="flex justify-between text-sm" style={{ color: '#059669' }}><span>Paid</span><span>-{formatCurrency(paidAmount)}</span></div>}
                {remainingAmount > 0 && paidAmount > 0 && <div className="flex justify-between text-sm font-semibold" style={{ color: '#d97706' }}><span>Remaining</span><span>{formatCurrency(remainingAmount)}</span></div>}
              </div>

              {/* Client Payment Portal Link */}
              <ClientPaymentPortalLink invoiceId={invoice.id} invoiceNumber={fullInvoice.invoiceNumber} />

              {/* AI Payment Follow-up */}
              <AIPaymentFollowUp invoice={fullInvoice} />

              {/* Line Items */}
              {fullInvoice.lineItems && fullInvoice.lineItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#FFFFFF' }}>Line Items</h3>
                  <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BRAND_BORDER}` }}>
                    <table className="w-full">
                      <thead><tr style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                        <th className="text-left text-[10px] uppercase font-medium px-3 py-2" style={{ color: BRAND_MUTED }}>Item</th>
                        <th className="text-right text-[10px] uppercase font-medium px-3 py-2 w-12" style={{ color: BRAND_MUTED }}>Qty</th>
                        <th className="text-right text-[10px] uppercase font-medium px-3 py-2 w-20" style={{ color: BRAND_MUTED }}>Price</th>
                        <th className="text-right text-[10px] uppercase font-medium px-3 py-2 w-20" style={{ color: BRAND_MUTED }}>Total</th>
                      </tr></thead>
                      <tbody>{fullInvoice.lineItems.map(item => (
                        <tr key={item.id} style={{ borderTop: `1px solid ${BRAND_BORDER}` }}>
                          <td className="px-3 py-2"><p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{item.name}</p>{item.description && <p className="text-[11px]" style={{ color: BRAND_MUTED }}>{item.description}</p>}</td>
                          <td className="px-3 py-2 text-right text-sm" style={{ color: BRAND_SUBTLE }}>{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-sm" style={{ color: BRAND_SUBTLE }}>{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-2 text-right text-sm font-medium" style={{ color: '#FFFFFF' }}>{formatCurrency(item.total)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {fullInvoice.payments && fullInvoice.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#FFFFFF' }}>Payment History</h3>
                  <div className="space-y-2">{fullInvoice.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" style={{ color: '#059669' }} /><div><p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{formatCurrency(p.amount)}</p><p className="text-[11px]" style={{ color: BRAND_SUBTLE }}>{p.method.replace(/_/g, ' ')} — {formatDateTime(p.paidAt)}</p></div></div>
                    </div>
                  ))}</div>
                </div>
              )}

              {fullInvoice.notes && (
                <div><h3 className="text-sm font-semibold mb-2" style={{ color: '#FFFFFF' }}>Notes</h3>
                  <div className="rounded-lg p-3 text-sm whitespace-pre-wrap" style={{ color: BRAND_SUBTLE, backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>{fullInvoice.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-4 space-y-2 shrink-0" style={{ borderColor: BRAND_BORDER }}>
          <div className="flex items-center gap-2 flex-wrap">
            {fullInvoice.status === 'draft' && <Button size="sm" onClick={() => { setEmailMode('send'); setEmailTemplateOpen(true) }} disabled={sendMutation.isPending} style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}><Send className="h-3.5 w-3.5 mr-1.5" />Send Invoice</Button>}
            {(fullInvoice.status === 'overdue' || fullInvoice.status === 'sent') && <Button size="sm" variant="outline" onClick={() => { setEmailMode('reminder'); setEmailTemplateOpen(true) }} className="gap-1 text-xs" style={{ borderColor: '#d97706', color: '#d97706' }}><Bell className="h-3.5 w-3.5 mr-1" />Send Reminder</Button>}
            {!['paid', 'cancelled', 'void'].includes(fullInvoice.status) && (
              <>
                <Button size="sm" onClick={() => setPaymentOpen(true)} style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}><Banknote className="h-3.5 w-3.5 mr-1.5" />Record Payment</Button>
                <Button size="sm" variant="outline" onClick={() => markPaidMutation.mutate()} disabled={markPaidMutation.isPending} className="gap-1 text-xs" style={{ borderColor: '#059669', color: '#059669' }}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark Paid</Button>
                <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)} className="gap-1 text-xs" style={{ borderColor: BRAND_YELLOW, color: BRAND_DARK }}><CreditCard className="h-3.5 w-3.5 mr-1" />Add Payment</Button>
                <Button size="sm" variant="outline" onClick={() => voidMutation.mutate()} disabled={voidMutation.isPending} className="gap-1 text-xs" style={{ borderColor: '#6b7280', color: BRAND_SUBTLE }}><Ban className="h-3.5 w-3.5 mr-1" />Void</Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => window.open(`/api/crm/invoices/${invoice.id}/pdf`, '_blank')} className="gap-1 text-xs" style={{ color: BRAND_SUBTLE }}><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(fullInvoice)} className="gap-1 text-xs" style={{ color: BRAND_SUBTLE }}><Edit3 className="h-3.5 w-3.5 mr-1" />Edit</Button>
            <Button size="sm" variant="outline" onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending} className="gap-1 text-xs" style={{ color: BRAND_SUBTLE }}><Copy className="h-3.5 w-3.5 mr-1" />Duplicate</Button>
            <Button size="sm" variant="outline" onClick={() => setCreditNoteOpen(true)} className="gap-1 text-xs" style={{ color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)' }}><Receipt className="h-3.5 w-3.5 mr-1" />Credit Note</Button>
            <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)} className="gap-1 text-xs" style={{ color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)' }}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" style={{ color: '#dc2626' }} />Delete Invoice</DialogTitle><DialogDescription>Delete &quot;{fullInvoice.invoiceNumber}&quot;? This cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>Delete</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><PaymentForm invoiceId={fullInvoice.id} invoiceNumber={fullInvoice.invoiceNumber} remainingAmount={remainingAmount} onClose={() => setPaymentOpen(false)} /></Dialog>
      <Dialog open={stripeCheckoutOpen} onOpenChange={setStripeCheckoutOpen}><StripeCheckoutDialog invoice={fullInvoice} remainingAmount={remainingAmount} onClose={() => setStripeCheckoutOpen(false)} /></Dialog>
      <Dialog open={emailTemplateOpen} onOpenChange={setEmailTemplateOpen}><EmailTemplateSelector invoice={fullInvoice} mode={emailMode} onSelect={(t) => sendEmailMutation.mutate(t)} onClose={() => setEmailTemplateOpen(false)} /></Dialog>
      <CreditNoteDialog invoice={fullInvoice} open={creditNoteOpen} onClose={() => setCreditNoteOpen(false)} />
    </>
  )
}

// ── Main Invoices Page ──
export default function InvoicesPageContent() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'created' | 'value' | 'dueDate' | 'status'>('created')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [contactFilter, setContactFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    if (typeof window !== 'undefined') { try { const s = localStorage.getItem('renewably_company_profile'); if (s) return JSON.parse(s) } catch { /* */ } }
    return { name: DEFAULT_PROFILE.name, address: DEFAULT_PROFILE.address, email: DEFAULT_PROFILE.email, phone: DEFAULT_PROFILE.phone, vatNumber: DEFAULT_PROFILE.vatNumber, bank: DEFAULT_PROFILE.bank }
  })

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: () => { const p = new URLSearchParams(); if (search) p.set('search', search); if (statusFilter !== 'all') p.set('status', statusFilter); if (startDate) p.set('startDate', startDate); if (endDate) p.set('endDate', endDate); p.set('limit', '200'); return fetch(`/api/crm/invoices?${p}`).then(r => r.json()) },
    refetchInterval: 10000,
  })

  const { data: contactsData } = useQuery({ queryKey: ['contacts-mini'], queryFn: () => fetch('/api/crm/contacts?limit=200').then(r => r.json()) })
  const { data: companiesData } = useQuery({ queryKey: ['companies-mini'], queryFn: () => fetch('/api/crm/companies?limit=200').then(r => r.json()) })
  const { data: dealsData } = useQuery({ queryKey: ['deals-mini'], queryFn: () => fetch('/api/crm/deals?limit=200').then(r => r.json()) })
  const { data: proposalsData } = useQuery({ queryKey: ['proposals-invoices'], queryFn: () => fetch('/api/crm/proposals?limit=200').then(r => r.json()) })

  const allInvoices: Invoice[] = useMemo(() => invoicesData?.invoices || [], [invoicesData])
  const contacts = contactsData?.contacts || []
  const companies = companiesData?.companies || []
  const deals = dealsData?.deals || []
  const proposals = proposalsData?.proposals || []

  // Client-side filtering & sorting
  const invoices = useMemo(() => {
    let filtered = allInvoices
    if (contactFilter !== 'all') filtered = filtered.filter(inv => inv.contact?.id === contactFilter)
    if (companyFilter !== 'all') filtered = filtered.filter(inv => inv.company?.id === companyFilter)
    if (minValue) filtered = filtered.filter(inv => inv.totalAmount >= parseFloat(minValue))
    if (maxValue) filtered = filtered.filter(inv => inv.totalAmount <= parseFloat(maxValue))

    return [...filtered].sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1
      switch (sortBy) {
        case 'value': return dir * (a.totalAmount - b.totalAmount)
        case 'dueDate': return dir * ((new Date(a.dueDate || 0).getTime()) - (new Date(b.dueDate || 0).getTime()))
        case 'status': return dir * a.status.localeCompare(b.status)
        default: return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }
    })
  }, [allInvoices, contactFilter, companyFilter, minValue, maxValue, sortBy, sortDir])

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }, [])
  const selectAll = useCallback(() => {
    if (selectedIds.size === invoices.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(invoices.map(i => i.id)))
  }, [invoices, selectedIds.size])

  // Batch status mutation
  const batchStatusMutation = useMutation({
    mutationFn: (status: string) => fetch('/api/crm/invoices/batch-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds), status }) }).then(r => r.json()),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success(`${data.updated} invoices updated`); setSelectedIds(new Set()) },
    onError: () => toast.error('Failed to update'),
  })

  // Comparison invoices
  const comparisonInvoices = useMemo(() => Array.from(selectedIds).map(id => invoices.find(i => i.id === id)).filter(Boolean) as Invoice[], [selectedIds, invoices])

  // Aging report
  const agingData = useMemo(() => {
    const unpaid = invoices.filter(inv => !['paid', 'void', 'cancelled'].includes(inv.status))
    const current = unpaid.filter(inv => inv.dueDate && new Date(inv.dueDate) > new Date()).reduce((s, inv) => s + inv.totalAmount, 0)
    const overdue = unpaid.filter(inv => inv.dueDate && new Date(inv.dueDate) <= new Date())
    const b30 = overdue.filter(inv => { const d = getDaysOverdue(inv.dueDate); return d >= 1 && d <= 30 })
    const b60 = overdue.filter(inv => { const d = getDaysOverdue(inv.dueDate); return d >= 31 && d <= 60 })
    const b90 = overdue.filter(inv => { const d = getDaysOverdue(inv.dueDate); return d >= 61 && d <= 90 })
    const b90p = overdue.filter(inv => getDaysOverdue(inv.dueDate) > 90)
    const buckets = [
      { label: 'Current', amount: current, count: unpaid.filter(inv => inv.dueDate && new Date(inv.dueDate) > new Date()).length, color: '#059669' },
      { label: '1–30 Days', amount: b30.reduce((s, inv) => s + inv.totalAmount, 0), count: b30.length, color: '#d97706' },
      { label: '31–60 Days', amount: b60.reduce((s, inv) => s + inv.totalAmount, 0), count: b60.length, color: '#ea580c' },
      { label: '61–90 Days', amount: b90.reduce((s, inv) => s + inv.totalAmount, 0), count: b90.length, color: '#dc2626' },
      { label: '90+ Days', amount: b90p.reduce((s, inv) => s + inv.totalAmount, 0), count: b90p.length, color: '#991b1b' },
    ]
    const total = buckets.reduce((s, b) => s + b.amount, 0)
    return { buckets, total }
  }, [invoices])

  // CSV export
  const exportCSV = useCallback(() => {
    const headers = ['Invoice Number', 'Status', 'Contact', 'Company', 'Amount', 'Subtotal', 'VAT', 'Due Date', 'Paid Date', 'Recurring', 'Created']
    const rows = invoices.map(inv => [inv.invoiceNumber, STATUS_CONFIG[inv.status]?.label || inv.status, inv.contact ? `${inv.contact.firstName} ${inv.contact.lastName}` : '', inv.company?.name || '', inv.totalAmount.toFixed(2), inv.subtotal.toFixed(2), inv.taxAmount.toFixed(2), inv.dueDate ? formatDate(inv.dueDate) : '', inv.paidAt ? formatDate(inv.paidAt) : '', inv.isRecurring ? inv.recurringFrequency || 'yes' : 'no', formatDate(inv.createdAt)])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }, [invoices])

  const handleCompanyProfileChange = useCallback((p: CompanyProfile) => { setCompanyProfile(p); localStorage.setItem('renewably_company_profile', JSON.stringify(p)) }, [])
  const handleOpenDetail = useCallback((inv: Invoice) => { setSelectedInvoice(inv); setDetailOpen(true) }, [])
  const handleOpenEdit = useCallback((inv: Invoice) => { setEditingInvoice(inv); setEditOpen(true) }, [])

  // Unique contacts/companies from current data for filters
  const uniqueContacts = useMemo(() => { const map = new Map<string, { id: string; firstName: string; lastName: string }>(); allInvoices.forEach(inv => { if (inv.contact) map.set(inv.contact.id, inv.contact) }); return Array.from(map.values()) }, [allInvoices])
  const uniqueCompanies = useMemo(() => { const map = new Map<string, { id: string; name: string }>(); allInvoices.forEach(inv => { if (inv.company) map.set(inv.company.id, inv.company) }); return Array.from(map.values()) }, [allInvoices])

  return (
    <div className="min-h-screen space-y-6" style={{ backgroundColor: BRAND_DARK }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: BRAND_BORDER, backgroundColor: BRAND_DARK }}>
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#FFFFFF' }}><Receipt className="h-6 w-6" style={{ color: BRAND_YELLOW }} />Invoices</h1>
              <p className="text-sm mt-0.5" style={{ color: BRAND_SUBTLE }}>Manage invoices, track payments, and send reminders</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.size >= 2 && selectedIds.size <= 3 && (
                <Button variant="outline" size="sm" onClick={() => setComparisonOpen(true)} className="text-xs"><ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />Compare ({selectedIds.size})</Button>
              )}
              <Button onClick={() => { setEditingInvoice(null); setEditOpen(true) }} style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }} className="font-semibold gap-1.5"><Plus className="h-4 w-4" />New Invoice</Button>
              <Button onClick={() => { setEditingInvoice(null); setEditOpen(true) }} variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs" style={{ borderColor: BRAND_YELLOW, color: BRAND_DARK }}><Receipt className="h-3.5 w-3.5" />Quick Create</Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4"><QuickStatsBar invoices={allInvoices} /></div>

          {/* Invoice Ageing Summary + Overdue Summary */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><InvoiceAgingSummary invoices={allInvoices} /></div>
            <OverdueSummaryCard invoices={allInvoices} />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: BRAND_MUTED }} />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as typeof sortBy)}><SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem><SelectItem value="value">Amount</SelectItem><SelectItem value="dueDate">Due Date</SelectItem><SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} className="h-9 w-9 p-0" style={{ borderColor: BRAND_BORDER }}><ArrowUpDown className="h-3.5 w-3.5" style={{ color: BRAND_SUBTLE }} /></Button>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-9 gap-1 text-xs" style={{ borderColor: BRAND_BORDER, color: BRAND_SUBTLE }}><Filter className="h-3.5 w-3.5" />Filters</Button>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={invoices.length === 0} className="h-9 gap-1 text-xs shrink-0" style={{ borderColor: BRAND_BORDER, color: BRAND_SUBTLE }}><Download className="h-3.5 w-3.5" />CSV</Button>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>{showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 p-3 rounded-lg" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
                <div className="space-y-1"><Label className="text-[10px]" style={{ color: BRAND_SUBTLE }}>From</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px]" style={{ color: BRAND_SUBTLE }}>To</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px]" style={{ color: BRAND_SUBTLE }}>Min €</Label><Input type="number" placeholder="0" value={minValue} onChange={e => setMinValue(e.target.value)} className="h-8 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px]" style={{ color: BRAND_SUBTLE }}>Max €</Label><Input type="number" placeholder="99999" value={maxValue} onChange={e => setMaxValue(e.target.value)} className="h-8 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px]" style={{ color: BRAND_SUBTLE }}>Contact</Label>
                  <Select value={contactFilter} onValueChange={setContactFilter}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Contacts</SelectItem>{uniqueContacts.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 pb-8 space-y-6">
        {/* Batch Action Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && <BatchActionBar selectedIds={selectedIds} onClear={() => setSelectedIds(new Set())} onBatchStatus={(s) => batchStatusMutation.mutate(s)} />}
        </AnimatePresence>

        {/* Aging Report */}
        {agingData.total > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg p-5" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#FFFFFF' }}><BarChart3 className="h-4 w-4" style={{ color: BRAND_YELLOW }} />Accounts Receivable Aging</h3>
              <span className="text-xs font-semibold" style={{ color: BRAND_SUBTLE }}>Total: {formatCurrency(agingData.total)}</span>
            </div>
            <div className="space-y-2.5">
              {agingData.buckets.map(bucket => {
                const pct = agingData.total > 0 ? (bucket.amount / agingData.total) * 100 : 0
                return (
                  <div key={bucket.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: BRAND_SUBTLE }}>{bucket.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: BRAND_MUTED }}>{bucket.count} invoice{bucket.count !== 1 ? 's' : ''}</span>
                        <span className="text-xs font-bold" style={{ color: bucket.amount > 0 ? bucket.color : BRAND_MUTED }}>{formatCurrency(bucket.amount)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' as const }} className="h-full rounded-full" style={{ backgroundColor: bucket.color, minWidth: bucket.amount > 0 ? '4px' : '0' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Invoice Table */}
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: BRAND_SURFACE, border: `1px solid ${BRAND_BORDER}` }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 rounded-full" style={{ border: `2px solid ${BRAND_YELLOW}`, borderTopColor: 'transparent' }} /></div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: BRAND_MUTED }}>
              <Receipt className="h-12 w-12 mb-3 opacity-30" /><p className="text-sm font-medium">No invoices found</p><p className="text-xs mt-1">Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}>
                    <th className="w-10 px-3 py-3"><button onClick={selectAll}>{selectedIds.size === invoices.length ? <CheckSquare className="h-4 w-4" style={{ color: BRAND_YELLOW }} /> : <Square className="h-4 w-4" style={{ color: BRAND_MUTED }} />}</button></th>
                    <th className="text-left text-[11px] uppercase font-medium px-4 py-3" style={{ color: BRAND_MUTED }}>Invoice #</th>
                    <th className="text-left text-[11px] uppercase font-medium px-4 py-3" style={{ color: BRAND_MUTED }}>Client</th>
                    <th className="text-right text-[11px] uppercase font-medium px-4 py-3" style={{ color: BRAND_MUTED }}>Amount</th>
                    <th className="text-center text-[11px] uppercase font-medium px-4 py-3" style={{ color: BRAND_MUTED }}>Status</th>
                    <th className="text-left text-[11px] uppercase font-medium px-4 py-3" style={{ color: BRAND_MUTED }}>Due Date</th>
                    <th className="text-center text-[11px] uppercase font-medium px-4 py-3" style={{ color: BRAND_MUTED }}>Type</th>
                    <th className="text-right text-[11px] uppercase font-medium px-4 py-3" style={{ color: BRAND_MUTED }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const isOverdue = inv.status === 'overdue'
                    const isCredit = inv.invoiceNumber.startsWith('CN-')
                    return (
                      <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ backgroundColor: 'rgba(243,216,64,0.04)' }} className="cursor-pointer"
                        style={{ borderBottom: `1px solid ${BRAND_BORDER}`, backgroundColor: isOverdue ? 'rgba(239,68,68,0.04)' : isCredit ? 'rgba(139,92,246,0.04)' : undefined }}
                        onClick={() => handleOpenDetail(inv)}>
                        <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleSelect(inv.id) }}>
                          {selectedIds.has(inv.id) ? <CheckSquare className="h-4 w-4" style={{ color: BRAND_YELLOW }} /> : <Square className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.2)' }} />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" style={{ color: isCredit ? '#8B5CF6' : BRAND_MUTED }} />
                            <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{inv.invoiceNumber}</span>
                            {inv.stripePaymentIntent && <Zap className="h-3 w-3" style={{ color: '#6366f1' }} />}
                            {inv.isRecurring && <Repeat className="h-3 w-3" style={{ color: BRAND_YELLOW }} title="Recurring" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm" style={{ color: '#FFFFFF' }}>{inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`.trim() || '—'}</div>
                          {inv.proposal && <p className="text-[11px]" style={{ color: BRAND_SUBTLE }}>{inv.proposal.title}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold" style={{ color: isCredit ? '#8B5CF6' : '#FFFFFF' }}>{formatCurrency(inv.totalAmount)}</span>
                          {inv._count && inv._count.payments > 0 && <p className="text-[11px]" style={{ color: '#059669' }}>{inv._count.payments} payment{inv._count.payments > 1 ? 's' : ''}</p>}
                        </td>
                        <td className="px-4 py-3 text-center"><InvoiceStatusBadge status={inv.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#FFFFFF' }}>
                            <Calendar className="h-3.5 w-3.5" style={{ color: BRAND_MUTED }} />{formatDate(inv.dueDate)}
                          </div>
                          {isOverdue && <p className="text-[11px] font-semibold" style={{ color: '#dc2626' }}>{getDaysOverdue(inv.dueDate)}d overdue</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isCredit && <Badge variant="outline" className="text-[10px]" style={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}>Credit</Badge>}
                          {inv.isRecurring && <Badge variant="outline" className="text-[10px]" style={{ borderColor: BRAND_YELLOW, color: BRAND_YELLOW }}>{inv.recurringFrequency}</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: BRAND_SUBTLE }}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDetail(inv)}><Eye className="h-3.5 w-3.5 mr-2" />View Details</DropdownMenuItem>
                                {showPayBtn && <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setDetailOpen(true) }} style={{ color: '#059669' }}><CreditCard className="h-3.5 w-3.5 mr-2" />Record Payment</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => handleOpenEdit(inv)}><Edit3 className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/api/crm/invoices/${inv.id}/pdf`, '_blank')}><Download className="h-3.5 w-3.5 mr-2" />Download PDF</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { fetch(`/api/crm/invoices/${inv.id}/duplicate`, { method: 'POST' }).then(r => r.json()).then(d => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success(`Duplicated as ${d.invoice?.invoiceNumber}`) }).catch(() => toast.error('Failed')) }}>
                                  <Copy className="h-3.5 w-3.5 mr-2" />Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem style={{ color: '#dc2626' }} onClick={() => { if (confirm('Delete this invoice?')) fetch(`/api/crm/invoices/${inv.id}`, { method: 'DELETE' }).then(() => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Deleted') }).catch(() => toast.error('Failed')) }}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <InvoiceForm invoice={editingInvoice ?? undefined} contacts={contacts} companies={companies} deals={deals} proposals={proposals} companyProfile={companyProfile} onCompanyProfileChange={handleCompanyProfileChange} onClose={() => { setEditOpen(false); setEditingInvoice(null) }} />
      </Dialog>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden" style={{ backgroundColor: BRAND_DARK }}>
          {selectedInvoice && <InvoiceDetail invoice={selectedInvoice} companyProfile={companyProfile} onClose={() => { setDetailOpen(false); setSelectedInvoice(null) }} onEdit={handleOpenEdit} />}
        </SheetContent>
      </Sheet>

      <InvoiceComparisonDialog invoices={comparisonInvoices} open={comparisonOpen} onClose={() => setComparisonOpen(false)} />
    </div>
  )
}
