// Relay Cockpit — Today
// ----------------------------------------------------------------------------
// The work-first call queue + inbound inbox. Mobile-first: a stacked queue with
// tap-to-call and a bottom-sheet lead detail; desktop (>=960px): a slim section
// rail + queue list + a persistent right-hand detail pane.
//
// RELAY_BUILD_CONTRACT compliant:
//   Law 2 — every /api/crm/* read/write goes through crmFetch.
//   Law 3 — NO mock-as-real. With no data we render an honest empty state; a
//           failed fetch renders an honest error state with retry. No fabricated
//           rows, and no fake "AI" affordances that don't call a real endpoint.
//   Law 4 — single-tenant; no per-tenant scoping.
//
// Data sources (both behind requireAuth, both via crmFetch):
//   /api/crm/pipeline  — deals grouped by stage, joined company + contacts
//                        (the load-bearing name + phone for tap-to-call).
//   /api/crm/deals     — raw deal rows carrying the canonical Relay lead-card
//                        fields (work_first, angle, segment, fit_score, source,
//                        channel). Merged into the pipeline deals by id. When
//                        P7 surfaces these on the pipeline route itself, they
//                        are read from there first — this stays correct either way.
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { crmFetch, ApiError } from '@/lib/crm-fetch'
import { useCRM } from '@/components/crm/CRMProvider'
import {
  Phone, PhoneCall, PhoneOff, Sun, Inbox, ListChecks, CheckCircle2,
  X, RefreshCw, Loader2, AlertTriangle, ChevronRight, Building2,
  StickyNote, CalendarClock, FileText, Receipt, Mail, Sparkles, FolderOpen,
} from 'lucide-react'

// ============================================================================
// RELAY DARK PALETTE (from the approved cockpit mock)
// ============================================================================
const BG = '#0E0D09'
const APP = '#141209'
const SURFACE = '#1B1810'
const SURFACE2 = '#231F15'
const LINE = '#2E2A1E'
const LINE2 = '#3C3626'
const TEXT = '#F5F1E6'
const MUTED = '#A9A28D'
const FAINT = '#7C7563'
const ACCENT = '#F3D840'
const ACCENT_INK = '#0A0A0A'
const CALL = '#38D39F'
const CALL_INK = '#04160F'
const DNE = '#F87171'
const INBOUND = '#5EC8E0'
const WON = '#38D39F'

const LIST_SOURCE = 'relay-list-v4' // imported prospecting list marker

// ============================================================================
// TYPES (loose — API payloads mirror the existing CRM pages' `<any>` usage)
// ============================================================================
interface PipelineContact {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  role: string | null
  isDecisionMaker: boolean | null
  doNotEmail?: boolean | null
  greetingName?: string | null
}
interface PipelineCompany {
  id: string
  name: string
  status: string | null
  contacts: PipelineContact[]
}
interface PipelineDeal {
  id: string
  stage: string
  company: PipelineCompany | null
  decisionMaker: PipelineContact | null
  // canonical fields may arrive here once the pipeline route surfaces them
  workFirst?: boolean
  work_first?: boolean
  angle?: string | null
  segment?: string | null
  fitScore?: number | null
  fit_score?: number | null
  source?: string | null
  channel?: string | null
  contactId?: string | null
  contact_id?: string | null
}
interface RawDeal {
  id: string
  company_id: string | null
  contact_id: string | null
  stage: string
  work_first: boolean | null
  angle: string | null
  segment: string | null
  fit_score: number | null
  source: string | null
  channel: string | null
  verdict: string | null
  action: string | null
  hook: string | null
  next_touch: string | null
  outcome: string | null
}

// The merged, render-ready lead.
interface Lead {
  id: string
  companyName: string
  companyId: string | null
  contactId: string | null
  contactName: string | null
  greeting: string
  phone: string | null
  angle: string
  segment: string | null
  fitScore: number | null
  source: string | null
  channel: string | null
  workFirst: boolean
  doNotEmail: boolean
  stage: string
  isInbound: boolean
}

type FilterKey = 'all' | 'inbound' | 'open' | 'done'

// ============================================================================
// HELPERS
// ============================================================================
const telHref = (p: string | null): string => {
  const first = (p || '').split('/')[0]
  return 'tel:' + first.replace(/[^0-9+]/g, '')
}
const firstWord = (s: string | null | undefined): string => (s || '').trim().split(/\s+/)[0] || ''
const dneFromChannel = (channel: string | null): boolean =>
  /do not email|phone only|email bounces|call only/i.test(channel || '')

function greetingForTime(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// A real follow-up date (YYYY-MM-DD) `days` from now, for deals.next_touch.
const isoDatePlus = (days: number): string =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

// ============================================================================
// MERGE pipeline (name/phone) + deals (canonical fields) → Lead[]
// ============================================================================
function buildLeads(pipeline: any, dealsResp: any): Lead[] {
  const stages: PipelineDeal[] = Array.isArray(pipeline?.stages)
    ? pipeline.stages.flatMap((s: any) => (Array.isArray(s?.deals) ? s.deals : []))
    : []

  const rawDeals: RawDeal[] = Array.isArray(dealsResp?.deals) ? dealsResp.deals : []
  const byId = new Map<string, RawDeal>()
  for (const d of rawDeals) byId.set(d.id, d)

  return stages.map((pd): Lead => {
    const enrich = byId.get(pd.id)

    const workFirst = pd.workFirst ?? pd.work_first ?? enrich?.work_first ?? false
    const angle = pd.angle ?? enrich?.angle ?? ''
    const segment = pd.segment ?? enrich?.segment ?? null
    const fitScore = pd.fitScore ?? pd.fit_score ?? enrich?.fit_score ?? null
    const source = pd.source ?? enrich?.source ?? null
    const channel = pd.channel ?? enrich?.channel ?? null
    const contactId = pd.contactId ?? pd.contact_id ?? enrich?.contact_id ?? null

    const contacts = pd.company?.contacts || []
    const contact =
      (contactId ? contacts.find((c) => c.id === contactId) : undefined) ||
      pd.decisionMaker ||
      contacts[0] ||
      null

    const doNotEmail = contact?.doNotEmail === true || dneFromChannel(channel)

    const isInbound = pd.stage === 'inbound' || (!!source && source !== LIST_SOURCE)

    return {
      id: pd.id,
      companyName: pd.company?.name || 'Unknown company',
      companyId: pd.company?.id ?? null,
      contactId: contact?.id ?? null,
      contactName: contact?.name ?? null,
      greeting: firstWord(contact?.greetingName || contact?.name),
      phone: contact?.phone ?? null,
      angle: angle || '',
      segment,
      fitScore,
      source,
      channel,
      workFirst: !!workFirst,
      doNotEmail,
      stage: pd.stage,
      isInbound,
    }
  })
}

// ============================================================================
// SHARED CSS (media queries + transitions — inline styles can't express these)
// ============================================================================
const COCKPIT_CSS = `
.rc-root{min-height:100%;background:${BG};color:${TEXT};font-size:15px;line-height:1.5;}
.rc-layout{display:grid;grid-template-columns:1fr;gap:0;}
.rc-rail{display:none;}
.rc-chips{display:flex;gap:6px;padding:12px 14px 4px;overflow-x:auto;}
.rc-chips::-webkit-scrollbar{display:none;}
.rc-detail-pane{display:none;}
.rc-queue{padding:8px 14px 120px;}
.rc-scroll::-webkit-scrollbar{width:7px;height:7px;}
.rc-scroll::-webkit-scrollbar-thumb{background:${LINE2};border-radius:4px;}
.rc-scroll::-webkit-scrollbar-track{background:transparent;}
.rc-card{transition:border-color .15s ease, background .15s ease;}
.rc-card:hover{border-color:${LINE2};}
.rc-card.sel{border-color:${ACCENT};}
.rc-actionbtn{transition:filter .15s ease, background .15s ease;}
.rc-actionbtn:hover{filter:brightness(1.08);}
.rc-scrim{position:fixed;inset:0;background:rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .2s ease;z-index:40;}
.rc-scrim.on{opacity:1;pointer-events:auto;}
.rc-sheet{position:fixed;left:0;right:0;bottom:0;max-height:88vh;overflow-y:auto;background:${SURFACE};border-radius:22px 22px 0 0;z-index:50;transform:translateY(100%);transition:transform .28s cubic-bezier(.16,1,.3,1);border-top:1px solid ${LINE2};box-shadow:0 -8px 30px rgba(0,0,0,.45);}
.rc-sheet.on{transform:translateY(0);}
@media (min-width:960px){
  .rc-layout{grid-template-columns:76px minmax(360px,460px) 1fr;height:100vh;}
  .rc-rail{display:flex;}
  .rc-chips{display:none;}
  .rc-queue{overflow-y:auto;height:100vh;padding:8px 16px 60px;}
  .rc-detail-pane{display:flex;overflow-y:auto;height:100vh;border-left:1px solid ${LINE};}
  .rc-sheet,.rc-scrim{display:none !important;}
  .rc-topbar{border-right:1px solid ${LINE};}
}
@media (prefers-reduced-motion:reduce){.rc-sheet,.rc-scrim,.rc-card,.rc-actionbtn{transition:none !important;}}
`

// ============================================================================
// SMALL PRESENTATIONAL PIECES
// ============================================================================
function Chip({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      letterSpacing: '.02em', color, background: bg, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function LeadCard({ lead, selected, done, onOpen }: {
  lead: Lead; selected: boolean; done: string | undefined; onOpen: () => void
}) {
  return (
    <div
      className={`rc-card${selected ? ' sel' : ''}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      style={{
        background: SURFACE,
        border: `1px solid ${selected ? ACCENT : LINE}`,
        borderLeft: `3px solid ${lead.isInbound ? INBOUND : (done ? WON : LINE2)}`,
        borderRadius: 16, padding: '14px 14px 12px', marginBottom: 10,
        cursor: 'pointer', opacity: done ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16.5, letterSpacing: '-.01em', color: TEXT }}>{lead.companyName}</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 1, fontFamily: 'monospace' }}>
            {[lead.greeting, lead.phone].filter(Boolean).join(' · ') || 'No contact on file'}
          </div>
        </div>
        <ChevronRight size={16} style={{ color: FAINT, flexShrink: 0, marginTop: 2 }} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
        {lead.isInbound
          ? <Chip color={INBOUND} bg={`${INBOUND}26`}>NEW · WEBSITE</Chip>
          : lead.workFirst ? <Chip color={ACCENT} bg={`${ACCENT}26`}>WORK FIRST</Chip> : null}
        {lead.doNotEmail && <Chip color={DNE} bg={`${DNE}24`}>DO NOT EMAIL</Chip>}
        {lead.segment && <Chip color={MUTED} bg={SURFACE2}>{lead.segment}</Chip>}
        {lead.fitScore != null && <Chip color={MUTED} bg={SURFACE2}>{`FIT ${lead.fitScore}`}</Chip>}
      </div>

      {lead.angle && (
        <div style={{ margin: '10px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
          {!lead.isInbound && <b style={{ color: TEXT, fontWeight: 600 }}>Why call: </b>}
          {lead.angle}
        </div>
      )}

      {done ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: WON, fontSize: 13, fontWeight: 700, marginTop: 12 }}>
          <CheckCircle2 size={15} /> {done}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
          <a
            className="rc-actionbtn"
            href={lead.phone ? telHref(lead.phone) : undefined}
            onClick={(e) => e.stopPropagation()}
            aria-disabled={!lead.phone}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 46, borderRadius: 12, textDecoration: 'none',
              background: lead.phone ? CALL : SURFACE2,
              color: lead.phone ? CALL_INK : FAINT,
              border: lead.phone ? 'none' : `1px solid ${LINE2}`,
              fontWeight: 800, fontSize: 15, pointerEvents: lead.phone ? 'auto' : 'none',
            }}
          >
            <PhoneCall size={18} /> {lead.phone ? `Call ${lead.greeting || ''}`.trim() : 'No number'}
          </a>
          <button
            className="rc-actionbtn"
            onClick={(e) => { e.stopPropagation(); onOpen() }}
            style={{
              minHeight: 46, padding: '0 15px', borderRadius: 12, background: SURFACE2,
              border: `1px solid ${LINE2}`, color: TEXT, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >Log</button>
        </div>
      )}
    </div>
  )
}

function DetailRow({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '11px 0', borderBottom: `1px solid ${LINE}`, fontSize: 14 }}>
      <span style={{ color: FAINT, width: 96, flexShrink: 0, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '.04em', paddingTop: 1 }}>{k}</span>
      <span style={{ color: TEXT, flex: 1 }}>{children}</span>
    </div>
  )
}

// Each outcome maps to a REAL deal PATCH: the outcome text is persisted to
// deals.outcome, an optional stage advance, and a next_touch follow-up date.
// nextTouchDays === null clears next_touch (a won deal needs no follow-up).
const OUTCOMES: {
  label: string
  value: string
  stage?: string
  nextTouchDays: number | null
  won?: boolean
}[] = [
  { label: 'Interested', value: 'Interested · callback', stage: 'contacted', nextTouchDays: 3 },
  { label: 'No answer', value: 'No answer', nextTouchDays: 1 },
  { label: 'Not now', value: 'Not now', nextTouchDays: 30 },
  { label: 'Won → client', value: 'Won', stage: 'closed_won', nextTouchDays: null, won: true },
]

// ============================================================================
// PAGE
// ============================================================================
export default function TodayCockpitPage() {
  const { user } = useCRM()

  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [done, setDone] = useState<Record<string, string>>({})

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const LS = `relay-cockpit-done:${todayKey}`

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(LS) || '{}')) } catch { /* private mode / disabled */ }
  }, [LS])

  const markDone = useCallback((id: string, outcome: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: outcome }
      try { localStorage.setItem(LS, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [LS])

  // ── Live data ────────────────────────────────────────────────────────────
  const pipelineQuery = useQuery({
    queryKey: ['cockpit', 'pipeline'],
    queryFn: () => crmFetch<any>('/api/crm/pipeline?includeClosed=true'),
  })
  const dealsQuery = useQuery({
    queryKey: ['cockpit', 'deals'],
    queryFn: () => crmFetch<any>('/api/crm/deals?limit=50'),
  })

  const isLoading = pipelineQuery.isLoading || dealsQuery.isLoading
  const isError = pipelineQuery.isError || dealsQuery.isError
  const error = (pipelineQuery.error || dealsQuery.error) as ApiError | Error | null
  const refetchAll = useCallback(() => {
    pipelineQuery.refetch()
    dealsQuery.refetch()
  }, [pipelineQuery, dealsQuery])

  const leads = useMemo(
    () => buildLeads(pipelineQuery.data, dealsQuery.data),
    [pipelineQuery.data, dealsQuery.data],
  )

  const inbound = useMemo(() => leads.filter((l) => l.isInbound), [leads])
  const callQueue = useMemo(
    () => leads.filter((l) => !l.isInbound && (l.workFirst || l.stage === 'new_lead')),
    [leads],
  )

  // Auto-select the first lead for the desktop pane (does not open the sheet).
  useEffect(() => {
    if (selectedId) return
    const first = inbound[0] || callQueue[0]
    if (first) setSelectedId(first.id)
  }, [selectedId, inbound, callQueue])

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) || null,
    [leads, selectedId],
  )

  const openLead = useCallback((id: string) => {
    setSelectedId(id)
    setSheetOpen(true)
  }, [])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const toCall = callQueue.filter((l) => !done[l.id]).length
  const newInbound = inbound.filter((l) => !done[l.id]).length
  const doneCount = Object.keys(done).length

  // ── Visible sections per filter ─────────────────────────────────────────────
  const visibleInbound = filter === 'all' || filter === 'inbound'
    ? (filter === 'inbound' ? inbound : inbound.filter((l) => !done[l.id]).concat(inbound.filter((l) => done[l.id])))
    : []
  const visibleCalls = filter === 'all'
    ? callQueue
    : filter === 'open'
      ? callQueue.filter((l) => !done[l.id])
      : []
  const visibleDone = filter === 'done'
    ? leads.filter((l) => done[l.id])
    : []

  // ── Rail / chip config ──────────────────────────────────────────────────────
  const sections: { key: FilterKey; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'Today', icon: Sun },
    { key: 'inbound', label: 'Inbox', icon: Inbox },
    { key: 'open', label: 'To call', icon: Phone },
    { key: 'done', label: 'Done', icon: CheckCircle2 },
  ]

  const hasAnyLead = leads.length > 0
  const nothingVisible = visibleInbound.length === 0 && visibleCalls.length === 0 && visibleDone.length === 0

  // ── Pre-mount / loading / error shells ──────────────────────────────────────
  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: BG }} />
  }

  return (
    <div className="rc-root">
      <style dangerouslySetInnerHTML={{ __html: COCKPIT_CSS }} />

      <div className="rc-layout">
        {/* ── Desktop section rail ── */}
        <nav className="rc-rail" aria-label="Cockpit sections" style={{
          flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 0',
          background: APP, borderRight: `1px solid ${LINE}`,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: ACCENT, color: ACCENT_INK, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, marginBottom: 10 }}>R</div>
          {sections.map((s) => {
            const active = filter === s.key
            return (
              <button key={s.key} onClick={() => setFilter(s.key)} title={s.label}
                style={{
                  width: 56, height: 52, borderRadius: 12, border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: active ? `${ACCENT}18` : 'transparent',
                  color: active ? ACCENT : FAINT, fontSize: 9.5, fontWeight: 700, fontFamily: 'inherit',
                }}>
                <s.icon size={19} />
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* ── Queue column ── */}
        <div className="rc-queue rc-scroll">
          {/* Top bar */}
          <div style={{ padding: '10px 4px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: ACCENT, color: ACCENT_INK, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14 }}>R</div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em' }}>Relay</span>
            </div>
            <div style={{ margin: '12px 0 2px', fontSize: 13, color: MUTED }}>
              {greetingForTime()}{user?.name ? `, ${firstWord(user.name)}` : ''}.{' '}
              <b style={{ color: TEXT, fontWeight: 700 }}>{toCall} {toCall === 1 ? 'firm' : 'firms'}</b> to work today.
            </div>

            {/* Stat row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[
                { n: toCall, l: 'To call', c: ACCENT },
                { n: newInbound, l: 'New inbound', c: INBOUND },
                { n: doneCount, l: 'Done today', c: WON },
              ].map((s) => (
                <div key={s.l} style={{ flex: 1, background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, padding: '9px 11px' }}>
                  <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.n}</div>
                  <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3, letterSpacing: '.02em', textTransform: 'uppercase' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile filter chips */}
          <div className="rc-chips">
            {sections.map((s) => {
              const active = filter === s.key
              return (
                <button key={s.key} onClick={() => setFilter(s.key)}
                  aria-pressed={active}
                  style={{
                    whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, padding: '7px 13px', borderRadius: 99,
                    border: `1px solid ${active ? ACCENT : LINE}`, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? ACCENT : SURFACE, color: active ? ACCENT_INK : MUTED,
                  }}>{s.label}</button>
              )
            })}
          </div>

          {/* States */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: FAINT, padding: '48px 20px' }}>
              <Loader2 size={22} className="rc-spin" style={{ animation: 'rc-spin 1s linear infinite' }} />
              <style dangerouslySetInnerHTML={{ __html: '@keyframes rc-spin{to{transform:rotate(360deg)}}' }} />
              Loading today's queue…
            </div>
          ) : isError ? (
            <div style={{ textAlign: 'center', padding: '44px 20px', color: MUTED }}>
              <AlertTriangle size={26} style={{ color: DNE, marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Couldn't load your queue</div>
              <div style={{ fontSize: 13, margin: '6px 0 16px' }}>
                {error instanceof ApiError && error.status === 401 ? 'Your session expired — sign in again.' : (error?.message || 'Something went wrong.')}
              </div>
              <button onClick={refetchAll} className="rc-actionbtn" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                border: 'none', background: ACCENT, color: ACCENT_INK, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>
                <RefreshCw size={15} /> Retry
              </button>
            </div>
          ) : !hasAnyLead ? (
            <div style={{ textAlign: 'center', padding: '52px 24px', color: FAINT }}>
              <Building2 size={28} style={{ color: LINE2, marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: MUTED }}>No leads yet</div>
              <div style={{ fontSize: 13.5, marginTop: 6 }}>Import your list to start working the queue.</div>
            </div>
          ) : nothingVisible ? (
            <div style={{ textAlign: 'center', padding: '44px 24px', color: FAINT, fontSize: 14 }}>Nothing here right now.</div>
          ) : (
            <>
              {visibleInbound.length > 0 && (
                <>
                  <SectionHead>New inbound · reply fast</SectionHead>
                  {visibleInbound.map((l) => (
                    <LeadCard key={l.id} lead={l} selected={l.id === selectedId} done={done[l.id]} onOpen={() => openLead(l.id)} />
                  ))}
                </>
              )}
              {visibleCalls.length > 0 && (
                <>
                  <SectionHead>{`Call queue · work-first ${callQueue.length}`}</SectionHead>
                  {visibleCalls.map((l) => (
                    <LeadCard key={l.id} lead={l} selected={l.id === selectedId} done={done[l.id]} onOpen={() => openLead(l.id)} />
                  ))}
                </>
              )}
              {visibleDone.length > 0 && (
                <>
                  <SectionHead>Logged today</SectionHead>
                  {visibleDone.map((l) => (
                    <LeadCard key={l.id} lead={l} selected={l.id === selectedId} done={done[l.id]} onOpen={() => openLead(l.id)} />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Desktop persistent detail pane ── */}
        <div className="rc-detail-pane rc-scroll" style={{ background: BG }}>
          {selected ? (
            <LeadDetail key={selected.id} lead={selected} inSheet={false} done={done[selected.id]} onLogged={markDone} onClose={() => setSheetOpen(false)} />
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: FAINT, padding: 40 }}>
              <ListChecks size={26} style={{ color: LINE2, marginBottom: 10 }} />
              <div style={{ fontSize: 14 }}>Pick a lead from the queue.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile bottom sheet ── */}
      <div className={`rc-scrim${sheetOpen ? ' on' : ''}`} onClick={() => setSheetOpen(false)} />
      <div className={`rc-sheet${sheetOpen && selected ? ' on' : ''}`} role="dialog" aria-modal="true">
        {selected && <LeadDetail key={selected.id} lead={selected} inSheet done={done[selected.id]} onLogged={markDone} onClose={() => setSheetOpen(false)} />}
      </div>
    </div>
  )
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: FAINT, margin: '16px 4px 8px', fontWeight: 700 }}>
      {children}
    </div>
  )
}

// ============================================================================
// LEAD DETAIL — the lead-detail actions, each wired to a REAL endpoint.
// ----------------------------------------------------------------------------
//   Write note   -> POST  /api/crm/notes    { dealId, body }
//   Log outcome  -> PATCH /api/crm/deals/:id { outcome, stage?, nextTouch }
//   Book demo    -> PATCH /api/crm/deals/:id { demoAt, stage:'demo_booked', nextTouch }
//   New proposal -> POST  /api/crm/proposals (draft) then open /crm/proposals
//   New invoice  -> POST  /api/crm/invoices  (draft) then open /crm/invoices
// Every action renders a real pending/success/error state — no fake confirmations.
// The agent Draft / Prep buttons are honest, clearly-labelled stubs (Wave C).
// do_not_email is respected: no email-drafting affordance for those leads.
// ============================================================================
function LeadDetail({
  lead, inSheet, done, onLogged, onClose,
}: {
  lead: Lead
  inSheet: boolean
  done: string | undefined
  onLogged: (id: string, outcome: string) => void
  onClose: () => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [panel, setPanel] = useState<'none' | 'note' | 'demo'>('none')
  const [noteText, setNoteText] = useState('')
  const [demoSlot, setDemoSlot] = useState('')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cockpit'] })

  // Log outcome -> the deal is the source of truth (outcome + stage + next_touch).
  const logMutation = useMutation({
    mutationFn: async (o: (typeof OUTCOMES)[number]) => {
      await crmFetch(`/api/crm/deals/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          outcome: o.value,
          ...(o.stage ? { stage: o.stage } : {}),
          nextTouch: o.nextTouchDays == null ? null : isoDatePlus(o.nextTouchDays),
        }),
      })
      // Secondary, best-effort: record the touch in the deal activity feed. The
      // deal outcome is already persisted above, so a failure here is not fatal.
      try {
        await crmFetch('/api/crm/call', {
          method: 'POST',
          body: JSON.stringify({ dealId: lead.id, contactId: lead.contactId || undefined, outcome: o.value, subject: `Call — ${o.value}` }),
        })
      } catch { /* activity log is secondary */ }
    },
    onSuccess: (_d, o) => { onLogged(lead.id, o.value); invalidate(); onClose() },
  })

  // Write note -> POST /api/crm/notes { dealId, body }
  const noteMutation = useMutation({
    mutationFn: (bodyText: string) =>
      crmFetch('/api/crm/notes', { method: 'POST', body: JSON.stringify({ dealId: lead.id, body: bodyText }) }),
    onSuccess: () => { setNoteText(''); setPanel('none'); invalidate() },
  })

  // Book demo -> persist the chosen slot on the deal (real Cal.com booking is Wave C).
  const demoMutation = useMutation({
    mutationFn: (slot: string) =>
      crmFetch(`/api/crm/deals/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ demoAt: new Date(slot).toISOString(), stage: 'demo_booked', nextTouch: slot.slice(0, 10) }),
      }),
    onSuccess: () => { onLogged(lead.id, 'Demo booked'); setPanel('none'); invalidate(); onClose() },
  })

  // New proposal -> create a draft for this deal, then open the proposals surface.
  const proposalMutation = useMutation({
    mutationFn: () =>
      crmFetch<{ proposal: { id: string } }>('/api/crm/proposals', {
        method: 'POST',
        body: JSON.stringify({
          title: `Proposal — ${lead.companyName}`,
          dealId: lead.id,
          companyId: lead.companyId || undefined,
          contactId: lead.contactId || undefined,
        }),
      }),
    onSuccess: () => { router.push('/crm/proposals') },
  })

  // New invoice -> create a draft for this deal, then open the invoices surface.
  const invoiceMutation = useMutation({
    mutationFn: () =>
      crmFetch<{ invoice: { id: string } }>('/api/crm/invoices', {
        method: 'POST',
        body: JSON.stringify({
          dealId: lead.id,
          companyId: lead.companyId || undefined,
          contactId: lead.contactId || undefined,
          lineItems: [],
        }),
      }),
    onSuccess: () => { router.push('/crm/invoices') },
  })

  // Drive folder -> POST /api/crm/drive/folder { company }. When Drive is
  // configured the route create-or-gets the per-lead folder and returns its
  // link (opened in a new tab); when it is not, the route returns an honest
  // { ok:false, reason:'Drive not connected' } which we surface below - never a
  // fabricated link.
  const driveMutation = useMutation({
    mutationFn: () =>
      crmFetch<{ ok: boolean; url?: string; reason?: string }>('/api/crm/drive/folder', {
        method: 'POST',
        body: JSON.stringify({ company: lead.companyName }),
      }),
    onSuccess: (res) => {
      if (res.ok && res.url) window.open(res.url, '_blank', 'noopener,noreferrer')
    },
  })

  const actBtn = (disabled: boolean): React.CSSProperties => ({
    flex: 1, minWidth: 'calc(50% - 4px)', minHeight: 46, borderRadius: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    border: `1px solid ${LINE2}`, background: SURFACE2, color: TEXT,
    fontWeight: 700, fontSize: 13.5, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
  })
  const stubBtn: React.CSSProperties = {
    flex: 1, minWidth: 'calc(50% - 4px)', minHeight: 44, borderRadius: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    border: `1px dashed ${LINE2}`, background: 'transparent', color: FAINT,
    fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'not-allowed',
  }
  const errLine = (msg: string) => (
    <div style={{ color: DNE, fontSize: 12.5, marginTop: 8 }}>{msg}</div>
  )

  return (
    <div style={{ padding: inSheet ? '8px 18px 28px' : '20px 22px 40px', width: '100%' }}>
      {inSheet && <div style={{ width: 40, height: 4, borderRadius: 99, background: LINE2, margin: '8px auto 14px' }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', margin: 0, color: TEXT }}>{lead.companyName}</h2>
          <div style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>
            {lead.greeting || 'Contact'}{lead.phone ? ' · ' : ''}
            {lead.phone && (
              <a href={telHref(lead.phone)} style={{ color: ACCENT, textDecoration: 'none', fontFamily: 'monospace' }}>{lead.phone}</a>
            )}
          </div>
        </div>
        {inSheet && (
          <button onClick={onClose} aria-label="Close"
            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${LINE}`, background: SURFACE2, color: TEXT, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '14px 0 4px' }}>
        {lead.isInbound
          ? <Chip color={INBOUND} bg={`${INBOUND}26`}>NEW · WEBSITE</Chip>
          : lead.workFirst ? <Chip color={ACCENT} bg={`${ACCENT}26`}>WORK FIRST</Chip> : null}
        {lead.doNotEmail && <Chip color={DNE} bg={`${DNE}24`}>DO NOT EMAIL</Chip>}
        {lead.segment && <Chip color={MUTED} bg={SURFACE2}>{lead.segment}</Chip>}
        {lead.fitScore != null && <Chip color={MUTED} bg={SURFACE2}>{`FIT ${lead.fitScore}`}</Chip>}
      </div>

      {/* Primary: tap-to-call */}
      <a
        className="rc-actionbtn"
        href={lead.phone ? telHref(lead.phone) : undefined}
        aria-disabled={!lead.phone}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          minHeight: 50, borderRadius: 12, margin: '14px 0 6px', textDecoration: 'none',
          background: lead.phone ? CALL : SURFACE2, color: lead.phone ? CALL_INK : FAINT,
          border: lead.phone ? 'none' : `1px solid ${LINE2}`,
          fontWeight: 800, fontSize: 16, pointerEvents: lead.phone ? 'auto' : 'none',
        }}
      >
        <PhoneCall size={19} /> {lead.phone ? `Call ${lead.greeting || 'contact'}` : 'No number on file'}
      </a>

      {/* Detail rows */}
      <div style={{ marginTop: 10 }}>
        {lead.doNotEmail && (
          <DetailRow k="Email">
            <span style={{ color: DNE, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <PhoneOff size={14} /> Do not email · call only
            </span>
          </DetailRow>
        )}
        {lead.angle && <DetailRow k="Why call">{lead.angle}</DetailRow>}
        {lead.segment && <DetailRow k="Segment">{lead.segment}</DetailRow>}
        {lead.fitScore != null && <DetailRow k="Fit">{lead.fitScore}</DetailRow>}
        {lead.channel && <DetailRow k="Channel">{lead.channel}</DetailRow>}
        {lead.source && <DetailRow k="Source">{lead.source}</DetailRow>}
      </div>

      {/* Log the outcome (real: PATCH /api/crm/deals/:id) */}
      {done ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: WON, fontSize: 14, fontWeight: 700, marginTop: 18 }}>
          <CheckCircle2 size={17} /> Logged today · {done}
        </div>
      ) : (
        <>
          <SectionHead>Log the outcome</SectionHead>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {OUTCOMES.map((o) => (
              <button
                key={o.value}
                disabled={logMutation.isPending}
                onClick={() => logMutation.mutate(o)}
                style={{
                  flex: 1, minWidth: 'calc(50% - 4px)', minHeight: 44, borderRadius: 11, cursor: 'pointer',
                  border: `1px solid ${o.won ? WON : LINE2}`,
                  background: o.won ? `${WON}22` : SURFACE2,
                  color: o.won ? WON : TEXT, fontWeight: 700, fontSize: 13.5,
                  opacity: logMutation.isPending ? 0.6 : 1,
                }}
              >{o.label}</button>
            ))}
          </div>
          {logMutation.isError && errLine('Could not log that. Check your connection and try again.')}
        </>
      )}

      {/* Actions — each wired to a real endpoint */}
      <SectionHead>Actions</SectionHead>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button style={actBtn(false)} aria-expanded={panel === 'note'}
          onClick={() => setPanel(panel === 'note' ? 'none' : 'note')}>
          <StickyNote size={16} /> Write note
        </button>
        <button style={actBtn(false)} aria-expanded={panel === 'demo'}
          onClick={() => setPanel(panel === 'demo' ? 'none' : 'demo')}>
          <CalendarClock size={16} /> Book demo
        </button>
        <button style={actBtn(proposalMutation.isPending)} disabled={proposalMutation.isPending}
          onClick={() => proposalMutation.mutate()}>
          <FileText size={16} /> {proposalMutation.isPending ? 'Creating…' : 'New proposal'}
        </button>
        <button style={actBtn(invoiceMutation.isPending)} disabled={invoiceMutation.isPending}
          onClick={() => invoiceMutation.mutate()}>
          <Receipt size={16} /> {invoiceMutation.isPending ? 'Creating…' : 'New invoice'}
        </button>
        <button style={actBtn(driveMutation.isPending)} disabled={driveMutation.isPending}
          onClick={() => driveMutation.mutate()}>
          <FolderOpen size={16} /> {driveMutation.isPending ? 'Opening…' : 'Drive folder'}
        </button>
      </div>
      {proposalMutation.isError && errLine('Could not create the proposal. Try again.')}
      {invoiceMutation.isError && errLine('Could not create the invoice. Try again.')}
      {driveMutation.isError && errLine('Could not reach Drive. Try again.')}
      {driveMutation.data && !driveMutation.data.ok && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: FAINT, fontSize: 12.5, marginTop: 8 }}>
          <FolderOpen size={14} /> {driveMutation.data.reason || 'Drive not connected'}
        </div>
      )}
      {noteMutation.isSuccess && panel !== 'note' && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: WON, fontSize: 12.5, marginTop: 8 }}>
          <CheckCircle2 size={14} /> Note saved
        </div>
      )}

      {/* Write-note panel */}
      {panel === 'note' && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note about this lead…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 72,
              background: APP, color: TEXT, border: `1px solid ${LINE2}`, borderRadius: 10,
              padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              disabled={!noteText.trim() || noteMutation.isPending}
              onClick={() => noteMutation.mutate(noteText.trim())}
              style={{
                minHeight: 42, padding: '0 18px', borderRadius: 10, border: 'none',
                background: ACCENT, color: ACCENT_INK, fontWeight: 800, fontSize: 14,
                cursor: (!noteText.trim() || noteMutation.isPending) ? 'not-allowed' : 'pointer',
                opacity: (!noteText.trim() || noteMutation.isPending) ? 0.6 : 1,
              }}
            >{noteMutation.isPending ? 'Saving…' : 'Save note'}</button>
          </div>
          {noteMutation.isError && errLine('Could not save the note. Try again.')}
        </div>
      )}

      {/* Book-demo panel */}
      {panel === 'demo' && (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'block', fontSize: 12.5, color: MUTED, marginBottom: 6 }}>
            Pick a demo slot
          </label>
          <input
            type="datetime-local"
            value={demoSlot}
            onChange={(e) => setDemoSlot(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
              background: APP, color: TEXT, border: `1px solid ${LINE2}`, borderRadius: 10,
              padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              disabled={!demoSlot || demoMutation.isPending}
              onClick={() => demoMutation.mutate(demoSlot)}
              style={{
                minHeight: 42, padding: '0 18px', borderRadius: 10, border: 'none',
                background: ACCENT, color: ACCENT_INK, fontWeight: 800, fontSize: 14,
                cursor: (!demoSlot || demoMutation.isPending) ? 'not-allowed' : 'pointer',
                opacity: (!demoSlot || demoMutation.isPending) ? 0.6 : 1,
              }}
            >{demoMutation.isPending ? 'Booking…' : 'Confirm demo slot'}</button>
          </div>
          <div style={{ fontSize: 11.5, color: FAINT, marginTop: 8 }}>
            Persists the slot on the deal. A live Cal.com booking arrives in Wave C.
          </div>
          {demoMutation.isError && errLine('Could not book that slot. Try again.')}
        </div>
      )}

      {/* Agent assist — clearly-labelled stubs until Wave C grounds the agent */}
      <SectionHead>Agent assist</SectionHead>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {!lead.doNotEmail && (
          <button style={stubBtn} disabled title="Available when the agent is grounded (Wave C)">
            <Mail size={15} /> Draft email
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', color: FAINT, border: `1px solid ${LINE2}`, borderRadius: 5, padding: '1px 5px', marginLeft: 2 }}>SOON</span>
          </button>
        )}
        <button style={stubBtn} disabled title="Available when the agent is grounded (Wave C)">
          <Sparkles size={15} /> Prep call
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', color: FAINT, border: `1px solid ${LINE2}`, borderRadius: 5, padding: '1px 5px', marginLeft: 2 }}>SOON</span>
        </button>
      </div>
    </div>
  )
}
