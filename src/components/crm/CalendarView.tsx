'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCRM } from '@/components/crm/CRMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarLucide,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  FileText,
  Clock,
  MapPin,
  AlertTriangle,
  Presentation,
  CalendarDays,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'
import { toast } from 'sonner'

// ============================================================================
// DESIGN SYSTEM
// ============================================================================
const DARK = '#080808'
const DARK_CENTER = '#0C0C0C'
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
const PURPLE = '#A78BFA'
const ORANGE = '#FB923C'
const CARD_RADIUS = 16

// ============================================================================
// FRAMER MOTION VARIANTS
// ============================================================================
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

// ============================================================================
// ACTIVITY TYPE CONFIG
// ============================================================================
const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  meeting: { icon: Users, color: PURPLE, bg: 'rgba(167,139,250,0.10)', label: 'Meeting' },
  call: { icon: Phone, color: GREEN, bg: 'rgba(16,185,129,0.10)', label: 'Call' },
  email: { icon: Mail, color: BLUE, bg: 'rgba(59,130,246,0.10)', label: 'Email' },
  demo: { icon: Presentation, color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', label: 'Demo' },
  proposal: { icon: FileText, color: ORANGE, bg: 'rgba(251,146,60,0.10)', label: 'Proposal' },
  task: { icon: CheckCircle2, color: YELLOW, bg: 'rgba(243,216,64,0.10)', label: 'Task' },
  note: { icon: FileText, color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)', label: 'Note' },
  system: { icon: AlertTriangle, color: ORANGE, bg: 'rgba(251,146,60,0.10)', label: 'System' },
}

// ============================================================================
// TYPES
// ============================================================================
interface CalendarActivity {
  id: string
  type: string
  title: string
  content: string | null
  companyName: string
  dealId: string | null
  userName: string
  createdAt: string
}

type ViewMode = 'month' | 'week'

// ============================================================================
// SKELETON LOADING
// ============================================================================
function CalendarSkeleton() {
  return (
    <div style={{
      padding: '24px clamp(16px, 4vw, 48px)',
      background: `radial-gradient(ellipse at 50% 0%, ${DARK_CENTER} 0%, ${DARK} 70%)`,
      minHeight: '100vh',
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {/* Header skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, maxWidth: 1440, margin: '0 auto 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(90deg, ${CARD_BG} 25%, rgba(255,255,255,0.03) 50%, ${CARD_BG} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          <div>
            <div style={{ width: 120, height: 22, borderRadius: 8, background: `linear-gradient(90deg, ${CARD_BG} 25%, rgba(255,255,255,0.03) 50%, ${CARD_BG} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            <div style={{ width: 180, height: 14, borderRadius: 6, marginTop: 6, background: `linear-gradient(90deg, ${CARD_BG} 25%, rgba(255,255,255,0.03) 50%, ${CARD_BG} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite 0.2s' }} />
          </div>
        </div>
      </div>
      {/* Calendar grid skeleton */}
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: CARD_RADIUS, padding: 24 }}>
          {/* Nav skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(90deg, ${CARD_BG} 25%, rgba(255,255,255,0.03) 50%, ${CARD_BG} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              <div style={{ width: 200, height: 20, borderRadius: 8, background: `linear-gradient(90deg, ${CARD_BG} 25%, rgba(255,255,255,0.03) 50%, ${CARD_BG} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite 0.1s' }} />
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(90deg, ${CARD_BG} 25%, rgba(255,255,255,0.03) 50%, ${CARD_BG} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
          </div>
          {/* Day cells skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} style={{ minHeight: 90, padding: 8, borderRadius: 10, background: `linear-gradient(90deg, rgba(255,255,255,0.01) 25%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.01) 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite', animationDelay: `${i * 0.03}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// NEW ACTIVITY FORM
// ============================================================================
function NewActivityForm({ onClose, onSuccess, prefillDate }: { onClose: () => void; onSuccess: () => void; prefillDate?: string }) {
  const [type, setType] = useState('meeting')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(prefillDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: title.trim(), content: content.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create activity')
      toast.success(`${typeConfig[type]?.label || 'Activity'} created`)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const activityTypes = ['meeting', 'call', 'email', 'demo', 'task', 'note', 'proposal'] as const

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: CARD_BG,
          border: `1px solid ${BORDER_HOVER}`,
          borderRadius: CARD_RADIUS,
          padding: 32,
          width: '100%',
          maxWidth: 480,
          margin: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>Log Activity</h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_SECONDARY, padding: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Activity type selector */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, display: 'block', marginBottom: 6 }}>Type</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {activityTypes.map((t) => {
                const cfg = typeConfig[t]
                const Icon = cfg.icon
                const isActive = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: isActive ? `${cfg.color}20` : 'rgba(255,255,255,0.03)',
                      color: isActive ? cfg.color : TEXT_TERTIARY,
                      fontSize: 12, fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 6,
                      border: `1px solid ${isActive ? `${cfg.color}30` : BORDER}`,
                    }}
                  >
                    <Icon size={13} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, display: 'block', marginBottom: 6 }}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Discovery call with Acme Solar"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${BORDER_HOVER}`, background: 'rgba(255,255,255,0.04)',
                color: TEXT_PRIMARY, fontSize: 14, fontFamily: 'inherit', outline: 'none',
              }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, display: 'block', marginBottom: 6 }}>Date & Time *</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${BORDER_HOVER}`, background: 'rgba(255,255,255,0.04)',
                color: TEXT_PRIMARY, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, display: 'block', marginBottom: 6 }}>Notes</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Activity notes..."
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${BORDER_HOVER}`, background: 'rgba(255,255,255,0.04)',
                color: TEXT_PRIMARY, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: RED, margin: 0 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: 10, border: `1px solid ${BORDER}`,
                background: 'transparent', color: TEXT_SECONDARY, fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={loading || !title.trim()}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: YELLOW, color: DARK, fontSize: 14, fontWeight: 600,
                cursor: loading || !title.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: loading || !title.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Log Activity'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// ACTIVITY CARD (used in side panel)
// ============================================================================
function ActivityCard({ activity, onClick }: { activity: CalendarActivity; onClick?: () => void }) {
  const cfg = typeConfig[activity.type] || typeConfig.note
  const Icon = cfg.icon
  const actDate = parseISO(activity.createdAt)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${BORDER}`,
        transition: 'border-color 0.15s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = BORDER_HOVER; if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: cfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} style={{ color: cfg.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activity.title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: cfg.color, background: `${cfg.color}15`,
              padding: '2px 6px', borderRadius: 4, textTransform: 'capitalize',
            }}>
              {activity.type}
            </span>
            <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>
              {format(actDate, 'HH:mm')}
            </span>
          </div>
          {activity.companyName && activity.companyName !== 'Unknown' && (
            <p style={{ fontSize: 11, color: TEXT_SECONDARY, margin: '6px 0 0' }}>
              {activity.companyName}
            </p>
          )}
          {activity.userName && activity.userName !== 'Unknown' && (
            <p style={{ fontSize: 11, color: TEXT_TERTIARY, margin: '2px 0 0' }}>
              by {activity.userName}
            </p>
          )}
          {activity.content && (
            <p style={{ fontSize: 11, color: TEXT_TERTIARY, margin: '6px 0 0', lineHeight: 1.5 }}>
              {activity.content.length > 100 ? activity.content.slice(0, 100) + '...' : activity.content}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN CALENDAR VIEW
// ============================================================================
export function CalendarView() {
  const router = useRouter()
  const { loading: authLoading } = useCRM()
  const queryClient = useQueryClient()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [showNewActivity, setShowNewActivity] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  // Date range for the visible calendar
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Fetch activities from dedicated calendar API
  const { data, isLoading } = useQuery({
    queryKey: ['calendar-activities', format(calStart, 'yyyy-MM-dd'), format(calEnd, 'yyyy-MM-dd'), typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: format(calStart, "yyyy-MM-dd'T'00:00:00"),
        end: format(calEnd, "yyyy-MM-dd'T'23:59:59"),
      })
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/crm/calendar?${params}`)
      if (res.status === 401) { router.push('/crm/login'); throw new Error('Unauthorized') }
      if (!res.ok) throw new Error('Failed to fetch calendar data')
      return res.json()
    },
    enabled: !authLoading,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const calendarActivities: CalendarActivity[] = data?.activities ?? []

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const map: Record<string, CalendarActivity[]> = {}
    for (const a of calendarActivities) {
      try {
        const dateKey = format(parseISO(a.createdAt), 'yyyy-MM-dd')
        if (!map[dateKey]) map[dateKey] = []
        map[dateKey].push(a)
      } catch {
        // skip invalid dates
      }
    }
    return map
  }, [calendarActivities])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let day = calStart
    while (day <= calEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [calStart, calEnd])

  // Generate week days for week view
  const weekDays = useMemo(() => {
    const refDate = selectedDate || new Date()
    const weekStart = startOfWeek(refDate, { weekStartsOn: 1 })
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    return days
  }, [selectedDate])

  // Selected date activities
  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return activitiesByDate[key] || []
  }, [selectedDate, activitiesByDate])

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }

  const handleActivityCreated = useCallback(() => {
    setShowNewActivity(false)
    queryClient.invalidateQueries({ queryKey: ['calendar-activities'] })
  }, [queryClient])

  const handleActivityClick = useCallback((activity: CalendarActivity) => {
    if (activity.dealId) {
      router.push(`/crm/companies`)
      // The deal detail would be accessed through the company page
    }
  }, [router])

  // Stats for selected month (must be before early return to satisfy rules of hooks)
  const filterTypes = ['meeting', 'call', 'email', 'demo', 'task', 'proposal', 'note']
  const monthStats = useMemo(() => {
    const stats: Record<string, number> = {}
    for (const t of filterTypes) stats[t] = 0
    for (const a of calendarActivities) {
      if (stats[a.type] !== undefined) stats[a.type]++
    }
    return stats
  }, [calendarActivities])

  if (isLoading) return <CalendarSkeleton />

  const viewModes: { key: ViewMode; label: string }[] = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
  ]

  return (
    <div style={{
      padding: '24px clamp(16px, 4vw, 48px)',
      background: `radial-gradient(ellipse at 50% 0%, ${DARK_CENTER} 0%, ${DARK} 70%)`,
      minHeight: '100vh',
    }}>
      {/* ─── Header ─── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, maxWidth: 1440, margin: '0 auto 24px', flexWrap: 'wrap', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(145deg, ${YELLOW}20, ${YELLOW}08)`,
            border: `1px solid ${YELLOW}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${YELLOW}08`,
          }}>
            <CalendarDays size={20} style={{ color: YELLOW }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.2 }}>Calendar</h1>
            <p style={{ fontSize: 13, color: TEXT_TERTIARY, margin: '4px 0 0' }}>
              Track meetings, calls, tasks &amp; all activities
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Type filter pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {filterTypes.map((t) => {
              const cfg = typeConfig[t]
              const isActive = typeFilter === t
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(isActive ? null : t)}
                  style={{
                    padding: '5px 10px', borderRadius: 7, border: 'none',
                    background: isActive ? `${cfg.color}20` : 'rgba(255,255,255,0.03)',
                    color: isActive ? cfg.color : TEXT_TERTIARY,
                    fontSize: 11, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${isActive ? `${cfg.color}30` : 'transparent'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {/* View mode tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, gap: 2 }}>
            {viewModes.map((vm) => (
              <button
                key={vm.key}
                onClick={() => setViewMode(vm.key)}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none',
                  background: viewMode === vm.key ? `${YELLOW}18` : 'transparent',
                  color: viewMode === vm.key ? YELLOW : TEXT_SECONDARY,
                  fontSize: 13, fontWeight: viewMode === vm.key ? 600 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                {vm.label}
              </button>
            ))}
          </div>

          {/* New Activity button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewActivity(true)}
            style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: YELLOW, color: DARK, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 12px rgba(243,216,64,0.15)',
            }}
          >
            <Plus size={16} />
            Log Activity
          </motion.button>
        </div>
      </motion.div>

      {/* ─── Main content ─── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, maxWidth: 1440, margin: '0 auto' }}
        className="crm-calendar-grid"
      >
        {/* ─── Calendar grid ─── */}
        <motion.div
          variants={scaleIn}
          style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: CARD_RADIUS,
            padding: 24,
            overflow: 'hidden',
          }}
        >
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={goToPrevMonth}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT_SECONDARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = TEXT_PRIMARY }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_SECONDARY }}
              >
                <ChevronLeft size={18} />
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: TEXT_PRIMARY, margin: 0, minWidth: 200, textAlign: 'center' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={goToNextMonth}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT_SECONDARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = TEXT_PRIMARY }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_SECONDARY }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={goToToday}
              style={{
                padding: '7px 14px', borderRadius: 8, border: `1px solid ${BORDER}`,
                background: 'transparent', color: TEXT_SECONDARY, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = TEXT_PRIMARY }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_SECONDARY }}
            >
              Today
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: TEXT_TERTIARY,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '8px 0',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* ─── Month View ─── */}
          {viewMode === 'month' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const dayActivities = activitiesByDate[dateKey] || []
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isTodayDate = isToday(day)
                const activityTypes = [...new Set(dayActivities.map((a) => a.type))]

                return (
                  <motion.button
                    key={dateKey}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDate(day)}
                    style={{
                      minHeight: 90,
                      padding: 8,
                      borderRadius: 10,
                      border: isSelected ? `1px solid ${YELLOW}50` : '1px solid transparent',
                      background: isSelected ? `${YELLOW}08` : isTodayDate ? 'rgba(255,255,255,0.03)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      opacity: isCurrentMonth ? 1 : 0.3,
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = isTodayDate ? 'rgba(255,255,255,0.03)' : 'transparent'
                    }}
                  >
                    {/* Day number */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isTodayDate ? 700 : 500,
                          color: isTodayDate ? YELLOW : isCurrentMonth ? TEXT_PRIMARY : TEXT_TERTIARY,
                          lineHeight: 1,
                        }}
                      >
                        {format(day, 'd')}
                      </span>
                      {isTodayDate && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, color: YELLOW, background: `${YELLOW}18`,
                          padding: '1px 5px', borderRadius: 6,
                        }}>
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* Activity cards preview */}
                    {dayActivities.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                        {/* Colored dots for types */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {activityTypes.slice(0, 4).map((type) => {
                            const cfg = typeConfig[type]
                            return cfg ? (
                              <div
                                key={type}
                                style={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  background: cfg.color,
                                  boxShadow: `0 0 6px ${cfg.color}40`,
                                }}
                                title={cfg.label}
                              />
                            ) : null
                          })}
                          {dayActivities.length > 4 && (
                            <span style={{ fontSize: 9, color: TEXT_TERTIARY, lineHeight: '6px' }}>+{dayActivities.length - 4}</span>
                          )}
                        </div>

                        {/* Activity preview cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {dayActivities.slice(0, 2).map((a) => {
                            const cfg = typeConfig[a.type] || typeConfig.note
                            return (
                              <div
                                key={a.id}
                                style={{
                                  fontSize: 9,
                                  color: cfg.color,
                                  background: `${cfg.color}10`,
                                  padding: '2px 5px',
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontWeight: 500,
                                  lineHeight: 1.3,
                                }}
                              >
                                {a.title}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Activity count badge */}
                    {dayActivities.length > 2 && (
                      <div style={{
                        marginTop: 'auto',
                        fontSize: 10,
                        fontWeight: 600,
                        color: TEXT_TERTIARY,
                        textAlign: 'right',
                      }}>
                        +{dayActivities.length - 2} more
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* ─── Week View ─── */}
          {viewMode === 'week' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {weekDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const dayActivities = activitiesByDate[dateKey] || []
                const isTodayDate = isToday(day)
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <motion.div
                    key={dateKey}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: weekDays.indexOf(day) * 0.05 }}
                    onClick={() => setSelectedDate(day)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 14px',
                      borderRadius: 10, cursor: 'pointer',
                      background: isSelected ? `${YELLOW}08` : 'transparent',
                      border: isSelected ? `1px solid ${YELLOW}30` : `1px solid ${BORDER}`,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ minWidth: 60, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {format(day, 'EEE')}
                      </div>
                      <div style={{
                        fontSize: 20, fontWeight: 700, color: isTodayDate ? YELLOW : TEXT_PRIMARY,
                        lineHeight: 1.2, marginTop: 2,
                      }}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {dayActivities.length === 0 ? (
                        <span style={{ fontSize: 12, color: TEXT_TERTIARY, fontStyle: 'italic' }}>No activities</span>
                      ) : (
                        dayActivities.slice(0, 4).map((a) => {
                          const cfg = typeConfig[a.type] || typeConfig.note
                          const TypeIcon = cfg.icon
                          return (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 7, background: cfg.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                <TypeIcon size={13} style={{ color: cfg.color }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {a.title}
                                </p>
                                <p style={{ fontSize: 11, color: TEXT_TERTIARY, margin: '2px 0 0' }}>
                                  {a.companyName} &middot; {format(parseISO(a.createdAt), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      {dayActivities.length > 4 && (
                        <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontStyle: 'italic' }}>
                          +{dayActivities.length - 4} more activities
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontWeight: 500 }}>Activity types:</span>
            {filterTypes.map((key) => {
              const cfg = typeConfig[key]
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                  <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>{cfg.label}</span>
                  {monthStats[key] > 0 && (
                    <span style={{ fontSize: 10, color: TEXT_TERTIARY, fontWeight: 600, fontFamily: 'monospace' }}>
                      {monthStats[key]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ─── Activity detail side panel ─── */}
        <motion.div
          variants={fadeUp}
          style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: CARD_RADIUS,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 140px)',
            position: 'sticky',
            top: 24,
          }}
          className="crm-calendar-sidepanel"
        >
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
                {selectedDate ? format(selectedDate, 'd MMMM yyyy') : 'Select a date'}
              </h3>
              <p style={{ fontSize: 12, color: TEXT_TERTIARY, margin: '4px 0 0' }}>
                {selectedDate
                  ? format(selectedDate, 'EEEE')
                  : ''}
                {' · '}
                {selectedDateActivities.length} {selectedDateActivities.length === 1 ? 'activity' : 'activities'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNewActivity(true)}
              style={{
                width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
                background: `${YELLOW}10`, color: YELLOW, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
              title="Log activity"
            >
              <Plus size={18} />
            </motion.button>
          </div>

          {/* Activity list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedDateActivities.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 0',
              }}>
                <CalendarLucide size={36} style={{ color: TEXT_TERTIARY }} />
                <p style={{ fontSize: 13, color: TEXT_TERTIARY, margin: 0, textAlign: 'center' }}>
                  No activities for this date
                </p>
                <button
                  onClick={() => setShowNewActivity(true)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${YELLOW}30`,
                    background: `${YELLOW}10`, color: YELLOW, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${YELLOW}20` }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${YELLOW}10` }}
                >
                  Log Activity
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {selectedDateActivities
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onClick={activity.dealId ? () => handleActivityClick(activity) : undefined}
                    />
                  ))}
              </AnimatePresence>
            )}
          </div>

          {/* Quick stats */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { type: 'meeting' as const, color: PURPLE, label: 'Meetings' },
              { type: 'call' as const, color: GREEN, label: 'Calls' },
              { type: 'task' as const, color: YELLOW, label: 'Tasks' },
              { type: 'email' as const, color: BLUE, label: 'Emails' },
            ].map(({ type, color, label }) => (
              <div
                key={type}
                style={{
                  flex: '1 1 calc(50% - 4px)',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: `${color}08`,
                  border: `1px solid ${color}15`,
                  textAlign: 'center',
                  minWidth: 70,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color }}>
                  {calendarActivities.filter((a) => a.type === type).length}
                </div>
                <div style={{ fontSize: 10, color: TEXT_TERTIARY, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .crm-calendar-grid {
            grid-template-columns: 1fr !important;
          }
          .crm-calendar-sidepanel {
            position: static !important;
            max-height: 500px !important;
          }
        }
        @media (max-width: 640px) {
          .crm-calendar-grid {
            gap: 12px !important;
          }
        }
      `}</style>

      {/* New Activity Dialog */}
      <AnimatePresence>
        {showNewActivity && (
          <NewActivityForm
            onClose={() => setShowNewActivity(false)}
            onSuccess={handleActivityCreated}
            prefillDate={selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export { CalendarSkeleton }
