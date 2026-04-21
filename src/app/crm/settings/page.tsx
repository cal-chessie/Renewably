'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCRM } from '@/components/crm/CRMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  User, Lock, Bell, Globe, Palette, Key,
  Monitor, Smartphone, Check, Copy, RefreshCw,
  Zap, Camera, Eye, EyeOff, AlertTriangle,
  Download, Wifi, LogOut, Fingerprint, Activity,
  ExternalLink, Users, CreditCard, X, Plus, Crown,
  FileText, Mail, Building2, Save, Sparkles, Shield,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════
const DS = {
  BG_PAGE: '#080808',
  BG_CENTER: '#0C0C0C',
  BG_CARD: '#141414',
  BG_ELEVATED: '#1A1A1A',
  BG_INPUT: '#0E0E0E',
  BORDER: 'rgba(255,255,255,0.05)',
  BORDER_HOVER: 'rgba(255,255,255,0.09)',
  YELLOW: '#F3D840',
  GREEN: '#10B981',
  RED: '#F87171',
  BLUE: '#60A5FA',
  PURPLE: '#A78BFA',
  PINK: '#F472B6',
  ORANGE: '#FB923C',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: 'rgba(255,255,255,0.65)',
  TEXT_TERTIARY: 'rgba(255,255,255,0.30)',
} as const

// ═══════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS NAVIGATION
// ═══════════════════════════════════════════════════════════════════
const SETTINGS_NAV = [
  { id: 'profile', label: 'Profile', icon: User, color: DS.YELLOW, desc: 'Personal info' },
  { id: 'account', label: 'Account', icon: Lock, color: DS.BLUE, desc: 'Security' },
  { id: 'notifications', label: 'Notifications', icon: Bell, color: DS.PURPLE, desc: 'Alerts' },
  { id: 'appearance', label: 'Appearance', icon: Palette, color: DS.PINK, desc: 'Display' },
  { id: 'integrations', label: 'Integrations', icon: Globe, color: DS.GREEN, desc: 'Connected apps' },
] as const

type SectionId = typeof SETTINGS_NAV[number]['id']

// ═══════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════
function Toggle({ checked, onChange, label, color = DS.YELLOW }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; color?: string
}) {
  return (
    <motion.button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      style={{
        width: 44, height: 26, borderRadius: 13,
        border: 'none',
        background: checked
          ? `linear-gradient(135deg, ${color}, ${color}BB)`
          : 'rgba(255,255,255,0.08)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.3s ease',
        padding: 0,
        flexShrink: 0,
        boxShadow: checked ? `0 2px 10px ${color}30` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 3, backgroundColor: checked ? '#000' : 'rgba(255,255,255,0.35)' }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        style={{ width: 20, height: 20, borderRadius: '50%', position: 'absolute', top: 3, left: 0 }}
      />
    </motion.button>
  )
}

function SettingsInput({ label, description, value, onChange, type = 'text', icon: Icon, placeholder }: {
  label: string; description: string; value: string; onChange: (v: string) => void;
  type?: string; icon?: React.ElementType; placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex items-center justify-between gap-6"
      style={{ padding: '16px 0', borderBottom: `1px solid ${DS.BORDER}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          {Icon && <Icon size={13} style={{ color: focused ? DS.YELLOW : DS.TEXT_TERTIARY, transition: 'color 0.2s' }} />}
          <label style={{ fontSize: 13, fontWeight: 600, color: DS.TEXT_PRIMARY }}>{label}</label>
        </div>
        <p style={{ fontSize: 11, color: DS.TEXT_TERTIARY, lineHeight: 1.5, paddingLeft: Icon ? 19 : 0, marginTop: 2 }}>
          {description}
        </p>
      </div>
      <div className="shrink-0" style={{ width: 260 }}>
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder}
          style={{
            width: '100%', background: DS.BG_INPUT,
            border: `1.5px solid ${focused ? DS.YELLOW : DS.BORDER}`,
            borderRadius: 9, padding: '9px 12px', fontSize: 13, fontWeight: 500,
            color: DS.TEXT_PRIMARY, outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            boxShadow: focused ? `0 0 0 3px ${DS.YELLOW}12` : 'none',
          }}
        />
      </div>
    </div>
  )
}

function ToggleRow({ icon: Icon, label, description, checked, onChange, color }: {
  icon: React.ElementType; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; color?: string
}) {
  const c = color || DS.YELLOW
  return (
    <div className="flex items-center justify-between gap-4"
      style={{ padding: '14px 0', borderBottom: `1px solid ${DS.BORDER}` }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: `${c}0D`, border: `1px solid ${c}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} style={{ color: c }} />
        </div>
        <div className="min-w-0">
          <p style={{ fontSize: 13, fontWeight: 600, color: DS.TEXT_PRIMARY, lineHeight: 1.3 }}>{label}</p>
          <p style={{ fontSize: 11, color: DS.TEXT_TERTIARY, lineHeight: 1.4, marginTop: 1 }}>{description}</p>
        </div>
      </div>
      <div className="shrink-0"><Toggle checked={checked} onChange={onChange} label={label} color={c} /></div>
    </div>
  )
}

function SectionCard({ title, icon: Icon, accentColor, children, id, badge }: {
  title: string; icon: React.ElementType; accentColor: string;
  children: React.ReactNode; id?: string; badge?: string
}) {
  return (
    <motion.div id={id} variants={scaleIn}
      style={{
        borderRadius: 16, background: DS.BG_CARD,
        border: `1px solid ${DS.BORDER}`, overflow: 'hidden', position: 'relative',
      }}
      whileHover={{ borderColor: DS.BORDER_HOVER }} transition={{ duration: 0.25 }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }}
      />
      <div style={{
        padding: '16px 24px', borderBottom: `1px solid ${DS.BORDER}`,
        background: `linear-gradient(180deg, ${accentColor}08 0%, transparent 100%)`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${accentColor}14`, border: `1px solid ${accentColor}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color: accentColor }} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: DS.TEXT_PRIMARY, flex: 1 }}>{title}</h3>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '3px 9px', borderRadius: 5, background: `${accentColor}12`,
            border: `1px solid ${accentColor}20`, color: accentColor }}>{badge}</span>
        )}
      </div>
      <div style={{ padding: '10px 24px 20px' }}>{children}</div>
    </motion.div>
  )
}

function ActionButton({ label, icon: BtnIcon, onClick, variant = 'default' }: {
  label: string; icon?: React.ElementType; onClick: () => void; variant?: 'default' | 'danger'
}) {
  const isDanger = variant === 'danger'
  const c = isDanger ? DS.RED : DS.TEXT_SECONDARY
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: 9,
        border: `1px solid ${isDanger ? `${c}20` : DS.BORDER}`,
        background: isDanger ? `${c}08` : 'rgba(255,255,255,0.03)',
        color: c, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 5,
      }}
    >
      {BtnIcon && <BtnIcon size={13} />}
      {label}
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PROFILE SECTION
// ═══════════════════════════════════════════════════════════════════
function ProfileSection({ profile, setProfile, hasChanges }: {
  profile: { name: string; email: string; company: string; phone: string; role: string }
  setProfile: (p: typeof profile) => void; hasChanges: boolean
}) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const res = await fetch('/api/crm/settings/logo', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setAvatarUrl(data.url)
      toast.success('Avatar uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <SectionCard title="Profile" icon={User} accentColor={DS.YELLOW} badge="Personal">
      {/* Avatar + name row */}
      <div className="flex items-center gap-4" style={{ padding: '20px 0', borderBottom: `1px solid ${DS.BORDER}` }}>
        <div className="relative shrink-0">
          <motion.div style={{
            width: 56, height: 56, borderRadius: 16,
            background: avatarUrl ? 'transparent' : `linear-gradient(145deg, ${DS.YELLOW}25, ${DS.YELLOW}08)`,
            border: `2px solid ${DS.YELLOW}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
          }} whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 800, color: DS.YELLOW }}>{initials}</span>
            )}
          </motion.div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              position: 'absolute', bottom: -3, right: -3,
              width: 24, height: 24, borderRadius: 7,
              background: DS.BG_ELEVATED, border: `1.5px solid ${DS.YELLOW}40`,
              cursor: uploading ? 'wait' : 'pointer', color: DS.YELLOW,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>
            {uploading ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={11} />}
          </motion.button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} style={{ display: 'none' }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 style={{ fontSize: 18, fontWeight: 800, color: DS.TEXT_PRIMARY }}>{profile.name || 'Your Name'}</h4>
            {hasChanges && (
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '2px 7px', borderRadius: 4, background: `${DS.YELLOW}18`,
                border: `1px solid ${DS.YELLOW}30`, color: DS.YELLOW }}>Unsaved</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: DS.TEXT_SECONDARY, fontWeight: 500 }}>
            {profile.role} at <span style={{ color: DS.YELLOW }}>{profile.company}</span>
          </p>
        </div>
      </div>

      <SettingsInput icon={User} label="Full Name" description="Display name"
        value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="John O'Brien" />
      <SettingsInput icon={Mail} label="Email" description="Login & notifications"
        value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} type="email" />
      <SettingsInput icon={Building2} label="Company" description="Organization"
        value={profile.company} onChange={(v) => setProfile({ ...profile, company: v })} />
      <SettingsInput icon={Smartphone} label="Phone" description="Visible to team"
        value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} type="tel" />

      {/* Password */}
      <div className="flex items-center justify-between" style={{ padding: '18px 0' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={13} style={{ color: DS.TEXT_TERTIARY }} />
            <label style={{ fontSize: 13, fontWeight: 600, color: DS.TEXT_PRIMARY }}>Password</label>
          </div>
          <p style={{ fontSize: 11, color: DS.TEXT_TERTIARY, paddingLeft: 19 }}>Last changed 14 days ago</p>
        </div>
        <ActionButton label="Change" icon={Key} onClick={() => setShowPasswordModal(true)} />
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 400, margin: '0 20px', borderRadius: 16, background: DS.BG_CARD,
                border: `1px solid ${DS.BORDER}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${DS.BORDER}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: DS.TEXT_PRIMARY }}>Change Password</h3>
                <p style={{ fontSize: 12, color: DS.TEXT_TERTIARY, marginTop: 3 }}>Enter current and new password</p>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Current Password', val: currentPassword, set: setCurrentPassword },
                  { label: 'New Password', val: newPassword, set: setNewPassword },
                  { label: 'Confirm Password', val: confirmPassword, set: setConfirmPassword },
                ].map((field) => (
                  <div key={field.label}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: DS.TEXT_SECONDARY, display: 'block', marginBottom: 5 }}>
                      {field.label}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPw ? 'text' : 'password'} value={field.val}
                        onChange={(e) => field.set(e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`}
                        style={{ width: '100%', background: DS.BG_INPUT, border: `1.5px solid ${DS.BORDER}`,
                          borderRadius: 9, padding: '9px 36px 9px 12px', fontSize: 13, fontWeight: 500,
                          color: DS.TEXT_PRIMARY, outline: 'none', fontFamily: 'inherit' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = DS.YELLOW }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = DS.BORDER }} />
                      <button onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: DS.TEXT_TERTIARY, padding: 4,
                      }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {field.label === 'Confirm Password' && confirmPassword && confirmPassword !== newPassword && (
                      <p style={{ fontSize: 11, color: DS.RED, marginTop: 3, fontWeight: 500 }}>Passwords do not match</p>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionButton label="Cancel" onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                  onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); toast.success('Password updated') }}
                  style={{ padding: '9px 18px', borderRadius: 9, border: 'none',
                    background: currentPassword && newPassword && newPassword === confirmPassword ? DS.YELLOW : 'rgba(243,216,64,0.15)',
                    color: currentPassword && newPassword && newPassword === confirmPassword ? '#000' : 'rgba(243,216,64,0.5)',
                    fontSize: 12, fontWeight: 700, cursor: currentPassword && newPassword && newPassword === confirmPassword ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', transition: 'all 0.3s ease' }}>
                  Update
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ACCOUNT SECTION
// ═══════════════════════════════════════════════════════════════════
function AccountSection() {
  const securityItems = [
    { label: 'Two-Factor Auth', status: true, icon: Fingerprint, desc: 'TOTP enabled' },
    { label: 'Password Strength', status: true, icon: Lock, desc: 'Strong (12 chars)' },
    { label: 'Email Verified', status: true, icon: Mail, desc: 'john@renewably.io' },
    { label: 'Recovery Phone', status: false, icon: Smartphone, desc: 'Not set up' },
  ]

  return (
    <SectionCard title="Account" icon={Lock} accentColor={DS.BLUE} badge="Security">
      {/* Security items — 2x2 grid with generous spacing */}
      <div style={{ paddingBottom: 24, borderBottom: `1px solid ${DS.BORDER}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {securityItems.map((item) => {
            const c = item.status ? DS.GREEN : DS.ORANGE
            return (
              <motion.div
                key={item.label}
                whileHover={{ borderColor: `${c}25`, y: -1 }}
                style={{
                  padding: '18px 16px', borderRadius: 14,
                  background: `linear-gradient(135deg, ${c}08, ${c}03)`,
                  border: `1px solid ${c}15`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: `${c}12`, border: `1px solid ${c}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 12px ${c}08` }}>
                    <item.icon size={16} style={{ color: c }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13, fontWeight: 600, color: DS.TEXT_PRIMARY, letterSpacing: '-0.01em' }}>{item.label}</span>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: c,
                        boxShadow: `0 0 8px ${c}60` }} />
                    </div>
                    <span style={{ fontSize: 11.5, color: DS.TEXT_TERTIARY, marginTop: 4, display: 'block' }}>{item.desc}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Active Sessions */}
      <div style={{ paddingTop: 24 }}>
        <div className="flex items-center gap-2.5" style={{ marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8,
            background: `${DS.BLUE}10`, border: `1px solid ${DS.BLUE}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wifi size={13} style={{ color: DS.BLUE }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: DS.BLUE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Active Sessions
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: DS.TEXT_TERTIARY,
            padding: '2px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', marginLeft: 4 }}>
            2 devices
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { device: 'MacBook Pro', location: 'Dublin, Ireland', time: 'Active now', icon: Monitor, current: true },
            { device: 'iPhone 15 Pro', location: 'Dublin, Ireland', time: '2h ago', icon: Smartphone, current: false },
          ].map((s) => (
            <motion.div
              key={s.device}
              whileHover={{ borderColor: `${DS.BLUE}20` }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 18px', borderRadius: 14,
                background: s.current ? `linear-gradient(135deg, ${DS.GREEN}06, transparent)` : 'rgba(255,255,255,0.015)',
                border: `1px solid ${s.current ? `${DS.GREEN}15` : DS.BORDER}`,
                transition: 'border-color 0.2s ease',
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: `${DS.BLUE}0D`, border: `1px solid ${DS.BLUE}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} style={{ color: DS.BLUE }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: DS.TEXT_PRIMARY, letterSpacing: '-0.01em' }}>{s.device}</span>
                  {s.current && (
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px',
                      borderRadius: 5, background: `${DS.GREEN}12`, border: `1px solid ${DS.GREEN}20`,
                      color: DS.GREEN, letterSpacing: '0.04em' }}>Current</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 12, color: DS.TEXT_TERTIARY }}>{s.location}</span>
                  <span style={{ color: DS.TEXT_TERTIARY, fontSize: 8 }}>&middot;</span>
                  <span style={{ fontSize: 12, color: s.current ? DS.GREEN : DS.TEXT_TERTIARY, fontWeight: s.current ? 600 : 400 }}>
                    {s.time}
                  </span>
                </div>
              </div>
              {!s.current && (
                <ActionButton label="Revoke" variant="danger" onClick={() => toast.success('Session revoked')} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATIONS SECTION
// ═══════════════════════════════════════════════════════════════════
function NotificationsSection({ notifs, setNotifs }: {
  notifs: { emailDeals: boolean; emailTasks: boolean; pushDeals: boolean; pushMessages: boolean; desktopSounds: boolean }
  setNotifs: (n: typeof notifs) => void
}) {
  const toggle = (key: keyof typeof notifs) => setNotifs({ ...notifs, [key]: !notifs[key] })
  return (
    <SectionCard title="Notifications" icon={Bell} accentColor={DS.PURPLE} badge="Alerts">
      <ToggleRow icon={Bell} label="Deal Updates" description="Stage changes and new assignments"
        checked={notifs.emailDeals} onChange={() => toggle('emailDeals')} color={DS.PURPLE} />
      <ToggleRow icon={Activity} label="Task Reminders" description="Daily digest of overdue and upcoming"
        checked={notifs.emailTasks} onChange={() => toggle('emailTasks')} color={DS.PURPLE} />
      <ToggleRow icon={Mail} label="Message Alerts" description="Push for new messages and mentions"
        checked={notifs.pushMessages} onChange={() => toggle('pushMessages')} color={DS.PURPLE} />
      <ToggleRow icon={Zap} label="Sound Effects" description="Audio cues for new notifications"
        checked={notifs.desktopSounds} onChange={() => toggle('desktopSounds')} color={DS.PURPLE} />
      <div style={{ height: 6 }} />
    </SectionCard>
  )
}

// ═══════════════════════════════════════════════════════════════════
// APPEARANCE SECTION
// ═══════════════════════════════════════════════════════════════════
function AppearanceSection() {
  const [theme, setTheme] = useState('dark')
  const themes = [
    { id: 'dark', label: 'Dark', glow: DS.YELLOW, preview: ['#080808', '#141414', '#F3D840'] },
    { id: 'midnight', label: 'Midnight', glow: DS.BLUE, preview: ['#06080F', '#0F1628', '#60A5FA'] },
    { id: 'warm', label: 'Warm Dark', glow: DS.ORANGE, preview: ['#0F0A06', '#1A130C', '#FB923C'] },
  ]
  return (
    <SectionCard title="Appearance" icon={Palette} accentColor={DS.PINK} badge="Display">
      {/* Theme picker */}
      <div style={{ paddingBottom: 24, borderBottom: `1px solid ${DS.BORDER}` }}>
        <div className="flex items-center gap-2.5" style={{ marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8,
            background: `${DS.PINK}10`, border: `1px solid ${DS.PINK}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={13} style={{ color: DS.PINK }} />
          </div>
          <label style={{ fontSize: 13, fontWeight: 600, color: DS.TEXT_PRIMARY }}>Theme</label>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {themes.map((t) => {
            const active = theme === t.id
            return (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTheme(t.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  padding: '18px 14px', borderRadius: 14,
                  border: `1.5px solid ${active ? t.glow : DS.BORDER}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: active ? `linear-gradient(135deg, ${t.glow}0C, ${t.glow}05)` : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.25s ease',
                  boxShadow: active ? `0 0 0 3px ${t.glow}15, 0 4px 16px ${t.glow}10` : 'none',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {active && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${t.glow}60, transparent)` }} />
                )}
                {/* Theme preview swatch */}
                <div style={{
                  width: '100%', height: 40, borderRadius: 8, overflow: 'hidden',
                  background: t.preview[0], border: `1px solid ${t.glow}15`,
                  display: 'flex', alignItems: 'stretch',
                }}>
                  <div style={{ flex: 1, background: t.preview[1] }} />
                  <div style={{ width: 12, background: t.preview[2], borderRadius: '0 7px 7px 0' }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 500,
                    color: active ? t.glow : DS.TEXT_SECONDARY }}>
                    {t.label}
                  </span>
                  {active && <Check size={11} style={{ color: t.glow }} />}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Animations toggle */}
      <div style={{ paddingTop: 20 }}>
        <ToggleRow icon={Sparkles} label="Animations" description="Smooth transitions and micro-interactions"
          checked={true} onChange={() => {}} color={DS.PINK} />
      </div>
    </SectionCard>
  )
}

// ═══════════════════════════════════════════════════════════════════
// INTEGRATIONS SECTION
// ═══════════════════════════════════════════════════════════════════
function IntegrationsSection() {
  const integrations = [
    { name: 'Google Workspace', desc: 'Calendar, email, docs sync', connected: true, color: '#34A853', letter: 'G' },
    { name: 'Stripe', desc: 'Payment processing & billing', connected: false, color: '#635BFF', letter: 'S' },
    { name: 'Claude', desc: 'AI assistant for deal insights', connected: false, color: '#D97757', letter: 'C' },
    { name: 'Postmark', desc: 'Transactional email delivery', connected: true, color: '#F45E52', letter: 'P' },
    { name: 'Telegram', desc: 'Instant deal alerts & chat', connected: false, color: '#2AABEE', letter: 'T' },
    { name: 'WhatsApp', desc: 'Client messaging via WhatsApp', connected: false, color: '#25D366', letter: 'W' },
    { name: 'Twilio', desc: 'SMS, voice & phone verification', connected: false, color: '#F22F46', letter: 'Tw' },
    { name: 'Supabase', desc: 'Database & backend services', connected: true, color: '#3FCF8E', letter: 'Su' },
    { name: 'PandaDoc', desc: 'Document generation & e-sign', connected: false, color: '#48BB78', letter: 'PD' },
  ]

  return (
    <SectionCard title="Integrations" icon={Globe} accentColor={DS.GREEN} badge={`${integrations.filter(i => i.connected).length} connected`}>
      <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {integrations.map((integ) => (
          <motion.div key={integ.name} whileHover={{ y: -1, borderColor: `${integ.color}25` }}
            style={{ padding: '14px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
              background: `linear-gradient(135deg, ${integ.color}06, transparent)`, border: `1px solid ${DS.BORDER}`,
              cursor: 'pointer', transition: 'border-color 0.2s ease' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: `${integ.color}12`, border: `1px solid ${integ.color}20`,
              fontWeight: 800, fontSize: 14, color: integ.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {integ.letter}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 600, color: DS.TEXT_PRIMARY, marginBottom: 1 }}>{integ.name}</p>
              <p style={{ fontSize: 11, color: DS.TEXT_TERTIARY, lineHeight: 1.4 }}>{integ.desc}</p>
            </div>
            {integ.connected ? (
              <span className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg"
                style={{ fontSize: 10, fontWeight: 700, color: DS.GREEN, textTransform: 'uppercase', letterSpacing: '0.04em',
                  background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.18)` }}>
                <Check size={10} /> Live
              </span>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => toast.info(`${integ.name} setup coming soon`)}
                style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${integ.color}25`,
                  background: `${integ.color}0D`, color: integ.color,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Connect
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </SectionCard>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { user } = useCRM()
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [profile, setProfile] = useState({
    name: user?.name || 'Cal Chesters',
    email: user?.email || 'admin@renewably.ie',
    company: 'Renewably',
    phone: '+353 87 395 8424',
    role: user?.role || 'Admin',
  })
  const [notifications, setNotifications] = useState({
    emailDeals: true, emailTasks: true, pushDeals: true, pushMessages: true, desktopSounds: true,
  })

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev, name: user.name || prev.name, email: user.email || prev.email, role: user.role || prev.role,
      }))
    }
  }, [user])

  const initialRef = useRef(true)
  useEffect(() => {
    if (initialRef.current) { initialRef.current = false; return }
    setHasUnsavedChanges(true)
  }, [profile, notifications])

  // Scroll tracking
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const handleScroll = () => {
      const midPoint = main.scrollTop + main.clientHeight * 0.35
      let active: SectionId = SETTINGS_NAV[0].id
      for (const item of SETTINGS_NAV) {
        const el = document.getElementById(`section-${item.id}`)
        if (el && el.offsetTop <= midPoint) active = item.id
      }
      if (main.scrollTop + main.clientHeight >= main.scrollHeight - 30) {
        active = SETTINGS_NAV[SETTINGS_NAV.length - 1].id
      }
      setActiveSection(active)
    }
    main.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => main.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 900))
    setSaving(false)
    setHasUnsavedChanges(false)
    toast.success('Settings saved')
  }, [])

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges && !saving) handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [hasUnsavedChanges, saving, handleSave])

  return (
    <div style={{ background: `radial-gradient(ellipse at 50% 0%, ${DS.BG_CENTER} 0%, ${DS.BG_PAGE} 70%)`, minHeight: '100%', position: 'relative' }}>
      <motion.div variants={stagger} initial="hidden" animate="visible"
        style={{ padding: '36px 48px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}
        className="settings-wrap">

        {/* Accent bar */}
        <div style={{ height: 3, borderRadius: 2,
          background: `linear-gradient(90deg, transparent, ${DS.YELLOW} 20%, ${DS.YELLOW}80 50%, ${DS.YELLOW}80%, transparent)` }} />

        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div style={{ width: 4, height: 24, borderRadius: 2,
                background: `linear-gradient(180deg, ${DS.YELLOW}, ${DS.YELLOW}40)` }} />
              <h1 style={{ fontSize: 24, fontWeight: 800, color: DS.TEXT_PRIMARY, letterSpacing: '-0.03em' }}>Settings</h1>
            </div>
            <p style={{ fontSize: 13, color: DS.TEXT_TERTIARY, paddingLeft: 16 }}>Account, preferences & integrations</p>
          </div>
          <motion.button whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(243,216,64,0.30)' }}
            whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 shrink-0"
            style={{ padding: '9px 22px', borderRadius: 10, border: 'none',
              background: saving || !hasUnsavedChanges ? 'rgba(243,216,64,0.15)' : DS.YELLOW,
              color: saving || !hasUnsavedChanges ? `${DS.YELLOW}80` : '#000',
              fontSize: 12, fontWeight: 700, cursor: saving || !hasUnsavedChanges ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.3s ease',
              boxShadow: hasUnsavedChanges && !saving ? '0 4px 16px rgba(243,216,64,0.25)' : 'none' }}>
            {saving ? <RefreshCw size={14} /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </motion.div>

        {/* Sidebar + Sections */}
        <div className="flex gap-8" style={{ minHeight: 0 }}>
          {/* Sidebar */}
          <motion.nav variants={fadeUp} className="hidden lg:block shrink-0"
            style={{ width: 224, position: 'sticky', top: 32, alignSelf: 'flex-start' }}>
            <div style={{ borderRadius: 14, background: DS.BG_CARD, border: `1px solid ${DS.BORDER}`,
              padding: '4px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {SETTINGS_NAV.map((item, i) => {
                const isActive = activeSection === item.id
                return (
                  <motion.button key={item.id}
                    onClick={() => {
                      setActiveSection(item.id)
                      const el = document.getElementById(`section-${item.id}`)
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.03 }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.2s ease',
                      background: isActive ? `linear-gradient(135deg, ${item.color}12, ${item.color}06)` : 'transparent',
                      color: isActive ? item.color : DS.TEXT_SECONDARY }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = DS.TEXT_PRIMARY } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.TEXT_SECONDARY } }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: isActive ? `${item.color}14` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? `${item.color}22` : 'transparent'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                      <item.icon size={14} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                    {isActive && (
                      <motion.div layoutId="settingsNav" className="shrink-0"
                        style={{ width: 5, height: 5, borderRadius: '50%', background: item.color,
                          boxShadow: `0 0 6px ${item.color}70` }} />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.nav>

          {/* Sections */}
          <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <motion.div id="section-profile" variants={fadeUp}>
              <ProfileSection profile={profile} setProfile={setProfile} hasChanges={hasUnsavedChanges} />
            </motion.div>
            <motion.div id="section-account" variants={fadeUp}>
              <AccountSection />
            </motion.div>
            <motion.div id="section-notifications" variants={fadeUp}>
              <NotificationsSection notifs={notifications} setNotifs={setNotifications} />
            </motion.div>
            <motion.div id="section-appearance" variants={fadeUp}>
              <AppearanceSection />
            </motion.div>
            <motion.div id="section-integrations" variants={fadeUp}>
              <IntegrationsSection />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Sticky save bar */}
      <AnimatePresence>
        {hasUnsavedChanges && !saving && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
              padding: '10px 20px', borderRadius: 14, background: DS.BG_ELEVATED,
              border: `1px solid ${DS.YELLOW}30`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(243,216,64,0.10)',
              display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(12px)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: DS.YELLOW,
              boxShadow: `0 0 6px ${DS.YELLOW}60` }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: DS.TEXT_SECONDARY }}>Unsaved changes</span>
            <div style={{ width: 1, height: 18, background: DS.BORDER }} />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSave}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: DS.YELLOW,
                color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5 }}>
              <Save size={12} /> Save
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 480px) { .settings-wrap { padding: 20px 16px !important; } }
      `}</style>
    </div>
  )
}
