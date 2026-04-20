'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Globe,
  Zap,
  Search,
  Gauge,
  Target,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ============================================================================
// DESIGN SYSTEM CONSTANTS
// ============================================================================
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

const chartTooltipStyle: React.CSSProperties = {
  background: '#1A1A1A',
  border: `1px solid ${BORDER_HOVER}`,
  borderRadius: 10,
  padding: '10px 14px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
}

// ─── Sparkline helper ───
function generateSparklineData(seed: number): number[] {
  const data: number[] = []
  let value = 30 + Math.abs((seed * 7) % 40)
  for (let i = 0; i < 7; i++) {
    value = Math.max(10, Math.min(90, value + Math.sin(seed * 13 + i * 17) * 20))
    data.push(value)
  }
  return data
}

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
      <polyline points={points} fill="none" stroke={`url(#spark-${color.replace('#', '')})`} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── KPICard ───
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
      <div style={{ ...cardStyle, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, cursor: 'default', borderColor: isHovered ? BORDER_HOVER : BORDER, boxShadow: isHovered ? `0 0 40px ${kpi.accent}08` : 'none' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${kpi.accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <kpi.icon size={20} style={{ color: kpi.accent }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 11, color: TEXT_TERTIARY, margin: 0, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{kpi.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, margin: '6px 0 0', lineHeight: 1.1 }}>{kpi.value}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, color: kpi.positive ? GREEN : RED, margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
            {kpi.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {kpi.delta}
          </p>
          <Sparkline data={sparkData} color={kpi.accent} />
        </div>
      </div>
    </motion.div>
  )
}

export function WebPerformanceTab() {
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
    { label: 'Total Organic Sessions', value: totalSessions.toLocaleString('en-IE'), delta: '+22% MoM', positive: true, icon: Globe, accent: '#60A5FA' },
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
                      <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.sessions.toLocaleString('en-IE')}</span>
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
                      <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: 'monospace' }}>{item.value.toLocaleString('en-IE')}</span>
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
                        <span style={{ fontSize: 11, color: TEXT_SECONDARY, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{kw.volume.toLocaleString('en-IE')}/mo</span>
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
