'use client'

import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight, Users, DollarSign, MapPin, Wrench,
  CheckCircle2, AlertTriangle, Zap, Sun, Battery,
  Grid3x3, Plug, Pencil, Eye, MessageSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/format'
import { HealthScoreGauge } from './HealthScoreGauge'
import { PLAN_COLORS, SUBSCRIPTION_COLORS, EQUIPMENT_ICONS } from '../types'
import type { InstallerRow } from '../types'

function PlanBadge({ plan }: { plan: string }) {
  const colors = PLAN_COLORS[plan.toLowerCase()] || PLAN_COLORS.starter
  return (
    <Badge variant="outline" className="font-semibold text-[11px]" style={colors}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  )
}

function SubscriptionBadge({ status }: { status: string }) {
  const colors = SUBSCRIPTION_COLORS[status.toLowerCase()] || SUBSCRIPTION_COLORS.active
  return (
    <Badge variant="outline" className="text-[11px] font-medium" style={colors}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  )
}

function CertificationBadge({ label, registered }: { label: string; registered: boolean }) {
  return (
    <Badge variant="outline" className="text-[11px] font-medium" style={registered ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#4ADE80', border: '1px solid rgba(16,185,129,0.2)' } : { backgroundColor: '#1A1A1A', color: '#A0A0A0', border: '1px solid #2A2A2A' }}>
      {registered ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  )
}

interface InstallerCardProps {
  installer: InstallerRow
  index: number
  onView: () => void
  onEdit: () => void
  isSelected: boolean
  onToggleSelect: (id: string) => void
}

export const InstallerCard = memo(function InstallerCard({ installer, index, onView, onEdit, isSelected, onToggleSelect }: InstallerCardProps) {
  const progressPercent = Math.round((installer.onboardingStep / 10) * 100)
  const [hovered, setHovered] = useState(false)

  // Compute health score client-side from card data
  const onboardingScore = installer.onboardingComplete ? 100 : (installer.onboardingStep / 10) * 100
  const subscriptionScore = ['active'].includes(installer.subscriptionStatus) ? 100 : ['trialing'].includes(installer.subscriptionStatus) ? 70 : 40
  const registrationScore = ((installer.seaiRegistered ? 1 : 0) + (installer.reciRegistered ? 1 : 0)) / 2 * 100
  const equipmentScore = Math.min((installer.equipmentCategories?.length || 0) / 3, 1) * 100
  const healthScore = Math.round(onboardingScore * 0.30 + subscriptionScore * 0.25 + registrationScore * 0.20 + equipmentScore * 0.25)

  return (
    <motion.div
      key={installer.id}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1.0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      style={{ height: '100%' }}
    >
      <div
        onClick={onView}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid ' + (isSelected ? 'rgba(243,216,64,0.5)' : hovered ? 'rgba(243,216,64,0.3)' : '#2A2A2A'),
          borderLeft: isSelected ? '3px solid #F3D840' : hovered ? '3px solid #F3D840' : '1px solid #2A2A2A',
          borderRadius: 16,
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: hovered
            ? '0 16px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(243,216,64,0.1)'
            : '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
        }}
      >
        {/* Bulk select checkbox (top-left) */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 5,
            opacity: hovered || isSelected ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(installer.id) }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: '#0A0A0A',
            border: '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Quick actions overlay (top-right, on hover) */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 5,
            display: 'flex',
            gap: 4,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: '#0A0A0A',
              border: '1px solid #2A2A2A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(243,216,64,0.4)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A2A' }}
          >
            <Pencil style={{ width: 13, height: 13, color: '#9CA3AF' }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView() }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: '#0A0A0A',
              border: '1px solid #2A2A2A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(243,216,64,0.4)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A2A' }}
          >
            <Eye style={{ width: 13, height: 13, color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Main content */}
        <div style={{ padding: '28px 28px 0', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          {/* Company name + Health Score + Plan */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {installer.companyName}
              </h3>
              <div style={{ height: 2, width: 32, backgroundColor: 'rgba(243,216,64,0.3)', borderRadius: 2, marginTop: 8, marginBottom: 8 }} />
              <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0, lineHeight: 1.4 }}>
                {installer.contactName}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <HealthScoreGauge score={healthScore} size={52} strokeWidth={4} showLabel={false} />
              <PlanBadge plan={installer.plan} />
            </div>
          </div>

          {/* Status badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <SubscriptionBadge status={installer.subscriptionStatus} />
            <Badge
              variant="outline"
              className="text-[11px] font-medium"
              style={installer.onboardingComplete
                ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#4ADE80', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 12px', borderRadius: 20 }
                : { backgroundColor: 'rgba(202,138,4,0.12)', color: '#FACC15', border: '1px solid rgba(202,138,4,0.25)', padding: '4px 12px', borderRadius: 20 }
              }
            >
              {installer.onboardingComplete ? '✓ Onboarded' : `${installer.onboardingStep}/10`}
            </Badge>
            {installer.mrr && (
              <span style={{ fontSize: 11, color: '#34D399', fontWeight: 600 }}>
                {formatCurrency(installer.mrr)}/mo
              </span>
            )}
          </div>

          {/* Onboarding progress */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Onboarding Progress</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#D1D5DB' }}>{progressPercent}%</span>
            </div>
            <div style={{ height: 6, width: '100%', backgroundColor: '#222222', borderRadius: 100, overflow: 'hidden' }}>
              <motion.div
                style={{
                  height: '100%',
                  borderRadius: 100,
                  background: installer.onboardingComplete
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : 'linear-gradient(90deg, #F3D840, #FACC15)',
                  boxShadow: installer.onboardingComplete
                    ? '0 0 12px rgba(16,185,129,0.4)'
                    : progressPercent > 70 ? '0 0 8px rgba(243,216,64,0.3)' : 'none',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.7, delay: index * 0.04 + 0.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Territory pills */}
          {installer.counties && installer.counties.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MapPin style={{ width: 14, height: 14, color: '#6B7280' }} />
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Territory</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {installer.counties.slice(0, 4).map(c => (
                  <span
                    key={c}
                    style={{
                      fontSize: 11,
                      padding: '5px 12px',
                      borderRadius: 20,
                      color: '#D1D5DB',
                      background: 'linear-gradient(135deg, rgba(243,216,64,0.1), rgba(243,216,64,0.04))',
                      border: '1px solid rgba(243,216,64,0.12)',
                      fontWeight: 500,
                    }}
                  >
                    {c}
                  </span>
                ))}
                {installer.counties.length > 4 && (
                  <span style={{
                    fontSize: 11,
                    padding: '5px 12px',
                    borderRadius: 20,
                    color: '#9CA3AF',
                    backgroundColor: '#222222',
                    border: '1px solid #2A2A2A',
                    fontWeight: 500,
                  }}>
                    +{installer.counties.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Equipment section */}
          {installer.equipmentCategories && installer.equipmentCategories.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Wrench style={{ width: 14, height: 14, color: '#6B7280' }} />
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Equipment</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {installer.equipmentCategories.map(cat => {
                  const config = EQUIPMENT_ICONS[cat]
                  if (!config) return null
                  const icons: Record<string, typeof Zap> = { Zap, Battery, Sun, Grid3x3, Plug }
                  const Icon = icons[config.icon] || Zap
                  return (
                    <div
                      key={cat}
                      title={config.label}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: '#1E1E1E',
                        border: '1px solid #2A2A2A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon style={{ width: 16, height: 16, color: '#A0A0A0' }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Certifications */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CertificationBadge label="SEAI" registered={installer.seaiRegistered} />
            <CertificationBadge label="RECI" registered={installer.reciRegistered} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 'auto',
          padding: '16px 28px',
          borderTop: '1px solid #2A2A2A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(17,17,17,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {installer.teamSize != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users style={{ width: 14, height: 14, color: '#6B7280' }} />
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{installer.teamSize} team</span>
              </div>
            )}
            {installer.avgProjectValue != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign style={{ width: 14, height: 14, color: '#6B7280' }} />
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{formatCurrency(installer.avgProjectValue)} avg</span>
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onView() }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: hovered ? '#F3D840' : '#6B7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              transition: 'color 0.2s ease',
              letterSpacing: 0.2,
            }}
          >
            View Profile
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </motion.div>
  )
})
