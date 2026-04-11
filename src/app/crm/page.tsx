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
      <div className="p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-40 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
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
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>
        <div className="text-sm text-gray-400 hidden sm:block">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </motion.div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(kpis.totalPipelineValue || 0)}
          subtitle={`${kpis.activeDeals || 0} active deals`}
          icon={DollarSign}
          trend={{ value: pipelineTrend, positive: pipelineTrend >= 0 }}
          delay={0}
        />
        <StatCard
          title="Active Deals"
          value={kpis.activeDeals || 0}
          subtitle={`Total: ${kpis.totalDeals || 0} deals`}
          icon={Handshake}
          delay={0.1}
        />
        <StatCard
          title="New Contacts"
          value={kpis.newContactsThisMonth || 0}
          subtitle={`${kpis.totalContacts || 0} total contacts`}
          icon={UserPlus}
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Pipeline Funnel</CardTitle>
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
                        <span className="text-gray-700 font-medium">{stage.stage}</span>
                        <span className="text-gray-400 text-xs">
                          {stage.count} deals · {formatCurrency(stage.value)}
                        </span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
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
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  No pipeline data
                </div>
              )}
              {overdueTasks > 0 && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded-lg text-red-600 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span><strong>{overdueTasks}</strong> overdue task{overdueTasks !== 1 ? 's' : ''} need attention</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Area Chart */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Monthly Revenue</CardTitle>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
          <Card className="border-0 shadow-sm border-l-4 border-l-[#F3D840]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[#F3D840]/15 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-[#C79828]" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.length > 0 ? (
                aiInsights.slice(0, 4).map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Target className="h-3.5 w-3.5 text-[#F3D840] shrink-0 mt-0.5" />
                    <p className="text-gray-600 leading-relaxed">{insight}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">Generating insights...</p>
              )}
              {avgDealCycleDays > 0 && (
                <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
                  Avg. deal cycle: <strong className="text-gray-600">{avgDealCycleDays} days</strong>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Breakdown */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Activity Breakdown</CardTitle>
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
                <div className="h-36 flex items-center justify-center text-sm text-gray-400">
                  No activity data
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-gray-500">{item.name}</span>
                    <span className="font-semibold text-gray-700 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/crm/pipeline"
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-[#F3D840]/10 hover:border-[#F3D840]/30 border border-transparent transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F3D840]/15 flex items-center justify-center group-hover:bg-[#F3D840]/25 transition-colors">
                    <Handshake className="h-5 w-5 text-[#C79828]" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">New Deal</span>
                </Link>
                <Link
                  href="/crm/activities"
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-[#F3D840]/10 hover:border-[#F3D840]/30 border border-transparent transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F3D840]/15 flex items-center justify-center group-hover:bg-[#F3D840]/25 transition-colors">
                    <Phone className="h-5 w-5 text-[#C79828]" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Log Call</span>
                </Link>
                <Link
                  href="/crm/contacts"
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-[#F3D840]/10 hover:border-[#F3D840]/30 border border-transparent transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F3D840]/15 flex items-center justify-center group-hover:bg-[#F3D840]/25 transition-colors">
                    <UserPlus className="h-5 w-5 text-[#C79828]" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Add Contact</span>
                </Link>
                <Link
                  href="/crm/tasks"
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-[#F3D840]/10 hover:border-[#F3D840]/30 border border-transparent transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F3D840]/15 flex items-center justify-center group-hover:bg-[#F3D840]/25 transition-colors">
                    <CheckSquare className="h-5 w-5 text-[#C79828]" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Create Task</span>
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Top Contacts</CardTitle>
                <Link href="/crm/contacts" className="text-xs text-gray-400 hover:text-[#C79828] flex items-center gap-1 transition-colors">
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
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-[#F3D840]/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#374151]">
                          {tc.contact.firstName[0]}{tc.contact.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tc.contact.firstName} {tc.contact.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{tc.dealCount} deals</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(tc.totalDealValue)}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No contact data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Overview */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Tasks</CardTitle>
                <Link href="/crm/tasks" className="text-xs text-gray-400 hover:text-[#C79828] flex items-center gap-1 transition-colors">
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
                <div className="h-28 flex items-center justify-center text-sm text-gray-400">
                  No tasks
                </div>
              )}
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                {upcomingTasks.slice(0, 4).map((task: Record<string, unknown>) => (
                  <div key={task.id as string} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title as string}</p>
                    </div>
                    <PriorityBadge priority={task.priority as string} />
                    {task.dueDate ? (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
                <Link href="/crm/activities" className="text-xs text-gray-400 hover:text-[#C79828] flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {recentActivities.slice(0, 6).map((activity: Record<string, unknown>) => (
                  <div key={activity.id as string} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <ActivityIcon type={activity.type as string} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.subject as string}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {activity.contact
                            ? `${(activity.contact as Record<string, string>).firstName} ${(activity.contact as Record<string, string>).lastName}`
                            : 'System'}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">{timeAgo(activity.createdAt as string)}</span>
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
