'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Building2, MapPin, Users, Zap, Euro, Globe,
  Shield, Clock, X, Contact, AlertTriangle, Edit2, Trash2, Download,
  ChevronLeft, ChevronRight, ArrowUpDown, ImageOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

// ============================================================================
// DESIGN SYSTEM
// ============================================================================
const DARK = '#080808'
const DARK_CENTER = '#0C0C0C'
const CARD_BG = '#141414'
const BORDER = 'rgba(255,255,255,0.05)'
const BORDER_HOVER = 'rgba(255,255,255,0.10)'
const YELLOW = '#F3D840'
const TEXT_PRIMARY = '#FFFFFF'
const TEXT_SECONDARY = 'rgba(255,255,255,0.50)'
const TEXT_TERTIARY = 'rgba(255,255,255,0.30)'
const GREEN = '#10B981'
const RED = '#F87171'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: GREEN, bg: 'rgba(16,185,129,0.10)' },
  prospect: { label: 'Prospect', color: YELLOW, bg: 'rgba(243,216,64,0.10)' },
  churned: { label: 'Churned', color: RED, bg: 'rgba(248,113,113,0.10)' },
  inactive: { label: 'Inactive', color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
}

// ============================================================================
// HELPERS
// ============================================================================
const LIMIT = 12

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'prospect', label: 'Prospects' },
  { key: 'churned', label: 'Churned' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'teamSize', label: 'Team Size' },
  { value: 'installsPerYear', label: 'Installs/Year' },
  { value: 'status', label: 'Status' },
]

function getAvatarColor(name: string): string {
  const colors = ['#F3D840', '#60A5FA', '#A78BFA', '#F472B6', '#34D399', '#FB923C', '#818CF8', '#FBBF24']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getCompanyMRR(deals: any[]): number {
  if (!deals || !Array.isArray(deals)) return 0
  return deals.reduce((sum: number, deal: any) => sum + (deal.mrr || 0), 0)
}

function formatMRR(value: number): string {
  if (!value || value === 0) return '—'
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + '/mo'
}

// ============================================================================
// PROGRESS BAR
// ============================================================================
function ProgressBar({ value, label, color, height = 6 }: { value: number; label: string; color: string; height?: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: TEXT_TERTIARY, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: value === 100 ? GREEN : TEXT_SECONDARY }}>{value}%</span>
      </div>
      <div style={{ width: '100%', height, borderRadius: height / 2, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%', borderRadius: height / 2, background: color,
          width: mounted ? `${value}%` : '0%', transition: 'width 0.8s ease-out', transitionDelay: '0.3s',
        }} />
      </div>
    </div>
  )
}

// ============================================================================
// INPUT STYLES
// ============================================================================
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: `1px solid ${BORDER}`, background: DARK,
  color: TEXT_PRIMARY, fontSize: 14, outline: 'none', fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY,
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.05,
}

// ============================================================================
// DIALOG OVERLAY
// ============================================================================
function DialogOverlay({ open, onClose, title, children, width = 520 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number
}) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="crm-dialog-backdrop"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div className="crm-dialog-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto',
          borderRadius: 20, background: CARD_BG, border: `1px solid ${BORDER}`,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)', padding: 28,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>{title}</h2>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_SECONDARY }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// COMPANY FORM SHARED COMPONENT
// ============================================================================
function CompanyFormFields({ form, setForm }: {
  form: { name: string; counties: string; seaiReg: string; teamSize: string; installsPerYear: string; website: string; logoUrl: string; status: string; notes: string }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Company Name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. SunPower Installations" style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Counties</label>
          <input value={form.counties} onChange={(e) => setForm({ ...form, counties: e.target.value })}
            placeholder="Dublin, Wicklow, Kildare" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>SEAI Reg #</label>
          <input value={form.seaiReg} onChange={(e) => setForm({ ...form, seaiReg: e.target.value })}
            placeholder="SEAI-1234" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Team Size</label>
          <input type="number" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
            placeholder="12" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Installs / Year</label>
          <input type="number" value={form.installsPerYear} onChange={(e) => setForm({ ...form, installsPerYear: e.target.value })}
            placeholder="85" style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Website</label>
        <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="example.ie" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Logo URL</label>
        <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          placeholder="https://example.com/logo.png" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Status</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['prospect', 'active', 'inactive', 'churned'].map((s) => {
            const cfg = statusConfig[s]
            const isActive = form.status === s
            return (
              <button key={s} onClick={() => setForm({ ...form, status: s })} style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                border: `1px solid ${isActive ? cfg.color : BORDER}`,
                background: isActive ? cfg.bg : 'transparent',
                color: isActive ? cfg.color : TEXT_TERTIARY,
                fontSize: 12, fontWeight: isActive ? 600 : 500,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{cfg.label}</button>
            )
          })}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Any relevant notes..." rows={3}
          style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
    </div>
  )
}

// ============================================================================
// ADD COMPANY DIALOG
// ============================================================================
function AddCompanyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const emptyForm = { name: '', counties: '', seaiReg: '', teamSize: '', installsPerYear: '', website: '', logoUrl: '', status: 'prospect', notes: '' }
  const [form, setForm] = useState({ ...emptyForm })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) setForm({ ...emptyForm }) // eslint-disable-line react-hooks/set-state-in-effect
  }, [open])

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string | number | null>) => {
      const res = await fetch('/api/crm/companies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create company') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company created successfully')
      setForm({ ...emptyForm })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <DialogOverlay open={open} onClose={() => onOpenChange(false)} title="Add Company">
      <CompanyFormFields form={form} setForm={setForm} />
      <button onClick={() => {
        if (!form.name.trim()) { toast.error('Company name is required'); return }
        mutation.mutate({
          name: form.name, counties: form.counties || null, seaiReg: form.seaiReg || null,
          teamSize: form.teamSize ? parseInt(form.teamSize) : null,
          installsPerYear: form.installsPerYear ? parseInt(form.installsPerYear) : null,
          website: form.website || null, logoUrl: form.logoUrl || null,
          status: form.status, notes: form.notes || null,
        })
      }} disabled={mutation.isPending} style={{
        width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none', background: YELLOW,
        color: '#1A1A1A', fontSize: 14, fontWeight: 700, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
        opacity: mutation.isPending ? 0.7 : 1, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
      }}>
        <Plus size={16} />{mutation.isPending ? 'Creating...' : 'Create Company'}
      </button>
    </DialogOverlay>
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
    name: '', counties: '', seaiReg: '', teamSize: '',
    installsPerYear: '', website: '', logoUrl: '', status: 'prospect', notes: '',
  })

  // Sync form state when company changes (handles opening dialog with different company)
  useEffect(() => {
    if (company) {
      setForm({ // eslint-disable-line react-hooks/set-state-in-effect
        name: company.name || '',
        counties: company.counties || '',
        seaiReg: company.seaiReg || '',
        teamSize: company.teamSize ? String(company.teamSize) : '',
        installsPerYear: company.installsPerYear ? String(company.installsPerYear) : '',
        website: company.website || '',
        logoUrl: company.logoUrl || '',
        status: company.status || 'prospect',
        notes: company.notes || '',
      })
    }
  }, [company])

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string | number | null>) => {
      const res = await fetch(`/api/crm/companies/${company?.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update company') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company', company?.id] })
      toast.success('Company updated successfully')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <DialogOverlay open={open} onClose={() => onOpenChange(false)} title="Edit Company">
      <CompanyFormFields form={form} setForm={setForm} />
      <button onClick={() => {
        if (!form.name.trim()) { toast.error('Company name is required'); return }
        mutation.mutate({
          name: form.name, counties: form.counties || null, seaiReg: form.seaiReg || null,
          teamSize: form.teamSize ? parseInt(form.teamSize) : null,
          installsPerYear: form.installsPerYear ? parseInt(form.installsPerYear) : null,
          website: form.website || null, logoUrl: form.logoUrl || null,
          status: form.status, notes: form.notes || null,
        })
      }} disabled={mutation.isPending} style={{
        width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none', background: YELLOW,
        color: '#1A1A1A', fontSize: 14, fontWeight: 700, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
        opacity: mutation.isPending ? 0.7 : 1, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
      }}>
        <Edit2 size={16} />{mutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </DialogOverlay>
  )
}

// ============================================================================
// DELETE CONFIRM DIALOG
// ============================================================================
function DeleteConfirmDialog({ open, onClose, company }: {
  open: boolean; onClose: () => void; company: Record<string, any> | null
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/companies/${company?.id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to delete company') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company deleted successfully')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <DialogOverlay open={open} onClose={onClose} title="Delete Company" width={420}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(248,113,113,0.10)',
          border: '1px solid rgba(248,113,113,0.20)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trash2 size={24} style={{ color: RED }} />
        </div>
        <p style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 6, lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: TEXT_PRIMARY }}>{company?.name}</strong>?
        </p>
        <p style={{ fontSize: 13, color: TEXT_TERTIARY, lineHeight: 1.4 }}>
          This will permanently remove the company and all associated data. This action cannot be undone.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '10px 20px', borderRadius: 10, border: `1px solid ${BORDER}`,
          background: 'transparent', color: TEXT_SECONDARY, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Cancel</button>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{
          flex: 1, padding: '10px 20px', borderRadius: 10, border: 'none', background: RED,
          color: '#FFF', fontSize: 14, fontWeight: 700,
          cursor: mutation.isPending ? 'not-allowed' : 'pointer',
          opacity: mutation.isPending ? 0.7 : 1, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Trash2 size={14} />{mutation.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </DialogOverlay>
  )
}

// ============================================================================
// COMPANY LOGO / AVATAR
// ============================================================================
function CompanyAvatar({ company }: { company: Record<string, any> }) {
  const [imgError, setImgError] = useState(false)
  const name = company.name || ''
  const initials = name.trim().slice(0, 2).toUpperCase()
  const bgColor = getAvatarColor(name)

  if (company.logoUrl && !imgError) {
    return (
      <img
        src={company.logoUrl}
        alt={`${name} logo`}
        onError={() => setImgError(true)}
        style={{
          width: 44, height: 44, borderRadius: 10, objectFit: 'cover',
          border: `1px solid ${BORDER}`, flexShrink: 0,
          background: CARD_BG,
        }}
      />
    )
  }

  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
      background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${BORDER}`, fontSize: 15, fontWeight: 800, color: DARK,
      letterSpacing: -0.02, lineHeight: 1,
    }}>
      {initials}
    </div>
  )
}

// ============================================================================
// COMPANY CARD
// ============================================================================
function CompanyCard({ company, index, onEdit, onDelete }: {
  company: Record<string, any>; index: number; onEdit: () => void; onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const status = statusConfig[company.status] || statusConfig.prospect
  const created = formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })
  const hasOnboarding = company.onboarding && (company.onboarding.solarpilotProgress > 0 || company.onboarding.aiWorkforceProgress > 0)
  const totalMRR = getCompanyMRR(company.deals)
  const dealsCount = company._count?.deals || 0

  return (
    <div
      className="crm-animate-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, background: CARD_BG,
        borderLeft: `3px solid ${status.color}`,
        borderRight: `1px solid ${hovered ? BORDER_HOVER : BORDER}`,
        borderTop: `1px solid ${hovered ? BORDER_HOVER : BORDER}`,
        borderBottom: `1px solid ${hovered ? BORDER_HOVER : BORDER}`,
        padding: 0, cursor: 'pointer', overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.2s',
        boxShadow: hovered ? `0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px ${status.color}15` : 'none',
        display: 'flex', flexDirection: 'column', position: 'relative',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        animationDelay: `${index * 0.05}s`,
      }}
      onClick={() => window.location.href = `/crm/companies/${company.id}`}>
      {/* Status accent glow at top */}
      <div style={{
        height: 3, width: '100%', flexShrink: 0,
        background: `linear-gradient(90deg, transparent 0%, ${status.color}40 30%, ${status.color}60 50%, ${status.color}40 70%, transparent 100%)`,
        opacity: hovered ? 1 : 0.6,
        transition: 'opacity 0.3s',
      }} />

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Action buttons (top-right, always visible, prominent on hover) */}
        <div style={{
          position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6,
          opacity: hovered ? 1 : 0.5, transition: 'opacity 0.2s', zIndex: 2,
        }}>
          <button onClick={(e) => { e.stopPropagation(); onEdit() }} title="Edit" aria-label="Edit company" style={{
            width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`,
            background: CARD_BG, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: TEXT_SECONDARY, transition: 'all 0.2s',
          }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = BORDER_HOVER; e.currentTarget.style.color = YELLOW }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_SECONDARY }}>
            <Edit2 size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} title="Delete" aria-label="Delete company" style={{
            width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`,
            background: CARD_BG, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: TEXT_SECONDARY, transition: 'all 0.2s',
          }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = RED }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_SECONDARY }}>
            <Trash2 size={13} />
          </button>
        </div>

        {/* Header Row: Logo → Name + Counties → Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CompanyAvatar company={company} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: -0.01 }}>
              {company.name}
            </h3>
            {company.counties ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: TEXT_TERTIARY, fontSize: 12 }}>
                <MapPin size={11} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company.counties}</span>
              </div>
            ) : company.website ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: TEXT_TERTIARY, fontSize: 12 }}>
                <Globe size={11} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company.website}</span>
              </div>
            ) : null}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, color: status.color, background: status.bg,
            padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.04, flexShrink: 0, whiteSpace: 'nowrap',
          }}>{status.label}</span>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { icon: Users, label: 'Team', value: company.teamSize ? `${company.teamSize}` : '—', color: '#60A5FA' },
            { icon: Zap, label: 'Installs', value: company.installsPerYear ? `${company.installsPerYear}/yr` : '—', color: '#FB923C' },
            { icon: Contact, label: 'Contacts', value: `${company._count?.contacts || 0}`, color: '#A78BFA' },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '10px 12px', borderRadius: 10, background: `${stat.color}08`, border: `1px solid ${stat.color}12` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <stat.icon size={11} style={{ color: stat.color }} />
                <span style={{ fontSize: 10, color: TEXT_TERTIARY, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.04 }}>{stat.label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Footer Row: SEAI reg, deals count, MRR, time ago */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {company.seaiReg && (
            <span style={{ fontSize: 11, color: TEXT_TERTIARY, display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
              <Shield size={10} />{company.seaiReg}
            </span>
          )}
          <span style={{ fontSize: 11, color: TEXT_TERTIARY, display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            {dealsCount} deal{dealsCount !== 1 ? 's' : ''}
          </span>
          {totalMRR > 0 && (
            <span style={{ fontSize: 11, color: '#34D399', display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)' }}>
              <Euro size={10} />{formatMRR(totalMRR)}
            </span>
          )}
          <span style={{ fontSize: 11, color: TEXT_TERTIARY, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <Clock size={10} />{created}
          </span>
        </div>

        {/* Onboarding Progress */}
        {hasOnboarding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
            <ProgressBar value={company.onboarding.solarpilotProgress} label="SolarPilot" color={YELLOW} />
            {company.onboarding.aiWorkforceProgress > 0 && (
              <ProgressBar value={company.onboarding.aiWorkforceProgress} label="AI Workforce" color="#A78BFA" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// LOADING SKELETON
// ============================================================================
function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ borderRadius: 16, background: CARD_BG, border: `1px solid ${BORDER}`,
          padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 16, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }} />
                <div style={{ height: 12, width: '40%', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
              </div>
              <div style={{ height: 20, width: 60, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[...Array(3)].map((_, j) => (
                <div key={j} style={{ height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
            <div style={{ height: 12, width: '50%', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// CSV EXPORT
// ============================================================================
function exportCSV(companies: Record<string, any>[]) {
  const headers = ['Name', 'Status', 'Counties', 'SEAI Reg', 'Team Size', 'Installs/Year', 'Website', 'Logo URL', 'MRR', 'Notes', 'Contacts', 'Deals', 'Created']
  const rows = companies.map(c => [
    c.name, c.status, c.counties, c.seaiReg, c.teamSize || '', c.installsPerYear || '',
    c.website, c.logoUrl || '',
    getCompanyMRR(c.deals) || 0,
    (c.notes || '').replace(/"/g, '""'),
    c._count?.contacts || 0, c._count?.deals || 0,
    new Date(c.createdAt).toLocaleDateString('en-IE'),
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `companies-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function CompaniesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<Record<string, any> | null>(null)
  const [deleteCompany, setDeleteCompany] = useState<Record<string, any> | null>(null)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // Debounced search (300ms)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }, [])

  // Reset page when filter/sort changes (inline, no useEffect)
  const handleStatusFilterChange = useCallback((key: string) => {
    setStatusFilter(key)
    setPage(1)
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value)
    setPage(1)
  }, [])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['companies', debouncedSearch, statusFilter, sortBy, sortOrder, page],
    queryFn: () =>
      fetch(`/api/crm/companies?search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}&sort=${sortBy}&order=${sortOrder}&limit=${LIMIT}&page=${page}`)
        .then((r) => r.json()),
  })

  const companies = data?.companies || []
  const pagination = data?.pagination || { total: 0, totalPages: 1, page: 1 }
  const total = pagination.total
  const totalPages = pagination.totalPages

  // Inject CSS animations (avoid hydration issues)
  useEffect(() => {
    const elId = 'companies-page-anim-styles'
    if (document.getElementById(elId)) return
    const s = document.createElement('style')
    s.id = elId
    s.textContent = `
      @keyframes crm-fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      @keyframes crm-fadeIn { from { opacity:0; } to { opacity:1; } }
      .crm-animate-in { animation: crm-fadeInUp 0.4s ease-out both; }
      .crm-fade-in { animation: crm-fadeIn 0.3s ease-out both; }
      .crm-dialog-backdrop { animation: crm-fadeIn 0.2s ease-out both; }
      .crm-dialog-card { animation: crm-fadeInUp 0.25s ease-out both; }
      .companies-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .companies-scroll::-webkit-scrollbar-track { background: transparent; }
      .companies-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      .companies-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
    `
    document.head.appendChild(s)
  }, [])

  return (
    <div style={{ background: `radial-gradient(ellipse at 50% 0%, ${DARK_CENTER} 0%, ${DARK} 70%)`, minHeight: '100vh' }}>
      <div style={{ padding: '24px clamp(16px, 4vw, 56px)', maxWidth: 1440, margin: '0 auto' }}>
        {/* Header */}
        <div className="crm-animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: TEXT_PRIMARY }}>Companies</h1>
              <span style={{ fontSize: 12, fontWeight: 600, background: `${YELLOW}15`, color: YELLOW,
                padding: '2px 10px', borderRadius: 20 }}>{total}</span>
            </div>
            <p style={{ fontSize: 14, color: TEXT_SECONDARY }}>{total} total companies</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => companies.length > 0 && exportCSV(companies)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10,
              border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT_SECONDARY,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = BORDER_HOVER; e.currentTarget.style.color = TEXT_PRIMARY }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_SECONDARY }}>
              <Download size={14} />Export CSV
            </button>
            <button onClick={() => setDialogOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
              border: 'none', background: YELLOW, color: '#1A1A1A', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(243,216,64,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <Plus size={16} />Add Company
            </button>
          </div>
        </div>

        {/* Search + Sort + Status Tabs */}
        <div className="crm-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28, animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TEXT_TERTIARY }} />
              <input value={search} onChange={(e) => handleSearchChange(e.target.value)} aria-label="Search companies"
                placeholder="Search companies, counties, SEAI..."
                style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10,
                  border: `1px solid ${BORDER}`, background: CARD_BG, color: TEXT_PRIMARY,
                  fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.currentTarget.style.borderColor = BORDER_HOVER}
                onBlur={(e) => e.currentTarget.style.borderColor = BORDER} />
            </div>
            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowUpDown size={14} style={{ color: TEXT_TERTIARY }} />
              <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)} aria-label="Sort by"
                style={{
                  padding: '8px 12px', borderRadius: 8, border: `1px solid ${BORDER}`,
                  background: CARD_BG, color: TEXT_PRIMARY, fontSize: 12, outline: 'none',
                  fontFamily: 'inherit', cursor: 'pointer',
                }}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: `1px solid ${BORDER}`,
                  background: CARD_BG, color: TEXT_PRIMARY, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minWidth: 36,
                  textAlign: 'center' as const,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = BORDER_HOVER }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER }}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.key
              const count = tab.key === '' ? total : companies.filter((c: any) => c.status === tab.key).length
              return (
                <button key={tab.key} onClick={() => handleStatusFilterChange(tab.key)} style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none',
                  background: isActive ? `${YELLOW}15` : 'transparent',
                  color: isActive ? YELLOW : TEXT_TERTIARY,
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {tab.label}
                  {isActive && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                      background: 'rgba(243,216,64,0.15)', color: YELLOW }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Company Cards Grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div className="crm-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(248,113,113,0.10)',
              border: '1px solid rgba(248,113,113,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <AlertTriangle size={24} style={{ color: RED }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>Failed to load companies</p>
            <p style={{ fontSize: 13, color: TEXT_TERTIARY, marginBottom: 8 }}>Check your connection and try again.</p>
            <button onClick={() => refetch()} style={{ padding: '8px 20px', borderRadius: 8, border: 'none',
              background: YELLOW, color: DARK, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
          </div>
        ) : companies.length === 0 ? (
          <div className="crm-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
            <Building2 size={48} style={{ color: TEXT_TERTIARY, marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>No companies found</p>
            <p style={{ fontSize: 13, color: TEXT_TERTIARY }}>{search ? 'Try adjusting your search' : 'Add your first company to get started'}</p>
            {!search && (
              <button onClick={() => setDialogOpen(true)} style={{ marginTop: 16, padding: '10px 20px',
                borderRadius: 10, border: 'none', background: YELLOW, color: DARK, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={16} />Add Company
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {companies.map((company: any, i: number) => (
                <CompanyCard key={company.id} company={company} index={i}
                  onEdit={() => setEditCompany(company)} onDelete={() => setDeleteCompany(company)} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="crm-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, padding: '12px 0', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: 13, color: TEXT_TERTIARY }}>
                  Showing {(pagination.page - 1) * LIMIT + 1}–{Math.min(pagination.page * LIMIT, total)} of {total}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent',
                    color: page <= 1 ? TEXT_TERTIARY : TEXT_SECONDARY, fontSize: 13, fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6, opacity: page <= 1 ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }} onMouseEnter={(e) => { if (page > 1) e.currentTarget.style.borderColor = BORDER_HOVER }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER }}>
                    <ChevronLeft size={14} />Previous
                  </button>
                  <span style={{ fontSize: 13, color: TEXT_SECONDARY, fontWeight: 500 }}>
                    Page {page} of {totalPages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent',
                    color: page >= totalPages ? TEXT_TERTIARY : TEXT_SECONDARY, fontSize: 13, fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6, opacity: page >= totalPages ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }} onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.borderColor = BORDER_HOVER }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER }}>
                    Next<ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddCompanyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <EditCompanyDialog open={!!editCompany} onOpenChange={(v) => { if (!v) setEditCompany(null) }} company={editCompany} />
      <DeleteConfirmDialog open={!!deleteCompany} onClose={() => setDeleteCompany(null)} company={deleteCompany} />
    </div>
  )
}
