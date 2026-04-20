'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Zap,
  Globe,
  Shield,
  Phone,
  Mail,
  User,
  Euro,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Bot,
  Sun,
  Package,
  ChevronRight,
  ExternalLink,
  BarChart3,
  Pencil,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Send,
  CreditCard,
  Receipt,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

// ============================================================================
// DESIGN SYSTEM
// ============================================================================
const DS = {
  BG_PAGE: '#080808',
  BG_CENTER: '#0C0C0C',
  CARD: '#141414',
  ELEVATED: '#1A1A1A',
  INPUT: '#0E0E0E',
  BORDER: 'rgba(255,255,255,0.05)',
  BORDER_HOVER: 'rgba(255,255,255,0.10)',
  YELLOW: '#F3D840',
  GREEN: '#10B981',
  RED: '#F87171',
  BLUE: '#60A5FA',
  PURPLE: '#A78BFA',
  PINK: '#F472B6',
  ORANGE: '#FB923C',
  TEXT: '#FFFFFF',
  TEXT2: 'rgba(255,255,255,0.50)',
  TEXT3: 'rgba(255,255,255,0.30)',
} as const

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active Client', color: DS.GREEN, bg: 'rgba(16,185,129,0.10)' },
  prospect: { label: 'Prospect', color: DS.YELLOW, bg: 'rgba(243,216,64,0.10)' },
  churned: { label: 'Churned', color: DS.RED, bg: 'rgba(248,113,113,0.10)' },
  inactive: { label: 'Inactive', color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
}

const stageCfg: Record<string, { label: string; color: string }> = {
  new_lead: { label: 'New Lead', color: '#60A5FA' },
  contacted: { label: 'Contacted', color: '#818CF8' },
  discovery_call: { label: 'Discovery', color: '#A78BFA' },
  demo_booked: { label: 'Demo Booked', color: '#F472B6' },
  demo_done: { label: 'Demo Done', color: '#FB923C' },
  proposal_sent: { label: 'Proposal Sent', color: '#FBBF24' },
  negotiation: { label: 'Negotiation', color: '#34D399' },
  closed_won: { label: 'Closed Won', color: DS.GREEN },
  closed_lost: { label: 'Closed Lost', color: DS.RED },
}

const actIcons: Record<string, { icon: typeof Phone; color: string }> = {
  call: { icon: Phone, color: DS.GREEN },
  email: { icon: Mail, color: DS.BLUE },
  demo: { icon: Sparkles, color: DS.PURPLE },
  proposal: { icon: Package, color: DS.ORANGE },
  note: { icon: User, color: '#9CA3AF' },
  meeting: { icon: Users, color: DS.PINK },
}

// ============================================================================
// HELPERS
// ============================================================================
const fmt = (v: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

const fmtCompact = (v: number) => {
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`
  return fmt(v)
}

// Input style
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: `1px solid ${DS.BORDER}`, background: DS.INPUT, color: DS.TEXT,
  fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
}

function getAvatarColor(name: string): string {
  const colors = ['#F3D840', '#60A5FA', '#A78BFA', '#F472B6', '#34D399', '#FB923C', '#818CF8', '#FBBF24']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ============================================================================
// INJECT CSS ANIMATIONS
// ============================================================================
function useDetailAnimations() {
  useEffect(() => {
    const id = 'company-detail-anim-styles'
    if (document.getElementById(id)) return
    const s = document.createElement('style')
    s.id = id
    s.textContent = `
      @keyframes cd-fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes cd-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes cd-scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      @keyframes cd-progressGrow { from { width: 0; } }
      @keyframes cd-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      .cd-animate-in { animation: cd-fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
      .cd-fade-in { animation: cd-fadeIn 0.35s ease-out both; }
      .cd-scale-in { animation: cd-scaleIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }
      .cd-dialog-backdrop { animation: cd-fadeIn 0.2s ease-out both; }
      .cd-dialog-card { animation: cd-scaleIn 0.25s ease-out both; }
      .cd-shimmer {
        background: linear-gradient(90deg, #141414 25%, rgba(255,255,255,0.03) 50%, #141414 75%);
        background-size: 200% 100%;
        animation: cd-shimmer 1.5s ease-in-out infinite;
      }
      .company-detail-layout {
        grid-template-columns: 320px 1fr !important;
        gap: 20px !important;
      }
      .company-detail-layout .stats-row {
        grid-template-columns: repeat(4, 1fr) !important;
      }
      .company-detail-layout .content-grid {
        grid-template-columns: 1fr 1fr !important;
      }
      @media(max-width:1200px) {
        .company-detail-layout {
          grid-template-columns: 1fr !important;
        }
        .company-detail-layout .content-grid {
          grid-template-columns: 1fr !important;
        }
      }
      @media(max-width:768px) {
        .company-detail-layout .stats-row {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
    `
    document.head.appendChild(s)
  }, [])
}

// ============================================================================
// DIALOG OVERLAY
// ============================================================================
function DialogOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="cd-dialog-backdrop"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div
        className="cd-dialog-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 520, maxHeight: '90vh',
          overflow: 'auto', borderRadius: 20, background: DS.CARD,
          border: `1px solid ${DS.BORDER}`, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', padding: 28,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// SECTION CARD
// ============================================================================
function Section({ title, icon: Icon, accent, children, badge, right }: {
  title: string; icon: React.ElementType; accent?: string;
  children: React.ReactNode; badge?: string | number; right?: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const c = accent || DS.YELLOW
  return (
    <div
      className="cd-scale-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 18, background: DS.CARD,
        border: `1px solid ${hovered ? DS.BORDER_HOVER : DS.BORDER}`,
        overflow: 'hidden', position: 'relative',
        transition: 'border-color 0.25s',
      }}
    >
      {/* Top glow bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${c}35, transparent)` }} />
      {/* Header */}
      <div style={{
        padding: '16px 22px', borderBottom: `1px solid ${DS.BORDER}`,
        background: `linear-gradient(180deg, ${c}06 0%, transparent 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: `${c}12`, border: `1px solid ${c}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} style={{ color: c }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: DS.TEXT }}>{title}</span>
          {badge !== undefined && (
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.04,
              padding: '2px 8px', borderRadius: 5, background: `${c}10`, color: c,
            }}>
              {badge}
            </span>
          )}
        </div>
        {right}
      </div>
      <div style={{ padding: '16px 22px 22px' }}>{children}</div>
    </div>
  )
}

// ============================================================================
// STAT CARD
// ============================================================================
function StatCard({ icon: Icon, label, value, color, subtext, delay = 0 }: {
  icon: React.ElementType; label: string; value: string | number; color: string; subtext?: string; delay?: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="cd-scale-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 20px', borderRadius: 16,
        background: `linear-gradient(145deg, ${color}0C, ${color}04)`,
        border: `1px solid ${color}14`, position: 'relative', overflow: 'hidden',
        transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s',
        animationDelay: `${delay}s`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 12px 32px ${color}12` : 'none',
      }}>
      {/* Top glow */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }} />
      {/* Subtle gradient overlay */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${color}08, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: DS.TEXT3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: DS.TEXT, letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
            {value}
          </div>
          {subtext && <div style={{ fontSize: 11, color: DS.TEXT3, marginTop: 4 }}>{subtext}</div>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `linear-gradient(145deg, ${color}14, ${color}08)`,
          border: `1px solid ${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px ${color}08`,
        }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON LOADING
// ============================================================================
function SkeletonPage() {
  return (
    <div style={{
      background: `radial-gradient(ellipse at 50% 0%, ${DS.BG_CENTER} 0%, ${DS.BG_PAGE} 70%)`,
      minHeight: '100vh', padding: '24px clamp(16px, 4vw, 56px)',
    }}>
      {/* Accent bar */}
      <div style={{ height: 3, borderRadius: 2, marginBottom: 28,
        background: `linear-gradient(90deg, transparent, ${DS.YELLOW} 20%, ${DS.YELLOW}80 50%, transparent)` }} />
      {/* Back button */}
      <div className="cd-shimmer" style={{ width: 140, height: 32, borderRadius: 9, marginBottom: 24 }} />
      {/* Two-column layout skeleton */}
      <div className="company-detail-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Identity card */}
          <div className="cd-shimmer" style={{ borderRadius: 22, height: 460, border: `1px solid ${DS.BORDER}` }} />
          {/* Contacts */}
          <div className="cd-shimmer" style={{ borderRadius: 18, height: 220, border: `1px solid ${DS.BORDER}`, animationDelay: '0.12s' }} />
        </div>
        {/* Main content skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats row */}
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="cd-shimmer" style={{ height: 110, borderRadius: 16, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          {/* Deals */}
          <div className="cd-shimmer" style={{ borderRadius: 18, height: 320, border: `1px solid ${DS.BORDER}`, animationDelay: '0.2s' }} />
          {/* Activity */}
          <div className="cd-shimmer" style={{ borderRadius: 18, height: 280, border: `1px solid ${DS.BORDER}`, animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EDIT COMPANY DIALOG
// ============================================================================
function EditCompanyDialog({ open, onOpenChange, company }: {
  open: boolean; onOpenChange: (v: boolean) => void; company: Record<string, any> | null
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: company?.name || '', counties: company?.counties || '', seaiReg: company?.seaiReg || '',
    teamSize: company?.teamSize ? String(company.teamSize) : '',
    installsPerYear: company?.installsPerYear ? String(company.installsPerYear) : '',
    website: company?.website || '', status: company?.status || 'prospect', notes: company?.notes || '',
    logoUrl: company?.logoUrl || '',
  })

  useEffect(() => {
    if (open && company) {
      setForm({
        name: company.name || '', counties: company.counties || '', seaiReg: company.seaiReg || '',
        teamSize: company.teamSize ? String(company.teamSize) : '',
        installsPerYear: company.installsPerYear ? String(company.installsPerYear) : '',
        website: company.website || '', status: company.status || 'prospect', notes: company.notes || '',
        logoUrl: company.logoUrl || '',
      })
    }
  }, [open, company])

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string | number | null>) => {
      const res = await fetch(`/api/crm/companies/${company!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', company!.id] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company updated')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!company) return null
  return (
    <DialogOverlay open={open} onClose={() => onOpenChange(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: DS.TEXT }}>Edit Company</h2>
        <button onClick={() => onOpenChange(false)} aria-label="Close"
          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.TEXT2 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Company Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Counties</label>
            <input value={form.counties} onChange={(e) => setForm({ ...form, counties: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>SEAI Reg #</label>
            <input value={form.seaiReg} onChange={(e) => setForm({ ...form, seaiReg: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Team Size</label>
            <input type="number" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Installs / Year</label>
            <input type="number" value={form.installsPerYear} onChange={(e) => setForm({ ...form, installsPerYear: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Website</label>
          <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Logo URL</label>
          <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['prospect', 'active', 'inactive', 'churned'].map((s) => {
              const cfg = statusCfg[s]
              const isActive = form.status === s
              return (
                <button key={s} onClick={() => setForm({ ...form, status: s })}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${isActive ? cfg.color : DS.BORDER}`,
                    background: isActive ? cfg.bg : 'transparent',
                    color: isActive ? cfg.color : DS.TEXT3,
                    fontSize: 12, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', textTransform: 'capitalize',
                  }}>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <button
          onClick={() => {
            if (!form.name.trim()) { toast.error('Company name is required'); return }
            mutation.mutate({
              name: form.name, counties: form.counties || null, seaiReg: form.seaiReg || null,
              teamSize: form.teamSize ? parseInt(form.teamSize) : null,
              installsPerYear: form.installsPerYear ? parseInt(form.installsPerYear) : null,
              website: form.website || null, status: form.status, notes: form.notes || null,
              logoUrl: form.logoUrl || null,
            })
          }}
          disabled={mutation.isPending}
          style={{
            width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none',
            background: DS.YELLOW, color: '#1A1A1A', fontSize: 14, fontWeight: 700,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </DialogOverlay>
  )
}

// ============================================================================
// DELETE CONFIRMATION DIALOG
// ============================================================================
function DeleteCompanyDialog({ open, onOpenChange, companyName, onConfirm, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void; companyName: string; onConfirm: () => void; isPending: boolean
}) {
  return (
    <DialogOverlay open={open} onClose={() => onOpenChange(false)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trash2 size={20} style={{ color: DS.RED }} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: DS.TEXT, marginBottom: 2 }}>Delete Company</h2>
          <p style={{ fontSize: 13, color: DS.TEXT2 }}>This action cannot be undone.</p>
        </div>
      </div>
      <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.12)', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: DS.TEXT2 }}>
          Are you sure you want to delete <strong style={{ color: DS.TEXT }}>{companyName}</strong>?
          All associated contacts, deals, and activity data will be permanently removed.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => onOpenChange(false)} style={{
          flex: 1, padding: '10px 20px', borderRadius: 10, border: `1px solid ${DS.BORDER}`,
          background: 'transparent', color: DS.TEXT2, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>Cancel</button>
        <button onClick={onConfirm} disabled={isPending} style={{
          flex: 1, padding: '10px 20px', borderRadius: 10, border: 'none',
          background: DS.RED, color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isPending ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Trash2 size={14} />{isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </DialogOverlay>
  )
}

// ============================================================================
// ADD CONTACT DIALOG
// ============================================================================
function AddContactDialog({ open, onOpenChange, companyId }: {
  open: boolean; onOpenChange: (v: boolean) => void; companyId: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: '', isDecisionMaker: false, notes: '',
  })

  useEffect(() => {
    if (open) {
      setForm({ name: '', email: '', phone: '', role: '', isDecisionMaker: false, notes: '' })
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, companyId }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create contact') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
      toast.success('Contact added')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <DialogOverlay open={open} onClose={() => onOpenChange(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: DS.TEXT }}>Add Contact</h2>
        <button onClick={() => onOpenChange(false)} aria-label="Close"
          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.TEXT2 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Full Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Email *</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.ie" style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+353 87 123 4567" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Role</label>
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Managing Director" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any relevant notes..." style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setForm({ ...form, isDecisionMaker: !form.isDecisionMaker })}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', padding: 2,
              background: form.isDecisionMaker ? DS.YELLOW : 'rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 10,
              background: '#fff', transition: 'transform 0.2s',
              transform: form.isDecisionMaker ? 'translateX(20px)' : 'translateX(0)',
            }} />
          </button>
          <span style={{ fontSize: 13, color: DS.TEXT2, fontWeight: 500 }}>Decision Maker</span>
        </div>
        <button
          onClick={() => {
            if (!form.name.trim()) { toast.error('Name is required'); return }
            mutation.mutate(form)
          }}
          disabled={mutation.isPending}
          style={{
            width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none',
            background: DS.YELLOW, color: '#1A1A1A', fontSize: 14, fontWeight: 700,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Plus size={16} />{mutation.isPending ? 'Adding...' : 'Add Contact'}
        </button>
      </div>
    </DialogOverlay>
  )
}

// ============================================================================
// ADD DEAL DIALOG
// ============================================================================
function AddDealDialog({ open, onOpenChange, companyId }: {
  open: boolean; onOpenChange: (v: boolean) => void; companyId: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    product: 'solarpilot', stage: 'new_lead', mrr: '', setupFee: '', notes: '',
  })

  useEffect(() => {
    if (open) {
      setForm({ product: 'solarpilot', stage: 'new_lead', mrr: '', setupFee: '', notes: '' })
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, companyId }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create deal') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
      toast.success('Deal created')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <DialogOverlay open={open} onClose={() => onOpenChange(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: DS.TEXT }}>Add Deal</h2>
        <button onClick={() => onOpenChange(false)} aria-label="Close"
          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.TEXT2 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Product</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'solarpilot', label: 'SolarPilot', color: DS.YELLOW },
              { key: 'ai_workforce', label: 'AI Workforce', color: DS.PURPLE },
              { key: 'both', label: 'Both', color: DS.GREEN },
            ].map((opt) => {
              const isActive = form.product === opt.key
              return (
                <button key={opt.key} onClick={() => setForm({ ...form, product: opt.key })}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${isActive ? opt.color : DS.BORDER}`,
                    background: isActive ? `${opt.color}15` : 'transparent',
                    color: isActive ? opt.color : DS.TEXT3,
                    fontSize: 12, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                  }}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Stage</label>
          <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} style={inputStyle}>
            {Object.entries(stageCfg).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>MRR (€)</label>
            <input type="number" value={form.mrr} onChange={(e) => setForm({ ...form, mrr: e.target.value })} placeholder="500" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Setup Fee (€)</label>
            <input type="number" value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: e.target.value })} placeholder="2500" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Deal notes..." style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <button
          onClick={() => mutation.mutate({
            product: form.product, stage: form.stage,
            mrr: form.mrr ? parseFloat(form.mrr) : 0,
            setupFee: form.setupFee ? parseFloat(form.setupFee) : 0,
            notes: form.notes || null,
          })}
          disabled={mutation.isPending}
          style={{
            width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none',
            background: DS.YELLOW, color: '#1A1A1A', fontSize: 14, fontWeight: 700,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Plus size={16} />{mutation.isPending ? 'Creating...' : 'Create Deal'}
        </button>
      </div>
    </DialogOverlay>
  )
}

// ============================================================================
// SEND EMAIL DIALOG
// ============================================================================
function SendEmailDialog({ open, onOpenChange, contact, companyId }: {
  open: boolean; onOpenChange: (v: boolean) => void; contact: Record<string, any> | null; companyId: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ subject: '', body: '' })

  useEffect(() => {
    if (open) setForm({ subject: '', body: '' })
  }, [open])

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/crm/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact?.email,
          subject: form.subject,
          body: form.body,
          contactId: contact?.id || undefined,
          companyId,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to send email') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
      toast.success('Email sent')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!contact) return null
  return (
    <DialogOverlay open={open} onClose={() => onOpenChange(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${DS.BLUE}14`, border: `1px solid ${DS.BLUE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={16} style={{ color: DS.BLUE }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: DS.TEXT }}>Send Email</h2>
        </div>
        <button onClick={() => onOpenChange(false)} aria-label="Close"
          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.TEXT2 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>To</label>
          <input value={contact.email || ''} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: 'default' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Subject *</label>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Meeting follow-up" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Body *</label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} placeholder="Write your email..." style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }} />
        </div>
        <button
          onClick={() => {
            if (!form.subject.trim()) { toast.error('Subject is required'); return }
            if (!form.body.trim()) { toast.error('Body is required'); return }
            mutation.mutate()
          }}
          disabled={mutation.isPending}
          style={{
            width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none',
            background: DS.BLUE, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Send size={16} />{mutation.isPending ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </DialogOverlay>
  )
}

// ============================================================================
// LOG NOTE DIALOG
// ============================================================================
function LogNoteDialog({ open, onOpenChange, companyId, deals, defaultType, contactName }: {
  open: boolean; onOpenChange: (v: boolean) => void; companyId: string;
  deals: any[]; defaultType?: string; contactName?: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ type: 'note', content: '', dealId: '' })

  useEffect(() => {
    if (open) setForm({ type: defaultType || 'note', content: '', dealId: '' })
  }, [open, defaultType])

  const activityTypes = [
    { key: 'note', label: 'Note', color: '#9CA3AF' },
    { key: 'call', label: 'Call', color: DS.GREEN },
    { key: 'email', label: 'Email', color: DS.BLUE },
    { key: 'meeting', label: 'Meeting', color: DS.PINK },
  ]

  const mutation = useMutation({
    mutationFn: async () => {
      const title = `${form.type.charAt(0).toUpperCase() + form.type.slice(1)}${contactName ? ` with ${contactName}` : ''}`
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title,
          content: form.content,
          dealId: form.dealId || undefined,
          companyId,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to log activity') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
      toast.success(`${form.type.charAt(0).toUpperCase() + form.type.slice(1)} logged`)
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const currentCfg = activityTypes.find(t => t.key === form.type) || activityTypes[0]

  return (
    <DialogOverlay open={open} onClose={() => onOpenChange(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${currentCfg.color}14`, border: `1px solid ${currentCfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} style={{ color: currentCfg.color }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: DS.TEXT }}>Log Activity</h2>
        </div>
        <button onClick={() => onOpenChange(false)} aria-label="Close"
          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.TEXT2 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {activityTypes.map((opt) => {
              const isActive = form.type === opt.key
              return (
                <button key={opt.key} onClick={() => setForm({ ...form, type: opt.key })}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${isActive ? opt.color : DS.BORDER}`,
                    background: isActive ? `${opt.color}15` : 'transparent',
                    color: isActive ? opt.color : DS.TEXT3,
                    fontSize: 12, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                  }}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Content *</label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} placeholder={form.type === 'call' ? 'Call notes...' : form.type === 'meeting' ? 'Meeting notes...' : 'Activity details...'} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} />
        </div>
        {deals.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05 }}>Link to Deal (optional)</label>
            <select value={form.dealId} onChange={(e) => setForm({ ...form, dealId: e.target.value })} style={inputStyle}>
              <option value="">None</option>
              {deals.map((d: any) => {
                const sCfg = stageCfg[d.stage] || stageCfg.new_lead
                return <option key={d.id} value={d.id}>{d.product === 'ai_workforce' ? 'AI Workforce' : d.product === 'both' ? 'Both' : 'SolarPilot'} — {sCfg.label}{d.mrr ? ` (€${d.mrr}/mo)` : ''}</option>
              })}
            </select>
          </div>
        )}
        <button
          onClick={() => {
            if (!form.content.trim()) { toast.error('Content is required'); return }
            mutation.mutate()
          }}
          disabled={mutation.isPending}
          style={{
            width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none',
            background: currentCfg.color, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Plus size={16} />{mutation.isPending ? 'Saving...' : `Log ${form.type.charAt(0).toUpperCase() + form.type.slice(1)}`}
        </button>
      </div>
    </DialogOverlay>
  )
}

// ============================================================================
// CONTACT ROW (reusable)
// ============================================================================
function ContactRow({ contact, index, onLogCall, onSendEmail }: { contact: Record<string, any>; index: number; onLogCall?: () => void; onSendEmail?: () => void }) {
  const actionBtnStyle = (color: string): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 8, border: `1px solid ${color}20`,
    background: `${color}0A`, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s, border-color 0.2s', padding: 0,
  })
  return (
    <div className="cd-animate-in"
      style={{
        padding: '14px 16px', borderRadius: 14,
        background: 'rgba(255,255,255,0.015)', border: `1px solid ${DS.BORDER}`,
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        animationDelay: `${0.3 + index * 0.06}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${DS.BLUE}20`
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = DS.BORDER
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(145deg, ${DS.BLUE}14, ${DS.BLUE}08)`,
          border: `1px solid ${DS.BLUE}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: DS.BLUE }}>
            {contact.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: DS.TEXT }}>{contact.name}</span>
            {contact.isDecisionMaker && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: DS.YELLOW, background: 'rgba(243,216,64,0.12)',
                padding: '2px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: 0.03,
                border: `1px solid rgba(243,216,64,0.18)`,
              }}>Decision Maker</span>
            )}
          </div>
          {contact.role && (
            <span style={{ fontSize: 11.5, color: DS.TEXT3, display: 'block', marginBottom: 4 }}>{contact.role}</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {contact.email && (
              <span style={{ fontSize: 11, color: DS.BLUE, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={11} /> {contact.email}
              </span>
            )}
            {contact.phone && (
              <span style={{ fontSize: 11, color: DS.TEXT3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={11} /> {contact.phone}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {contact.phone && onLogCall && (
            <button
              onClick={(e) => { e.stopPropagation(); onLogCall() }}
              aria-label={`Call ${contact.name}`}
              style={actionBtnStyle(DS.GREEN)}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${DS.GREEN}20`; e.currentTarget.style.borderColor = `${DS.GREEN}35` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${DS.GREEN}0A`; e.currentTarget.style.borderColor = `${DS.GREEN}20` }}>
              <Phone size={13} style={{ color: DS.GREEN }} />
            </button>
          )}
          {contact.email && onSendEmail && (
            <button
              onClick={(e) => { e.stopPropagation(); onSendEmail() }}
              aria-label={`Email ${contact.name}`}
              style={actionBtnStyle(DS.BLUE)}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${DS.BLUE}20`; e.currentTarget.style.borderColor = `${DS.BLUE}35` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${DS.BLUE}0A`; e.currentTarget.style.borderColor = `${DS.BLUE}20` }}>
              <Mail size={13} style={{ color: DS.BLUE }} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DEAL ROW (reusable)
// ============================================================================
function DealRow({ deal, index }: { deal: Record<string, any>; index: number }) {
  const stage = stageCfg[deal.stage] || stageCfg.new_lead
  const productLabel = deal.product === 'both' ? 'SolarPilot + AI Workforce' : deal.product === 'ai_workforce' ? 'AI Workforce' : 'SolarPilot'
  const productColor = deal.product === 'both' ? DS.GREEN : deal.product === 'ai_workforce' ? DS.PURPLE : DS.YELLOW
  const isWon = deal.stage === 'closed_won'
  return (
    <div className="cd-animate-in"
      style={{
        padding: '16px 18px', borderRadius: 14,
        background: isWon
          ? `linear-gradient(135deg, ${DS.GREEN}0A 0%, ${DS.GREEN}04 100%)`
          : deal.stage === 'closed_lost' ? 'rgba(248,113,113,0.02)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${isWon ? `${DS.GREEN}18` : deal.stage === 'closed_lost' ? `${DS.RED}12` : DS.BORDER}`,
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        position: 'relative', overflow: 'hidden',
        animationDelay: `${0.05 + index * 0.06}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${stage.color}25`
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isWon ? `${DS.GREEN}18` : deal.stage === 'closed_lost' ? `${DS.RED}12` : DS.BORDER
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}>
      {/* Stage color accent line */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${stage.color}80, ${stage.color}30)`, borderRadius: '3px 0 0 3px' }} />
      {isWon && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60,
          background: `radial-gradient(circle at top right, ${DS.GREEN}08, transparent 70%)`, pointerEvents: 'none' }} />
      )}
      {/* Top row: badges + activities */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: productColor, background: `${productColor}12`,
            padding: '3px 10px', borderRadius: 7, border: `1px solid ${productColor}18`,
          }}>{productLabel}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: stage.color, background: `${stage.color}12`,
            padding: '3px 10px', borderRadius: 7, letterSpacing: 0.02,
          }}>{stage.label}</span>
        </div>
        {deal._count?.activities > 0 && (
          <span style={{ fontSize: 10, color: DS.TEXT3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} />{deal._count.activities}
          </span>
        )}
      </div>
      {/* Bottom row: Value, MRR, Setup, Owner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingLeft: 10, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 10, color: DS.TEXT3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.04 }}>Value</span>
          <div style={{ fontSize: 17, fontWeight: 700, color: DS.TEXT, fontFamily: 'monospace', marginTop: 2 }}>
            {deal.value ? fmt(deal.value) : '—'}
          </div>
        </div>
        <div>
          <span style={{ fontSize: 10, color: DS.TEXT3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.04 }}>MRR</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: DS.GREEN, fontFamily: 'monospace', marginTop: 2 }}>
            {deal.mrr ? `${fmt(deal.mrr)}/mo` : '—'}
          </div>
        </div>
        {deal.setupFee > 0 && (
          <div>
            <span style={{ fontSize: 10, color: DS.TEXT3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.04 }}>Setup</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: DS.TEXT2, fontFamily: 'monospace', marginTop: 2 }}>
              {fmt(deal.setupFee)}
            </div>
          </div>
        )}
        {deal.assignedTo && (
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: 10, color: DS.TEXT3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.04 }}>Owner</span>
            <div style={{ fontSize: 12, fontWeight: 600, color: DS.TEXT2, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: `${getAvatarColor(deal.assignedTo.name)}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: getAvatarColor(deal.assignedTo.name) }}>
                  {deal.assignedTo.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </span>
              </div>
              {deal.assignedTo.name}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  useDetailAnimations()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [addDealOpen, setAddDealOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [emailContact, setEmailContact] = useState<Record<string, any> | null>(null)
  const [logNoteOpen, setLogNoteOpen] = useState(false)
  const [logNoteDefault, setLogNoteDefault] = useState<string>('note')
  const [logNoteContactName, setLogNoteContactName] = useState<string | undefined>(undefined)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => fetch(`/api/crm/companies/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/companies/${id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to delete') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company deleted')
      router.push('/crm/companies')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <SkeletonPage />

  const company = data?.company
  const status = statusCfg[company?.status] || statusCfg.prospect

  if (!company) {
    return (
      <div style={{
        background: `radial-gradient(ellipse at 50% 0%, ${DS.BG_CENTER} 0%, ${DS.BG_PAGE} 70%)`,
        minHeight: '100vh', padding: '24px clamp(16px, 4vw, 56px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        <Building2 size={48} style={{ color: DS.TEXT3 }} />
        <p style={{ color: DS.TEXT2, fontSize: 16, fontWeight: 600 }}>Company not found</p>
        <button onClick={() => router.push('/crm/companies')}
          style={{
            padding: '9px 18px', borderRadius: 10, border: `1px solid ${DS.BORDER}`, background: DS.CARD,
            color: DS.TEXT2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}>
          <ArrowLeft size={14} /> Back to Companies
        </button>
      </div>
    )
  }

  // ── Computed Values ──
  const totalMRR = company.deals?.filter((d: any) => d.stage === 'closed_won').reduce((s: number, d: any) => s + (d.mrr || 0), 0) || 0
  const totalValue = company.deals?.reduce((s: number, d: any) => s + (d.value || 0), 0) || 0
  const initials = (company.name || '??').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const avatarColor = getAvatarColor(company.name || '')
  const openDeals = company.deals?.filter((d: any) => d.stage !== 'closed_won' && d.stage !== 'closed_lost') || []
  const wonDeals = company.deals?.filter((d: any) => d.stage === 'closed_won') || []

  const allActivities = company.deals
    ?.flatMap((d: any) =>
      (d.activities || []).map((a: any) => ({ ...a, dealProduct: d.product, dealId: d.id }))
    )
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []

  const totalActivityCount = company.deals?.reduce((s: number, d: any) => s + (d._count?.activities || 0), 0) || 0

  // ════════════════════════════════════════════════════════════════════════
  // RENDER — Sidebar + Main Content Layout
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      background: `radial-gradient(ellipse at 50% 0%, ${DS.BG_CENTER} 0%, ${DS.BG_PAGE} 70%)`,
      minHeight: '100vh',
    }}>
      <div style={{ padding: '24px clamp(16px, 4vw, 56px)', maxWidth: 1360, margin: '0 auto' }}>

        {/* ═══ ACCENT BAR ═══ */}
        <div className="cd-animate-in" style={{ height: 3, borderRadius: 2, marginBottom: 24,
          background: `linear-gradient(90deg, transparent, ${status.color} 15%, ${status.color}60 50%, ${status.color}60%, transparent)` }} />

        {/* ═══ BACK BUTTON ═══ */}
        <div className="cd-animate-in" style={{ marginBottom: 20, animationDelay: '0.05s' }}>
          <button
            onClick={() => router.push('/crm/companies')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9, border: `1px solid ${DS.BORDER}`,
              background: 'rgba(255,255,255,0.03)', color: DS.TEXT3, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DS.BORDER_HOVER; e.currentTarget.style.color = DS.TEXT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = DS.BORDER; e.currentTarget.style.color = DS.TEXT3 }}
          >
            <ArrowLeft size={14} />
            Companies
            <ChevronRight size={12} style={{ opacity: 0.4 }} />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SIDEBAR + MAIN CONTENT
            ══════════════════════════════════════════════════════════════════ */}
        <div className="company-detail-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ══════════════════════════════════════════════════════════════════
              LEFT SIDEBAR — Company Identity Card
              ══════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Company Identity Card ── */}
            <div className="cd-animate-in" style={{
              position: 'relative', borderRadius: 22, overflow: 'hidden',
              background: `linear-gradient(160deg, ${status.color}06 0%, transparent 40%), linear-gradient(320deg, ${status.color}04 0%, transparent 40%), ${DS.CARD}`,
              border: `1px solid ${DS.BORDER}`,
              animationDelay: '0.08s',
            }}>
              {/* Top glow */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, transparent, ${status.color}50 30%, ${status.color}50 70%, transparent)`,
                boxShadow: `0 0 30px ${status.color}30` }} />
              {/* Radial glow */}
              <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220,
                background: `radial-gradient(circle, ${status.color}06 0%, transparent 70%)`, pointerEvents: 'none' }} />

              {/* Logo + Name + Status */}
              <div style={{ padding: '28px 24px 24px', textAlign: 'center' }}>
                {/* Large Logo */}
                <div style={{ position: 'relative', width: 112, height: 112, margin: '0 auto 20px' }}>
                  <div style={{ position: 'absolute', inset: -10, borderRadius: 32,
                    background: `radial-gradient(circle, ${status.color}18 0%, transparent 70%)`,
                    filter: 'blur(14px)', pointerEvents: 'none' }} />
                  <div style={{
                    width: 112, height: 112, borderRadius: 24, overflow: 'hidden', position: 'relative',
                    background: company.logoUrl && !logoError
                      ? '#FFFFFF'
                      : `linear-gradient(145deg, ${avatarColor}28, ${avatarColor}0A)`,
                    border: `2px solid ${company.logoUrl && !logoError ? `${status.color}30` : `${status.color}25`}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 30px ${status.color}20, 0 0 0 6px ${status.color}06`,
                    margin: '0 auto',
                  }}>
                    {company.logoUrl && !logoError ? (
                      <img src={company.logoUrl} alt={`${company.name} logo`}
                        onError={() => setLogoError(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 14 }} />
                    ) : (
                      <span style={{ fontSize: 38, fontWeight: 800, color: avatarColor, letterSpacing: '-0.02em' }}>{initials}</span>
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <h1 style={{ fontSize: 22, fontWeight: 800, color: DS.TEXT, letterSpacing: '-0.03em', marginBottom: 10, lineHeight: 1.2 }}>
                  {company.name}
                </h1>

                {/* Status Badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 700, color: status.color, background: status.bg,
                  padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.05,
                  border: `1px solid ${status.color}20`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: status.color,
                    boxShadow: `0 0 6px ${status.color}` }} />
                  {status.label}
                </span>
              </div>

              {/* MRR Highlight (prominent, subtle) */}
              {totalMRR > 0 && (
                <div style={{ margin: '0 20px 20px', padding: '16px 18px', borderRadius: 16,
                  background: `linear-gradient(135deg, ${DS.GREEN}0C, ${DS.GREEN}04)`,
                  border: `1px solid ${DS.GREEN}14`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: `linear-gradient(90deg, transparent, ${DS.GREEN}30, transparent)` }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: DS.TEXT3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                        Monthly Revenue
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 26, fontWeight: 800, color: DS.TEXT, letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
                          {fmt(totalMRR)}
                        </span>
                        <span style={{ fontSize: 12, color: DS.TEXT3, fontWeight: 500 }}>/mo</span>
                      </div>
                      <div style={{ fontSize: 11, color: DS.TEXT3, marginTop: 4 }}>
                        from {wonDeals.length} active deal{wonDeals.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: `linear-gradient(145deg, ${DS.GREEN}14, ${DS.GREEN}08)`,
                      border: `1px solid ${DS.GREEN}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 20px ${DS.GREEN}08`,
                    }}>
                      <TrendingUp size={20} style={{ color: DS.GREEN }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: DS.BORDER, margin: '0 24px' }} />

              {/* Company Details */}
              <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {company.counties && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${DS.PINK}10`, border: `1px solid ${DS.PINK}16`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={13} style={{ color: DS.PINK }} />
                    </div>
                    <span style={{ fontSize: 13, color: DS.TEXT2 }}>{company.counties}</span>
                  </div>
                )}
                {company.seaiReg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${DS.BLUE}10`, border: `1px solid ${DS.BLUE}16`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={13} style={{ color: DS.BLUE }} />
                    </div>
                    <span style={{ fontSize: 13, color: DS.TEXT2 }}>{company.seaiReg}</span>
                  </div>
                )}
                {company.website && (
                  <a href={`https://${company.website.replace(/^https?:\/\//, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.querySelector('span:last-of-type')!.style.color = DS.BLUE }}
                    onMouseLeave={(e) => { e.currentTarget.querySelector('span:last-of-type')!.style.color = DS.TEXT2 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${DS.BLUE}10`, border: `1px solid ${DS.BLUE}16`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={13} style={{ color: DS.BLUE }} />
                    </div>
                    <span style={{ fontSize: 13, color: DS.TEXT2, fontWeight: 500, transition: 'color 0.2s' }}>
                      {company.website.replace(/^https?:\/\//, '')}
                    </span>
                    <ExternalLink size={10} style={{ color: DS.BLUE, opacity: 0.5, marginLeft: 2 }} />
                  </a>
                )}
                {company.teamSize && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${DS.GREEN}10`, border: `1px solid ${DS.GREEN}16`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={13} style={{ color: DS.GREEN }} />
                    </div>
                    <span style={{ fontSize: 13, color: DS.TEXT2 }}>{company.teamSize} team members</span>
                  </div>
                )}
                {company.installsPerYear && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${DS.ORANGE}10`, border: `1px solid ${DS.ORANGE}16`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={13} style={{ color: DS.ORANGE }} />
                    </div>
                    <span style={{ fontSize: 13, color: DS.TEXT2 }}>{company.installsPerYear} installs/year</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.BORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={13} style={{ color: DS.TEXT3 }} />
                  </div>
                  <span style={{ fontSize: 13, color: DS.TEXT3 }}>
                    Created {format(new Date(company.createdAt), 'MMM yyyy')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
                <button onClick={() => setEditOpen(true)}
                  style={{ flex: 1, padding: '9px 14px', borderRadius: 10,
                    border: `1px solid ${DS.YELLOW}25`, background: 'rgba(243,216,64,0.08)',
                    color: DS.YELLOW, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(243,216,64,0.16)'; e.currentTarget.style.borderColor = `${DS.YELLOW}40` }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(243,216,64,0.08)'; e.currentTarget.style.borderColor = `${DS.YELLOW}25` }}>
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => setDeleteOpen(true)}
                  style={{ flex: 1, padding: '9px 14px', borderRadius: 10,
                    border: `1px solid ${DS.RED}20`, background: 'rgba(248,113,113,0.06)',
                    color: DS.RED, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.borderColor = `${DS.RED}35` }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.borderColor = `${DS.RED}20` }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            {/* ── Contacts Card ── */}
            <Section title="Contacts" icon={Users} accent={DS.BLUE} badge={company.contacts?.length || 0}
              right={
                <button onClick={() => setAddContactOpen(true)} style={{
                  padding: '5px 12px', borderRadius: 7, border: `1px solid ${DS.BLUE}30`,
                  background: 'rgba(96,165,250,0.08)', color: DS.BLUE,
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.16)'; e.currentTarget.style.borderColor = `${DS.BLUE}50` }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.borderColor = `${DS.BLUE}30` }}>
                  <Plus size={12} /> Add
                </button>
              }>
              {company.contacts?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Users size={24} style={{ color: DS.TEXT3, margin: '0 auto 8px' }} />
                  <p style={{ color: DS.TEXT3, fontSize: 12, marginBottom: 10 }}>No contacts yet</p>
                  <button onClick={() => setAddContactOpen(true)} style={{
                    padding: '6px 14px', borderRadius: 7, border: `1px solid ${DS.BLUE}25`,
                    background: 'rgba(96,165,250,0.08)', color: DS.BLUE,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.14)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)' }}>
                    <Plus size={11} /> Add Contact
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {company.contacts.map((contact: any, ci: number) => (
                    <ContactRow key={contact.id} contact={contact} index={ci}
                      onLogCall={() => {
                        setLogNoteDefault('call')
                        setLogNoteContactName(contact.name)
                        setLogNoteOpen(true)
                      }}
                      onSendEmail={() => setEmailContact(contact)}
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* ── Notes Card ── */}
            {company.notes && (
              <Section title="Notes" icon={User} accent="#9CA3AF">
                <div style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${DS.BORDER}`,
                  fontFamily: 'monospace', fontSize: 12.5, color: DS.TEXT2, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>{company.notes}</div>
              </Section>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT MAIN CONTENT — Stats, Deals, Activity, Onboarding
              ══════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Stats Row (4 across) ── */}
            <div className="cd-animate-in stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, animationDelay: '0.12s' }}>
              <StatCard icon={Euro} label="Monthly MRR" value={totalMRR > 0 ? fmt(totalMRR) : '—'} color={DS.GREEN}
                subtext={`${wonDeals.length} won deal${wonDeals.length !== 1 ? 's' : ''}`} delay={0.15} />
              <StatCard icon={TrendingUp} label="Pipeline Value" value={totalValue > 0 ? fmtCompact(totalValue) : '—'} color={DS.YELLOW}
                subtext={`${openDeals.length} active deal${openDeals.length !== 1 ? 's' : ''}`} delay={0.2} />
              <StatCard icon={Package} label="Total Deals" value={company.deals?.length || 0} color={DS.PURPLE}
                subtext={wonDeals.length > 0 ? `${wonDeals.length} closed won` : undefined} delay={0.25} />
              <StatCard icon={BarChart3} label="Activities" value={totalActivityCount || '—'} color={DS.BLUE}
                subtext="across all deals" delay={0.3} />
            </div>

            {/* ── Billing Summary ── */}
            <div className="cd-animate-in stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, animationDelay: '0.32s' }}>
              <StatCard icon={CreditCard} label="Total MRR" value={totalMRR > 0 ? fmt(totalMRR) : '—'} color={DS.GREEN}
                subtext={wonDeals.length > 0 ? `${wonDeals.length} active sub${wonDeals.length !== 1 ? 's' : ''}` : 'No active subscriptions'} delay={0.34} />
              <StatCard icon={TrendingUp} label="Pipeline Value" value={totalValue > 0 ? fmtCompact(totalValue) : '—'} color={DS.YELLOW}
                subtext={`${openDeals.length} deal${openDeals.length !== 1 ? 's' : ''} in progress`} delay={0.38} />
              <StatCard icon={CheckCircle2} label="Active Subscriptions" value={wonDeals.length || 0} color={DS.BLUE}
                subtext={totalMRR > 0 ? `${fmt(totalMRR)}/mo recurring` : 'No recurring revenue'} delay={0.42} />
              <StatCard icon={Receipt} label="Total Setup Fees" value={fmt(wonDeals.reduce((s: number, d: any) => s + (d.setupFee || 0), 0))} color={DS.ORANGE}
                subtext={wonDeals.length > 0 ? `from ${wonDeals.length} closed deal${wonDeals.length !== 1 ? 's' : ''}` : 'No setup fees collected'} delay={0.46} />
            </div>

            {/* ── Deals Pipeline ── */}
            <Section title="Deals Pipeline" icon={Euro} accent={DS.GREEN} badge={company.deals?.length || 0}
              right={
                <button onClick={() => setAddDealOpen(true)} style={{
                  padding: '6px 14px', borderRadius: 8, border: `1px solid ${DS.GREEN}30`,
                  background: 'rgba(16,185,129,0.08)', color: DS.GREEN,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.16)'; e.currentTarget.style.borderColor = `${DS.GREEN}50` }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor = `${DS.GREEN}30` }}>
                  <Plus size={13} /> Add Deal
                </button>
              }>
              {company.deals?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Package size={32} style={{ color: DS.TEXT3, margin: '0 auto 12px' }} />
                  <p style={{ color: DS.TEXT3, fontSize: 13, marginBottom: 14 }}>No deals yet</p>
                  <button onClick={() => setAddDealOpen(true)} style={{
                    padding: '8px 18px', borderRadius: 9, border: `1px solid ${DS.GREEN}25`,
                    background: 'rgba(16,185,129,0.08)', color: DS.GREEN,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.14)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)' }}>
                    <Plus size={13} /> Create First Deal
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {company.deals.map((deal: any, di: number) => (
                    <DealRow key={deal.id} deal={deal} index={di} />
                  ))}
                </div>
              )}
            </Section>

            {/* ── Activity Timeline ── */}
            <Section title="Activity Timeline" icon={Clock} accent={DS.YELLOW} badge={totalActivityCount}>
              {allActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Clock size={28} style={{ color: DS.TEXT3, margin: '0 auto 10px' }} />
                  <p style={{ color: DS.TEXT3, fontSize: 13 }}>No activity yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 16, top: 20, bottom: 20, width: 2,
                    background: 'rgba(255,255,255,0.04)', borderRadius: 1 }} />
                  {allActivities.slice(0, 10).map((activity: any, i: number) => {
                    const cfg = actIcons[activity.type] || actIcons.note
                    const dealProduct = activity.dealProduct
                    const productLabel = dealProduct === 'both' ? 'Both' : dealProduct === 'ai_workforce' ? 'AI' : 'SP'
                    const productColor = dealProduct === 'both' ? DS.GREEN : dealProduct === 'ai_workforce' ? DS.PURPLE : DS.YELLOW
                    return (
                      <div key={activity.id} className="cd-animate-in" style={{ display: 'flex', gap: 16, paddingBottom: 18, position: 'relative', animationDelay: `${0.4 + i * 0.06}s` }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0, position: 'relative', zIndex: 1,
                          background: `linear-gradient(135deg, ${cfg.color}14, ${cfg.color}08)`,
                          border: `1px solid ${cfg.color}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 0 10px ${cfg.color}06`,
                        }}>
                          <cfg.icon size={14} style={{ color: cfg.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: DS.TEXT }}>{activity.title}</p>
                            <span style={{ fontSize: 9, fontWeight: 600, color: productColor, background: `${productColor}10`,
                              padding: '1px 6px', borderRadius: 4, letterSpacing: 0.03 }}>{productLabel}</span>
                          </div>
                          {activity.content && (
                            <p style={{ fontSize: 12, color: DS.TEXT3, lineHeight: 1.5, marginBottom: 3 }}>{activity.content}</p>
                          )}
                          <span style={{ fontSize: 11, color: DS.TEXT3, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} />
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {allActivities.length > 10 && (
                    <div style={{ textAlign: 'center', paddingTop: 4 }}>
                      <span style={{ fontSize: 11, color: DS.TEXT3, fontWeight: 500 }}>+{allActivities.length - 10} more</span>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* ── Onboarding Progress ── */}
            {company.onboarding && (
              <Section title="Onboarding Progress" icon={Sparkles} accent={DS.PURPLE}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    { key: 'sp', label: 'SolarPilot', Icon: Sun, progress: company.onboarding.solarpilotProgress, steps: company.onboarding.solarpilotSteps, color: DS.YELLOW },
                    { key: 'ai', label: 'AI Workforce', Icon: Bot, progress: company.onboarding.aiWorkforceProgress, steps: company.onboarding.aiWorkforceSteps, color: DS.PURPLE },
                  ].map((item) => {
                    const pct = item.progress || 0
                    const isDone = pct === 100
                    const steps = item.steps ? JSON.parse(item.steps) : []
                    return (
                      <div key={item.key}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: 9,
                              background: `${item.color}12`, border: `1px solid ${item.color}18`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <item.Icon size={14} style={{ color: item.color }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: DS.TEXT }}>{item.label}</span>
                          </div>
                          <div style={{
                            fontSize: 13, fontWeight: 800, fontFamily: 'monospace',
                            color: isDone ? DS.GREEN : pct > 0 ? DS.TEXT2 : DS.TEXT3,
                          }}>{pct}%</div>
                        </div>
                        <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div className="cd-progress-grow" style={{
                            height: '100%', borderRadius: 5,
                            background: isDone ? `linear-gradient(90deg, ${DS.GREEN}, ${DS.GREEN}CC)` : `linear-gradient(90deg, ${item.color}, ${item.color}AA)`,
                            boxShadow: pct > 0 ? `0 0 12px ${item.color}20` : 'none',
                            width: `${pct}%`, transition: 'width 1.2s ease-out', transitionDelay: '0.3s',
                          }} />
                        </div>
                        {steps.length > 0 && (
                          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {steps.map((step: any, i: number) => (
                              <div key={i} className="cd-animate-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', animationDelay: `${0.5 + i * 0.08}s` }}>
                                {step.done ? (
                                  <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                                    background: `${DS.GREEN}15`, border: `1px solid ${DS.GREEN}20`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 size={12} style={{ color: DS.GREEN }} />
                                  </div>
                                ) : (
                                  <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.BORDER}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Circle size={12} style={{ color: DS.TEXT3 }} />
                                  </div>
                                )}
                                <span style={{ fontSize: 12.5, color: step.done ? DS.TEXT2 : DS.TEXT3, fontWeight: 400 }}>{step.step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {(company.onboarding.startedAt || company.onboarding.completedAt) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 8, borderTop: `1px solid ${DS.BORDER}` }}>
                      {company.onboarding.startedAt && (
                        <span style={{ fontSize: 11, color: DS.TEXT3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> Started {formatDistanceToNow(new Date(company.onboarding.startedAt), { addSuffix: true })}
                        </span>
                      )}
                      {company.onboarding.completedAt && (
                        <span style={{ fontSize: 11, color: DS.GREEN, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                          <CheckCircle2 size={10} /> Completed {formatDistanceToNow(new Date(company.onboarding.completedAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ── Notes ── */}
            {company.notes && (
              <Section title="Notes" icon={User} accent="#9CA3AF">
                <div style={{
                  padding: '16px 18px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${DS.BORDER}`,
                  fontFamily: 'monospace', fontSize: 13, color: DS.TEXT2, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>{company.notes}</div>
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* ═══ DIALOGS ═══ */}
      <EditCompanyDialog key={editOpen ? 'open' : 'closed'} open={editOpen} onOpenChange={setEditOpen} company={company} />
      <DeleteCompanyDialog open={deleteOpen} onOpenChange={setDeleteOpen} companyName={company.name}
        onConfirm={() => deleteMutation.mutate()} isPending={deleteMutation.isPending} />
      <AddContactDialog open={addContactOpen} onOpenChange={setAddContactOpen} companyId={id} />
      <AddDealDialog open={addDealOpen} onOpenChange={setAddDealOpen} companyId={id} />
      <SendEmailDialog open={!!emailContact} onOpenChange={(v) => { if (!v) setEmailContact(null) }} contact={emailContact} companyId={id} />
      <LogNoteDialog open={logNoteOpen} onOpenChange={setLogNoteOpen} companyId={id}
        deals={company.deals || []} defaultType={logNoteDefault} contactName={logNoteContactName} />
    </div>
  )
}
