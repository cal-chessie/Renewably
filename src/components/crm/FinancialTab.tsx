'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Building2,
  TrendingUp,
  Euro,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Activity,
  Zap,
  Target,
  DollarSign,
  Receipt,
  CreditCard,
  BarChart3,
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
  Cell,
  PieChart,
  Pie,
} from 'recharts'

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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const productColors: Record<string, string> = {
  solarpilot: '#F3D840',
  'ai workforce': '#A78BFA',
  both: '#10B981',
}

const statusColors: Record<string, string> = {
  active: GREEN,
  prospect: YELLOW,
  churned: RED,
  inactive: '#9CA3AF',
}

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
// FINANCIAL SHIMMER SKELETON
// ============================================================================
function FinancialShimmer() {
  const base: React.CSSProperties = {
    borderRadius: 12,
    background: 'linear-gradient(90deg, #141414 25%, #1e1e1e 50%, #141414 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 28px' }}>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      {/* Accent bar */}
      <div style={{ height: 3, borderRadius: 2, ...base, width: '60%' }} />
      {/* Title + dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 160, height: 16, ...base }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1e1e1e' }} />
          <div style={{ width: 100, height: 10, ...base }} />
        </div>
      </div>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ height: 120, ...base, borderRadius: CARD_RADIUS }} />
        ))}
      </div>
      {/* Revenue chart */}
      <div style={{ height: 320, ...base, borderRadius: CARD_RADIUS }} />
      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        <div style={{ height: 400, ...base, borderRadius: CARD_RADIUS }} />
        <div style={{ height: 400, ...base, borderRadius: CARD_RADIUS }} />
      </div>
    </div>
  )
}
// ============================================================================
// FINANCIAL TAB
// ============================================================================
export function FinancialTab() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null)
  const [hoveredInvKpi, setHoveredInvKpi] = useState<number | null>(null)
  const [animValues, setAnimValues] = useState<number[]>([0, 0, 0, 0, 0, 0])

  // ── API fetch ──
  const { data: fin, isLoading } = useQuery({
    queryKey: ['financial'],
    queryFn: () => fetch('/api/crm/financial').then(r => r.json()),
    refetchInterval: 60000,
  })

  // ── Derive data from API or fallback to mocks ──
  const revenueBreakdown = useMemo(() => {
    if (fin?.revenueBreakdown?.length) return fin.revenueBreakdown
    return [
      { month: 'Aug', solarpilot: 4200, aiWorkforce: 3100 },
      { month: 'Sep', solarpilot: 4800, aiWorkforce: 3400 },
      { month: 'Oct', solarpilot: 5100, aiWorkforce: 3800 },
      { month: 'Nov', solarpilot: 5500, aiWorkforce: 4200 },
      { month: 'Dec', solarpilot: 5900, aiWorkforce: 4500 },
      { month: 'Jan', solarpilot: 6200, aiWorkforce: 4800 },
    ]
  }, [fin])

  const clientRevenue = useMemo(() => {
    if (fin?.clientRevenue?.length) return fin.clientRevenue
    return [
      { name: 'SunPower Ireland', mrr: 1200, setupFee: 3500, ltv: 17900, product: 'Both', status: 'active' },
      { name: 'EcoSolar Solutions', mrr: 950, setupFee: 2800, ltv: 14200, product: 'SolarPilot', status: 'active' },
      { name: 'GreenBeam Energy', mrr: 1100, setupFee: 3200, ltv: 16400, product: 'AI Workforce', status: 'active' },
      { name: 'Photon Group', mrr: 850, setupFee: 2500, ltv: 12700, product: 'Both', status: 'active' },
      { name: 'Solaris Installers', mrr: 780, setupFee: 2200, ltv: 11580, product: 'SolarPilot', status: 'active' },
      { name: 'BrightFuture Solar', mrr: 680, setupFee: 2000, ltv: 10120, product: 'AI Workforce', status: 'active' },
      { name: 'Clare Solar Co', mrr: 560, setupFee: 1800, ltv: 8520, product: 'SolarPilot', status: 'prospect' },
      { name: 'Midlands PV', mrr: 0, setupFee: 0, ltv: 0, product: 'SolarPilot', status: 'churned' },
    ]
  }, [fin])

  const mrrMovement = useMemo(() => {
    if (fin?.mrrMovement) return fin.mrrMovement
    return { newMRR: 2400, churnedMRR: -560, expansionMRR: 850, netNewMRR: 2690 }
  }, [fin])

  const forecast = useMemo(() => {
    if (fin?.forecast?.length) return fin.forecast
    return [
      { month: 'Jan', actual: 11000 },
      { month: 'Feb', actual: 11400 },
      { month: 'Mar', projected: 12200 },
      { month: 'Apr', projected: 13100 },
      { month: 'May', projected: 14000 },
      { month: 'Jun', projected: 15200 },
    ]
  }, [fin])

  const invoices = useMemo(() => {
    if (fin?.invoices) return fin.invoices
    return { totalInvoiced: 142000, totalPaid: 118500, outstanding: 23500, overdueAmount: 4200, paidThisMonth: 12800, sentThisMonth: 12, draftCount: 3 }
  }, [fin])

  const totalARR = fin?.kpis?.arr ?? 132000
  const totalMRR = fin?.kpis?.mrr ?? Math.round(totalARR / 12)
  const avgRevClient = fin?.kpis?.avgRevPerClient ?? Math.round(totalMRR / 7)
  const totalSetupCollected = fin?.kpis?.setupFeesCollected ?? 18000
  const revGrowth = fin?.kpis?.revGrowth ?? 18.4
  const winRate = fin?.kpis?.winRate ?? 67

  const kpis = [
    { label: 'Total Revenue (ARR)', value: formatCurrency(totalARR), delta: `+${revGrowth}% YoY`, positive: true, icon: DollarSign, accent: GREEN },
    { label: 'Net Revenue MRR', value: formatCurrency(totalMRR), delta: `+${formatCurrency(Math.abs(mrrMovement.netNewMRR))} net new`, positive: mrrMovement.netNewMRR >= 0, icon: Euro, accent: YELLOW },
    { label: 'Avg Revenue / Client', value: formatCurrency(avgRevClient), delta: `${clientRevenue.filter(c => c.status === 'active').length} active clients`, positive: true, icon: Users, accent: '#A78BFA' },
    { label: 'Setup Fees Collected', value: formatCurrency(totalSetupCollected), delta: `${formatCurrency(fin?.kpis?.setupThisQuarter ?? 8200)} this Q`, positive: true, icon: Zap, accent: '#FB923C' },
    { label: 'Revenue Growth', value: `${revGrowth}%`, delta: 'quarter over quarter', positive: revGrowth >= 0, icon: TrendingUp, accent: '#60A5FA' },
  ]

  const invKpis = [
    { label: 'Total Invoiced', value: formatCurrency(invoices.totalInvoiced), icon: Receipt, color: YELLOW, iconBg: 'rgba(243,216,64,0.10)', iconBorder: 'rgba(243,216,64,0.20)' },
    { label: 'Outstanding', value: formatCurrency(invoices.outstanding), icon: Clock, color: '#FB923C', iconBg: 'rgba(251,146,60,0.10)', iconBorder: 'rgba(251,146,60,0.20)' },
    { label: 'Overdue', value: formatCurrency(invoices.overdueAmount), icon: AlertTriangle, color: RED, iconBg: 'rgba(248,113,113,0.10)', iconBorder: 'rgba(248,113,113,0.20)' },
    { label: 'Paid This Month', value: formatCurrency(invoices.paidThisMonth), icon: CheckCircle2, color: GREEN, iconBg: 'rgba(16,185,129,0.10)', iconBorder: 'rgba(16,185,129,0.20)' },
  ]

  useEffect(() => {
    const targets = [totalARR, totalMRR, avgRevClient, totalSetupCollected, revGrowth, winRate]
    const start = Date.now()
    const duration = 1500
    let frameId: number
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimValues(targets.map(t => t * eased))
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [totalARR, totalMRR, avgRevClient, totalSetupCollected, revGrowth, winRate])

  const formatKpiValue = (i: number, v: number): string => {
    if (i < 5) return formatCurrency(Math.round(v))
    return `${v.toFixed(1)}%`
  }

  const mrrMaxVal = Math.max(mrrMovement.newMRR, Math.abs(mrrMovement.churnedMRR), mrrMovement.expansionMRR, Math.abs(mrrMovement.netNewMRR))

  const renderCinematicTooltip = (props: { active?: boolean; payload?: Array<{ value: number; dataKey?: string; fill?: string }>; label?: string }) => {
    const { active, payload, label } = props
    if (!active || !payload || !payload.length) return null
    const getName = (dk?: string) => {
      if (dk === 'solarpilot') return 'SolarPilot'
      if (dk === 'aiWorkforce') return 'AI Workforce'
      if (dk === 'actual') return 'Actual'
      if (dk === 'projected') return 'Projected'
      return dk || ''
    }
    return (
      <div style={{
        background: 'rgba(20,20,20,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${BORDER_HOVER}`,
        borderLeft: `3px solid ${GREEN}`,
        borderRadius: 10,
        padding: '12px 16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      }}>
        <p style={{ fontSize: 11, color: TEXT_TERTIARY, margin: '0 0 8px', fontWeight: 500 }}>{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, margin: '4px 0' }}>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.fill || GREEN, display: 'inline-block' }} />
              {getName(entry.dataKey)}
            </span>
            <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  // ── Loading state ──
  if (isLoading && !fin) return <FinancialShimmer />

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes fc-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.4); } }
        @keyframes fc-march { to { stroke-dashoffset: -9; } }
        @keyframes fc-glow-line { 0%, 100% { opacity: 0.12; } 50% { opacity: 0.35; } }
        .fc-pulse { animation: fc-pulse 2s ease-in-out infinite; }
        .fc-march { animation: fc-march 0.8s linear infinite; }
        .fc-glow-line { animation: fc-glow-line 3s ease-in-out infinite; }
      `}</style>

      {/* ═══ 3px GRADIENT ACCENT BAR ═══ */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
        style={{ height: 3, borderRadius: 2, marginBottom: 24,
          background: 'linear-gradient(90deg, #10B981, #F3D840, #A78BFA, #60A5FA)',
          transformOrigin: 'left',
        }}
      />

      {/* AMBIENT BACKGROUND LAYER — static gradients, no infinite animation */}
      <div style={{ position: 'absolute', top: -120, left: -100, width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 40%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '28%', right: -150, width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(243,216,64,0.06) 0%, rgba(243,216,64,0.01) 40%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -100, left: '38%', width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.01) 40%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0 }} />

      {/* MAIN CONTENT */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}
      >
        {/* ── FINANCIAL OVERVIEW Title ── */}
        <motion.div variants={fadeUp} style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{
              fontSize: 13, fontWeight: 300, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Financial Overview
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="fc-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN,
                boxShadow: '0 0 8px rgba(16,185,129,0.6)', display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: TEXT_TERTIARY, fontWeight: 400 }}>Live &middot; auto-refreshing</span>
            </div>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(16,185,129,0.35), rgba(243,216,64,0.2), rgba(255,255,255,0.05), transparent)' }} />
        </motion.div>

        {/* ═══ KPI CARDS - Premium Cinematic Glassmorphism ═══ */}
        <motion.div variants={fadeUp} className="dash-kpi-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.1 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
              onMouseEnter={() => setHoveredKpi(i)}
              onMouseLeave={() => setHoveredKpi(null)}
            >
              <div style={{
                borderRadius: CARD_RADIUS,
                background: 'rgba(20,20,20,0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${hoveredKpi === i ? `${kpi.accent}25` : BORDER}`,
                padding: '22px 24px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                boxShadow: hoveredKpi === i
                  ? `0 0 40px ${kpi.accent}12, 0 8px 32px rgba(0,0,0,0.3)`
                  : '0 4px 16px rgba(0,0,0,0.15)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: CARD_RADIUS, pointerEvents: 'none',
                  background: `linear-gradient(135deg, ${kpi.accent}${hoveredKpi === i ? '10' : '04'}, transparent 50%, ${kpi.accent}${hoveredKpi === i ? '08' : '02'})`,
                  transition: 'opacity 0.3s',
                }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${kpi.accent}, ${kpi.accent}40, transparent)`,
                  opacity: hoveredKpi === i ? 1 : 0.5, transition: 'opacity 0.3s',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <motion.div
                      animate={hoveredKpi === i ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      style={{ width: 44, height: 44, borderRadius: 12,
                        background: `${kpi.accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <kpi.icon size={20} style={{ color: kpi.accent }} />
                    </motion.div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: TEXT_TERTIARY, margin: 0, lineHeight: 1,
                        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{kpi.label}</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, margin: '6px 0 0', lineHeight: 1.1 }}>
                        {formatKpiValue(i, animValues[i])}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {kpi.positive
                      ? <ArrowUpRight size={12} style={{ color: GREEN }} />
                      : <ArrowDownRight size={12} style={{ color: RED }} />}
                    <span style={{ fontSize: 12, color: kpi.positive ? GREEN : RED, fontWeight: 500 }}>{kpi.delta}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══ INVOICE STATS - 4-Card Row ═══ */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {invKpis.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.35 + i * 0.07 }}
              whileHover={{
                borderColor: `${card.color}40`,
                boxShadow: `0 0 30px -10px ${card.color}30`,
                y: -2,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
              onMouseEnter={() => setHoveredInvKpi(i)}
              onMouseLeave={() => setHoveredInvKpi(null)}
            >
              <div style={{
                borderRadius: CARD_RADIUS,
                background: CARD_BG,
                border: `1px solid ${hoveredInvKpi === i ? `${card.color}30` : BORDER}`,
                padding: '18px 20px',
                cursor: 'default',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${card.color}, transparent)`,
                  opacity: hoveredInvKpi === i ? 1 : 0.4,
                  transition: 'opacity 0.3s',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: card.iconBg,
                    border: `1px solid ${card.iconBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <card.icon size={17} style={{ color: card.color }} />
                  </div>
                  <span style={{ fontSize: 11, color: TEXT_SECONDARY, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{card.label}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: card.color, letterSpacing: '-0.02em', margin: 0 }}>{card.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══ REVENUE BREAKDOWN BY PRODUCT ═══ */}
        {(() => {
          const latest = revenueBreakdown[revenueBreakdown.length - 1]
          const prev = revenueBreakdown[revenueBreakdown.length - 2]
          const totalLatest = (latest?.solarpilot || 0) + (latest?.aiWorkforce || 0)
          const totalPrev = (prev?.solarpilot || 0) + (prev?.aiWorkforce || 0)
          const momGrowth = totalPrev > 0 ? ((totalLatest - totalPrev) / totalPrev * 100).toFixed(1) : '0.0'
          const momPositive = parseFloat(momGrowth) >= 0
          const spPct = totalLatest > 0 ? Math.round((latest?.solarpilot || 0) / totalLatest * 100) : 50
          const spTotal = revenueBreakdown.reduce((s, r) => s + (r.solarpilot || 0), 0)
          const aiTotal = revenueBreakdown.reduce((s, r) => s + (r.aiWorkforce || 0), 0)
          const grandTotal = spTotal + aiTotal
          const spGrowth = revenueBreakdown.length >= 2
            ? (((latest?.solarpilot || 0) - (prev?.solarpilot || 0)) / Math.max(prev?.solarpilot || 1, 1) * 100).toFixed(1) : '0.0'
          const aiGrowth = revenueBreakdown.length >= 2
            ? (((latest?.aiWorkforce || 0) - (prev?.aiWorkforce || 0)) / Math.max(prev?.aiWorkforce || 1, 1) * 100).toFixed(1) : '0.0'
          const avgMonthly = Math.round(grandTotal / revenueBreakdown.length)
          const pieData = [
            { name: 'SolarPilot', value: spTotal, color: YELLOW, amount: spTotal },
            { name: 'AI Workforce', value: aiTotal, color: '#A78BFA', amount: aiTotal },
          ]
          const stackedData = revenueBreakdown.map(r => ({
            month: r.month,
            solarpilot: r.solarpilot,
            aiWorkforce: r.aiWorkforce,
            total: (r.solarpilot || 0) + (r.aiWorkforce || 0),
          }))
          return (
            <motion.div
              variants={fadeUp}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              style={{
                borderRadius: CARD_RADIUS, background: CARD_BG,
                border: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Ambient glow */}
              <div style={{
                position: 'absolute', top: -80, left: '25%', transform: 'translateX(-50%)',
                width: 400, height: 200, borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(243,216,64,0.03) 0%, transparent 70%)',
              }} />

              <div style={{ padding: '20px 24px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={sectionTitle}>
                    <BarChart3 size={16} style={{ color: YELLOW }} />
                    Revenue Breakdown by Product
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: YELLOW, boxShadow: '0 0 5px rgba(243,216,64,0.25)', display: 'block' }} />
                      <span style={{ fontSize: 10, color: TEXT_TERTIARY, fontWeight: 500 }}>SolarPilot</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#A78BFA', boxShadow: '0 0 5px rgba(167,139,250,0.25)', display: 'block' }} />
                      <span style={{ fontSize: 10, color: TEXT_TERTIARY, fontWeight: 500 }}>AI Workforce</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 10, height: 2, borderRadius: 1, background: GREEN, display: 'block' }} />
                      <span style={{ fontSize: 10, color: TEXT_TERTIARY, fontWeight: 500 }}>Total</span>
                    </span>
                  </div>
                </div>

                {/* Main layout: fills remaining height */}
                <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>

                  {/* Stacked bar chart — fills height */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <ResponsiveContainer width="100%" height="100%" style={{ flex: 1, minHeight: 260 }}>
                      <BarChart data={stackedData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }} barCategoryGap="22%">
                        <defs>
                          <linearGradient id="stackSP" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={YELLOW} stopOpacity={0.92} />
                            <stop offset="100%" stopColor={YELLOW} stopOpacity={0.60} />
                          </linearGradient>
                          <linearGradient id="stackAI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.92} />
                            <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.60} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.025)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} domain={[0, 'auto']} />
                        <Tooltip content={renderCinematicTooltip} cursor={{ fill: 'rgba(255,255,255,0.015)' }} />
                        <Bar dataKey="solarpilot" stackId="rev" fill="url(#stackSP)" radius={[0, 0, 0, 0]} maxBarSize={40}>
                          {stackedData.map((entry, index) => (
                            <Cell key={index} fill={index === stackedData.length - 1 ? 'url(#stackSP)' : 'rgba(243,216,64,0.65)'} />
                          ))}
                        </Bar>
                        <Bar dataKey="aiWorkforce" stackId="rev" fill="url(#stackAI)" radius={[5, 5, 0, 0]} maxBarSize={40}>
                          {stackedData.map((entry, index) => (
                            <Cell key={index} fill={index === stackedData.length - 1 ? 'url(#stackAI)' : 'rgba(167,139,250,0.65)'} />
                          ))}
                        </Bar>
                        <Line type="monotone" dataKey="total" stroke={GREEN} strokeWidth={2} dot={false}
                          strokeDasharray="5 3" activeDot={{ r: 4, fill: GREEN, strokeWidth: 0 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right panel — fills height, wider */}
                  <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'space-between' }}>

                    {/* Donut */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={56}
                              paddingAngle={3} dataKey="value" strokeWidth={0} animationBegin={200} animationDuration={800}>
                              {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color}
                                  style={{ filter: `drop-shadow(0 0 6px ${entry.color}25)` }} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <span style={{ fontSize: 6, fontWeight: 700, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            €{(grandTotal / 1000).toFixed(0)}k
                          </span>
                        </div>
                      </div>
                      {/* Split pills stacked */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pieData.map((p) => {
                          const pct = grandTotal > 0 ? Math.round(p.value / grandTotal * 100) : 0
                          return (
                            <motion.div key={p.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              transition={{ delay: 0.3, duration: 0.3 }}
                              style={{ flex: 1, padding: '10px 12px', borderRadius: 10,
                                background: `${p.color}06`, border: `1px solid ${p.color}10`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: 2, background: p.color, display: 'block' }} />
                                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_SECONDARY }}>{p.name}</span>
                                </div>
                                <span style={{ fontSize: 16, fontWeight: 800, color: p.color, fontFamily: 'monospace' }}>{pct}%</span>
                              </div>
                              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', marginTop: 6, overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
                                  style={{ height: '100%', borderRadius: 2, background: p.color }} />
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Metric rows — fill remaining space */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      {[
                        { label: 'This Month', value: formatCurrency(totalLatest), sub: `${momPositive ? '+' : ''}${momGrowth}% MoM`, accent: momPositive ? GREEN : RED, icon: momPositive ? ArrowUpRight : ArrowDownRight },
                        { label: 'SolarPilot', value: formatCurrency(latest?.solarpilot || 0), sub: `${spPct}% share · ${spGrowth}% MoM`, accent: YELLOW, icon: Zap },
                        { label: 'AI Workforce', value: formatCurrency(latest?.aiWorkforce || 0), sub: `${100 - spPct}% share · ${aiGrowth}% MoM`, accent: '#A78BFA', icon: Activity },
                        { label: 'Avg / Month', value: formatCurrency(avgMonthly), sub: `${revenueBreakdown.length}-mo window`, accent: '#60A5FA', icon: TrendingUp },
                      ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.05 }}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                          <s.icon size={14} style={{ color: s.accent, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_TERTIARY }}>{s.label}</span>
                              <span style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: '-0.01em' }}>{s.value}</span>
                            </div>
                            <span style={{ fontSize: 9, color: s.accent, fontWeight: 600 }}>{s.sub}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })()}

        {/* ═══ CLIENT REVENUE TABLE + MRR MOVEMENT + FORECAST ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }} className="dash-grid-60-40">

          {/* CLIENT REVENUE TABLE - Premium Dark */}
          <motion.div
            variants={fadeUp}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{
              borderRadius: CARD_RADIUS,
              background: `linear-gradient(rgba(20,20,20,0.85), rgba(20,20,20,0.85)) padding-box, linear-gradient(135deg, rgba(96,165,250,0.1), transparent 40%, rgba(96,165,250,0.06)) border-box`,
              border: '1px solid transparent',
              padding: 26, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={sectionTitle}>
                <Building2 size={18} style={{ color: '#60A5FA' }} />
                Client Revenue
              </div>
              <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontWeight: 500 }}>{clientRevenue.length} clients</span>
            </div>
            <div className="dash-scroll" style={{ overflow: 'auto', flex: 1, maxHeight: 380 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Client', 'Product', 'MRR', 'Setup Fee', 'LTV', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: TEXT_TERTIARY,
                        textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', whiteSpace: 'nowrap',
                        position: 'sticky', top: 0, background: CARD_BG, zIndex: 1 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientRevenue.map((c, i) => {
                    const sColor = statusColors[c.status] || '#9CA3AF'
                    const isHov = hoveredRow === i
                    const pColor = productColors[(c.product || '').toLowerCase()] || TEXT_SECONDARY
                    return (
                      <motion.tr
                        key={c.name}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.04 }}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          borderBottom: `1px solid ${BORDER}`,
                          background: isHov ? 'rgba(255,255,255,0.015)' : 'transparent',
                          transition: 'background 0.15s, border-color 0.3s',
                          cursor: 'default',
                          borderLeft: `2px solid ${isHov ? `${sColor}50` : 'transparent'}`,
                        }}
                      >
                        <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: TEXT_PRIMARY }}>{c.name}</p>
                        </td>
                        <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: pColor, background: `${pColor}12`,
                            padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{c.product}</span>
                        </td>
                        <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: GREEN, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {(c.mrr ?? 0) > 0 ? formatCurrency(c.mrr) : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {(c.setupFee ?? 0) > 0 ? formatCurrency(c.setupFee) : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {(c.ltv ?? 0) > 0 ? formatCurrency(c.ltv) : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: sColor, background: `${sColor}12`,
                            padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize', whiteSpace: 'nowrap',
                            boxShadow: `0 0 10px ${sColor}18`,
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                          }}>
                            {c.status === 'active' && (
                              <span className="fc-pulse" style={{
                                width: 5, height: 5, borderRadius: '50%', background: sColor,
                                boxShadow: `0 0 4px ${sColor}`, display: 'inline-block', flexShrink: 0,
                              }} />
                            )}
                            {c.status}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* MRR MOVEMENT + FORECAST COLUMN */}
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* MRR MOVEMENT - Cinematic Gauges */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
              style={{
                borderRadius: CARD_RADIUS, background: CARD_BG,
                border: `1px solid ${BORDER}`, padding: 26,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={sectionTitle}>
                  <Activity size={18} style={{ color: GREEN }} />
                  MRR Movement
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="fc-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN,
                    boxShadow: '0 0 6px rgba(16,185,129,0.5)', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>this month</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
                {[
                  { label: 'New MRR', value: mrrMovement.newMRR, positive: true, icon: ArrowUpRight, accent: GREEN, isNet: false },
                  { label: 'Churned MRR', value: Math.abs(mrrMovement.churnedMRR), positive: false, icon: ArrowDownRight, accent: RED, isNet: false },
                  { label: 'Expansion MRR', value: mrrMovement.expansionMRR, positive: true, icon: ArrowUpRight, accent: '#A78BFA', isNet: false },
                  { label: 'Net New MRR', value: Math.abs(mrrMovement.netNewMRR), positive: mrrMovement.netNewMRR >= 0, icon: TrendingUp, accent: GREEN, isNet: true },
                ].map((item) => {
                  const barWidth = Math.max(5, (item.value / mrrMaxVal) * 100)
                  return (
                    <div key={item.label}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <item.icon size={14} style={{ color: item.accent }} />
                          <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: item.isNet ? 600 : 400 }}>{item.label}</span>
                        </div>
                        <span style={{
                          fontSize: item.isNet ? 16 : 13, fontWeight: 700, color: item.accent, fontFamily: 'monospace',
                          textShadow: item.isNet ? `0 0 20px ${item.accent}40` : 'none',
                        }}>
                          {item.positive ? '+' : '-'}{formatCurrency(item.value)}
                        </span>
                      </div>
                      <div style={{ height: item.isNet ? 6 : 4, borderRadius: item.isNet ? 3 : 2,
                        background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.6 }}
                          style={{
                            height: '100%', borderRadius: item.isNet ? 3 : 2,
                            background: `linear-gradient(90deg, ${item.accent}50, ${item.accent})`,
                            boxShadow: item.isNet ? `0 0 14px ${item.accent}35` : 'none',
                          }}
                        />
                      </div>
                      {item.isNet && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '40%' }}
                          transition={{ type: 'spring', stiffness: 60, damping: 25, delay: 0.9 }}
                          style={{ height: 1, marginTop: 5, borderRadius: 1,
                            background: `linear-gradient(90deg, ${item.accent}50, transparent)` }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* REVENUE FORECAST - Dramatic Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.25 }}
              style={{
                borderRadius: CARD_RADIUS, background: CARD_BG,
                border: `1px solid ${BORDER}`, padding: 26, flex: 1, position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={sectionTitle}>
                <TrendingUp size={18} style={{ color: YELLOW }} />
                Revenue Forecast
              </div>
              <div style={{ marginTop: 16, position: 'relative' }}>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={forecast} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={YELLOW} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={YELLOW} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={renderCinematicTooltip} />
                    <Line type="monotone" dataKey="actual" stroke={GREEN} strokeWidth={2.5}
                      dot={{ fill: GREEN, r: 3.5, strokeWidth: 0 }}
                      activeDot={{ fill: GREEN, r: 5, stroke: GREEN, strokeWidth: 2, strokeOpacity: 0.3 }} />
                    <Line type="monotone" dataKey="projected" stroke={YELLOW} strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={{ fill: YELLOW, r: 3, strokeWidth: 0 }}
                      activeDot={{ fill: YELLOW, r: 5, stroke: YELLOW, strokeWidth: 2, strokeOpacity: 0.3 }}
                      className="fc-march"
                    />
                    <Line type="monotone" dataKey="projected" stroke={YELLOW} strokeWidth={0}
                      fill="url(#forecastFill)" fillOpacity={1} dot={false} activeDot={false}
                      strokeDasharray="0" />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 12, height: 2.5, background: GREEN, borderRadius: 1 }} />
                    <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>Actual</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 12, height: 2.5, borderRadius: 1,
                      background: `repeating-linear-gradient(90deg, ${YELLOW} 0px, ${YELLOW} 4px, transparent 4px, transparent 7px)` }} />
                    <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>Projected</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══ WIN RATE + COLLECTION EFFICIENCY - Bottom Row ═══ */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {/* Win Rate */}
          <motion.div
            whileHover={{ borderColor: `${GREEN}30`, boxShadow: `0 0 25px -8px ${GREEN}20`, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            style={{ borderRadius: CARD_RADIUS, background: CARD_BG, border: `1px solid ${BORDER}`,
              padding: 22, display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.3s, box-shadow 0.3s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={sectionTitle}>
                <Trophy size={16} style={{ color: YELLOW }} />
                <span style={{ fontSize: 14 }}>Win Rate</span>
              </div>
              <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>this month</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1 }}>
                {Math.round(animValues[5] || 0)}%
              </span>
              <span style={{ fontSize: 11, color: GREEN, fontWeight: 500, marginBottom: 4 }}>+5% vs last month</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${winRate}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.8 }}
                style={{ height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, rgba(243,216,64,0.5), #F3D840)',
                  boxShadow: '0 0 10px rgba(243,216,64,0.25)' }}
              />
            </div>
          </motion.div>

          {/* Collection Efficiency */}
          <motion.div
            whileHover={{ borderColor: `${YELLOW}30`, boxShadow: `0 0 25px -8px ${YELLOW}20`, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            style={{ borderRadius: CARD_RADIUS, background: CARD_BG, border: `1px solid ${BORDER}`,
              padding: 22, display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.3s, box-shadow 0.3s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={sectionTitle}>
                <CreditCard size={16} style={{ color: '#A78BFA' }} />
                <span style={{ fontSize: 14 }}>Collection Rate</span>
              </div>
              <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>all time</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1 }}>
                {invoices.totalInvoiced > 0 ? Math.round((invoices.totalPaid / invoices.totalInvoiced) * 100) : 0}%
              </span>
              <span style={{ fontSize: 11, color: GREEN, fontWeight: 500, marginBottom: 4 }}>healthy</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${invoices.totalInvoiced > 0 ? (invoices.totalPaid / invoices.totalInvoiced) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.9 }}
                style={{ height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, rgba(167,139,250,0.5), #A78BFA)',
                  boxShadow: '0 0 10px rgba(167,139,250,0.25)' }}
              />
            </div>
          </motion.div>

          {/* Invoices Sent */}
          <motion.div
            whileHover={{ borderColor: `${BLUE}30`, boxShadow: `0 0 25px -8px ${BLUE}20`, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            style={{ borderRadius: CARD_RADIUS, background: CARD_BG, border: `1px solid ${BORDER}`,
              padding: 22, display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.3s, box-shadow 0.3s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={sectionTitle}>
                <Receipt size={16} style={{ color: '#60A5FA' }} />
                <span style={{ fontSize: 14 }}>Invoices</span>
              </div>
              <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>this month</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
              <div>
                <span style={{ fontSize: 36, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1 }}>{invoices.sentThisMonth}</span>
                <span style={{ fontSize: 12, color: TEXT_SECONDARY, marginLeft: 6 }}>sent</span>
              </div>
              <div>
                <span style={{ fontSize: 36, fontWeight: 700, color: YELLOW, lineHeight: 1 }}>{invoices.draftCount}</span>
                <span style={{ fontSize: 12, color: TEXT_SECONDARY, marginLeft: 6 }}>draft</span>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${invoices.sentThisMonth > 0 ? Math.min((invoices.sentThisMonth / 20) * 100, 100) : 0}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 1.0 }}
                style={{ height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, rgba(96,165,250,0.5), #60A5FA)',
                  boxShadow: '0 0 10px rgba(96,165,250,0.25)' }}
                />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
