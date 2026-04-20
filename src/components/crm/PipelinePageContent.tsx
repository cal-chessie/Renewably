'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, GripVertical, X, Pencil, Trash2, CheckSquare, FileText,
  Phone, Mail, Calendar, Clock, User, Building2,
  DollarSign, TrendingUp, ArrowUpDown, Search, LayoutGrid, List,
  ChevronDown, ChevronRight, ArrowUp, ArrowDown, Eye,
  MessageSquare, Target, BarChart3, Zap, Sparkles,
  Filter, Download, RotateCcw, Timer, Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { format, differenceInDays } from 'date-fns'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS & DESIGN SYSTEM
// ════════════════════════════════════════════════════════════════════════════

const C = {
  dark: '#0A0A0A',
  surface: '#1A1A1A',
  deeper: '#141414',
  border: '#2A2A2A',
  borderHover: '#3A3A3A',
  yellow: '#F3D840',
  yellowHover: '#E5C832',
  muted: '#A0A0A0',
  faint: '#666666',
  white: '#FFFFFF',
  green: '#34D399',
  red: '#F87171',
  orange: '#FB923C',
  purple: '#A78BFA',
  pink: '#F472B6',
  teal: '#2DD4BF',
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Deal {
  id: string
  title: string
  value: number
  currency: string
  probability: number
  closeDate: string | null
  description: string | null
  createdAt: string
  contact?: { id: string; firstName: string; lastName: string; email: string | null; company?: { id: string; name: string } | null } | null
  assignee?: { id: string; name: string; avatar: string | null } | null
  stageId: string
  stage?: { id: string; name: string; color: string; order: number }
  company?: { id: string; name: string } | null
  tags?: Array<{ tag: { id: string; name: string; color: string } }>
  lostReason?: string | null
}

interface DealDetail extends Deal {
  creator?: { id: string; name: string } | null
  activities: Array<{
    id: string; type: string; subject: string; description: string | null
    duration: number | null; status: string | null; createdAt: string
    user: { id: string; name: string; avatar: string | null } | null
  }>
  notes: Array<{
    id: string; content: string; createdAt: string
    user: { id: string; name: string; avatar: string | null } | null
  }>
  tasks: Array<{
    id: string; title: string; priority: string; status: string; dueDate: string | null
    assignee: { id: string; name: string; avatar: string | null } | null
  }>
  tags: Array<{ tag: { id: string; name: string; color: string } }>
  proposals?: Array<{
    id: string; title: string; status: string; totalAmount: number; sentAt: string | null
  }>
}

interface Stage {
  id: string
  name: string
  order: number
  color: string
  deals: Deal[]
}

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string | null
}

type SortOption = 'value-desc' | 'value-asc' | 'probability' | 'closeDate' | 'created' | 'name'
type ViewMode = 'kanban' | 'table'
type DetailTab = 'overview' | 'activity' | 'tasks' | 'proposals'
type WizardStep = 1 | 2 | 3

interface FilterState {
  stageIds: string[]
  assigneeIds: string[]
  minValue: number
  maxValue: number
  dateField: 'created' | 'closing' | 'all'
  dateFrom: string
  dateTo: string
  companyQuery: string
}

// ════════════════════════════════════════════════════════════════════════════
// HOOKS & HELPERS
// ════════════════════════════════════════════════════════════════════════════

function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const ref = useRef<number | null>(null)
  const startRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = value
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(startRef.current + (target - startRef.current) * eased)
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate)
      }
    }
    if (ref.current) cancelAnimationFrame(ref.current)
    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [target, duration])

  return value
}

function daysUntilClose(closeDate: string | null): number | null {
  if (!closeDate) return null
  return differenceInDays(new Date(closeDate), new Date())
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function fmtValue(v: number): string {
  if (v >= 1000000) return `€${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}K`
  return `€${v.toFixed(0)}`
}

function sortDeals(deals: Deal[], sortBy: SortOption): Deal[] {
  const sorted = [...deals]
  switch (sortBy) {
    case 'value-desc': return sorted.sort((a, b) => b.value - a.value)
    case 'value-asc': return sorted.sort((a, b) => a.value - b.value)
    case 'probability': return sorted.sort((a, b) => b.probability - a.probability)
    case 'closeDate': return sorted.sort((a, b) => {
      if (!a.closeDate) return 1
      if (!b.closeDate) return -1
      return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime()
    })
    case 'created': return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'name': return sorted.sort((a, b) => a.title.localeCompare(b.title))
    default: return sorted
  }
}

function applyFilters(deals: Deal[], search: string, filters: FilterState): Deal[] {
  let result = deals
  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.contact?.firstName.toLowerCase().includes(q) ||
      d.contact?.lastName.toLowerCase().includes(q) ||
      d.contact?.company?.name.toLowerCase().includes(q)
    )
  }
  if (filters.stageIds.length > 0) {
    result = result.filter(d => filters.stageIds.includes(d.stageId))
  }
  if (filters.assigneeIds.length > 0) {
    result = result.filter(d => d.assignee && filters.assigneeIds.includes(d.assignee.id))
  }
  if (filters.minValue > 0) {
    result = result.filter(d => d.value >= filters.minValue)
  }
  if (filters.maxValue > 0) {
    result = result.filter(d => d.value <= filters.maxValue)
  }
  if (filters.companyQuery.trim()) {
    const cq = filters.companyQuery.toLowerCase()
    result = result.filter(d => d.contact?.company?.name.toLowerCase().includes(cq))
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom)
    result = result.filter(d => {
      const dateStr = filters.dateField === 'closing' ? d.closeDate : d.createdAt
      if (!dateStr) return false
      return new Date(dateStr) >= from
    })
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo)
    to.setHours(23, 59, 59, 999)
    result = result.filter(d => {
      const dateStr = filters.dateField === 'closing' ? d.closeDate : d.createdAt
      if (!dateStr) return false
      return new Date(dateStr) <= to
    })
  }
  return result
}

const defaultFilters: FilterState = {
  stageIds: [], assigneeIds: [], minValue: 0, maxValue: 0,
  dateField: 'all', dateFrom: '', dateTo: '', companyQuery: '',
}

// ════════════════════════════════════════════════════════════════════════════
// SPARKLINE SVG COMPONENT
// ════════════════════════════════════════════════════════════════════════════

function Sparkline({ data, colour, width = 60, height = 24 }: {
  data: number[]; colour: string; width?: number; height?: number
}) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const padding = 2
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')
  const areaPoints = `${padding},${height} ${points} ${width - padding},${height}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polygon points={areaPoints} fill={colour} opacity="0.1" />
      <polyline points={points} stroke={colour} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER COMPONENT
// ════════════════════════════════════════════════════════════════════════════

function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const animated = useAnimatedNumber(value)
  return <span>{prefix}{animated.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{suffix}</span>
}

// ════════════════════════════════════════════════════════════════════════════
// STATS DASHBOARD (6 KPI Cards)
// ════════════════════════════════════════════════════════════════════════════

function StatsDashboard({ stages }: { stages: Stage[] }) {
  const allDeals = useMemo(() => stages.flatMap(s => s.deals), [stages])
  const totalValue = useMemo(() => allDeals.reduce((sum, d) => sum + d.value, 0), [allDeals])
  const weightedValue = useMemo(() => allDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0), [allDeals])
  const dealCount = allDeals.length
  const avgDealSize = dealCount > 0 ? totalValue / dealCount : 0

  const wonStage = stages.find(s => s.name.toLowerCase().includes('won') || s.name.toLowerCase().includes('closed won'))
  const lostStage = stages.find(s => s.name.toLowerCase().includes('lost') || s.name.toLowerCase().includes('closed lost'))
  const wonCount = wonStage ? wonStage.deals.length : 0
  const lostCount = lostStage ? lostStage.deals.length : 0
  const completedDeals = wonCount + lostCount
  const winRate = completedDeals > 0 ? Math.round((wonCount / completedDeals) * 100) : 0

  const dealsWithClose = allDeals.filter(d => d.closeDate)
  const avgDaysToClose = dealsWithClose.length > 0
    ? Math.round(dealsWithClose.reduce((sum, d) => sum + Math.abs(differenceInDays(new Date(d.closeDate!), new Date(d.createdAt))), 0) / dealsWithClose.length)
    : 0

  const kpis = [
    {
      label: 'Total Pipeline Value', value: totalValue, formatted: formatCurrency(totalValue),
      icon: DollarSign, colour: C.yellow, bg: 'rgba(243,216,64,0.1)', trend: 12.5,
      sparkData: [40, 55, 45, 70, 65, 80, 95],
    },
    {
      label: 'Weighted Value', value: weightedValue, formatted: formatCurrency(weightedValue),
      icon: TrendingUp, colour: C.green, bg: 'rgba(52,211,153,0.1)', trend: 8.3,
      sparkData: [20, 30, 28, 42, 38, 50, 55],
    },
    {
      label: 'Active Deals', value: dealCount, formatted: String(dealCount),
      icon: Target, colour: C.purple, bg: 'rgba(167,139,250,0.1)', trend: -2.1, isInt: true,
      sparkData: [8, 10, 9, 12, 11, 10, 12],
    },
    {
      label: 'Avg Deal Size', value: avgDealSize, formatted: formatCurrency(avgDealSize),
      icon: BarChart3, colour: C.pink, bg: 'rgba(244,114,182,0.1)', trend: 5.7,
      sparkData: [5, 6, 5.5, 7, 6.5, 8, 8.5],
    },
    {
      label: 'Win Rate', value: winRate, formatted: `${winRate}%`,
      icon: Zap, colour: C.orange, bg: 'rgba(251,146,60,0.1)', trend: 3.2, isInt: true,
      sparkData: [30, 35, 38, 42, 40, 45, 48],
    },
    {
      label: 'Avg Days to Close', value: avgDaysToClose, formatted: `${avgDaysToClose}d`,
      icon: Timer, colour: C.teal, bg: 'rgba(45,212,191,0.1)', trend: -4.5, isInt: true,
      sparkData: [35, 32, 30, 28, 25, 22, 20],
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon
        const isUp = kpi.trend > 0
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ y: -2, boxShadow: `0 8px 30px rgba(0,0,0,0.3)` }}
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '14px',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'default',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
          >
            <div style={{
              position: 'absolute', top: '0', right: '0', width: '80px', height: '80px',
              background: `radial-gradient(circle at top right, ${kpi.bg}, transparent)`,
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} style={{ color: kpi.colour }} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                fontSize: '11px', fontWeight: 600, color: isUp ? C.green : C.red,
              }}>
                {isUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                {Math.abs(kpi.trend)}%
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: C.white, lineHeight: 1.2, marginBottom: '2px' }}>
              {kpi.isInt ? kpi.formatted : <AnimatedCounter value={kpi.value} prefix="€" />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: C.muted, fontWeight: 500 }}>{kpi.label}</span>
              <Sparkline data={kpi.sparkData} colour={kpi.colour} />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FORECAST BAR
// ════════════════════════════════════════════════════════════════════════════

function ForecastBar({ stages }: { stages: Stage[] }) {
  const stageValues = useMemo(() =>
    stages.map(s => ({ ...s, totalValue: s.deals.reduce((sum, d) => sum + d.value, 0) })),
    [stages]
  )
  const totalValue = useMemo(() => stageValues.reduce((sum, s) => sum + s.totalValue, 0), [stageValues])

  if (totalValue === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        padding: '14px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={15} style={{ color: C.yellow }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: C.white }}>Pipeline Forecast</span>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: C.muted }}>
          Total: {formatCurrency(totalValue)}
        </span>
      </div>
      <div style={{
        display: 'flex', height: '24px', borderRadius: '8px', overflow: 'hidden', gap: '3px',
        backgroundColor: C.deeper,
      }}>
        {stageValues.map((s, i) => {
          const pct = totalValue > 0 ? (s.totalValue / totalValue) * 100 : 0
          if (pct < 0.5) return null
          return (
            <motion.div
              key={s.id}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
              title={`${s.name}: ${formatCurrency(s.totalValue)} (${pct.toFixed(1)}%)`}
              style={{
                height: '100%',
                backgroundColor: s.color || C.yellow,
                borderRadius: '6px',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: pct > 10 ? 'center' : undefined,
                paddingLeft: pct > 10 ? '8px' : undefined,
                paddingRight: pct > 10 ? '8px' : undefined,
                overflow: 'hidden',
              }}
            >
              {pct > 10 && (
                <span style={{
                  fontSize: '10px', fontWeight: 600, color: C.dark,
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden',
                }}>
                  {s.name}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '8px' }}>
        {stageValues.filter(s => s.totalValue > 0).map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: s.color || C.yellow }} />
            <span style={{ fontSize: '11px', color: C.muted }}>{s.name}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.faint }}>{fmtValue(s.totalValue)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DEAL CARD (Kanban)
// ════════════════════════════════════════════════════════════════════════════

function DealCard({ deal, isDragging, onClick, dragHandleProps }: {
  deal: Deal; isDragging?: boolean; onClick?: () => void; dragHandleProps?: Record<string, unknown>
}) {
  const days = daysUntilClose(deal.closeDate)
  const isOverdue = days !== null && days < 0
  const isUrgent = days !== null && days >= 0 && days <= 3

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.85 : 1, scale: isDragging ? 1.02 : 1, rotate: isDragging ? 2 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        backgroundColor: C.deeper,
        border: `1px solid ${isDragging ? C.yellow : C.border}`,
        borderRadius: '12px',
        padding: '14px',
        cursor: onClick ? 'pointer' : 'default',
        opacity: isDragging ? 0.9 : 1,
        boxShadow: isDragging ? `0 16px 48px rgba(243,216,64,0.18)` : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = C.borderHover
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = C.border
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
        <div {...dragHandleProps} style={{ cursor: 'grab', paddingTop: '2px', flexShrink: 0 }}>
          <GripVertical size={14} style={{ color: C.faint }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: C.white,
            lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {deal.title}
          </div>
        </div>
        {deal.tags && deal.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
            {deal.tags.slice(0, 2).map(t => (
              <div key={t.tag.id} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                backgroundColor: t.tag.color || C.yellow,
              }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, color: C.white }}>
          {formatCurrency(deal.value)}
        </span>
        <div style={{
          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
          backgroundColor: deal.probability >= 70 ? 'rgba(52,211,153,0.15)' : deal.probability >= 40 ? 'rgba(243,216,64,0.15)' : 'rgba(248,113,113,0.15)',
          color: deal.probability >= 70 ? C.green : deal.probability >= 40 ? C.yellow : C.red,
        }}>
          {deal.probability}%
        </div>
      </div>

      {deal.contact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            backgroundColor: 'rgba(243,216,64,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: C.yellow }}>
              {getInitials(`${deal.contact.firstName} ${deal.contact.lastName}`)}
            </span>
          </div>
          <a href={`/crm/contacts/${deal.contact.id}`} onClick={e => e.stopPropagation()} style={{ fontSize: '12px', color: C.yellow, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hover:underline">
            {deal.contact.firstName} {deal.contact.lastName}
          </a>
        </div>
      )}

      {deal.assignee && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%',
            backgroundColor: 'rgba(167,139,250,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '7px', fontWeight: 700, color: C.purple }}>
              {getInitials(deal.assignee.name)}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: C.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deal.assignee.name}
          </span>
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: '8px', borderTop: `1px solid ${C.border}`,
      }}>
        {deal.tags && deal.tags.length > 0 ? (
          <div style={{ display: 'flex', gap: '4px', overflow: 'hidden' }}>
            {deal.tags.slice(0, 1).map(t => (
              <span key={t.tag.id} style={{
                fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '4px',
                backgroundColor: `${t.tag.color}20`, color: t.tag.color,
                maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {t.tag.name}
              </span>
            ))}
            {deal.tags.length > 1 && (
              <span style={{ fontSize: '9px', fontWeight: 600, color: C.faint }}>+{deal.tags.length - 1}</span>
            )}
          </div>
        ) : <div />}
        {days !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', fontWeight: 500,
            color: isOverdue ? C.red : isUrgent ? C.orange : C.faint,
          }}>
            <Clock size={11} />
            {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SORTABLE DEAL CARD
// ════════════════════════════════════════════════════════════════════════════

function SortableDealCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DealCard deal={deal} isDragging={isDragging} onClick={onClick} dragHandleProps={listeners} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// KANBAN COLUMN
// ════════════════════════════════════════════════════════════════════════════

function KanbanColumn({ stage, onDealClick, isCollapsed, onToggleCollapse }: {
  stage: Stage; onDealClick: (deal: Deal) => void; isCollapsed: boolean; onToggleCollapse: () => void
}) {
  const totalValue = useMemo(() => stage.deals.reduce((s, d) => s + d.value, 0), [stage.deals])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, width: isCollapsed ? '52px' : '310px' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        minWidth: isCollapsed ? '52px' : '290px',
        maxWidth: isCollapsed ? '52px' : '330px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '14px',
        overflow: 'hidden',
        height: 'calc(100vh - 340px)',
        minHeight: '300px',
      }}
    >
      <div style={{
        padding: '12px 12px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}>
        <button onClick={onToggleCollapse} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted,
        }}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        {!isCollapsed && (
          <>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: stage.color || C.yellow, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stage.name}
              </div>
              <div style={{ fontSize: '11px', color: C.faint, marginTop: '1px' }}>
                {stage.deals.length} deal{stage.deals.length !== 1 ? 's' : ''} &middot; {fmtValue(totalValue)}
              </div>
            </div>
          </>
        )}
      </div>

      {!isCollapsed && (
        <div style={{
          flex: 1, overflowY: 'auto', padding: '8px', display: 'flex',
          flexDirection: 'column', gap: '8px',
        }}>
          {stage.deals.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: `2px dashed ${C.border}`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
              }}>
                <Plus size={16} style={{ color: C.faint }} />
              </div>
              <span style={{ fontSize: '11px', color: C.faint }}>No deals in this stage</span>
            </div>
          ) : (
            <SortableContext items={stage.deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
              {stage.deals.map((deal, i) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <SortableDealCard deal={deal} onClick={() => onDealClick(deal)} />
                </motion.div>
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TABLE VIEW
// ════════════════════════════════════════════════════════════════════════════

function TableView({ stages, onDealClick, sortField, onSortChange }: {
  stages: Stage[]; onDealClick: (deal: Deal) => void; sortField: SortOption; onSortChange: (s: SortOption) => void
}) {
  const allDeals = useMemo(() => stages.flatMap(s => s.deals.map(d => ({ ...d, stage: s }))), [stages])
  const sorted = useMemo(() => sortDeals(allDeals, sortField), [allDeals, sortField])

  const columns: { key: SortOption; label: string; width: string }[] = [
    { key: 'name', label: 'Deal', width: '22%' },
    { key: 'value-desc', label: 'Value', width: '10%' },
    { key: 'probability', label: 'Probability', width: '10%' },
    { key: 'name', label: 'Stage', width: '12%' },
    { key: 'name', label: 'Contact', width: '14%' },
    { key: 'name', label: 'Assignee', width: '12%' },
    { key: 'closeDate', label: 'Close Date', width: '10%' },
    { key: 'closeDate', label: 'Days Left', width: '8%' },
    { key: 'name', label: 'Tags', width: '12%' },
  ]

  return (
    <div style={{
      backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
      overflowX: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 16px',
        borderBottom: `1px solid ${C.border}`, backgroundColor: C.deeper,
      }}>
        {columns.map(col => (
          <button
            key={col.label}
            onClick={() => {
              if (col.key === sortField) {
                onSortChange(sortField === 'value-desc' ? 'value-asc' : sortField === 'value-asc' ? 'value-desc' : sortField)
              } else {
                onSortChange(col.key)
              }
            }}
            style={{
              width: col.width, fontSize: '10px', fontWeight: 600, color: C.faint,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            {col.label}
            <ArrowUpDown size={9} style={{ opacity: sortField === col.key ? 1 : 0.3 }} />
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 'calc(100vh - 440px)', overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', color: C.faint }}>No deals to display</span>
          </div>
        ) : (
          sorted.map((deal, i) => {
            const days = daysUntilClose(deal.closeDate)
            const isOverdue = days !== null && days < 0
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onDealClick(deal)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '11px 16px',
                  borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <div style={{ width: '22%', minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {deal.title}
                  </div>
                </div>
                <div style={{ width: '10%' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.white }}>{formatCurrency(deal.value)}</span>
                </div>
                <div style={{ width: '10%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '36px', height: '5px', borderRadius: '3px', backgroundColor: C.border, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${deal.probability}%`, height: '100%', borderRadius: '3px',
                        backgroundColor: deal.probability >= 70 ? C.green : deal.probability >= 40 ? C.yellow : C.red,
                      }} />
                    </div>
                    <span style={{ fontSize: '11px', color: C.muted, fontWeight: 500 }}>{deal.probability}%</span>
                  </div>
                </div>
                <div style={{ width: '12%' }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                    backgroundColor: `${deal.stage?.color || C.yellow}20`,
                    color: deal.stage?.color || C.yellow,
                    display: 'inline-block',
                  }}>
                    {deal.stage?.name || 'Unknown'}
                  </div>
                </div>
                <div style={{ width: '14%' }}>
                  {deal.contact ? (
                    <a href={`/crm/contacts/${deal.contact.id}`} onClick={e => e.stopPropagation()} style={{ fontSize: '12px', color: C.yellow, textDecoration: 'none' }} className="hover:underline">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </a>
                  ) : (
                    <span style={{ fontSize: '12px', color: C.faint }}>—</span>
                  )}
                </div>
                <div style={{ width: '12%' }}>
                  {deal.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        backgroundColor: 'rgba(167,139,250,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '7px', fontWeight: 700, color: C.purple }}>{getInitials(deal.assignee.name)}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {deal.assignee.name.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: C.faint }}>—</span>
                  )}
                </div>
                <div style={{ width: '10%' }}>
                  {deal.closeDate ? (
                    <span style={{ fontSize: '11px', color: isOverdue ? C.red : C.muted, fontWeight: isOverdue ? 600 : 400 }}>
                      {format(new Date(deal.closeDate), 'd MMM yyyy')}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: C.faint }}>—</span>
                  )}
                </div>
                <div style={{ width: '8%' }}>
                  {days !== null ? (
                    <span style={{ fontSize: '11px', fontWeight: 500, color: isOverdue ? C.red : days <= 3 ? C.orange : C.faint }}>
                      {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: C.faint }}>—</span>
                  )}
                </div>
                <div style={{ width: '12%' }}>
                  {deal.tags && deal.tags.length > 0 ? (
                    <div style={{ display: 'flex', gap: '3px', overflow: 'hidden' }}>
                      {deal.tags.slice(0, 2).map(t => (
                        <span key={t.tag.id} style={{
                          fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                          backgroundColor: `${t.tag.color}20`, color: t.tag.color,
                          maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {t.tag.name}
                        </span>
                      ))}
                      {deal.tags.length > 2 && (
                        <span style={{ fontSize: '10px', color: C.faint }}>+{deal.tags.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: C.faint }}>—</span>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE DEAL WIZARD (3-Step)
// ════════════════════════════════════════════════════════════════════════════

function CreateDealWizard({ open, onOpenChange, stages, contacts }: {
  open: boolean; onOpenChange: (v: boolean) => void; stages: Stage[]; contacts: Contact[]
}) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<WizardStep>(1)
  const [form, setForm] = useState({
    title: '', value: '', probability: '50', stageId: '', contactId: '',
    description: '', tagInput: '',
  })

  const mutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          value: parseFloat(body.value) || 0,
          probability: parseInt(body.probability) || 50,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create deal') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      onOpenChange(false)
      setForm({ title: '', value: '', probability: '50', stageId: '', contactId: '', description: '', tagInput: '' })
      setStep(1)
      toast.success('Deal created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canProceedStep1 = form.title.trim().length > 0
  const canProceedStep2 = form.stageId.length > 0

  const stepLabels = ['Basic Info', 'Stage & Contact', 'Description & Tags']

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (v) {
        setForm({ title: '', value: '', probability: '50', stageId: stages[0]?.id || '', contactId: '', description: '', tagInput: '' })
        setStep(1)
      }
      onOpenChange(v)
    }}>
      <DialogContent style={{ backgroundColor: C.surface, borderColor: C.border, maxWidth: '520px', width: '100%' }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white, fontSize: '18px' }}>Create New Deal</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', padding: '12px 0 4px' }}>
          {stepLabels.map((label, i) => {
            const stepNum = (i + 1) as WizardStep
            const isActive = step === stepNum
            const isPast = step > stepNum
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                    backgroundColor: isActive ? C.yellow : isPast ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? C.dark : isPast ? C.green : C.faint,
                    border: `1px solid ${isActive ? C.yellow : isPast ? C.green : C.border}`,
                    transition: 'all 0.2s',
                  }}>
                    {isPast ? <CheckSquare size={14} /> : stepNum}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: isActive ? 600 : 400, color: isActive ? C.white : C.faint }}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div style={{ width: '24px', height: '1px', backgroundColor: isPast ? C.green : C.border, flexShrink: 0 }} />
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Label style={{ color: C.muted, fontSize: '13px' }}>Deal Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Solar PV Installation – Dublin 4" style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Label style={{ color: C.muted, fontSize: '13px' }}>Value (€)</Label>
                  <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="0" style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Label style={{ color: C.muted, fontSize: '13px' }}>Probability (%)</Label>
                  <Input type="number" min="0" max="100" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} placeholder="50" style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Stage & Contact */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Label style={{ color: C.muted, fontSize: '13px' }}>Pipeline Stage *</Label>
                <Select value={form.stageId} onValueChange={v => setForm({ ...form, stageId: v })}>
                  <SelectTrigger style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }}>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Label style={{ color: C.muted, fontSize: '13px' }}>Contact</Label>
                <Select value={form.contactId} onValueChange={v => setForm({ ...form, contactId: v })}>
                  <SelectTrigger style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }}>
                    <SelectValue placeholder="Select contact (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {/* Step 3: Description & Tags */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Label style={{ color: C.muted, fontSize: '13px' }}>Close Date</Label>
                <Input type="date" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Label style={{ color: C.muted, fontSize: '13px' }}>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add a brief description of the deal..." rows={3} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, resize: 'vertical' }} />
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', justifyContent: 'space-between' }}>
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep((step - 1) as WizardStep)} style={{ borderColor: C.border, color: C.muted }}>
                  Back
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" onClick={() => onOpenChange(false)} style={{ borderColor: C.border, color: C.muted }}>
                Cancel
              </Button>
              {step < 3 ? (
                <Button
                  onClick={() => {
                    if (step === 1 && !canProceedStep1) { toast.error('Deal title is required'); return }
                    if (step === 2 && !canProceedStep2) { toast.error('Please select a stage'); return }
                    setStep((step + 1) as WizardStep)
                  }}
                  style={{ backgroundColor: C.yellow, color: C.dark, fontWeight: 600 }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={() => mutation.mutate(form)}
                  disabled={mutation.isPending}
                  style={{ backgroundColor: C.yellow, color: C.dark, fontWeight: 600 }}
                >
                  {mutation.isPending ? 'Creating...' : 'Create Deal'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EDIT DEAL DIALOG
// ════════════════════════════════════════════════════════════════════════════

function EditDealDialog({ deal, stages, contacts, open, onOpenChange }: {
  deal: DealDetail; stages: Stage[]; contacts: Contact[]; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    title: deal.title, value: String(deal.value), probability: String(deal.probability),
    stageId: deal.stageId, contactId: deal.contact?.id || '',
    closeDate: deal.closeDate ? format(new Date(deal.closeDate), 'yyyy-MM-dd') : '',
    description: deal.description || '',
  })

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update deal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['deal-detail'] })
      onOpenChange(false)
      toast.success('Deal updated successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (v) setForm({
        title: deal.title, value: String(deal.value), probability: String(deal.probability),
        stageId: deal.stageId, contactId: deal.contact?.id || '',
        closeDate: deal.closeDate ? format(new Date(deal.closeDate), 'yyyy-MM-dd') : '',
        description: deal.description || '',
      })
      onOpenChange(v)
    }}>
      <DialogContent style={{ backgroundColor: C.surface, borderColor: C.border, maxWidth: '480px', width: '100%' }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white, fontSize: '18px' }}>Edit Deal</DialogTitle>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: C.muted, fontSize: '13px' }}>Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label style={{ color: C.muted, fontSize: '13px' }}>Value (€)</Label>
              <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label style={{ color: C.muted, fontSize: '13px' }}>Probability (%)</Label>
              <Input type="number" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label style={{ color: C.muted, fontSize: '13px' }}>Stage</Label>
              <Select value={form.stageId} onValueChange={v => setForm({ ...form, stageId: v })}>
                <SelectTrigger style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label style={{ color: C.muted, fontSize: '13px' }}>Contact</Label>
              <Select value={form.contactId} onValueChange={v => setForm({ ...form, contactId: v })}>
                <SelectTrigger style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }}>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: C.muted, fontSize: '13px' }}>Close Date</Label>
            <Input type="date" value={form.closeDate} onChange={e => setForm({ ...form, closeDate: e.target.value })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: C.muted, fontSize: '13px' }}>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Button variant="outline" onClick={() => onOpenChange(false)} style={{ flex: 1, borderColor: C.border, color: C.muted }}>Cancel</Button>
            <Button
              onClick={() => mutation.mutate({
                title: form.title, value: parseFloat(form.value) || 0,
                probability: parseInt(form.probability) || 0, stageId: form.stageId,
                contactId: form.contactId || null, closeDate: form.closeDate || null,
                description: form.description || null,
              })}
              disabled={mutation.isPending}
              style={{ flex: 1, backgroundColor: C.yellow, color: C.dark, fontWeight: 600 }}
            >
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER DIALOGS (Task, Proposal, Activity)
// ════════════════════════════════════════════════════════════════════════════

function CreateTaskDialog({ dealId, contactId, open, onOpenChange }: {
  dealId: string; contactId: string | null; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' })
  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-detail'] })
      setForm({ title: '', description: '', priority: 'medium', dueDate: '' })
      onOpenChange(false)
      toast.success('Task created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) setForm({ title: '', description: '', priority: 'medium', dueDate: '' }); onOpenChange(v) }}>
      <DialogContent style={{ backgroundColor: C.surface, borderColor: C.border, maxWidth: '460px' }}>
        <DialogHeader><DialogTitle style={{ color: C.white }}>Create Task</DialogTitle></DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: C.muted, fontSize: '13px' }}>Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: C.muted, fontSize: '13px' }}>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Additional details..." style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label style={{ color: C.muted, fontSize: '13px' }}>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label style={{ color: C.muted, fontSize: '13px' }}>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
            </div>
          </div>
          <Button onClick={() => {
            if (!form.title.trim()) { toast.error('Task title is required'); return }
            mutation.mutate({ ...form, dealId, contactId: contactId || undefined })
          }} disabled={mutation.isPending} style={{ backgroundColor: C.yellow, color: C.dark, fontWeight: 600, marginTop: '4px' }}>
            {mutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LogActivityDialog({ dealId, open, onOpenChange }: {
  dealId: string; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ type: 'note', subject: '', description: '' })
  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to log activity')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-detail'] })
      setForm({ type: 'note', subject: '', description: '' })
      onOpenChange(false)
      toast.success('Activity logged successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) setForm({ type: 'note', subject: '', description: '' }); onOpenChange(v) }}>
      <DialogContent style={{ backgroundColor: C.surface, borderColor: C.border, maxWidth: '460px' }}>
        <DialogHeader><DialogTitle style={{ color: C.white }}>Log Activity</DialogTitle></DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: C.muted, fontSize: '13px' }}>Type</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem><SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem><SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: C.muted, fontSize: '13px' }}>Subject *</Label>
            <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Activity subject" style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: C.muted, fontSize: '13px' }}>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Additional details..." style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white }} />
          </div>
          <Button onClick={() => {
            if (!form.subject.trim()) { toast.error('Subject is required'); return }
            mutation.mutate({ ...form, dealId })
          }} disabled={mutation.isPending} style={{ backgroundColor: C.yellow, color: C.dark, fontWeight: 600, marginTop: '4px' }}>
            {mutation.isPending ? 'Logging...' : 'Log Activity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ADVANCED FILTER PANEL
// ════════════════════════════════════════════════════════════════════════════

function AdvancedFilterPanel({ filters, stages, contacts, onChange, onReset }: {
  filters: FilterState; stages: Stage[]; contacts: Contact[];
  onChange: (f: FilterState) => void; onReset: () => void
}) {
  const assignees = useMemo(() => {
    const map = new Map<string, string>()
    contacts.forEach(c => map.set(c.id, `${c.firstName} ${c.lastName}`))
    return map
  }, [contacts])

  const toggleStage = (id: string) => {
    const ids = filters.stageIds.includes(id)
      ? filters.stageIds.filter(s => s !== id)
      : [...filters.stageIds, id]
    onChange({ ...filters, stageIds: ids })
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        padding: '18px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Stage Multi-Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Label style={{ color: C.muted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stages</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {stages.map(s => {
              const isActive = filters.stageIds.includes(s.id)
              return (
                <button key={s.id} onClick={() => toggleStage(s.id)} style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                  border: `1px solid ${isActive ? (s.color || C.yellow) : C.border}`,
                  backgroundColor: isActive ? `${s.color || C.yellow}20` : 'transparent',
                  color: isActive ? (s.color || C.yellow) : C.muted,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Value Range */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Label style={{ color: C.muted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value Range (€)</Label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Input type="number" placeholder="Min" value={filters.minValue || ''} onChange={e => onChange({ ...filters, minValue: parseFloat(e.target.value) || 0 })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, height: '34px', fontSize: '13px' }} />
            <span style={{ color: C.faint, fontSize: '12px' }}>to</span>
            <Input type="number" placeholder="Max" value={filters.maxValue || ''} onChange={e => onChange({ ...filters, maxValue: parseFloat(e.target.value) || 0 })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, height: '34px', fontSize: '13px' }} />
          </div>
        </div>

        {/* Date Range */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Label style={{ color: C.muted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Range</Label>
          <Select value={filters.dateField} onValueChange={v => onChange({ ...filters, dateField: v as FilterState['dateField'] })}>
            <SelectTrigger style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, height: '34px', fontSize: '13px' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any date</SelectItem>
              <SelectItem value="created">Date created</SelectItem>
              <SelectItem value="closing">Closing date</SelectItem>
            </SelectContent>
          </Select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input type="date" value={filters.dateFrom} onChange={e => onChange({ ...filters, dateFrom: e.target.value })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, height: '34px', fontSize: '13px' }} />
            <Input type="date" value={filters.dateTo} onChange={e => onChange({ ...filters, dateTo: e.target.value })} style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, height: '34px', fontSize: '13px' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
        <Button variant="outline" onClick={onReset} size="sm" style={{ borderColor: C.border, color: C.muted, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RotateCcw size={13} /> Reset Filters
        </Button>
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PREMIUM EMPTY STATE
// ════════════════════════════════════════════════════════════════════════════

function EmptyState({ onCreateDeal }: { onCreateDeal: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 20px', textAlign: 'center',
      }}
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        style={{ marginBottom: '24px' }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="rgba(243,216,64,0.1)" stroke={C.yellow} strokeWidth="2" />
          <circle cx="40" cy="40" r="16" fill={C.yellow} opacity="0.3" />
          <circle cx="40" cy="40" r="24" fill="none" stroke={C.yellow} strokeWidth="1.5" opacity="0.4" strokeDasharray="4 4" />
          {[
            { angle: 0, len: 14 }, { angle: 45, len: 12 }, { angle: 90, len: 14 }, { angle: 135, len: 12 },
            { angle: 180, len: 14 }, { angle: 225, len: 12 }, { angle: 270, len: 14 }, { angle: 315, len: 12 },
          ].map((ray, i) => {
            const rad = (ray.angle * Math.PI) / 180
            const x1 = 40 + Math.cos(rad) * 30
            const y1 = 40 + Math.sin(rad) * 30
            const x2 = 40 + Math.cos(rad) * (30 + ray.len)
            const y2 = 40 + Math.sin(rad) * (30 + ray.len)
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.yellow} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          })}
          <circle cx="40" cy="40" r="8" fill={C.yellow} />
        </svg>
      </motion.div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, color: C.white, marginBottom: '8px' }}>
        Your pipeline is ready
      </h3>
      <p style={{ fontSize: '14px', color: C.muted, maxWidth: '400px', lineHeight: 1.6, marginBottom: '28px' }}>
        Create your first deal to start tracking opportunities through your pipeline. Drag and drop deals between stages to manage your sales process.
      </p>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onCreateDeal}
        style={{
          backgroundColor: C.yellow, color: C.dark, fontWeight: 600, fontSize: '14px',
          padding: '12px 28px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 20px rgba(243,216,64,0.25)',
        }}
      >
        <Plus size={16} />Create Your First Deal
      </motion.button>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DEAL DETAIL SIDE PANEL (560px)
// ════════════════════════════════════════════════════════════════════════════

function DealDetailPanel({ dealId, stages, contacts, onClose }: {
  dealId: string; stages: Stage[]; contacts: Contact[]; onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [noteText, setNoteText] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['deal-detail', dealId],
    queryFn: () => fetch(`/api/crm/deals/${dealId}`).then(r => r.json()),
    enabled: !!dealId,
  })

  const deal: DealDetail | null = data?.deal || null

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/deals/${dealId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete deal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      onClose()
      toast.success('Deal deleted permanently')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/crm/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, dealId }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-detail'] })
      setNoteText('')
      toast.success('Note added')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const days = deal ? daysUntilClose(deal.closeDate) : null
  const isOverdue = days !== null && days < 0

  const tabs: { key: DetailTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: Eye },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare },
    { key: 'proposals', label: 'Proposals', icon: FileText },
  ]

  const quickActions = [
    { key: 'edit', icon: Pencil, label: 'Edit', colour: C.yellow },
    { key: 'task', icon: CheckSquare, label: 'Task', colour: C.green },
    { key: 'activity', icon: MessageSquare, label: 'Activity', colour: C.orange },
    { key: 'delete', icon: Trash2, label: 'Delete', colour: C.red },
  ]

  if (isLoading) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }} onClick={onClose} />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '560px', maxWidth: '100vw', backgroundColor: C.surface, boxShadow: '-20px 0 60px rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #2A2A2A', borderTopColor: C.yellow, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </motion.div>
      </>
    )
  }

  if (!deal) return null

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(4px)' }}
        onClick={onClose} />

      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '560px', maxWidth: '100vw', backgroundColor: C.surface, boxShadow: '-20px 0 60px rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {deal.stage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: `${deal.stage.color}20` }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: deal.stage.color }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: deal.stage.color }}>{deal.stage.name}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.white, lineHeight: 1.3, marginBottom: '10px' }}>{deal.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: C.white }}>{formatCurrency(deal.value)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', backgroundColor: deal.probability >= 70 ? 'rgba(52,211,153,0.15)' : deal.probability >= 40 ? 'rgba(243,216,64,0.15)' : 'rgba(248,113,113,0.15)' }}>
              <TrendingUp size={12} style={{ color: deal.probability >= 70 ? C.green : deal.probability >= 40 ? C.yellow : C.red }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: deal.probability >= 70 ? C.green : deal.probability >= 40 ? C.yellow : C.red }}>{deal.probability}%</span>
            </div>
            {deal.closeDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isOverdue ? C.red : C.faint, fontSize: '12px' }}>
                <Calendar size={12} />
                <span style={{ fontWeight: isOverdue ? 600 : 400 }}>{format(new Date(deal.closeDate), 'd MMM yyyy')}</span>
                {isOverdue && <span style={{ fontWeight: 600 }}>(overdue)</span>}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0, paddingLeft: '22px' }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 14px', fontSize: '13px', fontWeight: isActive ? 600 : 500,
                color: isActive ? C.white : C.faint,
                borderBottom: isActive ? `2px solid ${C.yellow}` : '2px solid transparent',
                background: 'none', borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <Icon size={14} />{tab.label}
                {tab.key === 'activity' && deal.activities.length > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', backgroundColor: 'rgba(243,216,64,0.15)', color: C.yellow }}>
                    {deal.activities.length}
                  </span>
                )}
                {tab.key === 'tasks' && deal.tasks.length > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', backgroundColor: 'rgba(52,211,153,0.15)', color: C.green }}>
                    {deal.tasks.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <ScrollArea style={{ flex: 1 }}>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              {deal.contact && (
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Contact</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', backgroundColor: C.deeper }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(243,216,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: C.yellow }}>{getInitials(`${deal.contact.firstName} ${deal.contact.lastName}`)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={`/crm/contacts/${deal.contact.id}`} style={{ fontSize: '14px', fontWeight: 600, color: C.yellow, textDecoration: 'none' }} className="hover:underline">{deal.contact.firstName} {deal.contact.lastName}</a>
                      {deal.contact.email && <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{deal.contact.email}</div>}
                      {deal.contact.company && <a href="/crm/companies" style={{ fontSize: '12px', color: C.yellow, textDecoration: 'none', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }} className="hover:underline"><Building2 size={11} />{deal.contact.company.name}</a>}
                    </div>
                  </div>
                </div>
              )}

              {deal.assignee && (
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Assignee</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', backgroundColor: C.deeper }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: C.purple }}>{getInitials(deal.assignee.name)}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: C.white }}>{deal.assignee.name}</span>
                  </div>
                </div>
              )}

              {deal.description && (
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Description</div>
                  <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{deal.description}</p>
                </div>
              )}

              {deal.tags && deal.tags.length > 0 && (
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {deal.tags.map(t => (
                      <span key={t.tag.id} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', backgroundColor: `${t.tag.color}20`, color: t.tag.color }}>
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ padding: '18px 22px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {quickActions.map(action => (
                    <motion.button
                      key={action.key}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        if (action.key === 'delete') {
                          if (confirm('Are you sure you want to delete this deal? This action cannot be undone.')) deleteMutation.mutate()
                          return
                        }
                        setActiveDialog(action.key)
                      }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        padding: '14px 8px', borderRadius: '10px',
                        border: `1px solid ${action.key === 'delete' ? 'rgba(248,113,113,0.2)' : C.border}`,
                        backgroundColor: action.key === 'delete' ? 'rgba(248,113,113,0.05)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <action.icon size={18} style={{ color: action.colour }} />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: action.colour, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.white }}>
                  {deal.activities.length} activit{deal.activities.length === 1 ? 'y' : 'ies'}
                </span>
                <Button size="sm" onClick={() => setActiveDialog('activity')} style={{ backgroundColor: C.yellow, color: C.dark, fontWeight: 600, fontSize: '12px', padding: '6px 12px' }}>
                  <Plus size={13} style={{ marginRight: '4px' }} />Log Activity
                </Button>
              </div>
              {deal.activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Activity size={20} style={{ color: C.faint }} />
                  </div>
                  <p style={{ fontSize: '13px', color: C.faint }}>No activities recorded yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {deal.activities.map((activity, i) => {
                    const typeIcon = activity.type === 'call' ? Phone : activity.type === 'email' ? Mail : activity.type === 'meeting' ? Calendar : FileText
                    const typeColour = activity.type === 'call' ? C.green : activity.type === 'email' ? '#60A5FA' : activity.type === 'meeting' ? C.purple : C.faint
                    const TypeIcon = typeIcon
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ display: 'flex', gap: '12px', paddingBottom: '18px', position: 'relative' }}
                      >
                        {i < deal.activities.length - 1 && (
                          <div style={{ position: 'absolute', left: '15px', top: '34px', bottom: '0', width: '1px', backgroundColor: C.border }} />
                        )}
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                          backgroundColor: `${typeColour}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <TypeIcon size={14} style={{ color: typeColour }} />
                        </div>
                        <div style={{ flex: 1, paddingTop: '2px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: C.white, marginBottom: '2px' }}>{activity.subject}</div>
                          {activity.description && (
                            <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5, marginBottom: '4px' }}>{activity.description}</p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: C.faint }}>
                            {activity.user && <span>{activity.user.name}</span>}
                            <span>&middot;</span>
                            <span>{format(new Date(activity.createdAt), 'd MMM yyyy \'at\' h:mm a')}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Notes section */}
              <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Notes</div>
                {deal.notes && deal.notes.map(note => (
                  <div key={note.id} style={{ padding: '10px', borderRadius: '8px', backgroundColor: C.deeper, marginBottom: '8px' }}>
                    <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.5, marginBottom: '4px' }}>{note.content}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: C.faint }}>
                      {note.user && <span>{note.user.name}</span>}
                      <span>&middot;</span>
                      <span>{format(new Date(note.createdAt), 'd MMM yyyy \'at\' h:mm a')}</span>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, resize: 'vertical', flex: 1 }}
                  />
                  <Button
                    onClick={() => { if (!noteText.trim()) return; addNoteMutation.mutate(noteText) }}
                    disabled={addNoteMutation.isPending}
                    size="sm"
                    style={{ backgroundColor: C.yellow, color: C.dark, fontWeight: 600, alignSelf: 'flex-end' }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.white }}>
                  {deal.tasks.length} task{deal.tasks.length === 1 ? '' : 's'}
                </span>
                <Button size="sm" onClick={() => setActiveDialog('task')} style={{ backgroundColor: C.yellow, color: C.dark, fontWeight: 600, fontSize: '12px', padding: '6px 12px' }}>
                  <Plus size={13} style={{ marginRight: '4px' }} />Add Task
                </Button>
              </div>
              {deal.tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <CheckSquare size={20} style={{ color: C.faint }} />
                  </div>
                  <p style={{ fontSize: '13px', color: C.faint }}>No tasks linked to this deal</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {deal.tasks.map(task => {
                    const isDone = task.status === 'completed' || task.status === 'done'
                    const priorityColour = task.priority === 'urgent' ? C.red : task.priority === 'high' ? C.orange : task.priority === 'low' ? C.faint : C.yellow
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          padding: '12px', borderRadius: '10px', backgroundColor: C.deeper,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '6px',
                            border: `2px solid ${isDone ? C.green : C.border}`,
                            backgroundColor: isDone ? C.green : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            cursor: 'pointer',
                          }}>
                            {isDone && <span style={{ color: C.dark, fontSize: '10px' }}>✓</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: isDone ? C.faint : C.white, textDecoration: isDone ? 'line-through' : 'none' }}>
                              {task.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: `${priorityColour}20`, color: priorityColour, textTransform: 'capitalize' }}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span style={{ fontSize: '11px', color: C.faint, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Clock size={10} />{format(new Date(task.dueDate), 'd MMM')}
                                </span>
                              )}
                              {task.assignee && (
                                <span style={{ fontSize: '11px', color: C.faint }}>{task.assignee.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* PROPOSALS TAB */}
          {activeTab === 'proposals' && (
            <div style={{ padding: '18px 22px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: C.white, display: 'block', marginBottom: '16px' }}>
                {deal.proposals?.length || 0} proposal{(deal.proposals?.length || 0) === 1 ? '' : 's'}
              </span>
              {(!deal.proposals || deal.proposals.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <FileText size={20} style={{ color: C.faint }} />
                  </div>
                  <p style={{ fontSize: '13px', color: C.faint }}>No proposals linked to this deal</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {deal.proposals.map(proposal => {
                    const statusColour = proposal.status === 'accepted' ? C.green : proposal.status === 'sent' ? C.yellow : proposal.status === 'rejected' ? C.red : C.faint
                    return (
                      <motion.div
                        key={proposal.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          padding: '14px', borderRadius: '10px', backgroundColor: C.deeper,
                          border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '14px',
                        }}
                      >
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          backgroundColor: `${statusColour}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <FileText size={18} style={{ color: statusColour }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: C.white, marginBottom: '2px' }}>{proposal.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.faint }}>
                            <span style={{ fontWeight: 600, color: C.white }}>{formatCurrency(proposal.totalAmount)}</span>
                            {proposal.sentAt && <span>Sent {format(new Date(proposal.sentAt), 'd MMM yyyy')}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: `${statusColour}15`, color: statusColour, textTransform: 'capitalize', flexShrink: 0 }}>
                          {proposal.status}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </motion.div>

      {/* Sub-dialogs */}
      {activeDialog === 'edit' && deal && (
        <EditDealDialog deal={deal} stages={stages} contacts={contacts} open={!!activeDialog} onOpenChange={v => setActiveDialog(v ? 'edit' : null)} />
      )}
      {activeDialog === 'task' && (
        <CreateTaskDialog dealId={deal.id} contactId={deal.contact?.id || null} open={!!activeDialog} onOpenChange={v => setActiveDialog(v ? 'task' : null)} />
      )}
      {activeDialog === 'activity' && (
        <LogActivityDialog dealId={deal.id} open={!!activeDialog} onOpenChange={v => setActiveDialog(v ? 'activity' : null)} />
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function PipelinePageContent() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortOption>('value-desc')
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set())
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [activeDragDeal, setActiveDragDeal] = useState<Deal | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => fetch('/api/crm/pipeline').then(r => r.json()),
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => fetch('/api/crm/contacts?limit=200').then(r => r.json()).then(d => d.contacts || []),
  })

  const stages: Stage[] = data?.stages || []
  const contacts: Contact[] = contactsData || []

  const filteredStages = useMemo(() => {
    if (!search.trim() && filters.stageIds.length === 0 && filters.minValue === 0 && filters.maxValue === 0 && !filters.dateFrom && !filters.dateTo && !filters.companyQuery.trim()) {
      return stages
    }
    return stages.map(s => ({
      ...s,
      deals: applyFilters(s.deals, search, filters),
    }))
  }, [stages, search, filters])

  const allDealsCount = useMemo(() => filteredStages.reduce((sum, s) => sum + s.deals.length, 0), [filteredStages])

  const moveDealMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const res = await fetch('/api/crm/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, stageId }),
      })
      if (!res.ok) throw new Error('Failed to move deal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      toast.success('Deal moved successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleDragStart = (event: DragStartEvent) => {
    const deal = stages.flatMap(s => s.deals).find(d => d.id === event.active.id)
    if (deal) setActiveDragDeal(deal)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragDeal(null)
    const { active, over } = event
    if (!over) return

    const dealId = active.id as string
    const targetStageId = over.id as string

    const deal = stages.flatMap(s => s.deals).find(d => d.id === dealId)
    if (!deal || deal.stageId === targetStageId) return

    moveDealMutation.mutate({ dealId, stageId: targetStageId })
  }

  const toggleCollapse = (stageId: string) => {
    setCollapsedCols(prev => {
      const next = new Set(prev)
      if (next.has(stageId)) next.delete(stageId)
      else next.add(stageId)
      return next
    })
  }

  const handleExport = useCallback(() => {
    const deals = stages.flatMap(s => s.deals.map(d => ({
      Title: d.title, Value: d.value, Probability: d.probability,
      Stage: s.name, Contact: d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : '',
      Assignee: d.assignee?.name || '', 'Close Date': d.closeDate || '',
    })))
    const csv = [
      Object.keys(deals[0] || {}).join(','),
      ...deals.map(d => Object.values(d).map(v => `"${v}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pipeline-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Pipeline exported successfully')
  }, [stages])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #2A2A2A', borderTopColor: C.yellow, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  const hasNoStages = stages.length === 0
  const hasNoDeals = stages.length > 0 && allDealsCount === 0

  return (
    <div style={{ padding: '24px', maxWidth: '100%', overflow: 'hidden' }}>
      <AnimatePresence>
        {selectedDealId && (
          <DealDetailPanel
            dealId={selectedDealId}
            stages={stages}
            contacts={contacts}
            onClose={() => setSelectedDealId(null)}
          />
        )}
      </AnimatePresence>

      {/* Quick Actions Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}
      >
        <Button
          onClick={() => setShowCreateDialog(true)}
          style={{ backgroundColor: C.yellow, color: C.dark, fontWeight: 600, fontSize: '13px', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />New Deal
        </Button>

        {/* Search */}
        <div style={{ position: 'relative', flex: '0 0 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.faint, pointerEvents: 'none' }} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search deals..."
            style={{ backgroundColor: C.deeper, borderColor: C.border, color: C.white, height: '36px', fontSize: '13px', paddingLeft: '32px' }}
          />
        </div>

        {/* Filter Toggle */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
            border: `1px solid ${showFilters ? C.yellow : C.border}`,
            backgroundColor: showFilters ? 'rgba(243,216,64,0.08)' : 'transparent',
            color: showFilters ? C.yellow : C.muted,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <Filter size={14} />
          Filters
          {(filters.stageIds.length > 0 || filters.minValue > 0 || filters.maxValue > 0 || filters.dateFrom || filters.dateTo || filters.companyQuery.trim()) && (
            <span style={{
              width: '16px', height: '16px', borderRadius: '50%', backgroundColor: C.yellow, color: C.dark,
              fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              !
            </span>
          )}
        </motion.button>

        <div style={{ flex: 1 }} />

        {/* Export */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
            border: `1px solid ${C.border}`, backgroundColor: 'transparent',
            color: C.muted, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.white }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
        >
          <Download size={14} />Export
        </motion.button>

        {/* View Toggle */}
        <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '7px 14px', fontSize: '12px', fontWeight: 500,
              backgroundColor: viewMode === 'kanban' ? 'rgba(243,216,64,0.1)' : 'transparent',
              color: viewMode === 'kanban' ? C.yellow : C.muted,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              borderRight: `1px solid ${C.border}`,
            }}
          >
            <LayoutGrid size={14} />Kanban
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '7px 14px', fontSize: '12px', fontWeight: 500,
              backgroundColor: viewMode === 'table' ? 'rgba(243,216,64,0.1)' : 'transparent',
              color: viewMode === 'table' ? C.yellow : C.muted,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <List size={14} />Table
          </button>
        </div>
      </motion.div>

      {/* Advanced Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <AdvancedFilterPanel
            filters={filters}
            stages={stages}
            contacts={contacts}
            onChange={setFilters}
            onReset={() => { setFilters(defaultFilters); toast.success('Filters reset') }}
          />
        )}
      </AnimatePresence>

      {/* Stats Dashboard */}
      <div style={{ marginBottom: '16px' }}>
        <StatsDashboard stages={stages} />
      </div>

      {/* Forecast Bar */}
      <div style={{ marginBottom: '16px' }}>
        <ForecastBar stages={stages} />
      </div>

      {/* Empty States */}
      {hasNoStages && (
        <EmptyState onCreateDeal={() => setShowCreateDialog(true)} />
      )}

      {hasNoDeals && !hasNoStages && (
        <EmptyState onCreateDeal={() => setShowCreateDialog(true)} />
      )}

      {/* Kanban View */}
      {!hasNoStages && !hasNoDeals && viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{
            display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px',
          }}>
            {stages.map((stage, i) => {
              const filteredStage = filteredStages.find(s => s.id === stage.id) || stage
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <KanbanColumn
                    stage={filteredStage}
                    onDealClick={(deal) => setSelectedDealId(deal.id)}
                    isCollapsed={collapsedCols.has(stage.id)}
                    onToggleCollapse={() => toggleCollapse(stage.id)}
                  />
                </motion.div>
              )
            })}
          </div>
          <DragOverlay>
            {activeDragDeal && (
              <div style={{ opacity: 0.9, transform: 'rotate(2deg)' }}>
                <DealCard deal={activeDragDeal} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Table View */}
      {!hasNoStages && !hasNoDeals && viewMode === 'table' && (
        <TableView
          stages={filteredStages}
          onDealClick={(deal) => setSelectedDealId(deal.id)}
          sortField={sortField}
          onSortChange={setSortField}
        />
      )}

      {/* Create Deal Wizard */}
      <CreateDealWizard
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        stages={stages}
        contacts={contacts}
      />
    </div>
  )
}
