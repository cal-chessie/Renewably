'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Building2, MapPin, Mail, Phone, Users, Globe,
  Clock, Truck, Shield, Hash, DollarSign, FileText, Link2,
  CheckCircle2, AlertTriangle, Star, Wrench, Zap, Sun, Battery,
  Grid3x3, Plug, Calendar, Pencil, MessageSquare, PhoneCall,
  Trash2, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2,
  LayoutDashboard, Activity, BarChart3, Settings,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/format'
import {
  PLAN_COLORS, SUBSCRIPTION_COLORS, SPECIALIZATION_LABELS, DOCUMENT_TYPES, EQUIPMENT_ICONS,
} from '../types'
import type { InstallerDetail } from '../types'
import { HealthScoreGauge } from './HealthScoreGauge'
import { OnboardingTracker } from './OnboardingTracker'
import { ActivityTimeline } from './ActivityTimeline'
import { PerformanceCharts } from './PerformanceCharts'
import { EditInstallerDialog } from './EditInstallerDialog'

function PlanBadge({ plan }: { plan: string }) {
  const colors = PLAN_COLORS[plan.toLowerCase()] || PLAN_COLORS.starter
  return <Badge variant="outline" className="font-semibold text-[11px]" style={colors}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Badge>
}

function SubscriptionBadge({ status }: { status: string }) {
  const colors = SUBSCRIPTION_COLORS[status.toLowerCase()] || SUBSCRIPTION_COLORS.active
  return <Badge variant="outline" className="text-[11px] font-medium" style={colors}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
}

function CertificationBadge({ label, registered }: { label: string; registered: boolean }) {
  return (
    <Badge variant="outline" className="text-[11px] font-medium" style={registered ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#4ADE80', border: '1px solid rgba(16,185,129,0.2)' } : { backgroundColor: '#1A1A1A', color: '#A0A0A0', border: '1px solid #2A2A2A' }}>
      {registered ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  )
}

const TAB_CONFIG = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'performance', label: 'Analytics', icon: BarChart3 },
  { key: 'edit', label: 'Edit', icon: Settings },
] as const

type TabKey = typeof TAB_CONFIG[number]['key']

interface InstallerDetailPanelProps {
  installerId: string
  onClose: () => void
}

export function InstallerDetailPanel({ installerId, onClose }: InstallerDetailPanelProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['installer-detail', installerId],
    queryFn: () => fetch(`/api/crm/installers/${installerId}`).then(r => r.json()),
    enabled: !!installerId,
    retry: 1,
  })

  const { data: perfData } = useQuery({
    queryKey: ['installer-performance', installerId],
    queryFn: () => fetch(`/api/crm/installers/${installerId}/performance`).then(r => r.json()),
    enabled: !!installerId,
  })

  const performance = perfData?.performance || null

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/installers/${installerId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installers'] })
      queryClient.invalidateQueries({ queryKey: ['installer-stats'] })
      toast.success('Installer deleted successfully')
      onClose()
    },
    onError: () => toast.error('Failed to delete installer'),
  })

  const installer: InstallerDetail | null = data?.installer || null

  if (isLoading) {
    return (
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ position: 'fixed', inset: 0, right: 0, width: '100%', maxWidth: 640, backgroundColor: '#141414', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="animate-pulse" style={{ color: '#6B7280' }}>Loading installer profile...</div>
      </motion.div>
    )
  }

  if (!installer) {
    return isError ? (
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ position: 'fixed', inset: 0, right: 0, width: '100%', maxWidth: 640, backgroundColor: '#141414', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle style={{ width: 32, height: 32, color: '#F87171', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#A0A0A0' }}>Failed to load installer profile</p>
          <button onClick={onClose} style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: '#F3D840', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Go back</button>
        </div>
      </motion.div>
    ) : null
  }

  const healthScore = performance?.healthScore ?? 0
  const mrr = performance?.mrr ?? installer.mrr ?? 0

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 }} onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ position: 'fixed', inset: 0, right: 0, width: '100%', maxWidth: 640, backgroundColor: '#141414', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid #2A2A2A', padding: '24px 32px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(243,216,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 style={{ width: 24, height: 24, color: '#8a7500' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{installer.companyName}</h2>
                <p style={{ fontSize: 13, color: '#A0A0A0', margin: '4px 0 0' }}>{installer.contactName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <PlanBadge plan={installer.plan} />
                  {installer.subscription && <SubscriptionBadge status={installer.subscription.status} />}
                  <Badge variant="outline" className="text-[11px] font-medium" style={installer.onboardingComplete ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#4ADE80', border: '1px solid rgba(16,185,129,0.2)' } : { backgroundColor: 'rgba(202,138,4,0.12)', color: '#FACC15', border: '1px solid rgba(202,138,4,0.2)' }}>
                    {installer.onboardingComplete ? '✓ Onboarded' : `Step ${installer.onboardingStep}/10`}
                  </Badge>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ padding: 4, borderRadius: 8, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#A0A0A0', transition: 'color 0.2s' }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Health Score + MRR + Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <HealthScoreGauge score={healthScore} size={80} strokeWidth={6} />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF' }}>{formatCurrency(mrr)}</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>MRR</span>
                <ArrowUpRight style={{ width: 14, height: 14, color: '#4ADE80' }} />
              </div>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {[
                { key: 'overview', icon: LayoutDashboard, label: 'View' },
                { key: 'activity', icon: MessageSquare, label: 'Note' },
                { key: 'edit', icon: Pencil, label: 'Edit' },
              ].map(btn => {
                const Icon = btn.icon
                const isActive = activeTab === btn.key
                return (
                  <button
                    key={btn.key}
                    onClick={() => setActiveTab(btn.key as TabKey)}
                    title={btn.label}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: `1px solid ${isActive ? 'rgba(243,216,64,0.4)' : '#2A2A2A'}`,
                      backgroundColor: isActive ? 'rgba(243,216,64,0.1)' : '#222222',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon style={{ width: 16, height: 16, color: isActive ? '#F3D840' : '#9CA3AF' }} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginTop: 16, borderBottom: '1px solid #1E1E1E', paddingBottom: 0 }}>
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#F3D840' : '#6B7280',
                    borderBottom: `2px solid ${isActive ? '#F3D840' : 'transparent'}`,
                    marginBottom: -1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: 2,
                    borderBottomStyle: 'solid',
                    borderBottomColor: isActive ? '#F3D840' : 'transparent',
                  }}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <ScrollArea style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ padding: '32px' }}
            >
              {activeTab === 'overview' && (
                <OverviewTab installer={installer} performance={performance} />
              )}
              {activeTab === 'activity' && (
                <ActivityTimeline installerId={installerId} />
              )}
              {activeTab === 'performance' && (
                <PerformanceCharts installerId={installerId} />
              )}
              {activeTab === 'edit' && (
                <EditInstallerDialog installer={installer} onClose={() => setActiveTab('overview')} />
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Footer with delete */}
        <div style={{ borderTop: '1px solid #2A2A2A', padding: '16px 32px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#4B5563' }}>Created {format(new Date(installer.createdAt), 'd MMM yyyy')}</span>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#6B7280', background: 'none', border: '1px solid #2A2A2A', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#2A2A2A' }}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
              Delete Installer
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#F87171' }}>Are you sure?</span>
              <button onClick={() => { deleteMutation.mutate() }} disabled={deleteMutation.isPending} style={{ padding: '6px 14px', borderRadius: 8, backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: 12, fontWeight: 600, border: 'none', cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {deleteMutation.isPending && <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />}
                Confirm Delete
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '6px 14px', borderRadius: 8, backgroundColor: '#222222', color: '#A0A0A0', fontSize: 12, border: '1px solid #2A2A2A', cursor: 'pointer' }}>Cancel</button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ──────────────────────────── Overview Tab ────────────────────────────
function OverviewTab({ installer, performance }: { installer: InstallerDetail; performance: Record<string, unknown> | null }) {
  const sectionTitle = { fontSize: 13, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 16 }
  const infoRow = (Icon: typeof Mail, label: string, value: string, colour: string = '#60A5FA') => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colour + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 16, height: 16, color: colour }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
        <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{label}</p>
      </div>
    </div>
  )

  const perf = performance as Record<string, unknown> | null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Onboarding Tracker */}
      <div>
        <h3 style={sectionTitle}>Onboarding Progress</h3>
        <OnboardingTracker currentStep={installer.onboardingStep} isComplete={installer.onboardingComplete} />
      </div>

      {/* Performance Summary */}
      {perf && (
        <div>
          <h3 style={sectionTitle}>Performance Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { label: 'Total Installs', value: String(perf.totalInstalls ?? 0), icon: Zap, colour: '#F3D840' },
              { label: 'Lead Conversion', value: `${perf.leadConversionRate ?? 0}%`, icon: TrendingUp, colour: '#10B981' },
              { label: 'Avg Response', value: `${perf.avgResponseTime ?? 0}h`, icon: Clock, colour: '#60A5FA' },
              { label: 'Revenue', value: formatCurrency(perf.revenueGenerated as number), icon: DollarSign, colour: '#A855F7' },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: m.colour + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 16, height: 16, color: m.colour }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{m.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: '2px 0 0' }}>{m.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Company Info */}
      <div>
        <h3 style={sectionTitle}>Company Info</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {installer.description && <p style={{ fontSize: 13, color: '#A0A0A0', lineHeight: 1.6, margin: 0 }}>{installer.description}</p>}
          {installer.website && infoRow(Globe, 'Website', installer.website)}
          {(installer.address || installer.city) && infoRow(MapPin, 'Address', [installer.address, installer.city, installer.eircode].filter(Boolean).join(', '), '#FB923C')}
        </div>
      </div>

      {/* Contact Info */}
      <div>
        <h3 style={sectionTitle}>Contact Info</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {infoRow(Users, 'Primary Contact', installer.contactName, '#9CA3AF')}
          {installer.contactEmail && infoRow(Mail, 'Email', installer.contactEmail, '#60A5FA')}
          {installer.contactPhone && infoRow(Phone, 'Phone', installer.contactPhone, '#34D399')}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <CertificationBadge label={`SEAI${installer.seaiNumber ? ` #${installer.seaiNumber}` : ''}`} registered={installer.seaiRegistered} />
            <CertificationBadge label={`RECI${installer.reciNumber ? ` #${installer.reciNumber}` : ''}`} registered={installer.reciRegistered} />
          </div>
        </div>
      </div>

      {/* Territory */}
      {installer.counties && installer.counties.length > 0 && (
        <div>
          <h3 style={sectionTitle}>Territory & Coverage ({installer.counties.length} counties)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {installer.counties.map(county => (
              <Badge key={county} variant="outline" className="text-[11px]" style={{ backgroundColor: 'rgba(243,216,64,0.08)', color: '#D1D5DB', border: '1px solid rgba(243,216,64,0.2)' }}>
                <MapPin className="h-3 w-3 mr-1" />{county}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {installer.equipment && installer.equipment.length > 0 && (
        <div>
          <h3 style={sectionTitle}>Equipment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {installer.equipment.map(eq => {
              const config = EQUIPMENT_ICONS[eq.category]
              const icons: Record<string, typeof Zap> = { Zap, Battery, Sun, Grid3x3, Plug }
              const Icon = (config ? icons[config.icon] : null) || Zap
              return (
                <div key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, backgroundColor: '#1A1A1A' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 16, height: 16, color: '#A0A0A0' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF', margin: 0 }}>{config?.label || eq.category}</p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{eq.brand}{eq.model ? ` — ${eq.model}` : ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legal Documents */}
      <div>
        <h3 style={sectionTitle}>Legal Documents</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {DOCUMENT_TYPES.map(doc => {
            const docData = installer.documents?.find(d => d.type === doc.key)
            const signed = docData?.signed ?? false
            return (
              <div key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1px solid #2A2A2A' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: signed ? 'rgba(16,185,129,0.12)' : '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText style={{ width: 16, height: 16, color: signed ? '#34D399' : '#6B7280' }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#FFFFFF', margin: 0 }}>{doc.short}</p>
                  <p style={{ fontSize: 11, color: signed ? '#34D399' : '#6B7280', margin: '2px 0 0' }}>
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
        <div>
          <h3 style={sectionTitle}>Subscription</h3>
          <div style={{ padding: 20, borderRadius: 14, backgroundColor: '#1A1A1A', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <PlanBadge plan={installer.subscription.plan} />
                  <SubscriptionBadge status={installer.subscription.status} />
                </div>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{formatCurrency(installer.subscription.mrr)}/mo · Billed {installer.subscription.billingCycle}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{formatCurrency(installer.subscription.mrr)}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>MRR</p>
              </div>
            </div>
            {installer.subscription.currentPeriodStart && installer.subscription.currentPeriodEnd && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
                <Calendar style={{ width: 12, height: 12 }} />
                {format(new Date(installer.subscription.currentPeriodStart), 'MMM d, yyyy')} — {format(new Date(installer.subscription.currentPeriodEnd), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Capacity */}
      <div>
        <h3 style={sectionTitle}>Business Capacity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Years in Business', value: installer.yearsInBusiness, icon: Clock },
            { label: 'Team Size', value: installer.teamSize, icon: Users },
            { label: 'Electricians', value: installer.electricians, icon: Shield },
            { label: 'Vans', value: installer.vans, icon: Truck },
          ].map(m => {
            const Icon = m.icon
            return (
              <div key={m.label} style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: '#1A1A1A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon style={{ width: 14, height: 14, color: '#6B7280' }} />
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{m.label}</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{m.value ?? '—'}</p>
              </div>
            )
          })}
        </div>
        {installer.specializations && installer.specializations.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {installer.specializations.map(s => (
              <Badge key={s} variant="outline" className="text-[11px]" style={{ backgroundColor: 'rgba(168,85,247,0.12)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.2)' }}>
                <Star className="h-3 w-3 mr-1" />{SPECIALIZATION_LABELS[s] || s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Lead Preferences */}
      {installer.leadPreferences && (
        <div>
          <h3 style={sectionTitle}>Lead Preferences</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Max leads/mo', value: installer.leadPreferences.maxLeadsPerMonth, icon: Hash },
              { label: 'Min value', value: installer.leadPreferences.minValue ? formatCurrency(installer.leadPreferences.minValue) : null, icon: DollarSign },
              { label: 'Response time', value: installer.leadPreferences.responseTimeHours ? `${installer.leadPreferences.responseTimeHours}h` : null, icon: Clock },
              { label: 'Travel radius', value: installer.leadPreferences.travelRadiusKm ? `${installer.leadPreferences.travelRadiusKm}km` : null, icon: MapPin },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Icon style={{ width: 14, height: 14, color: '#6B7280' }} />
                  <span style={{ color: '#6B7280' }}>{m.label}:</span>
                  <span style={{ fontWeight: 500, color: '#FFFFFF' }}>{m.value ?? '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Integrations */}
      {installer.integrations && installer.integrations.length > 0 && (
        <div>
          <h3 style={sectionTitle}>Integrations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {installer.integrations.map(int => (
              <div key={int.provider} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, backgroundColor: '#1A1A1A' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: int.connected ? 'rgba(16,185,129,0.12)' : '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Link2 style={{ width: 16, height: 16, color: int.connected ? '#34D399' : '#6B7280' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF', margin: 0, textTransform: 'capitalize' }}>{int.provider.replace(/_/g, ' ')}</p>
                  {int.connectedAt && <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>Connected {format(new Date(int.connectedAt), 'MMM d, yyyy')}</p>}
                </div>
                <Badge variant="outline" className="text-[11px]" style={int.connected ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#4ADE80', border: '1px solid rgba(16,185,129,0.2)' } : { backgroundColor: '#1A1A1A', color: '#6B7280', border: '1px solid #2A2A2A' }}>
                  {int.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
