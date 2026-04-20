'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, ChevronLeft, ChevronRight, Filter, Mail, Phone,
  Building2, Users, X, Calendar, Clock, Video, MapPin, Linkedin,
  StickyNote, PhoneCall, FileText, CheckSquare, DollarSign,
  ExternalLink, Globe, Trash2, ArrowUpDown, LayoutGrid, List,
  Sun, Edit3, UserPlus, TrendingUp, TrendingDown, Minus, User,
  AlertCircle, BarChart3, MessageSquare, Timer, Tag, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { PriorityBadge } from '@/components/crm/PriorityBadge'
import { ActivityIcon } from '@/components/crm/ActivityIcon'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ══════════════════════════════════════════════════════════════
//  DESIGN SYSTEM
// ══════════════════════════════════════════════════════════════
const C = {
  dark: '#0A0A0A',
  surface: '#1A1A1A',
  deeper: '#141414',
  border: '#2A2A2A',
  yellow: '#F3D840',
  yellowHover: '#E5C832',
  yellowDim: 'rgba(243,216,64,0.08)',
  muted: '#A0A0A0',
  faint: '#666666',
  white: '#FFFFFF',
  danger: '#ef4444',
  success: '#22c55e',
}

// ══════════════════════════════════════════════════════════════
//  REUSABLE INLINE STYLE HELPERS
// ══════════════════════════════════════════════════════════════
const flex = { display: 'flex' }
const flexCol = { display: 'flex', flexDirection: 'column' }
const flexRow = { display: 'flex', flexDirection: 'row' }
const flexCenter = { display: 'flex', alignItems: 'center', justifyContent: 'center' }
const flexBetween = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const flexStart = { display: 'flex', alignItems: 'center' }
const gap2 = { ...flexCol, gap: '0.5rem' }
const gap3 = { ...flexCol, gap: '0.75rem' }
const gap4 = { ...flexCol, gap: '1rem' }

const btnPrimary: React.CSSProperties = {
  backgroundColor: C.yellow, color: C.dark, fontWeight: 600, border: 'none',
  cursor: 'pointer', borderRadius: '8px', fontSize: '14px',
  padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px',
  transition: 'all 0.2s ease',
}
const btnGhost: React.CSSProperties = {
  backgroundColor: 'transparent', color: C.muted, border: 'none', cursor: 'pointer',
  borderRadius: '8px', fontSize: '13px', padding: '6px 10px',
  display: 'flex', alignItems: 'center', gap: '4px',
  transition: 'all 0.15s ease',
}
const btnDanger: React.CSSProperties = {
  backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
  cursor: 'pointer', borderRadius: '8px', fontSize: '13px', padding: '6px 12px',
  display: 'flex', alignItems: 'center', gap: '4px',
  transition: 'all 0.15s ease',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const,
  letterSpacing: '0.08em', color: C.faint, marginBottom: '12px',
}

const cardBase: React.CSSProperties = {
  backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
}

const inputDark: React.CSSProperties = {
  backgroundColor: C.deeper, border: `1px solid ${C.border}`, borderRadius: '8px',
  color: C.white, fontSize: '14px', padding: '8px 12px', width: '100%',
  outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 500, color: C.muted, marginBottom: '4px', display: 'block',
}

// ══════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════
interface ContactRow {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  jobTitle: string | null
  linkedin: string | null
  source: string
  status: string
  address: string | null
  city: string | null
  country: string | null
  avatar: string | null
  lastContactAt: string | null
  createdAt: string
  company: { id: string; name: string } | null
  tags: { tag: { id: string; name: string; color: string } }[]
  _count?: { deals: number }
}

interface ContactDetail extends ContactRow {
  description: string | null
  deals: Array<{
    id: string; title: string; value: number; probability: number
    closeDate: string | null
    stage: { id: string; name: string; color: string }
    assignee: { id: string; name: string; avatar: string | null } | null
  }>
  activities: Array<{
    id: string; type: string; subject: string; description: string | null
    duration: number | null; status: string | null; createdAt: string
    user: { id: string; name: string; avatar: string | null } | null
    deal: { id: string; title: string } | null
  }>
  tasks: Array<{
    id: string; title: string; priority: string; status: string
    dueDate: string | null
    assignee: { id: string; name: string; avatar: string | null } | null
    deal: { id: string; title: string } | null
  }>
  notes: Array<{
    id: string; content: string; createdAt: string
    user: { id: string; name: string; avatar: string | null } | null
  }>
}

interface CompanyRow {
  id: string; name: string; website: string | null
  industry: string | null; employees: number | null
  address: string | null; city: string | null; country: string | null
  phone: string | null; description: string | null; createdAt: string
  _count: { contacts: number; deals: number }
}

// ══════════════════════════════════════════════════════════════
//  OPTIONS & CONSTANTS
// ══════════════════════════════════════════════════════════════
const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'customer', label: 'Customer' },
  { value: 'churned', label: 'Churned' },
  { value: 'inactive', label: 'Inactive' },
]

const sourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'cold', label: 'Cold Outreach' },
  { value: 'event', label: 'Event' },
]

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'recent_contact', label: 'Recently Contacted' },
]

const callOutcomes = [
  { value: 'connected', label: 'Connected' },
  { value: 'left_voicemail', label: 'Left Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'scheduled_callback', label: 'Scheduled Callback' },
]

const statusColour: Record<string, string> = {
  lead: '#3b82f6', prospect: '#a855f7', customer: '#22c55e',
  churned: '#ef4444', inactive: '#6b7280',
}
const sourceColour: Record<string, string> = {
  website: '#06b6d4', referral: '#f59e0b', linkedin: '#6366f1',
  cold: '#ec4899', event: '#14b8a6', other: '#6b7280',
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
function initials(first: string, last: string) {
  return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return format(new Date(dateStr), 'MMM d, yyyy')
}

function emptyForm() {
  return {
    firstName: '', lastName: '', email: '', phone: '', jobTitle: '',
    source: 'website', status: 'lead', address: '', city: '',
    country: 'Ireland', description: '', companyId: '',
  }
}

// ══════════════════════════════════════════════════════════════
//  ANIMATED VALUE HOOK
// ══════════════════════════════════════════════════════════════
function useAnimatedValue(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  const prevTarget = useRef(target)
  useEffect(() => {
    if (target === 0) {
      // Schedule setValue outside the synchronous body to satisfy lint
      const id = requestAnimationFrame(() => {
        setValue(0)
        prevTarget.current = 0
      })
      return () => cancelAnimationFrame(id)
    }
    const startVal = prevTarget.current === target && value === target ? 0 : value
    const startTime = performance.now()
    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(startVal + (eased * (target - startVal))))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    prevTarget.current = target
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return value
}

// ══════════════════════════════════════════════════════════════
//  STAT CARD (Enhanced with animated counter + trend arrow)
// ══════════════════════════════════════════════════════════════
function StatCard({
  icon: Icon, label, value, colour, trend, suffix = '', delay = 0,
}: {
  icon: React.ElementType; label: string; value: number
  colour: string; trend?: 'up' | 'down' | 'flat'; suffix?: string; delay?: number
}) {
  const animated = useAnimatedValue(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      style={{
        ...cardBase, padding: '20px 20px', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', minWidth: 0, flex: '1',
      }}
    >
      <div style={{ ...flexCol, gap: '6px', minWidth: 0 }}>
        <span style={{
          fontSize: '11px', color: C.faint, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {label}
        </span>
        <span style={{ fontSize: '30px', fontWeight: 800, color: C.white, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {animated.toLocaleString()}{suffix}
        </span>
        {trend && (
          <div style={{ ...flexStart, gap: '4px' }}>
            {trend === 'up' && <TrendingUp style={{ width: 13, height: 13, color: C.success }} />}
            {trend === 'down' && <TrendingDown style={{ width: 13, height: 13, color: C.danger }} />}
            {trend === 'flat' && <Minus style={{ width: 13, height: 13, color: C.faint }} />}
            <span style={{
              fontSize: '11px', fontWeight: 600,
              color: trend === 'up' ? C.success : trend === 'down' ? C.danger : C.faint,
            }}>
              {trend === 'up' ? '+12% this month' : trend === 'down' ? '-3% this month' : 'Steady'}
            </span>
          </div>
        )}
      </div>
      <div style={{
        width: 42, height: 42, borderRadius: '11px', backgroundColor: `${colour}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        border: `1px solid ${colour}18`,
      }}>
        <Icon style={{ width: 20, height: 20, color: colour }} />
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
//  STATS DASHBOARD (6 cards)
// ══════════════════════════════════════════════════════════════
function StatsDashboard({ contacts }: { contacts: ContactRow[] }) {
  const total = contacts.length
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = contacts.filter(c => new Date(c.createdAt) >= monthStart).length
  const leads = contacts.filter(c => c.status === 'lead').length
  const prospects = contacts.filter(c => c.status === 'prospect').length
  const customers = contacts.filter(c => c.status === 'customer').length
  const contacted = contacts.filter(c => c.lastContactAt).map(c => daysSince(c.lastContactAt))
  const avgDays = contacted.length > 0
    ? Math.round(contacted.reduce((a, b) => a + b, 0) / contacted.length)
    : 0

  const stats: Array<{
    icon: React.ElementType; label: string; value: number
    colour: string; trend: 'up' | 'down' | 'flat'; suffix?: string
  }> = [
    { icon: Users, label: 'Total Contacts', value: total, colour: C.yellow, trend: 'up' },
    { icon: UserPlus, label: 'New This Month', value: newThisMonth, colour: '#22c55e', trend: newThisMonth > 0 ? 'up' : 'flat' },
    { icon: User, label: 'Leads', value: leads, colour: '#3b82f6', trend: leads > 5 ? 'up' : 'flat' },
    { icon: TrendingUp, label: 'Prospects', value: prospects, colour: '#a855f7', trend: prospects > 3 ? 'up' : 'flat' },
    { icon: Building2, label: 'Customers', value: customers, colour: '#f59e0b', trend: customers > 2 ? 'up' : 'flat' },
    { icon: Timer, label: 'Avg Days Since Contact', value: avgDays, colour: '#06b6d4', suffix: 'd', trend: avgDays < 14 ? 'up' : 'down' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
    }}>
      {stats.map((s, i) => (
        <StatCard key={s.label} {...s} delay={i * 0.06} />
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  EMPTY STATE (Premium animated)
// ══════════════════════════════════════════════════════════════
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        ...flexCol, alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px', gap: '20px',
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0], scale: [1, 1.03, 1] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        style={{
          width: 96, height: 96, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.yellow}18, ${C.yellow}08)`,
          ...flexCenter, border: `2px dashed ${C.yellow}30`,
        }}
      >
        <Users style={{ width: 40, height: 40, color: C.yellow }} />
      </motion.div>
      <div style={{ ...flexCol, alignItems: 'center', gap: '8px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.white }}>
          No contacts yet
        </h3>
        <p style={{
          fontSize: '14px', color: C.muted, textAlign: 'center',
          maxWidth: 400, lineHeight: 1.6,
        }}>
          Start building your network by adding your first contact.
          Import from a spreadsheet or add them manually.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCreate}
        style={btnPrimary}
      >
        <Plus style={{ width: 18, height: 18 }} />
        Add Your First Contact
      </motion.button>
    </motion.div>
  )
}

function EmptySection({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ ...flexCol, alignItems: 'center', padding: '40px 16px', gap: '10px' }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        backgroundColor: `${C.yellow}08`, ...flexCenter,
      }}>
        <Icon style={{ width: 20, height: 20, color: C.faint }} />
      </div>
      <span style={{ fontSize: '13px', color: C.faint, fontWeight: 500 }}>
        No {label} yet
      </span>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
//  STATUS / SOURCE INLINE BADGES
// ══════════════════════════════════════════════════════════════
function StatusDot({ status }: { status: string }) {
  const colour = statusColour[status] || C.faint
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
      color: colour, backgroundColor: `${colour}14`, padding: '3px 10px',
      borderRadius: '20px', border: `1px solid ${colour}25`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        backgroundColor: colour, display: 'inline-block',
        boxShadow: `0 0 6px ${colour}60`,
      }} />
      {status}
    </span>
  )
}

function SourceTag({ source }: { source: string }) {
  const colour = sourceColour[source] || C.faint
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, textTransform: 'capitalize',
      color: colour, backgroundColor: `${colour}12`, padding: '2px 8px',
      borderRadius: '6px',
    }}>
      {source}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════
//  CONTACT CARD (GRID VIEW)
// ══════════════════════════════════════════════════════════════
function ContactCard({
  contact, index, onSelect, onAction,
}: {
  contact: ContactRow; index: number
  onSelect: () => void
  onAction: (action: string, c: ContactRow) => void
}) {
  const [hovered, setHovered] = useState(false)
  const dealCount = contact._count?.deals ?? 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.8), ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        ...cardBase, padding: '20px', cursor: 'pointer',
        transform: hovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px ${C.yellow}35`
          : '0 2px 8px rgba(0,0,0,0.15)',
        borderColor: hovered ? `${C.yellow}40` : C.border,
      }}
    >
      {/* Top row: avatar + name */}
      <div style={{ ...flexBetween, marginBottom: '14px' }}>
        <div style={{ ...flexStart, gap: '12px', minWidth: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${C.yellow}, #e8c430)`,
            ...flexCenter, fontSize: '15px', fontWeight: 800, color: C.dark,
            boxShadow: `0 4px 12px ${C.yellow}30`,
          }}>
            {initials(contact.firstName, contact.lastName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '15px', fontWeight: 700, color: C.white,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {contact.firstName} {contact.lastName}
            </div>
            <div style={{
              fontSize: '12px', color: C.faint,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {contact.jobTitle || 'No title'}{contact.company ? ` at ${contact.company.name}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Status + Source badges */}
      <div style={{ ...flexStart, gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <StatusDot status={contact.status} />
        <SourceTag source={contact.source} />
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div style={{ ...flexStart, gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {contact.tags.slice(0, 3).map(t => (
            <span key={t.tag.id} style={{
              fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '4px',
              color: t.tag.color || C.muted, backgroundColor: `${t.tag.color || C.muted}18`,
              border: `1px solid ${t.tag.color || C.muted}30`,
            }}>
              {t.tag.name}
            </span>
          ))}
          {contact.tags.length > 3 && (
            <span style={{ fontSize: '10px', color: C.faint }}>+{contact.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Contact details */}
      <div style={{ ...gap2, marginBottom: '14px' }}>
        {contact.email && (
          <div style={{ ...flexStart, gap: '8px' }}>
            <Mail style={{ width: 13, height: 13, color: C.faint, flexShrink: 0 }} />
            <span style={{
              fontSize: '12px', color: C.muted,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {contact.email}
            </span>
          </div>
        )}
        {contact.phone && (
          <div style={{ ...flexStart, gap: '8px' }}>
            <Phone style={{ width: 13, height: 13, color: C.faint, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: C.muted }}>{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Footer: last contact + deals + quick actions */}
      <div style={{
        ...flexBetween, paddingTop: '12px',
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ ...flexStart, gap: '10px' }}>
          <span style={{ fontSize: '11px', color: C.faint }}>
            {timeAgo(contact.lastContactAt)}
          </span>
          {dealCount > 0 && (
            <span style={{ ...flexStart, gap: '3px', fontSize: '11px', color: C.yellow, fontWeight: 600 }}>
              <DollarSign style={{ width: 11, height: 11 }} />
              {dealCount} deal{dealCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <AnimatePresence>
          {(hovered) && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
              style={{ ...flexStart, gap: '2px' }}
              onClick={e => e.stopPropagation()}
            >
              {contact.email && (
                <button
                  onClick={() => onAction('email', contact)}
                  style={{
                    width: 28, height: 28, borderRadius: '6px', border: 'none',
                    backgroundColor: 'transparent', color: C.faint, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.backgroundColor = `${C.yellow}15`
                    el.style.color = C.yellow
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.backgroundColor = 'transparent'
                    el.style.color = C.faint
                  }}
                >
                  <Mail style={{ width: 14, height: 14 }} />
                </button>
              )}
              {contact.phone && (
                <button
                  onClick={() => onAction('call', contact)}
                  style={{
                    width: 28, height: 28, borderRadius: '6px', border: 'none',
                    backgroundColor: 'transparent', color: C.faint, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.backgroundColor = `${C.yellow}15`
                    el.style.color = C.yellow
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.backgroundColor = 'transparent'
                    el.style.color = C.faint
                  }}
                >
                  <Phone style={{ width: 14, height: 14 }} />
                </button>
              )}
              <button
                onClick={() => onAction('note', contact)}
                style={{
                  width: 28, height: 28, borderRadius: '6px', border: 'none',
                  backgroundColor: 'transparent', color: C.faint, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.backgroundColor = `${C.yellow}15`
                  el.style.color = C.yellow
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.backgroundColor = 'transparent'
                  el.style.color = C.faint
                }}
              >
                <StickyNote style={{ width: 14, height: 14 }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
//  CONTACT TABLE ROW
// ══════════════════════════════════════════════════════════════
function ContactTableRow({
  contact, onSelect,
}: { contact: ContactRow; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...flexStart, padding: '12px 16px', cursor: 'pointer',
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: hovered ? `${C.yellow}06` : 'transparent',
        transition: 'background-color 0.15s ease',
        gap: '12px', minHeight: 52, alignItems: 'center',
      }}
    >
      {/* Avatar + Name */}
      <div style={{ ...flexStart, gap: '10px', minWidth: 180, flex: '1 1 180px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${C.yellow}, #e8c430)`,
          ...flexCenter, fontSize: '12px', fontWeight: 700, color: C.dark,
        }}>
          {initials(contact.firstName, contact.lastName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: C.white,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {contact.firstName} {contact.lastName}
          </div>
          <div style={{
            fontSize: '11px', color: C.faint,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {contact.jobTitle}
          </div>
        </div>
      </div>

      {/* Email */}
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <span style={{
          fontSize: '13px', color: C.muted, display: 'block',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {contact.email || '—'}
        </span>
      </div>

      {/* Phone */}
      <div style={{ flex: '0 0 130px', minWidth: 0 }}>
        <span style={{ fontSize: '13px', color: C.muted }}>{contact.phone || '—'}</span>
      </div>

      {/* Company */}
      <div style={{ flex: '0 0 130px', minWidth: 0 }}>
        <span style={{
          fontSize: '13px', color: C.muted, display: 'block',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {contact.company?.name || '—'}
        </span>
      </div>

      {/* Status */}
      <div style={{ flex: '0 0 100px' }}>
        <StatusDot status={contact.status} />
      </div>

      {/* Source */}
      <div style={{ flex: '0 0 90px' }}>
        <SourceTag source={contact.source} />
      </div>

      {/* Last Contact */}
      <div style={{ flex: '0 0 90px' }}>
        <span style={{ fontSize: '12px', color: C.faint }}>
          {timeAgo(contact.lastContactAt)}
        </span>
      </div>

      {/* Deals */}
      <div style={{ flex: '0 0 50px', textAlign: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: C.white }}>
          {contact._count?.deals ?? 0}
        </span>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TABLE HEADER (Sortable)
// ══════════════════════════════════════════════════════════════
function TableHeader({ sort, onSort }: { sort: string; onSort: (s: string) => void }) {
  const col = (label: string, field: string, flex = '1 1 180px') => (
    <button
      onClick={() => onSort(field)}
      style={{
        flex, minWidth: 0, border: 'none', backgroundColor: 'transparent',
        color: sort === field ? C.yellow : C.faint, fontSize: '11px',
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: '4px',
        transition: 'color 0.15s ease', padding: 0,
      }}
      onMouseEnter={e => {
        if (sort !== field) (e.currentTarget as HTMLElement).style.color = C.muted
      }}
      onMouseLeave={e => {
        if (sort !== field) (e.currentTarget as HTMLElement).style.color = C.faint
      }}
    >
      {label}
      <ArrowUpDown style={{ width: 12, height: 12 }} />
    </button>
  )

  return (
    <div style={{
      ...flexStart, padding: '10px 16px', borderBottom: `2px solid ${C.border}`,
      backgroundColor: C.deeper, gap: '12px', position: 'sticky', top: 0, zIndex: 5,
    }}>
      {col('Name', 'name_asc', '1 1 180px')}
      {col('Email', 'email')}
      {col('Phone', 'phone', '0 0 130px')}
      {col('Company', 'company', '0 0 130px')}
      {col('Status', 'status', '0 0 100px')}
      {col('Source', 'source', '0 0 90px')}
      {col('Last Contact', 'recent_contact', '0 0 90px')}
      <div style={{ flex: '0 0 50px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: C.faint,
        }}>Deals</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  ADD NOTE DIALOG
// ══════════════════════════════════════════════════════════════
function AddNoteDialog({ contactId, open, onOpenChange }: {
  contactId: string; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const mutation = useMutation({
    mutationFn: async (body: { content: string; contactId: string }) => {
      const res = await fetch('/api/crm/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-detail'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setContent(''); onOpenChange(false); toast.success('Note added')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) setContent('')
    onOpenChange(v)
  }, [onOpenChange])
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent style={{ maxWidth: 448, backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white }}>Add Note</DialogTitle>
        </DialogHeader>
        <div style={{ ...gap3, padding: '8px 0' }}>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your note here..."
            rows={4}
            style={{ ...inputDark, minHeight: 100, resize: 'vertical' }}
          />
          <button
            onClick={() => {
              if (!content.trim()) { toast.error('Note content is required'); return }
              mutation.mutate({ content, contactId })
            }}
            disabled={mutation.isPending}
            style={{
              ...btnPrimary, width: '100%', justifyContent: 'center', padding: '10px',
              opacity: mutation.isPending ? 0.6 : 1,
            }}
          >
            {mutation.isPending ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════
//  LOG CALL DIALOG
// ══════════════════════════════════════════════════════════════
function LogCallDialog({ contact, open, onOpenChange }: {
  contact: { firstName: string; lastName: string; id: string }
  open: boolean; onOpenChange: (v: boolean) => void
}) {
  const qc = useQueryClient()
  const [outcome, setOutcome] = useState('connected')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('5')
  const mutation = useMutation({
    mutationFn: async (body: Record<string, string | number>) => {
      const res = await fetch('/api/crm/call', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to log call')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-detail'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
      reset(); onOpenChange(false); toast.success('Call logged')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const reset = () => { setOutcome('connected'); setNotes(''); setDuration('5') }
  useEffect(() => { if (!open) reset() }, [open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: 448, backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white }}>Log Call</DialogTitle>
        </DialogHeader>
        <div style={{ ...gap3, padding: '8px 0' }}>
          <div style={{ ...flexStart, gap: '6px' }}>
            <span style={{ fontSize: '13px', color: C.faint }}>Contact:</span>
            <span style={{ fontSize: '13px', color: C.white, fontWeight: 600 }}>
              {contact.firstName} {contact.lastName}
            </span>
          </div>
          <div style={gap2}>
            <Label style={labelStyle}>Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger style={inputDark}><SelectValue /></SelectTrigger>
              <SelectContent>
                {callOutcomes.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div style={gap2}>
            <Label style={labelStyle}>Duration (minutes)</Label>
            <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} style={inputDark} />
          </div>
          <div style={gap2}>
            <Label style={labelStyle}>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Call notes..." rows={3} style={inputDark} />
          </div>
          <button
            onClick={() => mutation.mutate({ contactId: contact.id, outcome, duration: parseInt(duration) || 0, notes })}
            disabled={mutation.isPending}
            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '10px', opacity: mutation.isPending ? 0.6 : 1 }}
          >
            {mutation.isPending ? 'Logging...' : 'Log Call'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════
//  SEND EMAIL DIALOG
// ══════════════════════════════════════════════════════════════
function SendEmailDialog({ contact, open, onOpenChange }: {
  contact: { firstName: string; lastName: string; id: string; email: string | null }
  open: boolean; onOpenChange: (v: boolean) => void
}) {
  const qc = useQueryClient()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [to, setTo] = useState('')
  const handleOpen = useCallback((v: boolean) => {
    if (v) setTo(contact.email || '')
    onOpenChange(v)
  }, [contact.email, onOpenChange])
  const reset = () => { setSubject(''); setBody(''); setTo('') }
  const wrappedOpenChange = useCallback((v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }, [onOpenChange])
  const mutation = useMutation({
    mutationFn: async (data: { to: string; subject: string; body: string; contactId: string }) => {
      const res = await fetch('/api/crm/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to send email')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-detail'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
      reset(); onOpenChange(false); toast.success('Email sent')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Dialog open={open} onOpenChange={wrappedOpenChange}>
      <DialogContent style={{ maxWidth: 512, backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white }}>Send Email</DialogTitle>
        </DialogHeader>
        <div style={{ ...gap3, padding: '8px 0' }}>
          <div style={gap2}>
            <Label style={labelStyle}>To</Label>
            <Input value={to} onChange={e => setTo(e.target.value)} placeholder="email@example.com" style={inputDark} />
          </div>
          <div style={gap2}>
            <Label style={labelStyle}>Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" style={inputDark} />
          </div>
          <div style={gap2}>
            <Label style={labelStyle}>Body</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your email..."
              rows={6}
              style={{ ...inputDark, minHeight: 140, resize: 'vertical' }}
            />
          </div>
          <button
            onClick={() => {
              if (!to || !subject || !body) { toast.error('All fields are required'); return }
              mutation.mutate({ to, subject, body, contactId: contact.id })
            }}
            disabled={mutation.isPending}
            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '10px', opacity: mutation.isPending ? 0.6 : 1 }}
          >
            {mutation.isPending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════
//  CREATE TASK DIALOG
// ══════════════════════════════════════════════════════════════
function CreateTaskDialog({ contact, dealOptions, open, onOpenChange }: {
  contact: { firstName: string; lastName: string; id: string }
  dealOptions: Array<{ id: string; title: string }>
  open: boolean; onOpenChange: (v: boolean) => void
}) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [dealId, setDealId] = useState('')
  const reset = () => { setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setDealId('') }
  const wrappedOpenChange = useCallback((v: boolean) => { if (!v) reset(); onOpenChange(v) }, [onOpenChange])
  const mutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-detail'] })
      reset(); onOpenChange(false); toast.success('Task created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Dialog open={open} onOpenChange={wrappedOpenChange}>
      <DialogContent style={{ maxWidth: 448, backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white }}>Create Task</DialogTitle>
        </DialogHeader>
        <div style={{ ...gap3, padding: '8px 0' }}>
          <div style={gap2}>
            <Label style={labelStyle}>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" style={inputDark} />
          </div>
          <div style={gap2}>
            <Label style={labelStyle}>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Task description..." rows={3} style={inputDark} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={gap2}>
              <Label style={labelStyle}>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger style={inputDark}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={gap2}>
              <Label style={labelStyle}>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputDark} />
            </div>
          </div>
          {dealOptions.length > 0 && (
            <div style={gap2}>
              <Label style={labelStyle}>Linked Deal</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger style={inputDark}><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {dealOptions.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <button
            onClick={() => {
              if (!title) { toast.error('Title is required'); return }
              mutation.mutate({ title, description, priority, dueDate: dueDate ?? '', contactId: contact.id, dealId: dealId ?? '' })
            }}
            disabled={mutation.isPending}
            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '10px', opacity: mutation.isPending ? 0.6 : 1 }}
          >
            {mutation.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════
//  CREATE / EDIT CONTACT DIALOG
// ══════════════════════════════════════════════════════════════
function ContactFormDialog({
  open, onOpenChange, initialForm, editContactId, companies,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  initialForm: ReturnType<typeof emptyForm>; editContactId: string | null; companies: CompanyRow[]
}) {
  const qc = useQueryClient()
  const isEdit = !!editContactId
  const [form, setForm] = useState(initialForm)

  const mutation = useMutation({
    mutationFn: async (body: Record<string, string | null | undefined>) => {
      const url = isEdit ? `/api/crm/contacts/${editContactId}` : '/api/crm/contacts'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(isEdit ? 'Failed to update contact' : 'Failed to create contact')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['companies'] })
      if (editContactId) qc.invalidateQueries({ queryKey: ['contact-detail'] })
      setForm(emptyForm()); onOpenChange(false)
      toast.success(isEdit ? 'Contact updated' : 'Contact created')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required'); return
    }
    mutation.mutate({ ...form, companyId: form.companyId || null })
  }

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.white }}>
            {isEdit ? 'Edit Contact' : 'New Contact'}
          </DialogTitle>
        </DialogHeader>
        <div style={{ ...gap3, padding: '4px 0' }}>
          {/* Two-column: first + last */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={gap2}>
              <Label style={labelStyle}>First Name *</Label>
              <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="John" style={inputDark} />
            </div>
            <div style={gap2}>
              <Label style={labelStyle}>Last Name *</Label>
              <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Smith" style={inputDark} />
            </div>
          </div>
          {/* Email + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={gap2}>
              <Label style={labelStyle}>Email</Label>
              <Input value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@company.ie" type="email" style={inputDark} />
            </div>
            <div style={gap2}>
              <Label style={labelStyle}>Phone</Label>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+353 87 123 4567" style={inputDark} />
            </div>
          </div>
          {/* Job Title + Company */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={gap2}>
              <Label style={labelStyle}>Job Title</Label>
              <Input value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} placeholder="Facilities Manager" style={inputDark} />
            </div>
            <div style={gap2}>
              <Label style={labelStyle}>Company</Label>
              <Select value={form.companyId} onValueChange={v => update('companyId', v)}>
                <SelectTrigger style={inputDark}><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Source + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={gap2}>
              <Label style={labelStyle}>Source</Label>
              <Select value={form.source} onValueChange={v => update('source', v)}>
                <SelectTrigger style={inputDark}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sourceOptions.filter(s => s.value).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div style={gap2}>
              <Label style={labelStyle}>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger style={inputDark}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.filter(s => s.value).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Address */}
          <div style={gap2}>
            <Label style={labelStyle}>Address</Label>
            <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="1 Main Street" style={inputDark} />
          </div>
          {/* City + Country */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={gap2}>
              <Label style={labelStyle}>City</Label>
              <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Dublin" style={inputDark} />
            </div>
            <div style={gap2}>
              <Label style={labelStyle}>Country</Label>
              <Input value={form.country} onChange={e => update('country', e.target.value)} placeholder="Ireland" style={inputDark} />
            </div>
          </div>
          {/* Description */}
          <div style={gap2}>
            <Label style={labelStyle}>Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Notes about this contact..." rows={3} style={inputDark} />
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <DialogClose asChild>
              <button style={{
                padding: '10px 20px', borderRadius: '8px', border: `1px solid ${C.border}`,
                backgroundColor: 'transparent', color: C.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              }}>
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleSubmit} disabled={mutation.isPending}
              style={{ ...btnPrimary, padding: '10px 24px', opacity: mutation.isPending ? 0.6 : 1 }}
            >
              {mutation.isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Contact')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════
//  CONTACT DETAIL PANEL (560px slide-in with 4 tabs)
// ══════════════════════════════════════════════════════════════
function ContactDetailPanel({
  contactId, onClose, companies,
}: {
  contactId: string; onClose: () => void; companies: CompanyRow[]
}) {
  const qc = useQueryClient()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'activity' | 'tasks'>('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [noteContent, setNoteContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['contact-detail', contactId],
    queryFn: () => fetch(`/api/crm/contacts/${contactId}`).then(r => r.json()),
    enabled: !!contactId,
  })
  const contact: ContactDetail | null = data?.contact || null
  const dealOptions = contact?.deals.map(d => ({ id: d.id, title: d.title })) || []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/contacts/${contactId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete contact')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      onClose(); toast.success('Contact deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Inline add note mutation
  const noteMutation = useMutation({
    mutationFn: async (body: { content: string; contactId: string }) => {
      const res = await fetch('/api/crm/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-detail'] })
      setNoteContent('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const quickActions = [
    { key: 'email', icon: Mail, label: 'Send Email' },
    { key: 'call', icon: PhoneCall, label: 'Log Call' },
    { key: 'note', icon: StickyNote, label: 'Add Note' },
    { key: 'task', icon: CheckSquare, label: 'Create Task' },
    { key: 'meeting', icon: Calendar, label: 'Schedule Meeting' },
  ]

  const tabs: Array<{ key: typeof activeTab; label: string; count: number }> = [
    { key: 'overview', label: 'Overview', count: 0 },
    { key: 'deals', label: 'Deals', count: contact?.deals.length || 0 },
    { key: 'activity', label: 'Activity', count: contact?.activities.length || 0 },
    { key: 'tasks', label: 'Tasks', count: contact?.tasks.length || 0 },
  ]

  if (isLoading) {
    return (
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }}
        style={{
          position: 'fixed', inset: '0 auto 0 0', right: 0,
          width: '100%', maxWidth: 560, ...flexCenter, zIndex: 50, backgroundColor: C.surface,
        }}
      >
        <div style={{ ...flexCol, alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 32, height: 32, border: `3px solid ${C.border}`,
            borderTopColor: C.yellow, borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: C.faint, fontSize: '14px' }}>Loading contact…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </motion.div>
    )
  }

  if (!contact) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 40 }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          position: 'fixed', inset: '0 auto 0 0', right: 0,
          width: '100%', maxWidth: 560,
          backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`,
          zIndex: 50, ...flexCol, boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ═══ HEADER ═══ */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ ...flexBetween, marginBottom: '16px' }}>
            <button onClick={onClose} style={{ ...btnGhost, padding: '6px' }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ ...flexStart, gap: '6px' }}>
              <button onClick={() => setEditOpen(true)} style={btnGhost}>
                <Edit3 style={{ width: 15, height: 15 }} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                style={btnDanger}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div style={{ ...flexStart, gap: '16px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${C.yellow}, #e8c430)`,
              ...flexCenter, fontSize: '18px', fontWeight: 800, color: C.dark,
              boxShadow: `0 6px 16px ${C.yellow}30`,
            }}>
              {initials(contact.firstName, contact.lastName)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 style={{
                fontSize: '20px', fontWeight: 800, color: C.white, lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {contact.firstName} {contact.lastName}
              </h2>
              <div style={{ ...flexStart, gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                {contact.jobTitle && (
                  <span style={{ fontSize: '13px', color: C.muted }}>{contact.jobTitle}</span>
                )}
                {contact.company && (
                  <span style={{ fontSize: '13px', color: C.faint }}>
                    at {contact.company.name}
                  </span>
                )}
              </div>
              <div style={{ ...flexStart, gap: '8px', marginTop: '8px' }}>
                <StatusDot status={contact.status} />
                <SourceTag source={contact.source} />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SCROLLABLE CONTENT ═══ */}
        <ScrollArea style={{ flex: 1 }}>
          {/* QUICK ACTIONS */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {quickActions.map(action => (
                <motion.button
                  key={action.key}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveDialog(action.key)}
                  style={{
                    ...flexStart, gap: '6px', padding: '7px 12px', borderRadius: '8px',
                    border: `1px solid ${C.border}`, backgroundColor: 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '12px', fontWeight: 600, color: C.muted,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = `${C.yellow}40`
                    el.style.backgroundColor = `${C.yellow}08`
                    el.style.color = C.yellow
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = C.border
                    el.style.backgroundColor = 'transparent'
                    el.style.color = C.muted
                  }}
                >
                  <action.icon style={{ width: 14, height: 14 }} />
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* TABS */}
          <div style={{ padding: '0 24px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ ...flexStart, gap: 0 }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '12px 14px', border: 'none', backgroundColor: 'transparent',
                    cursor: 'pointer', position: 'relative', ...flexStart, gap: '6px',
                    transition: 'all 0.15s ease',
                    borderBottom: activeTab === tab.key ? `2px solid ${C.yellow}` : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  <span style={{
                    fontSize: '13px', fontWeight: activeTab === tab.key ? 700 : 500,
                    color: activeTab === tab.key ? C.white : C.faint,
                  }}>
                    {tab.label}
                  </span>
                  {tab.key !== 'overview' && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px',
                      backgroundColor: activeTab === tab.key ? `${C.yellow}20` : `${C.border}`,
                      color: activeTab === tab.key ? C.yellow : C.faint,
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ═══ TAB CONTENT ═══ */}
          <div style={{ padding: '20px 24px', minHeight: 200 }}>
            <AnimatePresence mode="wait">
              {/* ─── OVERVIEW ─── */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                >
                  {/* Contact Info Cards */}
                  <div style={{ ...gap3, marginBottom: '20px' }}>
                    {contact.email && (
                      <div style={{
                        ...flexBetween, padding: '10px 14px', borderRadius: '10px', backgroundColor: C.deeper,
                        border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ ...flexStart, gap: '10px' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '8px',
                            backgroundColor: '#1E3A5F', ...flexCenter,
                          }}>
                            <Mail style={{ width: 15, height: 15, color: '#60a5fa' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', color: C.white }}>{contact.email}</p>
                            <p style={{ fontSize: '11px', color: C.faint }}>Email</p>
                          </div>
                        </div>
                        <button onClick={() => setActiveDialog('email')} style={{ ...btnGhost, color: C.yellow, fontSize: '12px' }}>
                          <Mail style={{ width: 13, height: 13 }} /> Send
                        </button>
                      </div>
                    )}
                    {contact.phone && (
                      <div style={{
                        ...flexBetween, padding: '10px 14px', borderRadius: '10px',
                        backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ ...flexStart, gap: '10px' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '8px',
                            backgroundColor: '#1A3D2A', ...flexCenter,
                          }}>
                            <Phone style={{ width: 15, height: 15, color: '#4ade80' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', color: C.white }}>{contact.phone}</p>
                            <p style={{ fontSize: '11px', color: C.faint }}>Phone</p>
                          </div>
                        </div>
                        <button onClick={() => setActiveDialog('call')} style={{ ...btnGhost, color: C.yellow, fontSize: '12px' }}>
                          <Phone style={{ width: 13, height: 13 }} /> Call
                        </button>
                      </div>
                    )}
                    {contact.linkedin && (
                      <div style={{
                        ...flexBetween, padding: '10px 14px', borderRadius: '10px',
                        backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ ...flexStart, gap: '10px' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '8px',
                            backgroundColor: '#2D1B4E', ...flexCenter,
                          }}>
                            <Linkedin style={{ width: 15, height: 15, color: '#a78bfa' }} />
                          </div>
                          <div>
                            <p style={{
                              fontSize: '13px', color: C.white,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              maxWidth: 280,
                            }}>
                              {contact.linkedin}
                            </p>
                            <p style={{ fontSize: '11px', color: C.faint }}>LinkedIn</p>
                          </div>
                        </div>
                        <a
                          href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ ...btnGhost, color: C.yellow, fontSize: '12px', textDecoration: 'none' }}
                        >
                          <ExternalLink style={{ width: 13, height: 13 }} /> Open
                        </a>
                      </div>
                    )}
                    {(contact.address || contact.city) && (
                      <div style={{
                        ...flexBetween, padding: '10px 14px', borderRadius: '10px',
                        backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ ...flexStart, gap: '10px' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '8px',
                            backgroundColor: '#3D2A1A', ...flexCenter,
                          }}>
                            <MapPin style={{ width: 15, height: 15, color: '#fb923c' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', color: C.white }}>
                              {[contact.address, contact.city, contact.country].filter(Boolean).join(', ')}
                            </p>
                            <p style={{ fontSize: '11px', color: C.faint }}>Address</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {contact.description && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={sectionTitle}>About</h4>
                      <div style={{
                        padding: '12px 14px', borderRadius: '10px',
                        backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                      }}>
                        <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.6 }}>
                          {contact.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={sectionTitle}>Tags</h4>
                      <div style={{ ...flexStart, gap: '6px', flexWrap: 'wrap' }}>
                        {contact.tags.map(t => (
                          <span key={t.tag.id} style={{
                            fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
                            color: t.tag.color || C.muted, backgroundColor: `${t.tag.color || C.muted}18`,
                            border: `1px solid ${t.tag.color || C.muted}30`,
                          }}>
                            {t.tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Created date */}
                  <div style={{ marginBottom: '8px' }}>
                    <h4 style={sectionTitle}>Details</h4>
                    <div style={{
                      ...flexStart, justifyContent: 'space-between', padding: '10px 14px',
                      borderRadius: '10px', backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ ...flexStart, gap: '10px' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '8px',
                          backgroundColor: '#2A2040', ...flexCenter,
                        }}>
                          <Clock style={{ width: 15, height: 15, color: '#c084fc' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', color: C.white }}>
                            {format(new Date(contact.createdAt), 'd MMMM yyyy')}
                          </p>
                          <p style={{ fontSize: '11px', color: C.faint }}>Created</p>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: C.faint }}>
                        {timeAgo(contact.lastContactAt)} contact
                      </span>
                    </div>
                  </div>

                  {/* Recent Notes (inline) */}
                  {contact.notes.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={sectionTitle}>Recent Notes</h4>
                      <div style={{ ...gap2 }}>
                        {contact.notes.slice(0, 3).map(note => (
                          <div key={note.id} style={{
                            padding: '12px 14px', borderRadius: '10px',
                            backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                          }}>
                            <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {note.content}
                            </p>
                            <div style={{ ...flexBetween, marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                              {note.user && (
                                <span style={{ fontSize: '11px', color: C.faint }}>{note.user.name}</span>
                              )}
                              <span style={{ fontSize: '11px', color: C.faint }}>
                                {format(new Date(note.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── DEALS ─── */}
              {activeTab === 'deals' && (
                <motion.div
                  key="deals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                >
                  {contact.deals.length === 0 ? (
                    <EmptySection label="deals" icon={DollarSign} />
                  ) : (
                    <div style={gap2}>
                      {contact.deals.map((deal, i) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          style={{
                            ...flexBetween, padding: '14px 16px', borderRadius: '10px',
                            backgroundColor: C.deeper, gap: '12px', border: `1px solid ${C.border}`,
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <a href="/crm/pipeline" style={{
                              fontSize: '14px', fontWeight: 600, color: C.yellow,
                              textDecoration: 'none',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              display: 'block',
                            }} className="hover:underline">
                              {deal.title}
                            </a>
                            <div style={{ ...flexStart, gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                                border: `1px solid ${deal.stage.color}40`, color: deal.stage.color,
                                backgroundColor: `${deal.stage.color}15`,
                              }}>
                                {deal.stage.name}
                              </span>
                              <span style={{ fontSize: '11px', color: C.faint }}>{deal.probability}% probability</span>
                              {deal.assignee && (
                                <span style={{ fontSize: '11px', color: C.faint }}>→ {deal.assignee.name}</span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: C.yellow, flexShrink: 0 }}>
                            {formatCurrency(deal.value)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── ACTIVITY ─── */}
              {activeTab === 'activity' && (
                <motion.div
                  key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                >
                  {contact.activities.length === 0 ? (
                    <EmptySection label="activity" icon={MessageSquare} />
                  ) : (
                    <div style={gap3}>
                      {contact.activities.map((act, i) => (
                        <motion.div
                          key={act.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          style={{ ...flexStart, gap: '12px' }}
                        >
                          <ActivityIcon type={act.type} size="sm" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: C.white }}>{act.subject}</p>
                            {act.description && (
                              <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px', lineHeight: 1.4 }}>
                                {act.description}
                              </p>
                            )}
                            <div style={{ ...flexStart, gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', color: C.faint }}>
                                {format(new Date(act.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                              </span>
                              {act.user && (
                                <span style={{ fontSize: '11px', color: C.faint }}>by {act.user.name}</span>
                              )}
                              {act.duration && (
                                <span style={{ fontSize: '11px', color: C.faint }}>{act.duration}m</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── TASKS ─── */}
              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                >
                  {contact.tasks.length === 0 ? (
                    <EmptySection label="tasks" icon={CheckSquare} />
                  ) : (
                    <div style={gap2}>
                      {contact.tasks.map((task, i) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          style={{
                            ...flexBetween, padding: '12px 16px', borderRadius: '10px',
                            backgroundColor: C.deeper, gap: '10px', border: `1px solid ${C.border}`,
                          }}
                        >
                          <div style={{ ...flexStart, gap: '10px', minWidth: 0, flex: 1 }}>
                            <PriorityBadge priority={task.priority} />
                            <div style={{ minWidth: 0 }}>
                              <p style={{
                                fontSize: '13px', fontWeight: 600, color: C.white,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {task.title}
                              </p>
                              <div style={{ ...flexStart, gap: '8px', marginTop: '2px' }}>
                                {task.dueDate && (
                                  <p style={{ fontSize: '11px', color: C.faint }}>
                                    Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                  </p>
                                )}
                                {task.assignee && (
                                  <p style={{ fontSize: '11px', color: C.faint }}>
                                    → {task.assignee.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={task.status} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* INLINE QUICK NOTE BAR */}
          <div style={{
            padding: '16px 24px', borderTop: `1px solid ${C.border}`,
            backgroundColor: C.deeper, flexShrink: 0,
          }}>
            <div style={{ ...flexStart, gap: '8px' }}>
              <textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Add a quick note…"
                rows={2}
                style={{
                  ...inputDark, flex: 1, minHeight: 40, resize: 'none', fontSize: '13px',
                  padding: '8px 12px',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!noteContent.trim()) { toast.error('Note content is required'); return }
                  noteMutation.mutate({ content: noteContent, contactId })
                }}
                disabled={noteMutation.isPending}
                style={{
                  ...btnPrimary, padding: '8px 14px', fontSize: '13px', flexShrink: 0,
                  alignSelf: 'flex-end', opacity: noteMutation.isPending ? 0.6 : 1,
                }}
              >
                {noteMutation.isPending ? '…' : <StickyNote style={{ width: 16, height: 16 }} />}
              </motion.button>
            </div>
          </div>
        </ScrollArea>

        {/* DIALOGS */}
        <AddNoteDialog contactId={contactId} open={activeDialog === 'note'} onOpenChange={v => setActiveDialog(v ? 'note' : null)} />
        <LogCallDialog contact={contact} open={activeDialog === 'call'} onOpenChange={v => setActiveDialog(v ? 'call' : null)} />
        <SendEmailDialog contact={contact} open={activeDialog === 'email'} onOpenChange={v => setActiveDialog(v ? 'email' : null)} />
        <CreateTaskDialog contact={contact} dealOptions={dealOptions} open={activeDialog === 'task'} onOpenChange={v => setActiveDialog(v ? 'task' : null)} />

        {/* EDIT DIALOG */}
        <ContactFormDialog
          key={`edit-${contact.id}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          editContactId={contact.id}
          initialForm={{
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            email: contact.email || '',
            phone: contact.phone || '',
            jobTitle: contact.jobTitle || '',
            source: contact.source || 'website',
            status: contact.status || 'lead',
            address: contact.address || '',
            city: contact.city || '',
            country: contact.country || 'Ireland',
            description: (contact as ContactDetail).description || '',
            companyId: contact.company?.id || '',
          }}
          companies={companies}
        />
      </motion.div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN CONTACTS PAGE
// ══════════════════════════════════════════════════════════════
export default function ContactsPageContent() {
  const qc = useQueryClient()

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [sortField, setSortField] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [actionDialog, setActionDialog] = useState<{ action: string; contact: ContactRow | null }>({ action: '', contact: null })
  const limit = 48

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Wrap filter setters to also reset page
  const handleStatusChange = useCallback((v: string) => {
    setStatusFilter(v === '__all__' ? '' : v); setCurrentPage(1)
  }, [])
  const handleSourceChange = useCallback((v: string) => {
    setSourceFilter(v === '__all__' ? '' : v); setCurrentPage(1)
  }, [])

  // Fetch contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', debouncedSearch, statusFilter, sourceFilter, currentPage],
    queryFn: () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)
      if (sourceFilter) params.set('source', sourceFilter)
      params.set('limit', String(limit))
      params.set('page', String(currentPage))
      return fetch(`/api/crm/contacts?${params}`).then(r => r.json())
    },
  })

  const contacts: ContactRow[] = contactsData?.contacts || []
  const total = contactsData?.pagination?.total || 0
  const totalPages = contactsData?.pagination?.totalPages || 1

  // Fetch companies (for form select)
  const { data: companiesData } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => fetch('/api/crm/companies?limit=200').then(r => r.json()),
  })
  const companies: CompanyRow[] = companiesData?.companies || []

  // Stats contacts (for KPIs)
  const { data: statsData } = useQuery({
    queryKey: ['contacts-stats', statusFilter, sourceFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (sourceFilter) params.set('source', sourceFilter)
      params.set('limit', '500')
      params.set('page', '1')
      return fetch(`/api/crm/contacts?${params}`).then(r => r.json())
    },
  })
  const statsContacts: ContactRow[] = statsData?.contacts || []

  // Sorted contacts
  const sorted = useMemo(() => {
    const arr = [...contacts]
    switch (sortField) {
      case 'name_asc': arr.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)); break
      case 'name_desc': arr.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)); break
      case 'oldest': arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case 'recent_contact': arr.sort((a, b) => {
        const da = a.lastContactAt ? new Date(a.lastContactAt).getTime() : 0
        const db = b.lastContactAt ? new Date(b.lastContactAt).getTime() : 0
        return db - da
      }); break
      default: arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return arr
  }, [contacts, sortField])

  // Quick action handler (from card hover)
  const handleAction = useCallback((action: string, contact: ContactRow) => {
    setActionDialog({ action, contact })
    if (action === 'detail') setSelectedId(contact.id)
  }, [])

  // Loading skeleton
  if (isLoading && contacts.length === 0) {
    return (
      <div style={{ backgroundColor: C.dark, minHeight: '100vh', ...flexCol }}>
        <main style={{ ...flexCol, padding: '28px 32px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          <div style={{ ...flexBetween, marginBottom: '24px' }}>
            <div style={{ ...flexCol, gap: '4px' }}>
              <div style={{ width: 160, height: 32, borderRadius: 8, backgroundColor: C.surface }} />
              <div style={{ width: 280, height: 16, borderRadius: 4, backgroundColor: C.surface }} />
            </div>
            <div style={{ width: 140, height: 38, borderRadius: 8, backgroundColor: C.surface }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 100, borderRadius: 12, backgroundColor: C.surface }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ height: 220, borderRadius: 12, backgroundColor: C.surface }} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: C.dark, minHeight: '100vh', ...flexCol }}>
      <main style={{ ...flexCol, padding: '28px 32px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {/* ═══ PAGE HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ ...flexBetween, marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}
        >
          <div style={{ ...flexCol, gap: '4px' }}>
            <div style={{ ...flexStart, gap: '10px', alignItems: 'baseline' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: C.white, letterSpacing: '-0.02em' }}>
                People
              </h1>
              <span style={{
                fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                backgroundColor: `${C.yellow}18`, color: C.yellow,
              }}>
                {total} contact{total !== 1 ? 's' : ''}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: C.faint }}>
              Manage your contacts, leads, and customer relationships.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCreateOpen(true)}
            style={btnPrimary}
          >
            <Plus style={{ width: 18, height: 18 }} />
            Add Contact
          </motion.button>
        </motion.div>

        {/* ═══ STATS DASHBOARD ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ marginBottom: '24px' }}
        >
          <StatsDashboard contacts={statsContacts} />
        </motion.div>

        {/* ═══ SEARCH & FILTER BAR ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{ marginBottom: '20px' }}
        >
          <div style={{
            ...flexBetween, flexWrap: 'wrap', gap: '10px',
            padding: '14px 18px', borderRadius: '12px',
            backgroundColor: C.surface, border: `1px solid ${C.border}`,
          }}>
            {/* Search */}
            <div style={{ ...flexStart, gap: '8px', flex: '1 1 240px', minWidth: 200 }}>
              <Search style={{ width: 16, height: 16, color: C.faint, flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or job title…"
                style={{
                  border: 'none', backgroundColor: 'transparent', color: C.white,
                  fontSize: '14px', outline: 'none', width: '100%',
                  padding: 0,
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ ...flexStart, gap: '8px', flexWrap: 'wrap' }}>
              <Select value={statusFilter || '__all__'} onValueChange={handleStatusChange}>
                <SelectTrigger style={{
                  backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                  borderRadius: '8px', color: C.muted, fontSize: '13px',
                  height: 34, minWidth: 130,
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s.value || '__all__'} value={s.value || '__all__'}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sourceFilter || '__all__'} onValueChange={handleSourceChange}>
                <SelectTrigger style={{
                  backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                  borderRadius: '8px', color: C.muted, fontSize: '13px',
                  height: 34, minWidth: 140,
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map(s => (
                    <SelectItem key={s.value || '__all__'} value={s.value || '__all__'}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger style={{
                  backgroundColor: C.deeper, border: `1px solid ${C.border}`,
                  borderRadius: '8px', color: C.muted, fontSize: '13px',
                  height: 34, minWidth: 160,
                }}>
                  <ArrowUpDown style={{ width: 14, height: 14, marginRight: 4 }} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div style={{
                ...flexStart, borderRadius: '8px', overflow: 'hidden',
                border: `1px solid ${C.border}`,
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '6px 10px', border: 'none', cursor: 'pointer',
                    backgroundColor: viewMode === 'grid' ? `${C.yellow}18` : 'transparent',
                    color: viewMode === 'grid' ? C.yellow : C.faint,
                    display: 'flex', alignItems: 'center', transition: 'all 0.15s ease',
                  }}
                >
                  <LayoutGrid style={{ width: 16, height: 16 }} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '6px 10px', border: 'none', cursor: 'pointer',
                    backgroundColor: viewMode === 'table' ? `${C.yellow}18` : 'transparent',
                    color: viewMode === 'table' ? C.yellow : C.faint,
                    display: 'flex', alignItems: 'center', transition: 'all 0.15s ease',
                  }}
                >
                  <List style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ CONTACT LIST ═══ */}
        {contacts.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '14px',
          }}>
            {sorted.map((contact, i) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                index={i}
                onSelect={() => setSelectedId(contact.id)}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div style={{
            ...cardBase, overflow: 'hidden',
          }}>
            <TableHeader sort={sortField} onSort={setSortField} />
            <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
              {sorted.map(contact => (
                <ContactTableRow
                  key={contact.id}
                  contact={contact}
                  onSelect={() => setSelectedId(contact.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ═══ PAGINATION ═══ */}
        {totalPages > 1 && (
          <div style={{ ...flexBetween, marginTop: '20px', padding: '0 4px' }}>
            <span style={{ fontSize: '13px', color: C.faint }}>
              Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, total)} of {total}
            </span>
            <div style={{ ...flexStart, gap: '6px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  ...btnGhost, border: `1px solid ${C.border}`, borderRadius: '8px',
                  opacity: currentPage === 1 ? 0.3 : 1,
                }}
              >
                <ChevronLeft style={{ width: 16, height: 16 }} />
                Previous
              </button>
              <div style={{ ...flexStart, gap: '4px' }}>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = currentPage - 3 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: 32, height: 32, borderRadius: '6px', border: 'none',
                        cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                        backgroundColor: currentPage === pageNum ? C.yellow : C.deeper,
                        color: currentPage === pageNum ? C.dark : C.muted,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  ...btnGhost, border: `1px solid ${C.border}`, borderRadius: '8px',
                  opacity: currentPage === totalPages ? 0.3 : 1,
                }}
              >
                Next
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ═══ DETAIL PANEL ═══ */}
      <AnimatePresence>
        {selectedId && (
          <ContactDetailPanel
            key={selectedId}
            contactId={selectedId}
            onClose={() => setSelectedId(null)}
            companies={companies}
          />
        )}
      </AnimatePresence>

      {/* ═══ CREATE CONTACT DIALOG ═══ */}
      <ContactFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialForm={emptyForm()}
        editContactId={null}
        companies={companies}
      />

      {/* ═══ QUICK ACTION DIALOGS (from card hover) ═══ */}
      {actionDialog.contact && (
        <>
          <AddNoteDialog
            contactId={actionDialog.contact.id}
            open={actionDialog.action === 'note'}
            onOpenChange={v => setActionDialog(prev => ({ ...prev, action: v ? 'note' : '' }))}
          />
          <LogCallDialog
            contact={actionDialog.contact}
            open={actionDialog.action === 'call'}
            onOpenChange={v => setActionDialog(prev => ({ ...prev, action: v ? 'call' : '' }))}
          />
          <SendEmailDialog
            contact={actionDialog.contact}
            open={actionDialog.action === 'email'}
            onOpenChange={v => setActionDialog(prev => ({ ...prev, action: v ? 'email' : '' }))}
          />
        </>
      )}
    </div>
  )
}
