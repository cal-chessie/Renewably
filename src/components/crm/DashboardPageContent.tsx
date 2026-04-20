'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DollarSign, Handshake, UserPlus, TrendingUp, Sparkles, Target,
  ArrowRight, Phone, AlertCircle, Clock, RefreshCw, Sun, Zap,
  BarChart3, CalendarDays, CheckCircle2, XCircle, ChevronRight,
  Activity, FileText, ShoppingCart, Users, Wrench, ZapOff,
  ArrowUpRight, ArrowDownRight, Timer, Flame, Trophy, Lightbulb,
  Megaphone, Globe, Mail, MessageSquare, Plus, MoreHorizontal,
  Eye, MapPin, Building2, Battery, Gauge, CircleDot,
  Send, Video, Bot, Search, LayoutDashboard, Hash, Keyboard,
  Home, Droplets, Award, TrendingDown, ChevronDown,
  PanelLeftClose, PanelLeft, Star, CircleCheckBig, Receipt,
  Briefcase, HeadphonesIcon, MessageCircle, ShieldCheck,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, ComposedChart, Line,
} from 'recharts'
import { StatCard } from '@/components/crm/StatCard'
import { ActivityIcon } from '@/components/crm/ActivityIcon'
import { PriorityBadge } from '@/components/crm/PriorityBadge'
import { formatCurrency, timeAgo } from '@/lib/format'
import { format } from 'date-fns'

// ============================================================================
// DESIGN SYSTEM
// ============================================================================
const C = {
  bg: '#0A0A0A',
  surface: '#111111',
  card: '#161616',
  card2: '#1C1C1C',
  border: '#262626',
  borderLight: '#333333',
  text: '#E5E5E5',
  textSecondary: '#A3A3A3',
  textTertiary: '#737373',
  textMuted: '#525252',
  yellow: '#F3D840',
  yellowDark: '#D4B82E',
  yellowMuted: 'rgba(243,216,64,0.12)',
  green: '#22C55E',
  greenMuted: 'rgba(34,197,94,0.12)',
  red: '#EF4444',
  redMuted: 'rgba(239,68,68,0.1)',
  orange: '#F97316',
  orangeMuted: 'rgba(249,115,22,0.1)',
  blue: '#3B82F6',
  blueMuted: 'rgba(59,130,246,0.1)',
  purple: '#A855F7',
  purpleMuted: 'rgba(168,85,247,0.1)',
  cyan: '#06B6D4',
  cyanMuted: 'rgba(6,182,212,0.1)',
  teal: '#14B8A6',
  tealMuted: 'rgba(20,184,166,0.1)',
}

const PIE_COLORS = [C.yellow, C.green, C.blue, C.orange, C.purple, C.cyan, C.red]
const DONUT_COLORS = ['#F3D840', '#374151', '#6B7280', '#9CA3AF']

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
}

// ============================================================================
// RECHARTS TOOLTIP STYLE
// ============================================================================
const tooltipStyle: React.CSSProperties = {
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  backgroundColor: C.card,
  color: C.text,
  fontSize: 13,
  padding: '10px 14px',
}

const tooltipLabelStyle: React.CSSProperties = {
  color: C.yellow,
  fontWeight: 600,
  marginBottom: 6,
  fontSize: 12,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

// ============================================================================
// ANIMATED NUMBER HOOK
// ============================================================================
function useAnimatedNumber(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0)
  const prevTarget = useRef(target)

  useEffect(() => {
    const start = prevTarget.current
    const diff = target - start
    if (diff === 0) { prevTarget.current = target; return }
    const startTime = performance.now()
    let raf: number

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCurrent(Math.round(start + diff * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        prevTarget.current = target
      }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return current
}

// ============================================================================
// PULSING LIVE INDICATOR
// ============================================================================
function LiveIndicator() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, color: C.green, fontWeight: 500,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: C.green, display: 'inline-block',
        animation: 'pulse-live 2s ease-in-out infinite',
        boxShadow: `0 0 8px ${C.green}60`,
      }} />
      Live
    </span>
  )
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function DarkCard({ children, style, hoverAccent }: {
  children: React.ReactNode
  style?: React.CSSProperties
  hoverAccent?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: C.card,
        borderTop: `1px solid ${hovered && hoverAccent ? hoverAccent + '30' : C.border}`,
        borderRight: `1px solid ${hovered && hoverAccent ? hoverAccent + '30' : C.border}`,
        borderBottom: `1px solid ${hovered && hoverAccent ? hoverAccent + '30' : C.border}`,
        borderLeft: `1px solid ${hovered && hoverAccent ? hoverAccent + '30' : C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, action, style }: {
  children: React.ReactNode
  action?: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${C.border}`,
      ...style,
    }}>
      {children}
      {action}
    </div>
  )
}

function CardTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {icon}
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{children}</span>
    </div>
  )
}

function CardBody({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ padding: 18, ...style }}>{children}</div>
}

function Badge({ children, colour, bg }: { children: React.ReactNode; colour: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 6,
      background: bg, color: colour, fontSize: 11, fontWeight: 500,
    }}>
      {children}
    </span>
  )
}

function MiniSparkline({ data, colour, width = 80, height = 28 }: {
  data: number[]; colour: string; width?: number; height?: number
}) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} style={{ flexShrink: 0 }}>
      <polyline
        points={points}
        fill="none"
        stroke={colour}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HealthRing({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const colour = score >= 80 ? C.green : score >= 60 ? C.orange : C.red

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.border} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={colour} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{ fontSize: size > 70 ? 22 : 16, fontWeight: 700, color: C.text, lineHeight: 1 }}>{score}</span>
        {size > 70 && <span style={{ fontSize: 9, color: C.textTertiary, marginTop: 2 }}>SCORE</span>}
      </div>
    </div>
  )
}

function ViewAllLink({ href, label = 'View all' }: { href: string; label?: string }) {
  return (
    <Link href={href} style={{
      fontSize: 12, color: C.textTertiary, textDecoration: 'none',
      display: 'flex', alignItems: 'center', gap: 4,
      transition: 'color 0.2s', fontWeight: 500,
    }}>
      {label} <ArrowRight size={12} />
    </Link>
  )
}

function SectionLabel({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 16, marginTop: 8,
    }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: accent || C.yellow }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: C.textTertiary, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
        {children}
      </span>
    </div>
  )
}

function EmptyState({ icon: Icon, message, subtext }: {
  icon: React.ElementType; message: string; subtext?: string
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '28px 16px', gap: 8,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: C.surface, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} style={{ color: C.textMuted }} />
      </div>
      <p style={{ fontSize: 13, color: C.textTertiary, textAlign: 'center' }}>{message}</p>
      {subtext && <p style={{ fontSize: 11, color: C.textMuted, textAlign: 'center' }}>{subtext}</p>}
    </div>
  )
}

// ============================================================================
// COLOUR MAPS FOR DYNAMIC DATA
// ============================================================================
const LEAD_SOURCE_COLOURS = [C.blue, C.green, C.purple, C.yellow, C.orange, C.cyan, C.red]

// ============================================================================
// TIME PERIOD SELECTOR
// ============================================================================
const TIME_PERIODS = ['This Week', 'This Month', 'This Quarter', 'This Year'] as const
type TimePeriod = typeof TIME_PERIODS[number]

function TimePeriodSelector({ value, onChange }: { value: TimePeriod; onChange: (v: TimePeriod) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8,
          background: C.card, border: `1px solid ${C.border}`,
          color: C.textSecondary, cursor: 'pointer',
          fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
      >
        <CalendarDays size={13} />
        {value}
        <ChevronDown size={12} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, overflow: 'hidden', zIndex: 50,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              minWidth: 150,
            }}
          >
            {TIME_PERIODS.map((period) => (
              <button
                key={period}
                onClick={() => { onChange(period); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 16px', background: value === period ? C.yellowMuted : 'transparent',
                  color: value === period ? C.yellow : C.textSecondary,
                  border: 'none', cursor: 'pointer', fontSize: 12,
                  fontWeight: value === period ? 600 : 400,
                  transition: 'background 0.15s', fontFamily: 'inherit',
                }}
              >
                {period}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/crm', active: true },
  { icon: Users, label: 'Contacts', href: '/crm/contacts' },
  { icon: Handshake, label: 'Pipeline', href: '/crm/pipeline' },
  { icon: FileText, label: 'Proposals', href: '/crm/proposals' },
  { icon: Receipt, label: 'Invoices', href: '/crm/invoices' },
  { icon: Phone, label: 'Activities', href: '/crm/activities' },
  { icon: CheckCircle2, label: 'Tasks', href: '/crm/tasks' },
  { icon: CalendarDays, label: 'Calendar', href: '/crm/calendar' },
  { icon: Sparkles, label: 'AI Assistant', href: '/crm/ai' },
  { icon: Sun, label: 'Installers', href: '/crm/installers' },
  { icon: BarChart3, label: 'Reports', href: '/crm/reports' },
]

function SidebarNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 52 : 200 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{
        height: '100%',
        background: C.card,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '16px 12px' : '16px 18px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={15} style={{ color: C.bg }} />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}
          >
            Renewably
          </motion.span>
        )}
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = item.active
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '9px 12px',
                borderRadius: 8,
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                background: isActive ? C.yellowMuted : 'transparent',
                color: isActive ? C.yellow : C.textTertiary,
                transition: 'all 0.15s',
                marginBottom: 2,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = C.surface
                  e.currentTarget.style.color = C.textSecondary
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = C.textTertiary
                }
              }}
            >
              <item.icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        style={{
          margin: 8, padding: 8,
          borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.surface, color: C.textTertiary,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.borderLight }}
        onMouseLeave={(e) => { e.currentTarget.style.color = C.textTertiary; e.currentTarget.style.borderColor = C.border }}
      >
        {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
      </button>
    </motion.div>
  )
}

// ============================================================================
// COMMAND PALETTE HINT
// ============================================================================
function CommandPaletteHint() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 12000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 10,
            background: C.card, border: `1px solid ${C.border}`,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            fontSize: 12, color: C.textTertiary,
          }}>
            <Search size={14} />
            <span>Search anything...</span>
            <kbd style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 4,
              background: C.surface, border: `1px solid ${C.border}`,
              fontSize: 10, fontWeight: 500, color: C.textMuted,
            }}>
              ⌘K
            </kbd>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// KEYBOARD SHORTCUTS OVERLAY
// ============================================================================
function KeyboardShortcutsHint() {
  const shortcuts = [
    { key: '⌘K', desc: 'Search' },
    { key: '⌘N', desc: 'New Deal' },
    { key: '⌘P', desc: 'New Proposal' },
    { key: '?', desc: 'All Shortcuts' },
  ]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      {shortcuts.map((s) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.textMuted }}>
          <kbd style={{
            padding: '1px 5px', borderRadius: 3,
            background: C.surface, border: `1px solid ${C.border}`,
            fontSize: 10, fontWeight: 500, color: C.textTertiary,
            fontFamily: 'monospace',
          }}>{s.key}</kbd>
          <span>{s.desc}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// DASHBOARD PAGE
// ============================================================================
export default function DashboardPageContent() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showWelcome, setShowWelcome] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('This Month')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 6000)
    return () => clearTimeout(t)
  }, [])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['crm-dashboard', timePeriod],
    queryFn: () => fetch(`/api/crm/dashboard?period=${encodeURIComponent(timePeriod)}`).then((r) => {
      if (!r.ok) throw new Error('Unauthorized')
      return r.json()
    }),
    retry: false,
    refetchInterval: 30000,
  })

  // Animated number hooks — called unconditionally (data is from a hook above)
  const rawPipeline = data?.kpis?.totalPipelineValue || 0
  const rawDeals = data?.kpis?.activeDeals || 0
  const rawConversion = data?.kpis?.conversionRate || 0
  const rawActivities = data?.activitiesThisWeek || 0
  const animatedPipeline = useAnimatedNumber(rawPipeline)
  const animatedActiveDeals = useAnimatedNumber(rawDeals)
  const animatedConversion = useAnimatedNumber(rawConversion)
  const animatedActivities = useAnimatedNumber(rawActivities)

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, maxWidth: 1600, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 28, width: 220, borderRadius: 8, background: C.card, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
            <div style={{ height: 16, width: 340, borderRadius: 6, background: C.surface, marginTop: 8, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{ height: 130, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 340, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (data.error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 120 }}>
        <AlertCircle size={48} style={{ color: C.textTertiary }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text }}>Unable to load dashboard</h2>
        <p style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', maxWidth: 400 }}>{data.error}</p>
        <button
          onClick={() => refetch()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            backgroundColor: C.yellow, color: C.bg,
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )
  }

  // ── Data destructuring ────────────────────────────────────────────────
  const {
    kpis = {},
    tasksByStatus = {},
    dealFunnel = [],
    monthlyTrend = [],
    recentActivities = [],
    upcomingTasks = [],
    aiInsights = [],
    activityByType = {},
    topContacts = [],
    overdueTasks = 0,
    avgDealCycleDays = 0,
    activitiesThisWeek = 0,
    installers = {},
    recentPerformance = [],
    leadSourceData = [],
    weeklyPerformance = [],
    solarMetrics = [],
    teamLeaderboard = [],
    conversionFunnel = [],
    // New upgrade data
    communicationStats = {},
    communicationTimeline = [],
    grantStats = {},
    forecastRevenue = {},
    customerSatisfaction = {},
    marketBenchmarks = {},
  } = data || {}

  const safeTasks = tasksByStatus || {}
  const pipelineTrend = kpis.wonValueThisMonth > 0
    ? Math.round(((kpis.wonValueThisMonth - (kpis.lostValueThisMonth || 0)) / Math.max(kpis.wonValueThisMonth, 1)) * 100)
    : 0
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

  const totalTasks = (safeTasks.todo || 0) + (safeTasks.in_progress || 0) + (safeTasks.completed || 0)
  const completionRate = totalTasks > 0 ? Math.round(((safeTasks.completed || 0) / totalTasks) * 100) : 0

  // Health score calculation
  const healthScore = Math.min(100, Math.max(0,
    (kpis.conversionRate || 0) * 1.5 +
    (completionRate) * 0.6 +
    (overdueTasks === 0 ? 20 : Math.max(0, 20 - overdueTasks * 5)) +
    (activitiesThisWeek >= 20 ? 20 : activitiesThisWeek)
  ))

  const greeting = (() => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const revenueSparkData = monthlyTrend.map((m: { value: number }) => m.value)

  // Animated numbers for KPIs are declared above (before early returns)

  // Communication stats data
  const commData = [
    { name: 'Calls', value: communicationStats.call || 0, icon: Phone, colour: C.green },
    { name: 'Emails', value: communicationStats.email || 0, icon: Mail, colour: C.blue },
    { name: 'Meetings', value: communicationStats.meeting || 0, icon: Video, colour: C.purple },
    { name: 'WhatsApp', value: communicationStats.whatsapp || 0, icon: MessageCircle, colour: '#25D366' },
    { name: 'SMS', value: communicationStats.sms || 0, icon: MessageSquare, colour: C.cyan },
    { name: 'Notes', value: communicationStats.note || 0, icon: FileText, colour: C.textTertiary },
  ].filter((d) => d.value > 0)

  // Customer satisfaction data
  const cs = customerSatisfaction as {
    score?: number; acceptanceRate?: number; responseScore?: number; complaintScore?: number;
  } | undefined

  // Market benchmarks data
  const mb = marketBenchmarks as {
    avgInstallationKwp?: number; avgPricePerKwp?: number; avgLeadToCloseDays?: number;
    avgConversionRate?: number; industryGrowth?: number;
  } | undefined

  // Forecast data
  const fr = forecastRevenue as {
    currentQuarter?: number; nextQuarter?: number;
    currentQuarterHigh?: number; currentQuarterLow?: number;
    nextQuarterHigh?: number; nextQuarterLow?: number;
  } | undefined

  // Grant stats data
  const gs = grantStats as {
    totalClaimed?: number; avgGrantValue?: number; applicationsSubmitted?: number;
    pendingApplications?: number; approvedApplications?: number; approvalRate?: number;
  } | undefined

  // Forecast chart data
  const forecastChartData = [
    { name: 'This Quarter', low: fr?.currentQuarterLow || 0, forecast: fr?.currentQuarter || 0, high: fr?.currentQuarterHigh || 0 },
    { name: 'Next Quarter', low: fr?.nextQuarterLow || 0, forecast: fr?.nextQuarter || 0, high: fr?.nextQuarterHigh || 0 },
  ]

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ padding: '24px 24px 40px', maxWidth: 1600, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 0: WELCOME BANNER + HEADER                                  */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
            {/* Welcome Banner */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                  style={{
                    background: `linear-gradient(135deg, ${C.yellow}18 0%, ${C.green}10 100%)`,
                    border: `1px solid ${C.yellow}25`,
                    borderRadius: 14,
                    padding: '16px 24px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: C.yellowMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Sun size={22} style={{ color: C.yellow }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                      {greeting} — {kpis.activeDeals || 0} deals in the pipeline worth {formatCurrency(kpis.totalPipelineValue || 0)}
                    </p>
                    <p style={{ fontSize: 13, color: C.textSecondary }}>
                      {overdueTasks > 0
                        ? `You have ${overdueTasks} overdue task${overdueTasks !== 1 ? 's' : ''} that need attention today.`
                        : 'No overdue tasks. You\'re on track for a productive day!'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWelcome(false)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: 'none', border: 'none',
                      color: C.textTertiary, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <XCircle size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '-0.025em', lineHeight: 1.25 }}>Dashboard</h1>
                  <LiveIndicator />
                </div>
                <p style={{ fontSize: 13, color: C.textSecondary, marginTop: 4, lineHeight: 1.5 }}>
                  Your solar business overview — real-time insights and performance metrics
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px', borderRadius: 8,
                  background: C.card, border: `1px solid ${C.border}`,
                  fontSize: 12, color: C.textSecondary, flexShrink: 0,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block', boxShadow: `0 0 8px ${C.green}50` }} />
                  {format(currentTime, 'EEE, MMM d, yyyy')}
                </div>
                <button
                  onClick={() => refetch()}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: C.card, border: `1px solid ${C.border}`,
                    color: C.textSecondary, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.yellow; e.currentTarget.style.color = C.yellow }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary }}
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div style={{ marginTop: 8 }}>
              <KeyboardShortcutsHint />
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 1: KPI STAT CARDS (7 cards — expanded)                     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel accent={C.yellow}>Key Performance Indicators</SectionLabel>
          <motion.div variants={fadeUp} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12, marginBottom: 20,
          }}>
            <StatCard
              title="Active Installers"
              value={installers.total || 0}
              subtitle={`${installers.newThisMonth || 0} new this month`}
              icon={Sun}
              trend={{ value: installers.total > 0 ? 12 : 0, positive: true }}
              delay={0}
              href="/crm/installers"
            />
            <StatCard
              title="Monthly Recurring"
              value={formatCurrency(installers.mrr || 0)}
              subtitle={`${installers.onboardingRate || 0}% onboarding`}
              icon={Zap}
              delay={0.05}
            />
            <StatCard
              title="Pipeline Value"
              value={formatCurrency(animatedPipeline)}
              subtitle={`${animatedActiveDeals} active deals`}
              icon={DollarSign}
              trend={{ value: pipelineTrend, positive: pipelineTrend >= 0 }}
              delay={0.1}
              href="/crm/pipeline"
            />
            <StatCard
              title="Win Rate"
              value={`${animatedConversion}%`}
              subtitle={`${kpis.wonDealsThisMonth || 0} won this month`}
              icon={TrendingUp}
              delay={0.15}
              href="/crm/reports"
            />
            <StatCard
              title="Activities"
              value={animatedActivities}
              subtitle="this week"
              icon={Activity}
              delay={0.2}
              href="/crm/activities"
            />
            <StatCard
              title="CSAT Score"
              value={`${cs?.score || 0}/100`}
              subtitle={cs?.score && cs.score >= 70 ? 'Good' : cs?.score && cs.score >= 50 ? 'Fair' : 'Needs work'}
              icon={Star}
              delay={0.25}
            />
            <StatCard
              title="Avg Deal Size"
              value={kpis.totalDeals > 0 ? formatCurrency(Math.round((kpis.pipelineValue + kpis.wonValue) / Math.max(kpis.totalDeals, 1))) : '€0'}
              subtitle={`${kpis.totalDeals || 0} total deals`}
              icon={BarChart3}
              delay={0.3}
            />
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 2: HEALTH + REVENUE CHART + FUNNEL + REVENUE FORECAST       */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel accent={C.blue}>Revenue & Pipeline</SectionLabel>
          <motion.div variants={fadeUp} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            {/* System Health Score */}
            <DarkCard>
              <CardHeader>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.greenMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Gauge size={13} style={{ color: C.green }} />
                  </div>
                }>Health</CardTitle>
              </CardHeader>
              <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <HealthRing score={Math.round(healthScore)} size={90} />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { label: 'Conversion', value: kpis.conversionRate || 0, max: 50, colour: C.yellow },
                    { label: 'Task Done', value: completionRate, max: 100, colour: C.green },
                    { label: 'Activity', value: Math.min(100, activitiesThisWeek * 5), max: 100, colour: C.blue },
                    { label: 'On-time', value: Math.max(0, 100 - overdueTasks * 20), max: 100, colour: overdueTasks === 0 ? C.green : C.red },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: C.textTertiary }}>{metric.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.text }}>{metric.value}%</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          background: metric.colour,
                          width: `${Math.min(100, (metric.value / metric.max) * 100)}%`,
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </DarkCard>

            {/* Revenue Area Chart */}
            <DarkCard hoverAccent={C.yellow}>
              <CardHeader
                action={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MiniSparkline data={revenueSparkData} colour={C.yellow} width={56} height={18} />
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: pipelineTrend >= 0 ? C.green : C.red,
                      display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                      {pipelineTrend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(pipelineTrend)}%
                    </span>
                  </div>
                }
              >
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.yellowMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BarChart3 size={13} style={{ color: C.yellow }} />
                  </div>
                }>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardBody style={{ padding: '6px 6px 14px' }}>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.yellow} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={C.yellow} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: C.textTertiary }}
                        tickLine={{ stroke: C.border }}
                        axisLine={{ stroke: C.border }}
                        tickFormatter={(v) => format(new Date(v + '-01'), 'MMM')}
                      />
                      <YAxis
                        tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: C.textTertiary }}
                        tickLine={{ stroke: C.border }}
                        axisLine={{ stroke: C.border }}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy')}
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={C.yellow}
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                        dot={{ fill: C.yellow, strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, fill: C.yellow, stroke: C.bg, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </DarkCard>

            {/* Pipeline Funnel with conversion rates */}
            <DarkCard hoverAccent={C.blue}>
              <CardHeader
                action={<Badge colour={C.blue} bg={C.blueMuted}>{(kpis.activeDeals || 0)} deals</Badge>}
              >
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.blueMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Target size={13} style={{ color: C.blue }} />
                  </div>
                }>Pipeline Funnel</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dealFunnel.length > 0 ? (
                    dealFunnel.map((stage: { stage: string; count: number; value: number }, i: number) => {
                      const width = Math.max(15, (stage.value / maxFunnelValue) * 100)
                      const prevCount = i > 0 ? dealFunnel[i - 1].count : stage.count
                      const convRate = i > 0 && prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0
                      return (
                        <motion.div
                          key={stage.stage}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary }}>{stage.stage}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {convRate > 0 && (
                                <span style={{
                                  fontSize: 10, fontWeight: 500, color: convRate >= 50 ? C.green : C.orange,
                                  background: convRate >= 50 ? C.greenMuted : C.orangeMuted,
                                  padding: '1px 6px', borderRadius: 4,
                                }}>
                                  {convRate}%
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: C.textTertiary }}>
                                {stage.count} &middot; {formatCurrency(stage.value)}
                              </span>
                            </div>
                          </div>
                          <div style={{ height: 24, borderRadius: 6, background: C.surface, overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ duration: 0.6, delay: 0.4 + i * 0.08, ease: 'easeOut' as const }}
                              style={{
                                height: '100%', borderRadius: 6,
                                background: `hsl(48, ${95 - i * 10}%, ${55 - i * 5}%)`,
                              }}
                            />
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <EmptyState icon={Target} message="No pipeline data yet" subtext="Create deals to see your funnel" />
                  )}
                  {overdueTasks > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        marginTop: 4, padding: '8px 12px', borderRadius: 8,
                        background: C.redMuted, border: `1px solid ${C.red}25`,
                        fontSize: 12, color: C.red,
                      }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span><strong>{overdueTasks}</strong> overdue task{overdueTasks !== 1 ? 's' : ''}</span>
                    </motion.div>
                  )}
                </div>
              </CardBody>
            </DarkCard>

            {/* Revenue Forecast */}
            <DarkCard hoverAccent={C.green}>
              <CardHeader action={<Badge colour={C.green} bg={C.greenMuted}>Forecast</Badge>}>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.greenMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TrendingUp size={13} style={{ color: C.green }} />
                  </div>
                }>Revenue Forecast</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Current Quarter */}
                  <div style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: C.surface, border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ fontSize: 10, color: C.textTertiary, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>This Quarter</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                      {formatCurrency(fr?.currentQuarter || 0)}
                    </div>
                    <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4 }}>
                      {formatCurrency(fr?.currentQuarterLow || 0)} — {formatCurrency(fr?.currentQuarterHigh || 0)}
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: C.border, marginTop: 8, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2,
                        background: C.green, opacity: 0.7,
                        width: `${Math.min(100, ((fr?.currentQuarterLow || 0) / Math.max(fr?.currentQuarterHigh || 1, 1)) * 100)}%`,
                      }} />
                    </div>
                  </div>
                  {/* Next Quarter */}
                  <div style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: C.surface, border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ fontSize: 10, color: C.textTertiary, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Next Quarter</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.textSecondary, lineHeight: 1.2 }}>
                      {formatCurrency(fr?.nextQuarter || 0)}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                      {formatCurrency(fr?.nextQuarterLow || 0)} — {formatCurrency(fr?.nextQuarterHigh || 0)}
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: C.border, marginTop: 8, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2,
                        background: C.blue, opacity: 0.5,
                        width: `${Math.min(100, ((fr?.nextQuarterLow || 0) / Math.max(fr?.nextQuarterHigh || 1, 1)) * 100)}%`,
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, textAlign: 'center' }}>
                    Weighted pipeline × stage probability
                  </div>
                </div>
              </CardBody>
            </DarkCard>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 3: AI INSIGHTS + COMMUNICATION HUB + ACTIVITY BREAKDOWN     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel accent={C.purple}>Intelligence & Communications</SectionLabel>
          <motion.div variants={fadeUp} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            {/* AI Insights */}
            <DarkCard hoverAccent={C.yellow} style={{ borderTop: `2px solid ${C.yellow}` }}>
              <CardHeader>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.yellowMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={13} style={{ color: C.yellow }} />
                  </div>
                }>AI Insights</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {aiInsights.length > 0 ? (
                    aiInsights.slice(0, 4).map((insight: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
                      >
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: C.yellow, marginTop: 6, flexShrink: 0,
                        }} />
                        <p style={{ fontSize: 12, lineHeight: 1.65, color: C.textSecondary }}>{insight}</p>
                      </motion.div>
                    ))
                  ) : (
                    <p style={{ fontSize: 12, color: C.textTertiary }}>Generating insights...</p>
                  )}
                  {avgDealCycleDays > 0 && (
                    <div style={{
                      paddingTop: 10, marginTop: 4,
                      borderTop: `1px solid ${C.border}`,
                      fontSize: 11, color: C.textTertiary,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Timer size={12} />
                      Avg. deal cycle: <span style={{ fontWeight: 600, color: C.textSecondary }}>{avgDealCycleDays} days</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </DarkCard>

            {/* Communication Hub — NEW */}
            <DarkCard hoverAccent={C.cyan}>
              <CardHeader
                action={<Badge colour={C.cyan} bg={C.cyanMuted}>
                  {Object.values(communicationStats as Record<string, number>).reduce((a: number, b: number) => a + b, 0)} total
                </Badge>}
              >
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.cyanMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <HeadphonesIcon size={13} style={{ color: C.cyan }} />
                  </div>
                }>Communication Hub</CardTitle>
              </CardHeader>
              <CardBody>
                {/* Channel stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {commData.slice(0, 6).map((ch) => (
                    <div key={ch.name} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 10px', borderRadius: 8,
                      background: C.surface, border: `1px solid ${C.border}`,
                    }}>
                      <ch.icon size={13} style={{ color: ch.colour, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ch.value}</div>
                        <div style={{ fontSize: 9, color: C.textTertiary, whiteSpace: 'nowrap' }}>{ch.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Recent communications timeline */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Recent</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
                    {(communicationTimeline as Array<{ id: string; type: string; subject: string; contact: string; createdAt: string }>).slice(0, 4).map((comm) => (
                      <div key={comm.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 6px', borderRadius: 6,
                      }}>
                        <ActivityIcon type={comm.type} size="sm" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {comm.subject}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted }}>
                            {comm.contact} &middot; {timeAgo(comm.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </DarkCard>

            {/* Activity Breakdown */}
            <DarkCard hoverAccent={C.green}>
              <CardHeader
                action={<Badge colour={C.yellow} bg={C.yellowMuted}>{activitiesThisWeek} this week</Badge>}
              >
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.greenMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Activity size={13} style={{ color: C.green }} />
                  </div>
                }>Activity Breakdown</CardTitle>
              </CardHeader>
              <CardBody>
                {pieData.length > 0 ? (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={48}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState icon={Activity} message="No activity data yet" />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                  {pieData.map((item, i) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0,
                      }} />
                      <span style={{ color: C.textTertiary }}>{item.name}</span>
                      <span style={{ fontWeight: 600, color: C.textSecondary, marginLeft: 'auto' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </DarkCard>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 4: SEAI GRANT TRACKER + CUSTOMER SATISFACTION */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel accent={C.green}>Grants & Satisfaction</SectionLabel>
          <motion.div variants={fadeUp} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            {/* SEAI Grant Tracker — NEW */}
            <DarkCard hoverAccent={C.yellow} style={{ borderTop: `2px solid ${C.yellow}` }}>
              <CardHeader action={<Badge colour={C.yellow} bg={C.yellowMuted}>SEAI</Badge>}>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.yellowMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Award size={13} style={{ color: C.yellow }} />
                  </div>
                }>Grant Tracker</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Total Claimed', value: formatCurrency(gs?.totalClaimed || 0), colour: C.green, bg: C.greenMuted },
                      { label: 'Avg. Grant Value', value: formatCurrency(gs?.avgGrantValue || 0), colour: C.yellow, bg: C.yellowMuted },
                      { label: 'Pending', value: String(gs?.pendingApplications || 0), colour: C.orange, bg: C.orangeMuted },
                      { label: 'Approval Rate', value: `${gs?.approvalRate || 0}%`, colour: C.blue, bg: C.blueMuted },
                    ].map((item) => (
                      <div key={item.label} style={{
                        padding: '10px 12px', borderRadius: 8,
                        background: C.surface, border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ fontSize: 9, color: C.textTertiary, marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.03em' }}>{item.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: item.colour }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.textTertiary }}>Applications progress</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.text }}>
                        {gs?.approvedApplications || 0}/{gs?.applicationsSubmitted || 0}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: C.surface, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg, ${C.yellow}, ${C.green})`,
                        width: `${gs?.applicationsSubmitted ? Math.min(100, ((gs?.approvedApplications || 0) / gs?.applicationsSubmitted) * 100) : 0}%`,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, color: C.textMuted, textAlign: 'center',
                    padding: '6px 10px', borderRadius: 6,
                    background: C.yellowMuted, border: `1px solid ${C.yellow}15`,
                  }}>
                    ☀️ SEAI Domestic Solar PV Grant: Up to €2,400 available for homeowners
                  </div>
                </div>
              </CardBody>
            </DarkCard>

            {/* Customer Satisfaction Score — NEW */}
            <DarkCard hoverAccent={C.purple}>
              <CardHeader action={<Badge colour={cs?.score && cs.score >= 70 ? C.green : C.orange} bg={cs?.score && cs.score >= 70 ? C.greenMuted : C.orangeMuted}>
                {cs?.score && cs.score >= 70 ? 'Good' : cs?.score && cs.score >= 50 ? 'Fair' : 'Low'}
              </Badge>}>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.purpleMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Star size={13} style={{ color: C.purple }} />
                  </div>
                }>Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  {/* Big score ring */}
                  <HealthRing score={cs?.score || 0} size={100} />
                  {/* Component breakdown */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Proposal Acceptance', value: cs?.acceptanceRate || 0, weight: '40%', colour: C.yellow },
                      { label: 'Response Time', value: cs?.responseScore || 0, weight: '35%', colour: C.blue },
                      { label: 'Complaint Score', value: cs?.complaintScore || 0, weight: '25%', colour: C.green },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: C.textSecondary }}>
                            {metric.label}
                            <span style={{ color: C.textMuted, marginLeft: 4, fontSize: 9 }}>({metric.weight})</span>
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{metric.value}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            background: metric.colour,
                            width: `${metric.value}%`,
                            transition: 'width 0.8s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </DarkCard>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 5: WEEKLY PERF + SOLAR METRICS + MARKET COMPARISON + LEAD SRC */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel accent={C.orange}>Performance & Market</SectionLabel>
          <motion.div variants={fadeUp} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            {/* Weekly Performance Chart */}
            <DarkCard hoverAccent={C.cyan}>
              <CardHeader>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.cyanMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CalendarDays size={13} style={{ color: C.cyan }} />
                  </div>
                }>Weekly Performance</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyPerformance} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: C.textTertiary }}
                        tickLine={{ stroke: C.border }}
                        axisLine={{ stroke: C.border }}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="calls" fill={C.yellow} radius={[3, 3, 0, 0]} name="Calls" />
                      <Bar dataKey="emails" fill={C.blue} radius={[3, 3, 0, 0]} name="Emails" />
                      <Bar dataKey="meetings" fill={C.green} radius={[3, 3, 0, 0]} name="Meetings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 6 }}>
                  {[
                    { label: 'Calls', colour: C.yellow },
                    { label: 'Emails', colour: C.blue },
                    { label: 'Meetings', colour: C.green },
                  ].map((l) => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: l.colour }} />
                      <span style={{ color: C.textTertiary }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </DarkCard>

            {/* Solar Metrics */}
            <DarkCard hoverAccent={C.yellow}>
              <CardHeader>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.yellowMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sun size={13} style={{ color: C.yellow }} />
                  </div>
                }>Solar Metrics</CardTitle>
              </CardHeader>
              <CardBody>
                {solarMetrics.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(solarMetrics as Array<{ label: string; value: string; trend: string; positive: boolean }>).map((metric, i) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                        style={{
                          padding: '12px 14px', borderRadius: 8,
                          background: C.surface, border: `1px solid ${C.border}`,
                        }}
                      >
                        <div style={{ fontSize: 10, color: C.textTertiary, marginBottom: 4, lineHeight: 1.3 }}>
                          {metric.label}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                          {metric.value}
                        </div>
                        <div style={{
                          fontSize: 10, fontWeight: 600, marginTop: 4,
                          color: metric.positive ? C.green : C.red,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          {metric.positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {metric.trend}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Sun} message="No solar metrics yet" />
                )}
              </CardBody>
            </DarkCard>

            {/* Market Comparison — NEW */}
            <DarkCard hoverAccent={C.orange}>
              <CardHeader action={<Badge colour={C.orange} bg={C.orangeMuted}>IE Market</Badge>}>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.orangeMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Globe size={13} style={{ color: C.orange }} />
                  </div>
                }>Market Comparison</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    {
                      label: 'Avg. Install Size',
                      yourValue: `${mb?.avgInstallationKwp || 5.8} kWp`,
                      marketValue: `${mb?.avgInstallationKwp || 5.8} kWp`,
                      equal: true,
                    },
                    {
                      label: 'Price/kWp',
                      yourValue: `€${(mb?.avgPricePerKwp || 1800).toLocaleString('en-IE')}`,
                      marketValue: `€${(mb?.avgPricePerKwp || 1800).toLocaleString('en-IE')}`,
                      equal: true,
                    },
                    {
                      label: 'Lead-to-Close',
                      yourValue: `${avgDealCycleDays || mb?.avgLeadToCloseDays || 21} days`,
                      marketValue: `${mb?.avgLeadToCloseDays || 21} days`,
                      better: (avgDealCycleDays || 21) <= (mb?.avgLeadToCloseDays || 21),
                    },
                    {
                      label: 'Conversion Rate',
                      yourValue: `${kpis.conversionRate || 0}%`,
                      marketValue: `${mb?.avgConversionRate || 24}%`,
                      better: (kpis.conversionRate || 0) >= (mb?.avgConversionRate || 24),
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: C.textSecondary }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{item.yourValue}</span>
                          {!item.equal && (
                            <span style={{
                              fontSize: 9, fontWeight: 600,
                              color: (item as { better?: boolean }).better ? C.green : C.orange,
                            }}>
                              {item.marketValue}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.equal && (
                        <span style={{ fontSize: 9, color: C.textMuted }}>Irish avg: {item.marketValue}</span>
                      )}
                    </div>
                  ))}
                  <div style={{
                    marginTop: 4, padding: '8px 12px', borderRadius: 8,
                    background: C.orangeMuted, border: `1px solid ${C.orange}15`,
                    fontSize: 10, color: C.orange,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <TrendingUp size={12} />
                    Irish solar market growing {mb?.industryGrowth || 32}% YoY
                  </div>
                </div>
              </CardBody>
            </DarkCard>

            {/* Lead Sources */}
            <DarkCard hoverAccent={C.purple}>
              <CardHeader>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.purpleMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Megaphone size={13} style={{ color: C.purple }} />
                  </div>
                }>Lead Sources</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {leadSourceData.length > 0 ? (
                    leadSourceData.map((source: { source: string; value: number }, i: number) => (
                      <motion.div
                        key={source.source}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary }}>{source.source}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{source.value}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: C.surface, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${source.value}%` }}
                            transition={{ duration: 0.6, delay: 0.4 + i * 0.06 }}
                            style={{ height: '100%', borderRadius: 3, background: LEAD_SOURCE_COLOURS[i % LEAD_SOURCE_COLOURS.length] }}
                          />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <EmptyState icon={Megaphone} message="No lead source data yet" />
                  )}
                </div>
              </CardBody>
            </DarkCard>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 6: QUICK ACTIONS + TEAM LEADERBOARD + CONVERSION FUNNEL    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel accent={C.cyan}>Actions & Team</SectionLabel>
          <motion.div variants={fadeUp} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            {/* Quick Actions Panel — ENHANCED */}
            <DarkCard>
              <CardHeader>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.orangeMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Zap size={13} style={{ color: C.orange }} />
                  </div>
                }>Quick Actions</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { href: '/crm/proposals/new', icon: FileText, label: 'Create Proposal', colour: C.yellow },
                    { href: '/crm/activities/new?type=call', icon: Phone, label: 'Log Call', colour: C.green },
                    { href: '/crm/calendar/new', icon: CalendarDays, label: 'Schedule Meeting', colour: C.purple },
                    { href: '/crm/activities/new?type=email', icon: Send, label: 'Send Follow-up', colour: C.blue },
                    { href: '/crm/invoices/new', icon: Receipt, label: 'Generate Invoice', colour: C.cyan },
                    { href: '/crm/ai', icon: Bot, label: 'AI Chat', colour: C.orange },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 6,
                        padding: '12px 6px', borderRadius: 8,
                        background: C.surface,
                        border: `1px solid transparent`,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = action.colour + '25'
                        e.currentTarget.style.background = C.card2
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.background = C.surface
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: action.colour + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.2s',
                      }}>
                        <action.icon size={15} style={{ color: action.colour }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, color: C.textSecondary, textAlign: 'center', lineHeight: 1.3 }}>{action.label}</span>
                    </Link>
                  ))}
                </div>
                {/* Navigation shortcuts */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { href: '/crm/installers', icon: Sun, label: 'Installers' },
                    { href: '/crm/pipeline', icon: Handshake, label: 'Pipeline' },
                    { href: '/crm/contacts', icon: UserPlus, label: 'Contacts' },
                    { href: '/crm/tasks', icon: CheckCircle2, label: 'Tasks' },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px', borderRadius: 6,
                        background: C.surface, border: `1px solid ${C.border}`,
                        textDecoration: 'none', fontSize: 10, color: C.textTertiary,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.borderColor = C.borderLight }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = C.textTertiary; e.currentTarget.style.borderColor = C.border }}
                    >
                      <action.icon size={11} />
                      {action.label}
                    </Link>
                  ))}
                </div>
              </CardBody>
            </DarkCard>

            {/* Team Leaderboard */}
            <DarkCard hoverAccent={C.yellow}>
              <CardHeader action={<ViewAllLink href="/crm/contacts" />}>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.yellowMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trophy size={13} style={{ color: C.yellow }} />
                  </div>
                }>Team Leaderboard</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {teamLeaderboard.length > 0 ? (
                    (teamLeaderboard as Array<{ name: string; deals: number; value: number; avatar: string; colour: string }>).map((member, i) => (
                      <motion.div
                        key={member.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 8,
                          background: i === 0 ? C.yellowMuted : 'transparent',
                          border: i === 0 ? `1px solid ${C.yellow}20` : '1px solid transparent',
                        }}
                      >
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: i === 0 ? C.yellow : C.textTertiary,
                          width: 18, textAlign: 'center', flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: member.colour + '20',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: member.colour }}>{member.avatar}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: 10, color: C.textTertiary }}>{member.deals} deals</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>
                          {formatCurrency(member.value)}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <EmptyState icon={Trophy} message="No team data yet" />
                  )}
                </div>
              </CardBody>
            </DarkCard>

            {/* Conversion Funnel */}
            <DarkCard hoverAccent={C.blue}>
              <CardHeader>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.blueMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CircleCheckBig size={13} style={{ color: C.blue }} />
                  </div>
                }>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {conversionFunnel.length > 0 ? (
                    conversionFunnel.map((stage: { stage: string; count: number; value: number }, i: number) => {
                      const maxCount = Math.max(...conversionFunnel.map((s: { count: number }) => s.count), 1)
                      const width = Math.max(15, (stage.count / maxCount) * 100)
                      const colours = [C.textMuted, C.blue, C.yellow, C.green, C.red, C.orange]
                      return (
                        <motion.div
                          key={stage.stage}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.06 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary }}>{stage.stage}</span>
                            <span style={{ fontSize: 11, color: C.textTertiary }}>
                              {stage.count} &middot; {formatCurrency(stage.value)}
                            </span>
                          </div>
                          <div style={{ height: 20, borderRadius: 5, background: C.surface, overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ duration: 0.5, delay: 0.4 + i * 0.06 }}
                              style={{ height: '100%', borderRadius: 5, background: colours[i % colours.length] }}
                            />
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <EmptyState icon={CircleCheckBig} message="No conversion data yet" subtext="Send proposals to track" />
                  )}
                </div>
              </CardBody>
            </DarkCard>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 7: TOP CONTACTS + TASKS + RECENT ACTIVITY                  */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel accent={C.green}>Contacts & Activity</SectionLabel>
          <motion.div variants={fadeUp} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            {/* Top Contacts */}
            <DarkCard hoverAccent={C.green}>
              <CardHeader action={<ViewAllLink href="/crm/contacts" />}>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.greenMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={13} style={{ color: C.green }} />
                  </div>
                }>Top Contacts</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {topContacts.length > 0 ? (
                    topContacts.slice(0, 5).map((tc: { contact: { id: string; firstName: string; lastName: string; email?: string }; totalDealValue: number; dealCount: number }, i: number) => (
                      <Link
                        key={tc.contact.id}
                        href={`/crm/contacts/${tc.contact.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 8px', borderRadius: 8,
                          textDecoration: 'none', transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: C.yellowMuted,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.bg }}>
                            {tc.contact.firstName[0]}{tc.contact.lastName[0]}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tc.contact.firstName} {tc.contact.lastName}
                          </p>
                          <p style={{ fontSize: 10, color: C.textTertiary }}>{tc.dealCount} deal{tc.dealCount !== 1 ? 's' : ''}</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>
                          {formatCurrency(tc.totalDealValue)}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <EmptyState icon={Users} message="No contact data yet" />
                  )}
                </div>
              </CardBody>
            </DarkCard>

            {/* Tasks */}
            <DarkCard hoverAccent={C.orange}>
              <CardHeader action={<ViewAllLink href="/crm/tasks" />}>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.orangeMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={13} style={{ color: C.orange }} />
                  </div>
                }>Tasks</CardTitle>
              </CardHeader>
              <CardBody>
                {taskPieData.length > 0 ? (
                  <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={34}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {taskPieData.map((_, index) => (
                            <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState icon={CheckCircle2} message="No tasks yet" />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6, maxHeight: 150, overflowY: 'auto' }}>
                  {upcomingTasks.length > 0 ? (
                    upcomingTasks.slice(0, 5).map((task: Record<string, unknown>) => (
                      <div key={task.id as string} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 8px', borderRadius: 6,
                        transition: 'background-color 0.15s',
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title as string}
                          </p>
                        </div>
                        <PriorityBadge priority={task.priority as string} />
                        {task.dueDate ? (
                          <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: C.textTertiary, flexShrink: 0 }}>
                            <Clock size={10} />
                            {format(new Date(String(task.dueDate)), 'MMM d')}
                          </span>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 12, textAlign: 'center', padding: '12px 0', color: C.textTertiary }}>No upcoming tasks</p>
                  )}
                </div>
              </CardBody>
            </DarkCard>

            {/* Recent Activity */}
            <DarkCard hoverAccent={C.blue}>
              <CardHeader action={<ViewAllLink href="/crm/activities" />}>
                <CardTitle icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: C.blueMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CircleDot size={13} style={{ color: C.blue }} />
                  </div>
                }>Recent Activity</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 250, overflowY: 'auto' }}>
                  {recentActivities.length > 0 ? (
                    recentActivities.slice(0, 8).map((activity: Record<string, unknown>) => (
                      <div key={activity.id as string} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '7px 8px', borderRadius: 6,
                        transition: 'background-color 0.15s',
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <ActivityIcon type={activity.type as string} size="sm" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activity.subject as string}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                            <span style={{ fontSize: 10, color: C.textTertiary }}>
                              {activity.contact
                                ? `${(activity.contact as Record<string, string>).firstName} ${(activity.contact as Record<string, string>).lastName}`
                                : 'System'}
                            </span>
                            <span style={{ color: C.borderLight }}>&middot;</span>
                            <span style={{ fontSize: 10, color: C.textTertiary }}>{timeAgo(activity.createdAt as string)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState icon={CircleDot} message="No recent activity" />
                  )}
                </div>
              </CardBody>
            </DarkCard>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ROW 8: KEY METRICS FOOTER                                       */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <motion.div variants={fadeUp} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
          }}>
            {[
              { label: 'Total Contacts', value: kpis.totalContacts || 0, icon: Users, colour: C.green },
              { label: 'Avg. Deal Cycle', value: `${avgDealCycleDays}d`, icon: Timer, colour: C.orange },
              { label: 'Won This Month', value: kpis.wonDealsThisMonth || 0, icon: Trophy, colour: C.yellow },
              { label: 'Lost This Month', value: kpis.lostDealsThisMonth || 0, icon: XCircle, colour: C.red },
              { label: 'Total Deals', value: kpis.totalDeals || 0, icon: ShoppingCart, colour: C.blue },
              { label: 'Weighted Pipeline', value: formatCurrency(kpis.weightedPipelineValue || 0), icon: BarChart3, colour: C.purple },
              { label: 'SEAI Grants', value: formatCurrency(gs?.totalClaimed || 0), icon: Award, colour: C.teal },
              { label: 'kWp Installed', value: `${(kpis as Record<string, unknown>)?.totalKwp || 0}`, icon: Sun, colour: C.yellow },
            ].map((metric) => (
              <div key={metric.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 10,
                background: C.card, border: `1px solid ${C.border}`,
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = metric.colour + '30' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: metric.colour + '12',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <metric.icon size={14} style={{ color: metric.colour }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: C.textTertiary }}>{metric.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{metric.value}</div>
                </div>
              </div>
            ))}
          </motion.div>

        </motion.div>

      {/* Command Palette Hint */}
      <CommandPaletteHint />
    </div>
  )
}
