'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { ClientOnly } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent,
  DragOverlay, useDroppable,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, GripVertical, X, Building2, TrendingUp,
  ChevronDown, ChevronRight, Phone, Mail, CalendarDays, FileText,
  DollarSign, CheckCircle2, XCircle, Euro, Briefcase, Sparkles,
  SunMedium, Bot, Search, ArrowRight, Clock, Users,
  BarChart3, Inbox, MessageSquare, Presentation,
  Handshake, FileSpreadsheet, Trophy, CircleOff, CircleDot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { InlineEdit, CardInlineNumber, ProductCycler } from './InlineEdit'

function safeTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

const DS = {
  BG_PAGE: '#080808',
  BG_CENTER: '#0C0C0C',
  BG_COLUMN: '#111111',
  BG_CARD: '#141414',
  BG_ELEVATED: '#1A1A1A',
  BG_INPUT: '#0E0E0E',
  BORDER: 'rgba(255,255,255,0.05)',
  BORDER_HOVER: 'rgba(255,255,255,0.09)',
  BORDER_FOCUS: 'rgba(243,216,64,0.35)',
  YELLOW: '#F3D840',
  GREEN: '#10B981',
  RED: '#F87171',
  BLUE: '#60A5FA',
  PURPLE: '#A78BFA',
  PINK: '#F472B6',
  ORANGE: '#FB923C',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: 'rgba(255,255,255,0.50)',
  TEXT_TERTIARY: 'rgba(255,255,255,0.30)',
  TEXT_MUTED: 'rgba(255,255,255,0.30)',
  CARD_RADIUS: 20,
} as const

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

// ═══════════════════════════════════════════════════════════════════
// STAGE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const STAGES = [
  { key: 'new_lead', name: 'New Lead', color: '#60A5FA', icon: CircleDot },
  { key: 'contacted', name: 'Contacted', color: '#818CF8', icon: MessageSquare },
  { key: 'discovery_call', name: 'Discovery', color: '#A78BFA', icon: Phone },
  { key: 'demo_booked', name: 'Demo Booked', color: '#F472B6', icon: CalendarDays },
  { key: 'demo_done', name: 'Demo Done', color: '#FB923C', icon: Presentation },
  { key: 'proposal_sent', name: 'Proposal Sent', color: '#FBBF24', icon: FileSpreadsheet },
  { key: 'negotiation', name: 'Negotiation', color: '#34D399', icon: Handshake },
  { key: 'closed_won', name: 'Closed Won', color: '#22C55E', icon: Trophy },
  { key: 'closed_lost', name: 'Closed Lost', color: '#F87171', icon: CircleOff },
] as const

const STAGE_ICON_MAP: Record<string, React.ElementType> = Object.fromEntries(
  STAGES.map(s => [s.key, s.icon])
)

const STAGE_KEYS = STAGES.map(s => s.key)
const ACTIVE_STAGE_KEYS = STAGES.filter(s => s.key !== 'closed_won').map(s => s.key)
const ALL_STAGE_KEYS = STAGE_KEYS

const STAGE_COLOR_MAP: Record<string, string> = Object.fromEntries(STAGES.map(s => [s.key, s.color]))
const STAGE_NAME_MAP: Record<string, string> = Object.fromEntries(STAGES.map(s => [s.key, s.name]))

const STAGE_PROBABILITIES: Record<string, number> = {
  new_lead: 0.10, contacted: 0.20, discovery_call: 0.35,
  demo_booked: 0.50, demo_done: 0.65, proposal_sent: 0.75,
  negotiation: 0.85, closed_won: 1.0,
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const PRODUCTS: Record<string, { label: string; color: string; icon: typeof SunMedium }> = {
  solarpilot: { label: 'SolarPilot', color: '#F3D840', icon: SunMedium },
  ai_workforce: { label: 'AI Workforce', color: '#A78BFA', icon: Bot },
  both: { label: 'Both', color: '#22C55E', icon: Sparkles },
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
interface Deal {
  id: string; companyId: string; product: string; mrr: number | null;
  setupFee: number | null; stage: string; value: number | null; notes: string | null;
  company: { id: string; name: string; counties: string; status?: string; website?: string | null };
  assignedTo: { id: string; name: string; avatar: string | null } | null;
  _count: { activities: number };
  daysInStage?: number; dealScore?: 'hot' | 'warm' | 'cold';
  lastActivity?: { id: string; type: string; title: string; createdAt: string } | null;
  decisionMaker?: { id: string; name: string; email?: string | null; phone?: string | null; role?: string | null } | null;
  createdAt?: string; updatedAt?: string;
}

interface PipelineStage { stageKey: string; stageName: string; deals: Deal[] }

interface DealDetail extends Deal {
  company: Deal['company'] & { contacts?: { id: string; name: string; email?: string | null; phone?: string | null; role?: string | null; isDecisionMaker: boolean }[] };
  activities: { id: string; type: string; title: string; content: string | null; createdAt: string; user: { id: string; name: string; avatar: string | null } }[];
}

interface PipelineSummary {
  totalDeals: number; totalValue: number; totalMRR: number;
  wonCount: number; lostCount: number; winRate: number;
  avgDealSize: number; avgDaysInPipeline: number;
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const fmt = (v: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

const fmtCompact = (v: number) => (v >= 1000 ? `€${(v / 1000).toFixed(1)}k` : fmt(v))

const inputStyle: React.CSSProperties = {
  backgroundColor: DS.BG_CARD, border: `1px solid ${DS.BORDER}`, color: DS.TEXT_PRIMARY,
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: DS.BG_CARD, border: `1px solid ${DS.BORDER}`,
}

const sectionTitleStyle: React.CSSProperties = {
  color: DS.TEXT_TERTIARY, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.05,
}

// ═══════════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════
function ScoreDot({ score }: { score?: 'hot' | 'warm' | 'cold' | null }) {
  const colors = { hot: DS.GREEN, warm: '#FBBF24', cold: '#6B7280' }
  const c = score ? colors[score] : colors.cold
  return (
    <div
      className="h-2.5 w-2.5 rounded-full shrink-0"
      style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}40` }}
    />
  )
}

function ProductBadge({ product }: { product: string }) {
  const c = PRODUCTS[product] || PRODUCTS.solarpilot
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
      style={{ color: c.color, backgroundColor: `${c.color}14` }}
    >
      <c.icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  )
}

function ActivityIcon({ type }: { type: string }) {
  const m: Record<string, { icon: typeof Phone; color: string; bg: string }> = {
    call: { icon: Phone, color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
    email: { icon: Mail, color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
    meeting: { icon: CalendarDays, color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
    demo: { icon: Briefcase, color: '#F472B6', bg: 'rgba(244,114,182,0.15)' },
    note: { icon: FileText, color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
    proposal: { icon: DollarSign, color: '#FB923C', bg: 'rgba(251,146,60,0.15)' },
  }
  const c = m[type.toLowerCase()] || m.note
  return (
    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg }}>
      <c.icon className="h-4 w-4" style={{ color: c.color }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SKELETON LOADING
// ═══════════════════════════════════════════════════════════════════
function ShimmerBlock({ w, h, r }: { w: string | number; h: string | number; r?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r || 14,
        background: `linear-gradient(90deg, ${DS.BG_COLUMN} 25%, rgba(255,255,255,0.03) 50%, ${DS.BG_COLUMN} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

function PipelineSkeleton() {
  return (
    <div className="pipe-page-wrap" style={{ padding: '32px 48px', background: `radial-gradient(ellipse at 50% 0%, ${DS.BG_CENTER} 0%, ${DS.BG_PAGE} 70%)`, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {/* Gradient accent bar */}
      <div style={{
        height: 3, borderRadius: 2,
        background: `linear-gradient(90deg, transparent, ${DS.YELLOW} 20%, ${DS.YELLOW}80 50%, ${DS.YELLOW}80%, transparent)`,
      }} />
      {/* Header skeleton */}
      <div className="shrink-0 pb-4 flex items-center justify-between gap-4" style={{ borderBottom: `1px solid ${DS.BORDER}` }}>
        <div className="flex flex-col gap-2">
          <ShimmerBlock w={140} h={30} r={8} />
          <ShimmerBlock w={280} h={16} r={6} />
        </div>
        <ShimmerBlock w={130} h={44} r={12} />
      </div>
      {/* Toolbar skeleton */}
      <div className="shrink-0 py-3 flex items-center gap-4">
        <ShimmerBlock w={380} h={42} r={12} />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <ShimmerBlock key={i} w={80} h={34} r={8} />
          ))}
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="shrink-0 py-4 flex gap-4">
        {[1, 2, 3, 4].map(i => (
          <ShimmerBlock key={i} w="100%" h={76} r={16} />
        ))}
      </div>
      {/* Board skeleton */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 16, overflow: 'hidden', paddingTop: 16 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="shrink-0 flex flex-col gap-3" style={{ width: 280 }}>
            <ShimmerBlock w="100%" h={88} r={20} />
            <ShimmerBlock w="100%" h={168} r={14} />
            <ShimmerBlock w="100%" h={168} r={14} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STATS BAR — 4 KPI cards
// ═══════════════════════════════════════════════════════════════════
function StatsBar({ summary }: { summary: PipelineSummary | undefined }) {
  if (!summary) return null

  const stats = [
    { label: 'Pipeline Value', value: fmt(summary.totalValue), icon: TrendingUp, color: DS.YELLOW, pct: 72 },
    { label: 'Total MRR', value: `${fmt(summary.totalMRR)}/mo`, icon: BarChart3, color: DS.GREEN, pct: 58 },
    { label: 'Avg Deal Size', value: fmt(summary.avgDealSize), icon: DollarSign, color: DS.PURPLE, pct: 45 },
    { label: 'Win Rate', value: `${summary.winRate}%`, icon: CheckCircle2, color: DS.BLUE, pct: summary.winRate },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="shrink-0 py-6 flex gap-5"
      style={{ borderBottom: `1px solid ${DS.BORDER}` }}
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={scaleIn}
          className="flex items-center gap-4 flex-1"
          style={{
            padding: '16px 18px',
            borderRadius: 16,
            background: `linear-gradient(135deg, ${s.color}0A, ${s.color}04)`,
            border: `1px solid ${s.color}15`,
            position: 'relative',
            overflow: 'hidden',
          }}
          whileHover={{ borderColor: `${s.color}30`, y: -2 }}
        >
          {/* Top glow accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${s.color}30, transparent)`,
          }} />
          <div
            style={{
              width: 38, height: 38, borderRadius: 11,
              background: `${s.color}14`,
              border: `1px solid ${s.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 12px ${s.color}08`,
            }}
          >
            <s.icon size={16} style={{ color: s.color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: DS.TEXT_TERTIARY, fontSize: 10, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
            }}>
              {s.label}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: s.color, letterSpacing: '-0.01em', lineHeight: 1 }}>
              {s.value}
            </div>
            {/* Mini progress bar */}
            <div style={{
              marginTop: 8, height: 3, borderRadius: 2,
              background: 'rgba(255,255,255,0.04)', overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                style={{
                  height: '100%', borderRadius: 2,
                  background: `linear-gradient(90deg, ${s.color}, ${s.color}80)`,
                  boxShadow: `0 0 6px ${s.color}30`,
                }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DEAL CARD — Premium, spacious Pipedrive-style
// ═══════════════════════════════════════════════════════════════════
function DealCard({ deal, isDragging = false, onClick, onAdvance, onUpdateMRR, onUpdateProduct }: {
  deal: Deal; isDragging?: boolean; onClick?: () => void; onAdvance?: () => void
  onUpdateMRR?: (dealId: string, mrr: number) => void
  onUpdateProduct?: (dealId: string, product: string) => void
}) {
  const color = STAGE_COLOR_MAP[deal.stage] || '#666'
  const idx = ACTIVE_STAGE_KEYS.indexOf(deal.stage as typeof ACTIVE_STAGE_KEYS[number])
  const canAdvance = idx >= 0 && idx < ACTIVE_STAGE_KEYS.length
  const lastText = deal.lastActivity?.createdAt
    ? <ClientOnly fallback={null}>{safeTimeAgo(new Date(deal.lastActivity.createdAt))}</ClientOnly>
    : null

  const initials = (deal.company?.name || '??').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.85 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="group relative cursor-pointer"
      style={{
        padding: 16,
        borderRadius: DS.CARD_RADIUS,
        backgroundColor: DS.BG_CARD,
        border: isDragging
          ? `1px solid ${color}`
          : `1px solid ${DS.BORDER}`,
        borderLeft: `3px solid ${color}`,
        boxShadow: isDragging
          ? `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${color}`
          : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onClick}
      whileHover={{
        y: -3,
        borderColor: `${color}30`,
        boxShadow: `0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px ${color}15`,
        transition: { duration: 0.25 },
      }}
    >
      {/* Subtle top glow on hover */}
      <div
        className="absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
        }}
      />

      {/* Radial gradient glow from top-left on hover */}
      <div
        className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${color}08 0%, transparent 60%)`,
        }}
      />

      {/* Row 1: Avatar + Company name + hover actions */}
      <div className="flex items-center gap-3">
        {/* Company avatar initial with stage color */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 30, height: 30, borderRadius: 9,
            background: `linear-gradient(145deg, ${color}22, ${color}0C)`,
            border: `1px solid ${color}25`,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '-0.02em', fontFamily: 'system-ui, sans-serif' }}>
            {initials}
          </span>
        </div>
        <h4
          className="leading-snug truncate flex-1"
          style={{ color: DS.TEXT_PRIMARY, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          {deal.company?.name || 'Unknown'}
        </h4>
        {/* Days-in-stage indicator */}
        {deal.daysInStage != null && (
          <span
            className="shrink-0 font-mono"
            style={{
              fontSize: 10, fontWeight: 600,
              color: deal.daysInStage <= 3 ? DS.GREEN : deal.daysInStage <= 7 ? '#FBBF24' : DS.RED,
              padding: '2px 6px', borderRadius: 5,
              background: `${deal.daysInStage <= 3 ? DS.GREEN : deal.daysInStage <= 7 ? '#FBBF24' : DS.RED}12`,
            }}
          >
            {deal.daysInStage}d
          </span>
        )}
        <div
          className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {canAdvance && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAdvance}
              style={{
                width: 34, height: 34, borderRadius: 9,
                background: `${color}15`, border: `1px solid ${color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: color, padding: 0,
              }}
              title="Advance to next stage"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
          )}
          <GripVertical className="h-4 w-4" style={{ color: DS.TEXT_MUTED }} />
        </div>
      </div>

      {/* Row 2: Product badge */}
      <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
        {onUpdateProduct ? (
          <ProductCycler product={deal.product} onSave={(v) => onUpdateProduct(deal.id, v)} />
        ) : (
          <ProductBadge product={deal.product} />
        )}
      </div>

      {/* Row 3: MRR (hero number) */}
      {deal.mrr != null && deal.mrr > 0 && (
        <div className="mt-2.5 flex items-baseline gap-1" onClick={(e) => e.stopPropagation()}>
          {onUpdateMRR ? (
            <>
              <CardInlineNumber
                value={deal.mrr}
                onSave={(v) => onUpdateMRR(deal.id, v)}
                format={(v) => `€${v.toLocaleString('en-IE')}`}
                accentColor={DS.GREEN}
              />
              <span style={{ fontSize: 10, color: DS.TEXT_TERTIARY, fontWeight: 500 }}>/mo</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: DS.GREEN, letterSpacing: '0.01em' }}>
                €{deal.mrr.toLocaleString('en-IE')}
              </span>
              <span style={{ fontSize: 10, color: DS.TEXT_TERTIARY, fontWeight: 500 }}>/mo</span>
            </>
          )}
        </div>
      )}

      {/* Row 3b: Setup fee */}
      {deal.setupFee != null && deal.setupFee > 0 && (
        <div className="mt-1">
          <span style={{ fontSize: 10, color: DS.TEXT_TERTIARY, fontWeight: 500 }}>
            +{fmt(deal.setupFee)} setup
          </span>
        </div>
      )}

      {/* Row 4: Last activity */}
      {lastText && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0" style={{ color: DS.TEXT_TERTIARY }} />
          <span style={{ fontSize: 10, color: DS.TEXT_TERTIARY, fontWeight: 500 }}>
            {lastText}
          </span>
        </div>
      )}
    </motion.div>
  )
}

function SortableDealCard({ deal, onClick, onAdvance, onUpdateMRR, onUpdateProduct }: { deal: Deal; onClick?: () => void; onAdvance?: () => void; onUpdateMRR?: (dealId: string, mrr: number) => void; onUpdateProduct?: (dealId: string, product: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : undefined,
        position: 'relative' as const,
      }}
      {...attributes}
      {...listeners}
    >
      <DealCard deal={deal} isDragging={isDragging} onClick={onClick} onAdvance={onAdvance} onUpdateMRR={onUpdateMRR} onUpdateProduct={onUpdateProduct} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DROPPABLE COLUMN ZONE
// ═══════════════════════════════════════════════════════════════════
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-h-[80px] rounded-xl transition-all"
      style={{
        backgroundColor: isOver ? 'rgba(250,204,21,0.04)' : 'transparent',
        border: isOver ? `2px dashed ${DS.YELLOW}50` : '2px dashed transparent',
      }}
    >
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PIPELINE COLUMN
// ═══════════════════════════════════════════════════════════════════
function PipelineColumn({
  stage, onDealClick, onAdvanceDeal, collapsed, onToggleCollapse, index = 0,
  onUpdateMRR, onUpdateProduct,
}: {
  stage: PipelineStage
  onDealClick: (d: Deal) => void
  onAdvanceDeal: (d: Deal) => void
  collapsed: boolean
  onToggleCollapse: () => void
  index?: number
  onUpdateMRR?: (dealId: string, mrr: number) => void
  onUpdateProduct?: (dealId: string, product: string) => void
}) {
  const color = STAGE_COLOR_MAP[stage.stageKey] || '#666'
  const totalMRR = stage.deals.reduce((s, d) => s + (d.mrr || 0), 0)
  const prob = STAGE_PROBABILITIES[stage.stageKey]
  const StageIcon = STAGE_ICON_MAP[stage.stageKey] || CircleDot

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col shrink-0 rounded-2xl overflow-hidden transition-shadow duration-300"
      style={{
        minWidth: 280,
        width: 280,
        backgroundColor: DS.BG_COLUMN,
        border: `1px solid ${DS.BORDER}`,
        position: 'relative',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 20px ${color}08`; e.currentTarget.style.borderColor = DS.BORDER_HOVER }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = DS.BORDER }}
    >
      {/* Top glow bar — like settings SectionCard */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          zIndex: 1,
        }}
      />
      {/* Column header — matches dashboard card section style */}
      <div
        className="shrink-0 cursor-pointer select-none"
        style={{
          padding: '18px 18px 14px',
          borderBottom: collapsed ? 'none' : `1px solid ${DS.BORDER}`,
          background: collapsed
            ? 'transparent'
            : `linear-gradient(180deg, ${color}06 0%, transparent 100%)`,
        }}
        onClick={onToggleCollapse}
      >
        {/* Top row: icon + stage name + count + collapse chevron */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Stage icon — premium icon-in-box pattern from settings */}
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: `${color}15`,
                border: `1px solid ${color}20`,
                boxShadow: `0 0 12px ${color}08`,
              }}
            >
              <StageIcon size={15} style={{ color }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: DS.TEXT_PRIMARY, lineHeight: 1.2 }}>
                  {stage.stageName}
                </h3>
                {/* Count pill */}
                <span
                  className="shrink-0 flex items-center justify-center font-bold"
                  style={{
                    height: 20,
                    minWidth: 22,
                    padding: '0 7px',
                    borderRadius: 6,
                    backgroundColor: `${color}15`,
                    color,
                    fontSize: 10,
                    lineHeight: 1,
                  }}
                >
                  {stage.deals.length}
                </span>
              </div>
            </div>
          </div>
          {/* Collapse toggle */}
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" style={{ color: DS.TEXT_MUTED }} />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" style={{ color: DS.TEXT_MUTED }} />
          )}
        </div>

        {/* Bottom row: MRR + probability (only when expanded) */}
        {!collapsed && (
          <div className="flex items-center justify-between mt-3 pl-[44px]">
            {totalMRR > 0 ? (
              <span style={{ fontSize: 12, fontWeight: 600, color: DS.GREEN, fontFamily: 'monospace' }}>
                {fmtCompact(totalMRR)}/mo
              </span>
            ) : (
              <span />
            )}
            {prob != null && (
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 10, color: DS.TEXT_MUTED, fontWeight: 500 }}>
                  {Math.round(prob * 100)}%
              </span>
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${prob * 100}%`,
                      height: '100%',
                      borderRadius: 2,
                      background: color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable deal area */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-3 pb-3 flex flex-col gap-3">
            <DroppableColumn id={stage.stageKey}>
              {stage.deals.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-14 px-4 text-center w-full"
                  style={{ border: `2px dashed ${color}20`, borderRadius: 12 }}
                >
                  <motion.div
                    animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Inbox className="h-8 w-8" style={{ color: `${color}40` }} />
                  </motion.div>
                  <p className="text-sm font-medium mt-3" style={{ color: DS.TEXT_SECONDARY }}>
                    No deals yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: DS.TEXT_TERTIARY }}>
                    Drag deals here or create new
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-3 flex items-center justify-center"
                    style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: `${color}12`, border: `1px solid ${color}20`,
                      color: color, cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} />
                  </motion.button>
                </div>
              ) : (
                <SortableContext
                  items={stage.deals.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence mode="popLayout">
                    {stage.deals.map((deal) => (
                      <SortableDealCard
                        key={deal.id}
                        deal={deal}
                        onClick={() => onDealClick(deal)}
                        onAdvance={() => onAdvanceDeal(deal)}
                        onUpdateMRR={onUpdateMRR}
                        onUpdateProduct={onUpdateProduct}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              )}
            </DroppableColumn>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DEAL DETAIL PANEL — World-class 720px slide-in
// ═══════════════════════════════════════════════════════════════════
function DealDetailPanel({ dealId, onClose }: { dealId: string | null; onClose: () => void }) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['deal-detail', dealId],
    queryFn: () => fetch(`/api/crm/deals/${dealId}`).then((r) => r.json()),
    enabled: !!dealId,
  })
  const deal: DealDetail | null = data?.deal || null

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['deal-detail', dealId] })
      toast.success('Updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/crm/deals/${dealId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      onClose()
      toast.success('Deal deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const advanceMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return
      const idx = ALL_STAGE_KEYS.indexOf(deal.stage)
      if (idx < 0 || idx >= ALL_STAGE_KEYS.length - 1) return
      const r = await fetch('/api/crm/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, stage: ALL_STAGE_KEYS[idx + 1] }),
      })
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['deal-detail', dealId] })
      toast.success('Deal advanced')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const [logForm, setLogForm] = useState({ type: 'note', title: '', content: '' })
  const [showLogForm, setShowLogForm] = useState(false)
  const logMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/crm/deals/${dealId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logForm),
      })
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['deal-detail', dealId] })
      setLogForm({ type: 'note', title: '', content: '' })
      setShowLogForm(false)
      toast.success('Activity logged')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const [noteText, setNoteText] = useState('')
  const [editingNote, setEditingNote] = useState(false)

  useEffect(() => {
    if (deal) setNoteText(deal.notes || '')
  }, [deal])

  // Close on Escape
  useEffect(() => {
    if (!dealId) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dealId, onClose])

  if (!dealId) return null
  if (isLoading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-y-0 right-0 w-full md:w-[720px] z-50"
      style={{
        backgroundColor: DS.BG_CARD,
        borderLeft: `1px solid ${DS.BORDER}`,
      }}
    >
      <div className="p-8 space-y-6">
        {/* Animated shimmer skeleton */}
        {[0.3, 0.5, 0.7, 0.4, 0.6].map((delay, i) => (
          <div
            key={i}
            className="rounded-xl"
            style={{
              height: i === 0 ? 120 : i === 1 ? 80 : i === 2 ? 48 : i === 3 ? 160 : 200,
              background: `linear-gradient(90deg, ${DS.BG_COLUMN} 25%, rgba(255,255,255,0.03) 50%, ${DS.BG_COLUMN} 75%)`,
              backgroundSize: '200% 100%',
              animation: `shimmer 1.5s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </motion.div>
  )
  if (!deal) return null

  const color = STAGE_COLOR_MAP[deal.stage] || '#666'
  const stageIdx = ALL_STAGE_KEYS.indexOf(deal.stage)
  const canAdvance = stageIdx >= 0 && stageIdx < ALL_STAGE_KEYS.length - 1
  const nextName = canAdvance ? STAGE_NAME_MAP[ALL_STAGE_KEYS[stageIdx + 1]] : null
  const dm = deal.company?.contacts?.find((c) => c.isDecisionMaker) || deal.company?.contacts?.[0]

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const prob = STAGE_PROBABILITIES[deal.stage]
  const StageIcon = STAGE_ICON_MAP[deal.stage] || CircleDot

  const weightedValue = deal.value && prob ? Math.round(deal.value * prob) : null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.70)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-full md:w-[720px] z-50 flex flex-col"
        style={{
          background: DS.BG_CARD,
          borderLeft: `1px solid ${DS.BORDER}`,
          boxShadow: '-40px 0 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* ═══ CINEMATIC HERO HEADER ═══ */}
        <div
          className="shrink-0 relative overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${color}10 0%, transparent 40%), linear-gradient(200deg, ${color}06 60%, transparent 80%)`,
            borderBottom: `1px solid ${DS.BORDER}`,
            padding: '24px 28px 20px',
          }}
        >
          {/* Animated top glow bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color}80 50%, ${color} 80%, transparent 100%)`,
              boxShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
            }}
          />

          {/* Subtle radial glow in top-right */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Close + Advance + Delete row */}
          <div className="flex items-center justify-between mb-5 relative">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
              style={{ color: DS.TEXT_SECONDARY, background: 'rgba(255,255,255,0.03)', border: `1px solid ${DS.BORDER}` }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = DS.BORDER_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = DS.BORDER }}
            >
              <X className="h-4 w-4" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Close</span>
              <kbd
                className="ml-1"
                style={{
                  fontSize: 9, padding: '1px 5px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)', color: DS.TEXT_MUTED,
                  fontFamily: 'monospace', fontWeight: 500,
                }}
              >
                Esc
              </kbd>
            </button>
            <div className="flex items-center gap-2">
              {canAdvance && (
                <motion.button
                  onClick={() => advanceMutation.mutate()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                    color: '#000',
                    fontSize: 12,
                    boxShadow: `0 4px 20px ${color}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    border: `1px solid ${color}40`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 32px ${color}50, inset 0 1px 0 rgba(255,255,255,0.15)` }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 20px ${color}30, inset 0 1px 0 rgba(255,255,255,0.15)` }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Advance to {nextName}
                </motion.button>
              )}
              <button
                onClick={() => { if (confirm('Delete this deal?')) deleteMutation.mutate() }}
                aria-label="Delete deal"
                className="p-2.5 rounded-xl transition-all duration-200"
                style={{ color: DS.TEXT_MUTED, background: 'rgba(255,255,255,0.03)', border: `1px solid ${DS.BORDER}` }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.10)'; e.currentTarget.style.color = '#F87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = DS.TEXT_MUTED; e.currentTarget.style.borderColor = DS.BORDER }}
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Company identity — large avatar + name + badges */}
          <div className="flex items-start gap-4 mb-5 relative">
            {/* Company avatar — initials-based with gradient ring */}
            <div className="relative shrink-0">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `linear-gradient(145deg, ${color}20, ${color}08)`,
                  border: `2px solid ${color}30`,
                  boxShadow: `0 0 24px ${color}15`,
                }}
              >
                <span
                  style={{
                    fontSize: 18, fontWeight: 800, color,
                    fontFamily: 'system-ui, sans-serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {initials(deal.company?.name || '??')}
                </span>
              </div>
              {/* Live pulse dot for active deals */}
              {deal.stage !== 'closed_won' && deal.stage !== 'closed_lost' && (
                <div
                  className="absolute -bottom-0.5 -right-0.5"
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: DS.GREEN,
                    border: `3px solid ${DS.BG_CARD}`,
                    boxShadow: `0 0 8px ${DS.GREEN}80`,
                  }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                className="truncate"
                style={{
                  fontSize: 24, fontWeight: 800, color: DS.TEXT_PRIMARY,
                  lineHeight: 1.15, letterSpacing: '-0.02em',
                }}
              >
                {deal.company?.name}
              </h2>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineEdit
                    mode="select"
                    value={deal.product}
                    onSave={async (v) => {
                      await updateMutation.mutateAsync({ product: String(v) })
                    }}
                    options={[
                      { value: 'solarpilot', label: 'SolarPilot' },
                      { value: 'ai_workforce', label: 'AI Workforce' },
                      { value: 'both', label: 'Both' },
                    ]}
                    accentColor={PRODUCTS[deal.product]?.color || DS.YELLOW}
                    fontSize={10}
                    fontWeight={600}
                  />
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: `${color}12`, border: `1px solid ${color}22` }}
                >
                  <StageIcon size={12} style={{ color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color }}>
                    {STAGE_NAME_MAP[deal.stage] || deal.stage}
                  </span>
                </div>
                {prob != null && (
                  <span
                    className="px-2.5 py-1.5 rounded-lg"
                    style={{
                      fontSize: 11, fontWeight: 600, color: DS.TEXT_SECONDARY,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${DS.BORDER}`,
                    }}
                  >
                    {Math.round(prob * 100)}% win
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stage progress — premium stepper with animated glow */}
          <div className="relative">
            <div className="flex items-center gap-0">
              {ALL_STAGE_KEYS.map((key, i) => {
                const sColor = STAGE_COLOR_MAP[key] || '#444'
                const isActive = key === deal.stage
                const isPast = i < stageIdx
                const isNext = i === stageIdx + 1
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-center">
                      {/* Connector before dot */}
                      <div className="flex-1 relative" style={{ height: 3, borderRadius: 1.5 }}>
                        <div
                          style={{
                            position: 'absolute', inset: 0, borderRadius: 1.5,
                            background: isPast
                              ? `linear-gradient(90deg, ${sColor}60, ${sColor}30)`
                              : 'rgba(255,255,255,0.04)',
                            transition: 'background 0.4s ease',
                          }}
                        />
                      </div>
                      {/* Dot with glow */}
                      <motion.div
                        className="shrink-0 relative"
                        style={{
                          width: isActive ? 16 : isPast ? 10 : 8,
                          height: isActive ? 16 : isPast ? 10 : 8,
                          borderRadius: '50%',
                          background: isActive || isPast ? sColor : 'rgba(255,255,255,0.06)',
                          transition: 'all 0.3s ease',
                        }}
                        animate={isActive ? {
                          boxShadow: [
                            `0 0 0 0 ${sColor}00`,
                            `0 0 0 6px ${sColor}20`,
                            `0 0 0 0 ${sColor}00`,
                          ],
                        } : {}}
                        transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                      >
                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{ border: `2px solid ${DS.BG_CARD}` }}
                          />
                        )}
                        {isActive && (
                          <div
                            className="absolute rounded-full"
                            style={{
                              inset: -4,
                              border: `1px solid ${sColor}30`,
                            }}
                          />
                        )}
                      </motion.div>
                      {/* Connector after dot */}
                      {i < ALL_STAGE_KEYS.length - 1 && (
                        <div className="flex-1 relative" style={{ height: 3, borderRadius: 1.5 }}>
                          <div
                            style={{
                              position: 'absolute', inset: 0, borderRadius: 1.5,
                              background: i < stageIdx
                                ? `linear-gradient(90deg, ${sColor}30, ${STAGE_COLOR_MAP[ALL_STAGE_KEYS[i + 1]]}60)`
                                : isActive
                                  ? `linear-gradient(90deg, ${sColor}, ${sColor}20)`
                                  : 'rgba(255,255,255,0.04)',
                              transition: 'background 0.4s ease',
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <span
                      className="truncate w-full text-center"
                      style={{
                        fontSize: 9,
                        fontWeight: isActive ? 700 : isPast ? 500 : 400,
                        color: isActive ? sColor : isPast ? `${sColor}80` : DS.TEXT_MUTED,
                        letterSpacing: '0.03em',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {STAGE_NAME_MAP[key]?.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ═══ SCROLLABLE BODY ═══ */}
        <ScrollArea className="flex-1">
          <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Financial Hero — premium 3-col grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                {
                  label: 'Monthly Revenue',
                  field: 'mrr' as const,
                  value: deal.mrr,
                  sub: deal.mrr ? '/month recurring' : '',
                  icon: Euro, color: DS.GREEN,
                  hasValue: !!deal.mrr,
                  formatValue: (v: number) => `€${v.toLocaleString('en-IE')}`,
                },
                {
                  label: 'Setup Fee',
                  field: 'setupFee' as const,
                  value: deal.setupFee,
                  sub: deal.setupFee ? 'one-time' : '',
                  icon: DollarSign, color: '#A78BFA',
                  hasValue: !!deal.setupFee,
                  formatValue: (v: number) => fmt(v),
                },
                {
                  label: 'Total Value',
                  field: 'value' as const,
                  value: deal.value,
                  sub: weightedValue ? `Weighted: ${fmt(weightedValue)}` : '',
                  icon: TrendingUp, color: DS.YELLOW,
                  hasValue: !!deal.value,
                  formatValue: (v: number) => fmt(v),
                },
              ].map((f, fi) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: fi * 0.06, duration: 0.3 }}
                  whileHover={{
                    y: -3,
                    transition: { duration: 0.15 },
                  }}
                  style={{
                    padding: '20px 18px',
                    borderRadius: 16,
                    position: 'relative',
                    overflow: 'hidden',
                    background: f.hasValue
                      ? `linear-gradient(145deg, ${f.color}0A 0%, ${f.color}03 100%)`
                      : DS.BG_COLUMN,
                    border: `1px solid ${f.hasValue ? `${f.color}18` : DS.BORDER}`,
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (f.hasValue) {
                      e.currentTarget.style.borderColor = `${f.color}35`
                      e.currentTarget.style.boxShadow = `0 8px 32px ${f.color}10`
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${f.hasValue ? `${f.color}18` : DS.BORDER}`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Subtle corner accent */}
                  {f.hasValue && (
                    <div
                      className="absolute top-0 right-0 w-16 h-16"
                      style={{
                        background: `radial-gradient(circle at 100% 0%, ${f.color}10 0%, transparent 70%)`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <div className="flex items-center gap-2.5 mb-3 relative">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: `${f.color}12`,
                        border: `1px solid ${f.color}15`,
                      }}
                    >
                      <f.icon size={15} style={{ color: f.color }} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: DS.TEXT_TERTIARY,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}>
                      {f.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 26, fontWeight: 800,
                    fontFamily: 'monospace',
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    position: 'relative',
                  }}>
                    <InlineEdit
                      mode="number"
                      value={f.value}
                      onSave={async (v) => {
                        const numVal = typeof v === 'string' ? parseFloat(v) : v
                        if (isNaN(numVal)) return

                        // Auto-recalculate value when MRR or setupFee change
                        if (f.field === 'mrr') {
                          const setupFee = deal.setupFee || 0
                          const newValue = setupFee + (numVal * 12)
                          await updateMutation.mutateAsync({ mrr: numVal, value: newValue })
                        } else if (f.field === 'setupFee') {
                          const mrr = deal.mrr || 0
                          const newValue = numVal + (mrr * 12)
                          await updateMutation.mutateAsync({ setupFee: numVal, value: newValue })
                        } else {
                          await updateMutation.mutateAsync({ value: numVal })
                        }
                      }}
                      formatValue={f.formatValue}
                      accentColor={f.color}
                      placeholder="—"
                      fontSize={26}
                      fontWeight={800}
                      containerStyle={{ width: '100%' }}
                    />
                  </div>
                  {f.sub && f.hasValue && (
                    <div style={{
                      fontSize: 10, color: DS.TEXT_MUTED,
                      marginTop: 5, position: 'relative',
                      fontWeight: 500,
                    }}>
                      {f.sub}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* ── Quick Actions Toolbar ── */}
            <div
              style={{
                display: 'flex', gap: 8, padding: '6px',
                borderRadius: 14,
                background: DS.BG_COLUMN,
                border: `1px solid ${DS.BORDER}`,
              }}
            >
              {[
                { l: 'Log Call', t: 'call', icon: Phone, color: '#34D399' },
                { l: 'Log Email', t: 'email', icon: Mail, color: '#60A5FA' },
                { l: 'Demo', t: 'demo', icon: Briefcase, color: '#F472B6' },
                { l: 'Proposal', t: 'proposal', icon: FileSpreadsheet, color: '#FB923C' },
              ].map((a) => (
                <motion.button
                  key={a.t}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setLogForm((f) => ({ ...f, type: a.t, title: '', content: '' }))
                    setShowLogForm(true)
                  }}
                  className="flex items-center gap-2.5 flex-1 justify-center transition-all duration-200"
                  style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'transparent',
                    border: `1px solid transparent`,
                    color: a.color, fontSize: 12, fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${a.color}0A`
                    e.currentTarget.style.borderColor = `${a.color}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  <a.icon size={15} />
                  <span>{a.l}</span>
                </motion.button>
              ))}
            </div>

            {/* ── Deal Intelligence Strip ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 12,
                padding: '14px 18px',
                borderRadius: 14,
                background: DS.BG_COLUMN,
                border: `1px solid ${DS.BORDER}`,
                alignItems: 'center',
              }}
            >
              {/* Timestamps */}
              <div className="flex items-center gap-2" style={{ color: DS.TEXT_MUTED, fontSize: 11, fontWeight: 500 }}>
                <Clock size={12} className="shrink-0" />
                <span className="truncate">
                  {deal.createdAt
                    ? <ClientOnly fallback="—">Created {safeTimeAgo(new Date(deal.createdAt))}</ClientOnly>
                    : '—'}
                </span>
                {deal.updatedAt && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.10)' }}>&middot;</span>
                    <span className="truncate">
                      Updated <ClientOnly fallback="">{safeTimeAgo(new Date(deal.updatedAt))}</ClientOnly>
                    </span>
                  </>
                )}
              </div>

              {/* Deal Score pill */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
                style={{
                  background: deal.dealScore
                    ? `${deal.dealScore === 'hot' ? DS.GREEN : deal.dealScore === 'warm' ? '#FBBF24' : '#6B7280'}10`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${deal.dealScore
                    ? `${deal.dealScore === 'hot' ? DS.GREEN : deal.dealScore === 'warm' ? '#FBBF24' : '#6B7280'}20`
                    : DS.BORDER}`,
                }}
              >
                <ScoreDot score={deal.dealScore} />
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: deal.dealScore
                    ? (deal.dealScore === 'hot' ? DS.GREEN : deal.dealScore === 'warm' ? '#FBBF24' : '#6B7280')
                    : DS.TEXT_MUTED,
                  textTransform: 'capitalize',
                }}>
                  {deal.dealScore || 'Unscored'}
                </span>
              </div>

              {/* Days in stage */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
                style={{
                  background: deal.daysInStage != null
                    ? `${deal.daysInStage < 3 ? DS.GREEN : deal.daysInStage <= 7 ? '#FBBF24' : DS.RED}08`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${deal.daysInStage != null
                    ? `${deal.daysInStage < 3 ? DS.GREEN : deal.daysInStage <= 7 ? '#FBBF24' : DS.RED}18`
                    : DS.BORDER}`,
                }}
              >
                {deal.daysInStage != null ? (
                  <>
                    <span style={{
                      fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                      color: deal.daysInStage < 3 ? DS.GREEN : deal.daysInStage <= 7 ? '#FBBF24' : DS.RED,
                    }}>
                      {deal.daysInStage}
                    </span>
                    <span style={{ fontSize: 10, color: DS.TEXT_MUTED, fontWeight: 500 }}>days</span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: DS.TEXT_MUTED, fontWeight: 500 }}>— days</span>
                )}
              </div>
            </div>

            {/* ── Demo Outcome (only for demo_booked / demo_done stages) ── */}
            {(deal.stage === 'demo_booked' || deal.stage === 'demo_done') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13, duration: 0.3 }}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  background: DS.BG_COLUMN,
                  border: `1px solid ${DS.BORDER}`,
                }}
              >
                <p style={{ ...sectionTitleStyle, fontSize: 10, marginBottom: 12 }}>
                  Demo Outcome
                </p>
                <InlineEdit
                  mode="select"
                  value={(deal as Record<string, unknown>).demoOutcome as string || ''}
                  onSave={async (v) => {
                    await updateMutation.mutateAsync({ demoOutcome: String(v) })
                  }}
                  options={[
                    { value: '', label: 'Not set' },
                    { value: 'positive', label: 'Positive' },
                    { value: 'neutral', label: 'Neutral' },
                    { value: 'negative', label: 'Negative' },
                  ]}
                  placeholder="Set demo outcome"
                  accentColor={STAGE_COLOR_MAP[deal.stage] || DS.PINK}
                  fontSize={14}
                  fontWeight={600}
                  containerStyle={{ width: '100%' }}
                  inputWidth="100%"
                />
              </motion.div>
            )}

            {/* ── Close Reason (only for closed_won / closed_lost stages) ── */}
            {(deal.stage === 'closed_won' || deal.stage === 'closed_lost') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13, duration: 0.3 }}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  background: DS.BG_COLUMN,
                  border: `1px solid ${DS.BORDER}`,
                }}
              >
                <p style={{ ...sectionTitleStyle, fontSize: 10, marginBottom: 12 }}>
                  Close Reason
                </p>
                <InlineEdit
                  mode="select"
                  value={(deal as Record<string, unknown>).closeReason as string || ''}
                  onSave={async (v) => {
                    await updateMutation.mutateAsync({ closeReason: String(v) })
                  }}
                  options={[
                    { value: '', label: 'Not set' },
                    { value: 'price', label: 'Price' },
                    { value: 'timing', label: 'Timing' },
                    { value: 'competitor', label: 'Competitor' },
                    { value: 'no_response', label: 'No Response' },
                    { value: 'not_interested', label: 'Not Interested' },
                  ]}
                  placeholder="Set close reason"
                  accentColor={deal.stage === 'closed_won' ? DS.GREEN : DS.RED}
                  fontSize={14}
                  fontWeight={600}
                  containerStyle={{ width: '100%' }}
                  inputWidth="100%"
                />
              </motion.div>
            )}

            {/* ── Decision Maker Card ── */}
            {dm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  background: DS.BG_COLUMN,
                  border: `1px solid ${DS.BORDER}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p style={{ ...sectionTitleStyle, fontSize: 10, marginBottom: 0 }}>
                    <span style={{ marginRight: 6 }}>Decision Maker</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      width: 6, height: 6, borderRadius: '50%',
                      background: DS.GREEN, boxShadow: `0 0 6px ${DS.GREEN}60`,
                    }} />
                  </p>
                </div>
                <div className="flex items-center gap-4 mb-5">
                  {/* Avatar with ring */}
                  <div className="relative shrink-0">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 44, height: 44, borderRadius: 13,
                        background: `linear-gradient(145deg, ${color}25, ${color}10)`,
                        border: `2px solid ${color}30`,
                      }}
                    >
                      <span style={{
                        fontSize: 15, fontWeight: 800, color,
                        letterSpacing: '-0.01em',
                      }}>
                        {initials(dm.name)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 15, fontWeight: 700, color: DS.TEXT_PRIMARY, lineHeight: 1.2 }}>
                      {dm.name}
                    </p>
                    {dm.role && (
                      <p style={{
                        fontSize: 12, color: DS.TEXT_MUTED, marginTop: 3,
                        fontWeight: 500,
                      }}>
                        {dm.role}
                      </p>
                    )}
                  </div>
                </div>
                {/* Contact buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {dm.phone && (
                    <a
                      href={`tel:${dm.phone}`}
                      className="flex items-center gap-2 transition-all duration-200"
                      style={{
                        padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        color: DS.GREEN,
                        background: 'rgba(16,185,129,0.06)',
                        border: `1px solid rgba(16,185,129,0.15)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(16,185,129,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.30)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.10)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(16,185,129,0.06)'
                        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <Phone size={13} />
                      <span>{dm.phone}</span>
                    </a>
                  )}
                  {dm.email && (
                    <a
                      href={`mailto:${dm.email}`}
                      className="flex items-center gap-2 transition-all duration-200"
                      style={{
                        padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        color: '#60A5FA',
                        background: 'rgba(96,165,250,0.06)',
                        border: `1px solid rgba(96,165,250,0.15)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(96,165,250,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(96,165,250,0.30)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(96,165,250,0.10)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(96,165,250,0.06)'
                        e.currentTarget.style.borderColor = 'rgba(96,165,250,0.15)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <Mail size={13} />
                      <span>{dm.email}</span>
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Notes Section ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              style={{
                padding: 22,
                borderRadius: 16,
                background: DS.BG_COLUMN,
                border: `1px solid ${DS.BORDER}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p style={{ ...sectionTitleStyle, fontSize: 10, marginBottom: 0 }}>
                  Notes
                  {deal.notes && (
                    <span style={{ marginLeft: 6, color: DS.TEXT_MUTED, fontWeight: 400 }}>
                      ({deal.notes.length})
                    </span>
                  )}
                </p>
                <button
                  onClick={() => { setNoteText(deal.notes || ''); setEditingNote(!editingNote) }}
                  className="flex items-center gap-1.5 transition-all duration-200 font-semibold"
                  style={{
                    fontSize: 11, padding: '5px 12px', borderRadius: 8,
                    color: '#000',
                    background: editingNote ? 'rgba(255,255,255,0.10)' : DS.YELLOW,
                  }}
                  onMouseEnter={(e) => {
                    if (editingNote) return
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(243,216,64,0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {editingNote ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingNote ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <Textarea
                    value={noteText} onChange={(e) => setNoteText(e.target.value)}
                    rows={5} className="text-sm resize-none" style={inputStyle}
                    placeholder="Add your notes about this deal..."
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 10, color: DS.TEXT_MUTED, fontWeight: 500 }}>
                      {noteText.length} characters
                    </span>
                    <Button
                      size="sm"
                      onClick={() => { updateMutation.mutate({ notes: noteText }); setEditingNote(false) }}
                      className="font-semibold px-5"
                      style={{
                        backgroundColor: DS.YELLOW, color: '#000', fontSize: 12,
                        boxShadow: '0 2px 12px rgba(243,216,64,0.20)',
                      }}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <p style={{
                  fontSize: 13, lineHeight: 1.75, color: deal.notes ? DS.TEXT_SECONDARY : DS.TEXT_MUTED,
                  whiteSpace: 'pre-wrap',
                  fontStyle: deal.notes ? 'normal' : 'italic',
                }}>
                  {deal.notes || 'No notes yet. Click Edit to add details about this deal.'}
                </p>
              )}
            </motion.div>

            {/* ── Activity Timeline ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              style={{
                padding: 22,
                borderRadius: 16,
                background: DS.BG_COLUMN,
                border: `1px solid ${DS.BORDER}`,
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <p style={{ ...sectionTitleStyle, fontSize: 10, marginBottom: 0 }}>
                  Activity
                  <span style={{
                    marginLeft: 6, fontWeight: 400,
                    color: DS.TEXT_SECONDARY,
                  }}>
                    {deal.activities?.length || 0}
                  </span>
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setLogForm({ type: 'note', title: '', content: '' }); setShowLogForm(!showLogForm) }}
                  className="flex items-center gap-1.5 font-bold transition-all duration-200"
                  style={{
                    fontSize: 11, padding: '7px 14px', borderRadius: 9,
                    color: '#000', backgroundColor: DS.YELLOW,
                    boxShadow: '0 2px 12px rgba(243,216,64,0.20)',
                    border: 'none',
                  }}
                >
                  <Plus size={13} />
                  Log Activity
                </motion.button>
              </div>

              {showLogForm && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5"
                  style={{
                    padding: 18, borderRadius: 14,
                    background: 'rgba(0,0,0,0.25)',
                    border: `1px solid ${DS.BORDER}`,
                  }}
                >
                  <div className="space-y-3">
                    <Select
                      value={logForm.type}
                      onValueChange={(v) => setLogForm((f) => ({ ...f, type: v }))}
                    >
                      <SelectTrigger className="h-10 text-sm" style={inputStyle}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['call', 'email', 'demo', 'meeting', 'note', 'proposal'].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Title" value={logForm.title}
                      onChange={(e) => setLogForm((f) => ({ ...f, title: e.target.value }))}
                      className="h-10 text-sm" style={inputStyle}
                      autoFocus
                    />
                    <Textarea
                      placeholder="Details (optional)" value={logForm.content}
                      onChange={(e) => setLogForm((f) => ({ ...f, content: e.target.value }))}
                      rows={3} className="text-sm resize-none" style={inputStyle}
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="ghost" className="text-xs font-medium" style={{ color: DS.TEXT_SECONDARY }} onClick={() => setShowLogForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm" onClick={() => logMutation.mutate()}
                        className="font-bold px-5"
                        style={{
                          backgroundColor: DS.YELLOW, color: '#000', fontSize: 12,
                          boxShadow: '0 2px 12px rgba(243,216,64,0.20)',
                        }}
                        disabled={!logForm.title.trim() || logMutation.isPending}
                      >
                        {logMutation.isPending ? 'Saving...' : 'Log Activity'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Timeline entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 420, overflowY: 'auto' }}>
                {(!deal.activities || deal.activities.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div
                      className="flex items-center justify-center mb-3"
                      style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${DS.BORDER}`,
                      }}
                    >
                      <FileText size={20} style={{ color: DS.TEXT_MUTED }} />
                    </div>
                    <p style={{ fontSize: 13, color: DS.TEXT_MUTED, fontWeight: 500 }}>No activities yet</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)', marginTop: 4 }}>
                      Use the quick actions above to get started
                    </p>
                  </div>
                )}
                {(deal.activities || []).slice(0, 30).map((a, idx, arr) => {
                  const isFirst = idx === 0
                  const isLast = idx === arr.length - 1
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.04, duration: 0.25 }}
                      className="flex gap-4"
                    >
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center" style={{ width: 40 }}>
                        <div style={{ flexShrink: 0 }}>
                          <ActivityIcon type={a.type} />
                        </div>
                        {!isLast && (
                          <div
                            style={{
                              width: 1, flex: 1, minHeight: 20,
                              background: `linear-gradient(180deg, ${DS.BORDER}, transparent)`,
                              margin: '6px 0',
                            }}
                          />
                        )}
                      </div>
                      {/* Content */}
                      <div
                        className="group"
                        style={{ flex: 1, minWidth: 0, paddingBottom: 20 }}
                      >
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.02)',
                            border: `1px solid transparent`,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                            e.currentTarget.style.borderColor = DS.BORDER
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                            e.currentTarget.style.borderColor = 'transparent'
                          }}
                        >
                          <p style={{
                            fontSize: 13, fontWeight: 600,
                            color: DS.TEXT_PRIMARY, lineHeight: 1.4,
                          }}>
                            {a.title}
                          </p>
                          {a.content && (
                            <p style={{
                              fontSize: 12, color: DS.TEXT_SECONDARY,
                              lineHeight: 1.6, marginTop: 5,
                              display: '-webkit-box', WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {a.content}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2.5">
                            <span style={{
                              fontSize: 11, color: DS.TEXT_MUTED, fontWeight: 600,
                            }}>
                              {a.user?.name}
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>
                              &middot;
                            </span>
                            <span style={{
                              fontSize: 11, color: DS.TEXT_MUTED, fontWeight: 500,
                            }}>
                              <ClientOnly fallback="">{safeTimeAgo(new Date(a.createdAt))}</ClientOnly>
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </ScrollArea>
      </motion.div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// NEW DEAL DIALOG
// ═══════════════════════════════════════════════════════════════════
function NewDealDialog({
  open,
  onOpenChange,
  defaultStage,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultStage?: string
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    companyId: '',
    product: 'solarpilot',
    mrr: '',
    setupFee: '',
    stage: defaultStage || 'new_lead',
    notes: '',
  })
  const [companySearch, setCompanySearch] = useState('')

  const { data: companiesData } = useQuery({
    queryKey: ['companies-select', companySearch],
    queryFn: () =>
      fetch(
        `/api/crm/companies?limit=50${companySearch ? `&search=${encodeURIComponent(companySearch)}` : ''}`
      ).then((r) => r.json()),
    enabled: open,
  })
  const companies = companiesData?.companies || []

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.companyId) throw new Error('Select a company')
      const mrr = parseFloat(form.mrr) || 0
      const setup = parseFloat(form.setupFee) || 0
      const r = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          mrr: mrr || null,
          setupFee: setup || null,
          value: mrr || setup ? setup + mrr * 6 : null,
        }),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error || 'Failed')
      }
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      onOpenChange(false)
      toast.success('Deal created')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleOpen = useCallback(
    (v: boolean) => {
      if (v) {
        setForm({
          companyId: '',
          product: 'solarpilot',
          mrr: '',
          setupFee: '',
          stage: defaultStage || 'new_lead',
          notes: '',
        })
        setCompanySearch('')
      }
      onOpenChange(v)
    },
    [onOpenChange, defaultStage]
  )

  const selectedCompany = companies.find((c: { id: string }) => c.id === form.companyId)

  // Computed deal value
  const mrr = parseFloat(form.mrr) || 0
  const setup = parseFloat(form.setupFee) || 0
  const dealValue = mrr || setup ? setup + mrr * 6 : null

  const productKeys = ['solarpilot', 'ai_workforce', 'both'] as const
  const stageOptions = STAGES.filter(s => s.key !== 'closed_lost')

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: DS.BG_CARD,
          border: `1px solid ${DS.BORDER}`,
          borderRadius: 20,
          padding: 0,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Cinematic header */}
        <div
          className="relative overflow-hidden"
          style={{
            padding: '24px 28px 20px',
            borderBottom: `1px solid ${DS.BORDER}`,
            background: `linear-gradient(160deg, ${DS.YELLOW}08 0%, transparent 50%)`,
          }}
        >
          {/* Top accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${DS.YELLOW} 15%, ${DS.YELLOW}90 50%, ${DS.YELLOW}90%, transparent)`,
            boxShadow: `0 0 24px ${DS.YELLOW}50`,
          }} />
          {/* Radial glow */}
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 160, height: 160, pointerEvents: 'none',
            background: `radial-gradient(circle, ${DS.YELLOW}0A 0%, transparent 70%)`,
          }} />
          <DialogHeader>
            <div className="flex items-center gap-3.5 relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: `linear-gradient(135deg, ${DS.YELLOW}20, ${DS.YELLOW}08)`,
                  border: `1px solid ${DS.YELLOW}25`,
                  boxShadow: `0 0 24px ${DS.YELLOW}12`,
                }}
              >
                <Plus size={19} style={{ color: DS.YELLOW }} />
              </motion.div>
              <div>
                <DialogTitle style={{ color: DS.TEXT_PRIMARY, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  New Deal
                </DialogTitle>
                <DialogDescription style={{ color: DS.TEXT_TERTIARY, fontSize: 12, marginTop: 3 }}>
                  Create a new deal for an existing company
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Live value preview banner */}
        <AnimatePresence>
          {dealValue !== null && dealValue > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                margin: '0 28px',
                background: `linear-gradient(135deg, ${DS.GREEN}0D, ${DS.GREEN}05)`,
                border: `1px solid ${DS.GREEN}18`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: `${DS.GREEN}15`, border: `1px solid ${DS.GREEN}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={14} style={{ color: DS.GREEN }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: DS.TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Est. Annual Value
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: DS.GREEN, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                    {fmt(dealValue)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: DS.TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Monthly
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DS.GREEN, fontFamily: 'monospace' }}>
                    {fmt(mrr * 12 + setup)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-5" style={{ padding: '20px 28px 28px' }}>
          {/* Company search */}
          <div className="space-y-2.5">
            <Label style={{ color: DS.TEXT_SECONDARY, fontSize: 12, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Company <span style={{ color: DS.RED }}>*</span>
            </Label>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DS.TEXT_TERTIARY }} size={15} />
              <Input
                placeholder="Search companies..."
                value={companySearch || (selectedCompany ? selectedCompany.name : '')}
                onChange={(e) => {
                  setCompanySearch(e.target.value)
                  if (form.companyId) setForm((f) => ({ ...f, companyId: '' }))
                }}
                className="h-12 text-sm"
                style={{
                  ...inputStyle,
                  background: DS.BG_INPUT,
                  border: `1.5px solid ${form.companyId ? `${DS.GREEN}40` : DS.BORDER}`,
                  borderRadius: 12,
                  paddingLeft: 40,
                  transition: 'all 0.25s ease',
                  boxShadow: form.companyId ? `0 0 0 3px ${DS.GREEN}08` : 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = DS.BORDER_FOCUS; e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.YELLOW}12` }}
                onBlur={(e) => {
                  if (form.companyId) {
                    e.currentTarget.style.borderColor = `${DS.GREEN}40`
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.GREEN}08`
                  } else {
                    e.currentTarget.style.borderColor = DS.BORDER
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              />
            </div>
            {companySearch && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-h-44 overflow-y-auto rounded-xl mt-1"
                style={{ backgroundColor: DS.BG_ELEVATED, border: `1px solid ${DS.BORDER_HOVER}` }}
              >
                {companies.length === 0 ? (
                  <div className="p-6 text-center">
                    <Building2 size={20} style={{ color: DS.TEXT_MUTED, margin: '0 auto 8px' }} />
                    <p className="text-sm" style={{ color: DS.TEXT_MUTED }}>No companies found</p>
                  </div>
                ) : (
                  companies.map((c: { id: string; name: string; counties: string; status?: string }) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-4 py-3.5 text-sm transition-all duration-150"
                      style={{ color: DS.TEXT_PRIMARY, borderBottom: `1px solid ${DS.BORDER}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      onClick={() => {
                        setForm((f) => ({ ...f, companyId: c.id }))
                        setCompanySearch('')
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: `linear-gradient(135deg, ${DS.BLUE}18, ${DS.BLUE}08)`,
                            border: `1px solid ${DS.BLUE}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: DS.BLUE }}>
                              {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-md" style={{
                          color: c.status === 'active' ? DS.GREEN : DS.TEXT_MUTED,
                          background: c.status === 'active' ? `${DS.GREEN}12` : 'rgba(255,255,255,0.04)',
                          fontWeight: 500,
                        }}>
                          {c.counties}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </motion.div>
            )}
            {form.companyId && !companySearch && selectedCompany && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2.5"
                style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${DS.GREEN}10, ${DS.GREEN}06)`,
                  border: `1px solid ${DS.GREEN}20`,
                }}
              >
                <CheckCircle2 size={15} style={{ color: DS.GREEN }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.GREEN }}>{selectedCompany.name}</span>
                <button
                  onClick={() => setForm((f) => ({ ...f, companyId: '' }))}
                  aria-label="Remove company selection"
                  style={{ marginLeft: 'auto', color: DS.GREEN, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </div>

          {/* Product selection — visual cards */}
          <div className="space-y-2.5">
            <Label style={{ color: DS.TEXT_SECONDARY, fontSize: 12, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Product
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              {productKeys.map((key) => {
                const p = PRODUCTS[key]
                const active = form.product === key
                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setForm((f) => ({ ...f, product: key }))}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      padding: '14px 8px', borderRadius: 14,
                      background: active
                        ? `linear-gradient(135deg, ${p.color}14, ${p.color}08)`
                        : DS.BG_INPUT,
                      border: `1.5px solid ${active ? `${p.color}35` : DS.BORDER}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: active ? `0 0 20px ${p.color}10` : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {active && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: `linear-gradient(90deg, transparent, ${p.color}60, transparent)`,
                      }} />
                    )}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: `${p.color}15`,
                      border: `1px solid ${p.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <p.icon size={16} style={{ color: p.color }} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: active ? 700 : 500,
                      color: active ? p.color : DS.TEXT_SECONDARY,
                      transition: 'color 0.2s',
                    }}>
                      {p.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Stage selection — visual pills */}
          <div className="space-y-2.5">
            <Label style={{ color: DS.TEXT_SECONDARY, fontSize: 12, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Stage
            </Label>
            <div className="flex flex-wrap gap-2">
              {stageOptions.map((s) => {
                const active = form.stage === s.key
                const Icon = s.icon
                return (
                  <motion.button
                    key={s.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setForm((f) => ({ ...f, stage: s.key }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 12px', borderRadius: 9,
                      background: active
                        ? `linear-gradient(135deg, ${s.color}18, ${s.color}0A)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? `${s.color}30` : DS.BORDER}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: active ? `0 0 12px ${s.color}08` : 'none',
                    }}
                  >
                    <Icon size={12} style={{ color: active ? s.color : DS.TEXT_TERTIARY }} />
                    <span style={{
                      fontSize: 11, fontWeight: active ? 700 : 500,
                      color: active ? s.color : DS.TEXT_SECONDARY,
                    }}>
                      {s.name}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Financial inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label style={{ color: DS.TEXT_SECONDARY, fontSize: 12, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Monthly Revenue
              </Label>
              <div style={{ position: 'relative' }}>
                <Euro size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DS.TEXT_TERTIARY, pointerEvents: 'none' }} />
                <Input
                  type="number"
                  placeholder="0"
                  value={form.mrr}
                  onChange={(e) => setForm((f) => ({ ...f, mrr: e.target.value }))}
                  className="h-12 text-sm"
                  style={{
                    ...inputStyle, background: DS.BG_INPUT, border: `1.5px solid ${DS.BORDER}`, borderRadius: 12,
                    paddingLeft: 38, fontWeight: 600, fontFamily: 'monospace', fontSize: 14,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${DS.GREEN}40`; e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.GREEN}08` }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = DS.BORDER; e.currentTarget.style.boxShadow = 'none' }}
                />
                <span style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 11, fontWeight: 600, color: DS.TEXT_TERTIARY,
                }}>
                  /mo
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              <Label style={{ color: DS.TEXT_SECONDARY, fontSize: 12, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Setup Fee
              </Label>
              <div style={{ position: 'relative' }}>
                <Euro size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DS.TEXT_TERTIARY, pointerEvents: 'none' }} />
                <Input
                  type="number"
                  placeholder="0"
                  value={form.setupFee}
                  onChange={(e) => setForm((f) => ({ ...f, setupFee: e.target.value }))}
                  className="h-12 text-sm"
                  style={{
                    ...inputStyle, background: DS.BG_INPUT, border: `1.5px solid ${DS.BORDER}`, borderRadius: 12,
                    paddingLeft: 38, fontWeight: 600, fontFamily: 'monospace', fontSize: 14,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${DS.PURPLE}40`; e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.PURPLE}08` }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = DS.BORDER; e.currentTarget.style.boxShadow = 'none' }}
                />
                <span style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 11, fontWeight: 600, color: DS.TEXT_TERTIARY,
                }}>
                  once
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2.5">
            <Label style={{ color: DS.TEXT_SECONDARY, fontSize: 12, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Notes
            </Label>
            <Textarea
              placeholder="Add any notes about this deal..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="text-sm resize-none"
              style={{
                ...inputStyle, background: DS.BG_INPUT, border: `1.5px solid ${DS.BORDER}`, borderRadius: 12,
                padding: '12px 14px', fontSize: 13,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = DS.BORDER_HOVER }}
              onBlur={(e) => { e.currentTarget.style.borderColor = DS.BORDER }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenChange(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 48, flex: 1, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
                background: 'rgba(255,255,255,0.04)',
                color: DS.TEXT_SECONDARY,
                border: `1px solid ${DS.BORDER}`,
                borderRadius: 12,
                transition: 'all 0.2s',
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(243,216,64,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => createMutation.mutate()}
              disabled={!form.companyId || createMutation.isPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                height: 48, flex: 1, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                background: `linear-gradient(135deg, ${DS.YELLOW}, #E8CC30)`,
                color: '#000', border: 'none', borderRadius: 12,
                boxShadow: '0 4px 20px rgba(243,216,64,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                opacity: (!form.companyId || createMutation.isPending) ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {createMutation.isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }}
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} strokeWidth={2.5} />
                  Create Deal
                </>
              )}
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PIPELINE BOARD — Orchestrates all pipeline logic
// ═══════════════════════════════════════════════════════════════════
export function PipelineBoard() {
  const qc = useQueryClient()
  const searchRef = useRef<HTMLInputElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // ── State ─────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [includeWon, setIncludeWon] = useState(false)
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set())
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [newDealOpen, setNewDealOpen] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Track whether the board can scroll right (for overflow indicator)
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const check = () => {
      setCanScrollRight(el.scrollWidth > el.clientWidth + 2)
    }
    check()
    el.addEventListener('scroll', check)
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  // ── Data ──────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pipeline', includeWon],
    queryFn: () =>
      fetch(`/api/crm/pipeline?includeClosed=${includeWon}`).then((r) => r.json()),
  })

  const stages: PipelineStage[] = data?.stages || []
  const summary: PipelineSummary | undefined = data?.summary

  // ── Client-side filtering ─────────────────────────────────────
  const filteredStages = useMemo(() => {
    return stages.map((stage) => ({
      ...stage,
      deals: stage.deals.filter((d) => {
        if (search) {
          const q = search.toLowerCase()
          if (!d.company?.name?.toLowerCase().includes(q)) return false
        }
        if (productFilter !== 'all' && d.product !== productFilter) return false
        return true
      }),
    }))
  }, [stages, search, productFilter])

  // ── Column collapse ───────────────────────────────────────────
  const toggleCollapse = useCallback((key: string) => {
    setCollapsedCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ── DnD ───────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const moveMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      const r = await fetch('/api/crm/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, stage }),
      })
      if (!r.ok) throw new Error('Failed to move deal')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      toast.success('Deal moved')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      setDraggingId(null)
      const { active, over } = event
      if (!over) return

      const dealId = active.id as string
      // Find which column it was dropped on
      let targetStage = over.id as string

      // If dropped on a deal (not a column), find that deal's stage
      if (over.id !== active.id) {
        for (const stage of stages) {
          if (stage.deals.some((d) => d.id === over.id)) {
            targetStage = stage.stageKey
            break
          }
        }
      }

      // Find current stage
      const currentDeal = stages
        .flatMap((s) => s.deals)
        .find((d) => d.id === dealId)

      if (currentDeal && currentDeal.stage !== targetStage) {
        moveMutation.mutate({ dealId, stage: targetStage })
      }
    },
    [stages, moveMutation]
  )

  // ── Advance deal ──────────────────────────────────────────────
  const advanceDeal = useCallback(
    (deal: Deal) => {
      const idx = ALL_STAGE_KEYS.indexOf(deal.stage)
      if (idx < 0 || idx >= ALL_STAGE_KEYS.length - 1) return
      moveMutation.mutate({ dealId: deal.id, stage: ALL_STAGE_KEYS[idx + 1] })
    },
    [moveMutation]
  )

  // ── Inline update deal fields from card ──────────────────────
  const cardUpdateMutation = useMutation({
    mutationFn: async ({ dealId, body }: { dealId: string; body: Record<string, unknown> }) => {
      const r = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error('Failed to update')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      toast.success('Updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleCardUpdateMRR = useCallback((dealId: string, mrr: number) => {
    // Find deal to get setupFee for auto-recalculation
    const currentDeal = stages.flatMap((s) => s.deals).find((d) => d.id === dealId)
    const setupFee = currentDeal?.setupFee || 0
    cardUpdateMutation.mutate({ dealId, body: { mrr, value: setupFee + (mrr * 12) } })
  }, [stages, cardUpdateMutation])

  const handleCardUpdateProduct = useCallback((dealId: string, product: string) => {
    cardUpdateMutation.mutate({ dealId, body: { product } })
  }, [cardUpdateMutation])

  // ── Find active deal for DragOverlay ──────────────────────────
  const activeDeal = useMemo(() => {
    if (!activeId) return null
    return stages.flatMap((s) => s.deals).find((d) => d.id === activeId) || null
  }, [activeId, stages])

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') {
          if (selectedDealId) setSelectedDealId(null)
          else if (newDealOpen) setNewDealOpen(false)
        }
        return
      }

      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'n') {
        e.preventDefault()
        setNewDealOpen(true)
      } else if (e.key === 'Escape') {
        if (selectedDealId) setSelectedDealId(null)
        else if (newDealOpen) setNewDealOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedDealId, newDealOpen])

  // ── Render ────────────────────────────────────────────────────
  if (isLoading) return <PipelineSkeleton />
  if (isError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: DS.TEXT_PRIMARY }}>
            Failed to load pipeline
          </p>
          <p className="text-sm mt-1" style={{ color: DS.TEXT_MUTED }}>
            Please refresh the page
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="pipe-page-wrap"
      style={{
        padding: '32px 48px',
        background: `radial-gradient(ellipse at 50% 0%, ${DS.BG_CENTER} 0%, ${DS.BG_PAGE} 70%)`,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 24, flex: 1, minHeight: 0 }}>
      {/* ──── CINEMATIC HEADER (shrink-0) ──── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Gradient accent bar at top */}
        <div style={{
          height: 3, borderRadius: 2, marginBottom: 24,
          background: `linear-gradient(90deg, transparent, ${DS.YELLOW} 20%, ${DS.YELLOW}80 50%, ${DS.YELLOW}80%, transparent)`,
        }} />

        {/* Row 1: Title + Count + New Deal */}
        <div className="flex items-center justify-between relative">
          <div
            className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${DS.YELLOW}06 0%, transparent 70%)` }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{
                width: 4, height: 28, borderRadius: 2,
                background: `linear-gradient(180deg, ${DS.YELLOW}, ${DS.YELLOW}40)`,
              }} />
              <h1 style={{ fontSize: 24, fontWeight: 800, color: DS.TEXT_PRIMARY, letterSpacing: '-0.02em' }}>
                Pipeline
              </h1>
              {summary && (
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: `${DS.YELLOW}12`, border: `1px solid ${DS.YELLOW}20`,
                  color: DS.YELLOW, padding: '4px 10px', borderRadius: 6,
                }}>
                  {summary.totalDeals} deals
                </span>
              )}
              <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    style={{ width: 4, height: 4, borderRadius: '50%', background: DS.YELLOW }}
                  />
                ))}
              </div>
            </div>
            <p style={{ fontSize: 13, color: DS.TEXT_SECONDARY, paddingLeft: 16 }}>
              {summary ? (
                <>
                  {summary.totalDeals} active deals across {stages.length} stages &middot; {summary.winRate}% win rate
                </>
              ) : 'Loading...'}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(243,216,64,0.40)', y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={() => setNewDealOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 24px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${DS.YELLOW}, ${DS.YELLOW}DD)`,
              color: '#1A1A1A', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(243,216,64,0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
              letterSpacing: '-0.01em',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Deal
          </motion.button>
        </div>

        {/* Row 2: Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center gap-4 mt-6 pb-6"
          style={{ borderBottom: `1px solid ${DS.BORDER}` }}
        >
          <div className="relative" style={{ width: 380 }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: DS.TEXT_TERTIARY }} />
            <input
              ref={searchRef}
              aria-label="Search deals"
              placeholder="Search deals by company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12,
                border: `1px solid ${DS.BORDER}`, background: DS.BG_INPUT,
                color: DS.TEXT_PRIMARY, fontSize: 13, fontWeight: 500,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                letterSpacing: '0.01em',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = DS.BORDER_FOCUS; e.currentTarget.style.boxShadow = `0 0 0 3px ${DS.YELLOW}12` }}
              onBlur={(e) => { e.currentTarget.style.borderColor = DS.BORDER; e.currentTarget.style.boxShadow = 'none' }}
            />
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.BORDER}`, color: DS.TEXT_MUTED, fontFamily: 'monospace', fontWeight: 500 }}>/</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All Products' },
              { key: 'solarpilot', label: 'SolarPilot' },
              { key: 'ai_workforce', label: 'AI Workforce' },
              { key: 'both', label: 'Both' },
            ].map((filter) => {
              const isActive = productFilter === filter.key
              const pillColor = filter.key === 'all' ? DS.TEXT_SECONDARY : PRODUCTS[filter.key]?.color || DS.TEXT_SECONDARY
              const ProductIcon = filter.key !== 'all' ? PRODUCTS[filter.key]?.icon : null
              return (
                <motion.button
                  key={filter.key}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setProductFilter(filter.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8,
                    color: isActive ? '#000' : pillColor,
                    backgroundColor: isActive ? pillColor : DS.BG_CARD,
                    border: `1px solid ${isActive ? `${pillColor}30` : DS.BORDER}`,
                    fontSize: 12, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? `0 2px 12px ${pillColor}25` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) { e.currentTarget.style.backgroundColor = `${DS.BG_ELEVATED}`; e.currentTarget.style.borderColor = DS.BORDER_HOVER }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) { e.currentTarget.style.backgroundColor = DS.BG_CARD; e.currentTarget.style.borderColor = DS.BORDER }
                  }}
                >
                  {ProductIcon && <ProductIcon size={13} />}
                  {filter.label}
                </motion.button>
              )
            })}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIncludeWon(!includeWon)}
            className="flex items-center gap-2"
            style={{
              padding: '8px 14px', borderRadius: 8,
              color: includeWon ? DS.GREEN : DS.TEXT_MUTED,
              backgroundColor: includeWon ? 'rgba(34,197,94,0.08)' : DS.BG_CARD,
              border: `1px solid ${includeWon ? 'rgba(34,197,94,0.20)' : DS.BORDER}`,
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s', marginLeft: 'auto',
            }}
            onMouseEnter={(e) => {
              if (!includeWon) { e.currentTarget.style.backgroundColor = DS.BG_ELEVATED; e.currentTarget.style.borderColor = DS.BORDER_HOVER }
            }}
            onMouseLeave={(e) => {
              if (!includeWon) { e.currentTarget.style.backgroundColor = DS.BG_CARD; e.currentTarget.style.borderColor = DS.BORDER }
            }}
          >
            <CheckCircle2 size={14} />
            Won
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ──── STATS BAR (shrink-0) ──── */}
      <StatsBar summary={summary} />

      {/* ──── KANBAN BOARD (flex-1, fills remaining height) ──── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={boardRef}
          style={{ flex: 1, minHeight: 0 }}
          className="overflow-x-auto overflow-y-hidden relative"
        >
          <div className="flex gap-5 pt-6" style={{ height: '100%', minHeight: 500 }}>
            {filteredStages.map((stage, stageIdx) => (
              <PipelineColumn
                key={stage.stageKey}
                stage={stage}
                onDealClick={(d) => setSelectedDealId(d.id)}
                onAdvanceDeal={advanceDeal}
                collapsed={collapsedCols.has(stage.stageKey)}
                onToggleCollapse={() => toggleCollapse(stage.stageKey)}
                index={stageIdx}
                onUpdateMRR={handleCardUpdateMRR}
                onUpdateProduct={handleCardUpdateProduct}
              />
            ))}
          </div>
          {/* Scroll overflow indicator — subtle right-edge fade */}
          {canScrollRight && (
            <div
              className="pointer-events-none absolute top-0 right-0 bottom-0"
              style={{
                width: 48,
                background: 'linear-gradient(to left, #080808 10%, transparent 100%)',
                zIndex: 2,
              }}
            />
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal && (
            <div style={{ opacity: 0.9, transform: 'rotate(2deg)' }}>
              <DealCard deal={activeDeal} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ──── DETAIL PANEL ──── */}
      <AnimatePresence>
        {selectedDealId && (
          <DealDetailPanel
            dealId={selectedDealId}
            onClose={() => setSelectedDealId(null)}
          />
        )}
      </AnimatePresence>

      {/* ──── NEW DEAL DIALOG ──── */}
      <NewDealDialog open={newDealOpen} onOpenChange={setNewDealOpen} />
      </div>

      {/* ──── CUSTOM SCROLLBAR ──── */}
      <style jsx global>{`
        .pipe-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .pipe-scroll::-webkit-scrollbar-track { background: transparent; }
        .pipe-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        .pipe-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
        .flex-1.overflow-x-auto::-webkit-scrollbar { width: 6px; height: 6px; }
        .flex-1.overflow-x-auto::-webkit-scrollbar-track { background: transparent; }
        .flex-1.overflow-x-auto::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .flex-1.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .flex-1.overflow-y-auto::-webkit-scrollbar { width: 5px; }
        .flex-1.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
        .flex-1.overflow-y-auto::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        .flex-1.overflow-y-auto::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
        @media (max-width: 480px) {
          .pipe-page-wrap { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  )
}

// PipelineBoardSkeleton is the loading state for the dynamically imported board
export function PipelineBoardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '32px 48px',
      background: 'radial-gradient(ellipse at 50% 0%, #0C0C0C 0%, #080808 70%)', minHeight: '100vh' }}>
      <style>{`
        @keyframes pb-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .pb-shimmer {
          background: linear-gradient(90deg, #111111 25%, rgba(255,255,255,0.03) 50%, #111111 75%);
          background-size: 200% 100%;
          animation: pb-shimmer 1.5s ease-in-out infinite;
          border-radius: 14px;
        }
      `}</style>
      <div className="pb-shimmer" style={{ height: 60 }} />
      <div className="pb-shimmer" style={{ height: 60 }} />
      <div className="pb-shimmer" style={{ height: 60 }} />
      <div style={{ flex: 1, minHeight: 400, display: 'flex', gap: 16, paddingTop: 16 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="pb-shimmer" style={{ width: 280, flexShrink: 0 }} />
        ))}
      </div>
    </div>
  )
}
