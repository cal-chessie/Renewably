'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  DollarSign,
  Handshake,
  UserPlus,
  TrendingUp,
  Sparkles,
  CheckSquare,
  Target,
  ArrowRight,
  Phone,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Users,
  Sun,
  Zap,
  MapPin,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/crm/StatCard'
import { ActivityIcon } from '@/components/crm/ActivityIcon'
import { PriorityBadge } from '@/components/crm/PriorityBadge'
import { format } from 'date-fns'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function timeAgo(date: string | Date) {
  const now = new Date()
  const d = new Date(date)
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return format(d, 'MMM d')
}

const DONUT_COLORS = ['#F3D840', '#374151', '#6B7280', '#9CA3AF']

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: () => fetch('/api/crm/dashboard').then((r) => r.json()),
    refetchInterval: 30000,
  })

  if (isLoading || !data || data.error) {
    return (
      <div style={{ padding: '24px 32px', backgroundColor: '#0A0A0A', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ height: 28, width: 200, borderRadius: 8, background: '#222222' }} />
              <div style={{ height: 16, width: 280, borderRadius: 6, background: '#1A1A1A', marginTop: 8 }} />
            </div>
            <div style={{ height: 16, width: 180, borderRadius: 6, background: '#1A1A1A' }} />
          </div>
          {/* KPI cards skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                height: 128,
                borderRadius: 12,
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
              }} />
            ))}
          </div>
          {/* Charts skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{
                height: 320,
                borderRadius: 12,
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
              }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const {
    kpis = {},
    tasksByStatus = {},
    dealsByStage = [],
    monthlyTrend = [],
    recentActivities = [],
    upcomingTasks = [],
    aiInsights = [],
    dealFunnel = [],
    activityByType = {},
    topContacts = [],
    overdueTasks = 0,
    avgDealCycleDays = 0,
    activitiesThisWeek = 0,
    installers = {},
  } = data || {}

  const safeTasks = tasksByStatus || {}
  const pipelineTrend = kpis.wonValueThisMonth > 0 ? Math.round(((kpis.wonValueThisMonth - (kpis.lostValueThisMonth || 0)) / Math.max(kpis.wonValueThisMonth, 1)) * 100) : 0
  const maxFunnelValue = dealFunnel.length > 0 ? Math.max(...dealFunnel.map((f: { value: number }) => f.value), 1) : 1

  const pieData = [
    { name: 'Calls', value: activityByType.call || 0 },
    { name: 'Emails', value: activityByType.email || 0 },
    { name: 'Meetings', value: activityByType.meeting || 0 },
    { name: 'Notes', value: activityByType.note || 0 },
  ].filter((d) => d.value > 0)

  const taskPieData = [
    { name: 'To Do', value: safeTasks.todo || 0 },
    { name: 'In Progress', value: safeTasks.in_progress || 0 },
    { name: 'Completed', value: safeTasks.completed || 0 },
    { name: 'Cancelled', value: safeTasks.cancelled || 0 },
  ].filter((d) => d.value > 0)

  return (
    <motion.div
      className="p-6 lg:p-8 space-y-6"
      style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#A0A0A0' }}>
            {(() => {
              const hour = new Date().getHours()
              if (hour < 12) return 'Good morning — here\'s your solar business overview.'
              if (hour < 17) return 'Good afternoon — here\'s your solar business overview.'
              return 'Good evening — here\'s your solar business overview.'
            })()}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px',
          borderRadius: 8,
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          fontSize: 13,
          color: '#A0A0A0',
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10B981',
            display: 'inline-block',
          }} />
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </motion.div>

      {/* Row 1: Solar Installer KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Installers"
          value={installers.total || 0}
          subtitle={`${installers.newThisMonth || 0} new this month`}
          icon={Sun}
          trend={{ value: installers.total > 0 ? 12 : 0, positive: true }}
          delay={0}
        />
        <StatCard
          title="Monthly Recurring"
          value={formatCurrency(installers.mrr || 0)}
          subtitle={`${installers.onboardingRate || 0}% onboarding complete`}
          icon={Zap}
          delay={0.1}
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(kpis.totalPipelineValue || 0)}
          subtitle={`${kpis.activeDeals || 0} active deals`}
          icon={DollarSign}
          trend={{ value: pipelineTrend, positive: pipelineTrend >= 0 }}
          delay={0.2}
        />
        <StatCard
          title="Win Rate"
          value={`${kpis.conversionRate || 0}%`}
          subtitle={`${kpis.wonDealsThisMonth || 0} won this month`}
          icon={TrendingUp}
          delay={0.3}
        />
      </div>

      {/* Row 2: Pipeline Funnel + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: '#FFFFFF' }}>Pipeline Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dealFunnel.length > 0 ? (
                dealFunnel.map((stage: { stage: string; count: number; value: number }, i: number) => {
                  const width = Math.max(30, (stage.value / maxFunnelValue) * 100)
                  return (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium" style={{ color: '#A0A0A0' }}>{stage.stage}</span>
                        <span className="text-xs" style={{ color: '#666666' }}>
                          {stage.count} deals · {formatCurrency(stage.value)}
                        </span>
                      </div>
                      <div className="h-8 rounded-lg overflow-hidden" style={{ backgroundColor: '#222222' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.6, delay: 0.5 + i * 0.08, ease: 'easeOut' as const }}
                          className="h-full rounded-lg"
                          style={{
                            backgroundColor: `hsl(48, ${95 - i * 10}%, ${55 - i * 5}%)`,
                          }}
                        />
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#666666' }}>
                  No pipeline data
                </div>
              )}
              {overdueTasks > 0 && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#F87171' }}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span><strong>{overdueTasks}</strong> overdue task{overdueTasks !== 1 ? 's' : ''} need attention</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Area Chart */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: '#FFFFFF' }}>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F3D840" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F3D840" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => format(new Date(v + '-01'), 'MMM')}
                    />
                    <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy')}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #2A2A2A',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        backgroundColor: '#1A1A1A',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#374151"
                      strokeWidth={2}
                      fill="url(#yellowGradient)"
                      dot={{ fill: '#374151', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: '#F3D840', stroke: '#374151', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 3: AI Insights + Activity Breakdown + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm border-l-4 border-l-[#F3D840]" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderLeft: '4px solid #F3D840' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[#F3D840]/15 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-[#C79828]" />
                </div>
                <CardTitle className="text-base font-semibold" style={{ color: '#FFFFFF' }}>AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.length > 0 ? (
                aiInsights.slice(0, 4).map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Target className="h-3.5 w-3.5 text-[#F3D840] shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>{insight}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: '#666666' }}>Generating insights...</p>
              )}
              {avgDealCycleDays > 0 && (
                <div className="pt-2 text-xs" style={{ borderBottom: '1px solid #2A2A2A', color: '#666666' }}>
                  Avg. deal cycle: <strong style={{ color: '#A0A0A0' }}>{avgDealCycleDays} days</strong>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Breakdown */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold" style={{ color: '#FFFFFF' }}>Activity Breakdown</CardTitle>
                <span className="text-xs bg-[#F3D840]/10 text-[#C79828] px-2 py-0.5 rounded-full font-medium">
                  {activitiesThisWeek} this week
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-36 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center text-sm" style={{ color: '#666666' }}>
                  No activity data
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span style={{ color: '#666666' }}>{item.name}</span>
                    <span className="font-semibold ml-auto" style={{ color: '#A0A0A0' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: '#FFFFFF' }}>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/crm/installers"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent hover:border-[#F3D840]/30 transition-all group" style={{ backgroundColor: '#141414' }}
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F3D840]/15 flex items-center justify-center group-hover:bg-[#F3D840]/25 transition-colors">
                    <Sun className="h-5 w-5 text-[#C79828]" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#A0A0A0' }}>Installers</span>
                </Link>
                <Link
                  href="/crm/pipeline"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent hover:border-[#F3D840]/30 transition-all group" style={{ backgroundColor: '#141414' }}
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F3D840]/15 flex items-center justify-center group-hover:bg-[#F3D840]/25 transition-colors">
                    <Handshake className="h-5 w-5 text-[#C79828]" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#A0A0A0' }}>New Deal</span>
                </Link>
                <Link
                  href="/crm/activities"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent hover:border-[#F3D840]/30 transition-all group" style={{ backgroundColor: '#141414' }}
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F3D840]/15 flex items-center justify-center group-hover:bg-[#F3D840]/25 transition-colors">
                    <Phone className="h-5 w-5 text-[#C79828]" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#A0A0A0' }}>Log Call</span>
                </Link>
                <Link
                  href="/crm/contacts"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent hover:border-[#F3D840]/30 transition-all group" style={{ backgroundColor: '#141414' }}
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F3D840]/15 flex items-center justify-center group-hover:bg-[#F3D840]/25 transition-colors">
                    <UserPlus className="h-5 w-5 text-[#C79828]" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#A0A0A0' }}>Add Contact</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 4: Top Contacts + Tasks + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Contacts */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold" style={{ color: '#FFFFFF' }}>Top Contacts</CardTitle>
                <Link href="/crm/contacts" className="text-xs hover:text-[#C79828] flex items-center gap-1 transition-colors" style={{ color: '#666666' }}>
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {topContacts.length > 0 ? (
                  topContacts.slice(0, 5).map((tc: { contact: { id: string; firstName: string; lastName: string; email?: string }; totalDealValue: number; dealCount: number }, i: number) => (
                    <Link
                      key={tc.contact.id}
                      href={`/crm/contacts/${tc.contact.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-[#F3D840]/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#374151]">
                          {tc.contact.firstName[0]}{tc.contact.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#FFFFFF' }}>
                          {tc.contact.firstName} {tc.contact.lastName}
                        </p>
                        <p className="text-xs" style={{ color: '#666666' }}>{tc.dealCount} deals</p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#A0A0A0' }}>
                        {formatCurrency(tc.totalDealValue)}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: '#666666' }}>No contact data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Overview */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold" style={{ color: '#FFFFFF' }}>Tasks</CardTitle>
                <Link href="/crm/tasks" className="text-xs hover:text-[#C79828] flex items-center gap-1 transition-colors" style={{ color: '#666666' }}>
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {taskPieData.length > 0 ? (
                <div className="h-28 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={42}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {taskPieData.map((_, index) => (
                          <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center text-sm" style={{ color: '#666666' }}>
                  No tasks
                </div>
              )}
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                {upcomingTasks.slice(0, 4).map((task: Record<string, unknown>) => (
                  <div key={task.id as string} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#FFFFFF' }}>{task.title as string}</p>
                    </div>
                    <PriorityBadge priority={task.priority as string} />
                    {task.dueDate ? (
                      <span className="text-xs flex items-center gap-1" style={{ color: '#666666' }}>
                        <Clock className="h-3 w-3" />
                        {format(new Date(String(task.dueDate)), 'MMM d')}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold" style={{ color: '#FFFFFF' }}>Recent Activity</CardTitle>
                <Link href="/crm/activities" className="text-xs hover:text-[#C79828] flex items-center gap-1 transition-colors" style={{ color: '#666666' }}>
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {recentActivities.slice(0, 6).map((activity: Record<string, unknown>) => (
                  <div key={activity.id as string} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <ActivityIcon type={activity.type as string} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#FFFFFF' }}>{activity.subject as string}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs" style={{ color: '#666666' }}>
                          {activity.contact
                            ? `${(activity.contact as Record<string, string>).firstName} ${(activity.contact as Record<string, string>).lastName}`
                            : 'System'}
                        </span>
                        <span style={{ color: '#444444' }}>·</span>
                        <span className="text-xs" style={{ color: '#666666' }}>{timeAgo(activity.createdAt as string)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
