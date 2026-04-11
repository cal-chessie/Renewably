'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Building2,
  User,
  DollarSign,
  Trash2,
  Edit3,
  Copy,
  ChevronRight,
  MoreHorizontal,
  LayoutTemplate,
  GripVertical,
  X,
  AlertTriangle,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  if (!date) return null
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileText },
  sent: { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Send },
  viewed: { label: 'Viewed', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Eye },
  accepted: { label: 'Accepted', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
  expired: { label: 'Expired', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: Clock },
}

const KANBAN_COLUMNS = ['draft', 'sent', 'viewed', 'accepted', 'rejected']

interface LineItem {
  id: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  sortOrder: number
}

interface Proposal {
  id: string
  title: string
  status: string
  totalAmount: number
  validUntil: string | null
  sentAt: string | null
  viewedAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  contact: { id: string; firstName: string; lastName: string; email: string } | null
  company: { id: string; name: string } | null
  deal: { id: string; title: string } | null
  template: { id: string; name: string } | null
  _count?: { lineItems: number }
  lineItems?: LineItem[]
}

// ── Status Badge Component ──

function ProposalStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

// ── Proposal Card Component ──

function ProposalCard({
  proposal,
  onClick,
}: {
  proposal: Proposal
  onClick: (p: Proposal) => void
}) {
  const config = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      onClick={() => onClick(proposal)}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-[#374151]">
          {proposal.title}
        </h4>
        <ProposalStatusBadge status={proposal.status} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <DollarSign className="h-4 w-4 text-[#374151]" />
          {formatCurrency(proposal.totalAmount)}
        </div>

        {proposal.contact && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="h-3 w-3" />
            {proposal.contact.firstName} {proposal.contact.lastName}
          </div>
        )}

        {proposal.company && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 className="h-3 w-3" />
            {proposal.company.name}
          </div>
        )}

        {proposal.deal && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FileText className="h-3 w-3" />
            {proposal.deal.title}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-[11px] text-gray-400">
          {formatDate(proposal.createdAt)}
        </span>
        {proposal._count && (
          <span className="text-[11px] text-gray-400">
            {proposal._count.lineItems} item{proposal._count.lineItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ── Status Timeline Component ──

function StatusTimeline({ proposal }: { proposal: Proposal }) {
  const steps = [
    { key: 'created', label: 'Created', date: proposal.createdAt, done: true },
    { key: 'sent', label: 'Sent', date: proposal.sentAt, done: !!proposal.sentAt },
    { key: 'viewed', label: 'Viewed', date: proposal.viewedAt, done: !!proposal.viewedAt },
    {
      key: 'resolved',
      label: proposal.status === 'accepted' ? 'Accepted' : proposal.status === 'rejected' ? 'Rejected' : 'Awaiting',
      date: proposal.acceptedAt || proposal.rejectedAt,
      done: ['accepted', 'rejected'].includes(proposal.status),
    },
  ]

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                step.done
                  ? 'bg-[#F3D840] text-[#374151]'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-gray-300" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 h-8 ${step.done ? 'bg-[#F3D840]/40' : 'bg-gray-200'}`} />
            )}
          </div>
          <div className="pb-6">
            <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.label}
            </p>
            {step.date && (
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDateTime(step.date)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Create/Edit Proposal Panel ──

function ProposalForm({
  proposal,
  contacts,
  deals,
  companies,
  templates,
  onClose,
}: {
  proposal?: Proposal
  contacts: Array<{ id: string; firstName: string; lastName: string }>
  deals: Array<{ id: string; title: string }>
  companies: Array<{ id: string; name: string }>
  templates: Array<{ id: string; name: string; lineItems: string }>
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEditing = !!proposal

  const [form, setForm] = useState({
    title: proposal?.title || '',
    contactId: proposal?.contact?.id || '',
    dealId: proposal?.deal?.id || '',
    companyId: proposal?.company?.id || '',
    validUntil: proposal?.validUntil?.split('T')[0] || '',
    notes: proposal?.notes || '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>(
    proposal?.lineItems?.length
      ? proposal.lineItems
      : [
          {
            id: crypto.randomUUID(),
            name: '',
            description: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
            sortOrder: 0,
          },
        ]
  )

  const total = lineItems.reduce((sum, item) => sum + item.total, 0)

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
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
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        sortOrder: lineItems.length,
      },
    ])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const loadTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return
    try {
      const items = JSON.parse(tpl.lineItems || '[]')
      if (Array.isArray(items) && items.length > 0) {
        setLineItems(
          items.map((item: Record<string, unknown>, index: number) => ({
            id: crypto.randomUUID(),
            name: (item.name as string) || '',
            description: (item.description as string) || '',
            quantity: (item.quantity as number) || 1,
            unitPrice: (item.unitPrice as number) || 0,
            total: ((item.quantity as number) || 1) * ((item.unitPrice as number) || 0),
            sortOrder: index,
          }))
        )
        toast.success(`Template "${tpl.name}" loaded`)
      }
    } catch {
      toast.error('Failed to load template')
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        contactId: form.contactId || null,
        dealId: form.dealId || null,
        companyId: form.companyId || null,
        validUntil: form.validUntil || null,
        totalAmount: total,
        lineItems: lineItems.map((item, i) => ({
          ...item,
          sortOrder: i,
        })),
      }

      if (isEditing) {
        const res = await fetch(`/api/crm/proposals/${proposal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update')
        }
        return res.json()
      } else {
        const res = await fetch('/api/crm/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create')
        }
        return res.json()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast.success(isEditing ? 'Proposal updated' : 'Proposal created')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      // First save, then send
      const payload = {
        ...form,
        contactId: form.contactId || null,
        dealId: form.dealId || null,
        companyId: form.companyId || null,
        validUntil: form.validUntil || null,
        totalAmount: total,
        lineItems: lineItems.map((item, i) => ({
          ...item,
          sortOrder: i,
        })),
      }

      let proposalId = proposal?.id

      if (isEditing) {
        const res = await fetch(`/api/crm/proposals/${proposal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to save')
      } else {
        const res = await fetch('/api/crm/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create')
        const data = await res.json()
        proposalId = data.proposal.id
      }

      // Send
      const sendRes = await fetch(`/api/crm/proposals/${proposalId}/send`, {
        method: 'POST',
      })
      if (!sendRes.ok) throw new Error('Failed to send')
      return sendRes.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast.success('Proposal sent successfully!')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Title */}
          <div className="space-y-2">
            <Label>Proposal Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Website Redesign Proposal"
            />
          </div>

          {/* Contact & Deal Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact</Label>
              <Select
                value={form.contactId}
                onValueChange={(v) => setForm({ ...form, contactId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deal</Label>
              <Select
                value={form.dealId}
                onValueChange={(v) => setForm({ ...form, dealId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select deal" />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Company & Valid Until */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                value={form.companyId}
                onValueChange={(v) => setForm({ ...form, companyId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>
          </div>

          {/* Template Loader */}
          {templates.length > 0 && !isEditing && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Load from Template
              </Label>
              <Select onValueChange={loadTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Line Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="text-xs border-[#F3D840] text-[#374151] hover:bg-[#F3D840]/10"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                    <Input
                      value={item.name}
                      onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                      placeholder="Item name *"
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length <= 1}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-end gap-2 pl-6">
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="flex-1 h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pl-6">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-gray-400 font-medium">Qty</span>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-gray-400 font-medium">Unit Price</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-gray-400 font-medium">Total</span>
                      <div className="h-8 flex items-center px-3 bg-white rounded-md border text-sm font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-[#F3D840]/10 border border-[#F3D840]/30 rounded-lg p-4 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Total Amount</span>
              <span className="text-2xl font-bold text-[#374151]">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes, terms, conditions..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t bg-white p-4 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onClose} className="text-gray-600">
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || sendMutation.isPending || !form.title}
            variant="outline"
            className="border-[#374151] text-[#374151] hover:bg-[#374151] hover:text-white"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || saveMutation.isPending || !form.title}
            className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832] font-medium"
          >
            {sendMutation.isPending ? 'Sending...' : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Save & Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Proposal Detail Panel ──

function ProposalDetail({
  proposal,
  onClose,
  onEdit,
}: {
  proposal: Proposal
  onClose: () => void
  onEdit: (p: Proposal) => void
}) {
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')

  const sendMutation = useMutation({
    mutationFn: () => fetch(`/api/crm/proposals/${proposal.id}/send`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['proposal', proposal.id] })
      toast.success('Proposal sent!')
    },
    onError: () => toast.error('Failed to send'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      fetch(`/api/crm/proposals/${proposal.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['proposal', proposal.id] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/crm/proposals/${proposal.id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast.success('Proposal deleted')
      onClose()
    },
    onError: () => toast.error('Failed to delete'),
  })

  const saveTemplateMutation = useMutation({
    mutationFn: () =>
      fetch('/api/crm/proposals/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: `Template from ${proposal.title}`,
          lineItems: proposal.lineItems?.map(({ id: _id, ...rest }) => rest) || [],
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template saved!')
      setSaveTemplateOpen(false)
      setTemplateName('')
    },
    onError: () => toast.error('Failed to save template'),
  })

  const config = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft

  return (
    <>
      <div className="flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-lg">{proposal.title}</SheetTitle>
              <SheetDescription>
                Created {formatDate(proposal.createdAt)}
              </SheetDescription>
            </div>
            <ProposalStatusBadge status={proposal.status} />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              {proposal.contact && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-[11px] uppercase text-gray-400 font-medium">Contact</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {proposal.contact.firstName} {proposal.contact.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{proposal.contact.email}</p>
                </div>
              )}
              {proposal.company && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-[11px] uppercase text-gray-400 font-medium">Company</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {proposal.company.name}
                  </p>
                </div>
              )}
              {proposal.deal && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-[11px] uppercase text-gray-400 font-medium">Deal</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {proposal.deal.title}
                  </p>
                </div>
              )}
              {proposal.validUntil && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-[11px] uppercase text-gray-400 font-medium">Valid Until</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(proposal.validUntil)}
                  </p>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Timeline</h3>
              <StatusTimeline proposal={proposal} />
            </div>

            {/* Line Items */}
            {proposal.lineItems && proposal.lineItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Line Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-[11px] uppercase text-gray-400 font-medium px-3 py-2">Item</th>
                        <th className="text-right text-[11px] uppercase text-gray-400 font-medium px-3 py-2 w-16">Qty</th>
                        <th className="text-right text-[11px] uppercase text-gray-400 font-medium px-3 py-2 w-24">Unit Price</th>
                        <th className="text-right text-[11px] uppercase text-gray-400 font-medium px-3 py-2 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.lineItems.map((item) => (
                        <tr key={item.id} className="border-t border-gray-50">
                          <td className="px-3 py-2.5">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-right text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right text-sm font-medium text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#F3D840]/10 border-t border-[#F3D840]/30">
                        <td colSpan={3} className="px-3 py-3 text-sm font-semibold text-gray-700 text-right">
                          Total
                        </td>
                        <td className="px-3 py-3 text-right text-base font-bold text-[#374151]">
                          {formatCurrency(proposal.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {proposal.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 whitespace-pre-wrap">
                  {proposal.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t bg-white p-4 space-y-3 shrink-0">
          {/* Status Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {proposal.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832]"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {sendMutation.isPending ? 'Sending...' : 'Mark as Sent'}
              </Button>
            )}
            {proposal.status === 'sent' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate('viewed')}
                disabled={statusMutation.isPending}
                className="border-amber-400 text-amber-600 hover:bg-amber-50"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Mark as Viewed
              </Button>
            )}
            {(proposal.status === 'sent' || proposal.status === 'viewed') && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => statusMutation.mutate('accepted')}
                  disabled={statusMutation.isPending}
                  className="border-green-400 text-green-600 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => statusMutation.mutate('rejected')}
                  disabled={statusMutation.isPending}
                  className="border-red-400 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Reject
                </Button>
              </>
            )}
          </div>

          {/* Other Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(proposal)} className="text-gray-600">
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTemplateName(`${proposal.title} - Template`)
                setSaveTemplateOpen(true)
              }}
              className="text-gray-600"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Save as Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Proposal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{proposal.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save the line items from this proposal as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Template Name</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Website Redesign Package"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveTemplateMutation.mutate()}
              disabled={!templateName || saveTemplateMutation.isPending}
              className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832]"
            >
              {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Main Proposals Page ──

export default function ProposalsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ['proposals', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '100')
      return fetch(`/api/crm/proposals?${params}`).then((r) => r.json())
    },
    refetchInterval: 10000,
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-mini'],
    queryFn: () => fetch('/api/crm/contacts?limit=100').then((r) => r.json()),
  })

  const { data: dealsData } = useQuery({
    queryKey: ['deals-mini'],
    queryFn: () => fetch('/api/crm/deals?limit=100').then((r) => r.json()),
  })

  const { data: companiesData } = useQuery({
    queryKey: ['companies-mini'],
    queryFn: () => fetch('/api/crm/companies?limit=100').then((r) => r.json()),
  })

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => fetch('/api/crm/proposals/templates').then((r) => r.json()),
  })

  // Fetch full detail when selecting a proposal
  const { data: proposalDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['proposal', selectedProposal?.id],
    queryFn: () => fetch(`/api/crm/proposals/${selectedProposal!.id}`).then((r) => r.json()),
    enabled: !!selectedProposal && detailOpen,
  })

  const fullProposal = proposalDetail?.proposal || selectedProposal

  const proposals: Proposal[] = proposalsData?.proposals || []
  const contacts = contactsData?.contacts || []
  const deals = dealsData?.deals || []
  const companies = companiesData?.companies || []
  const templates = templatesData?.templates || []

  // Group by status for Kanban
  const grouped = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = proposals.filter((p) => p.status === status)
      return acc
    },
    {} as Record<string, Proposal[]>
  )

  const columnTotals = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = grouped[status].reduce((sum, p) => sum + p.totalAmount, 0)
      return acc
    },
    {} as Record<string, number>
  )

  const handleOpenDetail = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setDetailOpen(true)
  }, [])

  const handleOpenEdit = useCallback((proposal: Proposal) => {
    setEditingProposal(proposal)
    setEditOpen(true)
  }, [])

  return (
    <div className="p-6 lg:p-8 space-y-6 h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create, send, and track your proposals
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832] font-medium shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Proposal
        </Button>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3 shrink-0"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposals..."
            className="pl-9 bg-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0"
      >
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-medium">Total Proposals</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{proposals.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-medium">Total Value</p>
          <p className="text-xl font-bold text-[#374151] mt-1">
            {formatCurrency(proposals.reduce((s, p) => s + p.totalAmount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-medium">Accepted</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {proposals.filter((p) => p.status === 'accepted').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-medium">Acceptance Rate</p>
          <p className="text-xl font-bold text-[#374151] mt-1">
            {proposals.filter((p) => ['accepted', 'rejected'].includes(p.status)).length > 0
              ? `${Math.round(
                  (proposals.filter((p) => p.status === 'accepted').length /
                    proposals.filter((p) => ['accepted', 'rejected'].includes(p.status)).length) *
                    100
                )}%`
              : '—'}
          </p>
        </div>
      </motion.div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse h-96" />
          ))}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status, colIndex) => {
            const cfg = STATUS_CONFIG[status]
            const StatusIcon = cfg.icon
            const items = grouped[status] || []

            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIndex * 0.06 }}
                className="flex flex-col bg-gray-100/80 rounded-xl min-h-[200px]"
              >
                {/* Column Header */}
                <div
                  className="px-3 py-2.5 rounded-t-xl"
                  style={{ backgroundColor: cfg.bgColor }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-3.5 w-3.5" style={{ color: cfg.color.replace('text-', '').includes('gray') ? '#6B7280' : undefined }} />
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {cfg.label}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-white/60 rounded-full px-1.5 py-0.5">
                      {items.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {formatCurrency(columnTotals[status])}
                  </p>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-340px)]">
                  <AnimatePresence>
                    {items.map((proposal) => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        onClick={handleOpenDetail}
                      />
                    ))}
                  </AnimatePresence>
                  {items.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                      No proposals
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Proposal Sheet */}
      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent side="right" className="sm:max-w-xl p-0 w-full">
          <SheetHeader className="p-6 pb-0 border-b bg-gray-50">
            <SheetTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#F3D840] flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#374151]" />
              </div>
              New Proposal
            </SheetTitle>
            <SheetDescription>Create a new proposal for your client</SheetDescription>
          </SheetHeader>
          <ProposalForm
            contacts={contacts}
            deals={deals}
            companies={companies}
            templates={templates}
            onClose={() => setIsCreating(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Proposal Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="sm:max-w-lg p-0 w-full">
          {detailLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-2 border-[#F3D840] border-t-transparent rounded-full" />
            </div>
          ) : fullProposal ? (
            <ProposalDetail
              proposal={fullProposal}
              onClose={() => setDetailOpen(false)}
              onEdit={(p) => {
                setDetailOpen(false)
                handleOpenEdit(p)
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Edit Proposal Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="sm:max-w-xl p-0 w-full">
          <SheetHeader className="p-6 pb-0 border-b bg-gray-50">
            <SheetTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#374151] flex items-center justify-center">
                <Edit3 className="h-4 w-4 text-white" />
              </div>
              Edit Proposal
            </SheetTitle>
            <SheetDescription>Update your proposal details</SheetDescription>
          </SheetHeader>
          {editingProposal && (
            <ProposalForm
              proposal={editingProposal}
              contacts={contacts}
              deals={deals}
              companies={companies}
              templates={templates}
              onClose={() => setEditOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
