'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, GripVertical, X, Pencil, Trash2, CheckSquare, FileText,
  StickyNote, Phone, Mail, Calendar, Clock, MapPin, User, Building2,
  DollarSign, TrendingUp, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { PriorityBadge } from '@/components/crm/PriorityBadge'
import { ActivityIcon } from '@/components/crm/ActivityIcon'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ──────────────────────────── Helpers ────────────────────────────
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ──────────────────────────── Types ────────────────────────────
interface Deal {
  id: string
  title: string
  value: number
  currency: string
  probability: number
  closeDate: string | null
  description: string | null
  createdAt: string
  contact?: { id: string; firstName: string; lastName: string; email: string | null; company?: { id: string; name: string } | null } | null
  assignee?: { id: string; name: string; avatar: string | null } | null
  stageId: string
  stage?: { id: string; name: string; color: string; order: number }
  company?: { id: string; name: string } | null
}

interface DealDetail extends Deal {
  creator?: { id: string; name: string } | null
  activities: Array<{
    id: string; type: string; subject: string; description: string | null
    duration: number | null; status: string | null; createdAt: string
    user: { id: string; name: string; avatar: string | null } | null
  }>
  notes: Array<{
    id: string; content: string; createdAt: string
    user: { id: string; name: string; avatar: string | null } | null
  }>
  tasks: Array<{
    id: string; title: string; priority: string; status: string; dueDate: string | null
    assignee: { id: string; name: string; avatar: string | null } | null
  }>
  tags: Array<{ tag: { id: string; name: string; color: string } }>
  proposals?: Array<{
    id: string; title: string; status: string; totalAmount: number; sentAt: string | null
  }>
}

interface Stage {
  id: string
  name: string
  order: number
  color: string
  deals: Deal[]
}

// ──────────────────────────── Deal Card ────────────────────────────
function DealCard({ deal, isDragging, onClick }: { deal: Deal; isDragging?: boolean; onClick?: () => void }) {
  return (
    <div
      className={`rounded-lg p-3 transition-shadow hover:shadow-md cursor-pointer ${
        isDragging ? 'shadow-lg rotate-2 opacity-90' : ''
      }`}
      style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium leading-tight line-clamp-2" style={{ color: '#FFFFFF' }}>
          {deal.title}
        </h4>
        <GripVertical className="h-4 w-4 text-gray-300 shrink-0 cursor-grab" />
      </div>
      <p className="text-lg font-bold" style={{ color: '#FFFFFF' }}>{formatCurrency(deal.value)}</p>
      <div className="flex items-center justify-between mt-2">
        {deal.contact && (
          <span className="text-xs" style={{ color: '#A0A0A0' }}>
            {deal.contact.firstName} {deal.contact.lastName}
          </span>
        )}
        <span className="text-xs text-gray-400">{deal.probability}%</span>
      </div>
      {deal.assignee && (
        <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid #2A2A2A' }}>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-[#F3D840] text-[#374151] text-[10px]">
              {deal.assignee.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-400">{deal.assignee.name}</span>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────── Sortable Deal Card ────────────────────────────
function SortableDealCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DealCard deal={deal} isDragging={isDragging} onClick={onClick} />
    </div>
  )
}

// ──────────────────────────── Edit Deal Dialog ────────────────────────────
function EditDealDialog({ deal, stages, contacts, open, onOpenChange }: {
  deal: DealDetail; stages: Stage[]; contacts: Array<{ id: string; firstName: string; lastName: string }>;
  open: boolean; onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    title: deal.title, value: String(deal.value), probability: String(deal.probability),
    stageId: deal.stageId, contactId: deal.contact?.id || '', closeDate: deal.closeDate ? format(new Date(deal.closeDate), 'yyyy-MM-dd') : '',
    description: deal.description || '',
  })
  const handleOpenChange = useCallback((v: boolean) => {
    if (v) setForm({
      title: deal.title, value: String(deal.value), probability: String(deal.probability),
      stageId: deal.stageId, contactId: deal.contact?.id || '', closeDate: deal.closeDate ? format(new Date(deal.closeDate), 'yyyy-MM-dd') : '',
      description: deal.description || '',
    })
    onOpenChange(v)
  }, [deal, onOpenChange])

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/crm/deals/${deal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to update deal')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pipeline'] }); queryClient.invalidateQueries({ queryKey: ['deal-detail'] }); onOpenChange(false); toast.success('Deal updated') },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Value (€)</Label><Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
            <div className="space-y-2"><Label>Probability (%)</Label><Input type="number" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={form.stageId} onValueChange={v => setForm({ ...form, stageId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Select value={form.contactId} onValueChange={v => setForm({ ...form, contactId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Close Date</Label><Input type="date" value={form.closeDate} onChange={e => setForm({ ...form, closeDate: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <Button onClick={() => mutation.mutate({ title: form.title, value: parseFloat(form.value) || 0, probability: parseInt(form.probability) || 0, stageId: form.stageId, contactId: form.contactId || null, closeDate: form.closeDate || null, description: form.description || null })} disabled={mutation.isPending} className="w-full bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Create Task (from Deal) Dialog ────────────────────────────
function CreateTaskFromDealDialog({ dealId, contactId, open, onOpenChange }: {
  dealId: string; contactId: string | null; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const mutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch('/api/crm/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-detail'] }); setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); onOpenChange(false); toast.success('Task created') },
    onError: (e: Error) => toast.error(e.message),
  })
  const handleOpenChange = useCallback((v: boolean) => { if (v) { setTitle(''); setDescription(''); setPriority('medium'); setDueDate('') } onOpenChange(v) }, [onOpenChange])
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Task description..." rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <Button onClick={() => { if (!title) { toast.error('Title is required'); return } mutation.mutate({ title, description, priority, dueDate: dueDate || undefined, dealId, contactId: contactId || undefined }) }} disabled={mutation.isPending} className="w-full bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Create Proposal (from Deal) Dialog ────────────────────────────
interface LineItem { name: string; quantity: number; unitPrice: number; total: number }

function CreateProposalFromDealDialog({ dealId, dealTitle, contactId, open, onOpenChange }: {
  dealId: string; dealTitle: string; contactId: string | null; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ name: '', quantity: 1, unitPrice: 0, total: 0 }])
  const handleOpenChange = useCallback((v: boolean) => {
    if (v) { setTitle(`Proposal for ${dealTitle}`); setLineItems([{ name: '', quantity: 1, unitPrice: 0, total: 0 }]) }
    onOpenChange(v)
  }, [dealTitle, onOpenChange])

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      updated.total = (typeof updated.quantity === 'number' ? updated.quantity : 1) * (typeof updated.unitPrice === 'number' ? updated.unitPrice : 0)
      return updated
    }))
  }
  const addLineItem = () => setLineItems(prev => [...prev, { name: '', quantity: 1, unitPrice: 0, total: 0 }])
  const removeLineItem = (index: number) => setLineItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to create proposal')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-detail'] }); onOpenChange(false); toast.success('Proposal created') },
    onError: (e: Error) => toast.error(e.message),
  })

  const totalAmount = lineItems.reduce((sum, li) => sum + li.total, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Proposal</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label>Line Items</Label><Button variant="ghost" size="sm" onClick={addLineItem}><Plus className="h-3 w-3 mr-1" /> Add</Button></div>
            <div className="space-y-2">
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_80px_28px] gap-2 items-end">
                  <Input value={li.name} onChange={e => updateLineItem(i, 'name', e.target.value)} placeholder="Item name" className="h-9 text-sm" />
                  <Input type="number" value={li.quantity} onChange={e => updateLineItem(i, 'quantity', parseInt(e.target.value) || 0)} className="h-9 text-sm" min={1} />
                  <Input type="number" value={li.unitPrice} onChange={e => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                  <span className="text-sm font-medium pb-2 text-right" style={{ color: '#A0A0A0' }}>{formatCurrency(li.total)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => removeLineItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid #2A2A2A' }}><span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>Total: {formatCurrency(totalAmount)}</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { if (!title) { toast.error('Title is required'); return } mutation.mutate({ title, dealId, contactId, lineItems: lineItems.map((li, i) => ({ ...li, sortOrder: i })), validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }) }} disabled={mutation.isPending} className="flex-1">Save Draft</Button>
            <Button onClick={() => { if (!title) { toast.error('Title is required'); return } mutation.mutate({ title, dealId, contactId, lineItems: lineItems.map((li, i) => ({ ...li, sortOrder: i })), validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), sentAt: new Date().toISOString() }) }} disabled={mutation.isPending} className="flex-1 bg-[#374151] hover:bg-[#1F2937] text-white">
              {mutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Log Activity (from Deal) Dialog ────────────────────────────
function LogActivityDialog({ dealId, open, onOpenChange }: { dealId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [type, setType] = useState('note')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to log activity')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-detail'] }); setType('note'); setSubject(''); setDescription(''); onOpenChange(false); toast.success('Activity logged') },
    onError: (e: Error) => toast.error(e.message),
  })
  const handleOpenChange = useCallback((v: boolean) => { if (v) { setType('note'); setSubject(''); setDescription('') } onOpenChange(v) }, [onOpenChange])
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Subject *</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Activity subject" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details..." rows={3} /></div>
          <Button onClick={() => { if (!subject) { toast.error('Subject is required'); return } mutation.mutate({ type, subject, description, dealId }) }} disabled={mutation.isPending} className="w-full bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Logging...' : 'Log Activity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Deal Detail Panel ────────────────────────────
function DealDetailPanel({ dealId, stages, contacts, onClose }: {
  dealId: string; stages: Stage[]; contacts: Array<{ id: string; firstName: string; lastName: string }>;
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['deal-detail', dealId],
    queryFn: () => fetch(`/api/crm/deals/${dealId}`).then(r => r.json()),
    enabled: !!dealId,
  })

  const deal: DealDetail | null = data?.deal || null

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/deals/${dealId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete deal')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pipeline'] }); onClose(); toast.success('Deal deleted') },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) {
    return (
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full md:w-[480px] shadow-xl z-50 flex items-center justify-center" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="animate-pulse text-gray-400">Loading...</div>
      </motion.div>
    )
  }

  if (!deal) return null

  const quickActions = [
    { key: 'edit', icon: Pencil, label: 'Edit Deal' },
    { key: 'task', icon: CheckSquare, label: 'Create Task' },
    { key: 'proposal', icon: FileText, label: 'Create Proposal' },
    { key: 'activity', icon: StickyNote, label: 'Log Activity' },
    { key: 'delete', icon: Trash2, label: 'Delete Deal', variant: 'danger' as const },
  ]

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40 md:block hidden" onClick={onClose} />

      {/* Panel */}
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full md:w-[480px] shadow-xl z-50 flex flex-col" style={{ backgroundColor: '#1A1A1A' }}>
        {/* Header */}
        <div className="p-5 shrink-0" style={{ borderBottom: '1px solid #2A2A2A' }}>
          <div className="flex items-start justify-between mb-3">
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
              <X className="h-5 w-5" style={{ color: '#A0A0A0' }} />
            </button>
            <div className="flex items-center gap-2">
              {deal.closeDate && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(deal.closeDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#FFFFFF' }}>{deal.title}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{formatCurrency(deal.value)}</span>
            {deal.stage && (
              <Badge variant="outline" className="font-medium" style={{ borderColor: deal.stage.color, color: deal.stage.color }}>{deal.stage.name}</Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />{deal.probability}%
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Contact Info */}
          {deal.contact && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#141414' }}>
                <div className="h-10 w-10 rounded-full bg-[#F3D840]/20 flex items-center justify-center shrink-0">
                  <span className="text-[#374151] text-xs font-bold">{deal.contact.firstName[0]}{deal.contact.lastName[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{deal.contact.firstName} {deal.contact.lastName}</p>
                  {deal.contact.email && <p className="text-xs" style={{ color: '#A0A0A0' }}>{deal.contact.email}</p>}
                  {deal.contact.company && <p className="text-xs text-gray-400">{deal.contact.company.name}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {deal.description && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#A0A0A0' }}>{deal.description}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map(action => (
                <button
                  key={action.key}
                  onClick={() => {
                    if (action.key === 'delete') {
                      if (confirm('Are you sure you want to delete this deal?')) deleteMutation.mutate()
                      return
                    }
                    setActiveDialog(action.key)
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                    action.variant === 'danger'
                      ? 'border-red-900 hover:border-red-600 hover:bg-red-500/10 text-red-400'
                      : 'hover:border-[#F3D840]/50 hover:bg-[#F3D840]/5 text-[#F3D840]'
                  }`}
                  style={{ borderColor: action.variant === 'danger' ? '#7F1D1D' : '#2A2A2A' }}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-[11px] font-medium text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          {deal.activities.length > 0 && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activities ({deal.activities.length})</h3>
              <div className="space-y-3">
                {deal.activities.slice(0, 10).map(activity => (
                  <div key={activity.id} className="flex gap-3">
                    <ActivityIcon type={activity.type} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: '#FFFFFF' }}>{activity.subject}</p>
                      {activity.description && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#A0A0A0' }}>{activity.description}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{format(new Date(activity.createdAt), 'MMM d, yyyy \'at\' h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {deal.tasks.length > 0 && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tasks ({deal.tasks.length})</h3>
              <div className="space-y-2">
                {deal.tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <PriorityBadge priority={task.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: '#FFFFFF' }}>{task.title}</p>
                      {task.dueDate && <p className="text-[10px] text-gray-400">{format(new Date(task.dueDate), 'MMM d, yyyy')}</p>}
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {deal.notes.length > 0 && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes ({deal.notes.length})</h3>
              <div className="space-y-2">
                {deal.notes.slice(0, 5).map(note => (
                  <div key={note.id} className="p-2.5 rounded-lg" style={{ backgroundColor: '#141414' }}>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#A0A0A0' }}>{note.content}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      {note.user && <span className="text-[10px] text-gray-400">{note.user.name}</span>}
                      <span className="text-[10px] text-gray-400">{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposals */}
          {deal.proposals && deal.proposals.length > 0 && (
            <div className="p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Proposals ({deal.proposals.length})</h3>
              <div className="space-y-2">
                {deal.proposals.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: '#141414' }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: '#FFFFFF' }}>{p.title}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{formatCurrency(p.totalAmount)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Dialogs */}
        {deal && <EditDealDialog deal={deal} stages={stages} contacts={contacts} open={activeDialog === 'edit'} onOpenChange={v => setActiveDialog(v ? 'edit' : null)} />}
        <CreateTaskFromDealDialog dealId={dealId} contactId={deal.contact?.id || null} open={activeDialog === 'task'} onOpenChange={v => setActiveDialog(v ? 'task' : null)} />
        <CreateProposalFromDealDialog dealId={dealId} dealTitle={deal.title} contactId={deal.contact?.id || null} open={activeDialog === 'proposal'} onOpenChange={v => setActiveDialog(v ? 'proposal' : null)} />
        <LogActivityDialog dealId={dealId} open={activeDialog === 'activity'} onOpenChange={v => setActiveDialog(v ? 'activity' : null)} />
      </motion.div>
    </>
  )
}

// ──────────────────────────── Main Pipeline Page ────────────────────────────
export default function PipelinePage() {
  const queryClient = useQueryClient()
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newDeal, setNewDeal] = useState({
    title: '',
    value: '',
    stageId: '',
    contactId: '',
    probability: '50',
    description: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => fetch('/api/crm/pipeline').then((r) => r.json()),
    refetchInterval: 5000,
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-mini'],
    queryFn: () => fetch('/api/crm/contacts?limit=100').then((r) => r.json()),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const res = await fetch('/api/crm/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, stageId }),
      })
      if (!res.ok) throw new Error('Failed to move deal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
    onError: () => toast.error('Failed to move deal'),
  })

  const createDealMutation = useMutation({
    mutationFn: async (deal: Record<string, string>) => {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deal,
          value: parseFloat(deal.value) || 0,
          probability: parseInt(deal.probability) || 50,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create deal')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      setDialogOpen(false)
      setNewDeal({ title: '', value: '', stageId: '', contactId: '', probability: '50', description: '' })
      toast.success('Deal created')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleDragStart = (event: DragStartEvent) => {
    const allDeals = data?.stages?.flatMap((s: Stage) => s.deals) || []
    const deal = allDeals.find((d: Deal) => d.id === event.active.id)
    setActiveDeal(deal || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return

    const allStages = data?.stages || []
    const allDeals = allStages.flatMap((s: Stage) => s.deals)
    const draggedDeal = allDeals.find((d: Deal) => d.id === active.id)
    if (!draggedDeal) return

    let targetStageId = draggedDeal.stageId
    for (const stage of allStages) {
      if (stage.deals.some((d: Deal) => d.id === over.id)) {
        targetStageId = stage.id
        break
      }
      if (stage.id === over.id) {
        targetStageId = stage.id
        break
      }
    }

    if (targetStageId !== draggedDeal.stageId) {
      updateStageMutation.mutate({ dealId: draggedDeal.id, stageId: targetStageId })
    }
  }

  const stages: Stage[] = data?.stages || []
  const contacts = contactsData?.contacts || []

  return (
    <div className="p-6 lg:p-8 space-y-6 h-full flex flex-col" style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0"
      >
        <div>
          <h1 style={{ color: '#FFFFFF' }} className="text-2xl font-bold">Pipeline</h1>
          <p style={{ color: '#A0A0A0' }} className="text-sm mt-1">
            Drag and drop deals between stages
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium">
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Deal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value (€)</Label>
                  <Input
                    type="number"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Probability (%)</Label>
                  <Input
                    type="number"
                    value={newDeal.probability}
                    onChange={(e) => setNewDeal({ ...newDeal, probability: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stage *</Label>
                <Select
                  value={newDeal.stageId}
                  onValueChange={(v) => setNewDeal({ ...newDeal, stageId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage: Stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={newDeal.contactId}
                  onValueChange={(v) => setNewDeal({ ...newDeal, contactId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c: Record<string, unknown>) => (
                      <SelectItem key={c.id as string} value={c.id as string}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newDeal.description}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                />
              </div>
              <Button
                onClick={() => {
                  if (!newDeal.title || !newDeal.stageId) {
                    toast.error('Title and stage are required')
                    return
                  }
                  createDealMutation.mutate(newDeal)
                }}
                disabled={createDealMutation.isPending}
                className="w-full bg-[#374151] hover:bg-[#1F2937] text-white"
              >
                {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl animate-pulse h-96" style={{ backgroundColor: '#1A1A1A' }} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {stages.map((stage: Stage, index: number) => (
              <motion.div
                key={stage.id}
                id={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col rounded-xl min-h-[200px]"
                style={{ backgroundColor: '#141414' }}
              >
                {/* Stage Header */}
                <div
                  className="px-3 py-2.5 rounded-t-xl"
                  style={{ backgroundColor: stage.color + '15' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#A0A0A0' }}>
                        {stage.name}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {stage.deals.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {formatCurrency(stage.deals.reduce((sum: number, d: Deal) => sum + d.value, 0))}
                  </p>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                  <SortableContext
                    items={stage.deals.map((d: Deal) => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stage.deals.map((deal: Deal) => (
                      <SortableDealCard
                        key={deal.id}
                        deal={deal}
                        onClick={() => setSelectedDealId(deal.id)}
                      />
                    ))}
                  </SortableContext>
                  {stage.deals.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                      No deals
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Deal Detail Panel */}
      <AnimatePresence>
        {selectedDealId && (
          <DealDetailPanel
            key={selectedDealId}
            dealId={selectedDealId}
            stages={stages}
            contacts={contacts.map((c: Record<string, unknown>) => ({
              id: c.id as string,
              firstName: c.firstName as string,
              lastName: c.lastName as string,
            }))}
            onClose={() => setSelectedDealId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
