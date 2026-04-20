'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { format } from 'date-fns'

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
      padding: '32px 48px',
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
        <div className="dash-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {[...Array(5)].map((_, i) => (
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

// ============================================================================
// REVENUE CHART CARD (LEFT, 60%)
// ============================================================================
function RevenueChartCard({
  monthlyBreakdown,
  mrr,
  byProduct,
}: {
  monthlyBreakdown: Array<{ month: string; revenue: number }>
  mrr: number
  byProduct: Record<string, { count: number; value: number; mrr: number }>
}) {
  const customTooltipStyle: React.CSSProperties = {
    background: '#1A1A1A',
    border: `1px solid ${BORDER_HOVER}`,
    borderRadius: 10,
    padding: '10px 14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  }

  return (
    <motion.div
      variants={fadeUp}
      style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column' }}
      whileHover={{ borderColor: BORDER_HOVER, boxShadow: '0 0 30px rgba(16,185,129,0.03)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={sectionTitle}>
          <Euro size={18} style={{ color: GREEN }} />
          Revenue
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>MRR</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>{formatCurrency(mrr)}</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
                <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip
              contentStyle={customTooltipStyle}
              labelStyle={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 4 }}
              itemStyle={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600 }}
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={GREEN}
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Product */}
      {byProduct && (
        <div style={{ marginTop: 20, display: 'flex', gap: 16, paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
          {Object.entries(byProduct).map(([product, data]) => {
            const pColor = productColors[product.toLowerCase()] || TEXT_SECONDARY
            return (
              <div key={product} style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: pColor,
                    flexShrink: 0,
                  }} />
                  <p style={{ fontSize: 10, color: TEXT_TERTIARY, margin: 0, fontWeight: 500 }}>
                    {product}
                  </p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
                  {formatCurrency(data.value)}
                </p>
                <p style={{ fontSize: 10, color: TEXT_TERTIARY, margin: '2px 0 0' }}>
                  {data.count} client{data.count !== 1 ? 's' : ''} &middot; {formatCurrency(data.mrr)}/mo
                </p>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

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
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    background: isHov ? 'rgba(255,255,255,0.015)' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: 'default',
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
                  <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>{timeAgo(activity.createdAt)}</span>
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

// ============================================================================
// FINANCIAL TAB
// ============================================================================
function FinancialTab() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const revenueBreakdown = useMemo(() => [
    { month: 'Aug', solarpilot: 4200, aiWorkforce: 3100 },
    { month: 'Sep', solarpilot: 4800, aiWorkforce: 3400 },
    { month: 'Oct', solarpilot: 5100, aiWorkforce: 3800 },
    { month: 'Nov', solarpilot: 5500, aiWorkforce: 4200 },
    { month: 'Dec', solarpilot: 5900, aiWorkforce: 4500 },
    { month: 'Jan', solarpilot: 6200, aiWorkforce: 4800 },
  ], [])

  const clientRevenue = useMemo(() => [
    { name: 'SunPower Ireland', mrr: 1200, setupFee: 3500, ltv: 17900, product: 'Both', status: 'active' },
    { name: 'EcoSolar Solutions', mrr: 950, setupFee: 2800, ltv: 14200, product: 'SolarPilot', status: 'active' },
    { name: 'GreenBeam Energy', mrr: 1100, setupFee: 3200, ltv: 16400, product: 'AI Workforce', status: 'active' },
    { name: 'Photon Group', mrr: 850, setupFee: 2500, ltv: 12700, product: 'Both', status: 'active' },
    { name: 'Solaris Installers', mrr: 780, setupFee: 2200, ltv: 11580, product: 'SolarPilot', status: 'active' },
    { name: 'BrightFuture Solar', mrr: 680, setupFee: 2000, ltv: 10120, product: 'AI Workforce', status: 'active' },
    { name: 'Clare Solar Co', mrr: 560, setupFee: 1800, ltv: 8520, product: 'SolarPilot', status: 'prospect' },
    { name: 'Midlands PV', mrr: 0, setupFee: 0, ltv: 0, product: 'SolarPilot', status: 'churned' },
  ], [])

  const mrrMovement = useMemo(() => ({
    newMRR: 2400,
    churnedMRR: -560,
    expansionMRR: 850,
    netNewMRR: 2690,
  }), [])

  const forecast = useMemo(() => [
    { month: 'Jan', actual: 11000 },
    { month: 'Feb', actual: 11400 },
    { month: 'Mar', projected: 12200 },
    { month: 'Apr', projected: 13100 },
    { month: 'May', projected: 14000 },
    { month: 'Jun', projected: 15200 },
  ], [])

  const totalARR = 132000
  const totalMRR = totalARR / 12
  const avgRevClient = Math.round(totalMRR / 7)
  const totalSetupCollected = 18000
  const revGrowth = 18.4

  const kpis = [
    { label: 'Total Revenue (ARR)', value: formatCurrency(totalARR), delta: '+18.4% YoY', positive: true, icon: DollarSign, accent: GREEN },
    { label: 'Net Revenue MRR', value: formatCurrency(totalMRR), delta: '+€2,690 net new', positive: true, icon: Euro, accent: YELLOW },
    { label: 'Avg Revenue / Client', value: formatCurrency(avgRevClient), delta: 'across 7 clients', positive: true, icon: Users, accent: '#A78BFA' },
    { label: 'Setup Fees Collected', value: formatCurrency(totalSetupCollected), delta: 'this quarter', positive: true, icon: Zap, accent: '#FB923C' },
    { label: 'Revenue Growth', value: `${revGrowth}%`, delta: 'quarter over quarter', positive: true, icon: TrendingUp, accent: '#60A5FA' },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* KPI Row */}
      <motion.div variants={fadeUp} className="dash-kpi-grid">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} kpi={kpi} index={i} />
        ))}
      </motion.div>

      {/* Revenue Breakdown Chart */}
      <motion.div
        variants={fadeUp}
        style={{ ...cardStyle, padding: 26 }}
        whileHover={{ borderColor: BORDER_HOVER, boxShadow: '0 0 30px rgba(16,185,129,0.03)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={sectionTitle}>
            <BarChart3 size={18} style={{ color: YELLOW }} />
            Revenue Breakdown by Product
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: YELLOW }} />
              <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>SolarPilot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#A78BFA' }} />
              <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>AI Workforce</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenueBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelStyle={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 4 }}
              itemStyle={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600 }}
              formatter={(value: number) => [formatCurrency(value)]}
            />
            <Bar dataKey="solarpilot" stackId="a" fill={YELLOW} fillOpacity={0.85} radius={[0, 0, 0, 0]} />
            <Bar dataKey="aiWorkforce" stackId="a" fill="#A78BFA" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Client Revenue Table + MRR Movement */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }} className="dash-grid-60-40">
        {/* Client Revenue Table */}
        <motion.div
          variants={fadeUp}
          style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column' }}
          whileHover={{ borderColor: BORDER_HOVER }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={sectionTitle}>
              <Building2 size={18} style={{ color: '#60A5FA' }} />
              Client Revenue
            </div>
            <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontWeight: 500 }}>{clientRevenue.length} clients</span>
          </div>
          <div className="dash-scroll" style={{ overflow: 'auto', flex: 1, maxHeight: 360 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Client', 'Product', 'MRR', 'Setup Fee', 'LTV', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: CARD_BG, zIndex: 1 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientRevenue.map((c, i) => {
                  const sColor = statusColors[c.status] || '#9CA3AF'
                  const isHov = hoveredRow === i
                  const pColor = productColors[c.product.toLowerCase()] || TEXT_SECONDARY
                  return (
                    <tr
                      key={c.name}
                      onMouseEnter={() => setHoveredRow(i)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: `1px solid ${BORDER}`, background: isHov ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background 0.15s', cursor: 'default' }}
                    >
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: TEXT_PRIMARY }}>{c.name}</p>
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: pColor, background: `${pColor}12`, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{c.product}</span>
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: GREEN, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.mrr > 0 ? formatCurrency(c.mrr) : '—'}</span>
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.setupFee > 0 ? formatCurrency(c.setupFee) : '—'}</span>
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.ltv > 0 ? formatCurrency(c.ltv) : '—'}</span>
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: sColor, background: `${sColor}12`, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{c.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* MRR Movement + Forecast */}
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* MRR Movement */}
          <div style={{ ...cardStyle, padding: 26 }} >
            <div style={sectionTitle} >
              <Activity size={18} style={{ color: GREEN }} />
              MRR Movement
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              {[
                { label: 'New MRR', value: mrrMovement.newMRR, positive: true, icon: ArrowUpRight },
                { label: 'Churned MRR', value: mrrMovement.churnedMRR, positive: false, icon: ArrowDownRight },
                { label: 'Expansion MRR', value: mrrMovement.expansionMRR, positive: true, icon: ArrowUpRight },
                { label: 'Net New MRR', value: mrrMovement.netNewMRR, positive: true, icon: TrendingUp },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <item.icon size={14} style={{ color: item.positive ? GREEN : RED }} />
                    <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.positive ? GREEN : RED, fontFamily: 'monospace' }}>
                    {item.positive ? '+' : ''}{formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Forecast */}
          <div style={{ ...cardStyle, padding: 26, flex: 1 }} >
            <div style={sectionTitle}>
              <TrendingUp size={18} style={{ color: YELLOW }} />
              Revenue Forecast
            </div>
            <div style={{ marginTop: 16 }}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={forecast} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ fontSize: 11, color: TEXT_TERTIARY }} itemStyle={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600 }} formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                  <Line type="monotone" dataKey="actual" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN, r: 3 }} />
                  <Line type="monotone" dataKey="projected" stroke={YELLOW} strokeWidth={2} strokeDasharray="6 3" dot={{ fill: YELLOW, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 12, height: 2, background: GREEN, borderRadius: 1 }} />
                  <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>Actual</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 12, height: 2, background: YELLOW, borderRadius: 1, borderStyle: 'dashed' }} />
                  <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>Projected</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// WEB PERFORMANCE TAB
// ============================================================================
function WebPerformanceTab() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const clientWebsites = useMemo(() => [
    { name: 'SunPower Ireland', url: 'sunpowerireland.ie', speed: 92, lcp: 1.8, fid: 18, cls: 0.05, sessions: 3420, topKeyword: 'solar panels Ireland', rank: 3 },
    { name: 'EcoSolar Solutions', url: 'ecosolar.ie', speed: 87, lcp: 2.1, fid: 24, cls: 0.08, sessions: 2890, topKeyword: 'solar panel cost Ireland', rank: 5 },
    { name: 'GreenBeam Energy', url: 'greenbeamenergy.ie', speed: 78, lcp: 2.6, fid: 45, cls: 0.12, sessions: 1940, topKeyword: 'SEAI grant solar', rank: 2 },
    { name: 'Photon Group', url: 'photongroup.ie', speed: 95, lcp: 1.5, fid: 12, cls: 0.03, sessions: 4120, topKeyword: 'commercial solar Ireland', rank: 1 },
    { name: 'Solaris Installers', url: 'solarisinstallers.ie', speed: 71, lcp: 3.1, fid: 62, cls: 0.15, sessions: 1280, topKeyword: 'solar battery storage', rank: 8 },
    { name: 'BrightFuture Solar', url: 'brightfuturesolar.ie', speed: 84, lcp: 2.2, fid: 28, cls: 0.07, sessions: 2150, topKeyword: 'solar panel installation Dublin', rank: 4 },
  ], [])

  const seoHistory = useMemo(() => [
    { month: 'Aug', seoScore: 62 },
    { month: 'Sep', seoScore: 66 },
    { month: 'Oct', seoScore: 71 },
    { month: 'Nov', seoScore: 74 },
    { month: 'Dec', seoScore: 78 },
    { month: 'Jan', seoScore: 82 },
  ], [])

  const funnelData = useMemo(() => [
    { stage: 'Impressions', value: 284000, color: '#60A5FA' },
    { stage: 'Clicks', value: 18300, color: '#A78BFA' },
    { stage: 'Form Fills', value: 1420, color: YELLOW },
    { stage: 'Qualified Leads', value: 485, color: '#FB923C' },
    { stage: 'Closed Won', value: 128, color: GREEN },
  ], [])

  const topKeywords = useMemo(() => [
    { keyword: 'solar panels Ireland', position: 2, volume: 8100, ctr: 34.2 },
    { keyword: 'SEAI grant solar', position: 1, volume: 6500, ctr: 42.1 },
    { keyword: 'solar panel cost Ireland', position: 5, volume: 5400, ctr: 18.6 },
    { keyword: 'commercial solar Ireland', position: 1, volume: 3200, ctr: 38.7 },
    { keyword: 'solar panel installation Dublin', position: 4, volume: 4100, ctr: 22.3 },
    { keyword: 'solar battery storage Ireland', position: 8, volume: 2900, ctr: 12.4 },
    { keyword: 'solar water heating Ireland', position: 3, volume: 2100, ctr: 28.5 },
    { keyword: 'best solar companies Ireland', position: 6, volume: 3800, ctr: 15.9 },
  ], [])

  const avgSpeed = Math.round(clientWebsites.reduce((s, c) => s + c.speed, 0) / clientWebsites.length)
  const avgSEO = 82
  const totalSessions = clientWebsites.reduce((s, c) => s + c.sessions, 0)
  const avgConversion = 3.4
  const totalLeads = 485

  const kpis = [
    { label: 'Avg Page Speed', value: `${avgSpeed}`, delta: '+5 pts', positive: true, icon: Gauge, accent: GREEN },
    { label: 'Avg SEO Score', value: `${avgSEO}`, delta: '+8 pts this quarter', positive: true, icon: Search, accent: YELLOW },
    { label: 'Total Organic Sessions', value: totalSessions.toLocaleString(), delta: '+22% MoM', positive: true, icon: Globe, accent: '#60A5FA' },
    { label: 'Avg Conversion Rate', value: `${avgConversion}%`, delta: '+0.6% vs prev', positive: true, icon: Target, accent: '#A78BFA' },
    { label: 'Leads Generated', value: totalLeads, delta: '128 closed won', positive: true, icon: Zap, accent: '#FB923C' },
  ]

  function getVitalColor(val: number, thresholds: [number, number]): string {
    if (val <= thresholds[0]) return GREEN
    if (val <= thresholds[1]) return YELLOW
    return RED
  }

  function VitalBadge({ label, value, thresholds }: { label: string; value: string; thresholds: [number, number] }) {
    const color = getVitalColor(parseFloat(value), thresholds)
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}12`, padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
        {label} {value}
      </span>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* KPI Row */}
      <motion.div variants={fadeUp} className="dash-kpi-grid">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} kpi={kpi} index={i} />
        ))}
      </motion.div>

      {/* Client Website Performance Table */}
      <motion.div
        variants={fadeUp}
        style={{ ...cardStyle, padding: 26 }}
        whileHover={{ borderColor: BORDER_HOVER }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={sectionTitle}>
            <Globe size={18} style={{ color: '#60A5FA' }} />
            Client Website Performance
          </div>
          <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontWeight: 500 }}>{clientWebsites.length} sites</span>
        </div>
        <div className="dash-scroll" style={{ overflow: 'auto', maxHeight: 380 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Client', 'Website', 'Speed', 'Core Web Vitals', 'Sessions', 'Top Keyword', 'Rank'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: CARD_BG, zIndex: 1 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientWebsites.map((c, i) => {
                const isHov = hoveredRow === i
                return (
                  <tr
                    key={c.name}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ borderBottom: `1px solid ${BORDER}`, background: isHov ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background 0.15s', cursor: 'default' }}
                  >
                    <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: TEXT_PRIMARY, whiteSpace: 'nowrap' }}>{c.name}</p>
                    </td>
                    <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ExternalLink size={11} style={{ color: TEXT_TERTIARY }} />
                        <span style={{ fontSize: 11, color: TEXT_SECONDARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.url}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${c.speed}%`, background: c.speed >= 90 ? GREEN : c.speed >= 75 ? YELLOW : RED }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: c.speed >= 90 ? GREEN : c.speed >= 75 ? YELLOW : RED, fontFamily: 'monospace' }}>{c.speed}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <VitalBadge label="LCP" value={`${c.lcp}s`} thresholds={[2.5, 4.0]} />
                        <VitalBadge label="FID" value={`${c.fid}ms`} thresholds={[100, 300]} />
                        <VitalBadge label="CLS" value={c.cls.toFixed(2)} thresholds={[0.1, 0.25]} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.sessions.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 11, color: TEXT_SECONDARY, maxWidth: 140, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.topKeyword}</span>
                    </td>
                    <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap',
                        color: c.rank <= 3 ? GREEN : c.rank <= 5 ? YELLOW : TEXT_SECONDARY,
                      }}>#{c.rank}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SEO Chart + Lead Funnel + Keywords */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr', gap: 20 }} className="dash-grid-40-35-25">
        {/* SEO Performance Chart */}
        <motion.div
          variants={fadeUp}
          style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column' }}
          whileHover={{ borderColor: BORDER_HOVER }}
        >
          <div style={sectionTitle}>
            <Search size={18} style={{ color: GREEN }} />
            SEO Performance
          </div>
          <div style={{ flex: 1, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={seoHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="seoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ fontSize: 11, color: TEXT_TERTIARY }} itemStyle={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600 }} formatter={(value: number) => [`${value}/100`, 'SEO Score']} />
                <Area type="monotone" dataKey="seoScore" stroke={GREEN} strokeWidth={2} fill="url(#seoGrad)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>Current avg:</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>82</span>
            <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>/100</span>
          </div>
        </motion.div>

        {/* Lead Generation Funnel */}
        <motion.div
          variants={fadeUp}
          style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column' }}
          whileHover={{ borderColor: BORDER_HOVER }}
        >
          <div style={sectionTitle}>
            <Target size={18} style={{ color: '#FB923C' }} />
            Lead Funnel
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18, flex: 1 }}>
            {funnelData.map((item, i) => {
              const maxWidth = funnelData[0].value
              const widthPercent = Math.max(10, (item.value / maxWidth) * 100)
              const convRate = i > 0 ? ((item.value / funnelData[i - 1].value) * 100).toFixed(1) : null
              return (
                <div key={item.stage}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: TEXT_SECONDARY }}>{item.stage}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: 'monospace' }}>{item.value.toLocaleString()}</span>
                      {convRate && <span style={{ fontSize: 9, color: TEXT_TERTIARY }}>{convRate}%</span>}
                    </div>
                  </div>
                  <div style={{ height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      style={{ height: '100%', borderRadius: 4, background: `${item.color}30`, border: `1px solid ${item.color}40` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Top Performing Keywords */}
        <motion.div
          variants={fadeUp}
          style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column' }}
          whileHover={{ borderColor: BORDER_HOVER }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={sectionTitle}>
              <Search size={18} style={{ color: YELLOW }} />
              Top Keywords
            </div>
            <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontWeight: 500 }}>{topKeywords.length} tracked</span>
          </div>
          <div className="dash-scroll" style={{ overflow: 'auto', flex: 1, maxHeight: 320 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Keyword', 'Position', 'Volume', 'CTR'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: CARD_BG, zIndex: 1 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topKeywords.map((kw, i) => {
                  const isHov = hoveredRow === i
                  return (
                    <tr
                      key={kw.keyword}
                      onMouseEnter={() => setHoveredRow(i)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: `1px solid ${BORDER}`, background: isHov ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background 0.15s', cursor: 'default' }}
                    >
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 180 }}>{kw.keyword}</span>
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: kw.position <= 3 ? GREEN : kw.position <= 5 ? YELLOW : TEXT_SECONDARY }}>#{kw.position}</span>
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 11, color: TEXT_SECONDARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{kw.volume.toLocaleString()}/mo</span>
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: kw.ctr >= 25 ? GREEN : kw.ctr >= 15 ? YELLOW : TEXT_SECONDARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{kw.ctr}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// DASHBOARD PAGE
// ============================================================================
export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: () => fetch('/api/crm/dashboard').then((r) => r.json()),
    refetchInterval: 60000,
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
  ]

  return (
    <motion.div
      className="dash-page"
      style={{
        padding: '32px 48px',
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
          grid-template-columns: repeat(5, 1fr);
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
            <span style={{ fontSize: 12, color: TEXT_TERTIARY, whiteSpace: 'nowrap' }}>
              {format(new Date(), 'EEE, MMM d yyyy')}
            </span>
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
