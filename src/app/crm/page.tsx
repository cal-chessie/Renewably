'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Handshake,
  UserPlus,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  FileText,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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

const PIE_COLORS = ['#F3D840', '#374151', '#1F2937', '#4B5563']

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: () => fetch('/api/crm/dashboard').then((r) => r.json()),
    refetchInterval: 30000,
  })

  // Show loading when fetching or when data contains an error
  if (isLoading || !data || data.error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const { kpis = {}, tasksByStatus = {}, dealsByStage = [], monthlyTrend = [], recentActivities = [], upcomingTasks = [] } = data || {}

  const safeTasks = tasksByStatus || {}
  const pieData = [
    { name: 'To Do', value: safeTasks.todo || 0 },
    { name: 'In Progress', value: safeTasks.in_progress || 0 },
    { name: 'Completed', value: safeTasks.completed || 0 },
    { name: 'Cancelled', value: safeTasks.cancelled || 0 },
  ].filter((d) => d.value > 0)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>
        <div className="text-sm text-gray-400">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(kpis.totalPipelineValue)}
          subtitle={`${kpis.activeDeals} active deals`}
          icon={DollarSign}
          delay={0}
        />
        <StatCard
          title="Active Deals"
          value={kpis.activeDeals}
          subtitle={`Total: ${kpis.totalDeals} deals`}
          icon={Handshake}
          delay={0.1}
        />
        <StatCard
          title="New Contacts"
          value={kpis.newContactsThisMonth}
          subtitle={`${kpis.totalContacts} total contacts`}
          icon={UserPlus}
          delay={0.2}
        />
        <StatCard
          title="Win Rate"
          value={`${kpis.conversionRate}%`}
          subtitle={`${kpis.wonDealsThisMonth} won this month`}
          icon={TrendingUp}
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Value by Stage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Pipeline by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dealsByStage}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="stage" width={90} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Value']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {dealsByStage.map((entry: { color: string }, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Monthly Revenue (Won Deals)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => {
                        const d = new Date(v + '-01')
                        return format(d, 'MMM')
                      }}
                    />
                    <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => {
                        const d = new Date(label + '-01')
                        return format(d, 'MMMM yyyy')
                      }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#374151"
                      strokeWidth={3}
                      dot={{ fill: '#374151', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#F3D840', stroke: '#374151', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Tasks Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-gray-500">{item.name}</span>
                    <span className="font-semibold text-gray-700 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivities.slice(0, 7).map((activity: Record<string, unknown>) => (
                  <div
                    key={activity.id as string}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ActivityIcon type={activity.type as string} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.subject as string}
                      </p>
                      <p className="text-xs text-gray-400">
                        {activity.contact
                          ? `${(activity.contact as Record<string, string>).firstName} ${(activity.contact as Record<string, string>).lastName}`
                          : 'No contact'}
                        {' · '}
                        {timeAgo(activity.createdAt as string)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {upcomingTasks.slice(0, 7).map((task: Record<string, unknown>) => (
                  <div
                    key={task.id as string}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title as string}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <PriorityBadge priority={task.priority as string} />
                        {task.dueDate && (
                          <span className="text-xs text-gray-400">
                            {format(new Date(task.dueDate as string), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingTasks.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No upcoming tasks</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
