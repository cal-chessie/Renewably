'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, ChevronLeft, ChevronRight,
  Building2, Globe, MapPin, Phone, Edit3, X,
  Users, FileText, Receipt, Clock, StickyNote,
  ExternalLink, Mail, DollarSign, Calendar,
  TrendingUp, Download, Upload, Trash2, MoreVertical,
  Tag, Briefcase, UserPlus, FilePlus, Sparkles, Filter,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatCurrency, timeAgo } from '@/lib/format'
import { format } from 'date-fns'

// ══════════════════════════════════════════════════════════════
//  DESIGN SYSTEM
// ══════════════════════════════════════════════════════════════
const C = {
  dark: '#0A0A0A',
  surface: '#1A1A1A',
  deeper: '#141414',
  border: '#2A2A2A',
  yellow: '#F3D840',
  yellowDim: 'rgba(243,216,64,0.08)',
  muted: '#A0A0A0',
  faint: '#666666',
  white: '#FFFFFF',
  success: '#22c55e',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
}

// ══════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════
type CompanyType = 'lead' | 'customer' | 'partner' | 'supplier'

interface CompanyRow {
  id: string
  name: string
  website: string | null
  industry: string | null
  companyType: string
  employees: number | null
  address: string | null
  city: string | null
  county: string | null
  country: string | null
  phone: string | null
  description: string | null
  annualRevenue: number | null
  createdAt: string
  _count: { contacts: number; deals: number; proposals: number; invoices: number }
  deals: Array<{ value: number; id: string }>
  activities: Array<{ createdAt: string }>
}

interface CompanyDetail extends Omit<CompanyRow, 'deals' | 'activities' | '_count'> {
  contacts: Array<{
    id: string; firstName: string; lastName: string; email: string | null
    phone: string | null; jobTitle: string | null; status: string
  }>
  deals: Array<{
    id: string; title: string; value: number; probability: number
    closeDate: string | null
    stage: { id: string; name: string; color: string }
    contact: { id: string; firstName: string; lastName: string } | null
    assignee: { id: string; name: string } | null
  }>
  _count: { contacts: number; deals: number; proposals: number; invoices: number }
}

interface ProposalRow {
  id: string; title: string; status: string; totalAmount: number
  validUntil: string | null; createdAt: string; updatedAt: string
  contact: { id: string; firstName: string; lastName: string } | null
  deal: { id: string; title: string } | null
}

interface InvoiceRow {
  id: string; invoiceNumber: string; status: string; totalAmount: number
  dueDate: string | null; paidAt: string | null; createdAt: string
  contact: { id: string; firstName: string; lastName: string } | null
  deal: { id: string; title: string } | null
  proposal: { id: string; title: string } | null
}

interface ActivityRow {
  id: string; type: string; subject: string; description: string | null
  duration: number | null; status: string | null; createdAt: string
  user: { id: string; name: string; avatar: string | null } | null
  contact: { id: string; firstName: string; lastName: string } | null
}

interface NoteRow {
  id: string; content: string; createdAt: string
  user: { id: string; name: string; avatar: string | null } | null
}

// ══════════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ══════════════════════════════════════════════════════════════
const COMPANY_TYPES: { value: CompanyType; label: string; colour: string; bg: string }[] = [
  { value: 'lead', label: 'Lead', colour: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'customer', label: 'Customer', colour: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { value: 'partner', label: 'Partner', colour: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { value: 'supplier', label: 'Supplier', colour: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
]

const INDUSTRIES = [
  'Solar PV', 'Construction', 'Electrical', 'Real Estate', 'Hospitality',
  'Agriculture', 'Manufacturing', 'Retail', 'Technology', 'Finance',
  'Government', 'Education', 'Healthcare', 'Other',
]

function getCompanyTypeConfig(type: string) {
  return COMPANY_TYPES.find(t => t.value === type) || COMPANY_TYPES[0]
}

const emptyCompanyForm = {
  name: '', website: '', industry: '', companyType: 'lead' as CompanyType,
  city: '', county: '', country: '', phone: '', description: '',
  address: '', employees: '', annualRevenue: '',
}

function statusBadgeColour(status: string): string {
  const map: Record<string, string> = {
    draft: '#6b7280', sent: '#3b82f6', viewed: '#8b5cf6',
    accepted: '#22c55e', rejected: '#ef4444', expired: '#f59e0b',
  }
  return map[status] || '#6b7280'
}

function invoiceStatusColour(status: string): string {
  const map: Record<string, string> = {
    draft: '#6b7280', sent: '#3b82f6', paid: '#22c55e',
    overdue: '#ef4444', cancelled: '#6b7280', partial: '#f59e0b',
  }
  return map[status] || '#6b7280'
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    call: Phone, email: Mail, meeting: Calendar,
    note: StickyNote, deal_update: TrendingUp,
  }
  const colours: Record<string, string> = {
    call: '#22c55e', email: '#3b82f6', meeting: '#a855f7',
    note: '#f59e0b', deal_update: '#F3D840',
  }
  const Icon = icons[type] || StickyNote
  const colour = colours[type] || C.faint
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '8px',
      backgroundColor: `${colour}15`, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      border: `1px solid ${colour}25`,
    }}>
      <Icon style={{ width: 15, height: 15, color: colour }} />
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 32, height: 32, border: '3px solid #2A2A2A',
      borderTopColor: C.yellow, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center py-12 gap-3">
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        backgroundColor: `${C.yellow}08`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 22, height: 22, color: C.faint }} />
      </div>
      <span style={{ fontSize: '14px', color: C.faint }}>{text}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  COMPANY TYPE BADGE
// ══════════════════════════════════════════════════════════════
function CompanyTypeBadge({ type, size = 'sm' }: { type: string; size?: 'sm' | 'md' }) {
  const cfg = getCompanyTypeConfig(type)
  const isMd = size === 'md'
  return (
    <span style={{
      fontSize: isMd ? '12px' : '11px',
      fontWeight: 600,
      textTransform: 'capitalize',
      padding: isMd ? '3px 12px' : '2px 8px',
      borderRadius: '20px',
      color: cfg.colour,
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.colour}25`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        backgroundColor: cfg.colour, display: 'inline-block',
      }} />
      {cfg.label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════
//  COMPANY FORM (shared between Create & Edit)
// ══════════════════════════════════════════════════════════════
function CompanyForm({
  form, setForm, onSubmit, submitLabel, isPending,
}: {
  form: typeof emptyCompanyForm
  setForm: (f: typeof emptyCompanyForm) => void
  onSubmit: () => void
  submitLabel: string
  isPending: boolean
}) {
  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label style={{ color: C.muted }}>Company Name *</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. SunPower Ireland Ltd" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label style={{ color: C.muted }}>Company Type</Label>
          <Select value={form.companyType} onValueChange={v => setForm({ ...form, companyType: v as CompanyType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMPANY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label style={{ color: C.muted }}>Industry</Label>
          <Select value={form.industry} onValueChange={v => setForm({ ...form, industry: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map(i => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label style={{ color: C.muted }}>Website</Label>
        <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="www.example.ie" />
      </div>

      <div className="space-y-2">
        <Label style={{ color: C.muted }}>Phone</Label>
        <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+353 1 234 5678" />
      </div>

      <div className="space-y-2">
        <Label style={{ color: C.muted }}>Address</Label>
        <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label style={{ color: C.muted }}>City</Label>
          <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Dublin" />
        </div>
        <div className="space-y-2">
          <Label style={{ color: C.muted }}>County</Label>
          <Input value={form.county} onChange={e => setForm({ ...form, county: e.target.value })} placeholder="Co. Dublin" />
        </div>
        <div className="space-y-2">
          <Label style={{ color: C.muted }}>Country</Label>
          <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Ireland" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label style={{ color: C.muted }}>Employees</Label>
          <Input type="number" value={form.employees} onChange={e => setForm({ ...form, employees: e.target.value })} placeholder="50" />
        </div>
        <div className="space-y-2">
          <Label style={{ color: C.muted }}>Annual Revenue (€)</Label>
          <Input type="number" value={form.annualRevenue} onChange={e => setForm({ ...form, annualRevenue: e.target.value })} placeholder="500000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label style={{ color: C.muted }}>Notes</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Internal notes about this company..." className="min-h-[80px]" />
      </div>

      <Button
        onClick={onSubmit}
        disabled={isPending}
        className="w-full bg-[#374151] hover:bg-[#1F2937] text-white"
      >
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  COMPANY DETAIL SLIDE-OVER
// ══════════════════════════════════════════════════════════════
function CompanyDetailSheet({
  companyId, open, onOpenChange,
}: {
  companyId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptyCompanyForm)
  const [noteContent, setNoteContent] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Fetch company detail
  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company-detail', companyId],
    queryFn: () => fetch(`/api/crm/companies/${companyId}`).then(r => r.json()),
    enabled: !!companyId,
  })

  // Fetch proposals
  const { data: proposalsData } = useQuery({
    queryKey: ['company-proposals', companyId],
    queryFn: () => fetch(`/api/crm/proposals?companyId=${companyId}&limit=50`).then(r => r.json()),
    enabled: !!companyId,
  })

  // Fetch invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['company-invoices', companyId],
    queryFn: () => fetch(`/api/crm/invoices?companyId=${companyId}&limit=50`).then(r => r.json()),
    enabled: !!companyId,
  })

  // Fetch activities
  const { data: activitiesData } = useQuery({
    queryKey: ['company-activities', companyId],
    queryFn: () => fetch(`/api/crm/activities?companyId=${companyId}&limit=20`).then(r => r.json()),
    enabled: !!companyId,
  })

  // Fetch notes
  const { data: notesData } = useQuery({
    queryKey: ['company-notes', companyId],
    queryFn: () => fetch(`/api/crm/notes?companyId=${companyId}`).then(r => r.json()),
    enabled: !!companyId,
  })

  const company = companyData?.company as CompanyDetail | undefined
  const proposals = (proposalsData?.proposals || []) as ProposalRow[]
  const invoices = (invoicesData?.invoices || []) as InvoiceRow[]
  const activities = (activitiesData?.activities || []) as ActivityRow[]
  const notes = (notesData?.notes || []) as NoteRow[]

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch(`/api/crm/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update company')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-detail', companyId] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setEditOpen(false)
      toast.success('Company updated successfully')
    },
    onError: () => toast.error('Failed to update company'),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/companies/${companyId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete company')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setDeleteOpen(false)
      onOpenChange(false)
      toast.success('Company deleted')
    },
    onError: () => toast.error('Failed to delete company'),
  })

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, companyId }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-notes', companyId] })
      setNoteContent('')
      toast.success('Note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const handleEditOpen = useCallback(() => {
    if (!company) return
    setEditForm({
      name: company.name || '',
      website: company.website || '',
      industry: company.industry || '',
      companyType: (company.companyType || 'lead') as CompanyType,
      city: company.city || '',
      county: company.county || '',
      country: company.country || '',
      phone: company.phone || '',
      description: company.description || '',
      address: company.address || '',
      employees: company.employees?.toString() || '',
      annualRevenue: company.annualRevenue?.toString() || '',
    })
    setEditOpen(true)
  }, [company])

  const totalDealValue = (company?.deals || []).reduce((s, d) => s + d.value, 0)
  const totalProposalValue = proposals.reduce((s, p) => s + p.totalAmount, 0)
  const outstandingInvoices = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((s, i) => s + i.totalAmount, 0)

  if (!companyId) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-2xl p-0 overflow-hidden"
          style={{ backgroundColor: C.surface, borderLeft: `1px solid ${C.border}` }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full" style={{ minHeight: 400 }}>
              <Spinner />
            </div>
          ) : !company ? (
            <div className="flex items-center justify-center h-full" style={{ minHeight: 400 }}>
              <p style={{ color: C.faint }}>Company not found</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="p-6 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div style={{
                      width: 52, height: 52, borderRadius: '14px',
                      backgroundColor: `${C.yellow}18`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      border: `1px solid ${C.yellow}30`,
                    }}>
                      <Building2 style={{ width: 24, height: 24, color: C.yellow }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SheetTitle style={{ color: C.white, fontSize: '20px', fontWeight: 700 }}>
                          {company.name}
                        </SheetTitle>
                        <CompanyTypeBadge type={company.companyType} size="md" />
                      </div>
                      <SheetDescription style={{ color: C.muted, opacity: 0.7 }}>
                        {company.industry || 'No industry specified'}
                        {company.employees ? ` · ${company.employees} employees` : ''}
                        {company.annualRevenue ? ` · €${(company.annualRevenue / 1000).toFixed(0)}k revenue` : ''}
                      </SheetDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" style={{ color: C.muted, flexShrink: 0 }}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                      <DropdownMenuItem onClick={handleEditOpen} style={{ color: C.muted }}>
                        <Edit3 className="h-4 w-4 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        onOpenChange(false)
                        setTimeout(() => router.push('/crm/contacts?action=new'), 300)
                      }} style={{ color: C.muted }}>
                        <UserPlus className="h-4 w-4 mr-2" /> New Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        onOpenChange(false)
                        setTimeout(() => router.push('/crm/pipeline?action=new'), 300)
                      }} style={{ color: C.muted }}>
                        <DollarSign className="h-4 w-4 mr-2" /> New Deal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        onOpenChange(false)
                        setTimeout(() => router.push('/crm/proposals?action=new'), 300)
                      }} style={{ color: C.muted }}>
                        <FilePlus className="h-4 w-4 mr-2" /> New Proposal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator style={{ backgroundColor: C.border }} />
                      <DropdownMenuItem onClick={() => setDeleteOpen(true)} style={{ color: C.danger }}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Company
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Quick info strip */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                  {(company.address || company.city || company.country) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin style={{ width: 13, height: 13, color: C.faint }} />
                      <span style={{ color: C.muted, fontSize: '13px' }}>
                        {[company.address, company.city, company.county, company.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone style={{ width: 13, height: 13, color: C.faint }} />
                      <span style={{ color: C.muted, fontSize: '13px' }}>{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe style={{ width: 13, height: 13, color: C.faint }} />
                      <span style={{ color: C.muted, fontSize: '13px' }}>{company.website}</span>
                    </div>
                  )}
                </div>

                {/* Quick actions strip */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { label: 'New Deal', icon: DollarSign, route: '/crm/pipeline?action=new', colour: C.success },
                    { label: 'New Contact', icon: UserPlus, route: '/crm/contacts?action=new', colour: C.info },
                    { label: 'New Proposal', icon: FilePlus, route: '/crm/proposals?action=new', colour: C.purple },
                  ].map(action => (
                    <Button
                      key={action.label}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => { onOpenChange(false); setTimeout(() => router.push(action.route), 300) }}
                      style={{
                        color: action.colour,
                        border: `1px solid ${action.colour}30`,
                        backgroundColor: `${action.colour}08`,
                      }}
                    >
                      <action.icon className="h-3.5 w-3.5 mr-1.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {[
                    { label: 'Contacts', value: company._count.contacts, icon: Users, colour: '#3b82f6' },
                    { label: 'Deals', value: company._count.deals, icon: DollarSign, colour: C.success },
                    { label: 'Pipeline', value: totalDealValue, icon: TrendingUp, colour: C.yellow, isCurrency: true },
                    { label: 'Invoices', value: invoices.length, icon: Receipt, colour: '#a855f7' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      backgroundColor: C.deeper, borderRadius: '10px', padding: '10px 12px',
                      border: `1px solid ${C.border}`,
                    }}>
                      <div className="flex items-center gap-2">
                        <stat.icon style={{ width: 14, height: 14, color: stat.colour }} />
                        <span style={{ fontSize: '11px', color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {stat.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: C.white, marginTop: 4, display: 'block' }}>
                        {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </SheetHeader>

              {/* Tabs */}
              <Tabs defaultValue="contacts" className="flex-1 flex flex-col overflow-hidden">
                <TabsList
                  className="px-6 pt-2 bg-transparent justify-start gap-1 flex-shrink-0 overflow-x-auto"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                >
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="deals">Deals</TabsTrigger>
                  <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {/* Contacts Tab */}
                    <TabsContent value="contacts">
                      <div className="flex items-center justify-between mb-4">
                        <span style={{ fontSize: '13px', color: C.faint }}>
                          {company.contacts.length} contact{company.contacts.length !== 1 ? 's' : ''}
                        </span>
                        <Button
                          size="sm" variant="ghost" className="text-xs"
                          onClick={() => { onOpenChange(false); setTimeout(() => router.push('/crm/contacts?action=new'), 300) }}
                          style={{ color: C.yellow }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                      </div>
                      {company.contacts.length === 0 ? (
                        <EmptyState icon={Users} text="No contacts linked to this company" />
                      ) : (
                        <div className="space-y-2">
                          {company.contacts.map(contact => (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                              style={{ border: `1px solid ${C.border}` }}
                              onClick={() => { onOpenChange(false); setTimeout(() => router.push(`/crm/contacts/${contact.id}`), 300) }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                  background: `linear-gradient(135deg, ${C.yellow}, #e8c430)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '13px', fontWeight: 700, color: C.dark,
                                }}>
                                  {contact.firstName[0]}{contact.lastName[0]}
                                </div>
                                <div className="min-w-0">
                                  <p style={{ color: C.white, fontSize: '14px', fontWeight: 600 }}>
                                    {contact.firstName} {contact.lastName}
                                  </p>
                                  <p style={{ color: C.faint, fontSize: '12px' }}>
                                    {contact.jobTitle || 'No title'}
                                    {contact.email ? ` · ${contact.email}` : ''}
                                  </p>
                                </div>
                              </div>
                              <span style={{
                                fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                                padding: '2px 10px', borderRadius: '20px',
                                color: C.muted, backgroundColor: 'rgba(255,255,255,0.06)',
                              }}>
                                {contact.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Deals Tab */}
                    <TabsContent value="deals">
                      <div className="flex items-center justify-between mb-4">
                        <span style={{ fontSize: '13px', color: C.faint }}>
                          {company.deals.length} deal{company.deals.length !== 1 ? 's' : ''} · Pipeline: {formatCurrency(totalDealValue)}
                        </span>
                        <Button
                          size="sm" variant="ghost" className="text-xs"
                          onClick={() => { onOpenChange(false); setTimeout(() => router.push('/crm/pipeline?action=new'), 300) }}
                          style={{ color: C.yellow }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                      </div>
                      {company.deals.length === 0 ? (
                        <EmptyState icon={DollarSign} text="No deals linked to this company" />
                      ) : (
                        <div className="space-y-2">
                          {company.deals.map(deal => (
                            <div
                              key={deal.id}
                              className="rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                              style={{ border: `1px solid ${C.border}` }}
                              onClick={() => { onOpenChange(false); setTimeout(() => router.push('/crm/pipeline'), 300) }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-10 w-1 rounded-full" style={{ backgroundColor: deal.stage?.color || C.faint }} />
                                  <div className="min-w-0">
                                    <p style={{ color: C.white, fontSize: '14px', fontWeight: 600 }}>
                                      {deal.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span style={{ fontSize: '12px', color: C.muted }}>{deal.stage?.name}</span>
                                      <span style={{ color: C.border }}>·</span>
                                      <span style={{ fontSize: '12px', color: C.muted }}>{deal.probability}%</span>
                                      {deal.contact && (
                                        <>
                                          <span style={{ color: C.border }}>·</span>
                                          <span style={{ fontSize: '12px', color: C.muted }}>
                                            {deal.contact.firstName} {deal.contact.lastName}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                  <p style={{ color: C.white, fontSize: '14px', fontWeight: 700 }}>
                                    {formatCurrency(deal.value)}
                                  </p>
                                  {deal.closeDate && (
                                    <p style={{ fontSize: '11px', color: C.faint }}>
                                      Close: {format(new Date(deal.closeDate), 'MMM d, yyyy')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Proposals Tab */}
                    <TabsContent value="proposals">
                      <div className="flex items-center justify-between mb-4">
                        <span style={{ fontSize: '13px', color: C.faint }}>
                          {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} · Total: {formatCurrency(totalProposalValue)}
                        </span>
                        <Button
                          size="sm" variant="ghost" className="text-xs"
                          onClick={() => { onOpenChange(false); setTimeout(() => router.push('/crm/proposals?action=new'), 300) }}
                          style={{ color: C.yellow }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                      </div>
                      {proposals.length === 0 ? (
                        <EmptyState icon={FileText} text="No proposals linked to this company" />
                      ) : (
                        <div className="space-y-2">
                          {proposals.map(proposal => {
                            const colour = statusBadgeColour(proposal.status)
                            return (
                              <div
                                key={proposal.id}
                                className="flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                                style={{ border: `1px solid ${C.border}` }}
                                onClick={() => { onOpenChange(false); setTimeout(() => router.push('/crm/proposals'), 300) }}
                              >
                                <div className="min-w-0 flex-1">
                                  <p style={{ color: C.white, fontSize: '14px', fontWeight: 600 }}>{proposal.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {proposal.deal && <span style={{ fontSize: '12px', color: C.muted }}>Deal: {proposal.deal.title}</span>}
                                    {proposal.contact && (
                                      <>
                                        {proposal.deal && <span style={{ color: C.border }}>·</span>}
                                        <span style={{ fontSize: '12px', color: C.muted }}>{proposal.contact.firstName} {proposal.contact.lastName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                  <p style={{ color: C.white, fontSize: '14px', fontWeight: 600 }}>{formatCurrency(proposal.totalAmount)}</p>
                                  <span style={{
                                    fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                                    padding: '2px 10px', borderRadius: '20px',
                                    color: colour, backgroundColor: `${colour}18`, border: `1px solid ${colour}30`,
                                  }}>{proposal.status}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices">
                      <div className="flex items-center justify-between mb-4">
                        <span style={{ fontSize: '13px', color: C.faint }}>
                          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} · Outstanding: {formatCurrency(outstandingInvoices)}
                        </span>
                      </div>
                      {invoices.length === 0 ? (
                        <EmptyState icon={Receipt} text="No invoices linked to this company" />
                      ) : (
                        <div className="space-y-2">
                          {invoices.map(invoice => {
                            const colour = invoiceStatusColour(invoice.status)
                            return (
                              <div
                                key={invoice.id}
                                className="flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                                style={{ border: `1px solid ${C.border}` }}
                                onClick={() => { onOpenChange(false); setTimeout(() => router.push('/crm/invoices'), 300) }}
                              >
                                <div className="min-w-0 flex-1">
                                  <p style={{ color: C.white, fontSize: '14px', fontWeight: 600 }}>{invoice.invoiceNumber}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span style={{ fontSize: '12px', color: C.muted }}>{timeAgo(invoice.createdAt)}</span>
                                    {invoice.dueDate && (
                                      <>
                                        <span style={{ color: C.border }}>·</span>
                                        <span style={{ fontSize: '12px', color: C.muted }}>Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                  <p style={{ color: C.white, fontSize: '14px', fontWeight: 600 }}>{formatCurrency(invoice.totalAmount)}</p>
                                  <span style={{
                                    fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                                    padding: '2px 10px', borderRadius: '20px',
                                    color: colour, backgroundColor: `${colour}18`, border: `1px solid ${colour}30`,
                                  }}>{invoice.status}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity">
                      {activities.length === 0 ? (
                        <EmptyState icon={Clock} text="No recent activity" />
                      ) : (
                        <div className="space-y-3">
                          {activities.map(activity => (
                            <div key={activity.id} className="flex items-start gap-3">
                              <ActivityIcon type={activity.type} />
                              <div className="flex-1 min-w-0">
                                <p style={{ color: C.white, fontSize: '13px', fontWeight: 600 }}>{activity.subject}</p>
                                {activity.description && (
                                  <p style={{ color: C.muted, fontSize: '12px', marginTop: 2, opacity: 0.7 }}>{activity.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span style={{ fontSize: '11px', color: C.faint }}>{timeAgo(activity.createdAt)}</span>
                                  {activity.user && (
                                    <>
                                      <span style={{ color: C.border }}>·</span>
                                      <span style={{ fontSize: '11px', color: C.faint }}>{activity.user.name}</span>
                                    </>
                                  )}
                                  {activity.duration && (
                                    <>
                                      <span style={{ color: C.border }}>·</span>
                                      <span style={{ fontSize: '11px', color: C.faint }}>{activity.duration}m</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notes">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Textarea
                            placeholder="Add a note about this company..."
                            value={noteContent}
                            onChange={e => setNoteContent(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <Button
                            onClick={() => {
                              if (!noteContent.trim()) { toast.error('Note content is required'); return }
                              addNoteMutation.mutate(noteContent)
                            }}
                            disabled={addNoteMutation.isPending || !noteContent.trim()}
                            className="bg-[#374151] hover:bg-[#1F2937] text-white self-end shrink-0"
                          >
                            Add
                          </Button>
                        </div>

                        {notes.length === 0 ? (
                          <EmptyState icon={StickyNote} text="No notes yet" />
                        ) : (
                          <div className="space-y-3">
                            {notes.map(note => (
                              <div
                                key={note.id}
                                className="rounded-lg p-4"
                                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}
                              >
                                <p style={{ color: C.muted, fontSize: '14px' }}>{note.content}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span style={{ color: C.faint, fontSize: '12px' }}>{note.user?.name || 'Unknown'}</span>
                                  <span style={{ color: C.border }}>·</span>
                                  <span style={{ color: C.faint, fontSize: '12px' }}>{timeAgo(note.createdAt)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Company Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg" style={{ maxHeight: '90vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ color: C.white }}>Edit Company</DialogTitle>
          </DialogHeader>
          <CompanyForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={() => {
              if (!editForm.name) { toast.error('Company name is required'); return }
              updateMutation.mutate(editForm)
            }}
            submitLabel="Save Changes"
            isPending={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: C.white }}>Delete Company</AlertDialogTitle>
            <AlertDialogDescription style={{ color: C.muted }}>
              This will permanently delete <strong style={{ color: C.white }}>{company?.name}</strong> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: C.muted }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              style={{ backgroundColor: C.danger, color: C.white }}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
//  CSV IMPORT / EXPORT HELPERS
// ══════════════════════════════════════════════════════════════
function exportToCSV(companies: CompanyRow[]) {
  const headers = ['name', 'companyType', 'industry', 'website', 'phone', 'address', 'city', 'county', 'country', 'employees', 'annualRevenue', 'contacts', 'deals', 'createdAt']
  const rows = companies.map(c => [
    c.name, c.companyType, c.industry || '', c.website || '', c.phone || '',
    c.address || '', c.city || '', c.county || '', c.country || '',
    c.employees || '', c.annualRevenue || '',
    c._count.contacts, c._count.deals,
    new Date(c.createdAt).toISOString(),
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `companies_export_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
      current += char
    }
    values.push(current.trim())
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    return obj
  })
}

// ══════════════════════════════════════════════════════════════
//  IMPORT DIALOG
// ══════════════════════════════════════════════════════════════
function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setPreview(parsed.slice(0, 5))
    }
    reader.readAsText(f)
  }, [])

  const handleImport = useCallback(async () => {
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      let created = 0
      let skipped = 0
      for (const row of rows) {
        if (!row.name) { skipped++; continue }
        try {
          const res = await fetch('/api/crm/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: row.name,
              companyType: row.companytype || 'lead',
              industry: row.industry || '',
              website: row.website || '',
              phone: row.phone || '',
              address: row.address || '',
              city: row.city || '',
              county: row.county || '',
              country: row.country || '',
              employees: row.employees || '',
              annualRevenue: row.annualrevenue || '',
              description: '',
            }),
          })
          if (res.ok) created++
          else skipped++
        } catch { skipped++ }
      }
      setResult({ created, skipped })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setImporting(false)
      toast.success(`Imported ${created} companies (${skipped} skipped)`)
    }
    reader.readAsText(file)
  }, [file, queryClient])

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setFile(null); setPreview([]); setResult(null) } }}>
      <DialogContent className="sm:max-w-lg" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white }}>Import Companies (CSV)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p style={{ color: C.muted, fontSize: '13px' }}>
            Upload a CSV file with columns: name, companyType, industry, website, phone, address, city, county, country, employees, annualRevenue.
          </p>
          <div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="w-full"
              style={{ borderStyle: 'dashed', color: C.muted }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {file ? file.name : 'Select CSV file...'}
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="rounded-lg p-3" style={{ backgroundColor: C.deeper, border: `1px solid ${C.border}`, maxHeight: 200, overflow: 'auto' }}>
              <p style={{ fontSize: '11px', color: C.faint, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                Preview (first {preview.length} rows)
              </p>
              <div className="space-y-1">
                {preview.map((row, i) => (
                  <div key={i} style={{ fontSize: '12px', color: C.muted }}>
                    <strong style={{ color: C.white }}>{row.name || '(no name)'}</strong>
                    {row.industry ? ` · ${row.industry}` : ''}
                    {row.city ? ` · ${row.city}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg p-3 flex items-center gap-2"
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: `1px solid rgba(34,197,94,0.2)` }}>
              <Sparkles style={{ width: 16, height: 16, color: C.success }} />
              <span style={{ fontSize: '13px', color: C.success }}>
                {result.created} created, {result.skipped} skipped
              </span>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full bg-[#374151] hover:bg-[#1F2937] text-white"
          >
            {importing ? 'Importing...' : 'Import Companies'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMPANIES PAGE
// ══════════════════════════════════════════════════════════════
export default function CompaniesPage() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'deals'>('createdAt')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const [newCompany, setNewCompany] = useState(emptyCompanyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search, industryFilter, typeFilter, page],
    queryFn: () =>
      fetch(
        `/api/crm/companies?search=${encodeURIComponent(search)}&industry=${encodeURIComponent(industryFilter)}&companyType=${encodeURIComponent(typeFilter)}&page=${page}&limit=20`
      ).then(r => r.json()),
  })

  const companies = (data?.companies || []) as CompanyRow[]

  const sortedCompanies = useMemo(() => {
    const sorted = [...companies]
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'deals') sorted.sort((a, b) => (b.deals?.reduce((s, d) => s + d.value, 0) || 0) - (a.deals?.reduce((s, d) => s + d.value, 0) || 0))
    // createdAt is default order from API
    return sorted
  }, [companies, sortBy])

  const createMutation = useMutation({
    mutationFn: async (company: Record<string, string>) => {
      const res = await fetch('/api/crm/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create company')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setDialogOpen(false)
      setNewCompany(emptyCompanyForm)
      toast.success('Company created successfully')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  // Derived data for filters
  const industries = useMemo(() =>
    [...new Set(data?.companies?.map((c: CompanyRow) => c.industry).filter(Boolean) as string[] || [])],
    [data]
  )

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { lead: 0, customer: 0, partner: 0, supplier: 0 }
    companies.forEach(c => { if (counts[c.companyType] !== undefined) counts[c.companyType]++ })
    return counts
  }, [companies])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ color: C.white }} className="text-2xl font-bold">Companies</h1>
            <Badge variant="outline" style={{ color: C.faint, borderColor: C.border, fontSize: '12px' }}>
              {data?.pagination?.total || 0}
            </Badge>
          </div>
          <p style={{ color: C.muted, opacity: 0.6 }} className="text-sm mt-1">
            Manage your business relationships
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import / Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" style={{ color: C.muted, borderColor: C.border }}>
                <Download className="h-4 w-4 mr-1.5" /> More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <DropdownMenuItem
                onClick={() => {
                  if (companies.length === 0) { toast.error('No companies to export'); return }
                  exportToCSV(companies)
                  toast.success('CSV exported')
                }}
                style={{ color: C.muted }}
              >
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportOpen(true)} style={{ color: C.muted }}>
                <Upload className="h-4 w-4 mr-2" /> Import CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Company */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium">
                <Plus className="h-4 w-4 mr-2" />
                New Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" style={{ maxHeight: '90vh', overflow: 'auto' }}>
              <DialogHeader>
                <DialogTitle style={{ color: C.white }}>New Company</DialogTitle>
              </DialogHeader>
              <CompanyForm
                form={newCompany}
                setForm={setNewCompany}
                onSubmit={() => {
                  if (!newCompany.name) { toast.error('Company name is required'); return }
                  createMutation.mutate(newCompany)
                }}
                submitLabel="Create Company"
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'Total Companies', value: data?.pagination?.total || 0, icon: Building2, colour: C.yellow },
          { label: 'Customers', value: typeCounts.customer, icon: Briefcase, colour: C.success },
          { label: 'Leads', value: typeCounts.lead, icon: TrendingUp, colour: C.info },
          { label: 'Suppliers', value: typeCounts.supplier, icon: Tag, colour: '#f59e0b' },
        ].map(card => (
          <div
            key={card.label}
            style={{
              backgroundColor: C.surface, borderRadius: '12px', padding: '16px',
              border: `1px solid ${C.border}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '12px', color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.label}
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: '8px',
                backgroundColor: `${card.colour}12`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <card.icon style={{ width: 16, height: 16, color: card.colour }} />
              </div>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: C.white, marginTop: 8, display: 'block' }}>
              {card.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, industry, website, or contact..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Type filter pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg" style={{ backgroundColor: C.deeper, border: `1px solid ${C.border}` }}>
            <button
              onClick={() => { setTypeFilter(''); setPage(1) }}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                backgroundColor: !typeFilter ? C.yellow + '20' : 'transparent',
                color: !typeFilter ? C.yellow : C.faint,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              All
            </button>
            {COMPANY_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => { setTypeFilter(typeFilter === t.value ? '' : t.value); setPage(1) }}
                style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                  backgroundColor: typeFilter === t.value ? t.colour + '20' : 'transparent',
                  color: typeFilter === t.value ? t.colour : C.faint,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Industry filter */}
          {industries.length > 0 && (
            <Select value={industryFilter} onValueChange={v => { setIndustryFilter(v === '__all__' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40" style={{ fontSize: '13px' }}>
                <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Industries</SelectItem>
                {industries.map((ind: string) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-36" style={{ fontSize: '13px' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest First</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="deals">Highest Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Company Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl p-5" style={{
              backgroundColor: C.surface, border: `1px solid ${C.border}`,
            }}>
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-3/4 rounded" style={{ backgroundColor: '#222' }} />
                <div className="h-4 w-1/2 rounded" style={{ backgroundColor: '#222' }} />
                <div className="h-4 w-2/3 rounded" style={{ backgroundColor: '#222' }} />
                <div className="flex gap-3 mt-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-8 flex-1 rounded" style={{ backgroundColor: '#222' }} />
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : sortedCompanies.length === 0 ? (
          <div className="col-span-full rounded-xl p-12 flex flex-col items-center gap-3"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <Building2 style={{ width: 40, height: 40, color: C.faint }} />
            <p style={{ color: C.faint, fontSize: '14px' }}>
              {search || industryFilter || typeFilter ? 'No companies match your filters' : 'No companies yet'}
            </p>
            {!search && !industryFilter && !typeFilter && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-[#374151] hover:bg-[#1F2937] text-white text-sm mt-2"
              >
                <Plus className="h-4 w-4 mr-2" /> Create your first company
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedCompanies.map((company, index) => {
              const dealValue = (company.deals || []).reduce((s, d) => s + d.value, 0)
              const lastActivity = company.activities?.[0]?.createdAt
              const typeCfg = getCompanyTypeConfig(company.companyType)

              return (
                <motion.div
                  key={company.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="rounded-xl p-5 cursor-pointer transition-all hover:border-opacity-50 group"
                  style={{
                    backgroundColor: C.surface,
                    border: `1px solid ${C.border}`,
                  }}
                  onClick={() => setSelectedCompanyId(company.id)}
                  whileHover={{ y: -2 }}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div style={{
                        width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                        background: `linear-gradient(135deg, ${typeCfg.colour}20, ${typeCfg.colour}08)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${typeCfg.colour}25`,
                      }}>
                        <Building2 style={{ width: 18, height: 18, color: typeCfg.colour }} />
                      </div>
                      <div className="min-w-0">
                        <h3 style={{ color: C.white, fontSize: '14px', fontWeight: 700 }} className="truncate">
                          {company.name}
                        </h3>
                        <p style={{ color: C.faint, fontSize: '12px' }} className="truncate">
                          {company.industry || 'No industry'}
                          {company.city ? ` · ${company.city}` : ''}
                          {company.county ? `, ${company.county}` : ''}
                        </p>
                      </div>
                    </div>
                    <CompanyTypeBadge type={company.companyType} />
                  </div>

                  {/* Contact info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                    {company.phone && (
                      <span className="flex items-center gap-1" style={{ fontSize: '12px', color: C.faint }}>
                        <Phone style={{ width: 11, height: 11 }} /> {company.phone}
                      </span>
                    )}
                    {company.website && (
                      <span className="flex items-center gap-1 truncate" style={{ fontSize: '12px', color: C.faint }}>
                        <Globe style={{ width: 11, height: 11 }} /> {company.website}
                      </span>
                    )}
                  </div>

                  <Separator style={{ backgroundColor: C.border }} className="my-3" />

                  {/* Analytics row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p style={{ fontSize: '10px', color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Pipeline
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: C.yellow, marginTop: 2 }}>
                        {formatCurrency(dealValue)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Deals
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: C.success, marginTop: 2 }}>
                        {company._count.deals}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Contacts
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: C.info, marginTop: 2 }}>
                        {company._count.contacts}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', color: C.faint }}>
                      {company.employees ? `${company.employees} employees` : 'Created ' + timeAgo(company.createdAt)}
                    </span>
                    {lastActivity && (
                      <span style={{ fontSize: '11px', color: C.faint }}>
                        Last activity: {timeAgo(lastActivity)}
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
          style={{ padding: '12px 0' }}
        >
          <p style={{ color: C.muted }} className="text-sm">
            Showing {(page - 1) * 20 + 1} to{' '}
            {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ borderColor: C.border, color: C.muted }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span style={{ color: C.muted }} className="text-sm px-2">
              Page {page} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline" size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(page + 1)}
              style={{ borderColor: C.border, color: C.muted }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Company Detail Slide-over */}
      <CompanyDetailSheet
        companyId={selectedCompanyId}
        open={!!selectedCompanyId}
        onOpenChange={open => { if (!open) setSelectedCompanyId(null) }}
      />

      {/* Import Dialog */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
