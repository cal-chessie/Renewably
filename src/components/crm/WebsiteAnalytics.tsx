'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import {
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MousePointerClick,
  Clock,
  BarChart3,
  ArrowUpRight,
  Server,
  Zap,
  Users,
  ChevronRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

// ─── Constants ──────────────────────────────────────────────────────────────
const DARK = '#0A0A0A'
const DARK2 = '#1A1A1A'
const DARK3 = '#141414'
const BORDER = '#2A2A2A'
const YELLOW = '#F3D840'
const YELLOW_MUTED = '#C79828'
const TEXT_WHITE = '#FFFFFF'
const TEXT_MUTED = '#9CA3AF'
const TEXT_FAINT = '#6B7280'
const TEXT_DIM = '#4B5563'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── Helper: intensity colour ────────────────────────────────────────────────
function getHeatColor(value: number, max: number): string {
  const ratio = value / max
  if (ratio > 0.8) return '#F3D840'
  if (ratio > 0.6) return '#C79828'
  if (ratio > 0.4) return 'rgba(243, 216, 64, 0.45)'
  if (ratio > 0.2) return 'rgba(243, 216, 64, 0.2)'
  return 'rgba(243, 216, 64, 0.08)'
}

// ─── Tooltip for Recharts ──────────────────────────────────────────────────
const chartTooltipStyle: React.CSSProperties = {
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  backgroundColor: DARK2,
  color: TEXT_WHITE,
  fontSize: 12,
}

// ─── Mini Stat Card ─────────────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, colour }: {
  label: string
  value: string | number
  icon: React.ElementType
  colour?: string
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 8,
      backgroundColor: DARK3,
      border: `1px solid ${BORDER}`,
    }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        backgroundColor: colour ? `${colour}18` : `${YELLOW}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={14} style={{ color: colour || YELLOW_MUTED }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: TEXT_FAINT, fontWeight: 500, lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_WHITE, lineHeight: 1.3, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  const SafeIcon = Icon || Activity
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: `${YELLOW}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <SafeIcon size={12} style={{ color: YELLOW_MUTED }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_WHITE, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
  )
}

// ─── Trend Icon ─────────────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp size={12} style={{ color: '#10B981' }} />
  if (trend === 'down') return <TrendingDown size={12} style={{ color: '#EF4444' }} />
  return <Minus size={12} style={{ color: TEXT_DIM }} />
}

// ─── BACKEND HEALTH PANEL ──────────────────────────────────────────────────
function BackendHealth({ health }: { health: Record<string, unknown> }) {
  const services = Array.isArray(health.services)
    ? health.services as Array<{ name: string; status: string; latency: number }>
    : []
  const status = health.status as string
  const uptime = health.uptime as number
  const avgResponseTime = health.avgResponseTime as number

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Status banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 8,
        backgroundColor: status === 'operational' ? 'rgba(16, 185, 129, 0.08)' : status === 'degraded' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
        border: `1px solid ${status === 'operational' ? 'rgba(16, 185, 129, 0.15)' : status === 'degraded' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: status === 'operational' ? '#10B981' : status === 'degraded' ? '#F59E0B' : '#EF4444',
            boxShadow: status === 'operational' ? '0 0 6px rgba(16,185,129,0.5)' : '0 0 6px rgba(245,158,11,0.5)',
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: status === 'operational' ? '#10B981' : status === 'degraded' ? '#F59E0B' : '#EF4444' }}>
            {status === 'operational' ? 'All Systems Go' : status === 'degraded' ? 'Partial Issues' : 'Issues Detected'}
          </span>
        </div>
        <span style={{ fontSize: 11, color: TEXT_FAINT }}>{uptime}% uptime</span>
      </div>

      {/* Services list */}
      {services.map((svc) => (
        <div key={svc.name} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 0',
          borderBottom: `1px solid rgba(255,255,255,0.04)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: svc.status === 'healthy' ? '#10B981' : svc.status === 'not_configured' ? '#F59E0B' : '#EF4444',
            }} />
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>{svc.name}</span>
          </div>
          <span style={{ fontSize: 11, color: TEXT_DIM }}>
            {svc.latency > 0 ? (svc.latency < 100 ? `${svc.latency}ms` : `${(svc.latency / 1000).toFixed(1)}s`) : '\u2014'}
          </span>
        </div>
      ))}

      {/* Avg response */}
      <div style={{
        marginTop: 4,
        padding: '6px 10px',
        borderRadius: 6,
        backgroundColor: DARK3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, color: TEXT_FAINT }}>Avg Response</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED }}>{avgResponseTime}ms</span>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function WebsiteAnalytics() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'backend'>('analytics')

  const { data, isLoading } = useQuery({
    queryKey: ['crm-website-analytics'],
    queryFn: () => fetch('/api/crm/analytics/website').then((r) => {
      if (!r.ok) throw new Error('Failed to load analytics')
      return r.json()
    }),
    refetchInterval: 60000,
    retry: 2,
  })

  const trafficHeatmap = Array.isArray(data?.trafficHeatmap) ? data.trafficHeatmap : []
  const topPages = Array.isArray(data?.topPages) ? data.topPages : []
  const dailyVisitors = Array.isArray(data?.dailyVisitors) ? data.dailyVisitors : []
  const trafficSources = Array.isArray(data?.trafficSources) ? data.trafficSources : []
  const conversionFunnel = Array.isArray(data?.conversionFunnel) ? data.conversionFunnel : []
  const backendHealth = data?.backendHealth || {}
  const backendServices = Array.isArray(backendHealth.services) ? backendHealth.services : []
  const overview = data?.overview || {}

  const heatmapMax = useMemo(() => {
    if (!trafficHeatmap.length) return 100
    return Math.max(...trafficHeatmap.flat())
  }, [trafficHeatmap])

  // ── Loading state ──
  if (isLoading || !data) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: DARK2,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            height: i === 0 ? 28 : 80,
            borderRadius: 8,
            backgroundColor: DARK3,
          }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: DARK2,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Globe size={16} style={{ color: YELLOW }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_WHITE }}>Website Analytics</span>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          borderRadius: 8,
          backgroundColor: DARK3,
          padding: 3,
          gap: 2,
        }}>
          {(['analytics', 'backend'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                color: activeTab === tab ? DARK : TEXT_FAINT,
                backgroundColor: activeTab === tab ? YELLOW : 'transparent',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {tab === 'analytics' ? 'Analytics' : 'Backend'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {activeTab === 'analytics' ? (
          <>
            {/* ── Live Stats ── */}
            <div>
              <SectionHeader title="Live" icon={Activity} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <MiniStat label="Active Now" value={overview.liveVisitors || 0} icon={Users} colour="#10B981" />
                <MiniStat label="Interactions (30d)" value={overview.totalInteractions?.toLocaleString('en-IE') || '0'} icon={Eye} />
                <MiniStat label="Conversions Today" value={overview.conversionsToday || 0} icon={MousePointerClick} colour="#8B5CF6" />
                <MiniStat
                  label="Lead Growth"
                  value={`${overview.leadGrowth >= 0 ? '+' : ''}${overview.leadGrowth || 0}%`}
                  icon={TrendingUp}
                  colour={overview.leadGrowth >= 0 ? '#10B981' : '#EF4444'}
                />
              </div>
            </div>

            {/* ── Traffic Heatmap ── */}
            <div>
              <SectionHeader title="Traffic Heatmap" icon={BarChart3} />
              <div style={{
                padding: '10px 8px 8px',
                borderRadius: 8,
                backgroundColor: DARK3,
                border: `1px solid ${BORDER}`,
              }}>
                {/* Hour labels */}
                <div style={{ display: 'flex', gap: 1, marginBottom: 2 }}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: 8,
                      color: TEXT_DIM,
                      opacity: h % 4 === 0 ? 1 : 0,
                    }}>
                      {h}
                    </div>
                  ))}
                </div>
                {/* Heatmap grid */}
                {trafficHeatmap.map((row: number[], dayIdx: number) => (
                  <div key={dayIdx} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                    <span style={{ width: 26, fontSize: 9, color: TEXT_DIM, flexShrink: 0, textAlign: 'right' }}>
                      {DAYS[dayIdx]}
                    </span>
                    <div style={{ display: 'flex', gap: 1, flex: 1 }}>
                      {row.map((val, hourIdx) => (
                        <div
                          key={hourIdx}
                          title={`${DAYS[dayIdx]} ${hourIdx}:00 \u2014 ${val} visitors`}
                          style={{
                            flex: 1,
                            height: 14,
                            borderRadius: 2,
                            backgroundColor: getHeatColor(val, heatmapMax),
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.3)'
                            e.currentTarget.style.zIndex = '10'
                            e.currentTarget.style.position = 'relative'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.zIndex = 'auto'
                            e.currentTarget.style.position = 'static'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: TEXT_DIM }}>Low</span>
                  {[8, 25, 45, 65, 85].map((v) => (
                    <div key={v} style={{
                      width: 10, height: 10, borderRadius: 2,
                      backgroundColor: getHeatColor(v, 100),
                    }} />
                  ))}
                  <span style={{ fontSize: 9, color: TEXT_DIM }}>High</span>
                </div>
              </div>
            </div>

            {/* ── Visitors Chart ── */}
            <div>
              <SectionHeader title="Visitors (30d)" icon={TrendingUp} />
              <div style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyVisitors} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={YELLOW} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={YELLOW} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: TEXT_DIM }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => format(new Date(v), 'd/M')}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: TEXT_DIM }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      labelFormatter={(label) => format(new Date(label), 'EEE, MMM d')}
                      formatter={(value: number) => [value, 'Visitors']}
                    />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke={YELLOW}
                      strokeWidth={1.5}
                      fill="url(#visitorGrad)"
                      dot={false}
                      activeDot={{ r: 3, fill: YELLOW, stroke: DARK, strokeWidth: 1.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Traffic Sources ── */}
            <div>
              <SectionHeader title="Traffic Sources" icon={Globe} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {trafficSources.map((src: { source: string; visitors: number; percentage: number; trend: string }) => (
                  <div key={src.source} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    borderRadius: 6,
                    backgroundColor: DARK3,
                    border: `1px solid ${BORDER}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED }}>{src.source}</div>
                      <div style={{
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: DARK,
                        marginTop: 4,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${src.percentage}%`,
                          borderRadius: 2,
                          backgroundColor: YELLOW,
                          opacity: 0.6,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_WHITE }}>
                        {src.percentage}%
                      </span>
                      <TrendIcon trend={src.trend as 'up' | 'down' | 'stable'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CRM Pages ── */}
            <div>
              <SectionHeader title="CRM Pages" icon={Eye} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {topPages.slice(0, 4).map((page: { path: string; title: string; views: number }, i: number) => (
                  <div key={page.path} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    borderRadius: 6,
                    backgroundColor: i === 0 ? `${YELLOW}08` : DARK3,
                    border: `1px solid ${i === 0 ? `${YELLOW}20` : BORDER}`,
                  }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: i === 0 ? YELLOW : TEXT_DIM,
                      width: 16,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: i === 0 ? TEXT_WHITE : TEXT_MUTED,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {page.title}
                      </div>
                      <span style={{ fontSize: 10, color: TEXT_DIM }}>{page.path}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, flexShrink: 0 }}>
                      {page.views.toLocaleString('en-IE')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Engagement ── */}
            <div>
              <SectionHeader title="Engagement" icon={Clock} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <MiniStat
                  label="Bounce Rate (7d)"
                  value={`${overview.bounceRate || 0}%`}
                  icon={TrendingDown}
                  colour={((overview.bounceRate as number) || 0) > 50 ? '#EF4444' : '#10B981'}
                />
                <MiniStat
                  label="Win Rate"
                  value={`${overview.winRate || 0}%`}
                  icon={TrendingUp}
                  colour="#10B981"
                />
              </div>
            </div>

            {/* ── Conversion Funnel ── */}
            <div>
              <SectionHeader title="Conversion Funnel" icon={MousePointerClick} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {conversionFunnel.map((step: { stage: string; count: number; rate: number }, i: number) => {
                  const maxCount = conversionFunnel[0]?.count || 1
                  const width = (step.count / maxCount) * 100
                  return (
                    <div key={step.stage}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 3,
                      }}>
                        <span style={{ fontSize: 11, color: TEXT_MUTED }}>{step.stage}</span>
                        <span style={{ fontSize: 10, color: TEXT_DIM }}>
                          {step.count.toLocaleString('en-IE')} ({step.rate}%)
                        </span>
                      </div>
                      <div style={{
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: DARK3,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.max(width, 4)}%`,
                          borderRadius: 4,
                          backgroundColor: YELLOW,
                          opacity: 1 - (i * 0.12),
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── Backend Tab ── */}
            <BackendHealth health={backendHealth} />

            {/* ── Key Metrics ── */}
            <div>
              <SectionHeader title="Performance" icon={Zap} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <MiniStat
                  label="Avg Response"
                  value={`${backendHealth.avgResponseTime || 0}ms`}
                  icon={Clock}
                  colour="#10B981"
                />
                <MiniStat
                  label="Error Rate"
                  value={`${backendHealth.errorRate || 0}%`}
                  icon={Activity}
                  colour={backendHealth.errorRate > 1 ? '#EF4444' : '#10B981'}
                />
                <MiniStat
                  label="Uptime (30d)"
                  value={`${backendHealth.uptime || 0}%`}
                  icon={Server}
                  colour="#3B82F6"
                />
              </div>
            </div>

            {/* ── Services Detail ── */}
            <div>
              <SectionHeader title="Services" icon={Server} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {backendServices.map((svc: { name: string; status: string; latency: number }) => (
                  <div key={svc.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: DARK3,
                    border: `1px solid ${BORDER}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: svc.status === 'healthy' ? '#10B981' : svc.status === 'not_configured' ? '#F59E0B' : '#EF4444',
                        boxShadow: svc.status === 'healthy' ? '0 0 4px rgba(16,185,129,0.4)' : svc.status === 'not_configured' ? '0 0 4px rgba(245,158,11,0.4)' : '0 0 4px rgba(239,68,68,0.4)',
                      }} />
                      <span style={{ fontSize: 12, color: TEXT_MUTED }}>{svc.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: TEXT_DIM }}>
                        {svc.latency > 0 ? (svc.latency < 100 ? `${svc.latency}ms` : `${(svc.latency / 1000).toFixed(1)}s`) : '\u2014'}
                      </span>
                      {svc.status === 'healthy' && <ChevronRight size={12} style={{ color: TEXT_DIM }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Last Deploy ── */}
            {backendHealth.lastDeploy && (
              <div style={{
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: DARK3,
                border: `1px solid ${BORDER}`,
              }}>
                <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 4 }}>Last Deployment</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_WHITE }}>
                  {format(new Date(backendHealth.lastDeploy), 'MMM d, yyyy \u00b7 HH:mm')}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        padding: '10px 16px',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 6px rgba(16,185,129,0.5)',
          }} />
          <span style={{ fontSize: 10, color: TEXT_DIM }}>CRM Analytics</span>
        </div>
        <a
          href="/crm/reports"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            color: TEXT_DIM,
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = YELLOW }}
          onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_DIM }}
        >
          Full Reports <ArrowUpRight size={10} />
        </a>
      </div>
    </div>
  )
}
