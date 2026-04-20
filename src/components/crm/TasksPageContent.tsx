'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, differenceInDays, startOfDay, isToday, isPast,
  startOfWeek, subDays, addDays,
} from 'date-fns'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, Check, Clock, Trash2, ListTodo, GripVertical, Phone, Mail,
  FileText, Activity, MessageSquare, Save, X, Search, ArrowUpDown,
  LayoutGrid, List, Calendar, AlertCircle, CheckCircle2, Timer,
  ChevronRight, User, TrendingUp, Zap, Edit3, Filter,
  Sparkles, ArrowDown, ArrowUp, CircleDot,
  PhoneCall, Send, ExternalLink,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Brand colours & palette
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  dark: '#0A0A0A',
  surface: '#1A1A1A',
  deeper: '#141414',
  border: '#2A2A2A',
  yellow: '#F3D840',
  yellowHover: '#E5C832',
  yellowMuted: 'rgba(243, 216, 64, 0.12)',
  muted: '#A0A0A0',
  faint: '#666666',
  white: '#FFFFFF',
  red: '#EF4444',
  redMuted: 'rgba(239, 68, 68, 0.12)',
  orange: '#F97316',
  orangeMuted: 'rgba(249, 115, 22, 0.12)',
  green: '#22C55E',
  greenMuted: 'rgba(34, 197, 94, 0.12)',
  blue: '#3B82F6',
  blueMuted: 'rgba(59, 130, 246, 0.12)',
  purple: '#A855F7',
  purpleMuted: 'rgba(168, 85, 247, 0.12)',
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TaskContact {
  id: string; firstName: string; lastName: string; phone?: string | null
}

interface TaskAssignee {
  id: string; name: string; avatar?: string | null
}

interface TaskDeal {
  id: string; title: string; value?: number | null
}

interface Task {
  id: string; title: string; description?: string | null
  priority: string; status: string; dueDate?: string | null
  completedAt?: string | null; createdAt: string
  contactId?: string | null; contact?: TaskContact | null
  dealId?: string | null; deal?: TaskDeal | null
  assigneeId?: string | null; assignee?: TaskAssignee | null
  notes?: Note[]
}

interface ContactOption {
  id: string; firstName: string; lastName: string; phone?: string | null
}

interface DealOption {
  id: string; title: string; value: number
}

interface Note {
  id: string; content: string; createdAt: string
  user?: { id: string; name: string } | null
}

type ViewMode = 'board' | 'list' | 'timeline'
type SortField = 'dueDate' | 'priority' | 'name' | 'created'
type SortDir = 'asc' | 'desc'

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN & PRIORITY CONFIGS
// ═══════════════════════════════════════════════════════════════════════════════

const COLUMNS = [
  { key: 'todo', label: 'To Do', colour: C.faint, icon: CircleDot },
  { key: 'in_progress', label: 'In Progress', colour: C.yellow, icon: Timer },
  { key: 'completed', label: 'Completed', colour: C.green, icon: CheckCircle2 },
] as const

const PRIORITY_CONFIG: Record<string, { colour: string; bg: string; label: string; order: number }> = {
  urgent: { colour: C.red, bg: C.redMuted, label: 'Urgent', order: 0 },
  high:   { colour: C.red, bg: C.redMuted, label: 'High', order: 1 },
  medium: { colour: C.yellow, bg: C.yellowMuted, label: 'Medium', order: 2 },
  low:    { colour: C.green, bg: C.greenMuted, label: 'Low', order: 3 },
}

const STATUS_CONFIG: Record<string, { colour: string; bg: string; label: string }> = {
  todo: { colour: C.faint, bg: 'rgba(102,102,102,0.12)', label: 'To Do' },
  in_progress: { colour: C.yellow, bg: C.yellowMuted, label: 'In Progress' },
  completed: { colour: C.green, bg: C.greenMuted, label: 'Completed' },
  cancelled: { colour: C.muted, bg: 'rgba(160,160,160,0.12)', label: 'Cancelled' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function contactName(c: TaskContact | null | undefined) {
  return c ? `${c.firstName} ${c.lastName}` : null
}

function isOverdue(dueDate: string | null | undefined, status: string) {
  if (!dueDate) return false
  return isPast(new Date(dueDate)) && status !== 'completed' && status !== 'cancelled'
}

function isDueToday(dueDate: string | null | undefined) {
  if (!dueDate) return false
  return isToday(new Date(dueDate))
}

function priorityOrder(p: string) {
  return PRIORITY_CONFIG[p]?.order ?? 2
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function daysUntil(dueDate: string | null | undefined) {
  if (!dueDate) return null
  const diff = differenceInDays(new Date(dueDate), startOfDay(new Date()))
  return diff
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER HOOK
// ═══════════════════════════════════════════════════════════════════════════════

function AnimatedValue({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const from = display
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value, display, duration])

  return <>{display}</>
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY BADGE (inline styled, pulse for urgent)
// ═══════════════════════════════════════════════════════════════════════════════

function PriorityBadge({ priority, pulse = false, size = 'sm' }: { priority: string; pulse?: boolean; size?: 'sm' | 'md' }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  const isMd = size === 'md'
  return (
    <motion.span
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: isMd ? 5 : 4,
        padding: isMd ? '3px 10px' : '2px 8px', borderRadius: 6,
        fontSize: isMd ? 12 : 11, fontWeight: 600,
        color: cfg.colour, backgroundColor: cfg.bg,
        border: `1px solid ${cfg.colour}25`,
        textTransform: 'capitalize' as const,
        animation: pulse ? 'pulseBadge 2s ease-in-out infinite' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {priority === 'urgent' ? '⚡' : priority === 'high' ? '↑' : priority === 'low' ? '↓' : '→'}
      {' '}{cfg.label}
    </motion.span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.todo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      color: cfg.colour, backgroundColor: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({
  icon: Icon, label, value, colour, subtext, pulse, delay = 0,
}: {
  icon: React.ElementType; label: string; value: number; colour: string
  subtext?: string; pulse?: boolean; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200, delay }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
        position: 'relative', overflow: 'hidden', cursor: 'default',
        boxShadow: pulse ? `0 0 20px ${colour}30, 0 0 40px ${colour}10` : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Decorative gradient */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${colour}08, transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${colour}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} style={{ color: colour }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.muted, marginBottom: 2, letterSpacing: '0.3px' }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.white, lineHeight: 1.1 }}>
          <AnimatedValue value={value} />
        </div>
        {subtext && <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{subtext}</div>}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

function StatsDashboard({ tasks }: { tasks: Task[] }) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  const total = tasks.length
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length
  const dueToday = tasks.filter((t) => isDueToday(t.dueDate) && t.status !== 'completed').length
  const completedThisWeek = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= weekStart
  ).length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length

  const completedTasks = tasks.filter((t) => t.status === 'completed' && t.completedAt && t.createdAt)
  let avgCompletion = 0
  if (completedTasks.length > 0) {
    const totalDays = completedTasks.reduce(
      (sum, t) => sum + differenceInDays(new Date(t.completedAt!), new Date(t.createdAt)), 0
    )
    avgCompletion = Math.round(totalDays / completedTasks.length)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 12, marginBottom: 20,
    }}>
      <StatCard icon={ListTodo} label="Total Tasks" value={total} colour={C.white} delay={0} />
      <StatCard icon={AlertCircle} label="Overdue" value={overdue} colour={C.red} pulse={overdue > 0} subtext={overdue > 0 ? 'Needs attention' : 'All on track'} delay={0.05} />
      <StatCard icon={Calendar} label="Due Today" value={dueToday} colour={C.orange} subtext={dueToday > 0 ? 'Act now' : 'All clear'} delay={0.1} />
      <StatCard icon={CheckCircle2} label="Completed This Week" value={completedThisWeek} colour={C.green} delay={0.15} />
      <StatCard icon={Timer} label="In Progress" value={inProgress} colour={C.yellow} delay={0.2} />
      <StatCard icon={TrendingUp} label="Avg Completion" value={avgCompletion} colour={C.blue} subtext="days average" delay={0.25} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════════════════════════════

function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C.yellow, color: C.dark,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.max(8, size * 0.38), fontWeight: 700, flexShrink: 0,
      boxShadow: '0 2px 8px rgba(243, 216, 64, 0.2)',
    }} title={name}>
      {getInitials(name)}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SORTABLE TASK CARD (Board View)
// ═══════════════════════════════════════════════════════════════════════════════

function SortableTaskCard({
  task, onOpenDetail, onComplete, onDelete,
}: {
  task: Task; onOpenDetail: (t: Task) => void; onComplete: (id: string) => void; onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id, data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const completed = task.status === 'completed'
  const overdue = isOverdue(task.dueDate, task.status)
  const days = daysUntil(task.dueDate)

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 12, cursor: 'pointer',
          position: 'relative', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
          borderLeft: overdue ? `3px solid ${C.red}` : completed ? `3px solid ${C.green}40` : `3px solid ${C.border}`,
        }}
        onClick={() => onOpenDetail(task)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.yellow + '40'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C.border
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpenDetail(task) }}
      >
        {/* Top row: drag handle + title + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <button
            {...attributes} {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 2, padding: 0, border: 'none', background: 'none',
              cursor: 'grab', color: C.faint, opacity: 0.3,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3' }}
            aria-label="Drag task"
          >
            <GripVertical size={14} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: completed ? C.faint : C.white,
              textDecoration: completed ? 'line-through' : 'none',
              lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            }}>
              {task.title}
            </div>
            {task.description && (
              <div style={{
                fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {task.description}
              </div>
            )}
          </div>

          {/* Hover action buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
              opacity: 0, transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
          >
            {task.status !== 'completed' && task.status !== 'cancelled' && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(task.id) }}
                style={{
                  width: 26, height: 26, borderRadius: 6, border: 'none',
                  background: C.greenMuted, color: C.green, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s, transform 0.15s', padding: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.green + '25'; e.currentTarget.style.transform = 'scale(1.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.greenMuted; e.currentTarget.style.transform = 'scale(1)' }}
                aria-label="Complete task"
              >
                <Check size={13} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
              style={{
                width: 26, height: 26, borderRadius: 6, border: 'none',
                background: C.redMuted, color: C.red, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, transform 0.15s', padding: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.red + '25'; e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.redMuted; e.currentTarget.style.transform = 'scale(1)' }}
              aria-label="Delete task"
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        </div>

        {/* Meta row: priority + due date + assignee */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 10, paddingLeft: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <PriorityBadge priority={task.priority} pulse={task.priority === 'urgent'} />
            {overdue && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '1px 7px', borderRadius: 4,
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.5px',
                  color: C.white, backgroundColor: C.red,
                  textTransform: 'uppercase' as const,
                }}
              >
                OVERDUE
              </motion.span>
            )}
            {task.dueDate && !completed && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 11, fontWeight: overdue ? 600 : 400,
                color: overdue ? C.red : days !== null && days <= 1 && days >= 0 ? C.orange : C.muted,
              }}>
                <Clock size={11} />
                {overdue
                  ? `${Math.abs(days!)}d overdue`
                  : days === 0
                    ? 'Today'
                    : days === 1
                      ? 'Tomorrow'
                      : format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
          {task.assignee && (
            <Avatar name={task.assignee.name} size={24} />
          )}
        </div>

        {/* Contact name */}
        {task.contact && (
          <div style={{ paddingLeft: 20, marginTop: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: C.muted,
            }}>
              <User size={10} />
              {contactName(task.contact)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAG OVERLAY CARD
// ═══════════════════════════════════════════════════════════════════════════════

function DragOverlayCard({ task }: { task: Task }) {
  if (!task) return null
  return (
    <motion.div
      initial={{ scale: 1.02, rotate: 0 }}
      animate={{ scale: 1.04, rotate: 2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        background: C.surface, border: `2px solid ${C.yellow}`,
        borderRadius: 12, padding: 12, width: 280,
        boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${C.yellow}30, 0 0 30px ${C.yellow}10`,
      }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>
        {task.title}
      </div>
      {task.description && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.description}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={11} />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        {task.assignee && <Avatar name={task.assignee.name} size={20} />}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOARD COLUMN
// ═══════════════════════════════════════════════════════════════════════════════

function QuickCreateInline({ columnKey, onCreate }: { columnKey: string; onCreate: (task: Record<string, string>) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  const handleCreate = () => {
    if (!title.trim()) return
    onCreate({ title: title.trim(), status: columnKey, priority: 'medium', description: '', dueDate: '', contactId: '', dealId: '', assigneeId: '' })
    setTitle('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: 6,
          border: `1px dashed ${C.border}`, background: 'transparent',
          color: C.faint, cursor: 'pointer', padding: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.yellow + '50'; e.currentTarget.style.color = C.yellow; e.currentTarget.style.background = C.yellowMuted }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.faint; e.currentTarget.style.background = 'transparent' }}
        aria-label="Quick add task"
      >
        <Plus size={13} />
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setOpen(false); setTitle('') } }}
        placeholder="Quick add..."
        style={{
          flex: 1, padding: '5px 10px', borderRadius: 6,
          border: `1px solid ${C.yellow}40`, background: C.deeper,
          color: C.white, fontSize: 12, outline: 'none',
          fontFamily: 'inherit', minWidth: 120,
        }}
      />
      <button
        onClick={handleCreate}
        disabled={!title.trim()}
        style={{
          width: 24, height: 24, borderRadius: 6,
          border: 'none', background: C.yellow,
          color: C.dark, cursor: title.trim() ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, opacity: title.trim() ? 1 : 0.4,
          transition: 'opacity 0.15s',
        }}
        aria-label="Create task"
      >
        <Check size={13} />
      </button>
      <button
        onClick={() => { setOpen(false); setTitle('') }}
        style={{
          width: 24, height: 24, borderRadius: 6,
          border: 'none', background: 'transparent',
          color: C.muted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
        aria-label="Cancel"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED QUICK CREATE — Title + Priority + Due Date inline form
// ═══════════════════════════════════════════════════════════════════════════════

function EnhancedQuickCreate({
  onClose, onCreate, isPending,
}: {
  onClose: () => void
  onCreate: (task: Record<string, string>) => void
  isPending: boolean
}) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleCreate = () => {
    if (!title.trim()) return
    onCreate({ title: title.trim(), status: 'todo', priority, dueDate, description: '', contactId: '', dealId: '', assigneeId: '' })
    onClose()
  }

  const fieldStyle: React.CSSProperties = {
    background: C.deeper, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.white, fontSize: 13, padding: '9px 12px', outline: 'none',
    width: '100%', fontFamily: 'inherit', transition: 'border-color 0.15s',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        background: C.surface, border: `2px solid ${C.yellow}40`,
        borderRadius: 12, padding: 14, marginBottom: 8,
        boxShadow: `0 8px 30px rgba(243, 216, 64, 0.08)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.yellow, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} /> Quick Create
        </span>
        <button onClick={onClose} style={{
          width: 24, height: 24, borderRadius: 6, border: 'none',
          background: 'transparent', color: C.muted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          transition: 'color 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.white }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted }}
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onClose() }}
          placeholder="Task title..."
          style={fieldStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.yellow + '40' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            style={{ ...fieldStyle, flex: 1, cursor: 'pointer' }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="Due date"
            style={{ ...fieldStyle, flex: 1, colorScheme: 'dark' }}
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={!title.trim() || isPending}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: C.yellow, color: C.dark, fontSize: 13, fontWeight: 700,
            cursor: title.trim() && !isPending ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: title.trim() && !isPending ? 1 : 0.4, transition: 'opacity 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => { if (title.trim()) e.currentTarget.style.background = C.yellowHover }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.yellow }}
        >
          {isPending ? (
            <div style={{ width: 14, height: 14, border: `2px solid ${C.dark}30`, borderTopColor: C.dark, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          ) : (
            <><Plus size={14} /> Add Task</>
          )}
        </button>
      </div>
    </motion.div>
  )
}

function TaskColumn({
  col, tasks, onOpenDetail, onComplete, onDelete, allTasks, onQuickCreate,
  showEnhancedCreate, onCloseEnhancedCreate, onEnhancedCreate, isCreatePending,
}: {
  col: typeof COLUMNS[number]; tasks: Task[]; allTasks: Task[]
  onOpenDetail: (t: Task) => void; onComplete: (id: string) => void; onDelete: (id: string) => void
  onQuickCreate: (task: Record<string, string>) => void
  showEnhancedCreate?: boolean; onCloseEnhancedCreate?: () => void
  onEnhancedCreate?: (task: Record<string, string>) => void; isCreatePending?: boolean
}) {
  const colId = col.key
  const ColIcon = col.icon
  const totalDealValue = allTasks
    .filter((t) => t.status === colId && t.deal?.value)
    .reduce((sum, t) => sum + (t.deal?.value || 0), 0)

  return (
    <motion.div
      id={`column-${colId}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: COLUMNS.findIndex((c) => c.key === colId) * 0.08 }}
      style={{ display: 'flex', flexDirection: 'column', minWidth: 280, flex: 1 }}
    >
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 4px', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: col.colour,
            boxShadow: col.key === 'in_progress' ? `0 0 8px ${col.colour}60` : 'none',
          }} />
          <ColIcon size={14} style={{ color: col.colour }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{col.label}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.muted,
            background: C.deeper, padding: '1px 8px', borderRadius: 10,
          }}>
            {tasks.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <QuickCreateInline columnKey={colId} onCreate={onQuickCreate} />
          {totalDealValue > 0 && (
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>
              {fmtCurrency(totalDealValue)}
            </span>
          )}
        </div>
      </div>

      {/* Enhanced quick-create panel (first column only) */}
      <AnimatePresence>
        {showEnhancedCreate && onCloseEnhancedCreate && onEnhancedCreate && (
          <EnhancedQuickCreate
            onClose={onCloseEnhancedCreate}
            onCreate={onEnhancedCreate}
            isPending={isCreatePending ?? false}
          />
        )}
      </AnimatePresence>

      {/* Droppable zone */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          data-column={colId}
          style={{
            background: C.deeper, borderRadius: 12, padding: 8,
            minHeight: 200, maxHeight: 'calc(100vh - 340px)',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
            scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent`,
          }}
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id} task={task}
                onOpenDetail={onOpenDetail} onComplete={onComplete} onDelete={onDelete}
              />
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '40px 16px', color: C.faint,
              }}
            >
              <ColIcon size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
              <span style={{ fontSize: 12, opacity: 0.6 }}>No tasks here</span>
            </motion.div>
          )}
        </div>
      </SortableContext>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST VIEW — Full table with sortable headers
// ═══════════════════════════════════════════════════════════════════════════════

function ListView({
  tasks, onOpenDetail, onComplete, onDelete, sortField, sortDir, onSort,
}: {
  tasks: Task[]; onOpenDetail: (t: Task) => void; onComplete: (id: string) => void; onDelete: (id: string) => void
  sortField: SortField; sortDir: SortDir; onSort: (field: SortField) => void
}) {
  const columns: { key: string; label: string; sortKey?: SortField; width?: string }[] = [
    { key: 'check', label: '' },
    { key: 'title', label: 'Title', sortKey: 'name' },
    { key: 'priority', label: 'Priority', sortKey: 'priority' },
    { key: 'status', label: 'Status' },
    { key: 'dueDate', label: 'Due Date', sortKey: 'dueDate' },
    { key: 'contact', label: 'Contact' },
    { key: 'deal', label: 'Deal' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'created', label: 'Created', sortKey: 'created' },
    { key: 'actions', label: '' },
  ]

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={11} style={{ opacity: 0.4, marginLeft: 4 }} />
    return sortDir === 'asc'
      ? <ArrowUp size={11} style={{ marginLeft: 4, color: C.yellow }} />
      : <ArrowDown size={11} style={{ marginLeft: 4, color: C.yellow }} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}`,
        background: C.surface,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: '12px 14px', textAlign: 'left',
                fontSize: 11, fontWeight: 600, color: C.muted,
                background: C.deeper, whiteSpace: 'nowrap',
                borderBottom: `1px solid ${C.border}`,
                cursor: col.sortKey ? 'pointer' : 'default',
                userSelect: 'none',
                transition: 'color 0.15s',
                width: col.width,
              }}
                onClick={() => { if (col.sortKey) onSort(col.sortKey) }}
                onMouseEnter={(e) => { if (col.sortKey) e.currentTarget.style.color = C.white }}
                onMouseLeave={(e) => { if (col.sortKey) e.currentTarget.style.color = C.muted }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {col.label}
                  {col.sortKey && <SortIcon field={col.sortKey} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status)
              return (
                <motion.tr
                  key={task.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    borderLeft: overdue ? `3px solid ${C.red}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => onOpenDetail(task)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Checkbox */}
                  <td style={{ padding: '8px 14px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onComplete(task.id) }}
                      style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `2px solid ${task.status === 'completed' ? C.green : C.border}`,
                        background: task.status === 'completed' ? C.green : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: 0,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { if (task.status !== 'completed') e.currentTarget.style.borderColor = C.muted }}
                      onMouseLeave={(e) => { if (task.status !== 'completed') e.currentTarget.style.borderColor = C.border }}
                      aria-label="Toggle complete"
                    >
                      {task.status === 'completed' && <Check size={11} style={{ color: C.dark }} />}
                    </button>
                  </td>

                  {/* Title */}
                  <td style={{
                    padding: '8px 14px', maxWidth: 260,
                    color: task.status === 'completed' ? C.faint : C.white,
                    fontWeight: 500,
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {task.title}
                  </td>

                  {/* Priority */}
                  <td style={{ padding: '8px 14px' }}>
                    <PriorityBadge priority={task.priority} pulse={task.priority === 'urgent'} />
                  </td>

                  {/* Status */}
                  <td style={{ padding: '8px 14px' }}>
                    <StatusBadge status={task.status} />
                  </td>

                  {/* Due Date */}
                  <td style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
                    {task.dueDate ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {overdue && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '1px 6px', borderRadius: 4,
                            fontSize: 9, fontWeight: 800, letterSpacing: '0.5px',
                            color: C.white, backgroundColor: C.red,
                            textTransform: 'uppercase',
                          }}>
                            OVERDUE
                          </span>
                        )}
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 12, fontWeight: overdue ? 600 : 400,
                          color: overdue ? C.red : C.muted,
                        }}>
                          <Clock size={11} />
                          {overdue
                            ? `${Math.abs(daysUntil(task.dueDate)!)}d overdue`
                            : format(new Date(task.dueDate), 'd MMM yyyy')}
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: C.faint, fontSize: 12 }}>—</span>
                    )}
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '8px 14px', color: C.muted, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {contactName(task.contact) || <span style={{ color: C.faint }}>—</span>}
                  </td>

                  {/* Deal */}
                  <td style={{ padding: '8px 14px', color: C.muted, fontSize: 12, whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.deal?.title || <span style={{ color: C.faint }}>—</span>}
                  </td>

                  {/* Assignee */}
                  <td style={{ padding: '8px 14px' }}>
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar name={task.assignee.name} size={22} />
                        <span style={{ fontSize: 12, color: C.muted }}>{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: C.faint, fontSize: 12 }}>—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td style={{ padding: '8px 14px', color: C.faint, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {format(new Date(task.createdAt), 'd MMM')}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '8px 14px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: 'transparent', color: C.faint, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.redMuted; e.currentTarget.style.color = C.red }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.faint }}
                      aria-label="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>

          {tasks.length === 0 && (
            <tr>
              <td colSpan={10}>
                <EmptyState />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE VIEW — Gantt-style horizontal timeline
// ═══════════════════════════════════════════════════════════════════════════════

function TimelineView({ tasks, onOpenDetail }: { tasks: Task[]; onOpenDetail: (t: Task) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const tasksWithDates = tasks.filter((t) => t.dueDate).sort(
    (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
  )

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector('[data-today-marker]')
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [tasksWithDates.length])

  if (tasksWithDates.length === 0) {
    return (
      <div style={{
        background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
        padding: 40, textAlign: 'center',
      }}>
        <EmptyState />
      </div>
    )
  }

  const minDate = subDays(new Date(tasksWithDates[0].dueDate!), 3)
  const maxDate = addDays(new Date(tasksWithDates[tasksWithDates.length - 1].dueDate!), 5)
  const totalDays = differenceInDays(maxDate, minDate) || 1

  const todayMs = startOfDay(new Date()).getTime()
  const minMs = minDate.getTime()
  const todayOffset = ((todayMs - minMs) / (1000 * 60 * 60 * 24)) / totalDays

  const priorityColours: Record<string, string> = {
    urgent: C.red, high: C.red, medium: C.yellow, low: C.green,
  }

  const statusGroups = [
    { key: 'todo', label: 'To Do', colour: C.faint },
    { key: 'in_progress', label: 'In Progress', colour: C.yellow },
    { key: 'completed', label: 'Completed', colour: C.green },
  ]

  // Generate date labels
  const dateLabels: string[] = []
  for (let i = 0; i <= totalDays; i++) {
    const d = addDays(minDate, i)
    if (i % Math.max(1, Math.floor(totalDays / 14)) === 0 || isToday(d)) {
      dateLabels.push(format(d, 'd MMM'))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Date header */}
      <div ref={scrollRef} style={{ overflow: 'auto' }}>
        <div style={{ minWidth: 900, position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
            position: 'relative', height: 32,
          }}>
            {dateLabels.map((label, i) => {
              const d = new Date(label)
              const dayOffset = differenceInDays(d, minDate)
              const leftPct = (dayOffset / totalDays) * 100
              return (
                <div key={i} style={{
                  position: 'absolute', left: `${leftPct}%`,
                  fontSize: 10, fontWeight: 500, color: C.faint,
                  transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                }}>
                  {label}
                </div>
              )
            })}
          </div>

          {/* Task rows */}
          <div ref={containerRef} style={{ padding: '8px 16px 16px', position: 'relative' }}>
            {/* Grid lines */}
            {Array.from({ length: Math.min(totalDays, 30) }, (_, i) => {
              const d = addDays(minDate, i)
              if (!isToday(d) && i % 7 !== 0) return null
              const leftPct = (i / totalDays) * 100
              return (
                <div key={i} style={{
                  position: 'absolute', left: `${leftPct}%`, top: 0, bottom: 0,
                  width: 1, background: isToday(d) ? 'transparent' : `${C.border}60`,
                  pointerEvents: 'none',
                }} />
              )
            })}

            {/* Today marker with glow */}
            {todayOffset >= 0 && todayOffset <= 1 && (
              <div data-today-marker style={{
                position: 'absolute', left: `${todayOffset * 100}%`, top: 0, bottom: 0,
                width: 2, background: C.red, zIndex: 10, pointerEvents: 'none',
                boxShadow: `0 0 10px ${C.red}80, 0 0 20px ${C.red}30`,
              }}>
                <div style={{
                  position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 9, fontWeight: 700, color: C.red, whiteSpace: 'nowrap',
                  background: C.surface, padding: '1px 6px', borderRadius: 4,
                  border: `1px solid ${C.red}40`,
                }}>
                  TODAY
                </div>
              </div>
            )}

            {statusGroups.map((group) => {
              const groupTasks = tasksWithDates.filter((t) => t.status === group.key)
              if (groupTasks.length === 0) return null

              return (
                <div key={group.key} style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: group.colour,
                    marginBottom: 10, paddingLeft: 4,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: group.colour }} />
                    {group.label}
                    <span style={{ fontSize: 11, fontWeight: 400, color: C.faint }}>({groupTasks.length})</span>
                  </div>

                  {groupTasks.map((task, idx) => {
                    const taskDate = new Date(task.dueDate!)
                    const dayOffset = differenceInDays(taskDate, minDate)
                    const leftPct = (dayOffset / totalDays) * 100
                    const barWidth = Math.max(Math.min(160, 600 / totalDays * 3), 80)
                    const barColour = priorityColours[task.priority] || C.yellow
                    const isCompleted = task.status === 'completed'

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        style={{
                          position: 'relative', height: 32, marginBottom: 4,
                          cursor: 'pointer',
                        }}
                        onClick={() => onOpenDetail(task)}
                      >
                        <div
                          style={{
                            position: 'absolute', left: `${leftPct}%`,
                            width: barWidth, height: '100%', borderRadius: 8,
                            background: barColour,
                            opacity: isCompleted ? 0.45 : 0.8,
                            display: 'flex', alignItems: 'center',
                            padding: '0 10px', fontSize: 11, fontWeight: 600,
                            color: task.priority === 'medium' ? C.dark : C.white,
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                            transition: 'opacity 0.2s, transform 0.2s, box-shadow 0.2s',
                            boxShadow: `0 2px 8px ${barColour}30`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1'
                            e.currentTarget.style.transform = 'scaleY(1.2) scaleX(1.05)'
                            e.currentTarget.style.boxShadow = `0 4px 16px ${barColour}50`
                            e.currentTarget.style.zIndex = '5'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = isCompleted ? '0.45' : '0.8'
                            e.currentTarget.style.transform = 'scaleY(1) scaleX(1)'
                            e.currentTarget.style.boxShadow = `0 2px 8px ${barColour}30`
                            e.currentTarget.style.zIndex = '0'
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE — Animated floating icon
// ═══════════════════════════════════════════════════════════════════════════════

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '60px 24px',
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 72, height: 72, borderRadius: 18,
          background: C.yellowMuted, display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 20,
          boxShadow: `0 8px 30px ${C.yellow}10`,
        }}
      >
        <Sparkles size={30} style={{ color: C.yellow }} />
      </motion.div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 8 }}>
        No tasks yet
      </div>
      <div style={{ fontSize: 13, color: C.muted, maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>
        Create your first task to start managing your workflow. Stay on top of priorities, deadlines, and deliverables.
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE TASK DIALOG
// ═══════════════════════════════════════════════════════════════════════════════

function CreateTaskDialog({
  open, onOpenChange, contacts, deals, onCreate, isPending,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  contacts: ContactOption[]; deals: DealOption[]
  onCreate: (task: Record<string, string>) => void; isPending: boolean
}) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'todo',
    dueDate: '', contactId: '', dealId: '', assigneeId: '',
  })

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    onCreate(form)
  }

  const resetForm = () => {
    setForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', contactId: '', dealId: '', assigneeId: '' })
  }

  const handleOpenChange = (v: boolean) => {
    if (v) resetForm()
    onOpenChange(v)
  }

  const inputStyle: React.CSSProperties = {
    background: C.deeper, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.white, fontSize: 13, padding: '9px 12px', outline: 'none',
    width: '100%', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: 'block',
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, maxWidth: 500, width: '100%',
        padding: 24,
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: C.yellowMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={16} style={{ color: C.yellow }} />
            </div>
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              autoFocus
              onFocus={(e) => { e.currentTarget.style.borderColor = C.yellow + '40' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add details about this task..."
              onFocus={(e) => { e.currentTarget.style.borderColor = C.yellow + '40' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select style={inputStyle} value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Due Date</label>
            <input
              type="date"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Contact</label>
              <select style={inputStyle} value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}>
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Deal</label>
              <select style={inputStyle} value={form.dealId}
                onChange={(e) => setForm({ ...form, dealId: e.target.value })}>
                <option value="">None</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>{d.title} — {fmtCurrency(d.value)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              onClick={() => onOpenChange(false)}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isPending}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                border: 'none', background: C.yellow,
                color: C.dark, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s, transform 0.15s',
                opacity: isPending ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.yellowHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.yellow; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {isPending ? (
                <div style={{
                  width: 16, height: 16, border: `2px solid ${C.dark}30`,
                  borderTopColor: C.dark, borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
              ) : (
                <>
                  <Plus size={15} />
                  Create Task
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK DETAIL SHEET (from right, 480px)
// ═══════════════════════════════════════════════════════════════════════════════

function TaskDetailSheet({
  task, open, onOpenChange, contacts, deals,
}: {
  task: Task | null; open: boolean; onOpenChange: (v: boolean) => void
  contacts: ContactOption[]; deals: DealOption[]
}) {
  const queryClient = useQueryClient()

  const [editForm, setEditForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? '',
    priority: task?.priority ?? '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    assigneeId: task?.assigneeId ?? '',
  })
  const [noteText, setNoteText] = useState('')
  const [showActivityDialog, setShowActivityDialog] = useState(false)
  const [activityType, setActivityType] = useState<'call' | 'email'>('call')
  const [activitySubject, setActivitySubject] = useState('')
  const [activityDescription, setActivityDescription] = useState('')

  // Queries
  const { data: notesData } = useQuery({
    queryKey: ['notes', task?.id],
    queryFn: () => fetch(`/api/crm/notes?taskId=${task?.id}`).then((r) => r.json()),
    enabled: !!task?.id,
  })
  const notes: Note[] = notesData?.notes || []

  const { data: activitiesData } = useQuery({
    queryKey: ['task-activities', task?.id],
    queryFn: () => fetch(`/api/crm/activities?dealId=${task?.dealId || ''}&contactId=${task?.contactId || ''}&limit=10`).then((r) => r.json()),
    enabled: !!task?.id,
  })
  const activities = activitiesData?.activities || []

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/crm/tasks', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task?.id, ...data }),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['notes', task?.id] })
      toast.success('Task updated successfully')
    },
    onError: () => toast.error('Failed to update task'),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/tasks/${task?.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onOpenChange(false)
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/crm/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content, taskId: task?.id,
          contactId: task?.contactId || undefined,
          dealId: task?.dealId || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      setNoteText('')
      queryClient.invalidateQueries({ queryKey: ['notes', task?.id] })
      toast.success('Note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const logActivityMutation = useMutation({
    mutationFn: async ({ type, subject, description }: { type: string; subject: string; description: string }) => {
      const res = await fetch('/api/crm/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, subject, description: description || undefined,
          contactId: task?.contactId || undefined,
          dealId: task?.dealId || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to log activity')
      return res.json()
    },
    onSuccess: () => {
      setShowActivityDialog(false)
      setActivitySubject('')
      setActivityDescription('')
      queryClient.invalidateQueries({ queryKey: ['task-activities', task?.id] })
      toast.success('Activity logged')
    },
    onError: () => toast.error('Failed to log activity'),
  })

  if (!task) return null

  const cn = contactName(task.contact)
  const phone = task.contact?.phone
  const overdue = isOverdue(task.dueDate, task.status)
  const days = daysUntil(task.dueDate)

  const handleSave = () => {
    if (!editForm.title.trim()) { toast.error('Title is required'); return }
    updateMutation.mutate({
      title: editForm.title,
      description: editForm.description || null,
      status: editForm.status,
      priority: editForm.priority,
      dueDate: editForm.dueDate || null,
      assigneeId: editForm.assigneeId || null,
    })
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return
    addNoteMutation.mutate(noteText.trim())
  }

  const handleLogActivity = () => {
    if (!activitySubject.trim()) { toast.error('Subject is required'); return }
    logActivityMutation.mutate({
      type: activityType, subject: activitySubject, description: activityDescription,
    })
  }

  const fieldStyle: React.CSSProperties = {
    background: C.deeper, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.white, fontSize: 13, padding: '9px 12px', outline: 'none',
    width: '100%', fontFamily: 'inherit', transition: 'border-color 0.15s',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent style={{
          background: C.surface, borderLeft: `1px solid ${C.border}`,
          maxWidth: 480, width: '100%', padding: 0, overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 24px 20px', borderBottom: `1px solid ${C.border}`,
            position: 'sticky', top: 0, background: C.surface, zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <SheetTitle style={{ color: C.white, fontSize: 18, fontWeight: 700 }}>
                Task Details
              </SheetTitle>
              <div style={{ display: 'flex', gap: 6 }}>
                <PriorityBadge priority={task.priority} pulse={task.priority === 'urgent'} size="md" />
                <StatusBadge status={task.status} />
              </div>
            </div>
            <SheetDescription style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
              Edit task details and manage related actions
            </SheetDescription>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Title</label>
              <input
                style={fieldStyle}
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.yellow + '40' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...fieldStyle, minHeight: 80, resize: 'vertical' }}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Add a description..."
                onFocus={(e) => { e.currentTarget.style.borderColor = C.yellow + '40' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>

            {/* Status + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={fieldStyle} value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select style={fieldStyle} value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Due Date + Assignee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input
                  type="date"
                  style={{ ...fieldStyle, colorScheme: 'dark' }}
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
                {overdue && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: 11, color: C.red, fontWeight: 600, marginTop: 4,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <AlertCircle size={11} /> {Math.abs(days!)} days overdue
                  </motion.span>
                )}
                {!overdue && days !== null && days >= 0 && days <= 3 && task.status !== 'completed' && (
                  <span style={{
                    fontSize: 11, color: C.orange, fontWeight: 500, marginTop: 4,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Clock size={11} /> {days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`}
                  </span>
                )}
              </div>
              <div>
                <label style={labelStyle}>Assignee</label>
                <select style={fieldStyle} value={editForm.assigneeId}
                  onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates info */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
            }}>
              <div style={{
                background: C.deeper, borderRadius: 8, padding: 10,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.faint, fontWeight: 500, marginBottom: 2 }}>Created</div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
                  {format(new Date(task.createdAt), 'd MMM')}
                </div>
              </div>
              <div style={{
                background: C.deeper, borderRadius: 8, padding: 10,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.faint, fontWeight: 500, marginBottom: 2 }}>Due</div>
                <div style={{ fontSize: 12, color: overdue ? C.red : C.muted, fontWeight: overdue ? 600 : 500 }}>
                  {task.dueDate ? format(new Date(task.dueDate), 'd MMM') : '—'}
                </div>
              </div>
              {task.completedAt && (
                <div style={{
                  background: C.greenMuted, borderRadius: 8, padding: 10,
                  border: `1px solid ${C.green}20`,
                }}>
                  <div style={{ fontSize: 10, color: C.green, fontWeight: 500, marginBottom: 2 }}>Completed</div>
                  <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
                    {format(new Date(task.completedAt), 'd MMM')}
                  </div>
                </div>
              )}
            </div>

            {/* Save + Delete buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  border: 'none', background: C.yellow, color: C.dark,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  opacity: updateMutation.isPending ? 0.6 : 1,
                  transition: 'background 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.yellowHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.yellow; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {updateMutation.isPending ? (
                  <div style={{
                    width: 16, height: 16, border: `2px solid ${C.dark}30`,
                    borderTopColor: C.dark, borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                ) : (
                  <><Save size={15} /> Save Changes</>
                )}
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: 'transparent', color: C.red,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', opacity: deleteMutation.isPending ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.redMuted; e.currentTarget.style.borderColor = C.red + '30' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border }}
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <Separator style={{ background: C.border }} />

            {/* Related contact & deal */}
            <div>
              <label style={labelStyle}>Related</label>
              <div style={{
                background: C.deeper, borderRadius: 10, padding: 14,
                border: `1px solid ${C.border}`,
              }}>
                {cn ? (
                  <a href={`/crm/contacts/${task.contactId}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                    textDecoration: 'none',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${C.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User size={14} style={{ color: C.blue }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.white, fontWeight: 500, transition: 'color 0.15s' }}>
                        {cn}
                      </div>
                      {phone && <div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>{phone}</div>}
                    </div>
                    <ExternalLink size={12} style={{ color: C.faint }} />
                  </a>
                ) : null}
                {task.deal && (
                  <a href={`/crm/deals/${task.dealId}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                    textDecoration: 'none', borderTop: cn ? `1px solid ${C.border}` : 'none',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${C.green}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={14} style={{ color: C.green }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>
                        {task.deal.title}
                      </div>
                      {task.deal.value && (
                        <div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>
                          {fmtCurrency(task.deal.value)}
                        </div>
                      )}
                    </div>
                    <ExternalLink size={12} style={{ color: C.faint }} />
                  </a>
                )}
                {!cn && !task.deal && (
                  <span style={{ fontSize: 12, color: C.faint }}>No related contact or deal</span>
                )}
              </div>
            </div>

            <Separator style={{ background: C.border }} />

            {/* Quick actions */}
            <div>
              <label style={labelStyle}>Quick Actions</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => setShowActivityDialog(true)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.border}`, background: 'transparent',
                    color: C.muted, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.yellow + '40'; e.currentTarget.style.color = C.white; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent' }}
                >
                  <Activity size={14} /> Log Activity
                </button>
                <button
                  onClick={() => toast.info('Email integration coming soon')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.border}`, background: 'transparent',
                    color: C.muted, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.yellow + '40'; e.currentTarget.style.color = C.white; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent' }}
                >
                  <Send size={14} /> Send Email
                </button>
                {phone && (
                  <button
                    onClick={() => window.open(`tel:${phone}`, '_self')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${C.border}`, background: 'transparent',
                      color: C.muted, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.green + '40'; e.currentTarget.style.color = C.green; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent' }}
                  >
                    <PhoneCall size={14} /> Call Contact
                  </button>
                )}
                <button
                  onClick={() => {
                    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
                    updateMutation.mutate({ status: newStatus })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${task.status === 'completed' ? C.yellow + '30' : C.green + '30'}`,
                    background: task.status === 'completed' ? C.yellowMuted : C.greenMuted,
                    color: task.status === 'completed' ? C.yellow : C.green, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  <CheckCircle2 size={14} /> {task.status === 'completed' ? 'Reopen' : 'Mark Complete'}
                </button>
              </div>
            </div>

            <Separator style={{ background: C.border }} />

            {/* Notes section */}
            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={12} /> Notes ({notes.length})
              </label>
              <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                <textarea
                  style={{ ...fieldStyle, minHeight: 56, resize: 'none', flex: 1 }}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write a note about this task..."
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.yellow + '40' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote() }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                  style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    border: 'none', background: noteText.trim() ? C.yellow : C.border,
                    color: noteText.trim() ? C.dark : C.faint, cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', fontSize: 12, fontWeight: 700,
                    opacity: noteText.trim() ? 1 : 0.4,
                  }}
                >
                  {addNoteMutation.isPending ? (
                    <div style={{
                      width: 14, height: 14, border: `2px solid ${C.dark}30`,
                      borderTopColor: C.dark, borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>

              {/* Existing notes */}
              <AnimatePresence>
                {notes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    {notes.slice(0, 10).map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: C.deeper, borderRadius: 10, padding: 12,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        <div style={{ fontSize: 13, color: C.white, lineHeight: 1.5 }}>
                          {note.content}
                        </div>
                        <div style={{
                          fontSize: 11, color: C.faint, marginTop: 6,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          {note.user?.name && (
                            <>
                              <Avatar name={note.user.name} size={16} />
                              <span>{note.user.name}</span>
                              <span>·</span>
                            </>
                          )}
                          <span>{format(new Date(note.createdAt), 'd MMM \'at\' h:mm a')}</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator style={{ background: C.border }} />

            {/* Checklist / Subtasks */}
            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} /> Checklist
              </label>
              <p style={{ fontSize: 11, color: C.faint, marginTop: 2, marginBottom: 8 }}>
                Use notes above with <span style={{ color: C.muted, fontWeight: 600 }}>☑</span> / <span style={{ color: C.muted, fontWeight: 600 }}>☐</span> prefixes to track subtasks
              </p>
            </div>

            {/* Activity log */}
            {activities.length > 0 && (
              <>
                <Separator style={{ background: C.border }} />
                <div>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={12} /> Recent Activity
                  </label>
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activities.slice(0, 5).map((act: Record<string, unknown>, i: number) => (
                      <div key={(act.id as string) || i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '8px 0',
                        borderBottom: i < Math.min(4, activities.length - 1) ? `1px solid ${C.border}30` : 'none',
                      }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: `${C.yellow}12`, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0,
                        }}>
                          {(act.type as string) === 'call' ? <PhoneCall size={13} style={{ color: C.yellow }} /> :
                           (act.type as string) === 'email' ? <Mail size={13} style={{ color: C.yellow }} /> :
                           <Activity size={13} style={{ color: C.yellow }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.white }}>
                            {(act.subject as string)}
                          </div>
                          {(act.description as string) && (
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>
                              {(act.description as string)}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>
                            {format(new Date(act.createdAt as string), 'd MMM \'at\' h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Log Activity dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, maxWidth: 420, width: '100%', padding: 24,
        }}>
          <DialogHeader>
            <DialogTitle style={{ color: C.white, fontSize: 17, fontWeight: 700 }}>
              Log Activity
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div>
              <label style={{ ...labelStyle, textTransform: 'none', letterSpacing: 'normal' }}>Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['call', 'email'] as const).map((t) => (
                  <button key={t} onClick={() => setActivityType(t)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${activityType === t ? C.yellow + '50' : C.border}`,
                      background: activityType === t ? C.yellowMuted : 'transparent',
                      color: activityType === t ? C.yellow : C.muted,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {t === 'call' ? <PhoneCall size={14} /> : <Mail size={14} />}
                    {t === 'call' ? 'Call' : 'Email'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ ...labelStyle, textTransform: 'none', letterSpacing: 'normal' }}>Subject *</label>
              <input style={fieldStyle} value={activitySubject}
                onChange={(e) => setActivitySubject(e.target.value)}
                placeholder="Activity subject"
                onFocus={(e) => { e.currentTarget.style.borderColor = C.yellow + '40' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, textTransform: 'none', letterSpacing: 'normal' }}>Description</label>
              <textarea style={{ ...fieldStyle, minHeight: 64, resize: 'vertical' }}
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Optional details..."
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowActivityDialog(false)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogActivity}
                disabled={logActivityMutation.isPending || !activitySubject.trim()}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  border: 'none', background: C.yellow, color: C.dark,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit',
                  opacity: activitySubject.trim() && !logActivityMutation.isPending ? 1 : 0.4,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.yellowHover }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.yellow }}
              >
                {logActivityMutation.isPending ? 'Logging...' : 'Log Activity'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLBAR BUTTON (styled helper for view toggles)
// ═══════════════════════════════════════════════════════════════════════════════

function ToolbarBtn({
  active, onClick, children, icon: Icon,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ElementType
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '7px 14px', borderRadius: 8, border: 'none',
        background: active ? C.yellowMuted : 'transparent',
        color: active ? C.yellow : C.muted,
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!active) { e.currentTarget.style.color = C.white; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }
      }}
      onMouseLeave={(e) => {
        if (!active) { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent' }
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats skeleton */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12,
      }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: C.deeper, animation: `shimmer 1.5s infinite`,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                width: 80, height: 10, borderRadius: 4,
                background: C.deeper, marginBottom: 6, animation: `shimmer 1.5s infinite ${i * 0.1}s`,
              }} />
              <div style={{
                width: 40, height: 18, borderRadius: 4,
                background: C.deeper, animation: `shimmer 1.5s infinite ${i * 0.15}s`,
              }} />
            </div>
          </div>
        ))}
      </div>
      {/* Board skeleton */}
      <div style={{ display: 'flex', gap: 12 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{ flex: 1, minWidth: 280 }}>
            <div style={{
              width: 80, height: 14, borderRadius: 4,
              background: C.deeper, marginBottom: 10, animation: `shimmer 1.5s infinite ${i * 0.1}s`,
            }} />
            <div style={{
              background: C.deeper, borderRadius: 12, padding: 8,
              minHeight: 200, display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} style={{
                  background: C.surface, borderRadius: 12, padding: 12,
                  border: `1px solid ${C.border}`, animation: `shimmer 1.5s infinite ${i * 0.1 + j * 0.05}s`,
                }}>
                  <div style={{ width: '70%', height: 12, borderRadius: 4, background: C.deeper, marginBottom: 6 }} />
                  <div style={{ width: '50%', height: 10, borderRadius: 4, background: C.deeper }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function TasksPageContent() {
  const queryClient = useQueryClient()

  // ─── State ───────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeDrag, setActiveDrag] = useState<Task | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [activeChip, setActiveChip] = useState<string>('all')

  // ─── DnD sensors ───────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // ─── Queries ────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', priorityFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '200' })
      if (priorityFilter) params.set('priority', priorityFilter)
      if (statusFilter) params.set('status', statusFilter)
      return fetch(`/api/crm/tasks?${params.toString()}`).then((r) => r.json())
    },
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'select'],
    queryFn: () => fetch('/api/crm/contacts?limit=100').then((r) => r.json()),
  })

  const { data: dealsData } = useQuery({
    queryKey: ['deals', 'select'],
    queryFn: () => fetch('/api/crm/deals?limit=100').then((r) => r.json()),
  })

  const contacts: ContactOption[] = useMemo(() =>
    (contactsData?.contacts || []).map((c: Record<string, unknown>) => ({
      id: c.id as string, firstName: c.firstName as string,
      lastName: c.lastName as string, phone: (c.phone as string) || null,
    })),
    [contactsData]
  )

  const deals: DealOption[] = useMemo(() =>
    (dealsData?.deals || []).map((d: Record<string, unknown>) => ({
      id: d.id as string, title: d.title as string, value: (d.value as number) || 0,
    })),
    [dealsData]
  )

  // ─── Derived ────────────────────────────────────────────────────────────
  const rawTasks: Task[] = useMemo(() => data?.tasks || [], [data])

  const filteredTasks = useMemo(() => {
    // Exclude cancelled tasks (archived)
    let result = rawTasks.filter((t) => t.status !== 'cancelled')

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        contactName(t.contact)?.toLowerCase().includes(q) ||
        t.assignee?.name.toLowerCase().includes(q)
      )
    }

    // Filter chip logic
    if (activeChip === 'overdue') {
      result = result.filter((t) => isOverdue(t.dueDate, t.status))
    } else if (activeChip === 'today') {
      result = result.filter((t) => isDueToday(t.dueDate) && t.status !== 'completed')
    } else if (activeChip === 'high') {
      result = result.filter((t) => t.priority === 'urgent' || t.priority === 'high')
    } else if (activeChip === 'my') {
      result = result.filter((t) => t.assigneeId && t.assigneeId !== '')
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'dueDate':
          cmp = (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
                (b.dueDate ? new Date(b.dueDate).getTime() : Infinity)
          break
        case 'priority':
          cmp = priorityOrder(a.priority) - priorityOrder(b.priority)
          break
        case 'name':
          cmp = a.title.localeCompare(b.title)
          break
        case 'created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [rawTasks, searchQuery, sortField, sortDir, activeChip])

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {
      todo: [], in_progress: [], completed: [],
    }
    for (const task of filteredTasks) {
      if (map[task.status]) map[task.status].push(task)
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority))
    }
    return map
  }, [filteredTasks])

  // ─── Mutations ──────────────────────────────────────────────────────────
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, ...data }: { taskId: string; [key: string]: unknown }) => {
      const res = await fetch('/api/crm/tasks', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...data }),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => toast.error('Failed to update task'),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/crm/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })

  const createMutation = useMutation({
    mutationFn: async (task: Record<string, string>) => {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setDialogOpen(false)
      setQuickCreateOpen(false)
      toast.success('Task created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ─── DnD Handlers ──────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag(event.active.data.current?.task as Task | null)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveDrag(null)
    if (!over) return

    const draggedTask = active.data.current?.task as Task | undefined
    if (!draggedTask) return

    const overData = over.data.current
    let newStatus: string | undefined

    if (overData?.type === 'column') {
      newStatus = overData.column as string
    } else if (overData?.type === 'task') {
      newStatus = (overData.task as Task).status
    }

    if (newStatus && newStatus !== draggedTask.status) {
      updateTaskMutation.mutate({ taskId: draggedTask.id, status: newStatus })
      const label = STATUS_CONFIG[newStatus]?.label || newStatus
      toast.success(`Task moved to ${label}`)
    }
  }, [updateTaskMutation])

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleOpenDetail = useCallback((task: Task) => {
    setSelectedTask(task)
    setDrawerOpen(true)
  }, [])

  const handleComplete = useCallback((taskId: string) => {
    updateTaskMutation.mutate({ taskId, status: 'completed' })
    toast.success('Task completed')
  }, [updateTaskMutation])

  const handleDelete = useCallback((taskId: string) => {
    deleteTaskMutation.mutate(taskId)
  }, [deleteTaskMutation])

  const handleCreate = useCallback((form: Record<string, string>) => {
    createMutation.mutate(form)
  }, [createMutation])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }, [sortField])

  // ─── Render ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ padding: '24px 28px', minHeight: '100vh', background: C.dark }}>
        {/* CSS animations */}
        <style>{`
          @keyframes shimmer {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulseBadge {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
            50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          }
        `}</style>
        <LoadingSkeleton />
      </div>
    )
  }

  const hasActiveFilters = priorityFilter || statusFilter || searchQuery || activeChip !== 'all'

  return (
    <>
      {/* Global CSS animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseBadge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
      `}</style>

      <div style={{ padding: '24px 28px', minHeight: '100vh', background: C.dark }}>
        {/* ═══ Page Header ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 24, flexWrap: 'wrap', gap: 12,
          }}
        >
          <div>
            <h1 style={{
              fontSize: 22, fontWeight: 700, color: C.white,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: C.yellowMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ListTodo size={18} style={{ color: C.yellow }} />
              </div>
              Tasks
            </h1>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              Manage and track all your tasks across the pipeline
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              border: 'none', background: quickCreateOpen ? C.yellowHover : C.yellow, color: C.dark,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
              boxShadow: quickCreateOpen ? '0 4px 20px rgba(243, 216, 64, 0.35)' : '0 4px 15px rgba(243, 216, 64, 0.2)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.yellowHover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = quickCreateOpen ? C.yellowHover : C.yellow }}
          >
            {quickCreateOpen ? <X size={16} /> : <Plus size={16} />}
            {quickCreateOpen ? 'Close' : 'Create Task'}
          </motion.button>
        </motion.div>

        {/* ═══ Stats Dashboard ═══ */}
        <StatsDashboard tasks={rawTasks} />

        {/* ═══ Today's Focus — Compact Bar ═══ */}
        {(() => {
          const overdueCount = rawTasks.filter((t) => isOverdue(t.dueDate, t.status) && t.status !== 'cancelled').length
          const dueTodayCount = rawTasks.filter((t) => isDueToday(t.dueDate) && t.status !== 'completed' && t.status !== 'cancelled').length
          if (overdueCount === 0 && dueTodayCount === 0) return null
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '10px 16px', marginBottom: 14,
                background: C.surface, borderRadius: 10,
                border: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, whiteSpace: 'nowrap' }}>Today's Focus</span>
              {overdueCount > 0 && (
                <motion.button
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveChip(activeChip === 'overdue' ? 'all' : 'overdue')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 8,
                    fontSize: 11, fontWeight: 700,
                    color: C.white, backgroundColor: C.red,
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: activeChip === 'overdue' ? `0 0 0 2px ${C.red}50` : 'none',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <AlertCircle size={12} />
                  {overdueCount} overdue
                </motion.button>
              )}
              {dueTodayCount > 0 && (
                <motion.button
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveChip(activeChip === 'today' ? 'all' : 'today')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 8,
                    fontSize: 11, fontWeight: 700,
                    color: C.white, backgroundColor: C.orange,
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: activeChip === 'today' ? `0 0 0 2px ${C.orange}50` : 'none',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <Clock size={12} />
                  {dueTodayCount} due today
                </motion.button>
              )}
            </motion.div>
          )
        })()}

        {/* ═══ Quick Actions Toolbar ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, marginBottom: 20, flexWrap: 'wrap',
          }}
        >
          {/* Left: Search + Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {/* Search */}
            <div style={{
              position: 'relative', flex: 1, maxWidth: 300,
            }}>
              <Search size={15} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: C.faint, pointerEvents: 'none',
              }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                style={{
                  width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.white, fontSize: 13, outline: 'none',
                  fontFamily: 'inherit', transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.yellow + '40' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 20, height: 20, borderRadius: '50%', border: 'none',
                    background: C.border, color: C.muted, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, fontSize: 12,
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 8, border: `1px solid ${hasActiveFilters ? C.yellow + '40' : C.border}`,
                background: hasActiveFilters ? C.yellowMuted : 'transparent',
                color: hasActiveFilters ? C.yellow : C.muted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!hasActiveFilters) {
                  e.currentTarget.style.borderColor = C.yellow + '30'
                  e.currentTarget.style.color = C.white
                }
              }}
              onMouseLeave={(e) => {
                if (!hasActiveFilters) {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.color = C.muted
                }
              }}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && (
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', background: C.yellow,
                  color: C.dark, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {[priorityFilter, statusFilter].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Right: View toggles */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            background: C.surface, borderRadius: 10, padding: 3,
            border: `1px solid ${C.border}`,
          }}>
            <ToolbarBtn active={viewMode === 'board'} onClick={() => setViewMode('board')} icon={LayoutGrid}>
              Board
            </ToolbarBtn>
            <ToolbarBtn active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={List}>
              List
            </ToolbarBtn>
            <ToolbarBtn active={viewMode === 'timeline'} onClick={() => setViewMode('timeline')} icon={Calendar}>
              Timeline
            </ToolbarBtn>
          </div>
        </motion.div>

        {/* ═══ Filter Chips ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 16, flexWrap: 'wrap',
          }}
        >
          {([
            { key: 'all', label: 'All', icon: ListTodo },
            { key: 'my', label: 'My Tasks', icon: User },
            { key: 'overdue', label: 'Overdue', icon: AlertCircle },
            { key: 'today', label: 'Due Today', icon: Calendar },
            { key: 'high', label: 'High Priority', icon: Zap },
          ] as const).map((chip) => {
            const ChipIcon = chip.icon
            const isActive = activeChip === chip.key
            const chipColor = chip.key === 'overdue' ? C.red : chip.key === 'today' ? C.orange : chip.key === 'high' ? C.yellow : undefined
            return (
              <motion.button
                key={chip.key}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveChip(isActive ? 'all' : chip.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 8,
                  border: `1px solid ${isActive ? (chipColor || C.yellow) + '50' : C.border}`,
                  background: isActive ? (chipColor ? `${chipColor}15` : C.yellowMuted) : 'transparent',
                  color: isActive ? (chipColor || C.yellow) : C.muted,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) { e.currentTarget.style.color = C.white; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = C.yellow + '30' }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border }
                }}
              >
                <ChipIcon size={13} />
                {chip.label}
              </motion.button>
            )
          })}
          {activeChip !== 'all' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setActiveChip('all')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 8, border: 'none',
                background: C.redMuted, color: C.red,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.red + '20' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.redMuted }}
            >
              <X size={11} /> Clear
            </motion.button>
          )}
        </motion.div>

        {/* ═══ Filter Bar (expandable) ═══ */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', marginBottom: 16 }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: C.surface, borderRadius: 12,
                border: `1px solid ${C.border}`, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginRight: 4 }}>Filter by:</span>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '6px 28px 6px 10px', borderRadius: 8,
                    border: `1px solid ${statusFilter ? C.yellow + '40' : C.border}`,
                    background: statusFilter ? C.yellowMuted : C.deeper,
                    color: statusFilter ? C.yellow : C.muted,
                    fontSize: 12, fontWeight: 500, outline: 'none',
                    fontFamily: 'inherit', cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                {/* Priority filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{
                    padding: '6px 28px 6px 10px', borderRadius: 8,
                    border: `1px solid ${priorityFilter ? C.yellow + '40' : C.border}`,
                    background: priorityFilter ? C.yellowMuted : C.deeper,
                    color: priorityFilter ? C.yellow : C.muted,
                    fontSize: 12, fontWeight: 500, outline: 'none',
                    fontFamily: 'inherit', cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                  }}
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setStatusFilter(''); setPriorityFilter('') }}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: C.redMuted, color: C.red,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.red + '20' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.redMuted }}
                  >
                    <X size={12} /> Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Content Area ═══ */}
        {filteredTasks.length === 0 && !isLoading ? (
          <EmptyState />
        ) : viewMode === 'board' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div style={{
              display: 'flex', gap: 12, overflowX: 'auto',
              paddingBottom: 8,
            }}>
              {COLUMNS.map((col, colIdx) => (
                <TaskColumn
                  key={col.key}
                  col={col}
                  tasks={tasksByStatus[col.key] || []}
                  allTasks={rawTasks}
                  onOpenDetail={handleOpenDetail}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onQuickCreate={handleCreate}
                  showEnhancedCreate={colIdx === 0 && quickCreateOpen}
                  onCloseEnhancedCreate={() => setQuickCreateOpen(false)}
                  onEnhancedCreate={handleCreate}
                  isCreatePending={createMutation.isPending}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeDrag && <DragOverlayCard task={activeDrag} />}
            </DragOverlay>
          </DndContext>
        ) : viewMode === 'list' ? (
          <ListView
            tasks={filteredTasks}
            onOpenDetail={handleOpenDetail}
            onComplete={handleComplete}
            onDelete={handleDelete}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
        ) : (
          <TimelineView
            tasks={filteredTasks}
            onOpenDetail={handleOpenDetail}
          />
        )}

        {/* ═══ Footer Count ═══ */}
        {filteredTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: 20, paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 12, color: C.faint }}>
              Showing {filteredTasks.length} of {rawTasks.length} tasks
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter(''); setPriorityFilter(''); setActiveChip('all') }}
                style={{
                  fontSize: 12, color: C.yellow, background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600, transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* ═══ Create Task Dialog ═══ */}
      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contacts={contacts}
        deals={deals}
        onCreate={handleCreate}
        isPending={createMutation.isPending}
      />

      {/* ═══ Task Detail Sheet ═══ */}
      <TaskDetailSheet
        key={selectedTask?.id ?? 'closed'}
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={(v) => { setDrawerOpen(v); if (!v) setSelectedTask(null) }}
        contacts={contacts}
        deals={deals}
      />
    </>
  )
}
