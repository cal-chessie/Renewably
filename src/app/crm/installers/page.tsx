'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, ChevronLeft, ChevronRight, X,
  Mail, Phone, MapPin, Building2, Zap, Sun, Battery,
  Grid3x3, Plug, Users, Calendar, DollarSign, CheckCircle2,
  FileText, Edit, Clock, Truck, Shield, Hash, Globe,
  ArrowRight, ExternalLink, Send, AlertTriangle, Star,
  Briefcase, Wrench, Mail as MailIcon, CreditCard, Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/crm/StatCard'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { ActivityIcon } from '@/components/crm/ActivityIcon'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ──────────────────────────── Constants ────────────────────────────
const IRELAND_COUNTIES = [
  'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Tipperary',
  'Clare', 'Kerry', 'Kilkenny', 'Wexford', 'Wicklow', 'Meath',
  'Kildare', 'Donegal', 'Sligo', 'Mayo', 'Roscommon', 'Longford',
  'Westmeath', 'Offaly', 'Laois', 'Carlow', 'Cavan', 'Monaghan', 'Leitrim',
]

const PLAN_PRICING: Record<string, number> = {
  starter: 1000,
  pro: 1250,
  enterprise: 1500,
}

const EQUIPMENT_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  inverter: { icon: Zap, label: 'Inverter' },
  battery: { icon: Battery, label: 'Battery' },
  panel: { icon: Sun, label: 'Panels' },
  mounting: { icon: Grid3x3, label: 'Mounting' },
  ev_charger: { icon: Plug, label: 'EV Charger' },
}

const SPECIALIZATION_LABELS: Record<string, string> = {
  ruralSpecialist: 'Rural Specialist',
  commercialSpecialist: 'Commercial Specialist',
  heritageExperience: 'Heritage Experience',
  offersEvCharger: 'EV Charger Install',
  offersHeatPump: 'Heat Pump Install',
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-[#222222] text-[#A0A0A0] border-[#2A2A2A]',
  pro: 'bg-[#F3D840]/15 text-[#8a7500] border-[#F3D840]/40',
  enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
}

const SUBSCRIPTION_COLORS: Record<string, string> = {
  trialing: 'bg-blue-100 text-blue-700 border-blue-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  past_due: 'bg-orange-100 text-orange-700 border-orange-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const DOCUMENT_TYPES = [
  { key: 'msa', label: 'Master Services Agreement', short: 'MSA' },
  { key: 'nda', label: 'Non-Disclosure Agreement', short: 'NDA' },
  { key: 'dpa', label: 'Data Processing Agreement', short: 'DPA' },
  { key: 'tos', label: 'Terms of Service', short: 'ToS' },
]

// ──────────────────────────── Types ────────────────────────────
interface InstallerRow {
  id: string
  companyName: string
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  plan: string
  subscriptionStatus: string
  onboardingStep: number
  onboardingComplete: boolean
  counties: string[]
  equipmentCategories: string[]
  seaiRegistered: boolean
  reciRegistered: boolean
  teamSize: number | null
  avgProjectValue: number | null
  createdAt: string
  mrr: number | null
}

interface InstallerDetail extends InstallerRow {
  website: string | null
  address: string | null
  city: string | null
  county: string | null
  eircode: string | null
  seaiNumber: string | null
  reciNumber: string | null
  yearsInBusiness: number | null
  electricians: number | null
  vans: number | null
  specializations: string[]
  equipment: Array<{
    id: string
    category: string
    brand: string
    model: string | null
  }>
  documents: Array<{
    type: string
    signed: boolean
    signedAt: string | null
    documentUrl: string | null
  }>
  subscription: {
    plan: string
    status: string
    billingCycle: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    mrr: number
  } | null
  leadPreferences: {
    maxLeadsPerMonth: number | null
    minValue: number | null
    responseTimeHours: number | null
    travelRadiusKm: number | null
  } | null
  integrations: Array<{
    provider: string
    connected: boolean
    connectedAt: string | null
  }>
  description: string | null
}

interface InstallerStats {
  totalInstallers: number
  activeSubscriptions: number
  mrr: number
  onboardingRate: number
  countiesCovered: number
  plans: Record<string, number>
  seaiRegistered: number
  reciRegistered: number
  avgTeamSize: number
}

// ──────────────────────────── Helpers ────────────────────────────
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function PlanBadge({ plan }: { plan: string }) {
  const colors = PLAN_COLORS[plan.toLowerCase()] || PLAN_COLORS.starter
  return (
    <Badge variant="outline" className={`${colors} font-semibold text-[11px]`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  )
}

function SubscriptionBadge({ status }: { status: string }) {
  const colors = SUBSCRIPTION_COLORS[status.toLowerCase()] || SUBSCRIPTION_COLORS.active
  return (
    <Badge variant="outline" className={`${colors} text-[11px] font-medium`}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  )
}

function CertificationBadge({ label, registered }: { label: string; registered: boolean }) {
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${registered ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#1A1A1A] text-[#A0A0A0] border-[#2A2A2A]'}`}>
      {registered ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  )
}

function EquipmentIcon({ category }: { category: string }) {
  const config = EQUIPMENT_ICONS[category]
  if (!config) return null
  const Icon = config.icon
  return (
    <div className="h-7 w-7 rounded-md bg-[#222222] flex items-center justify-center" title={config.label}>
      <Icon className="h-3.5 w-3.5 text-[#A0A0A0]" />
    </div>
  )
}

// ──────────────────────────── Animation Variants ────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
}

const cardVariant = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ──────────────────────────── Create Installer Dialog ────────────────────────────
function CreateInstallerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('starter')
  const [seaiNumber, setSeaiNumber] = useState('')
  const [reciNumber, setReciNumber] = useState('')
  const [selectedCounties, setSelectedCounties] = useState<string[]>([])

  const toggleCounty = (county: string) => {
    setSelectedCounties(prev =>
      prev.includes(county) ? prev.filter(c => c !== county) : [...prev, county]
    )
  }

  const resetForm = useCallback(() => {
    setCompanyName('')
    setContactName('')
    setPhone('')
    setEmail('')
    setPlan('starter')
    setSeaiNumber('')
    setReciNumber('')
    setSelectedCounties([])
  }, [])

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create installer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installers'] })
      queryClient.invalidateQueries({ queryKey: ['installer-stats'] })
      resetForm()
      onOpenChange(false)
      toast.success('Installer created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleSubmit = () => {
    if (!companyName.trim()) { toast.error('Company name is required'); return }
    if (!contactName.trim()) { toast.error('Contact name is required'); return }
    mutation.mutate({
      companyName,
      contactName,
      phone: phone || null,
      email: email || null,
      plan,
      seaiNumber: seaiNumber || null,
      reciNumber: reciNumber || null,
      counties: selectedCounties,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">New Installer</DialogTitle>
          <p className="text-sm text-[#A0A0A0]">Create a new solar installer profile</p>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Information</h3>
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. SolarTech Ireland Ltd" />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.ie" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+353 1 234 5678" />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter — €{PLAN_PRICING.starter}/mo</SelectItem>
                    <SelectItem value="pro">Pro — €{PLAN_PRICING.pro}/mo</SelectItem>
                    <SelectItem value="enterprise">Enterprise — €{PLAN_PRICING.enterprise}/mo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Certifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SEAI Number</Label>
                <Input value={seaiNumber} onChange={e => setSeaiNumber(e.target.value)} placeholder="SEAI registration number" />
              </div>
              <div className="space-y-2">
                <Label>RECI Number</Label>
                <Input value={reciNumber} onChange={e => setReciNumber(e.target.value)} placeholder="RECI registration number" />
              </div>
            </div>
          </div>

          {/* County Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Territory</h3>
              <Badge variant="secondary" className="text-[11px]">{selectedCounties.length} selected</Badge>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto rounded-lg border p-3">
              {IRELAND_COUNTIES.map(county => (
                <label
                  key={county}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                    selectedCounties.includes(county)
                      ? 'bg-[#F3D840]/15 text-[#8a7500] font-medium'
                      : 'hover:bg-[#141414]/5 text-[#A0A0A0]'
                  }`}
                >
                  <Checkbox
                    checked={selectedCounties.includes(county)}
                    onCheckedChange={() => toggleCounty(county)}
                    className="h-3.5 w-3.5"
                  />
                  {county}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-[#374151] hover:bg-[#1F2937] text-white"
          >
            {mutation.isPending ? 'Creating...' : 'Create Installer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Installer Detail Panel ────────────────────────────
function InstallerDetailPanel({ installerId, onClose }: { installerId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['installer-detail', installerId],
    queryFn: () => fetch(`/api/crm/installers/${installerId}`).then(r => r.json()),
    enabled: !!installerId,
  })

  const installer: InstallerDetail | null = data?.installer || null

  if (isLoading) {
    return (
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-full md:w-[560px] bg-[#141414] shadow-xl z-50 flex items-center justify-center"
      >
        <div className="animate-pulse text-gray-400">Loading installer profile...</div>
      </motion.div>
    )
  }

  if (!installer) return null

  const quickActions = [
    { key: 'edit', icon: Edit, label: 'Edit Profile' },
    { key: 'deal', icon: DollarSign, label: 'Create Deal' },
    { key: 'email', icon: Send, label: 'Send Email' },
    { key: 'meeting', icon: Calendar, label: 'Schedule Meeting' },
  ]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-40 md:block hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-full md:w-[560px] bg-[#141414] shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#2A2A2A] shrink-0">
          <div className="flex items-start justify-between mb-4">
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#141414]/5 transition-colors">
              <X className="h-5 w-5 text-[#A0A0A0]" />
            </button>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#F3D840]/20 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-[#8a7500]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white truncate">{installer.companyName}</h2>
              <p className="text-sm text-[#A0A0A0]">{installer.contactName}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <PlanBadge plan={installer.plan} />
                {installer.subscription && <SubscriptionBadge status={installer.subscription.status} />}
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium ${installer.onboardingComplete ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                >
                  Onboarding {installer.onboardingComplete ? 'Complete' : `Step ${installer.onboardingStep}/10`}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Quick Actions */}
          <div className="p-5 border-b border-[#2A2A2A]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map(action => (
                <button
                  key={action.key}
                  onClick={() => setActiveAction(action.key)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[#2A2A2A] hover:border-[#F3D840]/50 hover:bg-[#F3D840]/5 transition-all"
                >
                  <action.icon className="h-5 w-5 text-[#374151]" />
                  <span className="text-[10px] font-medium text-[#A0A0A0] text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Company Info */}
          <div className="p-5 border-b border-[#2A2A2A] space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Company Info</h3>
            {installer.description && (
              <p className="text-sm text-[#A0A0A0] leading-relaxed">{installer.description}</p>
            )}
            {installer.website && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><Globe className="h-4 w-4 text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{installer.website}</p>
                  <p className="text-[10px] text-gray-400">Website</p>
                </div>
              </div>
            )}
            {(installer.address || installer.city) && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center"><MapPin className="h-4 w-4 text-orange-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{[installer.address, installer.city, installer.eircode].filter(Boolean).join(', ')}</p>
                  <p className="text-[10px] text-gray-400">Address</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="p-5 border-b border-[#2A2A2A] space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Info</h3>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#222222] flex items-center justify-center"><Users className="h-4 w-4 text-[#A0A0A0]" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{installer.contactName}</p>
                <p className="text-[10px] text-gray-400">Primary Contact</p>
              </div>
            </div>
            {installer.contactEmail && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><Mail className="h-4 w-4 text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{installer.contactEmail}</p>
                  <p className="text-[10px] text-gray-400">Email</p>
                </div>
              </div>
            )}
            {installer.contactPhone && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center"><Phone className="h-4 w-4 text-green-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{installer.contactPhone}</p>
                  <p className="text-[10px] text-gray-400">Phone</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <CertificationBadge label={`SEAI${installer.seaiNumber ? ` #${installer.seaiNumber}` : ''}`} registered={installer.seaiRegistered} />
              <CertificationBadge label={`RECI${installer.reciNumber ? ` #${installer.reciNumber}` : ''}`} registered={installer.reciRegistered} />
            </div>
          </div>

          {/* Territory & Coverage */}
          {installer.counties && installer.counties.length > 0 && (
            <div className="p-5 border-b border-[#2A2A2A]">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Territory & Coverage ({installer.counties.length} counties)
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {installer.counties.map(county => (
                  <Badge key={county} variant="outline" className="bg-[#F3D840]/8 text-[#374151] border-[#F3D840]/30 text-[11px]">
                    <MapPin className="h-3 w-3 mr-1" />
                    {county}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {installer.equipment && installer.equipment.length > 0 && (
            <div className="p-5 border-b border-[#2A2A2A]">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Equipment</h3>
              <div className="space-y-2">
                {installer.equipment.map(eq => {
                  const config = EQUIPMENT_ICONS[eq.category]
                  const Icon = config?.icon || Zap
                  return (
                    <div key={eq.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1A1A1A]">
                      <div className="h-8 w-8 rounded-lg bg-[#222222] flex items-center justify-center">
                        <Icon className="h-4 w-4 text-[#A0A0A0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{config?.label || eq.category}</p>
                        <p className="text-[11px] text-[#A0A0A0]">{eq.brand}{eq.model ? ` — ${eq.model}` : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Legal Documents */}
          <div className="p-5 border-b border-[#2A2A2A]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legal Documents</h3>
            <div className="grid grid-cols-2 gap-2">
              {DOCUMENT_TYPES.map(doc => {
                const docData = installer.documents?.find(d => d.type === doc.key)
                const signed = docData?.signed ?? false
                return (
                  <div key={doc.key} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#2A2A2A]">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${signed ? 'bg-green-50' : 'bg-[#1A1A1A]'}`}>
                      <FileText className={`h-4 w-4 ${signed ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white">{doc.short}</p>
                      <p className={`text-[10px] ${signed ? 'text-green-600' : 'text-gray-400'}`}>
                        {signed ? (docData?.signedAt ? `Signed ${format(new Date(docData.signedAt), 'MMM d, yyyy')}` : 'Signed') : 'Unsigned'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Subscription */}
          {installer.subscription && (
            <div className="p-5 border-b border-[#2A2A2A]">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription</h3>
              <div className="p-4 rounded-xl bg-[#1A1A1A] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <PlanBadge plan={installer.subscription.plan} />
                      <SubscriptionBadge status={installer.subscription.status} />
                    </div>
                    <p className="text-xs text-[#A0A0A0] mt-1">{formatCurrency(PLAN_PRICING[installer.subscription.plan] || 0)}/mo · Billed {installer.subscription.billingCycle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatCurrency(installer.subscription.mrr)}</p>
                    <p className="text-[10px] text-gray-400">MRR</p>
                  </div>
                </div>
                {installer.subscription.currentPeriodStart && installer.subscription.currentPeriodEnd && (
                  <div className="flex items-center gap-2 text-[11px] text-[#A0A0A0]">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(installer.subscription.currentPeriodStart), 'MMM d, yyyy')} — {format(new Date(installer.subscription.currentPeriodEnd), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Capacity */}
          <div className="p-5 border-b border-[#2A2A2A]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Business Capacity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[10px] text-[#A0A0A0]">Years in Business</span>
                </div>
                <p className="text-lg font-bold text-white">{installer.yearsInBusiness ?? '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[10px] text-[#A0A0A0]">Team Size</span>
                </div>
                <p className="text-lg font-bold text-white">{installer.teamSize ?? '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[10px] text-[#A0A0A0]">Electricians</span>
                </div>
                <p className="text-lg font-bold text-white">{installer.electricians ?? '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[10px] text-[#A0A0A0]">Vans</span>
                </div>
                <p className="text-lg font-bold text-white">{installer.vans ?? '—'}</p>
              </div>
            </div>
            {installer.specializations && installer.specializations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {installer.specializations.map(s => (
                  <Badge key={s} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                    <Star className="h-3 w-3 mr-1" />
                    {SPECIALIZATION_LABELS[s] || s}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Lead Preferences */}
          {installer.leadPreferences && (
            <div className="p-5 border-b border-[#2A2A2A]">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Lead Preferences</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[#A0A0A0]">Max leads/mo:</span>
                  <span className="font-medium text-white">{installer.leadPreferences.maxLeadsPerMonth ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[#A0A0A0]">Min value:</span>
                  <span className="font-medium text-white">{installer.leadPreferences.minValue ? formatCurrency(installer.leadPreferences.minValue) : '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[#A0A0A0]">Response time:</span>
                  <span className="font-medium text-white">{installer.leadPreferences.responseTimeHours ? `${installer.leadPreferences.responseTimeHours}h` : '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[#A0A0A0]">Travel radius:</span>
                  <span className="font-medium text-white">{installer.leadPreferences.travelRadiusKm ? `${installer.leadPreferences.travelRadiusKm}km` : '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {installer.integrations && installer.integrations.length > 0 && (
            <div className="p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Integrations</h3>
              <div className="space-y-2">
                {installer.integrations.map(int => (
                  <div key={int.provider} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1A1A1A]">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${int.connected ? 'bg-green-50' : 'bg-[#222222]'}`}>
                      <Link2 className={`h-4 w-4 ${int.connected ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white capitalize">{int.provider.replace(/_/g, ' ')}</p>
                      {int.connectedAt && (
                        <p className="text-[10px] text-gray-400">Connected {format(new Date(int.connectedAt), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${int.connected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#1A1A1A] text-[#A0A0A0] border-[#2A2A2A]'}`}>
                      {int.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </>
  )
}

// ──────────────────────────── Installer Card ────────────────────────────
function InstallerCard({ installer, index, onView }: { installer: InstallerRow; index: number; onView: () => void }) {
  const progressPercent = Math.round((installer.onboardingStep / 10) * 100)

  return (
    <motion.div
      key={installer.id}
      variants={cardVariant}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full" onClick={onView}>
        <CardContent className="p-5 flex flex-col h-full">
          {/* Top row */}
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">{installer.companyName}</h3>
              <p className="text-xs text-[#A0A0A0] mt-0.5">{installer.contactName}</p>
            </div>
            <PlanBadge plan={installer.plan} />
          </div>

          {/* Status badges row */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <SubscriptionBadge status={installer.subscriptionStatus} />
            <Badge
              variant="outline"
              className={`text-[10px] font-medium ${installer.onboardingComplete ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
            >
              {installer.onboardingComplete ? '✓ Onboarded' : `${installer.onboardingStep}/10`}
            </Badge>
          </div>

          {/* Onboarding progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400">Onboarding Progress</span>
              <span className="text-[10px] font-medium text-[#A0A0A0]">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#222222] rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${installer.onboardingComplete ? 'bg-green-500' : 'bg-[#F3D840]'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, delay: index * 0.04 + 0.2 }}
              />
            </div>
          </div>

          {/* Territory */}
          {installer.counties && installer.counties.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Territory</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {installer.counties.slice(0, 4).map(c => (
                  <span key={c} className="text-[10px] px-1.5 py-0.5 bg-[#1A1A1A] rounded text-[#A0A0A0]">{c}</span>
                ))}
                {installer.counties.length > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#222222] rounded text-[#A0A0A0]">+{installer.counties.length - 4}</span>
                )}
              </div>
            </div>
          )}

          {/* Equipment icons */}
          {installer.equipmentCategories && installer.equipmentCategories.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <Wrench className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Equipment</span>
              </div>
              <div className="flex items-center gap-1.5">
                {installer.equipmentCategories.map(cat => (
                  <EquipmentIcon key={cat} category={cat} />
                ))}
              </div>
            </div>
          )}

          {/* SEAI / RECI */}
          <div className="flex items-center gap-1.5 mb-3">
            <CertificationBadge label="SEAI" registered={installer.seaiRegistered} />
            <CertificationBadge label="RECI" registered={installer.reciRegistered} />
          </div>

          {/* Bottom metrics */}
          <div className="mt-auto pt-3 border-t border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {installer.teamSize != null && (
                  <div className="flex items-center gap-1 text-[11px] text-[#A0A0A0]">
                    <Users className="h-3 w-3" />
                    <span>{installer.teamSize} team</span>
                  </div>
                )}
                {installer.avgProjectValue != null && (
                  <div className="flex items-center gap-1 text-[11px] text-[#A0A0A0]">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCurrency(installer.avgProjectValue)} avg</span>
                  </div>
                )}
              </div>
              <button
                className="flex items-center gap-1 text-[11px] font-medium text-[#374151] hover:text-[#F3D840] transition-colors"
                onClick={(e) => { e.stopPropagation(); onView() }}
              >
                View Profile <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ──────────────────────────── Skeleton Loaders ────────────────────────────
function StatSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-[#222222] rounded animate-pulse" />
            <div className="h-7 w-16 bg-[#222222] rounded animate-pulse" />
            <div className="h-3 w-20 bg-[#222222] rounded animate-pulse" />
          </div>
          <div className="h-12 w-12 bg-[#222222] rounded-xl animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

function CardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-[#222222] rounded animate-pulse" />
            <div className="h-3 w-24 bg-[#222222] rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-[#222222] rounded-full animate-pulse" />
        </div>
        <div className="h-2 w-full bg-[#222222] rounded-full animate-pulse" />
        <div className="flex gap-1.5">
          <div className="h-5 w-12 bg-[#222222] rounded animate-pulse" />
          <div className="h-5 w-14 bg-[#222222] rounded animate-pulse" />
        </div>
        <div className="flex gap-1">
          <div className="h-7 w-7 bg-[#222222] rounded animate-pulse" />
          <div className="h-7 w-7 bg-[#222222] rounded animate-pulse" />
          <div className="h-7 w-7 bg-[#222222] rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────── Main Page ────────────────────────────
export default function InstallersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [onboardingFilter, setOnboardingFilter] = useState('')
  const [countyFilter, setCountyFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedInstallerId, setSelectedInstallerId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (planFilter) params.set('plan', planFilter)
    if (onboardingFilter) params.set('onboarding', onboardingFilter)
    if (countyFilter) params.set('county', countyFilter)
    params.set('page', String(page))
    params.set('limit', '12')
    return params.toString()
  }, [search, planFilter, onboardingFilter, countyFilter, page])

  // Fetch installers list
  const { data: listData, isLoading: listLoading, isError: listError } = useQuery({
    queryKey: ['installers', queryParams],
    queryFn: () => fetch(`/api/crm/installers?${queryParams}`).then(r => r.json()),
  })

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['installer-stats'],
    queryFn: () => fetch('/api/crm/installers/stats').then(r => r.json()),
  })

  const installers: InstallerRow[] = listData?.installers || []
  const pagination = listData?.pagination || { page: 1, totalPages: 1, total: 0 }
  const stats: InstallerStats | null = statsData || null

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleFilterChange = useCallback((setter: (v: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }, [])

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }} className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div {...fadeUp} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Installers</h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Solar installer profiles and onboarding
            {stats && !statsLoading && (
              <span className="text-gray-400"> · {stats.totalInstallers} total</span>
            )}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#F3D840] text-[#1A1A1A] hover:bg-[#E5C832] font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Installer
        </Button>
      </motion.div>

      {/* Filter Bar */}
      <motion.div {...fadeUp} initial="initial" animate="animate" transition={{ duration: 0.3, delay: 0.1 }}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search company or contact..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Plan filter */}
              <Select value={planFilter} onValueChange={handleFilterChange(setPlanFilter)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Plans</SelectItem>
                  <SelectItem value="starter">Starter (€1,000/mo)</SelectItem>
                  <SelectItem value="pro">Pro (€1,250/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (€1,500/mo)</SelectItem>
                </SelectContent>
              </Select>

              {/* Onboarding filter */}
              <Select value={onboardingFilter} onValueChange={handleFilterChange(setOnboardingFilter)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Onboarding</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>

              {/* County filter */}
              <Select value={countyFilter} onValueChange={handleFilterChange(setCountyFilter)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Counties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Counties</SelectItem>
                  {IRELAND_COUNTIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Installers"
            value={stats.totalInstallers}
            subtitle={`${stats.seaiRegistered} SEAI registered`}
            icon={Building2}
            delay={0}
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions}
            subtitle={`${formatCurrency(stats.mrr)} MRR`}
            icon={CreditCard}
            delay={0.05}
          />
          <StatCard
            title="Onboarding Complete"
            value={`${Math.round(stats.onboardingRate)}%`}
            subtitle={`${stats.reciRegistered} RECI registered`}
            icon={CheckCircle2}
            delay={0.1}
          />
          <StatCard
            title="Counties Covered"
            value={stats.countiesCovered}
            subtitle={`Avg team size: ${stats.avgTeamSize}`}
            icon={MapPin}
            delay={0.15}
          />
        </div>
      ) : null}

      {/* Main Grid */}
      <div>
        {listLoading ? (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </motion.div>
        ) : listError ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Failed to load installers</h3>
              <p className="text-sm text-[#A0A0A0]">Please try again or check your connection.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['installers'] })}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : installers.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-[#222222] flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">No installers found</h3>
              <p className="text-sm text-[#A0A0A0] mb-4">
                {search || planFilter || onboardingFilter || countyFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by adding your first installer.'}
              </p>
              {!search && !planFilter && !onboardingFilter && !countyFilter && (
                <Button onClick={() => setShowCreateDialog(true)} className="bg-[#F3D840] text-[#1A1A1A] hover:bg-[#E5C832] font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Installer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {installers.map((installer, index) => (
                  <InstallerCard
                    key={installer.id}
                    installer={installer}
                    index={index}
                    onView={() => setSelectedInstallerId(installer.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div {...fadeUp} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="flex items-center justify-between mt-6 pt-4">
                <p className="text-sm text-[#A0A0A0]">
                  Showing {((pagination.page - 1) * 12) + 1}–{Math.min(pagination.page * 12, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let pageNum: number
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 w-8 p-0 ${pageNum === pagination.page ? 'bg-[#374151] hover:bg-[#1F2937]' : ''}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="h-8"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Create Installer Dialog */}
      <CreateInstallerDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Installer Detail Panel */}
      <AnimatePresence>
        {selectedInstallerId && (
          <InstallerDetailPanel
            installerId={selectedInstallerId}
            onClose={() => setSelectedInstallerId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
