'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Zap, TrendingUp, Clock, Euro, Star, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { PerformanceData } from '../types'

interface PerformanceChartsProps {
  installerId: string
}

export function PerformanceCharts({ installerId }: PerformanceChartsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['installer-performance', installerId],
    queryFn: () => fetch(`/api/crm/installers/${installerId}/performance`).then(r => r.json()),
    enabled: !!installerId,
  })

  const perf: PerformanceData | null = data?.performance || null

  if (isLoading || !perf) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: 20 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse" style={{ height: 80, backgroundColor: '#1A1A1A', borderRadius: 12 }} />
        ))}
      </div>
    )
  }

  const metrics = [
    { label: 'Total Installs', value: perf.totalInstalls, icon: Zap, colour: '#F3D840' },
    { label: 'Lead Conversion', value: `${perf.leadConversionRate}%`, icon: TrendingUp, colour: '#10B981' },
    { label: 'Avg Response', value: `${perf.avgResponseTime}h`, icon: Clock, colour: '#60A5FA' },
    { label: 'Revenue', value: formatCurrency(perf.revenueGenerated), icon: Euro, colour: '#A855F7' },
    { label: 'Satisfaction', value: `${perf.satisfactionScore}/100`, icon: Star, colour: '#F59E0B' },
    { label: 'MRR', value: formatCurrency(perf.mrr), icon: BarChart3, colour: '#34D399' },
  ]

  const installTrendChange = perf.installsLastMonth > 0
    ? Math.round(((perf.installsThisMonth - perf.installsLastMonth) / perf.installsLastMonth) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Key metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {metrics.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: '16px',
                borderRadius: 12,
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{m.label}</span>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: m.colour + '18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon style={{ width: 14, height: 14, color: m.colour }} />
                </div>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF' }}>{m.value}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Installs trend change */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        borderRadius: 10,
        backgroundColor: installTrendChange >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${installTrendChange >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Installs this month: <strong style={{ color: '#FFFFFF' }}>{perf.installsThisMonth}</strong></span>
        <span style={{ fontSize: 11, color: '#6B7280' }}>vs {perf.installsLastMonth} last month</span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: installTrendChange >= 0 ? '#4ADE80' : '#F87171',
          marginLeft: 'auto',
        }}>
          {installTrendChange >= 0 ? '+' : ''}{installTrendChange}%
        </span>
      </div>

      {/* Install trend chart */}
      <div>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 16 }}>Monthly Installs</h4>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={perf.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={{ stroke: '#2A2A2A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={{ stroke: '#2A2A2A' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#D1D5DB',
                }}
              />
              <Line type="monotone" dataKey="installs" stroke="#F3D840" strokeWidth={2} dot={{ fill: '#F3D840', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lead funnel */}
      <div>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 16 }}>Lead Funnel</h4>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perf.leadFunnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={{ stroke: '#2A2A2A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={{ stroke: '#2A2A2A' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#D1D5DB',
                }}
              />
              <Bar dataKey="count" fill="rgba(243,216,64,0.6)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 16 }}>Revenue Breakdown</h4>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={perf.revenueBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={{ stroke: '#2A2A2A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={{ stroke: '#2A2A2A' }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#D1D5DB',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="revenue" stroke="#A855F7" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
