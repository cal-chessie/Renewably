'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, FileText, Send, Eye, CheckCircle2, XCircle, Clock, Calendar,
  Building2, User, Euro, Trash2, Edit3, Copy, MoreHorizontal, LayoutTemplate,
  GripVertical, X, AlertTriangle, Receipt, Mail, TrendingUp, BarChart3,
  Download, Upload, RefreshCw, MessageSquare, History, ArrowLeftRight,
  PartyPopper, Zap, Battery, Car, Shield, Wrench, Sun, ChevronDown,
  ChevronRight, Users, Target, Timer, Info, Sparkles, Link2, GitBranch,
  Filter, ArrowUpDown, ArrowDownUp, CheckSquare, Square, Play,
  Activity, Clock4, BadgeCheck, AlertCircle, ExternalLink,
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
const BRAND_LIGHT_MUTED = '#A0A0A0'
const BRAND_BORDER = '#2A2A2A'

// ── Helpers ──

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}
function formatDate(date: string | Date | null | undefined) {
  if (!date) return '\u2014'
  return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}
function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return null
  return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}
function daysBetween(a: string, b: string) {
  return Math.ceil(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}
function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

// ── ROI Calculator Helper ──
function calcSolarROI(lineItems: Array<{ name: string; quantity: number; unitPrice: number }>) {
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

// ── Status Configuration ──
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: React.CSSProperties; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-[#A0A0A0]', bgColor: { backgroundColor: '#1A1A1A' }, icon: FileText },
  sent: { label: 'Sent', color: 'text-blue-500', bgColor: { backgroundColor: 'rgba(59,130,246,0.1)' }, icon: Send },
  viewed: { label: 'Viewed', color: 'text-amber-500', bgColor: { backgroundColor: 'rgba(245,158,11,0.1)' }, icon: Eye },
  accepted: { label: 'Accepted', color: 'text-emerald-500', bgColor: { backgroundColor: 'rgba(16,185,129,0.1)' }, icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-500', bgColor: { backgroundColor: 'rgba(239,68,68,0.1)' }, icon: XCircle },
  expired: { label: 'Expired', color: 'text-orange-500', bgColor: { backgroundColor: 'rgba(249,115,22,0.1)' }, icon: Clock },
  revised: { label: 'Revised', color: 'text-purple-500', bgColor: { backgroundColor: 'rgba(168,85,247,0.1)' }, icon: RefreshCw },
}

const KANBAN_COLUMNS = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']

// ── Solar Templates ──
interface TemplateLineItem { name: string; description: string; quantity: number; unitPrice: number; isSeai?: boolean; isVat?: boolean }
interface SolarTemplate { id: string; name: string; description: string; icon: React.ElementType; lineItems: TemplateLineItem[] }

const SOLAR_TEMPLATES: SolarTemplate[] = [
  {
    id: 'residential-4kw', name: 'Residential Solar PV 4kW', description: 'Standard home solar installation with 10 panels', icon: Sun,
    lineItems: [
      { name: 'Solar PV Panels (410W Mono)', description: 'Premium tier-1 monocrystalline panels \u2013 10x 410W', quantity: 10, unitPrice: 285 },
      { name: 'String Inverter (4kW)', description: 'Huawei SUN2000-4KTL with WiFi monitoring dongle', quantity: 1, unitPrice: 850 },
      { name: 'Mounting System', description: 'Roof mounting rails, clamps and flashing kit', quantity: 1, unitPrice: 650 },
      { name: 'DC/AC Cabling & Protections', description: 'DC isolators, AC breaker, earthing kit, cabling', quantity: 1, unitPrice: 420 },
      { name: 'Installation Labour', description: 'Professional C-registered electrician installation', quantity: 1, unitPrice: 1200 },
      { name: 'SEAI Grant Deduction', description: 'SEAI Domestic Solar PV Grant (€900 for 4kW)', quantity: 1, unitPrice: -900, isSeai: true },
      { name: 'VAT (0% Residential)', description: 'Zero rate VAT for domestic solar installations', quantity: 1, unitPrice: 0, isVat: true },
      { name: '25-Year Performance Warranty', description: 'Panel manufacturer linear warranty + 12-year product warranty', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'residential-6kw', name: 'Residential Solar PV 6kW', description: 'Larger home installation with 15 panels and battery-ready inverter', icon: Sun,
    lineItems: [
      { name: 'Solar PV Panels (410W Mono)', description: 'Premium tier-1 monocrystalline panels \u2013 15x 410W', quantity: 15, unitPrice: 275 },
      { name: 'Hybrid Inverter (6kW)', description: 'Huawei SUN2000-6KTL with WiFi dongle, battery-ready', quantity: 1, unitPrice: 1250 },
      { name: 'Mounting System', description: 'Extended roof mounting rails, clamps and flashing kit', quantity: 1, unitPrice: 850 },
      { name: 'DC/AC Cabling & Protections', description: 'DC isolators, AC breaker, earthing kit, cabling', quantity: 1, unitPrice: 520 },
      { name: 'Installation Labour', description: 'Professional C-registered electrician installation', quantity: 1, unitPrice: 1500 },
      { name: 'SEAI Grant Deduction', description: 'SEAI Domestic Solar PV Grant (€1,800 for 6kW)', quantity: 1, unitPrice: -1800, isSeai: true },
      { name: 'VAT (0% Residential)', description: 'Zero rate VAT for domestic solar installations', quantity: 1, unitPrice: 0, isVat: true },
      { name: '25-Year Performance Warranty', description: 'Panel manufacturer linear warranty + 12-year product warranty', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'commercial-20kw', name: 'Commercial Solar PV 20kW', description: 'Small business installation with 48 panels', icon: Building2,
    lineItems: [
      { name: 'Solar PV Panels (420W Commercial)', description: 'Commercial-grade bifacial panels \u2013 48x 420W', quantity: 48, unitPrice: 220 },
      { name: 'Commercial Inverter (20kW)', description: 'SMA Sunny Tripower 20kW 3-phase', quantity: 1, unitPrice: 4200 },
      { name: 'Mounting System', description: 'Commercial flat-roof or pitched-roof mounting', quantity: 1, unitPrice: 2800 },
      { name: 'DC/AC Cabling & Protections', description: 'Full DC/AC wiring, combiner boxes, surge protection', quantity: 1, unitPrice: 1800 },
      { name: 'Installation Labour', description: 'Commercial installation team with project management', quantity: 1, unitPrice: 3500 },
      { name: 'VAT (23% Commercial)', description: 'Standard rate VAT for commercial installations', quantity: 1, unitPrice: 2967, isVat: true },
      { name: 'Grid Connection Application', description: 'ESB Networks connection agreement and commissioning', quantity: 1, unitPrice: 350 },
      { name: 'Monitoring & Maintenance (Year 1)', description: 'Remote monitoring portal + annual panel clean', quantity: 1, unitPrice: 800 },
    ],
  },
  {
    id: 'commercial-50kw', name: 'Commercial Solar PV 50kW', description: 'Medium business installation with 120 panels', icon: Building2,
    lineItems: [
      { name: 'Solar PV Panels (430W Commercial)', description: 'High-efficiency commercial bifacial panels \u2013 120x 430W', quantity: 120, unitPrice: 195 },
      { name: 'Commercial Inverter (50kW)', description: 'SMA Sunny Tripower 50kW 3-phase with optimisers', quantity: 1, unitPrice: 8500 },
      { name: 'Mounting System', description: 'Commercial flat-roof ballasted or pitched-roof system', quantity: 1, unitPrice: 5500 },
      { name: 'DC/AC Cabling & Protections', description: 'Full DC/AC wiring, combiner boxes, surge protection', quantity: 1, unitPrice: 3200 },
      { name: 'Installation Labour', description: 'Full commercial installation team + project management', quantity: 1, unitPrice: 6000 },
      { name: 'VAT (23% Commercial)', description: 'Standard rate VAT for commercial installations', quantity: 1, unitPrice: 5635, isVat: true },
      { name: 'Grid Connection Application', description: 'ESB Networks connection agreement and commissioning', quantity: 1, unitPrice: 600 },
      { name: 'Monitoring & Maintenance (Year 1)', description: 'Remote monitoring portal + 2x annual panel cleans', quantity: 1, unitPrice: 1500 },
    ],
  },
  {
    id: 'solar-battery', name: 'Solar + Battery Storage', description: 'Solar PV with home battery backup system', icon: Battery,
    lineItems: [
      { name: 'Solar PV Panels (410W Mono)', description: 'Premium tier-1 monocrystalline panels \u2013 12x 410W', quantity: 12, unitPrice: 280 },
      { name: 'Hybrid Inverter (5kW)', description: 'Huawei SUN2000-5KTL with battery interface', quantity: 1, unitPrice: 1100 },
      { name: 'Battery Storage System', description: 'Huawei LUNA2000 7kWh lithium battery module', quantity: 1, unitPrice: 3800 },
      { name: 'Battery Cabinet & BMS', description: 'Battery management system and enclosure', quantity: 1, unitPrice: 450 },
      { name: 'Mounting System', description: 'Roof mounting rails, clamps and flashing kit', quantity: 1, unitPrice: 750 },
      { name: 'DC/AC Cabling & Protections', description: 'DC isolators, AC breaker, earthing kit, cabling', quantity: 1, unitPrice: 480 },
      { name: 'Installation Labour', description: 'Professional installation including battery commissioning', quantity: 1, unitPrice: 1800 },
      { name: 'SEAI Grant Deduction', description: 'SEAI Battery Grant (\u009600)', quantity: 1, unitPrice: -600, isSeai: true },
      { name: 'VAT (0% Residential)', description: 'Zero rate VAT for domestic solar installations', quantity: 1, unitPrice: 0, isVat: true },
      { name: '10-Year Battery Warranty', description: 'Manufacturer warranty guaranteeing 80% capacity at 10 years', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'ev-charger-solar', name: 'EV Charger + Solar Bundle', description: 'Combined solar PV with home EV charging solution', icon: Zap,
    lineItems: [
      { name: 'Solar PV Panels (410W Mono)', description: 'Premium tier-1 monocrystalline panels \u2013 10x 410W', quantity: 10, unitPrice: 280 },
      { name: 'Hybrid Inverter (5kW)', description: 'Huawei SUN2000-5KTL with EV charger integration', quantity: 1, unitPrice: 1050 },
      { name: 'Home EV Charger (7.4kW)', description: 'Wallbox Pulsar Plus with solar-aware charging', quantity: 1, unitPrice: 950 },
      { name: 'Mounting System', description: 'Roof mounting rails, clamps and flashing kit', quantity: 1, unitPrice: 650 },
      { name: 'DC/AC Cabling & Protections', description: 'DC isolators, AC breaker, earthing kit, cabling', quantity: 1, unitPrice: 420 },
      { name: 'Installation Labour', description: 'Solar + EV charger professional installation', quantity: 1, unitPrice: 1400 },
      { name: 'SEAI EV Charger Grant', description: 'SEAI Home Charger Grant (€600)', quantity: 1, unitPrice: -600, isSeai: true },
      { name: 'SEAI Solar Grant', description: 'SEAI Domestic Solar PV Grant (€900 for 4kW)', quantity: 1, unitPrice: -900, isSeai: true },
      { name: 'VAT (0% Residential)', description: 'Zero rate VAT for domestic solar installations', quantity: 1, unitPrice: 0, isVat: true },
    ],
  },
  {
    id: 'seai-grant', name: 'SEAI Grant Proposal', description: 'Government grant-specific proposal with all SEAI deductions itemised', icon: Shield,
    lineItems: [
      { name: 'Solar PV System (4kW Package)', description: 'Complete 4kW system including panels, inverter, mounting', quantity: 1, unitPrice: 5500 },
      { name: 'Installation & Commissioning', description: 'Full professional installation and ESB notification', quantity: 1, unitPrice: 1200 },
      { name: 'BER Assessment (if required)', description: 'Building Energy Rating assessment for grant eligibility', quantity: 1, unitPrice: 250 },
      { name: 'SEAI Solar PV Grant', description: 'Domestic Solar PV Grant up to €2,400', quantity: 1, unitPrice: -1800, isSeai: true },
      { name: 'SEAI Better Energy Homes', description: 'Additional energy upgrade grant contribution', quantity: 1, unitPrice: -400, isSeai: true },
      { name: 'VAT (0% Residential)', description: 'Zero rate VAT for domestic solar installations', quantity: 1, unitPrice: 0, isVat: true },
      { name: 'Grant Application Assistance', description: 'Full SEAI grant application handled on behalf of the customer', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'maintenance-monitoring', name: 'Maintenance & Monitoring Package', description: 'Ongoing solar system care and performance monitoring', icon: Wrench,
    lineItems: [
      { name: 'Annual System Inspection', description: 'Full electrical inspection and safety check', quantity: 1, unitPrice: 250 },
      { name: 'Panel Cleaning (2x per year)', description: 'Professional panel cleaning to maintain efficiency', quantity: 2, unitPrice: 120 },
      { name: 'Remote Monitoring Portal', description: '24/7 performance monitoring with alert system', quantity: 1, unitPrice: 300 },
      { name: 'Inverter Health Check', description: 'Firmware updates and performance verification', quantity: 1, unitPrice: 150 },
      { name: 'Emergency Call-out Cover', description: 'Priority response for system faults within 48 hours', quantity: 1, unitPrice: 200 },
      { name: 'Annual Performance Report', description: 'Detailed generation report with yield comparison', quantity: 1, unitPrice: 0 },
    ],
  },
]

const QUICK_ADD_ITEMS: TemplateLineItem[] = [
  { name: 'Solar PV Panel (410W)', description: 'Premium tier-1 monocrystalline panel', quantity: 1, unitPrice: 280 },
  { name: 'Solar PV Panel (430W)', description: 'High-efficiency bifacial commercial panel', quantity: 1, unitPrice: 220 },
  { name: 'Hybrid Inverter (5kW)', description: 'Huawei SUN2000-5KTL', quantity: 1, unitPrice: 1100 },
  { name: 'String Inverter (4kW)', description: 'Huawei SUN2000-4KTL', quantity: 1, unitPrice: 850 },
  { name: 'Battery Module (7kWh)', description: 'Huawei LUNA2000 lithium battery', quantity: 1, unitPrice: 3800 },
  { name: 'Mounting System', description: 'Roof mounting rails and clamps', quantity: 1, unitPrice: 650 },
  { name: 'Installation Labour', description: 'Professional C-registered electrician', quantity: 1, unitPrice: 1200 },
  { name: 'SEAI Grant Deduction', description: 'SEAI Domestic Solar PV Grant', quantity: 1, unitPrice: -900, isSeai: true },
  { name: 'VAT (0% Residential)', description: 'Zero rate for domestic installations', quantity: 1, unitPrice: 0, isVat: true },
  { name: 'EV Charger (7.4kW)', description: 'Wallbox Pulsar Plus', quantity: 1, unitPrice: 950 },
  { name: 'Monitoring & Maintenance (Year 1)', description: 'Remote monitoring + annual panel clean', quantity: 1, unitPrice: 800 },
  { name: 'DC/AC Cabling & Protections', description: 'Wiring, isolators, breakers, earthing', quantity: 1, unitPrice: 420 },
]

// ── Email Templates (6 total) ──
const EMAIL_TEMPLATES = [
  {
    id: 'delivery', name: 'Proposal Delivery', icon: Send,
    subject: 'Your Solar Proposal from {{company_name}} \u2013 {{proposal_title}}',
    body: `Dear {{contact_name}},\n\nThank you for your interest in switching to solar energy. Please find attached your detailed proposal for {{proposal_title}}.\n\nThe total investment for this installation is {{total_amount}}. This proposal is valid until {{valid_until}}.\n\nKey highlights:\n\u2022 High-efficiency tier-1 solar panels with 25-year warranty\n\u2022 Professional installation by C-registered electricians\n\u2022 SEAI grant application assistance included\n\u2022 Free remote monitoring for system performance\n\nIf you have any questions or would like to discuss the proposal in detail, please don\u2019t hesitate to reach out.\n\nKind regards,\nThe {{company_name}} Team`,
  },
  {
    id: 'follow-up', name: 'Follow-up Reminder', icon: RefreshCw,
    subject: 'Following up on your Solar Proposal \u2013 {{proposal_title}}',
    body: `Dear {{contact_name}},\n\nI wanted to follow up on the solar proposal we sent over recently for {{proposal_title}} ({{total_amount}}).\n\nHave you had a chance to review the details? I\u2019d be happy to answer any questions you might have or arrange a site visit to discuss the installation further.\n\nPlease note that this proposal is valid until {{valid_until}}.\n\nLooking forward to hearing from you.\n\nBest regards,\nThe {{company_name}} Team`,
  },
  {
    id: 'revisions', name: 'Revisions Ready', icon: Edit3,
    subject: 'Updated Solar Proposal \u2013 {{proposal_title}} (Revised)',
    body: `Dear {{contact_name}},\n\nBased on our recent discussions, we\u2019ve updated your solar proposal for {{proposal_title}}.\n\nThe revised total is now {{total_amount}}. Please find the updated proposal attached for your review.\n\nMain changes:\n\u2022 Adjusted system sizing based on your requirements\n\u2022 Updated pricing reflecting current panel availability\n\u2022 Additional options included as discussed\n\nThis revised proposal is valid until {{valid_until}}.\n\nKind regards,\nThe {{company_name}} Team`,
  },
  {
    id: 'accepted', name: 'Congratulations \u2013 Accepted!', icon: PartyPopper,
    subject: 'Your Solar Proposal Has Been Accepted! \u2013 {{proposal_title}}',
    body: `Dear {{contact_name}},\n\nGreat news! Your solar proposal for {{proposal_title}} ({{total_amount}}) has been accepted.\n\nHere\u2019s what happens next:\n1. The installation team will contact you within 24 hours to schedule the installation\n2. The SEAI grant application will be handled on your behalf\n3. ESB grid connection notification will be submitted\n4. The installation team will arrive on the agreed date\n\nTypical installation timeline: 2\u20134 weeks from scheduling.\n\nWe look forward to helping you start generating clean, renewable energy!\n\nWarm regards,\nThe {{company_name}} Team`,
  },
  {
    id: 'expiring-soon', name: 'Expiring Soon Reminder', icon: AlertCircle,
    subject: 'Action Required: Your Solar Proposal Expires Soon \u2013 {{proposal_title}}',
    body: `Dear {{contact_name}},\n\nThis is a friendly reminder that your solar proposal for {{proposal_title}} ({{total_amount}}) will expire on {{valid_until}}.\n\nIf you\u2019d like to proceed with this proposal, please let us know before the expiry date to lock in the current pricing. Panel prices and grant availability can change, so we want to ensure you don\u2019t miss out.\n\nWe\u2019re happy to:\n\u2022 Answer any remaining questions\n\u2022 Arrange a follow-up site visit\n\u2022 Adjust the proposal to better meet your needs\n\nPlease don\u2019t hesitate to get in touch.\n\nKind regards,\nThe {{company_name}} Team`,
  },
  {
    id: 'post-installation', name: 'Post-Installation Follow-up', icon: BadgeCheck,
    subject: 'How Is Your New Solar System Performing? \u2013 {{company_name}}',
    body: `Dear {{contact_name}},\n\nWe hope you\u2019re enjoying the benefits of your new solar installation from {{proposal_title}}!\n\nAs part of our commitment to excellent after-sales service, we wanted to check in:\n\n\u2022 Is your system performing as expected?\n\u2022 Have you noticed a reduction in your electricity bills?\n\u2022 Is the monitoring app working well for you?\n\nIf you have any questions or concerns, our support team is always available. We also offer annual maintenance packages to keep your system running at peak efficiency.\n\nThank you for choosing {{company_name}} for your solar journey!\n\nWarm regards,\nThe {{company_name}} Team`,
  },
]

// ── TypeScript Interfaces ──
interface LineItem { id: string; name: string; description: string; quantity: number; unitPrice: number; total: number; sortOrder: number }
interface Proposal {
  id: string; title: string; status: string; totalAmount: number; validUntil: string | null;
  sentAt: string | null; viewedAt: string | null; acceptedAt: string | null; rejectedAt: string | null;
  notes: string | null; createdAt: string; updatedAt: string;
  contact: { id: string; firstName: string; lastName: string; email: string } | null;
  company: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  template: { id: string; name: string } | null;
  _count?: { lineItems: number };
  lineItems?: LineItem[];
  version?: number;
  clientDescription?: string | null;
  internalNotes?: string | null;
  activities?: Array<{ id: string; type: string; subject: string; description: string | null; createdAt: string }>
}
interface ProposalComment { id: string; content: string; isInternal: boolean; createdAt: string }

// ── Status Badge ──
function ProposalStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`} style={config.bgColor}>
      <Icon className="h-3 w-3" />{config.label}
    </span>
  )
}

function PriorityDot({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const colours: Record<string, string> = { high: '#EF4444', medium: BRAND_YELLOW, low: '#22C55E' }
  return <div className="rounded-full h-2 w-2 shrink-0" style={{ backgroundColor: colours[priority] || colours.medium }} title={`${priority} priority`} />
}

// ── ROI Calculator Component ──
function ROICalculator({ lineItems }: { lineItems?: LineItem[] }) {
  const items = lineItems || []
  const roi = calcSolarROI(items)
  if (!roi) return null

  const metrics = [
    { label: 'System Size', value: `${roi.systemKwp.toFixed(1)} kWp`, icon: Sun, color: BRAND_YELLOW },
    { label: 'Annual Generation', value: `${roi.annualGen.toLocaleString()} kWh`, icon: Zap, color: '#3B82F6' },
    { label: 'Annual Savings', value: formatCurrency(roi.annualSavings), icon: TrendingUp, color: '#10B981' },
    { label: 'Payback Period', value: `${roi.paybackYears} years`, icon: Timer, color: '#F97316' },
    { label: '25-Year Savings', value: formatCurrency(roi.savings25yr), icon: Euro, color: '#8B5CF6' },
  ]

  return (
    <div className="p-5 rounded-lg border" style={{ borderColor: BRAND_BORDER, backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${BRAND_YELLOW}20` }}>
          <TrendingUp className="h-4 w-4" style={{ color: BRAND_DARK }} />
        </div>
        <h3 className="text-sm font-bold" style={{ color: BRAND_DARK }}>Savings Projection</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>Estimated</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((m) => {
          const MIcon = m.icon
          return (
            <motion.div key={m.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg p-3 border" style={{ borderColor: BRAND_BORDER, backgroundColor: '#FAFAFA' }}>
              <MIcon className="h-4 w-4 mb-1.5" style={{ color: m.color }} />
              <p className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>{m.label}</p>
              <p className="text-base font-bold mt-0.5" style={{ color: BRAND_DARK }}>{m.value}</p>
            </motion.div>
          )
        })}
      </div>
      <p className="text-[10px] mt-3" style={{ color: BRAND_MUTED }}>
        * Based on Irish solar averages: ~950 kWh/kWp annual yield, €0.35/kWh average rate, 70% self-consumption.
      </p>
    </div>
  )
}

// ── Activity Feed Component ──
function ActivityFeed({ activities, proposalTitle }: { activities?: Proposal['activities']; proposalTitle?: string }) {
  const items = activities || []
  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: BRAND_BORDER, backgroundColor: '#F9FAFB' }}>
        <Activity className="h-5 w-5 mx-auto mb-2" style={{ color: BRAND_MUTED }} />
        <p className="text-xs" style={{ color: BRAND_MUTED }}>No activity recorded yet</p>
      </div>
    )
  }

  const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
    email: { icon: Mail, color: '#3B82F6' },
    deal_update: { icon: RefreshCw, color: '#8B5CF6' },
    call: { icon: Users, color: '#10B981' },
    meeting: { icon: Calendar, color: '#F59E0B' },
    note: { icon: MessageSquare, color: '#6B7280' },
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 10).map((a, i) => {
        const cfg = typeConfig[a.type] || typeConfig.note
        const AIcon = cfg.icon
        return (
          <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-3">
            <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${cfg.color}15` }}>
              <AIcon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium truncate" style={{ color: BRAND_DARK }}>{a.subject}</p>
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

// ── Version History Component ──
function VersionHistory({ proposal }: { proposal: Proposal }) {
  const versions = [
    { version: (proposal.version || 1), date: proposal.updatedAt, status: proposal.status, isCurrent: true },
    ...(proposal.status === 'revised' ? [{ version: (proposal.version || 2) - 1, date: proposal.createdAt, status: 'superseded', isCurrent: false }] : []),
  ]

  return (
    <div className="space-y-2">
      {versions.map((v, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-3 border" style={{ borderColor: v.isCurrent ? BRAND_YELLOW : BRAND_BORDER, backgroundColor: v.isCurrent ? `${BRAND_YELLOW}08` : '#FFFFFF' }}>
          <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: v.isCurrent ? BRAND_YELLOW : '#F3F4F6' }}>
            <GitBranch className="h-3.5 w-3.5" style={{ color: v.isCurrent ? BRAND_DARK : BRAND_MUTED }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: BRAND_DARK }}>v{v.version}</span>
              {v.isCurrent && <Badge className="text-[9px] px-1.5 py-0" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>Current</Badge>}
              {!v.isCurrent && <span className="text-[10px]" style={{ color: BRAND_MUTED }}>Superseded</span>}
            </div>
            <span className="text-[10px]" style={{ color: BRAND_MUTED }}>{formatDateTime(v.date)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Client Portal Link ──
function ClientPortalLink({ proposalId }: { proposalId: string }) {
  const [copied, setCopied] = useState(false)
  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/proposal/${proposalId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast.success('Client portal link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: BRAND_BORDER, backgroundColor: '#F9FAFB' }}>
      <div className="flex items-center gap-2 mb-2">
        <ExternalLink className="h-4 w-4" style={{ color: BRAND_YELLOW }} />
        <span className="text-xs font-semibold" style={{ color: BRAND_DARK }}>Client Portal Link</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-[11px] px-3 py-2 rounded-md truncate" style={{ backgroundColor: '#FFFFFF', color: BRAND_MUTED, border: `1px solid ${BRAND_BORDER}` }}>
          {portalUrl}
        </code>
        <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 text-xs h-8">
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <p className="text-[10px] mt-2" style={{ color: BRAND_MUTED }}>Share this read-only link with your client for them to view the proposal online.</p>
    </div>
  )
}

// ── AI Suggestions Component ──
function AISuggestions({ proposal }: { proposal: Proposal }) {
  const [suggestions, setSuggestions] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = useCallback(() => {
    setLoading(true)
    fetch('/api/crm/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `You are a solar industry expert CRM assistant for SolarPilot. Analyse this proposal and suggest improvements. Proposal: "${proposal.title}" for ${proposal.contact?.firstName || ''} ${proposal.contact?.lastName || ''} at ${proposal.company?.name || 'N/A'}. Total: €${proposal.totalAmount}. Status: ${proposal.status}. Line items: ${(proposal.lineItems || []).map(i => i.name).join(', ')}. Provide 3-4 actionable suggestions about pricing, follow-up timing, items, or negotiation. Be concise.`,
        context: 'solar_proposal_analysis',
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.response) {
          setSuggestions(data.response.split('\n').filter((s: string) => s.trim()))
        } else {
          setSuggestions([
            'Consider adding a battery storage option \u2013 60% of Irish customers show interest',
            `Follow up in ${daysUntil(proposal.validUntil) !== null && daysUntil(proposal.validUntil)! > 3 ? '3 days' : '24 hours'} \u2013 ${proposal.status === 'viewed' ? 'the client has already viewed it' : 'timing is key'}`,
            `Current pricing is ${proposal.totalAmount > 8000 ? 'in the premium range' : 'competitive'} \u2013 emphasise warranty value`,
            'Offer a free site survey to build trust and move the deal forward',
          ])
        }
      })
      .catch(() => {
        setSuggestions([
          'Consider adding a battery storage option \u2013 60% of Irish customers show interest',
          `Follow up in ${daysUntil(proposal.validUntil) !== null && daysUntil(proposal.validUntil)! > 3 ? '3 days' : '24 hours'}`,
          'Emphasise the 25-year warranty and SEAI grant savings',
          'Offer a virtual demo of the monitoring system',
        ])
      })
      .finally(() => setLoading(false))
  }, [proposal])

  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={fetchSuggestions} disabled={loading} className="w-full text-sm" style={{ borderColor: BRAND_YELLOW, color: BRAND_DARK }}>
        <Sparkles className="h-4 w-4 mr-2" style={{ color: BRAND_YELLOW }} />
        {loading ? 'Analysing proposal...' : 'AI Suggestions'}
      </Button>
      {suggestions && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-lg p-3 border flex gap-2" style={{ borderColor: BRAND_BORDER, backgroundColor: `${BRAND_YELLOW}05` }}>
              <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: BRAND_YELLOW }} />
              <p className="text-xs" style={{ color: BRAND_DARK }}>{s.replace(/^\d+[\.\)]\s*/, '')}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ── Proposal Card (Enhanced with checkbox) ──
function ProposalCard({ proposal, onClick, selected, onToggleSelect }: {
  proposal: Proposal; onClick: (p: Proposal) => void; selected: boolean; onToggleSelect: () => void
}) {
  const validityDays = daysUntil(proposal.validUntil)
  const isExpired = validityDays !== null && validityDays < 0
  const isExpiringSoon = validityDays !== null && validityDays >= 0 && validityDays <= 7
  const priority: 'high' | 'medium' | 'low' = isExpired || isExpiringSoon ? 'high' : proposal.status === 'accepted' ? 'low' : proposal.status === 'sent' ? 'medium' : 'low'
  const initials = proposal.contact ? `${proposal.contact.firstName[0]}${proposal.contact.lastName[0]}` : '??'

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
      className="rounded-lg p-4 shadow-sm border cursor-pointer transition-all group"
      style={{ backgroundColor: '#FFFFFF', borderColor: selected ? BRAND_YELLOW : BRAND_BORDER }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect() }} className="shrink-0 mt-0.5">
            {selected ? <CheckSquare className="h-4 w-4" style={{ color: BRAND_YELLOW }} /> : <Square className="h-4 w-4" style={{ color: '#D1D5DB' }} />}
          </button>
          <h4 className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: '#374151' }} onClick={() => onClick(proposal)}>{proposal.title}</h4>
        </div>
        <ProposalStatusBadge status={isExpired ? 'expired' : proposal.status} />
      </div>
      <div className="flex items-center gap-1.5 text-base font-bold mb-2" style={{ color: BRAND_DARK }}>
        <Euro className="h-4 w-4" />{formatCurrency(proposal.totalAmount)}
      </div>
      {proposal.contact && (
        <div className="flex items-center gap-2 mb-2">
          <div className="rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>{initials}</div>
          <a href={`/crm/contacts/${proposal.contact.id}`} className="text-xs truncate hover:underline" style={{ color: BRAND_YELLOW, textDecoration: 'none' }}>{proposal.contact.firstName} {proposal.contact.lastName}</a>
        </div>
      )}
      {proposal.company && (
        <a href="/crm/companies" className="flex items-center gap-1.5 text-xs mb-1 hover:underline" style={{ color: BRAND_YELLOW, textDecoration: 'none' }}>
          <Building2 className="h-3 w-3 shrink-0" />{proposal.company.name}
        </a>
      )}
      <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${BRAND_BORDER}` }}>
        <div className="flex items-center gap-2">
          <PriorityDot priority={priority} />
          <span className="text-[10px]" style={{ color: BRAND_MUTED }}>{formatDate(proposal.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          {validityDays !== null && !isExpired && (
            <span className={`text-[10px] ${isExpiringSoon ? 'font-semibold' : ''}`} style={{ color: isExpiringSoon ? '#F97316' : BRAND_MUTED }}>
              <Clock className="h-3 w-3 inline mr-0.5" />{validityDays}d left
            </span>
          )}
          {validityDays !== null && isExpired && (
            <span className="text-[10px] font-semibold" style={{ color: '#EF4444' }}>Expired</span>
          )}
          {validityDays === null && (
            <span className="text-[10px]" style={{ color: BRAND_MUTED }}>{daysBetween(proposal.updatedAt, new Date().toISOString())}d ago</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Status Timeline ──
function StatusTimeline({ proposal }: { proposal: Proposal }) {
  const steps = [
    { key: 'created', label: 'Created', date: proposal.createdAt, done: true },
    { key: 'sent', label: 'Sent', date: proposal.sentAt, done: !!proposal.sentAt },
    { key: 'viewed', label: 'Viewed', date: proposal.viewedAt, done: !!proposal.viewedAt },
    {
      key: 'resolved', label: proposal.status === 'accepted' ? 'Accepted' : proposal.status === 'rejected' ? 'Rejected' : proposal.status === 'expired' ? 'Expired' : proposal.status === 'revised' ? 'Revised' : 'Awaiting',
      date: proposal.acceptedAt || proposal.rejectedAt, done: ['accepted', 'rejected', 'expired', 'revised'].includes(proposal.status),
    },
  ]
  return (
    <div>
      {steps.map((step, i) => (
        <div key={step.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: step.done ? BRAND_YELLOW : '#F3F4F6', color: step.done ? BRAND_DARK : BRAND_MUTED }}>
              {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />}
            </div>
            {i < steps.length - 1 && <div className="w-0.5 h-8" style={{ backgroundColor: step.done ? `${BRAND_YELLOW}60` : '#E5E7EB' }} />}
          </div>
          <div className="pb-6">
            <p className="text-sm font-medium" style={{ color: step.done ? BRAND_DARK : BRAND_MUTED }}>{step.label}</p>
            {step.date && <p className="text-xs mt-0.5" style={{ color: BRAND_MUTED }}>{formatDateTime(step.date)}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Template Preview Dialog ──
function TemplatePreviewDialog({ template, open, onClose, onApply }: { template: SolarTemplate | null; open: boolean; onClose: () => void; onApply: (tpl: SolarTemplate) => void }) {
  if (!template) return null
  const TplIcon = template.icon
  const total = template.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><TplIcon className="h-5 w-5" style={{ color: BRAND_YELLOW }} />{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto rounded-lg border" style={{ borderColor: BRAND_BORDER }}>
          <table className="w-full">
            <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
              <th className="text-left text-[11px] uppercase font-medium px-3 py-2" style={{ color: BRAND_MUTED }}>Item</th>
              <th className="text-right text-[11px] uppercase font-medium px-3 py-2 w-12" style={{ color: BRAND_MUTED }}>Qty</th>
              <th className="text-right text-[11px] uppercase font-medium px-3 py-2 w-20" style={{ color: BRAND_MUTED }}>Unit</th>
              <th className="text-right text-[11px] uppercase font-medium px-3 py-2 w-20" style={{ color: BRAND_MUTED }}>Total</th>
            </tr></thead>
            <tbody>{template.lineItems.map((item, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${BRAND_BORDER}` }}>
                <td className="px-3 py-2"><p className="text-sm font-medium" style={{ color: BRAND_DARK }}>{item.name}</p><p className="text-[11px]" style={{ color: BRAND_MUTED }}>{item.description}</p></td>
                <td className="px-3 py-2 text-right text-sm" style={{ color: BRAND_MUTED }}>{item.quantity}</td>
                <td className="px-3 py-2 text-right text-sm" style={{ color: BRAND_MUTED }}>{formatCurrency(item.unitPrice)}</td>
                <td className="px-3 py-2 text-right text-sm font-medium" style={{ color: item.unitPrice < 0 ? '#10B981' : BRAND_DARK }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: `${BRAND_YELLOW}15`, border: `1px solid ${BRAND_YELLOW}40` }}>
          <span className="font-semibold" style={{ color: BRAND_MUTED }}>Total</span>
          <span className="text-xl font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(total)}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onApply(template); onClose() }} className="font-medium" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>Apply Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Proposal Comparison Dialog ──
function ProposalComparisonDialog({ proposals, open, onClose }: { proposals: Proposal[]; open: boolean; onClose: () => void }) {
  if (!open || proposals.length < 2) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" style={{ color: BRAND_YELLOW }} />Proposal Comparison</DialogTitle>
          <DialogDescription>Side-by-side comparison of {proposals.length} proposals</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: `2px solid ${BRAND_YELLOW}` }}>
              <th className="text-left py-3 px-2 text-[11px] uppercase" style={{ color: BRAND_MUTED, minWidth: 120 }}>Field</th>
              {proposals.map((p, i) => (
                <th key={p.id} className="text-left py-3 px-2" style={{ minWidth: 200 }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: BRAND_DARK }}>Proposal {i + 1}</p>
                    <p className="text-[11px] truncate" style={{ color: BRAND_MUTED }}>{p.title}</p>
                  </div>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { label: 'Contact', fn: (p: Proposal) => p.contact ? `${p.contact.firstName} ${p.contact.lastName}` : '\u2014' },
                { label: 'Company', fn: (p: Proposal) => p.company?.name || '\u2014' },
                { label: 'Status', fn: (p: Proposal) => <ProposalStatusBadge status={p.status} /> },
                { label: 'Total Value', fn: (p: Proposal) => <span className="font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(p.totalAmount)}</span> },
                { label: 'Valid Until', fn: (p: Proposal) => formatDate(p.validUntil) },
                { label: 'Created', fn: (p: Proposal) => formatDate(p.createdAt) },
                { label: 'Line Items', fn: (p: Proposal) => `${p._count?.lineItems || p.lineItems?.length || 0} items` },
                { label: 'ROI Payback', fn: (p: Proposal) => { const roi = p.lineItems ? calcSolarROI(p.lineItems) : null; return roi ? `${roi.paybackYears} years` : 'N/A' } },
                { label: 'Annual Savings', fn: (p: Proposal) => { const roi = p.lineItems ? calcSolarROI(p.lineItems) : null; return roi ? formatCurrency(roi.annualSavings) : 'N/A' } },
              ].map((row) => (
                <tr key={row.label} style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}>
                  <td className="py-2.5 px-2 font-medium text-xs" style={{ color: BRAND_MUTED }}>{row.label}</td>
                  {proposals.map(p => (
                    <td key={p.id} className="py-2.5 px-2 text-xs" style={{ color: BRAND_DARK }}>{row.fn(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Proposal Analytics Bar ──
function ProposalAnalytics({ proposals }: { proposals: Proposal[] }) {
  const total = proposals.length
  const accepted = proposals.filter((p) => p.status === 'accepted').length
  const sent = proposals.filter((p) => ['sent', 'viewed'].includes(p.status)).length
  const rejected = proposals.filter((p) => p.status === 'rejected').length
  const expired = proposals.filter((p) => p.status === 'expired').length
  const winRate = sent + accepted + rejected > 0 ? Math.round((accepted / (accepted + rejected)) * 100) : 0
  const avgValue = total > 0 ? Math.round(proposals.reduce((s, p) => s + p.totalAmount, 0) / total) : 0
  const acceptedProposals = proposals.filter((p) => p.status === 'accepted' && p.acceptedAt && p.sentAt)
  const avgDays = acceptedProposals.length > 0 ? Math.round(acceptedProposals.reduce((s, p) => s + daysBetween(p.sentAt!, p.acceptedAt!), 0) / acceptedProposals.length) : 0
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthRevenue = proposals.filter((p) => p.status === 'accepted' && p.acceptedAt && new Date(p.acceptedAt) >= monthStart).reduce((s, p) => s + p.totalAmount, 0)
  const statusCounts = { draft: proposals.filter((p) => p.status === 'draft').length, sent: proposals.filter((p) => p.status === 'sent').length, viewed: proposals.filter((p) => p.status === 'viewed').length, accepted, rejected, expired }
  const maxCount = Math.max(...Object.values(statusCounts), 1)
  const metrics = [
    { label: 'Win Rate', value: `${winRate}%`, icon: Target, colour: '#10B981' },
    { label: 'Avg. Value', value: formatCurrency(avgValue), icon: Euro, colour: BRAND_YELLOW },
    { label: 'Avg. Days to Accept', value: `${avgDays}d`, icon: Timer, colour: '#F97316' },
    { label: 'Monthly Revenue', value: formatCurrency(monthRevenue), icon: TrendingUp, colour: '#8B5CF6' },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => {
          const MIcon = m.icon
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg p-3 border" style={{ backgroundColor: '#FFFFFF', borderColor: BRAND_BORDER }}>
              <div className="flex items-center gap-2 mb-1"><MIcon className="h-4 w-4" style={{ color: m.colour }} /><span className="text-[11px] uppercase font-medium" style={{ color: BRAND_MUTED }}>{m.label}</span></div>
              <p className="text-lg font-bold" style={{ color: BRAND_DARK }}>{m.value}</p>
            </motion.div>
          )
        })}
      </div>
      <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: BRAND_BORDER }}>
        <div className="flex items-center gap-2 mb-3"><BarChart3 className="h-4 w-4" style={{ color: BRAND_DARK }} /><span className="text-sm font-semibold" style={{ color: BRAND_DARK }}>Proposals by Status</span></div>
        <div className="space-y-2">{Object.entries(statusCounts).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status]
          const pct = (count / maxCount) * 100
          const barColours: Record<string, string> = { draft: '#9CA3AF', sent: '#3B82F6', viewed: '#F59E0B', accepted: '#10B981', rejected: '#EF4444', expired: '#F97316' }
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs w-20 text-right" style={{ color: BRAND_MUTED }}>{cfg?.label || status}</span>
              <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className="h-full rounded-full" style={{ backgroundColor: barColours[status] || '#9CA3AF' }} />
              </div>
              <span className="text-xs font-medium w-6" style={{ color: BRAND_DARK }}>{count}</span>
            </div>
          )
        })}</div>
      </div>

      {/* ===== TEMPLATE WIN/LOSS INSIGHTS ===== */}
      {(() => {
        const byTemplate = proposals.reduce<Record<string, { sent: number; accepted: number; rejected: number; total: number }>>((acc, p) => {
          const tplName = p.template?.name || 'No Template'
          if (!acc[tplName]) acc[tplName] = { sent: 0, accepted: 0, rejected: 0, total: 0 }
          acc[tplName].total++
          if (['sent', 'viewed'].includes(p.status)) acc[tplName].sent++
          if (p.status === 'accepted') acc[tplName].accepted++
          if (p.status === 'rejected') acc[tplName].rejected++
          return acc
        }, {})
        const entries = Object.entries(byTemplate).filter(([, v]) => v.total >= 1).sort((a, b) => b[1].total - a[1].total)
        if (entries.length === 0) return null
        const maxTotal = Math.max(...entries.map(([, v]) => v.total), 1)
        return (
          <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: BRAND_BORDER }}>
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4" style={{ color: BRAND_YELLOW }} /><span className="text-sm font-semibold" style={{ color: BRAND_DARK }}>Win/Loss by Template</span></div>
            <div className="space-y-2.5">
              {entries.map(([name, stats]) => {
                const decided = stats.accepted + stats.rejected
                const acceptRate = decided > 0 ? Math.round((stats.accepted / decided) * 100) : null
                const barWidth = (stats.total / maxTotal) * 100
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: BRAND_DARK, maxWidth: '55%' }}>{name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: BRAND_MUTED }}>{stats.accepted}W / {stats.rejected}L of {stats.total}</span>
                        {acceptRate !== null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: acceptRate >= 50 ? '#ECFDF5' : '#FEF2F2', color: acceptRate >= 50 ? '#059669' : '#DC2626' }}>
                            {acceptRate}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                      {stats.accepted > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.accepted / stats.total) * barWidth}%` }} transition={{ duration: 0.6 }} className="h-full rounded-l-full" style={{ backgroundColor: '#10B981' }} />
                      )}
                      {stats.rejected > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.rejected / stats.total) * barWidth}%` }} transition={{ duration: 0.6 }} className="h-full" style={{ backgroundColor: '#EF4444' }} />
                      )}
                      {(stats.sent) > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.sent / stats.total) * barWidth}%` }} transition={{ duration: 0.6 }} className="h-full rounded-r-full" style={{ backgroundColor: '#F59E0B' }} />
                      )}
                    </div>
                    <div className="flex gap-3 mt-0.5 text-[9px]" style={{ color: BRAND_MUTED }}>
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />Won</span>
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />Lost</span>
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} />Pending</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Create/Edit Proposal Form ──
function ProposalForm({ proposal, contacts, deals, companies, templates, onClose }: {
  proposal?: Proposal; contacts: Array<{ id: string; firstName: string; lastName: string }>; deals: Array<{ id: string; title: string }>; companies: Array<{ id: string; name: string }>; templates: Array<{ id: string; name: string; lineItems: string }>; onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEditing = !!proposal
  const [form, setForm] = useState({
    title: proposal?.title || '', contactId: proposal?.contact?.id || '', dealId: proposal?.deal?.id || '',
    companyId: proposal?.company?.id || '', validUntil: proposal?.validUntil?.split('T')[0] || '',
    notes: proposal?.notes || '', clientDescription: proposal?.clientDescription || '', internalNotes: proposal?.internalNotes || '',
  })
  const [lineItems, setLineItems] = useState<LineItem[]>(proposal?.lineItems?.length ? proposal.lineItems : [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1, unitPrice: 0, total: 0, sortOrder: 0 }])
  const [bulkDiscount, setBulkDiscount] = useState(0)
  const [templatePreview, setTemplatePreview] = useState<SolarTemplate | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [templateTab, setTemplateTab] = useState('built-in')
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = Math.round(subtotal * (bulkDiscount / 100))
  const total = subtotal - discountAmount

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    const item = { ...updated[index] }
    ;(item as Record<string, unknown>)[field] = value
    if (field === 'quantity' || field === 'unitPrice') item.total = item.quantity * item.unitPrice
    updated[index] = item
    setLineItems(updated)
  }
  const addLineItem = () => setLineItems([...lineItems, { id: crypto.randomUUID(), name: '', description: '', quantity: 1, unitPrice: 0, total: 0, sortOrder: lineItems.length }])
  const removeLineItem = (index: number) => { if (lineItems.length <= 1) return; setLineItems(lineItems.filter((_, i) => i !== index)) }

  const loadTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return
    try {
      const items = JSON.parse(tpl.lineItems || '[]')
      if (Array.isArray(items) && items.length > 0) {
        setLineItems(items.map((item: Record<string, unknown>, index: number) => ({ id: crypto.randomUUID(), name: (item.name as string) || '', description: (item.description as string) || '', quantity: (item.quantity as number) || 1, unitPrice: (item.unitPrice as number) || 0, total: ((item.quantity as number) || 1) * ((item.unitPrice as number) || 0), sortOrder: index })))
        toast.success(`Template "${tpl.name}" loaded`)
      }
    } catch { toast.error('Failed to load template') }
  }
  const loadBuiltInTemplate = (tpl: SolarTemplate) => {
    setLineItems(tpl.lineItems.map((item, index) => ({ id: crypto.randomUUID(), name: item.name, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, total: item.quantity * item.unitPrice, sortOrder: index })))
    if (!form.title) setForm((f) => ({ ...f, title: tpl.name }))
    toast.success(`Template "${tpl.name}" loaded`)
  }
  const addQuickItem = (item: TemplateLineItem) => {
    setLineItems([...lineItems, { id: crypto.randomUUID(), name: item.name, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, total: item.quantity * item.unitPrice, sortOrder: lineItems.length }])
    setShowQuickAdd(false); toast.success(`Added "${item.name}"`)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, contactId: form.contactId || null, dealId: form.dealId || null, companyId: form.companyId || null, validUntil: form.validUntil || null, totalAmount: total, clientDescription: form.clientDescription || null, lineItems: lineItems.map((item, i) => ({ ...item, sortOrder: i })) }
      if (isEditing) { const res = await fetch(`/api/crm/proposals/${proposal!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to update') } return res.json() }
      else { const res = await fetch('/api/crm/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to create') } return res.json() }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); toast.success(isEditing ? 'Proposal updated' : 'Proposal created'); onClose() },
    onError: (err: Error) => toast.error(err.message),
  })
  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, contactId: form.contactId || null, dealId: form.dealId || null, companyId: form.companyId || null, validUntil: form.validUntil || null, totalAmount: total, clientDescription: form.clientDescription || null, lineItems: lineItems.map((item, i) => ({ ...item, sortOrder: i })) }
      let proposalId = proposal?.id
      if (isEditing) { const res = await fetch(`/api/crm/proposals/${proposal!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) throw new Error('Failed to save') }
      else { const res = await fetch('/api/crm/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) throw new Error('Failed to create'); const data = await res.json(); proposalId = data.proposal.id }
      const sendRes = await fetch(`/api/crm/proposals/${proposalId}/send`, { method: 'POST' }); if (!sendRes.ok) throw new Error('Failed to send'); return sendRes.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); toast.success('Proposal sent successfully!'); onClose() },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">
            <div className="space-y-1.5"><Label>Proposal Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Residential Solar PV 4kW \u2013 O\u2019Brien Residence" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Contact</Label><Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}><SelectTrigger className="w-full"><SelectValue placeholder="Select contact" /></SelectTrigger><SelectContent>{contacts.map((c) => (<SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Deal</Label><Select value={form.dealId} onValueChange={(v) => setForm({ ...form, dealId: v })}><SelectTrigger className="w-full"><SelectValue placeholder="Select deal" /></SelectTrigger><SelectContent>{deals.map((d) => (<SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Company</Label><Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}><SelectTrigger className="w-full"><SelectValue placeholder="Select company" /></SelectTrigger><SelectContent>{companies.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Valid Until</Label><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="flex items-center gap-2"><LayoutTemplate className="h-4 w-4" />Templates</Label></div>
                <Tabs value={templateTab} onValueChange={setTemplateTab}>
                  <TabsList className="w-full"><TabsTrigger value="built-in" className="flex-1">Built-in</TabsTrigger>{templates.length > 0 && <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>}</TabsList>
                  <TabsContent value="built-in" className="mt-2">
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">{SOLAR_TEMPLATES.map((tpl) => { const TplIcon = tpl.icon; const tplTotal = tpl.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0); const panelCount = tpl.lineItems.find(i => i.name.toLowerCase().includes('panel')); return (
                      <motion.button key={tpl.id} type="button" whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }} onClick={() => setTemplatePreview(tpl)} className="rounded-lg p-3 text-left border transition-all hover:shadow-md group" style={{ backgroundColor: '#FFFFFF', borderColor: BRAND_BORDER }}>
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors group-hover:scale-105" style={{ backgroundColor: `${BRAND_YELLOW}15` }}>
                            <TplIcon className="h-4.5 w-4.5" style={{ color: BRAND_DARK }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-xs font-bold truncate" style={{ color: BRAND_DARK }}>{tpl.name}</span>
                              <span className="text-xs font-bold shrink-0" style={{ color: BRAND_YELLOW }}>{formatCurrency(tplTotal)}</span>
                            </div>
                            <p className="text-[10px] line-clamp-2 leading-relaxed" style={{ color: BRAND_MUTED }}>{tpl.description}</p>
                            {panelCount && <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0FDF4', color: '#059669' }}><Sun className="h-2.5 w-2.5" />{panelCount.quantity} panels · {((panelCount.quantity * 410) / 1000).toFixed(1)}kWp</span>}
                          </div>
                        </div>
                      </motion.button>
                    ) })}</div>
                  </TabsContent>
                  {templates.length > 0 && (
                    <TabsContent value="custom" className="mt-2"><Select onValueChange={loadTemplate}><SelectTrigger><SelectValue placeholder="Choose a custom template..." /></SelectTrigger><SelectContent>{templates.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent></Select></TabsContent>
                  )}
                </Tabs>
              </div>
            )}

            <div className="space-y-1.5"><Label className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Client-facing Description</Label><Textarea value={form.clientDescription} onChange={(e) => setForm({ ...form, clientDescription: e.target.value })} placeholder="This description will be visible to the client in the proposal preview..." rows={3} /></div>

            {/* ROI Preview */}
            <ROICalculator lineItems={lineItems} />

            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label className="text-base font-semibold">Line Items</Label>
                <div className="flex items-center gap-1.5">
                  <DropdownMenu open={showQuickAdd} onOpenChange={setShowQuickAdd}><DropdownMenuTrigger asChild><Button type="button" variant="outline" size="sm" className="text-xs"><Zap className="h-3 w-3 mr-1" />Quick Add</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="max-h-64 overflow-y-auto w-64">{QUICK_ADD_ITEMS.map((item, i) => (<DropdownMenuItem key={i} onClick={() => addQuickItem(item)}><div className="flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-[10px]" style={{ color: BRAND_MUTED }}>{item.description}</p></div><span className="text-xs font-medium ml-2" style={{ color: BRAND_DARK }}>{formatCurrency(item.unitPrice)}</span></DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="text-xs" style={{ borderColor: BRAND_YELLOW, color: BRAND_DARK }}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
                </div>
              </div>
              <div className="space-y-2">{lineItems.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-lg p-3 space-y-2 border" style={{ backgroundColor: '#FFFFFF', borderColor: BRAND_BORDER }}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0" style={{ color: BRAND_MUTED }} />
                    <Input value={item.name} onChange={(e) => updateLineItem(index, 'name', e.target.value)} placeholder="Item name *" className="flex-1 h-8 text-sm" />
                    {item.unitPrice < 0 && <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">Grant</Badge>}
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 hover:text-red-500" onClick={() => removeLineItem(index)} disabled={lineItems.length <= 1}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="pl-6"><Input value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} placeholder="Description" className="h-7 text-xs" /></div>
                  <div className="grid grid-cols-3 gap-2 pl-6">
                    <div className="space-y-1"><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Qty</span><Input type="number" min={1} value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Unit Price</span><Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Total</span><div className="h-8 flex items-center px-3 rounded-md border text-sm font-medium" style={{ color: item.total < 0 ? '#10B981' : BRAND_DARK }}>{formatCurrency(item.total)}</div></div>
                  </div>
                </motion.div>
              ))}</div>
              <div className="flex items-center gap-3"><Label className="text-sm shrink-0">Bulk Discount</Label><Input type="number" min={0} max={100} value={bulkDiscount} onChange={(e) => setBulkDiscount(parseFloat(e.target.value) || 0)} className="h-8 w-20 text-sm" /><span className="text-sm" style={{ color: BRAND_MUTED }}>%</span>{discountAmount > 0 && <span className="text-sm font-medium text-emerald-600">\u2212{formatCurrency(discountAmount)}</span>}</div>
              <div className="rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: `${BRAND_YELLOW}12`, border: `1px solid ${BRAND_YELLOW}40` }}><span className="font-semibold" style={{ color: BRAND_MUTED }}>Total Amount</span><span className="text-2xl font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(total)}</span></div>
            </div>

            <div className="space-y-1.5"><Label>Proposal Notes (Client-facing)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Terms and conditions, payment terms, warranty info..." rows={3} /></div>
            <div className="space-y-1.5"><Label className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Internal Notes</Label><Textarea value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} placeholder="Internal notes, not visible to the client..." rows={2} /></div>
          </div>
        </div>
        <div className="border-t p-4 flex items-center justify-between gap-3" style={{ borderColor: BRAND_BORDER }}>
          <Button variant="outline" onClick={onClose} style={{ color: BRAND_MUTED }}>Cancel</Button>
          <div className="flex items-center gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || sendMutation.isPending || !form.title} variant="outline">{saveMutation.isPending ? 'Saving...' : 'Save as Draft'}</Button>
            <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || saveMutation.isPending || !form.title} className="font-medium" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>{sendMutation.isPending ? 'Sending...' : <><Send className="h-4 w-4 mr-1.5" />Save & Send</>}</Button>
          </div>
        </div>
      </div>
      <TemplatePreviewDialog template={templatePreview} open={!!templatePreview} onClose={() => setTemplatePreview(null)} onApply={loadBuiltInTemplate} />
    </>
  )
}

// ── Proposal Detail (Enhanced) ──
function ProposalDetail({ proposal, onClose, onEdit }: { proposal: Proposal; onClose: () => void; onEdit: (p: Proposal) => void }) {
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(EMAIL_TEMPLATES[0])
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<ProposalComment[]>([{ id: '1', content: 'Initial proposal created', isInternal: true, createdAt: proposal.createdAt }])
  const [activeTab, setActiveTab] = useState('details')
  const validityDays = daysUntil(proposal.validUntil)
  const isExpired = validityDays !== null && validityDays < 0
  const isExpiringSoon = validityDays !== null && validityDays >= 0 && validityDays <= 7

  const sendMutation = useMutation({ mutationFn: () => fetch(`/api/crm/proposals/${proposal.id}/send`, { method: 'POST' }).then((r) => r.json()), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); queryClient.invalidateQueries({ queryKey: ['proposal', proposal.id] }); toast.success('Proposal sent!') }, onError: () => toast.error('Failed to send') })
  const statusMutation = useMutation({ mutationFn: (status: string) => fetch(`/api/crm/proposals/${proposal.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).then((r) => r.json()), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); queryClient.invalidateQueries({ queryKey: ['proposal', proposal.id] }); toast.success('Status updated') }, onError: () => toast.error('Failed to update status') })
  const deleteMutation = useMutation({ mutationFn: () => fetch(`/api/crm/proposals/${proposal.id}`, { method: 'DELETE' }).then((r) => r.json()), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); toast.success('Proposal deleted'); onClose() }, onError: () => toast.error('Failed to delete') })
  const saveTemplateMutation = useMutation({ mutationFn: () => fetch('/api/crm/proposals/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: templateName, description: `Template from ${proposal.title}`, lineItems: proposal.lineItems?.map(({ id: _id, ...rest }) => rest) || [] }) }).then((r) => r.json()), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template saved!'); setSaveTemplateOpen(false); setTemplateName('') }, onError: () => toast.error('Failed to save template') })
  const createInvoiceMutation = useMutation({ mutationFn: () => fetch('/api/crm/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposalId: proposal.id, contactId: proposal.contact?.id, companyId: proposal.company?.id, dealId: proposal.deal?.id, lineItems: proposal.lineItems || [], totalAmount: proposal.totalAmount }) }).then((r) => { if (!r.ok) throw new Error('Failed to create invoice'); return r.json() }), onSuccess: () => { toast.success('Invoice created from proposal!'); setInvoiceOpen(false) }, onError: (err: Error) => toast.error(err.message) })
  const duplicateMutation = useMutation({ mutationFn: () => fetch(`/api/crm/proposals/${proposal.id}/duplicate`, { method: 'POST' }).then((r) => r.json()), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); toast.success('Proposal duplicated!'); onClose() }, onError: () => toast.error('Failed to duplicate') })

  const addComment = () => { if (!newComment.trim()) return; setComments([...comments, { id: crypto.randomUUID(), content: newComment, isInternal: true, createdAt: new Date().toISOString() }]); setNewComment(''); toast.success('Comment added') }

  const processEmailVars = (text: string) => text.replace(/\{\{proposal_title\}\}/g, proposal.title).replace(/\{\{contact_name\}\}/g, proposal.contact ? `${proposal.contact.firstName} ${proposal.contact.lastName}` : 'Valued Customer').replace(/\{\{total_amount\}\}/g, formatCurrency(proposal.totalAmount)).replace(/\{\{valid_until\}\}/g, proposal.validUntil ? formatDate(proposal.validUntil) : 'N/A').replace(/\{\{company_name\}\}/g, proposal.company?.name || 'Your Company')

  const handleDownloadPDF = () => { window.open(`/api/crm/proposals/${proposal.id}/pdf`, '_blank'); toast.success('Generating PDF...') }

  return (
    <>
      <div className="flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">{proposal.title}</SheetTitle>
                {proposal.version && <Badge variant="outline" className="text-[10px]">v{proposal.version}</Badge>}
              </div>
              <SheetDescription>Created {formatDate(proposal.createdAt)}</SheetDescription>
            </div>
            <ProposalStatusBadge status={isExpired ? 'expired' : proposal.status} />
          </div>
          {(isExpired || isExpiringSoon) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: isExpired ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${isExpired ? '#FECACA' : '#FDE68A'}` }}>
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: isExpired ? '#EF4444' : '#F59E0B' }} />
              <span className="text-xs font-medium" style={{ color: isExpired ? '#DC2626' : '#D97706' }}>{isExpired ? `This proposal expired ${Math.abs(validityDays!)} days ago` : `This proposal expires in ${validityDays} day${validityDays !== 1 ? 's' : ''}`}</span>
            </motion.div>
          )}
        </SheetHeader>

        <div className="px-6 pt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 text-xs">Preview</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 text-xs">Activity</TabsTrigger>
              <TabsTrigger value="emails" className="flex-1 text-xs">Emails</TabsTrigger>
              <TabsTrigger value="comments" className="flex-1 text-xs">Comments</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {proposal.contact && <div className="rounded-lg p-3 border" style={{ backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER }}><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Contact</span><a href={`/crm/contacts/${proposal.contact.id}`} className="text-sm font-medium mt-0.5 hover:underline block" style={{ color: BRAND_YELLOW, textDecoration: 'none' }}>{proposal.contact.firstName} {proposal.contact.lastName}</a><p className="text-xs" style={{ color: BRAND_MUTED }}>{proposal.contact.email}</p></div>}
                {proposal.company && <div className="rounded-lg p-3 border" style={{ backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER }}><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Company</span><a href="/crm/companies" className="text-sm font-medium mt-0.5 hover:underline block" style={{ color: BRAND_YELLOW, textDecoration: 'none' }}>{proposal.company.name}</a></div>}
                {proposal.deal && <div className="rounded-lg p-3 border" style={{ backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER }}><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Deal</span><a href="/crm/pipeline" className="text-sm font-medium mt-0.5 hover:underline block" style={{ color: BRAND_YELLOW, textDecoration: 'none' }}>{proposal.deal.title}</a></div>}
                <div className="rounded-lg p-3 border" style={{ backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER }}><span className="text-[10px] uppercase font-medium" style={{ color: BRAND_MUTED }}>Valid Until</span><p className="text-sm font-medium mt-0.5 flex items-center gap-1.5" style={{ color: BRAND_DARK }}><Calendar className="h-3.5 w-3.5" />{formatDate(proposal.validUntil)}</p></div>
              </div>

              {/* Client Portal Link */}
              <ClientPortalLink proposalId={proposal.id} />

              {/* Version History */}
              <div><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND_DARK }}><GitBranch className="h-4 w-4" />Version History</h3><VersionHistory proposal={proposal} /></div>

              {/* Status Timeline */}
              <div><h3 className="text-sm font-semibold mb-3" style={{ color: BRAND_DARK }}>Status Timeline</h3><StatusTimeline proposal={proposal} /></div>

              {/* AI Suggestions */}
              <div><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND_DARK }}><Sparkles className="h-4 w-4" style={{ color: BRAND_YELLOW }} />Smart Insights</h3><AISuggestions proposal={proposal} /></div>

              {/* Line Items */}
              {proposal.lineItems && proposal.lineItems.length > 0 && (
                <div><h3 className="text-sm font-semibold mb-3" style={{ color: BRAND_DARK }}>Line Items</h3>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: BRAND_BORDER }}><table className="w-full"><thead><tr style={{ backgroundColor: '#F9FAFB' }}><th className="text-left text-[10px] uppercase font-medium px-3 py-2" style={{ color: BRAND_MUTED }}>Item</th><th className="text-right text-[10px] uppercase font-medium px-3 py-2 w-12" style={{ color: BRAND_MUTED }}>Qty</th><th className="text-right text-[10px] uppercase font-medium px-3 py-2 w-20" style={{ color: BRAND_MUTED }}>Unit</th><th className="text-right text-[10px] uppercase font-medium px-3 py-2 w-20" style={{ color: BRAND_MUTED }}>Total</th></tr></thead><tbody>{proposal.lineItems.map((item) => (<tr key={item.id} style={{ borderTop: `1px solid ${BRAND_BORDER}` }}><td className="px-3 py-2.5"><p className="text-sm font-medium" style={{ color: BRAND_DARK }}>{item.name}</p>{item.description && <p className="text-xs" style={{ color: BRAND_MUTED }}>{item.description}</p>}</td><td className="px-3 py-2.5 text-right text-sm" style={{ color: BRAND_MUTED }}>{item.quantity}</td><td className="px-3 py-2.5 text-right text-sm" style={{ color: BRAND_MUTED }}>{formatCurrency(item.unitPrice)}</td><td className="px-3 py-2.5 text-right text-sm font-medium" style={{ color: item.total < 0 ? '#10B981' : BRAND_DARK }}>{formatCurrency(item.total)}</td></tr>))}</tbody><tfoot><tr style={{ backgroundColor: `${BRAND_YELLOW}10`, borderTop: `1px solid ${BRAND_YELLOW}30` }}><td colSpan={3} className="px-3 py-3 text-sm font-semibold text-right" style={{ color: BRAND_MUTED }}>Total</td><td className="px-3 py-3 text-right text-base font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(proposal.totalAmount)}</td></tr></tfoot></table></div>
                </div>
              )}

              {proposal.lineItems?.some((li) => li.unitPrice < 0) && (
                <div className="rounded-lg p-4 border" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
                  <div className="flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-emerald-700" /><span className="text-sm font-semibold text-emerald-800">SEAI Grant Information</span></div>
                  <p className="text-xs text-emerald-700 mb-2">This proposal includes SEAI grant deductions. The grant application will be handled once the proposal is accepted.</p>
                  <div className="text-xs text-emerald-600">Total grant savings: <span className="font-bold text-emerald-800">{formatCurrency(Math.abs(proposal.lineItems.filter((li) => li.unitPrice < 0).reduce((s, li) => s + li.total, 0)))}</span></div>
                </div>
              )}

              {proposal.notes && <div><h3 className="text-sm font-semibold mb-2" style={{ color: BRAND_DARK }}>Notes</h3><div className="rounded-lg p-3 text-sm whitespace-pre-wrap border" style={{ color: BRAND_MUTED, backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER }}>{proposal.notes}</div></div>}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-6 space-y-4">
              {/* ROI Calculator */}
              <ROICalculator lineItems={proposal.lineItems} />

              {/* Rich Document Preview */}
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: BRAND_BORDER, backgroundColor: '#FFFFFF' }}>
                <div className="p-8 text-center" style={{ backgroundColor: BRAND_DARK }}>
                  <div className="inline-block rounded-lg px-4 py-1.5 mb-3" style={{ backgroundColor: BRAND_YELLOW }}><span className="text-xs font-bold" style={{ color: BRAND_DARK }}>{proposal.company?.name || 'Your Company'}</span></div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: '#FFFFFF' }}>{proposal.title}</h2>
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>{proposal.version ? `Version ${proposal.version} \u2013 ` : ''}{formatDate(proposal.createdAt)}</p>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    {proposal.contact && <div className="text-left"><p className="text-[10px] uppercase" style={{ color: '#9CA3AF' }}>Prepared for</p><p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{proposal.contact.firstName} {proposal.contact.lastName}</p></div>}
                    {proposal.company && <div className="text-left"><p className="text-[10px] uppercase" style={{ color: '#9CA3AF' }}>Company</p><p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{proposal.company.name}</p></div>}
                  </div>
                </div>
                <div className="p-6" style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}><h3 className="text-sm font-bold mb-2" style={{ color: BRAND_DARK }}>Executive Summary</h3><p className="text-sm" style={{ color: BRAND_MUTED }}>{proposal.clientDescription || proposal.notes || 'Please find our detailed proposal for your solar energy installation below.'}</p></div>
                {proposal.lineItems && proposal.lineItems.length > 0 && (
                  <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}>
                    <h3 className="text-sm font-bold mb-3" style={{ color: BRAND_DARK }}>Investment Breakdown</h3>
                    <table className="w-full"><tbody>{proposal.lineItems.map((item) => (<tr key={item.id}><td className="py-1.5 pr-4"><span className="text-sm" style={{ color: BRAND_DARK }}>{item.name}</span>{item.description && <p className="text-xs" style={{ color: BRAND_MUTED }}>{item.description}</p>}</td><td className="py-1.5 text-right text-sm" style={{ color: item.total < 0 ? '#10B981' : BRAND_DARK }}>{formatCurrency(item.total)}</td></tr>))}</tbody><tfoot><tr style={{ borderTop: `2px solid ${BRAND_YELLOW}` }}><td className="pt-3 text-sm font-bold" style={{ color: BRAND_DARK }}>Total Investment</td><td className="pt-3 text-right text-lg font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(proposal.totalAmount)}</td></tr></tfoot></table>
                  </div>
                )}
                <div className="p-6" style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}><h3 className="text-sm font-bold mb-2" style={{ color: BRAND_DARK }}>Terms & Conditions</h3><ul className="text-xs space-y-1" style={{ color: BRAND_MUTED }}><li>\u2022 This proposal is valid for 30 days from the date of issue unless otherwise stated.</li><li>\u2022 Installation will commence within 2\u20134 weeks of acceptance, weather permitting.</li><li>\u2022 All panels carry a 25-year linear performance warranty and 12-year product warranty.</li><li>\u2022 Inverter warranty is 5 years (extendable to 10 years).</li><li>\u2022 Payment terms: 50% deposit upon acceptance, 50% upon completion.</li><li>\u2022 SEAI grant application assistance is included where applicable.</li></ul></div>
                {proposal.validUntil && <div className="p-4 mx-6 mb-4 rounded-lg text-center" style={{ backgroundColor: `${BRAND_YELLOW}15`, border: `1px solid ${BRAND_YELLOW}30` }}><p className="text-xs font-medium" style={{ color: BRAND_DARK }}>This proposal is valid until {formatDate(proposal.validUntil)}</p></div>}
                <div className="p-6"><h3 className="text-sm font-bold mb-4" style={{ color: BRAND_DARK }}>Acceptance</h3><div className="grid grid-cols-2 gap-6"><div className="rounded-lg border p-4" style={{ borderColor: '#10B981' }}><p className="text-xs font-bold text-emerald-700 mb-3">I Accept This Proposal</p><div className="border-b border-dashed mb-2" style={{ borderColor: '#D1D5DB' }}><p className="text-[10px]" style={{ color: BRAND_MUTED }}>Signature</p></div><div className="border-b border-dashed" style={{ borderColor: '#D1D5DB' }}><p className="text-[10px]" style={{ color: BRAND_MUTED }}>Date</p></div></div><div className="rounded-lg border p-4" style={{ borderColor: '#EF4444' }}><p className="text-xs font-bold text-red-700 mb-3">I Decline This Proposal</p><div className="border-b border-dashed mb-2" style={{ borderColor: '#D1D5DB' }}><p className="text-[10px]" style={{ color: BRAND_MUTED }}>Signature</p></div><div className="border-b border-dashed" style={{ borderColor: '#D1D5DB' }}><p className="text-[10px]" style={{ color: BRAND_MUTED }}>Date</p></div></div></div></div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND_DARK }}><Activity className="h-4 w-4" />Activity Feed</h3>
              <ActivityFeed activities={proposal.activities} proposalTitle={proposal.title} />
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: BRAND_DARK }}>Email Templates</h3>
              <div className="space-y-2">{EMAIL_TEMPLATES.map((et) => { const EtIcon = et.icon; return (<button key={et.id} onClick={() => setSelectedEmailTemplate(et)} className="w-full rounded-lg p-3 text-left border transition-all flex items-center gap-3" style={{ backgroundColor: selectedEmailTemplate.id === et.id ? `${BRAND_YELLOW}15` : '#FFFFFF', borderColor: selectedEmailTemplate.id === et.id ? BRAND_YELLOW : BRAND_BORDER }}><EtIcon className="h-4 w-4 shrink-0" style={{ color: BRAND_DARK }} /><div className="flex-1"><p className="text-sm font-medium" style={{ color: BRAND_DARK }}>{et.name}</p><p className="text-xs truncate" style={{ color: BRAND_MUTED }}>{et.subject}</p></div></button>) })}</div>
              <div className="space-y-2"><Label>Subject</Label><div className="rounded-lg p-3 text-sm border" style={{ backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER, color: BRAND_DARK }}>{processEmailVars(selectedEmailTemplate.subject)}</div></div>
              <div className="space-y-2"><Label>Preview</Label><div className="rounded-lg p-3 text-sm whitespace-pre-wrap border max-h-48 overflow-y-auto" style={{ backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER, color: BRAND_MUTED }}>{processEmailVars(selectedEmailTemplate.body)}</div></div>
              <div className="space-y-2"><Label>Template Variables</Label><div className="flex flex-wrap gap-1.5">{['{{proposal_title}}', '{{contact_name}}', '{{total_amount}}', '{{valid_until}}', '{{company_name}}'].map((v) => (<Badge key={v} variant="outline" className="text-[10px]">{v}</Badge>))}</div></div>
              <div className="space-y-2"><Label className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" />Email Delivery History</Label><div className="rounded-lg border p-4" style={{ backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER }}>{proposal.sentAt ? (<div className="space-y-2"><div className="flex items-center justify-between"><span className="text-xs" style={{ color: BRAND_DARK }}>Proposal Delivery</span><Badge className="text-[10px] bg-emerald-100 text-emerald-700">Delivered</Badge></div><p className="text-[10px]" style={{ color: BRAND_MUTED }}>{formatDateTime(proposal.sentAt)}</p></div>) : (<p className="text-xs" style={{ color: BRAND_MUTED }}>No emails sent yet.</p>)}</div></div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: BRAND_DARK }}>Proposal Comments</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">{comments.map((c) => (<div key={c.id} className="rounded-lg p-3 border" style={{ backgroundColor: c.isInternal ? '#FFFBEB' : '#F9FAFB', borderColor: c.isInternal ? '#FDE68A' : BRAND_BORDER }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium" style={{ color: BRAND_DARK }}>{c.isInternal ? 'Internal Note' : 'Client Comment'}</span><span className="text-[10px]" style={{ color: BRAND_MUTED }}>{formatDateTime(c.createdAt)}</span></div><p className="text-sm" style={{ color: BRAND_MUTED }}>{c.content}</p></div>))}</div>
              <div className="flex gap-2"><Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 h-9 text-sm" onKeyDown={(e) => e.key === 'Enter' && addComment()} /><Button size="sm" onClick={addComment} disabled={!newComment.trim()} style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}><MessageSquare className="h-3.5 w-3.5" /></Button></div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="border-t p-4 space-y-3 shrink-0" style={{ borderColor: BRAND_BORDER }}>
          <div className="flex items-center gap-2 flex-wrap">
            {proposal.status === 'draft' && <Button size="sm" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending} className="font-medium" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}><Send className="h-3.5 w-3.5 mr-1.5" />{sendMutation.isPending ? 'Sending...' : 'Mark as Sent'}</Button>}
            {proposal.status === 'sent' && <Button size="sm" variant="outline" onClick={() => statusMutation.mutate('viewed')} disabled={statusMutation.isPending}><Eye className="h-3.5 w-3.5 mr-1.5" />Mark as Viewed</Button>}
            {(proposal.status === 'sent' || proposal.status === 'viewed') && (<><Button size="sm" variant="outline" onClick={() => statusMutation.mutate('accepted')} disabled={statusMutation.isPending} className="text-emerald-700 border-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Accept</Button><Button size="sm" variant="outline" onClick={() => statusMutation.mutate('revised')} disabled={statusMutation.isPending} className="text-purple-700 border-purple-300"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Revise</Button><Button size="sm" variant="outline" onClick={() => statusMutation.mutate('rejected')} disabled={statusMutation.isPending} className="text-red-700 border-red-300"><XCircle className="h-3.5 w-3.5 mr-1.5" />Reject</Button></>)}
            {isExpired && proposal.status !== 'expired' && <Button size="sm" variant="outline" onClick={() => statusMutation.mutate('expired')} disabled={statusMutation.isPending} className="text-orange-700 border-orange-300"><Clock className="h-3.5 w-3.5 mr-1.5" />Mark Expired</Button>}
            {proposal.status === 'accepted' && <Button size="sm" variant="outline" onClick={() => setInvoiceOpen(true)} className="text-emerald-700 border-emerald-300"><Receipt className="h-3.5 w-3.5 mr-1.5" />Create Invoice</Button>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => onEdit(proposal)}><Edit3 className="h-3.5 w-3.5 mr-1.5" />Edit</Button>
            <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}><Mail className="h-3.5 w-3.5 mr-1.5" />Send Email</Button>
            <Button size="sm" variant="outline" onClick={handleDownloadPDF}><Download className="h-3.5 w-3.5 mr-1.5" />Download PDF</Button>
            <Button size="sm" variant="outline" onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending}><Copy className="h-3.5 w-3.5 mr-1.5" />Duplicate</Button>
            <Button size="sm" variant="outline" onClick={() => { setTemplateName(`${proposal.title} \u2013 Template`); setSaveTemplateOpen(true) }}><Copy className="h-3.5 w-3.5 mr-1.5" />Save Template</Button>
            <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)} className="text-red-600 border-red-300"><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete</Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" />Delete Proposal</DialogTitle><DialogDescription>Are you sure you want to delete &quot;{proposal.title}&quot;? This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}><DialogContent><DialogHeader><DialogTitle>Save as Template</DialogTitle><DialogDescription>Save the line items from this proposal as a reusable template.</DialogDescription></DialogHeader><div className="space-y-2 py-2"><Label>Template Name</Label><Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., Residential 4kW Package" /></div><DialogFooter><Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>Cancel</Button><Button onClick={() => saveTemplateMutation.mutate()} disabled={!templateName || saveTemplateMutation.isPending} className="font-medium" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>{saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Create Invoice from Proposal</DialogTitle><DialogDescription>This will create an invoice with all line items from &quot;{proposal.title}&quot;.</DialogDescription></DialogHeader><div className="space-y-2 py-2"><div className="rounded-lg p-3 border" style={{ backgroundColor: '#F9FAFB', borderColor: BRAND_BORDER }}><div className="flex justify-between text-sm mb-1"><span style={{ color: BRAND_MUTED }}>Invoice Amount</span><span className="font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(proposal.totalAmount)}</span></div><div className="flex justify-between text-sm"><span style={{ color: BRAND_MUTED }}>Contact</span><span style={{ color: BRAND_DARK }}>{proposal.contact ? `${proposal.contact.firstName} ${proposal.contact.lastName}` : '\u2014'}</span></div></div></div><DialogFooter><Button variant="outline" onClick={() => setInvoiceOpen(false)}>Cancel</Button><Button onClick={() => createInvoiceMutation.mutate()} disabled={createInvoiceMutation.isPending} className="font-medium" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}>{createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Send Proposal Email</DialogTitle><DialogDescription>Send a professional email with the proposal summary to the client.</DialogDescription></DialogHeader><div className="space-y-2 py-2"><Label>Email Template</Label><Select value={selectedEmailTemplate.id} onValueChange={(v) => { const found = EMAIL_TEMPLATES.find((et) => et.id === v); if (found) setSelectedEmailTemplate(found) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EMAIL_TEMPLATES.map((et) => (<SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>))}</SelectContent></Select></div><DialogFooter><Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button><Button onClick={() => { toast.success('Email sent successfully!'); setEmailOpen(false) }} className="font-medium" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}><Send className="h-4 w-4 mr-1.5" />Send Email</Button></DialogFooter></DialogContent></Dialog>
    </>
  )
}

// ── Kanban Column ──
function KanbanColumn({ status, proposals, columnTotal, onCardClick, selectedIds, onToggleSelect }: {
  status: string; proposals: Proposal[]; columnTotal: number; onCardClick: (p: Proposal) => void; selectedIds: Set<string>; onToggleSelect: (id: string) => void
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const StatusIcon = config.icon
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${BRAND_YELLOW}20` }}><StatusIcon className="h-3.5 w-3.5" style={{ color: BRAND_DARK }} /></div><div><h3 className="text-sm font-semibold" style={{ color: BRAND_DARK }}>{config.label}</h3></div></div>
        <Badge variant="secondary" className="text-[10px]">{proposals.length}</Badge>
      </div>
      {columnTotal > 0 && <div className="rounded-md px-2.5 py-1.5 mb-2 flex items-center justify-between" style={{ backgroundColor: '#F9FAFB' }}><span className="text-[10px] font-medium" style={{ color: BRAND_MUTED }}>Total Value</span><span className="text-xs font-bold" style={{ color: BRAND_DARK }}>{formatCurrency(columnTotal)}</span></div>}
      <div className="flex-1 space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">{proposals.map((p) => (<ProposalCard key={p.id} proposal={p} onClick={onCardClick} selected={selectedIds.has(p.id)} onToggleSelect={() => onToggleSelect(p.id)} />))}</AnimatePresence>
        {proposals.length === 0 && <div className="rounded-lg p-6 text-center border border-dashed" style={{ borderColor: BRAND_BORDER }}><p className="text-xs" style={{ color: BRAND_MUTED }}>No proposals</p></div>}
      </div>
    </div>
  )
}

// ── Quick Stats Bar ──
function QuickStatsBar({ proposals }: { proposals: Proposal[] }) {
  const total = proposals.length
  const pipelineValue = proposals.filter(p => ['draft', 'sent', 'viewed'].includes(p.status)).reduce((s, p) => s + p.totalAmount, 0)
  const accepted = proposals.filter(p => p.status === 'accepted').length
  const rejected = proposals.filter(p => p.status === 'rejected').length
  const winRate = (accepted + rejected) > 0 ? Math.round((accepted / (accepted + rejected)) * 100) : 0
  const acceptedProposals = proposals.filter(p => p.status === 'accepted' && p.acceptedAt && p.sentAt)
  const avgDays = acceptedProposals.length > 0 ? Math.round(acceptedProposals.reduce((s, p) => s + daysBetween(p.sentAt!, p.acceptedAt!), 0) / acceptedProposals.length) : 0

  const stats = [
    { label: 'Total Proposals', value: total.toString(), icon: FileText, color: BRAND_YELLOW },
    { label: 'Pipeline Value', value: formatCurrency(pipelineValue), icon: Euro, color: '#3B82F6' },
    { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: '#10B981' },
    { label: 'Avg. Close Time', value: `${avgDays}d`, icon: Timer, color: '#F97316' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => {
        const SIcon = s.icon
        return (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-lg px-4 py-3 border flex items-center gap-3" style={{ borderColor: BRAND_BORDER, backgroundColor: '#FFFFFF' }}>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}><SIcon className="h-4.5 w-4.5" style={{ color: s.color }} /></div>
            <div className="min-w-0"><p className="text-[10px] uppercase font-medium truncate" style={{ color: BRAND_MUTED }}>{s.label}</p><p className="text-base font-bold" style={{ color: BRAND_DARK }}>{s.value}</p></div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Batch Action Bar ──
function BatchActionBar({ selectedIds, onClear, onBatchStatus }: { selectedIds: Set<string>; onClear: () => void; onBatchStatus: (status: string) => void }) {
  if (selectedIds.size === 0) return null
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="rounded-lg px-4 py-3 border flex items-center justify-between flex-wrap gap-3" style={{ borderColor: BRAND_YELLOW, backgroundColor: `${BRAND_YELLOW}10` }}>
      <div className="flex items-center gap-3"><CheckSquare className="h-4 w-4" style={{ color: BRAND_YELLOW }} /><span className="text-sm font-semibold" style={{ color: BRAND_DARK }}>{selectedIds.size} proposal{selectedIds.size > 1 ? 's' : ''} selected</span><Button size="sm" variant="ghost" onClick={onClear} className="text-xs h-7">Clear</Button></div>
      <div className="flex items-center gap-2">
        <Select onValueChange={onBatchStatus}><SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Change status..." /></SelectTrigger><SelectContent>{KANBAN_COLUMNS.map(s => (<SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label}</SelectItem>))}</SelectContent></Select>
      </div>
    </motion.div>
  )
}

// ── Main Proposals Page ──
export default function ProposalsPageContent() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'updated' | 'value' | 'created' | 'validUntil'>('updated')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'analytics'>('kanban')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [comparisonOpen, setComparisonOpen] = useState(false)

  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ['proposals', search, statusFilter],
    queryFn: () => { const params = new URLSearchParams(); if (search) params.set('search', search); if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter); params.set('limit', '100'); return fetch(`/api/crm/proposals?${params}`).then((r) => r.json()) },
    refetchInterval: 10000,
  })
  const { data: contactsData } = useQuery({ queryKey: ['contacts-mini'], queryFn: () => fetch('/api/crm/contacts?limit=100').then((r) => r.json()) })
  const { data: dealsData } = useQuery({ queryKey: ['deals-mini'], queryFn: () => fetch('/api/crm/deals?limit=100').then((r) => r.json()) })
  const { data: companiesData } = useQuery({ queryKey: ['companies-mini'], queryFn: () => fetch('/api/crm/companies?limit=100').then((r) => r.json()) })
  const { data: templatesData } = useQuery({ queryKey: ['templates'], queryFn: () => fetch('/api/crm/proposals/templates').then((r) => r.json()) })
  const { data: proposalDetail } = useQuery({ queryKey: ['proposal', selectedProposal?.id], queryFn: () => fetch(`/api/crm/proposals/${selectedProposal!.id}`).then((r) => r.json()), enabled: !!selectedProposal && detailOpen })

  const fullProposal = proposalDetail?.proposal || selectedProposal
  const proposals: Proposal[] = useMemo(() => proposalsData?.proposals || [], [proposalsData])
  const contacts = contactsData?.contacts || []
  const deals = dealsData?.deals || []
  const companies = companiesData?.companies || []
  const templates = templatesData?.templates || []

  const processedProposals = useMemo(() => {
    return proposals.map((p) => {
      if (p.status === 'sent' || p.status === 'viewed') { const days = daysUntil(p.validUntil); if (days !== null && days < 0) return { ...p, _isExpired: true } }
      return p
    }).sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1
      switch (sortBy) {
        case 'value': return dir * (a.totalAmount - b.totalAmount)
        case 'created': return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        case 'validUntil': return dir * ((new Date(a.validUntil || 0).getTime()) - (new Date(b.validUntil || 0).getTime()))
        default: return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      }
    })
  }, [proposals, sortBy, sortDir])

  const grouped = KANBAN_COLUMNS.reduce((acc, status) => { acc[status] = processedProposals.filter((p) => p.status === status || (status === 'expired' && (p as Record<string, unknown>)._isExpired)); return acc }, {} as Record<string, Proposal[]>)
  const columnTotals = KANBAN_COLUMNS.reduce((acc, status) => { acc[status] = grouped[status].reduce((sum, p) => sum + p.totalAmount, 0); return acc }, {} as Record<string, number>)

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIds.size === processedProposals.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(processedProposals.map(p => p.id)))
  }, [processedProposals, selectedIds.size])

  const batchStatusMutation = useMutation({
    mutationFn: (status: string) => fetch('/api/crm/proposals/batch-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedIds), status }) }).then(r => r.json()),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); toast.success(`${data.updated} proposals updated`); setSelectedIds(new Set()) },
    onError: () => toast.error('Failed to update statuses'),
  })

  const comparisonProposals = useMemo(() => {
    return Array.from(selectedIds).map(id => processedProposals.find(p => p.id === id)).filter(Boolean) as Proposal[]
  }, [selectedIds, processedProposals])

  const handleCardClick = useCallback((p: Proposal) => { setSelectedProposal(p); setDetailOpen(true) }, [])
  const handleEdit = useCallback((p: Proposal) => { setEditingProposal(p); setEditOpen(true) }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: '#FFFFFF', borderColor: BRAND_BORDER }}>
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: BRAND_DARK }}>Proposals</h1>
              <p className="text-sm mt-0.5" style={{ color: BRAND_MUTED }}>Manage solar installation proposals and templates</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Comparison button */}
              {selectedIds.size >= 2 && selectedIds.size <= 3 && (
                <Button variant="outline" size="sm" onClick={() => setComparisonOpen(true)} className="text-xs">
                  <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />Compare ({selectedIds.size})
                </Button>
              )}
              <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: BRAND_BORDER }}>
                <button onClick={() => setViewMode('kanban')} className="px-3 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: viewMode === 'kanban' ? BRAND_DARK : '#FFFFFF', color: viewMode === 'kanban' ? '#FFFFFF' : BRAND_MUTED }}>Kanban</button>
                <button onClick={() => setViewMode('analytics')} className="px-3 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: viewMode === 'analytics' ? BRAND_DARK : '#FFFFFF', color: viewMode === 'analytics' ? '#FFFFFF' : BRAND_MUTED }}>Analytics</button>
              </div>
              <Button onClick={() => { setEditingProposal(null); setEditOpen(true) }} className="font-medium" style={{ backgroundColor: BRAND_YELLOW, color: BRAND_DARK }}><Plus className="h-4 w-4 mr-1.5" />New Proposal</Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4"><QuickStatsBar proposals={proposals} /></div>

          {/* Enhanced Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: BRAND_MUTED }} /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search proposals..." className="pl-9 h-9" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{KANBAN_COLUMNS.map((s) => (<SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</SelectItem>))}</SelectContent></Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}><SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder="Sort by" /></SelectTrigger><SelectContent><SelectItem value="updated">Last Updated</SelectItem><SelectItem value="value">Value</SelectItem><SelectItem value="created">Created</SelectItem><SelectItem value="validUntil">Valid Until</SelectItem></SelectContent></Select>
            <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} className="h-9 px-3 rounded-md border flex items-center gap-1.5 text-xs font-medium" style={{ borderColor: BRAND_BORDER, color: BRAND_MUTED }}>
              {sortDir === 'desc' ? <ArrowDownUp className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}{sortDir === 'desc' ? 'Descending' : 'Ascending'}
            </button>
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-9 shrink-0">
              {selectedIds.size === processedProposals.length && processedProposals.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Batch Action Bar */}
          <div className="mt-3"><BatchActionBar selectedIds={selectedIds} onClear={() => setSelectedIds(new Set())} onBatchStatus={(status) => batchStatusMutation.mutate(status)} /></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="text-center"><div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: BRAND_YELLOW, borderTopColor: 'transparent' }} /><p className="text-sm" style={{ color: BRAND_MUTED }}>Loading proposals...</p></div></div>
        ) : viewMode === 'analytics' ? (
          <ProposalAnalytics proposals={proposals} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {KANBAN_COLUMNS.map((status) => (
              <KanbanColumn key={status} status={status} proposals={grouped[status] || []} columnTotal={columnTotals[status] || 0} onCardClick={handleCardClick} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}><SheetContent className="w-full sm:max-w-lg"><SheetHeader><SheetTitle>{editingProposal ? 'Edit Proposal' : 'Create Proposal'}</SheetTitle><SheetDescription>{editingProposal ? 'Update the proposal details and line items.' : 'Fill in the details to create a new solar proposal.'}</SheetDescription></SheetHeader><ProposalForm proposal={editingProposal || undefined} contacts={contacts} deals={deals} companies={companies} templates={templates} onClose={() => setEditOpen(false)} /></SheetContent></Sheet>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}><SheetContent className="w-full sm:max-w-2xl">{fullProposal ? (<ProposalDetail proposal={fullProposal} onClose={() => { setDetailOpen(false); setSelectedProposal(null) }} onEdit={(p) => { setDetailOpen(false); handleEdit(p) }} />) : (<div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: BRAND_YELLOW, borderTopColor: 'transparent' }} /></div>)}</SheetContent></Sheet>

      {/* Comparison Dialog */}
      <ProposalComparisonDialog proposals={comparisonProposals} open={comparisonOpen} onClose={() => setComparisonOpen(false)} />
    </div>
  )
}
