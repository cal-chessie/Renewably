'use client'

import React, { useState, useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, ChevronLeft, ChevronRight, X,
  Mail, Phone, MapPin, Building2, Zap, Sun, Battery,
  Grid3x3, Plug, Users, Calendar, DollarSign, CheckCircle2,
  FileText, Clock, Truck, Shield, Hash, Globe,
  AlertTriangle, Star, Wrench, CreditCard, Link2,
  LayoutGrid, List, Map, Download, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Eye, Send,
  TrendingUp, BarChart3, PieChart, Filter, MoreHorizontal,
  Upload, Bell, Activity, FileUp, CircleDot, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatCard } from '@/components/crm/StatCard'
import { formatCurrency } from '@/lib/format'
import { timeAgo } from '@/lib/format'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { PieChart as RPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'

// ──────────────────────────── Constants ────────────────────────────
const IRELAND_COUNTIES = [
  'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Tipperary',
  'Clare', 'Kerry', 'Kilkenny', 'Wexford', 'Wicklow', 'Meath',
  'Kildare', 'Donegal', 'Sligo', 'Mayo', 'Roscommon', 'Longford',
  'Westmeath', 'Offaly', 'Laois', 'Carlow', 'Cavan', 'Monaghan', 'Leitrim',
]

const PLAN_PRICING: Record<string, number> = { starter: 1000, pro: 1250, enterprise: 1500 }

const PLAN_LABELS: Record<string, string> = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }

const SPECIALIZATION_LABELS: Record<string, string> = {
  ruralSpecialist: 'Rural Specialist',
  commercialSpecialist: 'Commercial Specialist',
  heritageExperience: 'Heritage Experience',
  offersEvCharger: 'EV Charger Install',
  offersHeatPump: 'Heat Pump Install',
}

const PLAN_COLORS: Record<string, React.CSSProperties> = {
  starter: { backgroundColor: '#222222', color: '#A0A0A0', border: '1px solid #2A2A2A' },
  pro: { backgroundColor: 'rgba(243,216,64,0.15)', color: '#d4b428', border: '1px solid rgba(243,216,64,0.4)' },
  enterprise: { backgroundColor: 'rgba(168,85,247,0.15)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.2)' },
}

const SUBSCRIPTION_COLORS: Record<string, React.CSSProperties> = {
  none: { backgroundColor: '#1A1A1A', color: '#6B7280', border: '1px solid #2A2A2A' },
  trialing: { backgroundColor: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' },
  active: { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' },
  past_due: { backgroundColor: 'rgba(249,115,22,0.15)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.2)' },
  cancelled: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' },
}

const DOCUMENT_TYPES = [
  { key: 'msa', label: 'Master Services Agreement', short: 'MSA' },
  { key: 'nda', label: 'Non-Disclosure Agreement', short: 'NDA' },
  { key: 'dpa', label: 'Data Processing Agreement', short: 'DPA' },
  { key: 'tos', label: 'Terms of Service', short: 'ToS' },
]

const PIE_COLORS = ['#F3D840', '#C084FC', '#60A5FA']

// ──────────────────────────── Types ────────────────────────────
interface InstallerRow {
  id: string; companyName: string; contactName: string; contactEmail: string | null
  contactPhone: string | null; plan: string; subscriptionStatus: string
  onboardingStep: number; onboardingComplete: boolean; counties: string[]
  equipmentCategories: string[]; seaiRegistered: boolean; reciRegistered: boolean
  teamSize: number | null; avgProjectValue: number | null; createdAt: string
  mrr: number | null
}

interface InstallerDetail extends InstallerRow {
  website: string | null; address: string | null; city: string | null
  county: string | null; eircode: string | null; seaiNumber: string | null
  reciNumber: string | null; yearsInBusiness: number | null; electricians: number | null
  vans: number | null; specializations: string[]
  equipment: Array<{ id: string; category: string; brand: string; model: string | null }>
  documents: Array<{ type: string; signed: boolean; signedAt: string | null; documentUrl: string | null }>
  subscription: { plan: string; status: string; billingCycle: string; currentPeriodStart: string | null; currentPeriodEnd: string | null; mrr: number } | null
  leadPreferences: { maxLeadsPerMonth: number | null; minValue: number | null; responseTimeHours: number | null; travelRadiusKm: number | null } | null
  integrations: Array<{ provider: string; connected: boolean; connectedAt: string | null }>
  description: string | null
}

type ViewMode = 'grid' | 'table' | 'map'
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'mrr_high' | 'mrr_low'

// ──────────────────────────── Custom Hook: Responsive ────────────────────────────
function useMediaQuery(query: string) {
  const subscribe = useCallback((callback: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
  }, [query])
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  const getServerSnapshot = useCallback(() => false, [])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// ──────────────────────────── Helper Components ────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const colors = PLAN_COLORS[plan.toLowerCase()] || PLAN_COLORS.starter
  return <Badge variant="outline" style={{ ...colors, fontSize: 11, fontWeight: 600 }}>{PLAN_LABELS[plan.toLowerCase()] || plan}</Badge>
}

function SubscriptionBadge({ status }: { status: string }) {
  const colors = SUBSCRIPTION_COLORS[status.toLowerCase()] || SUBSCRIPTION_COLORS.active
  return <Badge variant="outline" style={{ ...colors, fontSize: 11, fontWeight: 500 }}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
}

function CertificationBadge({ label, registered }: { label: string; registered: boolean }) {
  return (
    <Badge variant="outline" style={registered ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#4ADE80', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, fontWeight: 500 } : { backgroundColor: '#1A1A1A', color: '#A0A0A0', border: '1px solid #2A2A2A', fontSize: 11, fontWeight: 500 }}>
      {registered ? <CheckCircle2 style={{ width: 12, height: 12, marginRight: 4 }} /> : <AlertTriangle style={{ width: 12, height: 12, marginRight: 4 }} />}
      {label}
    </Badge>
  )
}

// ──────────────────────────── Health Score Ring ────────────────────────────
function HealthScoreRing({ score }: { score: number }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const colour = score >= 80 ? '#34D399' : score >= 50 ? '#F3D840' : '#F87171'

  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r={radius} fill="none" stroke="#222222" strokeWidth="4" />
        <circle cx="26" cy="26" r={radius} fill="none" stroke={colour} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{score}</span>
    </div>
  )
}

function computeHealthScore(installer: InstallerRow): number {
  let score = 0
  if (installer.onboardingComplete) score += 30
  else score += Math.round((installer.onboardingStep / 10) * 30)
  if (installer.subscriptionStatus === 'active') score += 30
  else if (installer.subscriptionStatus === 'trialing') score += 20
  else if (installer.subscriptionStatus === 'past_due') score += 10
  if (installer.seaiRegistered) score += 20
  if (installer.reciRegistered) score += 10
  if (installer.teamSize && installer.teamSize > 2) score += 5
  if (installer.counties.length > 2) score += 5
  return Math.min(100, score)
}

// ──────────────────────────── Empty State ────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 20px', textAlign: 'center', minHeight: 400,
      }}
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' as const }}
        style={{
          width: 96, height: 96, borderRadius: '50%', marginBottom: 32,
          background: 'radial-gradient(circle, rgba(243,216,64,0.25) 0%, rgba(243,216,64,0.05) 70%, transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Sun style={{ width: 48, height: 48, color: '#F3D840' }} />
      </motion.div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>No installers found</h3>
      <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}>
        Get started by adding your first solar installer. They&apos;ll appear here once created and can be managed through this portal.
      </p>
      <button
        onClick={onCreate}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
          backgroundColor: '#F3D840', color: '#0A0A0A', fontWeight: 600, fontSize: 14,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E5C832'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F3D840'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        <Plus style={{ width: 18, height: 18 }} />
        Add Your First Installer
      </button>
    </motion.div>
  )
}

// ──────────────────────────── Multi-Step Create Dialog ────────────────────────────
const CREATE_STEPS = ['Company', 'Contact', 'Territory & Certs', 'Plan']

function CreateInstallerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('starter')
  const [seaiNumber, setSeaiNumber] = useState('')
  const [reciNumber, setReciNumber] = useState('')
  const [selectedCounties, setSelectedCounties] = useState<string[]>([])

  const toggleCounty = (county: string) => {
    setSelectedCounties(prev => prev.includes(county) ? prev.filter(c => c !== county) : [...prev, county])
  }

  const resetForm = useCallback(() => {
    setStep(0); setCompanyName(''); setContactName(''); setPhone('')
    setEmail(''); setPlan('starter'); setSeaiNumber(''); setReciNumber('')
    setSelectedCounties([])
  }, [])

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/installers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create installer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installers'] })
      queryClient.invalidateQueries({ queryKey: ['installer-stats'] })
      resetForm(); onOpenChange(false)
      toast.success('Installer created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const validateStep = (): boolean => {
    if (step === 0 && !companyName.trim()) { toast.error('Company name is required'); return false }
    if (step === 1 && !contactName.trim()) { toast.error('Contact name is required'); return false }
    return true
  }

  const nextStep = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)) }
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = () => {
    if (!companyName.trim()) { toast.error('Company name is required'); return }
    if (!contactName.trim()) { toast.error('Contact name is required'); return }
    mutation.mutate({ companyName, contactName, phone: phone || null, email: email || null, plan, seaiNumber: seaiNumber || null, reciNumber: reciNumber || null, counties: selectedCounties })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) resetForm(); onOpenChange(v) }}>
      <DialogContent style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <DialogHeader style={{ paddingBottom: 0 }}>
          <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>New Installer</DialogTitle>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Add a new solar installation company to your network</p>
        </DialogHeader>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '20px 0 0' }}>
          {CREATE_STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, transition: 'all 0.3s ease',
                  backgroundColor: i <= step ? '#F3D840' : '#222222',
                  color: i <= step ? '#0A0A0A' : '#6B7280',
                  boxShadow: i === step ? '0 0 16px rgba(243,216,64,0.3)' : 'none',
                }}>
                  {i < step ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i <= step ? '#D1D5DB' : '#6B7280', marginTop: 6, fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < 3 && (
                <div style={{ flex: 1, height: 2, backgroundColor: i < step ? '#F3D840' : '#222222', margin: '0 4px', marginBottom: 18, transition: 'background-color 0.3s ease' }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', paddingTop: 20 }}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 8, display: 'block' }}>Company Name *</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. SolarTech Ireland Ltd" />
                </div>
                <div>
                  <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 8, display: 'block' }}>Website (optional)</Label>
                  <Input value={''} onChange={() => {}} placeholder="https://solartech.ie" />
                </div>
                <div>
                  <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 8, display: 'block' }}>Description (optional)</Label>
                  <textarea value={''} onChange={() => {}} placeholder="Brief description of the company..." rows={3} style={{
                    width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8,
                    padding: '10px 14px', color: '#FFFFFF', fontSize: 14, resize: 'vertical', outline: 'none',
                    lineHeight: 1.5, fontFamily: 'inherit',
                  }} />
                </div>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 8, display: 'block' }}>Full Name *</Label>
                  <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Smith" />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 8, display: 'block' }}>Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.ie" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 8, display: 'block' }}>Phone</Label>
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+353 1 234 5678" />
                  </div>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 8, display: 'block' }}>SEAI Number</Label>
                    <Input value={seaiNumber} onChange={e => setSeaiNumber(e.target.value)} placeholder="SEAI registration number" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 8, display: 'block' }}>RECI Number</Label>
                    <Input value={reciNumber} onChange={e => setReciNumber(e.target.value)} placeholder="RECI registration number" />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB' }}>Service Territory</Label>
                    <Badge variant="secondary" style={{ fontSize: 11 }}>{selectedCounties.length} selected</Badge>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, maxHeight: 200, overflow: 'auto', padding: 12, backgroundColor: '#1A1A1A', borderRadius: 8, border: '1px solid #2A2A2A' }}>
                    {IRELAND_COUNTIES.map(county => (
                      <label key={county} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                        borderRadius: 6, fontSize: 12, cursor: 'pointer', transition: 'background-color 0.15s ease',
                        backgroundColor: selectedCounties.includes(county) ? 'rgba(243,216,64,0.15)' : 'transparent',
                        color: selectedCounties.includes(county) ? '#d4b428' : '#A0A0A0',
                        fontWeight: selectedCounties.includes(county) ? 600 : 400,
                      }}>
                        <Checkbox checked={selectedCounties.includes(county)} onCheckedChange={() => toggleCounty(county)} style={{ width: 14, height: 14 }} />
                        {county}
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <Label style={{ fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 10, display: 'block' }}>Select Plan</Label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {(['starter', 'pro', 'enterprise'] as const).map(p => (
                      <div key={p} onClick={() => setPlan(p)} style={{
                        flex: 1, padding: 20, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s ease',
                        backgroundColor: plan === p ? 'rgba(243,216,64,0.1)' : '#1A1A1A',
                        border: plan === p ? '2px solid #F3D840' : '1px solid #2A2A2A',
                        textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: plan === p ? '#F3D840' : '#FFFFFF', marginBottom: 4 }}>{PLAN_LABELS[p]}</p>
                        <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF' }}>€{PLAN_PRICING[p]}</p>
                        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>per month</p>
                        {p === 'enterprise' && <Badge variant="outline" style={{ marginTop: 8, fontSize: 10, backgroundColor: 'rgba(168,85,247,0.15)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.2)' }}>Popular</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter style={{ gap: 8, paddingTop: 16, borderTop: '1px solid #2A2A2A' }}>
          {step > 0 && (
            <Button variant="outline" onClick={prevStep}>Back</Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step < 3 ? (
            <Button onClick={nextStep} style={{ backgroundColor: '#F3D840', color: '#0A0A0A', fontWeight: 600 }}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={mutation.isPending} style={{ backgroundColor: '#F3D840', color: '#0A0A0A', fontWeight: 600 }}>
              {mutation.isPending ? 'Creating...' : 'Create Installer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────── Detail Panel ────────────────────────────
function InstallerDetailPanel({ installerId, onClose }: { installerId: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['installer-detail', installerId],
    queryFn: () => fetch(`/api/crm/installers/${installerId}`).then(r => r.json()),
    enabled: !!installerId, retry: 1,
  })

  const installer: InstallerDetail | null = data?.installer || null

  if (isLoading) {
    return (
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ position: 'fixed', top: 0, bottom: 0, right: 0, width: '100%', maxWidth: 640, backgroundColor: '#141414', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6B7280' }}>
          <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
          <span>Loading profile...</span>
        </div>
      </motion.div>
    )
  }

  if (!installer) {
    return isError ? (
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ position: 'fixed', top: 0, bottom: 0, right: 0, width: '100%', maxWidth: 640, backgroundColor: '#141414', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle style={{ width: 32, height: 32, margin: '0 auto 12px', color: '#F87171' }} />
          <p style={{ fontSize: 14, color: '#A0A0A0' }}>Failed to load installer profile</p>
          <button onClick={onClose} style={{ marginTop: 16, fontSize: 13, fontWeight: 500, color: '#F3D840', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Go back</button>
        </div>
      </motion.div>
    ) : null
  }

  const healthScore = computeHealthScore(installer)
  const progressPercent = Math.round((installer.onboardingStep / 10) * 100)

  // Performance data not yet available via API — sections will show placeholder state
  const monthlyInstalls: Array<{ month: string; installs: number }> = []
  const leadFunnel: Array<{ stage: string; value: number }> = []
  const revenueTrend: Array<{ month: string; revenue: number }> = []
  const mockActivity: Array<{ id: string; type: string; message: string; time: string; icon: React.ElementType }> = []

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px', fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'pointer',
    color: isActive ? '#F3D840' : '#9CA3AF', backgroundColor: 'transparent', border: 'none',
    borderBottom: isActive ? '2px solid #F3D840' : '2px solid transparent',
    transition: 'all 0.2s ease', whiteSpace: 'nowrap',
  })

  const sendReminder = (docShort: string) => toast.success(`Reminder sent for ${docShort}`)

  const sectionTitle = { fontSize: 13, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 16 }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ position: 'fixed', top: 0, bottom: 0, right: 0, width: '100%', maxWidth: 640, backgroundColor: '#141414', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #2A2A2A', padding: '28px 32px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={onClose} style={{ padding: 6, borderRadius: 8, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222222'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <X style={{ width: 20, height: 20, color: '#A0A0A0' }} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(243,216,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 style={{ width: 26, height: 26, color: '#F3D840' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{installer.companyName}</h2>
                <HealthScoreRing score={healthScore} />
              </div>
              <p style={{ fontSize: 14, color: '#A0A0A0', margin: 0 }}>{installer.contactName}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <PlanBadge plan={installer.plan} />
                {installer.subscription && <SubscriptionBadge status={installer.subscription.status} />}
                <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, backgroundColor: installer.onboardingComplete ? 'rgba(16,185,129,0.12)' : 'rgba(202,138,4,0.12)', color: installer.onboardingComplete ? '#4ADE80' : '#FACC15', border: `1px solid ${installer.onboardingComplete ? 'rgba(16,185,129,0.2)' : 'rgba(202,138,4,0.2)'}` }}>
                  {installer.onboardingComplete ? '✓ Onboarded' : `${installer.onboardingStep}/10`}
                </span>
                {installer.mrr != null && <span style={{ fontSize: 13, fontWeight: 600, color: '#4ADE80' }}>{formatCurrency(installer.mrr)}/mo</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2A2A2A', flexShrink: 0, overflow: 'auto' }}>
          {['overview', 'performance', 'documents', 'activity'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}
              onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = '#D1D5DB' }}
              onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = '#9CA3AF' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <ScrollArea style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '28px 32px' }}>
                {/* Company Info */}
                <div style={{ ...sectionTitle }}>Company Info</div>
                {!installer.description && !installer.website && !installer.address ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 10, backgroundColor: '#1A1A1A', marginBottom: 24 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 style={{ width: 18, height: 18, color: '#A0A0A0' }} /></div>
                    <div><p style={{ fontSize: 13, color: '#A0A0A0', margin: 0 }}>No company details added yet</p><p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>Available during onboarding</p></div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {installer.description && <p style={{ fontSize: 14, color: '#A0A0A0', lineHeight: 1.6, margin: 0 }}>{installer.description}</p>}
                    {installer.website && <InfoRow icon={<Globe style={{ width: 16, height: 16, color: '#60A5FA' }} />} iconBg="rgba(59,130,246,0.12)" label="Website" value={installer.website} />}
                    {(installer.address || installer.city) && <InfoRow icon={<MapPin style={{ width: 16, height: 16, color: '#FB923C' }} />} iconBg="rgba(249,115,22,0.12)" label="Address" value={[installer.address, installer.city, installer.eircode].filter(Boolean).join(', ')} />}
                  </div>
                )}

                {/* Contact */}
                <div style={{ ...sectionTitle }}>Contact</div>
                <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InfoRow icon={<Users style={{ width: 16, height: 16, color: '#A0A0A0' }} />} iconBg="#222222" label="Primary Contact" value={installer.contactName} />
                  {installer.contactEmail && <InfoRow icon={<Mail style={{ width: 16, height: 16, color: '#60A5FA' }} />} iconBg="rgba(59,130,246,0.12)" label="Email" value={installer.contactEmail} />}
                  {installer.contactPhone && <InfoRow icon={<Phone style={{ width: 16, height: 16, color: '#34D399' }} />} iconBg="rgba(16,185,129,0.12)" label="Phone" value={installer.contactPhone} />}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <CertificationBadge label={`SEAI${installer.seaiNumber ? ` #${installer.seaiNumber}` : ''}`} registered={installer.seaiRegistered} />
                    <CertificationBadge label={`RECI${installer.reciNumber ? ` #${installer.reciNumber}` : ''}`} registered={installer.reciRegistered} />
                  </div>
                </div>

                {/* Territory */}
                {installer.counties.length > 0 && (
                  <>
                    <div style={{ ...sectionTitle }}>Territory ({installer.counties.length} counties)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                      {installer.counties.map(county => (
                        <span key={county} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, color: '#D1D5DB', backgroundColor: 'rgba(243,216,64,0.08)', border: '1px solid rgba(243,216,64,0.15)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin style={{ width: 12, height: 12 }} />{county}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Subscription */}
                {installer.subscription && (
                  <>
                    <div style={{ ...sectionTitle }}>Subscription</div>
                    <div style={{ padding: 20, borderRadius: 12, backgroundColor: '#1A1A1A', marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PlanBadge plan={installer.subscription.plan} />
                            <SubscriptionBadge status={installer.subscription.status} />
                          </div>
                          <p style={{ fontSize: 12, color: '#A0A0A0', marginTop: 6 }}>{formatCurrency(PLAN_PRICING[installer.subscription.plan] || 0)}/mo · Billed {installer.subscription.billingCycle}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{formatCurrency(installer.subscription.mrr)}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>MRR</p>
                        </div>
                      </div>
                      {installer.subscription.currentPeriodStart && installer.subscription.currentPeriodEnd && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#A0A0A0', marginTop: 12 }}>
                          <Calendar style={{ width: 13, height: 13 }} />
                          {format(new Date(installer.subscription.currentPeriodStart), 'MMM d, yyyy')} — {format(new Date(installer.subscription.currentPeriodEnd), 'MMM d, yyyy')}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button onClick={() => toast.success(`Upgraded ${installer.companyName} to next plan`)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, backgroundColor: 'rgba(243,216,64,0.12)', color: '#F3D840', border: '1px solid rgba(243,216,64,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s ease' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(243,216,64,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(243,216,64,0.12)'}>
                          Upgrade Plan
                        </button>
                        <button onClick={() => toast.info(`Downgrade request sent for ${installer.companyName}`)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, backgroundColor: '#1A1A1A', color: '#A0A0A0', border: '1px solid #2A2A2A', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.15s ease' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#3A3A3A'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2A2A'}>
                          Downgrade
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Business Capacity */}
                <div style={{ ...sectionTitle }}>Business Capacity</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: <Clock style={{ width: 14, height: 14 }} />, label: 'Years in Business', value: installer.yearsInBusiness },
                    { icon: <Users style={{ width: 14, height: 14 }} />, label: 'Team Size', value: installer.teamSize },
                    { icon: <Shield style={{ width: 14, height: 14 }} />, label: 'Electricians', value: installer.electricians },
                    { icon: <Truck style={{ width: 14, height: 14 }} />, label: 'Vans', value: installer.vans },
                  ].map(item => (
                    <div key={item.label} style={{ padding: 14, borderRadius: 10, backgroundColor: '#1A1A1A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#6B7280' }}>{item.icon}<span style={{ fontSize: 11 }}>{item.label}</span></div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{item.value ?? '—'}</p>
                    </div>
                  ))}
                </div>
                {installer.specializations.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {installer.specializations.map(s => (
                      <Badge key={s} variant="outline" style={{ backgroundColor: 'rgba(168,85,247,0.12)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.2)', fontSize: 11 }}>
                        <Star style={{ width: 12, height: 12, marginRight: 4 }} />{SPECIALIZATION_LABELS[s] || s}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Lead Preferences */}
                {installer.leadPreferences && (
                  <>
                    <div style={{ ...sectionTitle, marginTop: 24 }}>Lead Preferences</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <PrefRow icon={<Hash style={{ width: 14, height: 14 }} />} label="Max leads/mo" value={installer.leadPreferences.maxLeadsPerMonth?.toString() || '—'} />
                      <PrefRow icon={<DollarSign style={{ width: 14, height: 14 }} />} label="Min value" value={installer.leadPreferences.minValue ? formatCurrency(installer.leadPreferences.minValue) : '—'} />
                      <PrefRow icon={<Clock style={{ width: 14, height: 14 }} />} label="Response time" value={installer.leadPreferences.responseTimeHours ? `${installer.leadPreferences.responseTimeHours}h` : '—'} />
                      <PrefRow icon={<MapPin style={{ width: 14, height: 14 }} />} label="Travel radius" value={installer.leadPreferences.travelRadiusKm ? `${installer.leadPreferences.travelRadiusKm}km` : '—'} />
                    </div>
                  </>
                )}

                {/* Integrations */}
                {installer.integrations.length > 0 && (
                  <>
                    <div style={{ ...sectionTitle, marginTop: 24 }}>Integrations</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {installer.integrations.map(int => (
                        <div key={int.provider} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, backgroundColor: '#1A1A1A' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: int.connected ? 'rgba(16,185,129,0.12)' : '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Link2 style={{ width: 16, height: 16, color: int.connected ? '#34D399' : '#9CA3AF' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF', margin: 0, textTransform: 'capitalize' }}>{int.provider.replace(/_/g, ' ')}</p>
                            {int.connectedAt && <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>Connected {format(new Date(int.connectedAt), 'MMM d, yyyy')}</p>}
                          </div>
                          <Badge variant="outline" style={int.connected ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#4ADE80', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11 } : { backgroundColor: '#1A1A1A', color: '#A0A0A0', border: '1px solid #2A2A2A', fontSize: 11 }}>
                            {int.connected ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'performance' && (
              <motion.div key="performance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '28px 32px' }}>
                <div style={{ ...sectionTitle }}>Monthly Installs</div>
                {monthlyInstalls.length > 0 ? (
                  <div style={{ height: 200, marginBottom: 28 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyInstalls}>
                        <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#2A2A2A' }} tickLine={false} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', fontSize: 13 }} />
                        <Bar dataKey="installs" fill="#F3D840" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: 120, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>No installation data available yet</p>
                      <p style={{ fontSize: 11, color: '#4B5563', margin: '4px 0 0' }}>Performance metrics will appear once installs are tracked</p>
                    </div>
                  </div>
                )}

                <div style={{ ...sectionTitle }}>Lead Conversion Funnel</div>
                {leadFunnel.length > 0 ? (
                  <div style={{ marginBottom: 28 }}>
                    {leadFunnel.map((item, i) => (
                      <div key={item.stage} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 500 }}>{item.stage}</span>
                          <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700 }}>{item.value}</span>
                        </div>
                        <div style={{ height: 8, backgroundColor: '#222222', borderRadius: 100, overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / leadFunnel[0].value) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.1 }}
                            style={{ height: '100%', borderRadius: 100, background: `linear-gradient(90deg, ${PIE_COLORS[i % 3]}, ${PIE_COLORS[(i + 1) % 3]}55)` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ height: 80, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>No lead funnel data available</p>
                  </div>
                )}

                <div style={{ ...sectionTitle }}>Revenue Trend</div>
                {revenueTrend.length > 0 ? (
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrend}>
                        <defs><linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F3D840" stopOpacity={0.3} /><stop offset="100%" stopColor="#F3D840" stopOpacity={0} /></linearGradient></defs>
                        <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#2A2A2A' }} tickLine={false} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', fontSize: 13 }} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#F3D840" strokeWidth={2} fill="url(#revenueGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>No revenue trend data available yet</p>
                  </div>
                )}

                {/* Onboarding progress */}
                <div style={{ ...sectionTitle, marginTop: 28 }}>Onboarding Progress</div>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: '#1A1A1A' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#A0A0A0' }}>Step {installer.onboardingStep} of 10</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: installer.onboardingComplete ? '#4ADE80' : '#F3D840' }}>{progressPercent}%</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: '#222222', borderRadius: 100, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.8 }}
                      style={{ height: '100%', borderRadius: 100, background: installer.onboardingComplete ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #F3D840, #FACC15)' }} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div key="documents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '28px 32px' }}>
                <div style={{ ...sectionTitle }}>Legal Documents</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {DOCUMENT_TYPES.map(doc => {
                    const docData = installer.documents?.find(d => d.type === doc.key)
                    const signed = docData?.signed ?? false
                    return (
                      <div key={doc.key} style={{ padding: 16, borderRadius: 12, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', transition: 'border-color 0.2s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: signed ? 'rgba(16,185,129,0.12)' : '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText style={{ width: 18, height: 18, color: signed ? '#34D399' : '#9CA3AF' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', margin: 0 }}>{doc.short}</p>
                            <p style={{ fontSize: 11, color: signed ? '#34D399' : '#9CA3AF', margin: 0 }}>
                              {signed ? (docData?.signedAt ? `Signed ${format(new Date(docData.signedAt), 'MMM d, yyyy')}` : 'Signed') : 'Unsigned'}
                            </p>
                          </div>
                          {signed && <CheckCircle2 style={{ width: 18, height: 18, color: '#34D399' }} />}
                        </div>
                        {!signed && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => toast.success(`Upload initiated for ${doc.short}`)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, backgroundColor: '#222222', color: '#D1D5DB', border: '1px solid #2A2A2A', cursor: 'pointer', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'border-color 0.15s ease' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = '#3A3A3A'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2A2A'}>
                              <Upload style={{ width: 12, height: 12 }} />Upload
                            </button>
                            <button onClick={() => sendReminder(doc.short)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, backgroundColor: 'rgba(243,216,64,0.12)', color: '#F3D840', border: '1px solid rgba(243,216,64,0.2)', cursor: 'pointer', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'background-color 0.15s ease' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(243,216,64,0.2)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(243,216,64,0.12)'}>
                              <Bell style={{ width: 12, height: 12 }} />Remind
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '28px 32px' }}>
                <div style={{ ...sectionTitle }}>Recent Activity</div>
                {mockActivity.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {mockActivity.map((item, i) => {
                      const Icon = item.icon
                      const iconColours: Record<string, string> = { install: '#F3D840', lead: '#60A5FA', document: '#C084FC', subscription: '#34D399', certification: '#FB923C' }
                      return (
                        <div key={item.id} style={{ display: 'flex', gap: 16, paddingBottom: i < mockActivity.length - 1 ? 20 : 0, position: 'relative' }}>
                          {i < mockActivity.length - 1 && (
                            <div style={{ position: 'absolute', left: 17, top: 36, bottom: 0, width: 1, backgroundColor: '#2A2A2A' }} />
                          )}
                          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${iconColours[item.type]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                            <Icon style={{ width: 16, height: 16, color: iconColours[item.type] }} />
                          </div>
                          <div style={{ flex: 1, paddingTop: 2 }}>
                            <p style={{ fontSize: 14, color: '#D1D5DB', margin: 0, lineHeight: 1.4 }}>{item.message}</p>
                            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, marginTop: 4 }}>{item.time}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>No activity recorded yet</p>
                      <p style={{ fontSize: 11, color: '#4B5563', margin: '4px 0 0' }}>Activity will appear as the installer is managed</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </motion.div>
    </>
  )
}

function InfoRow({ icon, iconBg, label, value }: { icon: ReactNode; iconBg: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 14, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
        <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{label}</p>
      </div>
    </div>
  )
}

function PrefRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#6B7280' }}>{icon}</span>
      <span style={{ fontSize: 13, color: '#A0A0A0' }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>{value}</span>
    </div>
  )
}

// ──────────────────────────── Installer Card ────────────────────────────
function InstallerCard({ installer, index, onView }: { installer: InstallerRow; index: number; onView: () => void }) {
  const [hovered, setHovered] = useState(false)
  const progressPercent = Math.round((installer.onboardingStep / 10) * 100)
  const healthScore = computeHealthScore(installer)

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' as const }} whileHover={{ y: -4 }} style={{ height: '100%' }}>
      <div
        onClick={onView} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: '#1A1A1A', border: `1px solid ${hovered ? 'rgba(243,216,64,0.3)' : '#2A2A2A'}`,
          borderLeft: hovered ? '3px solid #F3D840' : '1px solid #2A2A2A', borderRadius: 16, cursor: 'pointer',
          height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: hovered ? '0 16px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(243,216,64,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative',
        }}
      >
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          {/* Top row: Health + Company + Plan */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <HealthScoreRing score={healthScore} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{installer.companyName}</h3>
                <div style={{ flexShrink: 0 }}><PlanBadge plan={installer.plan} /></div>
              </div>
              <div style={{ height: 2, width: 28, backgroundColor: 'rgba(243,216,64,0.3)', borderRadius: 2, marginTop: 6, marginBottom: 6 }} />
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{installer.contactName}</p>
            </div>
          </div>

          {/* Status + MRR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SubscriptionBadge status={installer.subscriptionStatus} />
              <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, backgroundColor: installer.onboardingComplete ? 'rgba(16,185,129,0.12)' : 'rgba(202,138,4,0.12)', color: installer.onboardingComplete ? '#4ADE80' : '#FACC15', border: `1px solid ${installer.onboardingComplete ? 'rgba(16,185,129,0.2)' : 'rgba(202,138,4,0.2)'}` }}>
                {installer.onboardingComplete ? '✓ Onboarded' : `${installer.onboardingStep}/10`}
              </span>
            </div>
            {installer.mrr != null && (
              <span style={{ fontSize: 14, fontWeight: 700, color: '#4ADE80' }}>{formatCurrency(installer.mrr)}<span style={{ fontSize: 11, fontWeight: 400, color: '#6B7280' }}>/mo</span></span>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Onboarding</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#D1D5DB' }}>{progressPercent}%</span>
            </div>
            <div style={{ height: 5, width: '100%', backgroundColor: '#222222', borderRadius: 100, overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', borderRadius: 100, background: installer.onboardingComplete ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #F3D840, #FACC15)' }}
                initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.7, delay: index * 0.04 + 0.2, ease: 'easeOut' as const }} />
            </div>
          </div>

          {/* Territory */}
          {installer.counties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {installer.counties.slice(0, 3).map(c => (
                <span key={c} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, color: '#D1D5DB', backgroundColor: 'rgba(243,216,64,0.08)', border: '1px solid rgba(243,216,64,0.12)' }}>{c}</span>
              ))}
              {installer.counties.length > 3 && <span style={{ fontSize: 11, padding: '4px 8px', color: '#6B7280' }}>+{installer.counties.length - 3}</span>}
            </div>
          )}

          {/* Last active */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
            <Clock style={{ width: 12, height: 12 }} />Active {timeAgo(installer.createdAt)}
          </div>
        </div>

        {/* Hover quick actions */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 28px',
          backgroundColor: 'linear-gradient(0deg, #1A1A1A 60%, transparent)',
          display: 'flex', justifyContent: 'flex-end', gap: 6,
          opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.25s ease', pointerEvents: hovered ? 'auto' : 'none',
        }}>
          {[{ icon: Mail, label: 'Email' }, { icon: Phone, label: 'Call' }, { icon: Eye, label: 'View' }].map(action => (
            <button key={action.label} onClick={e => { e.stopPropagation(); onView(); toast.info(`${action.label} action for ${installer.companyName}`) }}
              style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#222222', border: '1px solid #2A2A2A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(243,216,64,0.15)'; e.currentTarget.style.borderColor = 'rgba(243,216,64,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#222222'; e.currentTarget.style.borderColor = '#2A2A2A' }}>
              <action.icon style={{ width: 14, height: 14, color: '#D1D5DB' }} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ──────────────────────────── Table View ────────────────────────────
function InstallerTableView({ installers, sortField, sortDir, onSort, onView }: {
  installers: InstallerRow[]; sortField: string; sortDir: 'asc' | 'desc'; onSort: (field: string) => void; onView: (id: string) => void
}) {
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown style={{ width: 14, height: 14, color: '#6B7280', marginLeft: 4 }} />
    return sortDir === 'asc' ? <ArrowUp style={{ width: 14, height: 14, color: '#F3D840', marginLeft: 4 }} /> : <ArrowDown style={{ width: 14, height: 14, color: '#F3D840', marginLeft: 4 }} />
  }

  const columns = [
    { key: 'companyName', label: 'Company', sortable: true },
    { key: 'contactName', label: 'Contact', sortable: true },
    { key: 'plan', label: 'Plan', sortable: false },
    { key: 'subscriptionStatus', label: 'Subscription', sortable: false },
    { key: 'onboardingStep', label: 'Onboarding', sortable: true },
    { key: 'counties', label: 'Territory', sortable: false },
    { key: 'mrr', label: 'MRR', sortable: true },
    { key: 'certifications', label: 'Certs', sortable: false },
    { key: 'actions', label: '', sortable: false },
  ]

  return (
    <div style={{ backgroundColor: '#1A1A1A', borderRadius: 12, border: '1px solid #2A2A2A', overflow: 'hidden' }}>
      <Table>
        <TableHeader>
          <TableRow style={{ borderBottom: '1px solid #2A2A2A' }}>
            {columns.map(col => (
              <TableHead key={col.key} style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', backgroundColor: '#141414', padding: '14px 12px', whiteSpace: 'nowrap', borderBottom: '1px solid #2A2A2A' }}>
                {col.sortable ? (
                  <button onClick={() => onSort(col.key)} style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12, fontWeight: 600, gap: 0 }}>
                    {col.label}<SortIcon field={col.key} />
                  </button>
                ) : col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {installers.map((installer, i) => {
            const progressPercent = Math.round((installer.onboardingStep / 10) * 100)
            return (
              <TableRow key={installer.id} onClick={() => onView(installer.id)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #1F1F1F', transition: 'background-color 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(243,216,64,0.04)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <TableCell style={{ padding: '14px 12px' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', margin: 0 }}>{installer.companyName}</p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: 0, marginTop: 2 }}>{timeAgo(installer.createdAt)}</p>
                  </div>
                </TableCell>
                <TableCell style={{ padding: '14px 12px' }}>
                  <p style={{ fontSize: 13, color: '#D1D5DB', margin: 0 }}>{installer.contactName}</p>
                  {installer.contactEmail && <p style={{ fontSize: 11, color: '#6B7280', margin: 0, marginTop: 2 }}>{installer.contactEmail}</p>}
                </TableCell>
                <TableCell style={{ padding: '14px 12px' }}><PlanBadge plan={installer.plan} /></TableCell>
                <TableCell style={{ padding: '14px 12px' }}><SubscriptionBadge status={installer.subscriptionStatus} /></TableCell>
                <TableCell style={{ padding: '14px 12px', minWidth: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, backgroundColor: '#222222', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 100, background: installer.onboardingComplete ? '#10B981' : '#F3D840', transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#D1D5DB', flexShrink: 0 }}>{progressPercent}%</span>
                  </div>
                </TableCell>
                <TableCell style={{ padding: '14px 12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {installer.counties.slice(0, 2).map(c => <span key={c} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, color: '#D1D5DB', backgroundColor: '#222222' }}>{c}</span>)}
                    {installer.counties.length > 2 && <span style={{ fontSize: 11, color: '#6B7280' }}>+{installer.counties.length - 2}</span>}
                  </div>
                </TableCell>
                <TableCell style={{ padding: '14px 12px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: installer.mrr ? '#4ADE80' : '#6B7280' }}>{installer.mrr ? formatCurrency(installer.mrr) : '—'}</span>
                </TableCell>
                <TableCell style={{ padding: '14px 12px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: installer.seaiRegistered ? 'rgba(16,185,129,0.12)' : '#222222', color: installer.seaiRegistered ? '#4ADE80' : '#6B7280', fontWeight: 600 }}>SEAI</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: installer.reciRegistered ? 'rgba(59,130,246,0.12)' : '#222222', color: installer.reciRegistered ? '#60A5FA' : '#6B7280', fontWeight: 600 }}>RECI</span>
                  </div>
                </TableCell>
                <TableCell style={{ padding: '14px 12px', textAlign: 'right' }}>
                  <button onClick={e => { e.stopPropagation(); onView(installer.id) }} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222222'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <MoreHorizontal style={{ width: 16, height: 16, color: '#A0A0A0' }} />
                  </button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// ──────────────────────────── Map View (Ireland SVG) ────────────────────────────
function MapView({ installers }: { installers: InstallerRow[] }) {
  const countyCounts: Record<string, number> = {}
  installers.forEach(inst => {
    inst.counties.forEach(c => { countyCounts[c] = (countyCounts[c] || 0) + 1 })
  })
  const maxCount = Math.max(...Object.values(countyCounts), 1)

  return (
    <div style={{ backgroundColor: '#1A1A1A', borderRadius: 16, border: '1px solid #2A2A2A', padding: 32, position: 'relative', minHeight: 500 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Territory Coverage</h3>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, marginTop: 4 }}>Installer distribution across Ireland</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F3D840' }} />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(243,216,64,0.4)' }} />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Low</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2A2A2A' }} />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>None</span>
          </div>
        </div>
      </div>
      <svg viewBox="0 0 500 550" style={{ width: '100%', maxHeight: 420 }}>
        {/* Simplified Ireland outline */}
        <path d="M180,60 C200,40 240,35 270,50 C300,65 320,80 340,70 C360,60 370,70 380,90 C390,110 400,130 390,160 C380,190 370,210 380,240 C390,270 400,290 390,320 C380,350 370,370 360,400 C350,430 340,450 320,470 C300,490 280,500 260,510 C240,520 220,520 200,510 C180,500 160,480 140,460 C120,440 100,420 90,390 C80,360 70,330 80,300 C90,270 100,240 90,210 C80,180 70,150 80,120 C90,90 110,70 130,60 C150,50 170,55 180,60Z"
          fill="#141414" stroke="#2A2A2A" strokeWidth="2" />
        {/* Province labels */}
        <text x="200" y="150" fill="#333" fontSize="12" fontWeight="600">ULSTER</text>
        <text x="240" y="280" fill="#333" fontSize="12" fontWeight="600">LEINSTER</text>
        <text x="140" y="300" fill="#333" fontSize="12" fontWeight="600">CONNACHT</text>
        <text x="180" y="430" fill="#333" fontSize="12" fontWeight="600">MUNSTER</text>
      </svg>
      {/* County coverage dots */}
      <div style={{ position: 'absolute', inset: 32, top: 80, pointerEvents: 'none' }}>
        {IRELAND_COUNTIES.map((county, i) => {
          const count = countyCounts[county] || 0
          if (count === 0) return null
          const intensity = count / maxCount
          const positions: Record<string, { x: number; y: number }> = {
            Dublin: { x: 62, y: 30 }, Wicklow: { x: 66, y: 36 }, Kildare: { x: 55, y: 34 }, Meath: { x: 55, y: 26 },
            Louth: { x: 60, y: 22 }, Cavan: { x: 50, y: 20 }, Monaghan: { x: 52, y: 16 }, Donegal: { x: 30, y: 8 },
            Sligo: { x: 22, y: 28 }, Leitrim: { x: 32, y: 28 }, Roscommon: { x: 35, y: 38 },
            Mayo: { x: 18, y: 32 }, Galway: { x: 24, y: 46 }, Westmeath: { x: 46, y: 36 },
            Longford: { x: 44, y: 32 }, Offaly: { x: 46, y: 42 }, Laois: { x: 50, y: 46 },
            Tipperary: { x: 40, y: 56 }, Clare: { x: 24, y: 58 }, Limerick: { x: 32, y: 64 },
            Kerry: { x: 20, y: 76 }, Cork: { x: 34, y: 78 }, Waterford: { x: 60, y: 66 },
            Kilkenny: { x: 54, y: 54 }, Wexford: { x: 68, y: 56 }, Carlow: { x: 58, y: 50 },
          }
          const pos = positions[county]
          if (!pos) return null
          return (
            <motion.div key={county} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.03, duration: 0.3 }}
              style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}>
              <div title={`${county}: ${count} installer${count > 1 ? 's' : ''}`}
                style={{
                  width: 8 + intensity * 16, height: 8 + intensity * 16, borderRadius: '50%',
                  backgroundColor: `rgba(243,216,64,${0.3 + intensity * 0.7})`,
                  boxShadow: `0 0 ${8 + intensity * 12}px rgba(243,216,64,${0.2 + intensity * 0.3})`,
                  border: `1px solid rgba(243,216,64,${0.4 + intensity * 0.4})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <span style={{ fontSize: 8, fontWeight: 700, color: intensity > 0.5 ? '#0A0A0A' : '#D1D5DB' }}>{count}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ──────────────────────────── Advanced Filter Panel ────────────────────────────
function AdvancedFilterPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [teamSizeMin, setTeamSizeMin] = useState('')
  const [teamSizeMax, setTeamSizeMax] = useState('')
  const [certFilter, setCertFilter] = useState<string[]>([])
  const [specs, setSpecs] = useState<string[]>([])
  const [subFilter, setSubFilter] = useState('')

  const toggleCert = (c: string) => setCertFilter(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  const toggleSpec = (s: string) => setSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const specialisationOptions = ['EV Charger', 'Heat Pump', 'Rural', 'Commercial', 'Heritage']

  return (
    <div>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', transition: 'color 0.15s ease' }}
        onMouseEnter={e => e.currentTarget.style.color = '#F3D840'}
        onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
        <Filter style={{ width: 14, height: 14 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>Advanced Filters</span>
        <ChevronDown style={{ width: 14, height: 14, color: '#9CA3AF', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: 20, backgroundColor: '#141414', borderRadius: 12, border: '1px solid #2A2A2A', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Team size */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', display: 'block', marginBottom: 8 }}>Team Size Range</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input value={teamSizeMin} onChange={e => setTeamSizeMin(e.target.value)} placeholder="Min" type="number" style={{ maxWidth: 100 }} />
                  <span style={{ color: '#6B7280' }}>—</span>
                  <Input value={teamSizeMax} onChange={e => setTeamSizeMax(e.target.value)} placeholder="Max" type="number" style={{ maxWidth: 100 }} />
                </div>
              </div>

              {/* Certification */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', display: 'block', marginBottom: 8 }}>Certification</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['SEAI Only', 'RECI Only', 'Both'].map(c => (
                    <button key={c} onClick={() => toggleCert(c)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s ease',
                      backgroundColor: certFilter.includes(c) ? 'rgba(243,216,64,0.15)' : '#1A1A1A',
                      color: certFilter.includes(c) ? '#F3D840' : '#A0A0A0',
                      borderColor: certFilter.includes(c) ? 'rgba(243,216,64,0.4)' : '#2A2A2A',
                    }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialisations */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', display: 'block', marginBottom: 8 }}>Specialisation</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {specialisationOptions.map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s ease',
                      backgroundColor: specs.includes(s) ? 'rgba(243,216,64,0.15)' : '#1A1A1A',
                      color: specs.includes(s) ? '#F3D840' : '#A0A0A0',
                      borderColor: specs.includes(s) ? 'rgba(243,216,64,0.4)' : '#2A2A2A',
                    }}>
                      <Checkbox checked={specs.includes(s)} onCheckedChange={() => toggleSpec(s)} style={{ width: 14, height: 14 }} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              {/* Subscription status */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', display: 'block', marginBottom: 8 }}>Subscription Status</span>
                <div style={{ maxWidth: 200 }}>
                  <Select value={subFilter} onValueChange={setSubFilter}>
                    <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trialing">Trialing</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button onClick={() => toast.info('Advanced filters applied')} style={{ alignSelf: 'flex-start', padding: '8px 20px', borderRadius: 8, backgroundColor: '#F3D840', color: '#0A0A0A', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E5C832'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F3D840'}>
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ──────────────────────────── Main Page ────────────────────────────
export default function InstallersPage() {
  const isMd = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')

  // Filter state
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [onboardingFilter, setOnboardingFilter] = useState('')
  const [countyFilter, setCountyFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Table sort state
  const [tableSortField, setTableSortField] = useState('companyName')
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc')

  const handleTableSort = (field: string) => {
    if (tableSortField === field) {
      setTableSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setTableSortField(field)
      setTableSortDir('asc')
    }
  }

  const limit = 12

  // Fetch installers
  const { data: installerData, isLoading: loadingInstallers } = useQuery({
    queryKey: ['installers', search, planFilter, onboardingFilter, countyFilter, page, limit],
    queryFn: () => fetch(`/api/crm/installers?search=${encodeURIComponent(search)}&plan=${planFilter}&onboarding=${onboardingFilter}&county=${countyFilter}&page=${page}&limit=${limit}`).then(r => r.json()),
  })

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['installer-stats'],
    queryFn: () => fetch('/api/crm/installers/stats').then(r => r.json()),
  })

  const installers: InstallerRow[] = installerData?.installers || []
  const pagination = installerData?.pagination || { page: 1, limit, total: 0, totalPages: 0 }
  const stats = statsData
  const advanced = stats?._advanced

  // Sort installers client-side
  const sortedInstallers = useMemo(() => {
    const sorted = [...installers]
    if (viewMode === 'table') {
      sorted.sort((a, b) => {
        let cmp = 0
        const aVal = (a as unknown as Record<string, unknown>)[tableSortField]
        const bVal = (b as unknown as Record<string, unknown>)[tableSortField]
        if (typeof aVal === 'string' && typeof bVal === 'string') cmp = aVal.localeCompare(bVal)
        else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal
        return tableSortDir === 'asc' ? cmp : -cmp
      })
    } else {
      switch (sortOption) {
        case 'newest': sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
        case 'oldest': sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
        case 'name_asc': sorted.sort((a, b) => a.companyName.localeCompare(b.companyName)); break
        case 'name_desc': sorted.sort((a, b) => b.companyName.localeCompare(a.companyName)); break
        case 'mrr_high': sorted.sort((a, b) => (b.mrr || 0) - (a.mrr || 0)); break
        case 'mrr_low': sorted.sort((a, b) => (a.mrr || 0) - (b.mrr || 0)); break
      }
    }
    return sorted
  }, [installers, sortOption, viewMode, tableSortField, tableSortDir])

  // CSV export
  const exportCSV = useCallback(() => {
    if (sortedInstallers.length === 0) { toast.error('No data to export'); return }
    const headers = ['Company', 'Contact', 'Email', 'Phone', 'Plan', 'Status', 'Onboarding %', 'Counties', 'MRR', 'SEAI', 'RECI', 'Created']
    const rows = sortedInstallers.map(i => [
      i.companyName, i.contactName, i.contactEmail || '', i.contactPhone || '',
      i.plan, i.subscriptionStatus, `${Math.round((i.onboardingStep / 10) * 100)}%`,
      i.counties.join('; '), i.mrr ? `€${i.mrr}` : '',
      i.seaiRegistered ? 'Yes' : 'No', i.reciRegistered ? 'Yes' : 'No', i.createdAt,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `installers_export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success(`Exported ${sortedInstallers.length} installers to CSV`)
  }, [sortedInstallers])

  // Pie chart data
  const pieData = useMemo(() => {
    if (!stats?.plans) return []
    const p = stats.plans as Record<string, number>
    return [
      { name: 'Starter', value: p.starter || 0 },
      { name: 'Pro', value: p.pro || 0 },
      { name: 'Enterprise', value: p.enterprise || 0 },
    ].filter(d => d.value > 0)
  }, [stats])

  // Reset page when filters change (React render-time state adjustment)
  const filterKey = `${search}|${planFilter}|${onboardingFilter}|${countyFilter}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10,
    padding: '10px 14px', color: '#FFFFFF', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s ease',
  }
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'rgba(243,216,64,0.4)' }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#2A2A2A' }

  const viewToggleStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    backgroundColor: isActive ? 'rgba(243,216,64,0.15)' : 'transparent',
    color: isActive ? '#F3D840' : '#9CA3AF', border: isActive ? '1px solid rgba(243,216,64,0.3)' : '1px solid transparent',
    display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease',
  })

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>Installers</h1>
            <p style={{ fontSize: 15, color: '#9CA3AF', marginTop: 6 }}>Manage your solar installation partner network</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#F3D840', color: '#0A0A0A', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 16px rgba(243,216,64,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E5C832'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(243,216,64,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F3D840'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(243,216,64,0.2)' }}>
            <Plus style={{ width: 18, height: 18 }} />Add Installer
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: isLg ? 'repeat(6, 1fr)' : isMd ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard title="Total Installers" value={stats?.totalInstallers ?? 0} icon={Building2} delay={0} />
        <StatCard title="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} icon={CheckCircle2} delay={0.05} />
        <StatCard title="Monthly Recurring Revenue" value={stats?.mrr ? formatCurrency(stats.mrr) : '€0'} subtitle={advanced ? `€${format(advanced.revenue.arr, '0')}` : ''} icon={DollarSign} delay={0.1} />
        <StatCard title="Onboarding Rate" value={`${stats?.onboardingRate ?? 0}%`} icon={Activity} delay={0.15} />
        <StatCard title="Trials Expiring" value={advanced?.trial.expiringSoon ?? 0} subtitle={advanced ? `${advanced?.trial.active} active trials` : ''} icon={AlertTriangle} delay={0.2} />
        <StatCard title="Avg Project Value" value={advanced?.performance.avgProjectValue ? formatCurrency(advanced.performance.avgProjectValue) : '€0'} icon={BarChart3} delay={0.25} />
      </div>

      {/* Revenue donut chart (inline with quick actions) */}
      {pieData.length > 0 && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 220px', backgroundColor: '#1A1A1A', borderRadius: 12, border: '1px solid #2A2A2A', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', marginBottom: 12, alignSelf: 'flex-start' }}>Plan Breakdown</span>
            <div style={{ width: 140, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', fontSize: 13 }} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PIE_COLORS[i] }} />
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Counties Covered', value: stats?.countiesCovered ?? 0, icon: MapPin, colour: '#FB923C' },
              { label: 'SEAI Registered', value: stats?.seaiRegistered ?? 0, sub: advanced ? `${advanced.certifications.seai.percentage}%` : '', icon: Shield, colour: '#34D399' },
              { label: 'RECI Registered', value: stats?.reciRegistered ?? 0, sub: advanced ? `${advanced.certifications.reci.percentage}%` : '', icon: CheckCircle2, colour: '#60A5FA' },
              { label: 'Avg Team Size', value: stats?.avgTeamSize ?? 0, icon: Users, colour: '#C084FC' },
              { label: 'New (30 days)', value: advanced?.summary.newInstallersLast30Days ?? 0, icon: TrendingUp, colour: '#F3D840' },
              { label: 'Monthly Installs', value: advanced?.performance.totalInstallsMonth ?? 0, icon: Sun, colour: '#FACC15' },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                style={{ padding: 16, borderRadius: 12, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(243,216,64,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2A2A'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${item.colour}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon style={{ width: 18, height: 18, color: item.colour }} />
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>{item.value}</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{item.label}{' '}{item.sub && <span style={{ color: '#6B7280' }}>({item.sub})</span>}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        padding: '14px 20px', backgroundColor: '#141414', borderRadius: 12, border: '1px solid #2A2A2A', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, backgroundColor: '#1A1A1A', color: '#D1D5DB', border: '1px solid #2A2A2A', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.backgroundColor = '#222222' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.backgroundColor = '#1A1A1A' }}>
            <Download style={{ width: 15, height: 15 }} />Export CSV
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, backgroundColor: '#1A1A1A', color: '#D1D5DB', border: '1px solid #2A2A2A', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.backgroundColor = '#222222' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.backgroundColor = '#1A1A1A' }}>
                <MoreHorizontal style={{ width: 15, height: 15 }} />Bulk Actions
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Bulk action: Send email campaign')}>Send Email Campaign</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Bulk action: Export selected')}>Export Selected</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Bulk action: Assign territory')}>Assign Territory</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>
            Showing <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{installers.length}</span> of <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{pagination.total}</span>
          </span>
          {viewMode !== 'table' && (
            <div style={{ maxWidth: 180 }}>
              <Select value={sortOption} onValueChange={v => setSortOption(v as SortOption)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name_asc">Name A–Z</SelectItem>
                  <SelectItem value="name_desc">Name Z–A</SelectItem>
                  <SelectItem value="mrr_high">MRR High–Low</SelectItem>
                  <SelectItem value="mrr_low">MRR Low–High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6B7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search installers, contacts, emails..." onFocus={inputFocus} onBlur={inputBlur}
            style={{ ...inputStyle, width: '100%', paddingLeft: 40 }} />
        </div>
        <div style={{ maxWidth: 160 }}>
          <Select value={planFilter} onValueChange={v => setPlanFilter(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="All Plans" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div style={{ maxWidth: 160 }}>
          <Select value={onboardingFilter} onValueChange={v => setOnboardingFilter(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Onboarding" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div style={{ maxWidth: 160 }}>
          <Select value={countyFilter} onValueChange={v => setCountyFilter(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="All Counties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {IRELAND_COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilterPanel open={showAdvanced} onToggle={() => setShowAdvanced(s => !s)} />

      {/* View Toggle + Results area */}
      <div style={{ marginTop: 20 }}>
        {/* View toggle bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: '#141414', borderRadius: 10, padding: 4, border: '1px solid #2A2A2A' }}>
            {([['grid', LayoutGrid, 'Grid'], ['table', List, 'Table'], ['map', Map, 'Map']] as const).map(([mode, Icon, label]) => (
              <button key={mode} onClick={() => setViewMode(mode as ViewMode)} style={viewToggleStyle(viewMode === mode as ViewMode)}
                onMouseEnter={e => { if (viewMode !== mode) { e.currentTarget.style.color = '#D1D5DB'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' } }}
                onMouseLeave={e => { if (viewMode !== mode) { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.backgroundColor = 'transparent' } }}>
                <Icon style={{ width: 16, height: 16 }} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loadingInstallers && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#6B7280', gap: 12 }}>
            <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
            <span>Loading installers...</span>
          </div>
        )}

        {/* Results */}
        {!loadingInstallers && installers.length === 0 && (
          <EmptyState onCreate={() => setShowCreate(true)} />
        )}

        {!loadingInstallers && installers.length > 0 && (
          <>
            <AnimatePresence mode="wait">
              {viewMode === 'grid' && (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  style={{ display: 'grid', gridTemplateColumns: isLg ? 'repeat(3, 1fr)' : isMd ? 'repeat(2, 1fr)' : '1fr', gap: 16 }}>
                  {sortedInstallers.map((installer, i) => (
                    <InstallerCard key={installer.id} installer={installer} index={i} onView={() => setSelectedId(installer.id)} />
                  ))}
                </motion.div>
              )}
              {viewMode === 'table' && (
                <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <InstallerTableView installers={sortedInstallers} sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} onView={setSelectedId} />
                </motion.div>
              )}
              {viewMode === 'map' && (
                <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <MapView installers={sortedInstallers} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: page === 1 ? '#141414' : '#1A1A1A', color: page === 1 ? '#6B7280' : '#D1D5DB', border: '1px solid #2A2A2A', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { if (page !== 1) e.currentTarget.style.borderColor = 'rgba(243,216,64,0.3)' }}
                  onMouseLeave={e => { if (page !== 1) e.currentTarget.style.borderColor = '#2A2A2A' }}>
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: p === page ? '#F3D840' : '#1A1A1A', color: p === page ? '#0A0A0A' : '#D1D5DB', border: p === page ? '1px solid #F3D840' : '1px solid #2A2A2A', cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                    onMouseEnter={e => { if (p !== page) e.currentTarget.style.borderColor = '#3A3A3A' }}
                    onMouseLeave={e => { if (p !== page) e.currentTarget.style.borderColor = '#2A2A2A' }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: page === pagination.totalPages ? '#141414' : '#1A1A1A', color: page === pagination.totalPages ? '#6B7280' : '#D1D5DB', border: '1px solid #2A2A2A', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { if (page !== pagination.totalPages) e.currentTarget.style.borderColor = 'rgba(243,216,64,0.3)' }}
                  onMouseLeave={e => { if (page !== pagination.totalPages) e.currentTarget.style.borderColor = '#2A2A2A' }}>
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Dialog */}
      <CreateInstallerDialog open={showCreate} onOpenChange={setShowCreate} />

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedId && <InstallerDetailPanel installerId={selectedId} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>
    </div>
  )
}
