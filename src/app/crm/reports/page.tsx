'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  DollarSign,
  Activity,
  Target,
  Users,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Filter,
  Loader2,
  Zap,
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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

// ===== HELPERS =====
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

const CustomTooltip = ({ active, payload, label, formatter }: {
  active?: boolean
  payload?: Array<{ name: string; value: number | null; color: string }>
  label?: string
  formatter?: (value: number | null) => string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-medium text-gray-900">
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
    <Card className="shadow-sm border-0 hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
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
    <Card className="shadow-sm border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{thisMonth}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">This Month</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-500">{lastMonth}</p>
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
export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('thisMonth')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [reportName, setReportName] = useState('')
  const [reportType, setReportType] = useState('custom')

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/crm/reports/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleExport = async (type: string) => {
    try {
      const params = new URLSearchParams({ type })
      const res = await fetch(`/api/crm/reports/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-report.csv`
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-[#F3D840] animate-spin" />
          <p className="text-sm text-gray-500">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#F3D840]/10 p-2 rounded-xl">
                <BarChart3 className="h-5 w-5 text-[#F3D840]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm text-gray-500">Advanced reporting and revenue forecasting</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisQuarter">This Quarter</SelectItem>
                  <SelectItem value="lastQuarter">Last Quarter</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          className="space-y-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* ===== TOP STATS ROW ===== */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(data.revenueForecast.current)}
              change={data.monthlyComparison.change.revenue}
              icon={DollarSign}
              color="text-[#F3D840]"
              bgColor="bg-[#F3D840]/10"
              sparkData={data.revenueForecast.monthly
                .filter((m) => m.actual !== null)
                .map((m) => ({ v: m.actual ?? 0 }))}
            />
            <StatCard
              title="Pipeline Value"
              value={formatCurrency(data.pipelineMetrics.totalPipelineValue)}
              icon={TrendingUp}
              color="text-emerald-500"
              bgColor="bg-emerald-50"
              sparkData={data.pipelineMetrics.byStage.map((s) => ({ v: s.value }))}
            />
            <StatCard
              title="Win Rate"
              value={`${data.winRate}%`}
              change={data.monthlyComparison.change.dealsWon}
              icon={Target}
              color="text-blue-500"
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Avg Deal Size"
              value={formatCurrency(data.pipelineMetrics.avgDealSize)}
              icon={BarChart3}
              color="text-purple-500"
              bgColor="bg-purple-50"
            />
          </motion.div>

          {/* ===== REVENUE FORECAST + MONTHLY COMPARISON ===== */}
          <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Revenue Forecast Chart */}
            <Card className="xl:col-span-2 shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900">Revenue Forecast</CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-0.5">
                      Actual vs projected revenue with confidence intervals
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-[#F3D840]/10 text-[#374151] text-xs font-medium">
                    {data.revenueForecast.confidence}% confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-sm text-gray-500">Expected this quarter:</span>
                  <span className="text-lg font-bold text-[#F3D840]">
                    {formatCurrency(data.revenueForecast.projected)}
                  </span>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.revenueForecast.monthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="upper90" stroke="none" fill="url(#band90Grad)"
                        name="90% Upper" connectNulls={false} />
                      <Area type="monotone" dataKey="lower90" stroke="none" fill="#f9fafb"
                        name="90% Lower" connectNulls={false} />
                      <Area type="monotone" dataKey="upper70" stroke="none" fill="url(#projectedGrad)"
                        name="70% Upper" connectNulls={false} />
                      <Area type="monotone" dataKey="lower70" stroke="none" fill="#ffffff"
                        name="70% Lower" connectNulls={false} />
                      <Area type="monotone" dataKey="actual" stroke="#F3D840" strokeWidth={2.5}
                        fill="url(#actualGrad)" name="Actual Revenue" dot={false} connectNulls={false} />
                      <Line type="monotone" dataKey="projected" stroke="#374151" strokeWidth={2}
                        strokeDasharray="6 4" name="Projected" dot={{ fill: '#374151', r: 3 }} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
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
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-gray-900">Monthly Comparison</CardTitle>
                  <CardDescription className="text-xs text-gray-500">This month vs last month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <ComparisonCard
                    title="Revenue"
                    thisMonth={formatCurrency(data.monthlyComparison.thisMonth.revenue)}
                    lastMonth={formatCurrency(data.monthlyComparison.lastMonth.revenue)}
                    change={data.monthlyComparison.change.revenue}
                    icon={DollarSign}
                  />
                  <ComparisonCard
                    title="Deals Won"
                    thisMonth={String(data.monthlyComparison.thisMonth.dealsWon)}
                    lastMonth={String(data.monthlyComparison.lastMonth.dealsWon)}
                    change={data.monthlyComparison.change.dealsWon}
                    icon={TrendingUp}
                  />
                  <ComparisonCard
                    title="New Deals"
                    thisMonth={String(data.monthlyComparison.thisMonth.newDeals)}
                    lastMonth={String(data.monthlyComparison.lastMonth.newDeals)}
                    change={data.monthlyComparison.change.newDeals}
                    icon={Zap}
                  />
                  <ComparisonCard
                    title="Activities"
                    thisMonth={String(data.monthlyComparison.thisMonth.activities)}
                    lastMonth={String(data.monthlyComparison.lastMonth.activities)}
                    change={data.monthlyComparison.change.activities}
                    icon={Activity}
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* ===== PIPELINE ANALYSIS ===== */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline by Stage */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">Pipeline by Stage</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Deal value distribution across pipeline stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.pipelineMetrics.byStage} layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: '#6B7280' }}
                        axisLine={false} tickLine={false} width={90} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Pipeline Value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {data.pipelineMetrics.byStage.map((entry, index) => (
                          <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">Conversion Funnel</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Deal flow through pipeline stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.stageFunnel.map((stage, index) => {
                    const maxCount = Math.max(...data.stageFunnel.map((s) => s.count), 1)
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
                          <span className="font-medium text-gray-700">{stage.stage}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{stage.count}</span>
                            <span className="text-gray-400">{formatCurrency(stage.value)}</span>
                          </div>
                        </div>
                        <div className="relative h-8 bg-gray-50 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                            className="absolute inset-y-0 left-0 rounded-lg"
                            style={{ backgroundColor: color, opacity: 0.75 }}
                          />
                        </div>
                        {index > 0 && index < data.stageFunnel.length - 1 && (
                          <div className="text-[10px] text-gray-400 flex justify-end">
                            {(() => {
                              const prevCount = data.stageFunnel[index - 1]?.count || 1
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
              </CardContent>
            </Card>
          </motion.div>

          {/* ===== ACTIVITY & ENGAGEMENT ===== */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Trend */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">Activity Trend</CardTitle>
                <CardDescription className="text-xs text-gray-500">Weekly activity volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.activityMetrics.trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F3D840" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#F3D840" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Activities" fill="#F3D840" radius={[4, 4, 0, 0]} maxBarSize={24} opacity={0.7} />
                      <Line type="monotone" dataKey="count" name="Trend" stroke="#374151" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity by Type */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">Activity Breakdown</CardTitle>
                <CardDescription className="text-xs text-gray-500">Activities by type and user</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </motion.div>

          {/* ===== DEAL VELOCITY + PROPOSALS + MEETINGS ===== */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deal Velocity */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <CardTitle className="text-base font-bold text-gray-900">Deal Velocity</CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500">
                  Avg days in each stage · Bottleneck detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.dealVelocity.avgDaysPerStage).map(([stage, days], index) => {
                    const maxDays = Math.max(...Object.values(data.dealVelocity.avgDaysPerStage), 1)
                    const width = (days / maxDays) * 100
                    const isBottleneck = data.dealVelocity.bottlenecks.some((b) => b.stage === stage)

                    return (
                      <div key={stage} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            {isBottleneck && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                            <span className={`font-medium ${isBottleneck ? 'text-amber-700' : 'text-gray-700'}`}>
                              {stage}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">{days}d</span>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
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
                {data.dealVelocity.bottlenecks.length > 0 && (
                  <div className="mt-4 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Bottleneck Detected</p>
                    <p className="text-xs text-amber-600">
                      Deals are stalling at <strong>{data.dealVelocity.bottlenecks[0].stage}</strong> ({data.dealVelocity.bottlenecks[0].days} avg days). Consider expediting deals in this stage.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proposal Performance */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">Proposal Performance</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Pipeline funnel: sent → viewed → accepted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border-4 border-gray-100 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-4 border-gray-100 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#F3D840] flex items-center justify-center">
                          <span className="text-sm font-bold text-[#374151]">{data.proposalMetrics.acceptanceRate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-600 bg-white px-2">
                      {data.proposalMetrics.sent} sent
                    </div>
                    <div className="absolute top-2 -right-8 text-xs font-semibold text-gray-600 bg-white px-1">
                      {data.proposalMetrics.viewed} viewed
                    </div>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#F3D840]">
                      {data.proposalMetrics.accepted} won
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(data.proposalMetrics.avgValue)}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Value</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{data.proposalMetrics.acceptanceRate}%</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Accept Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Metrics */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">Meeting Metrics</CardTitle>
                <CardDescription className="text-xs text-gray-500">Completion rates by meeting type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="#F3D840" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${data.meetingMetrics.completionRate * 2.64} ${264 - data.meetingMetrics.completionRate * 2.64}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">{data.meetingMetrics.completionRate}%</span>
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
                          <span className="font-medium text-gray-700">{typeLabel}</span>
                          <span className="text-gray-400">
                            {metrics.completed}/{metrics.total} ({rate}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
              </CardContent>
            </Card>
          </motion.div>

          {/* ===== REVENUE BY SOURCE + TOP PERFORMERS ===== */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Source */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-gray-400" />
                  <CardTitle className="text-base font-bold text-gray-900">Revenue by Source</CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500">Won revenue by lead source</CardDescription>
              </CardHeader>
              <CardContent>
                {data.revenueBySource.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.revenueBySource}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {data.revenueBySource.map((_, index) => (
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
                            <span className="text-gray-600 capitalize">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                    No revenue data by source yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <CardTitle className="text-base font-bold text-gray-900">Top Performers</CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500">Team performance by revenue & deals won</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPerformers.map((performer, index) => {
                    const maxRevenue = Math.max(...data.topPerformers.map((p) => p.revenue), 1)
                    const barWidth = (performer.revenue / maxRevenue) * 100

                    return (
                      <motion.div
                        key={performer.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-bold text-gray-500 shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">{performer.name}</span>
                            <span className="text-sm font-bold text-[#F3D840] ml-2">{formatCurrency(performer.revenue)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
              </CardContent>
            </Card>
          </motion.div>

          {/* ===== KEY METRICS SUMMARY ===== */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="shadow-sm border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.pipelineMetrics.weightedPipeline)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Weighted Pipeline</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{data.pipelineMetrics.avgCycleDays}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Avg Deal Cycle (days)</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{data.meetingMetrics.total}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Total Meetings</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{data.proposalMetrics.accepted}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Proposals Accepted</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
