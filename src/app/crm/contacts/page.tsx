'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, ChevronLeft, ChevronRight, Filter,
  Mail, Phone, Building2, Users, X, Calendar, Clock,
  Video, MapPin, Linkedin, BookOpen, StickyNote, PhoneCall,
  FileText, CheckSquare, DollarSign, ExternalLink, Globe,
  Briefcase, UserPlus, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { PriorityBadge } from '@/components/crm/PriorityBadge'
import { ActivityIcon } from '@/components/crm/ActivityIcon'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ──────────────────────────── Types ────────────────────────────
interface ContactRow {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  jobTitle: string | null
  linkedin: string | null
  source: string
  status: string
  address: string | null
  city: string | null
  country: string | null
  avatar: string | null
  lastContactAt: string | null
  createdAt: string
  company: { id: string; name: string } | null
  tags: { tag: { id: string; name: string; color: string } }[]
  _count?: { deals: number }
}

interface ContactDetail extends ContactRow {
  description: string | null
  deals: Array<{
    id: string; title: string; value: number; probability: number; closeDate: string | null
    stage: { id: string; name: string; color: string }
    assignee: { id: string; name: string; avatar: string | null } | null
  }>
  activities: Array<{
    id: string; type: string; subject: string; description: string | null
    duration: number | null; status: string | null; createdAt: string
    user: { id: string; name: string; avatar: string | null } | null
    deal: { id: string; title: string } | null
  }>
  tasks: Array<{
    id: string; title: string; priority: string; status: string; dueDate: string | null
    assignee: { id: string; name: string; avatar: string | null } | null
    deal: { id: string; title: string } | null
  }>
  notes: Array<{
    id: string; content: string; createdAt: string
    user: { id: string; name: string; avatar: string | null } | null
  }>
}

interface CompanyRow {
  id: string
  name: string
  website: string | null
  industry: string | null
  employees: number | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  description: string | null
  createdAt: string
  _count: { contacts: number; deals: number }
}

// ──────────────────────────── Helpers ────────────────────────────
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'customer', label: 'Customer' },
  { value: 'churned', label: 'Churned' },
  { value: 'inactive', label: 'Inactive' },
]

const sourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'cold', label: 'Cold Outreach' },
  { value: 'event', label: 'Event' },
]

const meetingTypes = [
  { value: 'call', label: 'Call', placeholder: 'Phone number or link' },
  { value: 'video', label: 'Video', placeholder: 'Zoom, Google Meet, Teams link' },
  { value: 'in_person', label: 'In-Person', placeholder: 'Address or location' },
]

const callOutcomes = [
  { value: 'connected', label: 'Connected' },
  { value: 'left_voicemail', label: 'Left Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'scheduled_callback', label: 'Scheduled Callback' },
]

// ──────────────────────────── Add Note Dialog ────────────────────────────
function AddNoteDialog({ contactId, open, onOpenChange }: { contactId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const mutation = useMutation({
    mutationFn: async (body: { content: string; contactId: string }) => {
      const res = await fetch('/api/crm/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact-detail'] }); setContent(''); onOpenChange(false); toast.success('Note added') },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your note..." rows={4} />
          <Button onClick={() => { if (!content.trim()) { toast.error('Note content is required'); return } mutation.mutate({ content, contactId }) }} disabled={mutation.isPending} className="bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Log Call Dialog ────────────────────────────
function LogCallDialog({ contact, contactEmail, open, onOpenChange }: { contact: { firstName: string; lastName: string; id: string }; contactEmail: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [outcome, setOutcome] = useState('connected')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('5')
  const mutation = useMutation({
    mutationFn: async (body: Record<string, string | number>) => {
      const res = await fetch('/api/crm/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to log call')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact-detail'] }); queryClient.invalidateQueries({ queryKey: ['contacts'] }); setNotes(''); setDuration('5'); setOutcome('connected'); onOpenChange(false); toast.success('Call logged') },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Log Call</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div style={{ color: '#A0A0A0' }} className="text-sm">Contact: <span style={{ color: '#FFFFFF' }} className="font-medium">{contact.firstName} {contact.lastName}</span></div>
          <div className="space-y-2">
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {callOutcomes.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="5" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Call notes..." rows={3} />
          </div>
          <Button onClick={() => mutation.mutate({ contactId: contact.id, outcome, duration: parseInt(duration) || 0, notes })} disabled={mutation.isPending} className="bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Logging...' : 'Log Call'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Send Email Dialog ────────────────────────────
function SendEmailDialog({ contact, contactEmail, open, onOpenChange }: { contact: { firstName: string; lastName: string; id: string }; contactEmail: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [to, setTo] = useState('')
  const handleOpenChange = useCallback((v: boolean) => {
    if (v) setTo(contactEmail || '')
    onOpenChange(v)
  }, [contactEmail, onOpenChange])
  const mutation = useMutation({
    mutationFn: async (data: { to: string; subject: string; body: string; contactId: string }) => {
      const res = await fetch('/api/crm/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Failed to send email')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact-detail'] }); queryClient.invalidateQueries({ queryKey: ['contacts'] }); setSubject(''); setBody(''); onOpenChange(false); toast.success('Email sent') },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Send Email</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>To</Label>
            <Input value={to} onChange={e => setTo(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your email..." rows={6} />
          </div>
          <Button onClick={() => { if (!to || !subject || !body) { toast.error('All fields are required'); return } mutation.mutate({ to, subject, body, contactId: contact.id }) }} disabled={mutation.isPending} className="bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Create Task Dialog ────────────────────────────
function CreateTaskDialog({ contact, dealOptions, open, onOpenChange }: { contact: { firstName: string; lastName: string; id: string }; dealOptions: Array<{ id: string; title: string }>; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [dealId, setDealId] = useState('')
  const mutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch('/api/crm/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact-detail'] }); resetForm(); onOpenChange(false); toast.success('Task created') },
    onError: (e: Error) => toast.error(e.message),
  })
  const resetForm = () => { setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setDealId('') }
  useEffect(() => { if (open) resetForm() }, [open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Task description..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          {dealOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Linked Deal</Label>
              <Select value={dealId} onValueChange={v => setDealId(v)}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {dealOptions.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={() => { if (!title) { toast.error('Title is required'); return } mutation.mutate({ title, description, priority, dueDate: dueDate || undefined, contactId: contact.id, dealId: dealId || undefined }) }} disabled={mutation.isPending} className="bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Book Meeting Dialog ────────────────────────────
function BookMeetingDialog({ contact, dealOptions, open, onOpenChange }: { contact: { firstName: string; lastName: string; id: string }; dealOptions: Array<{ id: string; title: string }>; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState('call')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState('30')
  const [createFollowUp, setCreateFollowUp] = useState(false)
  const [dealId, setDealId] = useState('')
  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to create meeting')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact-detail'] }); resetForm(); onOpenChange(false); toast.success('Meeting booked') },
    onError: (e: Error) => toast.error(e.message),
  })
  const defaultTitle = `Meeting with ${contact.firstName} ${contact.lastName}`
  const resetForm = () => { setTitle(defaultTitle); setDate(''); setTime(''); setType('call'); setLocation(''); setDuration('30'); setCreateFollowUp(false); setDealId('') }
  const handleOpenChange = (v: boolean) => { if (v) resetForm(); onOpenChange(v) }
  const typePlaceholder = meetingTypes.find(t => t.value === type)?.placeholder || 'Location'
  const handleSave = () => {
    if (!title || !date || !time) { toast.error('Title, date, and time are required'); return }
    const startDateTime = new Date(`${date}T${time}`)
    const endDateTime = new Date(startDateTime.getTime() + (parseInt(duration) || 30) * 60 * 1000)
    mutation.mutate({
      title, date: startDateTime.toISOString(), endDate: endDateTime.toISOString(),
      meetingType: type, location: location || null, createFollowUpTask: createFollowUp,
      contactId: contact.id, dealId: dealId || null,
    })
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Book Meeting</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meetingTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder={typePlaceholder} />
          </div>
          {dealOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Linked Deal</Label>
              <Select value={dealId} onValueChange={v => setDealId(v)}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {dealOptions.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="followup" checked={createFollowUp} onChange={e => setCreateFollowUp(e.target.checked)} className="rounded border-gray-600" />
            <Label htmlFor="followup" className="text-sm">Create Follow-up Task</Label>
          </div>
          <Button onClick={handleSave} disabled={mutation.isPending} className="bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Booking...' : 'Book Meeting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Create Proposal Dialog ────────────────────────────
interface LineItem { name: string; quantity: number; unitPrice: number; total: number }

function CreateProposalDialog({ contact, dealOptions, open, onOpenChange }: { contact: { firstName: string; lastName: string; id: string }; dealOptions: Array<{ id: string; title: string }>; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [dealId, setDealId] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ name: '', quantity: 1, unitPrice: 0, total: 0 }])
  const [templateId, setTemplateId] = useState('')
  const { data: templatesData } = useQuery({ queryKey: ['proposal-templates'], queryFn: () => fetch('/api/crm/proposals/templates').then(r => r.json()), enabled: open })
  const defaultTitle = `Proposal for ${contact.firstName} ${contact.lastName}`
  const resetForm = () => { setTitle(defaultTitle); setDealId(''); setLineItems([{ name: '', quantity: 1, unitPrice: 0, total: 0 }]); setTemplateId('') }

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact-detail'] }); resetForm(); onOpenChange(false); toast.success('Proposal created') },
    onError: (e: Error) => toast.error(e.message),
  })
  const handleOpenChange = (v: boolean) => { if (v) resetForm(); onOpenChange(v) }
  const handleSave = (status: string) => {
    if (!title) { toast.error('Title is required'); return }
    mutation.mutate({
      title, contactId: contact.id, dealId: dealId || null, templateId: templateId || null,
      lineItems: lineItems.map((li, i) => ({ ...li, sortOrder: i })),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}),
    })
  }

  const totalAmount = lineItems.reduce((sum, li) => sum + li.total, 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Proposal</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Proposal title" />
          </div>
          {dealOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Linked Deal</Label>
              <Select value={dealId} onValueChange={v => setDealId(v)}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {dealOptions.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {templatesData?.templates?.length > 0 && (
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={v => setTemplateId(v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {templatesData.templates.map((t: { id: string; name: string }) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button variant="ghost" size="sm" onClick={addLineItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </div>
            <div className="space-y-2">
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_80px_28px] gap-2 items-end">
                  <Input value={li.name} onChange={e => updateLineItem(i, 'name', e.target.value)} placeholder="Item name" className="h-9 text-sm" />
                  <Input type="number" value={li.quantity} onChange={e => updateLineItem(i, 'quantity', parseInt(e.target.value) || 0)} className="h-9 text-sm" min={1} />
                  <Input type="number" value={li.unitPrice} onChange={e => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                  <span style={{ color: '#A0A0A0' }} className="text-sm font-medium pb-2 text-right">{formatCurrency(li.total)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" style={{ color: '#666666' }} onClick={() => removeLineItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid #2A2A2A' }}>
              <span style={{ color: '#FFFFFF' }} className="text-sm font-bold">Total: {formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={mutation.isPending} className="flex-1">Save Draft</Button>
            <Button onClick={() => handleSave('sent')} disabled={mutation.isPending} className="flex-1 bg-[#374151] hover:bg-[#1F2937] text-white">
              {mutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Contact Detail Panel ────────────────────────────
function ContactDetailPanel({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['contact-detail', contactId],
    queryFn: () => fetch(`/api/crm/contacts/${contactId}`).then(r => r.json()),
    enabled: !!contactId,
  })

  const contact: ContactDetail | null = data?.contact || null

  const closeDialog = useCallback(() => setActiveDialog(null), [])

  if (isLoading) {
    return (
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full md:w-[480px] shadow-xl z-50 flex items-center justify-center" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="animate-pulse" style={{ color: '#666666' }}>Loading...</div>
      </motion.div>
    )
  }

  if (!contact) return null

  const dealOptions = contact.deals.map(d => ({ id: d.id, title: d.title }))

  const quickActions = [
    { key: 'meeting', icon: Calendar, label: 'Book Meeting' },
    { key: 'task', icon: CheckSquare, label: 'Create Task' },
    { key: 'proposal', icon: FileText, label: 'Create Proposal' },
    { key: 'email', icon: Mail, label: 'Send Email' },
    { key: 'note', icon: StickyNote, label: 'Add Note' },
    { key: 'call', icon: PhoneCall, label: 'Log Call' },
  ]

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40 md:block hidden" onClick={onClose} />

      {/* Panel */}
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full md:w-[480px] shadow-xl z-50 flex flex-col" style={{ backgroundColor: '#1A1A1A' }}>
        {/* Header */}
        <div className="p-5 shrink-0" style={{ borderBottom: '1px solid #2A2A2A' }}>
          <div className="flex items-start justify-between mb-4">
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="h-5 w-5" style={{ color: '#A0A0A0' }} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#F3D840]/20 flex items-center justify-center shrink-0">
              <span className="text-[#374151] text-sm font-bold">{contact.firstName[0]}{contact.lastName[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 style={{ color: '#FFFFFF' }} className="text-lg font-bold truncate">{contact.firstName} {contact.lastName}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {contact.jobTitle && <span style={{ color: '#A0A0A0' }} className="text-xs">{contact.jobTitle}</span>}
                {contact.company && <span style={{ color: '#666666' }} className="text-xs">at {contact.company.name}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={contact.status} />
              <Badge variant="secondary" className="text-[10px] capitalize">{contact.source}</Badge>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Contact Info */}
          <div className="p-5 space-y-3" style={{ borderBottom: '1px solid #2A2A2A' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666666' }}>Contact Info</h3>
            {contact.email && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1E3A5F' }}><Mail className="h-4 w-4 text-blue-400" /></div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: '#FFFFFF' }} className="text-sm truncate">{contact.email}</p>
                  <p style={{ color: '#666666' }} className="text-[10px]">Email</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#374151] hover:bg-[#F3D840]/10" onClick={() => setActiveDialog('email')}>
                  <Mail className="h-3 w-3 mr-1" /> Send
                </Button>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1A3D2A' }}><Phone className="h-4 w-4 text-green-400" /></div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: '#FFFFFF' }} className="text-sm truncate">{contact.phone}</p>
                  <p style={{ color: '#666666' }} className="text-[10px]">Phone</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#374151] hover:bg-[#F3D840]/10" onClick={() => setActiveDialog('call')}>
                  <Phone className="h-3 w-3 mr-1" /> Call
                </Button>
              </div>
            )}
            {contact.linkedin && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2D1B4E' }}><Linkedin className="h-4 w-4 text-purple-400" /></div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: '#FFFFFF' }} className="text-sm truncate">{contact.linkedin}</p>
                  <p style={{ color: '#666666' }} className="text-[10px]">LinkedIn</p>
                </div>
              </div>
            )}
            {(contact.city || contact.address) && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3D2A1A' }}><MapPin className="h-4 w-4 text-orange-400" /></div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: '#FFFFFF' }} className="text-sm truncate">{[contact.address, contact.city, contact.country].filter(Boolean).join(', ')}</p>
                  <p style={{ color: '#666666' }} className="text-[10px]">Address</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666666' }}>Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map(action => (
                <button key={action.key} onClick={() => setActiveDialog(action.key)} className="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all" style={{ border: '1px solid #2A2A2A', backgroundColor: 'transparent' }}>
                  <action.icon className="h-5 w-5 text-[#374151]" />
                  <span className="text-[11px] font-medium text-center leading-tight" style={{ color: '#A0A0A0' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Related Deals */}
          {contact.deals.length > 0 && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666666' }}>Related Deals ({contact.deals.length})</h3>
              <div className="space-y-2">
                {contact.deals.slice(0, 5).map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div className="min-w-0 flex-1">
                      <p style={{ color: '#FFFFFF' }} className="text-sm font-medium truncate">{deal.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: deal.stage.color, color: deal.stage.color }}>{deal.stage.name}</Badge>
                        <span style={{ color: '#666666' }} className="text-[10px]">{deal.probability}%</span>
                      </div>
                    </div>
                    <span style={{ color: '#FFFFFF' }} className="text-sm font-bold ml-2">{formatCurrency(deal.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          {contact.tasks.length > 0 && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666666' }}>Tasks ({contact.tasks.length})</h3>
              <div className="space-y-2">
                {contact.tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <PriorityBadge priority={task.priority} />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#FFFFFF' }} className="text-sm truncate">{task.title}</p>
                      {task.dueDate && <p style={{ color: '#666666' }} className="text-[10px]">{format(new Date(task.dueDate), 'MMM d, yyyy')}</p>}
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activities */}
          {contact.activities.length > 0 && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666666' }}>Recent Activities</h3>
              <div className="space-y-3">
                {contact.activities.slice(0, 8).map(activity => (
                  <div key={activity.id} className="flex gap-3">
                    <ActivityIcon type={activity.type} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#FFFFFF' }} className="text-sm">{activity.subject}</p>
                      {activity.description && <p style={{ color: '#A0A0A0' }} className="text-xs mt-0.5 line-clamp-2">{activity.description}</p>}
                      <p style={{ color: '#666666' }} className="text-[10px] mt-0.5">{format(new Date(activity.createdAt), 'MMM d, yyyy \'at\' h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes.length > 0 && (
            <div className="p-5" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666666' }}>Notes ({contact.notes.length})</h3>
              <div className="space-y-2">
                {contact.notes.slice(0, 5).map(note => (
                  <div key={note.id} className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ color: '#A0A0A0' }} className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      {note.user && <span style={{ color: '#666666' }} className="text-[10px]">{note.user.name}</span>}
                      <span style={{ color: '#666666' }} className="text-[10px]">{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposals */}
          {contact.proposals && (contact.proposals as unknown[]).length > 0 && (
            <div className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666666' }}>Proposals</h3>
              <div className="space-y-2">
                {(contact.proposals as Array<Record<string, unknown>>).map((p: Record<string, unknown>) => (
                  <div key={p.id as string} className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div className="min-w-0 flex-1">
                      <p style={{ color: '#FFFFFF' }} className="text-sm font-medium truncate">{p.title as string}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span style={{ color: '#FFFFFF' }} className="text-sm font-bold">{formatCurrency(p.totalAmount as number)}</span>
                      <StatusBadge status={p.status as string} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Dialogs */}
        <AddNoteDialog contactId={contactId} open={activeDialog === 'note'} onOpenChange={v => { setActiveDialog(v ? 'note' : null) }} />
        <LogCallDialog contact={contact} contactEmail={contact.email} open={activeDialog === 'call'} onOpenChange={v => { setActiveDialog(v ? 'call' : null) }} />
        <SendEmailDialog contact={contact} contactEmail={contact.email} open={activeDialog === 'email'} onOpenChange={v => { setActiveDialog(v ? 'email' : null) }} />
        <CreateTaskDialog contact={contact} dealOptions={dealOptions} open={activeDialog === 'task'} onOpenChange={v => { setActiveDialog(v ? 'task' : null) }} />
        <BookMeetingDialog contact={contact} dealOptions={dealOptions} open={activeDialog === 'meeting'} onOpenChange={v => { setActiveDialog(v ? 'meeting' : null) }} />
        <CreateProposalDialog contact={contact} dealOptions={dealOptions} open={activeDialog === 'proposal'} onOpenChange={v => { setActiveDialog(v ? 'proposal' : null) }} />
      </motion.div>
    </>
  )
}

// ──────────────────────────── Create Contact Dialog ────────────────────────────
function CreateContactDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', source: 'website', status: 'lead' })
  const mutation = useMutation({
    mutationFn: async (contact: Record<string, string>) => {
      const res = await fetch('/api/crm/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contact) })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setForm({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', source: 'website', status: 'lead' }); onOpenChange(false); toast.success('Contact created') },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2"><Label>Job Title</Label><Input value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Source</Label><Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sourceOptions.filter(s => s.value).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.filter(s => s.value).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <Button onClick={() => { if (!form.firstName || !form.lastName) { toast.error('First name and last name are required'); return } mutation.mutate(form) }} disabled={mutation.isPending} className="w-full bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Creating...' : 'Create Contact'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Create Company Dialog ────────────────────────────
function CreateCompanyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', website: '', industry: '', city: '', country: '', phone: '', description: '' })
  const mutation = useMutation({
    mutationFn: async (company: Record<string, string>) => {
      const res = await fetch('/api/crm/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(company) })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); setForm({ name: '', website: '', industry: '', city: '', country: '', phone: '', description: '' }); onOpenChange(false); toast.success('Company created') },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Company</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2"><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
            <div className="space-y-2"><Label>Industry</Label><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <Button onClick={() => { if (!form.name) { toast.error('Company name is required'); return } mutation.mutate(form) }} disabled={mutation.isPending} className="w-full bg-[#374151] hover:bg-[#1F2937] text-white">
            {mutation.isPending ? 'Creating...' : 'Create Company'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Contacts View ────────────────────────────
function ContactsView({ onContactClick, companyFilter }: { onContactClick: (id: string) => void; companyFilter: string | null }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const queryUrl = `/api/crm/contacts?search=${encodeURIComponent(search)}&status=${statusFilter}&source=${sourceFilter}&page=${page}&limit=15`

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search, statusFilter, sourceFilter, page],
    queryFn: () => {
      const url = new URL(queryUrl, window.location.origin)
      if (companyFilter) url.searchParams.set('companyId', companyFilter)
      return fetch(url.toString()).then(r => r.json())
    },
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search contacts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
        </div>
        <Select value={statusFilter || '__all__'} onValueChange={v => { setStatusFilter(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>{statusOptions.map(o => <SelectItem key={o.value || '__all__'} value={o.value || '__all__'}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sourceFilter || '__all__'} onValueChange={v => { setSourceFilter(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Sources" /></SelectTrigger>
          <SelectContent>{sourceOptions.map(o => <SelectItem key={o.value || '__all__'} value={o.value || '__all__'}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <CreateContactDialog open={createOpen} onOpenChange={setCreateOpen} />
        <Button className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />New Contact
        </Button>
      </div>

      {companyFilter && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[#F3D840]/10 text-[#374151] border-[#F3D840]/30">
            <Building2 className="h-3 w-3 mr-1" />Filtered by company
          </Badge>
        </div>
      )}

      {/* Table */}
      <Card style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3">Name</th>
                <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3 hidden md:table-cell">Email</th>
                <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Company</th>
                <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3">Status</th>
                <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Source</th>
                <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3 hidden xl:table-cell">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222222' }}>
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: '#222222' }} /></td>
                    <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-40 rounded animate-pulse" style={{ backgroundColor: '#222222' }} /></td>
                    <td className="px-6 py-4 hidden lg:table-cell"><div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: '#222222' }} /></td>
                    <td className="px-6 py-4"><div className="h-5 w-16 rounded animate-pulse" style={{ backgroundColor: '#222222' }} /></td>
                  </tr>
                ))
              ) : data?.contacts?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: '#666666' }}>No contacts found</td></tr>
              ) : (
                data?.contacts?.map((contact: ContactRow) => (
                  <tr key={contact.id} className="hover:bg-white/5 cursor-pointer transition-colors" style={{ borderBottom: '1px solid #222222' }} onClick={() => onContactClick(contact.id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#F3D840]/20 flex items-center justify-center shrink-0">
                          <span className="text-[#374151] text-xs font-bold">{contact.firstName[0]}{contact.lastName[0]}</span>
                        </div>
                        <div>
                          <p style={{ color: '#FFFFFF' }} className="text-sm font-medium">{contact.firstName} {contact.lastName}</p>
                          {contact.jobTitle && <p style={{ color: '#666666' }} className="text-xs">{contact.jobTitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell"><span style={{ color: '#A0A0A0' }} className="text-sm">{contact.email || '—'}</span></td>
                    <td className="px-6 py-4 hidden lg:table-cell"><span style={{ color: '#A0A0A0' }} className="text-sm">{contact.company?.name || '—'}</span></td>
                    <td className="px-6 py-4"><StatusBadge status={contact.status} /></td>
                    <td className="px-6 py-4 hidden lg:table-cell"><Badge variant="secondary" className="capitalize text-xs">{contact.source}</Badge></td>
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <span style={{ color: '#666666' }} className="text-sm">{contact.lastContactAt ? format(new Date(contact.lastContactAt), 'MMM d, yyyy') : 'Never'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #2A2A2A' }}>
            <p style={{ color: '#A0A0A0' }} className="text-sm">Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, data.pagination.total)} of {data.pagination.total}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span style={{ color: '#A0A0A0' }} className="text-sm">Page {page} of {data.pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

// ──────────────────────────── Companies View ────────────────────────────
function CompaniesView({ onCompanyClick }: { onCompanyClick: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search, page],
    queryFn: () => fetch(`/api/crm/companies?search=${encodeURIComponent(search)}&page=${page}&limit=20`).then(r => r.json()),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search companies..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
        </div>
        <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />
        <Button className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />New Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => <Card key={i} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm"><CardContent className="p-5"><div className="animate-pulse space-y-3"><div className="h-5 w-32 rounded" style={{ backgroundColor: '#222222' }} /><div className="h-4 w-24 rounded" style={{ backgroundColor: '#222222' }} /><div className="h-4 w-40 rounded" style={{ backgroundColor: '#222222' }} /></div></CardContent></Card>)
        ) : data?.companies?.length === 0 ? (
          <div className="col-span-full py-12 text-center" style={{ color: '#666666' }}>No companies found</div>
        ) : (
          data?.companies?.map((company: CompanyRow) => (
            <Card key={company.id} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onCompanyClick(company.id)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-[#374151]/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-[#374151]" />
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-[#F3D840] transition-colors" />
                </div>
                <h3 style={{ color: '#FFFFFF' }} className="text-sm font-bold mb-1 truncate">{company.name}</h3>
                {company.industry && <p style={{ color: '#A0A0A0' }} className="text-xs mb-2">{company.industry}</p>}
                <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#666666' }}>
                  {(company.city || company.country) && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[company.city, company.country].filter(Boolean).join(', ')}</span>
                  )}
                  {company.website && (
                    <span className="flex items-center gap-1 truncate"><Globe className="h-3 w-3" />{company.website.replace(/https?:\/\//, '')}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid #2A2A2A' }}>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" style={{ color: '#666666' }} />
                    <span style={{ color: '#A0A0A0' }} className="text-xs font-medium">{company._count.contacts} contacts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" style={{ color: '#666666' }} />
                    <span style={{ color: '#A0A0A0' }} className="text-xs font-medium">{company._count.deals} deals</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span style={{ color: '#A0A0A0' }} className="text-sm">Page {page} of {data.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────── Main People Page ────────────────────────────
export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState('contacts')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [companyFilter, setCompanyFilter] = useState<string | null>(null)

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }} className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#FFFFFF' }} className="text-2xl font-bold">People</h1>
          <p style={{ color: '#A0A0A0' }} className="text-sm mt-1">Manage contacts and companies</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setCompanyFilter(null) }}>
        <TabsList className="bg-[#1A1A1A] p-1" style={{ border: '1px solid #2A2A2A' }}>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />Contacts
          </TabsTrigger>
          <TabsTrigger value="companies" className="data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4 mr-2" />Companies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4">
          <ContactsView onContactClick={setSelectedContactId} companyFilter={companyFilter} />
        </TabsContent>
        <TabsContent value="companies" className="mt-4">
          <CompaniesView onCompanyClick={(id) => { setCompanyFilter(id); setActiveTab('contacts') }} />
        </TabsContent>
      </Tabs>

      {/* Contact Detail Panel */}
      <AnimatePresence>
        {selectedContactId && (
          <ContactDetailPanel
            key={selectedContactId}
            contactId={selectedContactId}
            onClose={() => { setSelectedContactId(null); setCompanyFilter(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
