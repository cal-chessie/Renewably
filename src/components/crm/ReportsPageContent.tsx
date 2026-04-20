'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  DollarSign,
  Activity,
  Target,
  Users,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Loader2,
  Zap,
  FileText,
  Handshake,
  UserCheck,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
} from 'recharts'

// ===== TYPES =====
interface DashboardData {
  revenueForecast: {
    current: number
    projected: number
    confidence: number
    monthly: Array<{
      month: string
      actual: number | null
      projected: number | null
      lower70: number | null
      upper70: number | null
      lower90: number | null
      upper90: number | null
    }>
  }
  pipelineMetrics: {
    byStage: Array<{ stage: string; color: string; value: number; count: number; weighted: number }>
    avgDealSize: number
    avgCycleDays: number
    weightedPipeline: number
    totalPipelineValue: number
  }
  activityMetrics: {
    byType: Record<string, number>
    byUser: Array<{ name: string; count: number }>
    trend: Array<{ week: string; count: number }>
  }
  conversionFunnel: {
    leads: number
    qualified: number
    proposal: number
    negotiation: number
    won: number
    lost: number
  }
  stageFunnel: Array<{ stage: string; count: number; value: number }>
  topPerformers: Array<{ name: string; dealsWon: number; revenue: number; activeDeals: number }>
  dealVelocity: {
    avgDaysPerStage: Record<string, number>
    bottlenecks: Array<{ stage: string; days: number }>
  }
  proposalMetrics: {
    sent: number
    viewed: number
    accepted: number
    acceptanceRate: number
    avgValue: number
    byMonth: Array<{ month: string; sent: number; accepted: number; value: number }>
  }
  meetingMetrics: {
    total: number
    completed: number
    completionRate: number
    byType: Record<string, { total: number; completed: number }>
  }
  revenueBySource: Array<{ source: string; value: number }>
  revenueByCompany: Array<{ company: string; value: number }>
  monthlyComparison: {
    thisMonth: Record<string, number>
    lastMonth: Record<string, number>
    change: Record<string, number>
  }
  winRate: number
}

// ===== SAFE DATA ACCESS =====
const safeNum = (val: number | null | undefined): number => val ?? 0

const safeRecordNum = (rec: Record<string, number> | null | undefined, key: string): number =>
  rec?.[key] ?? 0

const safeArray = <T,>(arr: Array<T> | null | undefined): Array<T> => arr ?? []

const safeData = (raw: unknown): DashboardData => {
  const d = raw as Record<string, unknown> | null
  if (!d || typeof d !== 'object') {
    return {
      revenueForecast: { current: 0, projected: 0, confidence: 0, monthly: [] },
      pipelineMetrics: { byStage: [], avgDealSize: 0, avgCycleDays: 0, weightedPipeline: 0, totalPipelineValue: 0 },
      activityMetrics: { byType: {}, byUser: [], trend: [] },
      conversionFunnel: { leads: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 },
      stageFunnel: [],
      topPerformers: [],
      dealVelocity: { avgDaysPerStage: {}, bottlenecks: [] },
      proposalMetrics: { sent: 0, viewed: 0, accepted: 0, acceptanceRate: 0, avgValue: 0, byMonth: [] },
      meetingMetrics: { total: 0, completed: 0, completionRate: 0, byType: {} },
      revenueBySource: [],
      revenueByCompany: [],
      monthlyComparison: { thisMonth: {}, lastMonth: {}, change: {} },
      winRate: 0,
    }
  }
  const rf = (d.revenueForecast as Record<string, unknown>) ?? {}
  const pm = (d.pipelineMetrics as Record<string, unknown>) ?? {}
  const am = (d.activityMetrics as Record<string, unknown>) ?? {}
  const dv = (d.dealVelocity as Record<string, unknown>) ?? {}
  const propM = (d.proposalMetrics as Record<string, unknown>) ?? {}
  const mm = (d.meetingMetrics as Record<string, unknown>) ?? {}
  const mc = (d.monthlyComparison as Record<string, unknown>) ?? {}
  return {
    revenueForecast: {
      current: safeNum(rf.current as number),
      projected: safeNum(rf.projected as number),
      confidence: safeNum(rf.confidence as number),
      monthly: safeArray(rf.monthly as Array<DashboardData['revenueForecast']['monthly'][0]>),
    },
    pipelineMetrics: {
      byStage: safeArray(pm.byStage as DashboardData['pipelineMetrics']['byStage']),
      avgDealSize: safeNum(pm.avgDealSize as number),
      avgCycleDays: safeNum(pm.avgCycleDays as number),
      weightedPipeline: safeNum(pm.weightedPipeline as number),
      totalPipelineValue: safeNum(pm.totalPipelineValue as number),
    },
    activityMetrics: {
      byType: (am.byType as Record<string, number>) ?? {},
      byUser: safeArray(am.byUser as DashboardData['activityMetrics']['byUser']),
      trend: safeArray(am.trend as DashboardData['activityMetrics']['trend']),
    },
    conversionFunnel: (d.conversionFunnel as DashboardData['conversionFunnel']) ?? { leads: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 },
    stageFunnel: safeArray(d.stageFunnel as DashboardData['stageFunnel']),
    topPerformers: safeArray(d.topPerformers as DashboardData['topPerformers']),
    dealVelocity: {
      avgDaysPerStage: (dv.avgDaysPerStage as Record<string, number>) ?? {},
      bottlenecks: safeArray(dv.bottlenecks as DashboardData['dealVelocity']['bottlenecks']),
    },
    proposalMetrics: {
      sent: safeNum(propM.sent as number),
      viewed: safeNum(propM.viewed as number),
      accepted: safeNum(propM.accepted as number),
      acceptanceRate: safeNum(propM.acceptanceRate as number),
      avgValue: safeNum(propM.avgValue as number),
      byMonth: safeArray(propM.byMonth as DashboardData['proposalMetrics']['byMonth']),
    },
    meetingMetrics: {
      total: safeNum(mm.total as number),
      completed: safeNum(mm.completed as number),
      completionRate: safeNum(mm.completionRate as number),
      byType: (mm.byType as Record<string, { total: number; completed: number }>) ?? {},
    },
    revenueBySource: safeArray(d.revenueBySource as DashboardData['revenueBySource']),
    revenueByCompany: safeArray(d.revenueByCompany as DashboardData['revenueByCompany']),
    monthlyComparison: {
      thisMonth: (mc.thisMonth as Record<string, number>) ?? {},
      lastMonth: (mc.lastMonth as Record<string, number>) ?? {},
      change: (mc.change as Record<string, number>) ?? {},
    },
    winRate: safeNum(d.winRate as number),
  }
}

// ===== HELPERS =====
const hasData = (data: DashboardData): boolean => {
  const checks = [
    data.revenueForecast.current > 0,
    data.pipelineMetrics.totalPipelineValue > 0,
    data.winRate > 0,
    data.pipelineMetrics.avgDealSize > 0,
    data.proposalMetrics.sent > 0,
    data.meetingMetrics.total > 0,
    data.stageFunnel.some((s) => s.count > 0),
    Object.values(data.activityMetrics.byType).some((v) => v > 0),
  ]
  return checks.some(Boolean)
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-IE').format(value)

const CHART_COLORS = ['#F3D840', '#374151', '#60A5FA', '#4ADE80', '#FB923C', '#F87171', '#A78BFA', '#34D399']

const DATE_RANGES = [
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'all', label: 'All Time' },
] as const

const CustomTooltip = ({ active, payload, label, formatter }: {
  active?: boolean
  payload?: Array<{ name: string; value: number | null; color: string }>
  label?: string
  formatter?: (value: number | null) => string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#141414] rounded-lg shadow-lg border border-[#2A2A2A] p-3 text-xs">
      <p className="font-semibold text-[#A0A0A0] mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[#A0A0A0]">{p.name}:</span>
          <span className="font-medium text-white">
            {formatter ? formatter(p.value) : formatCurrency(p.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ===== SKELETON LOADERS =====
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <Skeleton className="h-3 w-24 mb-3 bg-[#222222]" />
            <Skeleton className="h-8 w-32 mb-2 bg-[#222222]" />
            <Skeleton className="h-3 w-20 bg-[#222222]" />
          </div>
        ))}
      </div>
      {/* Chart area skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl p-6" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <Skeleton className="h-5 w-40 mb-1 bg-[#222222]" />
          <Skeleton className="h-3 w-56 mb-4 bg-[#222222]" />
          <Skeleton className="h-[280px] w-full bg-[#1A1A1A] rounded-lg" />
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <Skeleton className="h-5 w-40 mb-1 bg-[#222222]" />
          <Skeleton className="h-3 w-36 mb-4 bg-[#222222]" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#222222' }}>
                <Skeleton className="h-4 w-16 mb-2 bg-[#2A2A2A]" />
                <Skeleton className="h-6 w-20 mb-1 bg-[#2A2A2A]" />
                <Skeleton className="h-6 w-16 bg-[#2A2A2A]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl p-6" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <Skeleton className="h-5 w-40 mb-1 bg-[#222222]" />
            <Skeleton className="h-3 w-48 mb-4 bg-[#222222]" />
            <Skeleton className="h-[280px] w-full bg-[#1A1A1A] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== SECTION EXPORT BUTTON =====
function SectionExport({ type, label }: { type: string; label: string }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setExporting(true)
    try {
      const params = new URLSearchParams({ type })
      const res = await fetch(`/api/crm/reports/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success(`${label} exported successfully`)
      } else {
        toast.error('Export failed')
      }
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-[10px] text-gray-400 hover:text-white hover:bg-[#2A2A2A]"
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
      CSV
    </Button>
  )
}

// ===== EMPTY SECTION =====
function EmptySection({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(243,216,64,0.06)', border: '1px solid rgba(243,216,64,0.10)' }}>
        <Icon className="h-6 w-6" style={{ color: 'rgba(243,216,64,0.3)' }} />
      </div>
      <p className="text-sm font-medium text-[#A0A0A0] mb-1">{title}</p>
      <p className="text-xs text-[#666666] text-center max-w-[240px]">{description}</p>
    </div>
  )
}

// ===== STAT CARD COMPONENT =====
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'text-[#F3D840]',
  bgColor = 'bg-[#F3D840]/10',
  sparkData,
}: {
  title: string
  value: string
  change?: number
  icon: React.ElementType
  color?: string
  bgColor?: string
  sparkData?: Array<{ v: number }>
}) {
  return (
    <Card className="shadow-sm border-0 hover:shadow-md transition-shadow duration-300" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {change >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Math.abs(change)}%
                </span>
                <span className="text-xs text-gray-400">vs last month</span>
              </div>
            )}
          </div>
          <div className={`${bgColor} p-2.5 rounded-xl`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        {sparkData && sparkData.length > 0 && (
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`spark-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F3D840" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F3D840" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#F3D840"
                  strokeWidth={1.5}
                  fill={`url(#spark-${title.replace(/\s/g, '')})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ===== QUICK STAT CARD (compact) =====
function QuickStatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = '#F3D840',
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: string
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
      style={{ backgroundColor: '#141414', border: '1px solid #2A2A2A' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}15` }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-[#666666] uppercase tracking-wider">{label}</p>
        <p className="text-base font-bold text-white truncate">{value}</p>
        {sub && <p className="text-[10px] text-[#666666] truncate">{sub}</p>}
      </div>
    </div>
  )
}

// ===== COMPARISON CARD =====
function ComparisonCard({
  title,
  thisMonth,
  lastMonth,
  change,
  icon: Icon,
}: {
  title: string
  thisMonth: string
  lastMonth: string
  change: number
  icon: React.ElementType
}) {
  return (
    <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider">{title}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-bold text-white">{thisMonth}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">This Month</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#A0A0A0]">{lastMonth}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Last Month</p>
          </div>
        </div>
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {change >= 0 ? '+' : ''}{change}%
        </div>
      </CardContent>
    </Card>
  )
}

// ===== MAIN PAGE =====
export default function ReportsPageContent() {
  const [dateRange, setDateRange] = useState<string>('thisMonth')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [reportName, setReportName] = useState('')
  const [reportType, setReportType] = useState('custom')

  const { data: rawData, isLoading } = useQuery<DashboardData>({
    queryKey: ['reports-dashboard', dateRange],
    queryFn: () => fetch(`/api/crm/reports/dashboard?period=${dateRange}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const data = safeData(rawData)

  const handleDateRangeChange = useCallback((value: string) => {
    setDateRange(value)
  }, [])

  const handleExport = async (type: string) => {
    try {
      const params = new URLSearchParams({ type })
      const res = await fetch(`/api/crm/reports/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Report exported successfully')
      }
    } catch {
      toast.error('Failed to export report')
    }
  }

  const handleSaveReport = async () => {
    if (!reportName.trim()) return
    try {
      const res = await fetch('/api/crm/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          description: `Saved report - ${reportType}`,
          type: reportType,
          config: { dateRange, sections: 'all' },
        }),
      })
      if (res.ok) {
        toast.success('Report saved successfully')
        setSaveDialogOpen(false)
        setReportName('')
      }
    } catch {
      toast.error('Failed to save report')
    }
  }

  // Computed quick stats
  const closedDeals = safeRecordNum(data.monthlyComparison.thisMonth, 'dealsWon')
  const conversionRate = data.winRate
  const activeContacts = data.topPerformers.reduce((sum, p) => sum + p.activeDeals, 0)
  const totalRevenue = safeNum(data.revenueForecast.current)

  if (isLoading) {
    return (
      <div>
        {/* Header skeleton */}
        <div className="bg-[#141414] border-b border-[#2A2A2A] sticky top-0 z-30">
          <div className="max-w-[1600px] mx-auto py-6 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl bg-[#222222]" />
                <div>
                  <Skeleton className="h-6 w-48 bg-[#222222] mb-1" />
                  <Skeleton className="h-4 w-64 bg-[#222222]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-[160px] rounded-md bg-[#222222]" />
                <Skeleton className="h-9 w-[130px] rounded-md bg-[#222222]" />
                <Skeleton className="h-9 w-28 rounded-md bg-[#222222]" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto py-8 px-4">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .max-w-\\[1600px\\] { max-width: 100% !important; }
          [class*="rounded-"] { break-inside: avoid; }
          canvas, svg { max-width: 100% !important; }
          * { color: #000 !important; border-color: #ddd !important; background: white !important; }
          .bg-\\[\\#141414\\], .bg-\\[\\#1A1A1A\\], .bg-\\[\\#222222\\] { background: white !important; }
          .shadow-sm, .shadow-lg { box-shadow: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto py-6 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#F3D840]/10 p-2 rounded-xl">
                <BarChart3 className="h-5 w-5 text-[#F3D840]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Reports & Analytics</h1>
                <p className="text-sm text-[#A0A0A0]">Advanced reporting and revenue forecasting</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-xs text-gray-400 hover:text-white hover:bg-[#2A2A2A] gap-1.5 print:hidden"
                onClick={() => window.print()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2"/><path d="M18 18h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2"/><line x1="6" x2="18" y1="14" y2="14"/><line x1="6" x2="18" y1="10" y2="10"/><line x1="6" x2="18" y1="6" y2="6"/></svg>
                Print Report
              </Button>
              <Select onValueChange={handleExport}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue CSV</SelectItem>
                  <SelectItem value="activity">Activity CSV</SelectItem>
                  <SelectItem value="pipeline">Pipeline CSV</SelectItem>
                  <SelectItem value="forecast">Forecast CSV</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9 bg-[#F3D840] text-[#374151] hover:bg-[#E5C832] text-xs font-semibold gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    Save Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Report</DialogTitle>
                    <DialogDescription>Save the current view as a report configuration for future reference.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Report Name</Label>
                      <Input
                        placeholder="e.g., Q2 Revenue Report"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="pipeline">Pipeline</SelectItem>
                          <SelectItem value="activity">Activity</SelectItem>
                          <SelectItem value="forecast">Forecast</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={handleSaveReport}
                      disabled={!reportName.trim()}
                      className="bg-[#F3D840] text-[#374151] hover:bg-[#E5C832]"
                    >
                      Save Report
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto py-8 px-4">
        {!hasData(data) ? (
          /* ===== EMPTY STATE ===== */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="relative mb-6">
              <div
                className="w-28 h-28 rounded-3xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(243,216,64,0.06)', border: '1px solid rgba(243,216,64,0.10)' }}
              >
                <BarChart3 className="h-14 w-14" style={{ color: 'rgba(243,216,64,0.25)' }} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No data yet</h2>
            <p className="text-sm text-[#A0A0A0] max-w-md text-center leading-relaxed">
              Reports will populate as you add contacts, deals, proposals, and invoices to the CRM.
            </p>
            <p className="text-xs text-[#666666] mt-3">
              Start by creating your first contact or deal to see analytics here.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* ===== KEY METRICS ROW (ultra-compact) ===== */}
            <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { label: 'Total Revenue', value: formatCurrency(safeNum(data.revenueForecast.current)), icon: DollarSign, accent: '#F3D840', spark: safeArray(data.revenueForecast.monthly).filter((m) => m.actual !== null).map((m) => ({ v: m.actual ?? 0 })) },
                { label: 'Pipeline Value', value: formatCurrency(safeNum(data.pipelineMetrics.totalPipelineValue)), icon: TrendingUp, accent: '#4ADE80', spark: undefined },
                { label: 'Win Rate', value: `${safeNum(data.winRate)}%`, icon: Target, accent: '#FB923C', spark: undefined },
                { label: 'Active Deals', value: formatNumber(safeArray(data.stageFunnel).reduce((s, st) => s + st.count, 0)), icon: Handshake, accent: '#60A5FA', spark: undefined },
              ] as const).map((m) => {
                const MIcon = m.icon
                return (
                  <div
                    key={m.label}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                    style={{ backgroundColor: '#141414', border: '1px solid #2A2A2A' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${m.accent}15` }}
                    >
                      <MIcon className="h-4 w-4" style={{ color: m.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium text-[#666666] uppercase tracking-wider">{m.label}</p>
                      <p className="text-sm font-bold text-white truncate">{m.value}</p>
                    </div>
                    {m.spark && m.spark.length > 0 && (
                      <div className="w-16 h-6 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={m.spark}>
                            <defs>
                              <linearGradient id="km-spark-rev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F3D840" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#F3D840" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="#F3D840" strokeWidth={1.5} fill="url(#km-spark-rev)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )
              })}
            </motion.div>

            {/* ===== QUICK STATS BAR ===== */}
            <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickStatCard
                label="Total Revenue"
                value={formatCurrency(totalRevenue)}
                sub={`${safeRecordNum(data.monthlyComparison.change, 'revenue') >= 0 ? '+' : ''}${safeRecordNum(data.monthlyComparison.change, 'revenue')}% vs last month`}
                icon={DollarSign}
                accent="#F3D840"
              />
              <QuickStatCard
                label="Closed Deals"
                value={formatNumber(closedDeals)}
                sub={`${safeRecordNum(data.monthlyComparison.thisMonth, 'dealsLost')} lost this month`}
                icon={Handshake}
                accent="#4ADE80"
              />
              <QuickStatCard
                label="Conversion Rate"
                value={`${conversionRate}%`}
                sub={`${safeRecordNum(data.monthlyComparison.change, 'dealsWon') >= 0 ? 'Up' : 'Down'} from last month`}
                icon={Target}
                accent="#FB923C"
              />
              <QuickStatCard
                label="Active Contacts"
                value={formatNumber(activeContacts)}
                sub={`${data.topPerformers.length} team members`}
                icon={UserCheck}
                accent="#60A5FA"
              />
            </motion.div>

            {/* ===== DATE RANGE SELECTOR ===== */}
            <motion.div variants={item} className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-[#666666]" />
              <span className="text-xs font-medium text-[#666666] mr-1">Period:</span>
              {DATE_RANGES.map((range) => (
                <Button
                  key={range.value}
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 text-xs font-medium rounded-lg transition-colors ${
                    dateRange === range.value
                      ? 'bg-[#F3D840] text-[#374151] hover:bg-[#E5C832]'
                      : 'text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A]'
                  }`}
                  onClick={() => handleDateRangeChange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </motion.div>

            {/* ===== TOP STATS ROW ===== */}
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(safeNum(data.revenueForecast.current))}
                change={safeRecordNum(data.monthlyComparison.change, 'revenue')}
                icon={DollarSign}
                color="text-[#F3D840]"
                bgColor="bg-[#F3D840]/10"
                sparkData={safeArray(data.revenueForecast.monthly)
                  .filter((m) => m.actual !== null)
                  .map((m) => ({ v: m.actual ?? 0 }))}
              />
              <StatCard
                title="Pipeline Value"
                value={formatCurrency(safeNum(data.pipelineMetrics.totalPipelineValue))}
                icon={TrendingUp}
                color="text-emerald-500"
                bgColor="bg-emerald-500/10"
                sparkData={safeArray(data.pipelineMetrics.byStage).map((s) => ({ v: s.value }))}
              />
              <StatCard
                title="Win Rate"
                value={`${safeNum(data.winRate)}%`}
                change={safeRecordNum(data.monthlyComparison.change, 'dealsWon')}
                icon={Target}
                color="text-blue-500"
                bgColor="bg-blue-500/10"
              />
              <StatCard
                title="Avg Deal Size"
                value={formatCurrency(safeNum(data.pipelineMetrics.avgDealSize))}
                icon={BarChart3}
                color="text-purple-500"
                bgColor="bg-purple-500/10"
              />
            </motion.div>

            {/* ===== REVENUE FORECAST + MONTHLY COMPARISON ===== */}
            <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Revenue Forecast Chart */}
              <Card className="xl:col-span-2 shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-white">Revenue Forecast</CardTitle>
                      <CardDescription className="text-xs text-[#A0A0A0] mt-0.5">
                        Actual vs projected revenue with confidence intervals
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#F3D840]/10 text-[#374151] text-xs font-medium">
                        {safeNum(data.revenueForecast.confidence)}% confidence
                      </Badge>
                      <SectionExport type="forecast" label="Revenue forecast" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-sm text-[#A0A0A0]">Expected this quarter:</span>
                    <span className="text-lg font-bold text-[#F3D840]">
                      {formatCurrency(safeNum(data.revenueForecast.projected))}
                    </span>
                  </div>
                  {safeArray(data.revenueForecast.monthly).length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={safeArray(data.revenueForecast.monthly)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F3D840" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#F3D840" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F3D840" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#F3D840" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="band90Grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F3D840" stopOpacity={0.08} />
                              <stop offset="100%" stopColor="#F3D840" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="upper90" stroke="none" fill="url(#band90Grad)"
                            name="90% Upper" connectNulls={false} />
                          <Area type="monotone" dataKey="lower90" stroke="none" fill="#1A1A1A"
                            name="90% Lower" connectNulls={false} />
                          <Area type="monotone" dataKey="upper70" stroke="none" fill="url(#projectedGrad)"
                            name="70% Upper" connectNulls={false} />
                          <Area type="monotone" dataKey="lower70" stroke="none" fill="#0A0A0A"
                            name="70% Lower" connectNulls={false} />
                          <Area type="monotone" dataKey="actual" stroke="#F3D840" strokeWidth={2.5}
                            fill="url(#actualGrad)" name="Actual Revenue" dot={false} connectNulls={false} />
                          <Line type="monotone" dataKey="projected" stroke="#374151" strokeWidth={2}
                            strokeDasharray="6 4" name="Projected" dot={{ fill: '#374151', r: 3 }} connectNulls={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptySection icon={TrendingUp} title="No forecast data" description="Revenue forecast will appear once deals are created and won." />
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-[#F3D840] rounded" />
                      Actual Revenue
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-[#374151] rounded border-dashed" style={{ borderTop: '2px dashed #374151' }} />
                      Projected
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[#F3D840]/15 rounded" />
                      Confidence Band
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Comparison */}
              <div className="space-y-4">
                <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-white">Monthly Comparison</CardTitle>
                    <CardDescription className="text-xs text-[#A0A0A0]">This month vs last month</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    {Object.keys(data.monthlyComparison.thisMonth).length > 0 ? (
                      <>
                    <ComparisonCard
                      title="Revenue"
                      thisMonth={formatCurrency(safeRecordNum(data.monthlyComparison.thisMonth, 'revenue'))}
                      lastMonth={formatCurrency(safeRecordNum(data.monthlyComparison.lastMonth, 'revenue'))}
                      change={safeRecordNum(data.monthlyComparison.change, 'revenue')}
                      icon={DollarSign}
                    />
                    <ComparisonCard
                      title="Deals Won"
                      thisMonth={String(safeRecordNum(data.monthlyComparison.thisMonth, 'dealsWon'))}
                      lastMonth={String(safeRecordNum(data.monthlyComparison.lastMonth, 'dealsWon'))}
                      change={safeRecordNum(data.monthlyComparison.change, 'dealsWon')}
                      icon={TrendingUp}
                    />
                    <ComparisonCard
                      title="New Deals"
                      thisMonth={String(safeRecordNum(data.monthlyComparison.thisMonth, 'newDeals'))}
                      lastMonth={String(safeRecordNum(data.monthlyComparison.lastMonth, 'newDeals'))}
                      change={safeRecordNum(data.monthlyComparison.change, 'newDeals')}
                      icon={Zap}
                    />
                    <ComparisonCard
                      title="Activities"
                      thisMonth={String(safeRecordNum(data.monthlyComparison.thisMonth, 'activities'))}
                      lastMonth={String(safeRecordNum(data.monthlyComparison.lastMonth, 'activities'))}
                      change={safeRecordNum(data.monthlyComparison.change, 'activities')}
                      icon={Activity}
                    />
                      </>
                    ) : (
                      <EmptySection icon={Calendar} title="No comparison data" description="Monthly comparison will appear after at least two months of activity." />
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* ===== PIPELINE ANALYSIS ===== */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pipeline by Stage */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-white">Pipeline by Stage</CardTitle>
                      <CardDescription className="text-xs text-[#A0A0A0]">
                        Deal value distribution across pipeline stages
                      </CardDescription>
                    </div>
                    <SectionExport type="pipeline" label="Pipeline" />
                  </div>
                </CardHeader>
                <CardContent>
                  {safeArray(data.pipelineMetrics.byStage).length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={safeArray(data.pipelineMetrics.byStage)} layout="vertical"
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false} tickLine={false} width={90} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" name="Pipeline Value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                            {safeArray(data.pipelineMetrics.byStage).map((entry, index) => (
                              <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptySection icon={BarChart3} title="No pipeline data" description="Add deals to your pipeline to see stage-by-stage analysis." />
                  )}
                </CardContent>
              </Card>

              {/* Conversion Funnel */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-white">Conversion Funnel</CardTitle>
                  <CardDescription className="text-xs text-[#A0A0A0]">
                    Deal flow through pipeline stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {safeArray(data.stageFunnel).length > 0 ? (
                    <div className="space-y-3">
                      {safeArray(data.stageFunnel).map((stage, index) => {
                        const maxCount = Math.max(...safeArray(data.stageFunnel).map((s) => s.count), 1)
                        const width = Math.max((stage.count / maxCount) * 100, 8)
                        const colors = ['#94A3B8', '#60A5FA', '#F3D840', '#FB923C', '#4ADE80', '#F87171']
                        const color = colors[index] || '#94A3B8'

                        return (
                          <motion.div
                            key={stage.stage}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-[#A0A0A0]">{stage.stage}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{stage.count}</span>
                                <span className="text-gray-400">{formatCurrency(stage.value)}</span>
                              </div>
                            </div>
                            <div className="relative h-8 bg-[#1A1A1A] rounded-lg overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${width}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                                className="absolute inset-y-0 left-0 rounded-lg"
                                style={{ backgroundColor: color, opacity: 0.75 }}
                              />
                            </div>
                            {index > 0 && index < safeArray(data.stageFunnel).length - 1 && (
                              <div className="text-[10px] text-gray-400 flex justify-end">
                                {(() => {
                                  const prevCount = safeArray(data.stageFunnel)[index - 1]?.count || 1
                                  const dropPct = prevCount > 0 ? Math.round(((prevCount - stage.count) / prevCount) * 100) : 0
                                  return stage.count < prevCount
                                    ? <span className="text-red-400">-{dropPct}% drop-off</span>
                                    : stage.count > prevCount
                                      ? <span className="text-emerald-500">+{Math.round(((stage.count - prevCount) / prevCount) * 100)}% growth</span>
                                      : null
                                })()}
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptySection icon={TrendingDown} title="No funnel data" description="The conversion funnel will populate as deals move through pipeline stages." />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ===== ACTIVITY & ENGAGEMENT ===== */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Trend */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-white">Activity Trend</CardTitle>
                      <CardDescription className="text-xs text-[#A0A0A0]">Weekly activity volume</CardDescription>
                    </div>
                    <SectionExport type="activity" label="Activity trend" />
                  </div>
                </CardHeader>
                <CardContent>
                  {safeArray(data.activityMetrics.trend).length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={safeArray(data.activityMetrics.trend)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F3D840" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#F3D840" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" name="Activities" fill="#F3D840" radius={[4, 4, 0, 0]} maxBarSize={24} opacity={0.7} />
                          <Line type="monotone" dataKey="count" name="Trend" stroke="#374151" strokeWidth={2} dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptySection icon={Activity} title="No activity data" description="Log activities (calls, emails, meetings) to see trends here." />
                  )}
                </CardContent>
              </Card>

              {/* Activity by Type */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-white">Activity Breakdown</CardTitle>
                  <CardDescription className="text-xs text-[#A0A0A0]">Activities by type and user</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(data.activityMetrics.byType).length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(data.activityMetrics.byType).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {Object.entries(data.activityMetrics.byType).map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [formatNumber(value), 'Count']}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptySection icon={PieChartIcon} title="No breakdown data" description="Activity breakdown will appear as you log different activity types." />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ===== DEAL VELOCITY + PROPOSALS + MEETINGS ===== */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Deal Velocity */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <CardTitle className="text-base font-bold text-white">Deal Velocity</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-[#A0A0A0]">
                    Avg days in each stage · Bottleneck detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(data.dealVelocity.avgDaysPerStage).length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {Object.entries(data.dealVelocity.avgDaysPerStage).map(([stage, days], index) => {
                          const maxDays = Math.max(...Object.values(data.dealVelocity.avgDaysPerStage), 1)
                          const width = (days / maxDays) * 100
                          const isBottleneck = safeArray(data.dealVelocity.bottlenecks).some((b) => b.stage === stage)

                          return (
                            <div key={stage} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  {isBottleneck && (
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  )}
                                  <span className={`font-medium ${isBottleneck ? 'text-amber-700' : 'text-[#A0A0A0]'}`}>
                                    {stage}
                                  </span>
                                </div>
                                <span className="font-semibold text-white">{days}d</span>
                              </div>
                              <div className="relative h-2 bg-[#222222] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${width}%` }}
                                  transition={{ duration: 0.6, delay: index * 0.1 }}
                                  className={`absolute inset-y-0 left-0 rounded-full ${isBottleneck ? 'bg-amber-400' : 'bg-[#F3D840]'}`}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {safeArray(data.dealVelocity.bottlenecks).length > 0 && (
                        <div className="mt-4 p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Bottleneck Detected</p>
                          <p className="text-xs text-amber-600">
                            Deals are stalling at <strong>{data.dealVelocity.bottlenecks[0].stage}</strong> ({data.dealVelocity.bottlenecks[0].days} avg days). Consider expediting deals in this stage.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptySection icon={Clock} title="No velocity data" description="Deal velocity tracking requires deals with activity history." />
                  )}
                </CardContent>
              </Card>

              {/* Proposal Performance */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-white">Proposal Performance</CardTitle>
                  <CardDescription className="text-xs text-[#A0A0A0]">
                    Pipeline funnel: sent → viewed → accepted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {safeNum(data.proposalMetrics.sent) > 0 || safeNum(data.proposalMetrics.accepted) > 0 ? (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                          <div className="w-28 h-28 rounded-full border-4 border-[#2A2A2A] flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full border-4 border-[#2A2A2A] flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full border-4 border-[#F3D840] flex items-center justify-center">
                                <span className="text-sm font-bold text-[#374151]">{safeNum(data.proposalMetrics.acceptanceRate)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#A0A0A0] bg-[#141414] px-2">
                            {safeNum(data.proposalMetrics.sent)} sent
                          </div>
                          <div className="absolute top-2 -right-8 text-xs font-semibold text-[#A0A0A0] bg-[#141414] px-1">
                            {safeNum(data.proposalMetrics.viewed)} viewed
                          </div>
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#F3D840]">
                            {safeNum(data.proposalMetrics.accepted)} won
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="text-center p-2 bg-[#1A1A1A] rounded-lg">
                          <p className="text-lg font-bold text-white">{formatCurrency(safeNum(data.proposalMetrics.avgValue))}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Value</p>
                        </div>
                        <div className="text-center p-2 bg-[#1A1A1A] rounded-lg">
                          <p className="text-lg font-bold text-white">{safeNum(data.proposalMetrics.acceptanceRate)}%</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Accept Rate</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptySection icon={FileText} title="No proposal data" description="Create and send proposals to see performance metrics here." />
                  )}
                </CardContent>
              </Card>

              {/* Meeting Metrics */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-white">Meeting Metrics</CardTitle>
                  <CardDescription className="text-xs text-[#A0A0A0]">Completion rates by meeting type</CardDescription>
                </CardHeader>
                <CardContent>
                  {safeNum(data.meetingMetrics.total) > 0 ? (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative w-24 h-24">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="#2A2A2A" strokeWidth="8" />
                            <circle
                              cx="50" cy="50" r="42" fill="none"
                              stroke="#F3D840" strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${safeNum(data.meetingMetrics.completionRate) * 2.64} ${264 - safeNum(data.meetingMetrics.completionRate) * 2.64}`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-white">{safeNum(data.meetingMetrics.completionRate)}%</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider">Completion</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 mt-2">
                        {Object.entries(data.meetingMetrics.byType).map(([type, metrics]) => {
                          const typeLabel = type === 'call' ? 'Phone Call' : type === 'video' ? 'Video Call' : 'In Person'
                          const rate = metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0
                          return (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-[#A0A0A0]">{typeLabel}</span>
                                <span className="text-gray-400">
                                  {metrics.completed}/{metrics.total} ({rate}%)
                                </span>
                              </div>
                              <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${rate}%` }}
                                  transition={{ duration: 0.6 }}
                                  className="h-full rounded-full bg-[#F3D840]"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <EmptySection icon={Users} title="No meeting data" description="Schedule meetings to see completion rates and type breakdowns." />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ===== REVENUE BY SOURCE + TOP PERFORMERS ===== */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Source */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-gray-400" />
                    <CardTitle className="text-base font-bold text-white">Revenue by Source</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-[#A0A0A0]">Won revenue by lead source</CardDescription>
                </CardHeader>
                <CardContent>
                  {safeArray(data.revenueBySource).length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={safeArray(data.revenueBySource)}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {safeArray(data.revenueBySource).map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px' }}
                            formatter={(value: string) => (
                              <span className="text-[#A0A0A0] capitalize">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptySection icon={PieChartIcon} title="No source data" description="Revenue by source will appear once won deals have contact source information." />
                  )}
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <CardTitle className="text-base font-bold text-white">Top Performers</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-[#A0A0A0]">Team performance by revenue & deals won</CardDescription>
                </CardHeader>
                <CardContent>
                  {safeArray(data.topPerformers).length > 0 ? (
                    <div className="space-y-3">
                      {safeArray(data.topPerformers).map((performer, index) => {
                        const maxRevenue = Math.max(...safeArray(data.topPerformers).map((p) => p.revenue), 1)
                        const barWidth = (performer.revenue / maxRevenue) * 100

                        return (
                          <motion.div
                            key={performer.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.08 }}
                            className="flex items-center gap-3"
                          >
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#222222] text-xs font-bold text-[#A0A0A0] shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-white truncate">{performer.name}</span>
                                <span className="text-sm font-bold text-[#F3D840] ml-2">{formatCurrency(performer.revenue)}</span>
                              </div>
                              <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  transition={{ duration: 0.6, delay: index * 0.08 }}
                                  className="h-full rounded-full bg-[#F3D840]"
                                />
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                <span>{performer.dealsWon} deals won</span>
                                <span>{performer.activeDeals} active</span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptySection icon={Users} title="No performer data" description="Assign deals to team members to see individual performance metrics." />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ===== KEY METRICS SUMMARY ===== */}
            <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{formatCurrency(safeNum(data.pipelineMetrics.weightedPipeline))}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Weighted Pipeline</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{safeNum(data.pipelineMetrics.avgCycleDays)}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Avg Deal Cycle (days)</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{safeNum(data.meetingMetrics.total)}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Total Meetings</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{safeNum(data.proposalMetrics.accepted)}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Proposals Accepted</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
