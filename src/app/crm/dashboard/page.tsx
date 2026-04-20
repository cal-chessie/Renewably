'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useCRM } from '@/components/crm/CRMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  TrendingUp,
  Euro,
  Phone,
  Mail,
  Users,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  GitBranch,
  Trophy,
  Presentation,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Activity,
  Globe,
  Zap,
  Search,
  Gauge,
  Target,
  ArrowRight,
  BarChart3,
  DollarSign,
  Percent,
  ExternalLink,
  Receipt,
  CreditCard,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { DashboardChartsSkeleton } from '@/components/crm/DashboardCharts'
import { ClientOnly } from '@/lib/utils'
import { format } from 'date-fns'

const RevenueChartCard = dynamic(() => import('@/components/crm/DashboardCharts').then(m => ({ default: m.RevenueChartCard })), { ssr: false, loading: () => <DashboardChartsSkeleton /> })
const FinancialTab = dynamic(() => import('@/components/crm/DashboardCharts').then(m => ({ default: m.FinancialTab })), { ssr: false, loading: () => <DashboardChartsSkeleton /> })
const WebPerformanceTab = dynamic(() => import('@/components/crm/DashboardCharts').then(m => ({ default: m.WebPerformanceTab })), { ssr: false, loading: () => <DashboardChartsSkeleton /> })

// ============================================================================
// DESIGN SYSTEM CONSTANTS
// ============================================================================
const DARK = '#080808'
const DARK_CENTER = '#0C0C0C'
const DARK3 = '#111111'
const CARD_BG = '#141414'
const BORDER = 'rgba(255,255,255,0.05)'
const BORDER_HOVER = 'rgba(255,255,255,0.09)'
const YELLOW = '#F3D840'
const TEXT_PRIMARY = '#FFFFFF'
const TEXT_SECONDARY = 'rgba(255,255,255,0.50)'
const TEXT_TERTIARY = 'rgba(255,255,255,0.30)'
const GREEN = '#10B981'
const BLUE = '#3B82F6'
const RED = '#F87171'
const CARD_RADIUS = 16

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

// ============================================================================
// HELPERS
// ============================================================================
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return format(new Date(date), 'MMM d')
}

function generateSparklineData(seed: number): number[] {
  const data: number[] = []
  let value = 30 + Math.abs((seed * 7) % 40)
  for (let i = 0; i < 7; i++) {
    value = Math.max(10, Math.min(90, value + Math.sin(seed * 13 + i * 17) * 20))
    data.push(value)
  }
  return data
}

// ============================================================================
// ACTIVITY ICON MAP
// ============================================================================
const activityIconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  call: { icon: Phone, color: GREEN, bg: 'rgba(16,185,129,0.10)' },
  email: { icon: Mail, color: '#60A5FA', bg: 'rgba(96,165,250,0.10)' },
  demo: { icon: Presentation, color: '#A78BFA', bg: 'rgba(167,139,250,0.10)' },
  proposal: { icon: FileSpreadsheet, color: '#FB923C', bg: 'rgba(251,146,60,0.10)' },
  meeting: { icon: Users, color: '#A78BFA', bg: 'rgba(167,139,250,0.10)' },
  note: { icon: FileText, color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)' },
  task: { icon: CheckCircle2, color: YELLOW, bg: 'rgba(243,216,64,0.10)' },
  system: { icon: AlertTriangle, color: '#FB923C', bg: 'rgba(251,146,60,0.10)' },
}

// ============================================================================
// PRIORITY CONFIG
// ============================================================================
const priorityColors: Record<string, string> = { high: RED, medium: YELLOW, low: '#9CA3AF' }

// ============================================================================
// TAG COLORS
// ============================================================================
const tagColors: Record<string, string> = {
  onboarding: '#A78BFA',
  sales: '#F3D840',
  review: '#60A5FA',
  expansion: '#34D399',
  retention: '#FB923C',
}

// ============================================================================
// STATUS COLORS
// ============================================================================
const statusColors: Record<string, string> = {
  active: GREEN,
  prospect: YELLOW,
  churned: RED,
  inactive: '#9CA3AF',
}

// ============================================================================
// PRODUCT BADGE COLORS
// ============================================================================
const productColors: Record<string, string> = {
  solarpilot: '#F3D840',
  'ai workforce': '#A78BFA',
  both: '#10B981',
}

// ============================================================================
// SPARKLINE COMPONENT
// ============================================================================
function Sparkline({ data, color, width = 64, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((val - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', opacity: 0.7 }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={`url(#spark-${color.replace('#', '')})`}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ============================================================================
// REUSABLE STYLES
// ============================================================================
const cardStyle: React.CSSProperties = {
  borderRadius: CARD_RADIUS,
  background: CARD_BG,
  border: `1px solid ${BORDER}`,
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
}

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: TEXT_PRIMARY,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

// ============================================================================
// LOADING SKELETON
// ============================================================================
function LoadingSkeleton() {
  const skeletonPulse: React.CSSProperties = {
    background: CARD_BG,
    borderRadius: CARD_RADIUS,
    border: `1px solid ${BORDER}`,
    animation: 'skeletonPulse 1.5s ease-in-out infinite',
  }
  return (
    <div style={{
      padding: '24px clamp(16px, 4vw, 48px)',
      background: `radial-gradient(ellipse at 50% 0%, ${DARK_CENTER} 0%, ${DARK} 70%)`,
      minHeight: '100vh',
    }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1440, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ height: 30, width: 180, borderRadius: 8, ...skeletonPulse }} />
            <div style={{ height: 14, width: 300, borderRadius: 6, ...skeletonPulse, marginTop: 8 }} />
          </div>
          <div style={{ height: 38, width: 140, borderRadius: 10, ...skeletonPulse }} />
        </div>
        {/* KPI Cards */}
        <div className="dash-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 128, ...skeletonPulse }} />
          ))}
        </div>
        {/* Middle Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
          <div style={{ height: 420, ...skeletonPulse }} />
          <div style={{ height: 420, ...skeletonPulse }} />
        </div>
        {/* Bottom Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '4fr 3.5fr 2.5fr', gap: 20 }}>
          <div style={{ height: 440, ...skeletonPulse }} />
          <div style={{ height: 440, ...skeletonPulse }} />
          <div style={{ height: 440, ...skeletonPulse }} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================
function KPICard({ kpi, index }: {
  kpi: { label: string; value: string | number; delta: string; positive: boolean; icon: React.ElementType; accent: string }
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const sparkData = generateSparklineData(index + 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div
        style={{
          ...cardStyle,
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          cursor: 'default',
          borderColor: isHovered ? BORDER_HOVER : BORDER,
          boxShadow: isHovered ? `0 0 40px ${kpi.accent}08` : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${kpi.accent}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <kpi.icon size={20} style={{ color: kpi.accent }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{
              fontSize: 11,
              color: TEXT_TERTIARY,
              margin: 0,
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 500,
            }}>
              {kpi.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, margin: '6px 0 0', lineHeight: 1.1 }}>
              {kpi.value}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <p style={{
            fontSize: 12,
            color: kpi.positive ? GREEN : RED,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            {kpi.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {kpi.delta}
          </p>
          <Sparkline data={sparkData} color={kpi.accent} />
        </div>
      </div>
    </motion.div>
  )
}

// REVENUE CHART CARD — dynamically imported from DashboardCharts

// ============================================================================
// DEAL PIPELINE FUNNEL CARD (RIGHT, 40%)
// ============================================================================
function DealPipelineFunnelCard({
  funnel,
  totalValue,
  weightedValue,
}: {
  funnel: Array<{ stage: string; stageKey: string; count: number; value: number }>
  totalValue: number
  weightedValue: number
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const visibleStages = funnel.filter((s) => s.count > 0 || s.value > 0)
  const maxFunnelValue = visibleStages.length > 0 ? Math.max(...visibleStages.map((f) => f.value), 1) : 1

  function getStageColor(index: number, total: number): string {
    const t = total <= 1 ? 0 : index / (total - 1)
    const r = Math.round(243 + (16 - 243) * t)
    const g = Math.round(216 + (185 - 216) * t)
    const b = Math.round(64 + (129 - 64) * t)
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <motion.div
      variants={fadeUp}
      style={{ ...cardStyle, padding: 26 }}
      whileHover={{ borderColor: BORDER_HOVER, boxShadow: '0 0 30px rgba(243,216,64,0.03)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={sectionTitle}>
          <TrendingUp size={18} style={{ color: YELLOW }} />
          Deal Pipeline
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div>
          <span style={{ fontSize: 10, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Total</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginLeft: 6 }}>{formatCurrency(totalValue)}</span>
        </div>
        <div style={{ width: 1, height: 16, background: BORDER }} />
        <div>
          <span style={{ fontSize: 10, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Weighted</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: GREEN, marginLeft: 6 }}>{formatCurrency(weightedValue)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleStages.map((stage, i) => {
          const widthPercent = Math.max(12, (stage.value / maxFunnelValue) * 100)
          const color = getStageColor(i, visibleStages.length)
          const isHov = hoveredIdx === i
          return (
            <motion.div
              key={stage.stageKey}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 11,
                  color: isHov ? TEXT_PRIMARY : TEXT_SECONDARY,
                  width: 80,
                  flexShrink: 0,
                  fontWeight: isHov ? 500 : 400,
                  transition: 'color 0.2s',
                }}>
                  {stage.stage}
                </span>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    width: `${widthPercent}%`,
                    height: 28,
                    borderRadius: 6,
                    background: `linear-gradient(90deg, ${color}18, ${color}40)`,
                    border: `1px solid ${color}30`,
                    transition: 'all 0.3s ease',
                    boxShadow: isHov ? `0 0 20px ${color}15` : 'none',
                  }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 5,
                      background: `linear-gradient(90deg, ${color}30, ${color}60)`,
                      width: '100%',
                    }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, minWidth: 100, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isHov ? TEXT_PRIMARY : TEXT_SECONDARY, transition: 'color 0.2s' }}>
                    {stage.count} {stage.count === 1 ? 'deal' : 'deals'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: color, fontFamily: 'monospace', minWidth: 60, textAlign: 'right' }}>
                    {stage.value > 0 ? formatCurrency(stage.value) : '—'}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ============================================================================
// COMPANY PERFORMANCE TABLE (LEFT, 40%)
// ============================================================================
function CompanyPerformanceTable({
  companies,
}: {
  companies: Array<{
    id: string
    name: string
    status: string
    dealProduct: string | null
    dealValue: number
    dealMrr: number
    counties: string
    decisionMaker: string
  }>
}) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const router = useRouter()

  const topCompanies = [...companies]
    .sort((a, b) => (b.dealValue || 0) - (a.dealValue || 0))
    .slice(0, 8)

  return (
    <motion.div
      variants={fadeUp}
      style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column' }}
      whileHover={{ borderColor: BORDER_HOVER, boxShadow: '0 0 30px rgba(96,165,250,0.03)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={sectionTitle}>
          <Building2 size={18} style={{ color: '#60A5FA' }} />
          Top Companies
        </div>
        <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontWeight: 500 }}>
          by deal value
        </span>
      </div>

      <div className="dash-scroll" style={{ overflow: 'auto', flex: 1, maxHeight: 380 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Company', 'Status', 'Product', 'Deal Value', 'MRR'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
                    fontSize: 10,
                    fontWeight: 600,
                    color: TEXT_TERTIARY,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    top: 0,
                    background: CARD_BG,
                    zIndex: 1,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCompanies.map((company, i) => {
              const sColor = statusColors[company.status] || '#9CA3AF'
              const isHov = hoveredRow === i
              const pColor = productColors[(company.dealProduct || '').toLowerCase()] || TEXT_SECONDARY
              return (
                <motion.tr
                  key={company.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.3 }}
                  onClick={() => router.push(`/crm/companies/${company.id}`)}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    background: isHov ? 'rgba(255,255,255,0.04)' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                    <p style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 500,
                      color: TEXT_PRIMARY,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 120,
                    }}>
                      {company.name}
                    </p>
                    <p style={{
                      margin: '2px 0 0',
                      fontSize: 10,
                      color: TEXT_TERTIARY,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 120,
                    }}>
                      {company.counties}
                    </p>
                  </td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: sColor,
                      background: `${sColor}12`,
                      padding: '3px 8px',
                      borderRadius: 6,
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                    }}>
                      {company.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                    {company.dealProduct ? (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: pColor,
                        background: `${pColor}12`,
                        padding: '3px 8px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                      }}>
                        {company.dealProduct}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>&mdash;</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: TEXT_PRIMARY,
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                    }}>
                      {company.dealValue > 0 ? formatCurrency(company.dealValue) : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: GREEN,
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                    }}>
                      {company.dealMrr > 0 ? formatCurrency(company.dealMrr) : '—'}
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

// ============================================================================
// RECENT ACTIVITY FEED (CENTER, 35%)
// ============================================================================
function RecentActivityFeed({
  recentActivity,
}: {
  recentActivity: Array<{
    id: string
    type: string
    title: string
    content: string | null
    companyName: string
    userName: string
    createdAt: string
  }>
}) {
  return (
    <motion.div
      variants={fadeUp}
      style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column' }}
      whileHover={{ borderColor: BORDER_HOVER, boxShadow: '0 0 30px rgba(251,146,60,0.03)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={sectionTitle}>
          <Activity size={18} style={{ color: '#FB923C' }} />
          Recent Activity
        </div>
        <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontWeight: 500 }}>
          {recentActivity.length} events
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, overflow: 'hidden' }}>
        {recentActivity.slice(0, 8).map((activity, i) => {
          const typeConfig = activityIconMap[activity.type] || activityIconMap.note
          const TypeIcon = typeConfig.icon
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 10px',
                borderRadius: 8,
                transition: 'background 0.15s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: typeConfig.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <TypeIcon size={13} style={{ color: typeConfig.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: TEXT_PRIMARY,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {activity.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>{activity.companyName}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>&middot;</span>
                  <ClientOnly fallback={<span style={{ fontSize: 10, color: TEXT_TERTIARY }}>&nbsp;</span>}>
                    <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>{timeAgo(activity.createdAt)}</span>
                  </ClientOnly>
                </div>
              </div>
            </motion.div>
          )
        })}
        {recentActivity.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ fontSize: 13, color: TEXT_TERTIARY }}>No recent activity</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// ONBOARDING + TASKS CARD (RIGHT, 25%)
// ============================================================================
function OnboardingTasksCard({
  onboarding,
  upcomingTasks,
}: {
  onboarding: { total: number; completed: number; inProgress: number; avgProgress: number }
  upcomingTasks: Array<{ title: string; dueDate: string; priority: string; tag: string }>
}) {
  const { total = 0, completed = 0, inProgress = 0, avgProgress = 0 } = onboarding
  const progressPercent = Math.round(avgProgress)

  return (
    <motion.div
      variants={fadeUp}
      style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column', gap: 20 }}
      whileHover={{ borderColor: BORDER_HOVER, boxShadow: '0 0 30px rgba(167,139,250,0.03)' }}
    >
      {/* Onboarding Summary */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={sectionTitle}>
            <CheckCircle2 size={18} style={{ color: '#A78BFA' }} />
            Onboarding
          </div>
        </div>

        {/* Circular progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width={72} height={72} viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="36" cy="36" r="30"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={5}
              />
              <circle
                cx="36" cy="36" r="30"
                fill="none"
                stroke={progressPercent >= 80 ? GREEN : progressPercent >= 40 ? YELLOW : '#FB923C'}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={`${(progressPercent / 100) * 188.5} 188.5`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 16,
              fontWeight: 700,
              color: TEXT_PRIMARY,
            }}>
              {progressPercent}%
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: GREEN,
                boxShadow: '0 0 6px rgba(16,185,129,0.4)',
              }} />
              <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{completed}</span> completed
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: YELLOW,
                boxShadow: '0 0 6px rgba(243,216,64,0.4)',
              }} />
              <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{inProgress}</span> in progress
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: TEXT_TERTIARY,
              }} />
              <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{total}</span> total
              </span>
            </div>
          </div>
        </div>

        {/* Thin progress bar */}
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            background: progressPercent >= 80 ? GREEN : progressPercent >= 40 ? YELLOW : '#FB923C',
            width: `${progressPercent}%`,
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: BORDER }} />

      {/* Upcoming Tasks */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ ...sectionTitle, fontSize: 14 }}>
            <Calendar size={16} style={{ color: '#FB923C' }} />
            Upcoming Tasks
          </div>
          <span style={{ fontSize: 10, color: TEXT_TERTIARY, fontWeight: 500 }}>
            {upcomingTasks.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 }}>
          {upcomingTasks.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <p style={{ fontSize: 12, color: TEXT_TERTIARY }}>No upcoming tasks</p>
            </div>
          )}
          {upcomingTasks.slice(0, 5).map((task, i) => {
            const pColor = priorityColors[task.priority] || '#9CA3AF'
            const tColor = tagColors[task.tag] || '#9CA3AF'
            const dueDate = new Date(task.dueDate)
            const isOverdue = dueDate < new Date()
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.3 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: pColor,
                  flexShrink: 0,
                  boxShadow: `0 0 4px ${pColor}44`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: TEXT_PRIMARY,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {task.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: tColor,
                      background: `${tColor}12`,
                      padding: '1px 6px',
                      borderRadius: 3,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}>
                      {task.tag}
                    </span>
                    <span style={{
                      fontSize: 10,
                      color: isOverdue ? RED : TEXT_TERTIARY,
                      fontWeight: 500,
                    }}>
                      {format(dueDate, 'MMM d')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// TAB TYPE
// ============================================================================
type TabType = 'overview' | 'financial' | 'web-performance'

// ============================================================================
// CUSTOM TOOLTIP STYLE (shared)
// ============================================================================
const chartTooltipStyle: React.CSSProperties = {
  background: '#1A1A1A',
  border: `1px solid ${BORDER_HOVER}`,
  borderRadius: 10,
  padding: '10px 14px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
}


// FINANCIAL TAB + WEB PERFORMANCE TAB — dynamically imported from DashboardCharts

// ============================================================================
// DASHBOARD PAGE
// ============================================================================
export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const { loading: authLoading } = useCRM()

  const router = useRouter()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/crm/dashboard')
      if (res.status === 401) {
        router.push('/crm/login')
        throw new Error('Unauthorized')
      }
      return res.json()
    },
    enabled: !authLoading,
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 1000,
  })

  // Loading state
  if (isLoading) return <LoadingSkeleton />

  // Error state with retry
  if (isError || !data || data.error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: DARK,
        color: TEXT_SECONDARY,
        gap: 12,
      }}>
        <AlertTriangle size={32} style={{ color: YELLOW }} />
        <p style={{ fontSize: 16, fontWeight: 500 }}>Failed to load dashboard</p>
        <p style={{ fontSize: 13 }}>Check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          style={{
            marginTop: 8,
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: YELLOW,
            color: DARK,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const {
    kpis = {},
    pipeline = {},
    revenue = {},
    companies = [],
    recentActivity = [],
    upcomingTasks = [],
    onboarding = {},
  } = data

  const {
    activeClients = 0,
    totalCompanies = 0,
    prospectsCount = 0,
    openDeals = 0,
    pipelineValue = 0,
    weightedPipeline = 0,
    mrr = 0,
    arr = 0,
    winsThisMonth = 0,
    wonValueThisMonth = 0,
    churnedCount = 0,
    emailsSent = 0,
    emailsOpened = 0,
    emailsClicked = 0,
    emailsBounced = 0,
  } = kpis

  const { funnel = [], totalValue = 0, weightedValue = 0 } = pipeline
  const { monthlyBreakdown = [], byProduct = {} } = revenue

  // Calculate win rate
  const totalDeals = winsThisMonth + openDeals + churnedCount
  const winRate = totalDeals > 0 ? Math.round((winsThisMonth / totalDeals) * 100) : 0

  // KPI card definitions — matching the 5 required KPIs
  const kpiCards = [
    {
      label: 'MRR',
      value: formatCurrency(mrr),
      delta: `${formatCurrency(arr)} ARR`,
      positive: true,
      icon: Euro,
      accent: GREEN,
    },
    {
      label: 'Active Clients',
      value: activeClients,
      delta: `${prospectsCount} prospects`,
      positive: true,
      icon: Building2,
      accent: YELLOW,
    },
    {
      label: 'Pipeline Value',
      value: formatCurrency(pipelineValue),
      delta: `${formatCurrency(weightedPipeline)} weighted`,
      positive: true,
      icon: TrendingUp,
      accent: '#A78BFA',
    },
    {
      label: 'Open Deals',
      value: openDeals,
      delta: `${formatCurrency(pipelineValue)} total`,
      positive: true,
      icon: GitBranch,
      accent: '#60A5FA',
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      delta: `${winsThisMonth} won this month`,
      positive: winRate >= 30,
      icon: Trophy,
      accent: '#FB923C',
    },
    {
      label: 'Emails Sent',
      value: emailsSent,
      delta: emailsSent > 0 ? `${emailsOpened} opened, ${emailsClicked} clicked` : 'No emails this month',
      positive: emailsBounced === 0,
      icon: Mail,
      accent: '#60A5FA',
    },
  ]

  return (
    <motion.div
      className="dash-page"
      style={{
        padding: '24px clamp(16px, 4vw, 48px)',
        background: `radial-gradient(ellipse at 50% 0%, ${DARK_CENTER} 0%, ${DARK} 70%)`,
        minHeight: '100vh',
      }}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Global styles */}
      <style>{`
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }
        .dash-grid-60-40 {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 20px;
        }
        .dash-grid-40-35-25 {
          display: grid;
          grid-template-columns: 4fr 3.5fr 2.5fr;
          gap: 20px;
        }
        .dash-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .dash-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .dash-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
        }
        .dash-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.12);
        }
        @media (max-width: 1200px) {
          .dash-grid-40-35-25 {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 1200px) {
          .dash-kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 1024px) {
          .dash-kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .dash-grid-60-40 {
            grid-template-columns: 1fr;
          }
          .dash-grid-40-35-25 {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .dash-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .dash-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .dash-page {
            padding: 24px 20px !important;
          }
          .dash-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* ================================================================= */}
        {/* SECTION 1: HEADER ROW                                            */}
        {/* ================================================================= */}
        <motion.div
          variants={fadeUp}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1 style={{
              fontSize: 30,
              fontWeight: 700,
              color: TEXT_PRIMARY,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 14, color: TEXT_TERTIARY, marginTop: 6, marginBottom: 0 }}>
              Agency overview and performance metrics
            </p>
          </div>

          {/* Pill Tab Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            {([
              { key: 'overview' as TabType, label: 'Overview', icon: Activity },
              { key: 'financial' as TabType, label: 'Financial', icon: DollarSign },
              { key: 'web-performance' as TabType, label: 'Web Performance', icon: Globe },
            ]).map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 9,
                    border: isActive ? `1px solid ${YELLOW}40` : '1px solid transparent',
                    background: isActive ? 'rgba(243,216,64,0.08)' : 'transparent',
                    color: isActive ? YELLOW : TEXT_TERTIARY,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: isActive ? `0 0 12px rgba(243,216,64,0.06)` : 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = TEXT_SECONDARY
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = TEXT_TERTIARY
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <tab.icon size={14} />
                  <span className="dash-btn-label">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClientOnly fallback={<span style={{ fontSize: 12, color: TEXT_TERTIARY, whiteSpace: 'nowrap' }}>&nbsp;</span>}>
                <span style={{ fontSize: 12, color: TEXT_TERTIARY, whiteSpace: 'nowrap' }}>
                  {format(new Date(), 'EEE, MMM d yyyy')}
                </span>
              </ClientOnly>
            <button
              onClick={handleRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                background: 'rgba(255,255,255,0.02)',
                color: TEXT_TERTIARY,
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BORDER_HOVER
                e.currentTarget.style.color = TEXT_PRIMARY
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BORDER
                e.currentTarget.style.color = TEXT_TERTIARY
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  transition: 'transform 0.5s',
                  transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                }}
              />
              <span className="dash-btn-label">Refresh</span>
            </button>
            <button
              onClick={() => { window.location.href = '/crm/companies' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: YELLOW,
                color: DARK,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 0 20px rgba(243,216,64,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F5E04D'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(243,216,64,0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = YELLOW
                e.currentTarget.style.boxShadow = '0 0 20px rgba(243,216,64,0.15)'
              }}
            >
              <Plus size={15} />
              <span className="dash-btn-label">New Company</span>
            </button>
          </div>
        </motion.div>

        {/* ================================================================= */}
        {/* TAB CONTENT                                                      */}
        {/* ================================================================= */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* KPI CARDS */}
              <motion.div variants={fadeUp} className="dash-kpi-grid">
                {kpiCards.map((kpi, i) => (
                  <KPICard key={kpi.label} kpi={kpi} index={i} />
                ))}
              </motion.div>

              {/* MIDDLE — Revenue Chart (60%) + Pipeline (40%) */}
              <motion.div variants={fadeUp} className="dash-grid-60-40">
                <RevenueChartCard
                  monthlyBreakdown={monthlyBreakdown}
                  mrr={mrr}
                  byProduct={byProduct}
                />
                <DealPipelineFunnelCard
                  funnel={funnel}
                  totalValue={totalValue}
                  weightedValue={weightedValue}
                />
              </motion.div>

              {/* BOTTOM — Companies (40%) + Activity (35%) + Onboard (25%) */}
              <motion.div variants={fadeUp} className="dash-grid-40-35-25" style={{ marginBottom: 20 }}>
                <CompanyPerformanceTable companies={companies} />
                <RecentActivityFeed recentActivity={recentActivity} />
                <OnboardingTasksCard onboarding={onboarding} upcomingTasks={upcomingTasks} />
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'financial' && (
            <motion.div
              key="financial"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
            >
              <FinancialTab />
            </motion.div>
          )}

          {activeTab === 'web-performance' && (
            <motion.div
              key="web-performance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
            >
              <WebPerformanceTab />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  )
}
