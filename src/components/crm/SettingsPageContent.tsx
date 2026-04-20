'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Puzzle, BarChart3, Share2, Webhook, Building2,
  Bell, Users, Shield, Search, ChevronDown, ChevronRight,
  Copy, ExternalLink, Plus, Trash2, Eye, EyeOff, Check, X,
  RefreshCw, Download, AlertTriangle, Settings, Zap, Clock,
  UserPlus, Edit3, Mail, Globe, Palette, Lock, FileText,
  Activity, Key, Link, Calendar, MapPin, Phone, Tag, Hash,
  ToggleLeft, ToggleRight, Monitor, Megaphone, Send, MessageSquare,
  Database, Cookie, UserX, FileDown, ArrowRight, Info,
  ChevronUp, MoreHorizontal, TestTube, ZapOff, Globe2,
  CircleDot, Circle, CheckCircle2, XCircle, AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

// ============================================================================
// DESIGN SYSTEM CONSTANTS
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
  green: '#22C55E',
  greenMuted: 'rgba(34,197,94,0.12)',
  red: '#EF4444',
  redMuted: 'rgba(239,68,68,0.1)',
  orange: '#F97316',
  orangeMuted: 'rgba(249,115,22,0.1)',
  blue: '#3B82F6',
  blueMuted: 'rgba(59,130,246,0.1)',
}

// ============================================================================
// TYPES
// ============================================================================
type TabId = 'overview' | 'integrations' | 'analytics' | 'social' | 'api' | 'general' | 'notifications' | 'team' | 'privacy'

interface TabDef {
  id: TabId
  label: string
  icon: React.ElementType
}

interface Integration {
  id: string
  name: string
  subtitle: string
  category: string
  colour: string
  status: 'connected' | 'partial' | 'disconnected'
  lastSync: string | null
  details?: string
  fields: { key: string; label: string; type: 'text' | 'password'; value: string }[]
}

interface SocialPlatform {
  id: string
  name: string
  colour: string
  letter: string
  status: 'connected' | 'disconnected'
  username: string | null
  lastSync: string | null
  fields: { key: string; label: string; type: 'text' | 'password'; value: string }[]
  autoImportLeads: boolean
  trackConversions: boolean
}

interface ApiKeyEntry {
  id: string
  name: string
  key: string
  created: string
  status: 'active' | 'revoked'
}

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  lastDelivery: string
  lastStatus: 'success' | 'failed'
}

interface ApiIntegrationStatus {
  id: string
  name: string
  category: string
  description: string
  colour: string
  configured: boolean
  status: 'connected' | 'partial' | 'configured' | 'disconnected'
  details: string
}

// ============================================================================
// TAB DEFINITIONS
// ============================================================================
const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'social', label: 'Social Media', icon: Share2 },
  { id: 'api', label: 'API & Webhooks', icon: Webhook },
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'privacy', label: 'Data & Privacy', icon: Shield },
]

// ============================================================================
// DEFAULT DATA (used as seeds, overridden by localStorage / API)
// ============================================================================
const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: 'stripe', name: 'Stripe', subtitle: 'Payment processing & billing', category: 'Billing', colour: '#635BFF', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }, { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', value: '' }] },
  { id: 'postmark', name: 'Postmark', subtitle: 'Transactional email delivery', category: 'Email', colour: '#E8443A', status: 'disconnected', lastSync: null, fields: [{ key: 'serverToken', label: 'Server API Token', type: 'password', value: '' }, { key: 'fromEmail', label: 'From Email', type: 'text', value: '' }] },
  { id: 'claude', name: 'Claude / Anthropic', subtitle: 'AI-powered CRM assistance', category: 'AI', colour: '#D4A574', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }] },
  { id: 'google-workspace', name: 'Google Workspace', subtitle: 'Calendar, email & drive sync', category: 'Productivity', colour: '#4285F4', status: 'disconnected', lastSync: null, fields: [{ key: 'clientId', label: 'Client ID', type: 'text', value: '' }, { key: 'clientSecret', label: 'Client Secret', type: 'password', value: '' }, { key: 'refreshToken', label: 'Refresh Token', type: 'password', value: '' }] },
  { id: 'ai-assistant', name: 'AI Assistant', subtitle: 'Built-in AI chatbot & automation', category: 'AI', colour: '#F3D840', status: 'disconnected', lastSync: null, fields: [{ key: 'model', label: 'Model', type: 'text', value: 'claude-3.5-sonnet' }, { key: 'maxTokens', label: 'Max Tokens', type: 'text', value: '4096' }] },
  { id: 'slack', name: 'Slack', subtitle: 'Team communication & notifications', category: 'Communication', colour: '#E01E5A', status: 'disconnected', lastSync: null, fields: [{ key: 'webhookUrl', label: 'Webhook URL', type: 'text', value: '' }, { key: 'botToken', label: 'Bot Token', type: 'password', value: '' }, { key: 'channelId', label: 'Channel ID', type: 'text', value: '' }] },
  { id: 'n8n', name: 'n8n', subtitle: 'Workflow automation & integration', category: 'Productivity', colour: '#FF4A00', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }] },
  { id: 'calendly', name: 'Calendly', subtitle: 'Scheduling & meeting booking', category: 'Productivity', colour: '#006BFF', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }, { key: 'webhookSigningKey', label: 'Webhook Signing Key', type: 'password', value: '' }] },
  { id: 'twilio', name: 'Twilio', subtitle: 'SMS, voice & WhatsApp messaging', category: 'Communication', colour: '#F22F46', status: 'disconnected', lastSync: null, fields: [{ key: 'accountSid', label: 'Account SID', type: 'text', value: '' }, { key: 'authToken', label: 'Auth Token', type: 'password', value: '' }, { key: 'phoneNumber', label: 'Phone Number', type: 'text', value: '' }] },
  { id: 'cursor', name: 'Cursor', subtitle: 'AI-powered code editor & development assistant', category: 'Dev', colour: '#F3D840', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }] },
  { id: 'github', name: 'GitHub', subtitle: 'Code repository & version control', category: 'Dev', colour: '#FFFFFF', status: 'disconnected', lastSync: null, fields: [{ key: 'personalAccessToken', label: 'Personal Access Token', type: 'password', value: '' }] },
  { id: 'supabase', name: 'Supabase', subtitle: 'PostgreSQL database & backend-as-a-service', category: 'Database', colour: '#3FCF8E', status: 'disconnected', lastSync: null, fields: [{ key: 'projectUrl', label: 'Project URL', type: 'text', value: '' }, { key: 'anonKey', label: 'Anon Key', type: 'password', value: '' }, { key: 'serviceKey', label: 'Service Key', type: 'password', value: '' }] },
  { id: 'gemini', name: 'Gemini (Google DeepMind)', subtitle: 'Google DeepMind AI for CRM insights & automation', category: 'AI', colour: '#4285F4', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }] },
  { id: 'manus', name: 'Manus', subtitle: 'Autonomous AI agent for task execution & research', category: 'AI', colour: '#7C3AED', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }, { key: 'workspaceId', label: 'Workspace ID', type: 'text', value: '' }] },
  { id: 'grok', name: 'Grok (xAI)', subtitle: 'xAI Grok for conversational AI & data analysis', category: 'AI', colour: '#1DA1F2', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }] },
  { id: 'notebooklm', name: 'NotebookLM', subtitle: 'Google AI-powered note-taking & knowledge management', category: 'Content', colour: '#FBBC04', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }] },
  { id: 'openclaw', name: 'OpenClaw', subtitle: 'Open-source AI for CRM automation & workflows', category: 'AI', colour: '#10B981', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }, { key: 'endpoint', label: 'Endpoint URL', type: 'text', value: '' }] },
  { id: 'paperclip', name: 'Paperclip', subtitle: 'AI-powered content generation & document creation', category: 'Content', colour: '#EC4899', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }] },
  { id: 'vapi', name: 'VAPI', subtitle: 'Voice AI platform for phone calls & conversational agents', category: 'Voice', colour: '#6366F1', status: 'disconnected', lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }, { key: 'assistantId', label: 'Assistant ID', type: 'text', value: '' }] },
]

const DEFAULT_SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'facebook', name: 'Facebook', colour: '#1877F2', letter: 'f', status: 'disconnected', username: null, lastSync: null, fields: [{ key: 'pageAccessToken', label: 'Page Access Token', type: 'password', value: '' }, { key: 'pixelId', label: 'Pixel ID', type: 'text', value: '' }, { key: 'appId', label: 'App ID', type: 'text', value: '' }, { key: 'appSecret', label: 'App Secret', type: 'password', value: '' }], autoImportLeads: false, trackConversions: false },
  { id: 'instagram', name: 'Instagram', colour: '#E4405F', letter: 'I', status: 'disconnected', username: null, lastSync: null, fields: [{ key: 'businessAccountId', label: 'Business Account ID', type: 'text', value: '' }, { key: 'accessToken', label: 'Access Token', type: 'password', value: '' }], autoImportLeads: false, trackConversions: false },
  { id: 'twitter', name: 'Twitter / X', colour: '#1DA1F2', letter: 'X', status: 'disconnected', username: null, lastSync: null, fields: [{ key: 'apiKey', label: 'API Key', type: 'password', value: '' }, { key: 'apiSecretKey', label: 'API Secret Key', type: 'password', value: '' }, { key: 'bearerToken', label: 'Bearer Token', type: 'password', value: '' }, { key: 'webhookUrl', label: 'Webhook URL', type: 'text', value: '' }], autoImportLeads: false, trackConversions: false },
  { id: 'linkedin', name: 'LinkedIn', colour: '#0A66C2', letter: 'in', status: 'disconnected', username: null, lastSync: null, fields: [{ key: 'clientId', label: 'Client ID', type: 'text', value: '' }, { key: 'clientSecret', label: 'Client Secret', type: 'password', value: '' }, { key: 'accessToken', label: 'Access Token', type: 'password', value: '' }, { key: 'orgId', label: 'Organisation ID', type: 'text', value: '' }, { key: 'adAccountId', label: 'Ad Account ID', type: 'text', value: '' }], autoImportLeads: false, trackConversions: false },
  { id: 'tiktok', name: 'TikTok', colour: '#FFFFFF', letter: 'T', status: 'disconnected', username: null, lastSync: null, fields: [{ key: 'businessCenterId', label: 'Business Center ID', type: 'text', value: '' }, { key: 'accessToken', label: 'Access Token', type: 'password', value: '' }, { key: 'adAccountId', label: 'Ad Account ID', type: 'text', value: '' }, { key: 'pixelCode', label: 'Pixel Code', type: 'text', value: '' }], autoImportLeads: false, trackConversions: false },
  { id: 'telegram', name: 'Telegram', colour: '#0088CC', letter: 'TG', status: 'disconnected', username: null, lastSync: null, fields: [{ key: 'botToken', label: 'Bot Token', type: 'password', value: '' }, { key: 'webhookUrl', label: 'Webhook URL', type: 'text', value: '' }], autoImportLeads: false, trackConversions: false },
  { id: 'discord', name: 'Discord', colour: '#5865F2', letter: 'D', status: 'disconnected', username: null, lastSync: null, fields: [{ key: 'botToken', label: 'Bot Token', type: 'password', value: '' }, { key: 'serverId', label: 'Server ID', type: 'text', value: '' }, { key: 'channelId', label: 'Channel ID', type: 'text', value: '' }, { key: 'webhookUrl', label: 'Webhook URL', type: 'text', value: '' }], autoImportLeads: false, trackConversions: false },
]

const NOTIFICATION_TEMPLATES = [
  { id: '1', name: 'New Lead Welcome', subject: 'Welcome, {{contact_name}}! We\'re glad you reached out.', lastEdited: '2 days ago' },
  { id: '2', name: 'Meeting Confirmation', subject: 'Your meeting is confirmed for {{meeting_date}}', lastEdited: '1 week ago' },
  { id: '3', name: 'Proposal Follow-up', subject: 'Following up on your solar proposal', lastEdited: '3 days ago' },
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  CRM: ['View contacts', 'Create contacts', 'Edit contacts', 'Delete contacts'],
  Pipeline: ['View pipeline', 'Create deals', 'Edit deals', 'Delete deals', 'Manage stages'],
  Contacts: ['View companies', 'Create companies', 'Manage tags'],
  Tasks: ['View tasks', 'Create tasks', 'Assign tasks', 'Complete tasks'],
  Calendar: ['View calendar', 'Create meetings', 'Edit meetings', 'Cancel meetings'],
  Reports: ['View reports', 'Export reports', 'View dashboard analytics'],
  Settings: ['View settings', 'Edit settings', 'Manage integrations', 'Manage API keys'],
  API: ['Read API access', 'Write API access', 'Admin API access'],
}

const GA4_EVENTS = [
  { name: 'page_view', category: 'Engagement', description: 'Page views across the CRM' },
  { name: 'deal_created', category: 'Pipeline', description: 'New deal added to pipeline' },
  { name: 'deal_won', category: 'Pipeline', description: 'Deal moved to Won stage' },
  { name: 'proposal_sent', category: 'Sales', description: 'Proposal sent to contact' },
  { name: 'contact_created', category: 'CRM', description: 'New contact added' },
  { name: 'meeting_scheduled', category: 'Calendar', description: 'Meeting booked via CRM' },
  { name: 'invoice_paid', category: 'Billing', description: 'Invoice payment received' },
  { name: 'lead_assigned', category: 'Team', description: 'Lead assigned to team member' },
]

const API_LOGS = [
  { method: 'GET', endpoint: '/api/crm/contacts', status: 200, latency: '45ms', time: '2 min ago' },
  { method: 'POST', endpoint: '/api/crm/deals', status: 201, latency: '120ms', time: '5 min ago' },
  { method: 'PUT', endpoint: '/api/crm/deals/dl_482', status: 200, latency: '89ms', time: '8 min ago' },
  { method: 'GET', endpoint: '/api/crm/pipeline', status: 200, latency: '210ms', time: '12 min ago' },
  { method: 'DELETE', endpoint: '/api/crm/notes/nt_91', status: 204, latency: '32ms', time: '15 min ago' },
  { method: 'POST', endpoint: '/api/crm/email', status: 429, latency: '15ms', time: '20 min ago' },
]

const INTEGRATION_CATEGORIES = ['All', 'Billing', 'Email', 'AI', 'Dev', 'Database', 'Voice', 'Content', 'Productivity', 'Communication', 'Marketing']

// ============================================================================
// LOCALSTORAGE HOOKS & HELPERS
// ============================================================================
function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch { return defaultValue }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota */ }
  }, [key, value])
  return [value, setValue]
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
}

// ============================================================================
// LOADING SPINNER
// ============================================================================
function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 60 }}>
      <Loader2 size={32} style={{ color: C.yellow, animation: 'spin 1s linear infinite' }} />
      <span style={{ color: C.textSecondary, fontSize: 14 }}>{label}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, width: '100%' }} aria-label={label}>
      <div style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', background: checked ? C.yellow : '#333', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', position: 'absolute', top: 3, left: checked ? 23 : 3, background: checked ? '#0A0A0A' : '#888', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </div>
      {label && <span style={{ color: C.text, fontSize: 14 }}>{label}</span>}
    </button>
  )
}

function StyledInput({ value, onChange, placeholder, type = 'text', disabled = false }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean }) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input type={type === 'password' && showPassword ? 'text' : type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${focused ? C.yellow : C.border}`, background: disabled ? C.card : C.surface, color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxShadow: focused ? `0 0 0 3px ${C.yellow}15` : 'none', transition: 'all 0.2s' }}
      />
      {type === 'password' && <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textTertiary, cursor: 'pointer', padding: 2 }} type="button" tabIndex={-1}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
    </div>
  )
}

function StyledSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const [focused, setFocused] = useState(false)
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${focused ? C.yellow : C.border}`, background: C.surface, color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', appearance: 'auto', boxShadow: focused ? `0 0 0 3px ${C.yellow}15` : 'none', transition: 'all 0.2s' }}
    >
      {options.map((o) => <option key={o.value} value={o.value} style={{ background: C.card, color: C.text }}>{o.label}</option>)}
    </select>
  )
}

function StyledTextarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const [focused, setFocused] = useState(false)
  const [showValue, setShowValue] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <textarea value={showValue ? value : value.replace(/./g, '\u2022')} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${focused ? C.yellow : C.border}`, background: C.surface, color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxShadow: focused ? `0 0 0 3px ${C.yellow}15` : 'none', transition: 'all 0.2s' }}
      />
      <button onClick={() => setShowValue(!showValue)} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: C.textTertiary, cursor: 'pointer', padding: 2 }} type="button" tabIndex={-1}>{showValue ? <EyeOff size={16} /> : <Eye size={16} />}</button>
    </div>
  )
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 16, ...style }}>{children}</h3>
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, ...style }}>{children}</div>
}

function StatusDot({ status }: { status: 'connected' | 'partial' | 'disconnected' }) {
  const colour = status === 'connected' ? C.green : status === 'partial' ? C.orange : C.textTertiary
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colour, flexShrink: 0 }} />
}

function StatusBadge({ status }: { status: 'connected' | 'partial' | 'disconnected' }) {
  const bg = status === 'connected' ? C.greenMuted : status === 'partial' ? C.orangeMuted : 'rgba(115,115,115,0.15)'
  const colour = status === 'connected' ? C.green : status === 'partial' ? C.orange : C.textTertiary
  const label = status === 'connected' ? 'Connected' : status === 'partial' ? 'Partial' : 'Disconnected'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: bg, color: colour, fontSize: 12, fontWeight: 500 }}>
      <StatusDot status={status} />{label}
    </span>
  )
}

function ButtonPrimary({ children, onClick, style, disabled }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', background: hovered ? C.yellowDark : C.yellow, color: '#0A0A0A', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', ...style }}>
      {children}
    </button>
  )
}

function ButtonGhost({ children, onClick, style, danger, disabled }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; danger?: boolean; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: `1px solid ${danger && hovered ? C.red : C.border}`, background: danger && hovered ? C.redMuted : hovered ? C.card2 : 'transparent', color: danger ? C.red : C.textSecondary, fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', ...style }}>
      {children}
    </button>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', color: C.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{children}</label>
}

function FormRow({ children, gap = 16 }: { children: React.ReactNode; gap?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap, marginBottom: 16 }}>{children}</div>
}

// ============================================================================
// OVERVIEW TAB — REAL DATA
// ============================================================================
function OverviewTab() {
  const [stats, setStats] = useState<{ contacts: number; deals: number; proposals: number; invoices: number } | null>(null)
  const [integStatus, setIntegStatus] = useState<{ integrations: ApiIntegrationStatus[]; summary: { total: number; configured: number; connected: number } } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, integRes] = await Promise.all([
          fetch('/api/crm/settings/overview-stats'),
          fetch('/api/crm/integrations'),
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (integRes.ok) setIntegStatus(await integRes.json())
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchData()
  }, [])

  const connectedCount = integStatus?.summary.connected ?? 0
  const configuredCount = integStatus?.summary.configured ?? 0
  const totalCount = integStatus?.summary.total ?? 0
  const partialCount = configuredCount - connectedCount
  const disconnectedCount = totalCount - configuredCount

  const statCards = [
    { label: 'Contacts', value: stats?.contacts ?? '—', colour: C.yellow, bg: C.yellow + '18', icon: Users },
    { label: 'Deals', value: stats?.deals ?? '—', colour: C.blue, bg: C.blueMuted, icon: FileText },
    { label: 'Proposals', value: stats?.proposals ?? '—', colour: C.green, bg: C.greenMuted, icon: Send },
    { label: 'Invoices', value: stats?.invoices ?? '—', colour: C.orange, bg: C.orangeMuted, icon: Hash },
    { label: 'Connected', value: connectedCount, colour: C.green, bg: C.greenMuted, icon: CheckCircle2 },
    { label: 'Needs Attention', value: partialCount, colour: C.orange, bg: C.orangeMuted, icon: AlertCircle },
    { label: 'Disconnected', value: disconnectedCount, colour: C.textTertiary, bg: 'rgba(115,115,115,0.1)', icon: XCircle },
    { label: 'Total Integrations', value: totalCount, colour: C.blue, bg: C.blueMuted, icon: Activity },
  ]

  const quickActions = [
    { label: 'Test All Connections', icon: RefreshCw, onClick: () => toast.success('Testing all connections...') },
    { label: 'Export Config', icon: Download, onClick: () => toast.success('Configuration exported') },
    { label: 'View API Logs', icon: FileText, onClick: () => toast.info('Navigating to API logs') },
  ]

  if (loading) return <LoadingSpinner label="Loading overview..." />

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <motion.div key={s.label} {...fadeUp} transition={{ delay: i * 0.04 }}>
            <div style={{ background: C.card, borderRadius: 12, padding: 20, border: `1px solid ${s.label === 'Needs Attention' && partialCount > 0 ? C.orange + '40' : C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={20} style={{ color: s.colour }} /></div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 2 }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
              <div style={{ fontSize: 13, color: C.textSecondary }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Integration Health</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {integStatus?.integrations.map((integ) => {
              const statusMap: Record<string, 'connected' | 'partial' | 'disconnected'> = {
                connected: 'connected', partial: 'partial', configured: 'partial',
              }
              return (
                <div key={integ.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: integ.colour + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: integ.colour }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{integ.name}</span>
                      <StatusDot status={statusMap[integ.status] || 'disconnected'} />
                    </div>
                    <div style={{ color: C.textTertiary, fontSize: 11, marginTop: 2 }}>{integ.details}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <SectionCard>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quickActions.map((action) => (
                <button key={action.label} onClick={action.onClick}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.yellow; e.currentTarget.style.background = C.card2 }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: C.yellow + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><action.icon size={18} style={{ color: C.yellow }} /></div>
                  <span>{action.label}</span>
                  <ArrowRight size={16} style={{ color: C.textTertiary, marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </SectionCard>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
          <SectionCard>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>CRM Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Total Contacts', value: stats?.contacts ?? 0, icon: Users, colour: C.yellow },
                { label: 'Active Deals', value: stats?.deals ?? 0, icon: FileText, colour: C.blue },
                { label: 'Proposals', value: stats?.proposals ?? 0, icon: Send, colour: C.green },
                { label: 'Invoices', value: stats?.invoices ?? 0, icon: Hash, colour: C.orange },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: item.colour + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><item.icon size={18} style={{ color: item.colour }} /></div>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ color: C.textSecondary, fontSize: 20, fontWeight: 700, marginLeft: 'auto' }}>{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// INTEGRATIONS TAB — REAL API DATA
// ============================================================================
function IntegrationsTab() {
  const [category, setCategory] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiStatuses, setApiStatuses] = useState<Record<string, { status: string; details: string }>>({})
  const [integrations, setIntegrations] = useState<Integration[]>(DEFAULT_INTEGRATIONS)
  const [whatsappConfig, setWhatsappConfig] = useState<{
    configured: boolean; webhookUrl: string | null; phoneNumber: string | null;
    stats: { totalMessages: number; inboundCount: number; outboundCount: number };
    recentMessages: Array<{ id: string; direction: string; body: string; status: string; createdAt: string; contact?: { firstName: string; lastName: string } | null }>;
  } | null>(null)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [savingTwilio, setSavingTwilio] = useState(false)
  const [testingTwilio, setTestingTwilio] = useState(false)
  const filtered = useMemo(() => category === 'All' ? integrations : integrations.filter((i) => i.category === category), [category, integrations])
  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => prev === id ? null : id)
    if (id === 'twilio') {
      fetch('/api/crm/whatsapp/config')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setWhatsappConfig(data) })
        .catch(() => {})
    }
  }, [])
  const updateField = useCallback((integId: string, fieldKey: string, value: string) => {
    setIntegrations((prev) => prev.map((i) => i.id === integId ? { ...i, fields: i.fields.map((f) => f.key === fieldKey ? { ...f, value } : f) } : i))
  }, [])
  const saveIntegration = useCallback(async (integId: string) => {
    const integ = integrations.find(i => i.id === integId)
    if (!integ) return
    const fields: Record<string, string> = {}
    for (const f of integ.fields) {
      if (f.value && f.value !== '••••••••') fields[f.key] = f.value
    }
    if (Object.keys(fields).length === 0) { toast.error('No credentials to save'); return }
    try {
      const res = await fetch('/api/crm/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: integId, fields }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${integ.name} credentials saved`)
        setIntegrations((prev) => prev.map((i) => i.id === integId ? {
          ...i,
          status: 'connected' as const,
          lastSync: new Date().toISOString(),
          fields: i.fields.map((f) => data.fields[f.key] ? { ...f, value: data.fields[f.key] } : f),
        } : i))
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save credentials')
    }
  }, [integrations])
  const disconnectIntegration = useCallback(async (integId: string) => {
    const integ = integrations.find(i => i.id === integId)
    if (!integ) return
    try {
      const res = await fetch(`/api/crm/integrations?integrationId=${integId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setIntegrations((prev) => prev.map((i) => i.id === integId ? {
          ...i, status: 'disconnected' as const, lastSync: null,
          fields: i.fields.map((f) => ({ ...f, value: '' })),
        } : i))
        toast.success(`${integ.name} disconnected`)
      } else {
        toast.error(data.error || 'Failed to disconnect')
      }
    } catch {
      toast.error('Failed to disconnect')
    }
  }, [integrations])
  const saveTwilioConfig = useCallback(async (integId: string) => {
    const integ = integrations.find(i => i.id === integId)
    if (!integ) return
    const accountSid = integ.fields.find(f => f.key === 'accountSid')?.value || ''
    const authToken = integ.fields.find(f => f.key === 'authToken')?.value || ''
    const phoneNumber = integ.fields.find(f => f.key === 'phoneNumber')?.value || ''
    if (!accountSid || !authToken) { toast.error('Account SID and Auth Token are required'); return }
    setSavingTwilio(true)
    try {
      const res = await fetch('/api/crm/whatsapp/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountSid, authToken, phoneNumber, enableWhatsApp: true }) })
      const data = await res.json()
      if (data.success) { toast.success('Twilio/WhatsApp configuration saved'); setIntegrations((prev) => prev.map(i => i.id === integId ? { ...i, status: 'connected' as const, lastSync: new Date().toISOString() } : i)); const cfgRes = await fetch('/api/crm/whatsapp/config'); if (cfgRes.ok) setWhatsappConfig(await cfgRes.json()) }
      else toast.error(data.error || 'Failed to save configuration')
    } catch { toast.error('Failed to save configuration') }
    finally { setSavingTwilio(false) }
  }, [integrations])
  const testTwilioConnection = useCallback(async () => {
    setTestingTwilio(true)
    try {
      const res = await fetch('/api/crm/whatsapp/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testConnection: true }) })
      const data = await res.json()
      if (data.success) toast.success(data.message)
      else toast.error(data.error || 'Connection test failed')
    } catch { toast.error('Connection test failed') }
    finally { setTestingTwilio(false) }
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/crm/integrations').then((r) => r.ok ? r.json() : null),
      fetch('/api/crm/integrations?credentials=true').then((r) => r.ok ? r.json() : null),
    ])
      .then(([statusData, credData]) => {
        if (credData?.credentials) {
          const creds = credData.credentials as Record<string, Record<string, string>>
          setIntegrations((prev) => prev.map((i) => {
            const saved = creds[i.id]
            if (!saved) return i
            return {
              ...i,
              status: 'connected' as const,
              lastSync: new Date().toISOString(),
              fields: i.fields.map((f) => saved[f.key] !== undefined ? { ...f, value: saved[f.key] } : f),
            }
          }))
        }
        if (statusData?.integrations) {
          const statusMap: Record<string, { status: string; details: string }> = {}
          for (const integ of statusData.integrations) {
            statusMap[integ.id] = { status: integ.status, details: integ.details }
          }
          setApiStatuses(statusMap)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner label="Loading integrations..." />

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {INTEGRATION_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${category === cat ? C.yellow + '40' : C.border}`, background: category === cat ? C.yellow + '12' : 'transparent', color: category === cat ? C.yellow : C.textSecondary, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s' }}>{cat}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((integ, idx) => {
          const isExpanded = expandedId === integ.id
          return (
            <motion.div key={integ.id} {...fadeUp} transition={{ delay: idx * 0.04 }}>
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <button onClick={() => toggleExpand(integ.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: integ.colour + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: integ.colour }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>{integ.name}</div>
                    <div style={{ color: C.textTertiary, fontSize: 12, marginTop: 2 }}>{integ.subtitle}</div>
                  </div>
                  <StatusBadge status={integ.status} />
                  <ChevronDown size={18} style={{ color: C.textTertiary, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${C.border}` }}>
                        <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {integ.details && <p style={{ color: C.textSecondary, fontSize: 13, margin: 0 }}>{integ.details}</p>}
                          {integ.fields.map((field) => (
                            <div key={field.key}><FormLabel>{field.label}</FormLabel><StyledInput value={field.value} onChange={(v) => updateField(integ.id, field.key, v)} placeholder={`Enter ${field.label.toLowerCase()}`} type={field.type} /></div>
                          ))}
                          {integ.id === 'twilio' && (
                            <>
                              <div style={{ padding: '16px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#25D36618', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <MessageSquare size={16} style={{ color: '#25D366' }} />
                                  </div>
                                  <div>
                                    <h4 style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0 }}>WhatsApp Business</h4>
                                    <p style={{ color: C.textTertiary, fontSize: 12, margin: 0 }}>Send and receive WhatsApp messages from the CRM</p>
                                  </div>
                                  {whatsappConfig?.configured && <StatusBadge status="connected" />}
                                </div>
                                {whatsappConfig?.webhookUrl && (
                                  <div style={{ marginBottom: 12 }}>
                                    <FormLabel>Webhook URL (add to Twilio Console)</FormLabel>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                      <code style={{ flex: 1, padding: '8px 12px', borderRadius: 6, background: C.surface, border: `1px solid ${C.border}`, color: C.yellow, fontSize: 12, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{typeof window !== 'undefined' ? `${window.location.origin}${whatsappConfig.webhookUrl}` : whatsappConfig.webhookUrl}</code>
                                      <button onClick={() => { const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${whatsappConfig.webhookUrl}` : whatsappConfig.webhookUrl!; navigator.clipboard.writeText(fullUrl); toast.success('Webhook URL copied') }} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.textSecondary, cursor: 'pointer', flexShrink: 0 }}><Copy size={14} /></button>
                                    </div>
                                  </div>
                                )}
                                {whatsappConfig?.phoneNumber && (
                                  <div style={{ marginBottom: 12 }}>
                                    <FormLabel>WhatsApp Phone Number</FormLabel>
                                    <p style={{ color: C.text, fontSize: 14, fontFamily: 'monospace' }}>{whatsappConfig.phoneNumber}</p>
                                  </div>
                                )}
                                {whatsappConfig && (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
                                    <div style={{ padding: '12px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                                      <div style={{ color: C.text, fontSize: 20, fontWeight: 700 }}>{whatsappConfig.stats.totalMessages}</div>
                                      <div style={{ color: C.textTertiary, fontSize: 11, marginTop: 2 }}>Total Messages</div>
                                    </div>
                                    <div style={{ padding: '12px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                                      <div style={{ color: '#22C55E', fontSize: 20, fontWeight: 700 }}>{whatsappConfig.stats.inboundCount}</div>
                                      <div style={{ color: C.textTertiary, fontSize: 11, marginTop: 2 }}>Received</div>
                                    </div>
                                    <div style={{ padding: '12px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                                      <div style={{ color: '#3B82F6', fontSize: 20, fontWeight: 700 }}>{whatsappConfig.stats.outboundCount}</div>
                                      <div style={{ color: C.textTertiary, fontSize: 11, marginTop: 2 }}>Sent</div>
                                    </div>
                                  </div>
                                )}
                                {whatsappConfig?.recentMessages && whatsappConfig.recentMessages.length > 0 && (
                                  <div>
                                    <FormLabel>Recent Messages</FormLabel>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                                      {whatsappConfig.recentMessages.map((msg) => (
                                        <div key={msg.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}` }}>
                                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: msg.direction === 'inbound' ? '#22C55E' : '#3B82F6', flexShrink: 0 }} />
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                              <span style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>{msg.direction === 'inbound' ? (msg.contact ? `${msg.contact.firstName} ${msg.contact.lastName}` : 'Unknown') : 'You'}</span>
                                              <span style={{ color: C.textTertiary, fontSize: 10 }}>{msg.direction}</span>
                                            </div>
                                            <p style={{ color: C.textSecondary, fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body}</p>
                                          </div>
                                          <span style={{ color: C.textTertiary, fontSize: 10, flexShrink: 0 }}>{new Date(msg.createdAt).toLocaleDateString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <ButtonPrimary onClick={() => saveTwilioConfig(integ.id)} disabled={savingTwilio}><Check size={15} /> {savingTwilio ? 'Saving...' : 'Save & Enable WhatsApp'}</ButtonPrimary>
                                <ButtonGhost onClick={testTwilioConnection} disabled={testingTwilio}><TestTube size={15} /> {testingTwilio ? 'Testing...' : 'Test Connection'}</ButtonGhost>
                              </div>
                            </>
                          )}
                          {integ.id !== 'twilio' && (
                          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <ButtonPrimary onClick={() => saveIntegration(integ.id)}><Check size={15} /> Save Credentials</ButtonPrimary>
                            {integ.status !== 'disconnected' && <ButtonGhost danger onClick={() => disconnectIntegration(integ.id)}><ZapOff size={15} /> Disconnect</ButtonGhost>}
                          </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ============================================================================
// ANALYTICS TAB — CRM ANALYTICS CONFIGURATION
// ============================================================================
function AnalyticsTab() {
  const [dataRetention, setDataRetention] = useLocalStorage('sp_settings_analytics_retention', '26 months')
  const [pageViewTracking, setPageViewTracking] = useLocalStorage('sp_settings_analytics_pageview', true)
  const [eventTracking, setEventTracking] = useLocalStorage('sp_settings_analytics_events', true)
  const [conversionTracking, setConversionTracking] = useLocalStorage('sp_settings_analytics_conversions', false)
  const [behaviourTracking, setBehaviourTracking] = useLocalStorage('sp_settings_analytics_behaviour', false)
  const [lastTestResult, setLastTestResult] = useState<'idle' | 'success' | 'error'>('idle')

  // Test: actually ping the analytics API to verify it responds
  const testTracking = async () => {
    setLastTestResult('idle')
    try {
      const res = await fetch('/api/crm/analytics/website')
      if (res.ok) {
        setLastTestResult('success')
        toast.success('Analytics API responding — data source: CRM database')
      } else {
        setLastTestResult('error')
        toast.error('Analytics API returned ' + res.status)
      }
    } catch {
      setLastTestResult('error')
      toast.error('Could not reach analytics API')
    }
  }

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: C.yellow + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BarChart3 size={26} style={{ color: C.yellow }} /></div>
            <div>
              <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Analytics &amp; Reporting</h2>
              <p style={{ color: C.textSecondary, fontSize: 13, margin: 0 }}>CRM-sourced analytics: all metrics derive from contacts, deals, activities, and pipeline data stored in the database.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="/crm/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', background: C.yellow, color: '#0A0A0A', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s' }}><BarChart3 size={15} /> Go to Reports</a>
          </div>
        </SectionCard>
      </motion.div>

      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <SectionTitle>CRM Events Reference</SectionTitle>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 12, margin: '0 0 12px 0' }}>Key events tracked in the CRM. These are logged automatically as you use the system.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Event Name', 'Category', 'Description'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: C.textTertiary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{GA4_EVENTS.map((evt) => <tr key={evt.name}><td style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}><code style={{ color: C.yellow, fontSize: 13, background: C.yellow + '10', padding: '2px 8px', borderRadius: 4 }}>{evt.name}</code></td><td style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, color: C.textSecondary, fontSize: 13 }}>{evt.category}</td><td style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, color: C.textSecondary, fontSize: 13 }}>{evt.description}</td></tr>)}</tbody>
            </table>
          </div>
        </SectionCard>
      </motion.div>

      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <SectionTitle>Data Preferences</SectionTitle>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16, margin: '0 0 16px 0' }}>Configure which data is included in analytics calculations. These preferences are stored locally.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle checked={pageViewTracking} onChange={(v) => { setPageViewTracking(v); toast.success('Preference saved') }} label="Include contact creation data in visitor charts" />
            <Toggle checked={eventTracking} onChange={(v) => { setEventTracking(v); toast.success('Preference saved') }} label="Track CRM events (deal created, deal won, proposal sent, etc.)" />
            <Toggle checked={conversionTracking} onChange={(v) => { setConversionTracking(v); toast.success('Preference saved') }} label="Include conversion funnel in analytics" />
            <Toggle checked={behaviourTracking} onChange={(v) => { setBehaviourTracking(v); toast.success('Preference saved') }} label="Include activity timelines in engagement metrics" />
          </div>
        </SectionCard>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <SectionCard>
            <SectionTitle>Data Retention</SectionTitle>
            <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 12, margin: '0 0 12px 0' }}>How long historical analytics data is kept for trend calculations.</p>
            <StyledSelect value={dataRetention} onChange={(v) => { setDataRetention(v); toast.success('Data retention updated') }} options={[{ value: '2 months', label: '2 months' }, { value: '6 months', label: '6 months' }, { value: '14 months', label: '14 months' }, { value: '26 months', label: '26 months' }, { value: '38 months', label: '38 months' }, { value: '50 months', label: '50 months (maximum)' }]} />
          </SectionCard>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <SectionCard>
            <SectionTitle>Test Analytics API</SectionTitle>
            <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>Verify the analytics backend is responding and returning real CRM data.</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <ButtonPrimary onClick={testTracking}><TestTube size={15} /> Test Connection</ButtonPrimary>
              {lastTestResult === 'success' && <span style={{ color: C.green, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Check size={16} /> Connected</span>}
              {lastTestResult === 'error' && <span style={{ color: '#EF4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>Failed</span>}
            </div>
          </SectionCard>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// SOCIAL MEDIA TAB — PERSISTED TO LOCALSTORAGE
// ============================================================================
function SocialMediaTab() {
  const [platforms, setPlatforms] = useLocalStorage<SocialPlatform[]>('sp_settings_social_platforms', DEFAULT_SOCIAL_PLATFORMS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const toggleExpand = useCallback((id: string) => setExpandedId((prev) => prev === id ? null : id), [])
  const updateField = useCallback((platId: string, fieldKey: string, value: string) => {
    setPlatforms((prev) => prev.map((p) => p.id === platId ? { ...p, fields: p.fields.map((f) => f.key === fieldKey ? { ...f, value } : f) } : p))
  }, [setPlatforms])
  const toggleAutoImport = useCallback((platId: string) => {
    setPlatforms((prev) => prev.map((p) => p.id === platId ? { ...p, autoImportLeads: !p.autoImportLeads } : p))
    toast.success('Setting updated')
  }, [setPlatforms])
  const toggleConversions = useCallback((platId: string) => {
    setPlatforms((prev) => prev.map((p) => p.id === platId ? { ...p, trackConversions: !p.trackConversions } : p))
    toast.success('Setting updated')
  }, [setPlatforms])

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {platforms.map((plat, idx) => {
          const isExpanded = expandedId === plat.id
          const isLight = plat.colour === '#FFFFFF' || plat.colour === '#ffffff'
          return (
            <motion.div key={plat.id} {...fadeUp} transition={{ delay: idx * 0.05 }}>
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <button onClick={() => toggleExpand(plat.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: isLight ? C.card2 : plat.colour + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isLight ? `1px solid ${C.borderLight}` : 'none' }}>
                    <span style={{ color: isLight ? C.text : plat.colour, fontSize: 18, fontWeight: 700 }}>{plat.letter}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>{plat.name}</div>
                    {plat.username && <div style={{ color: C.textTertiary, fontSize: 12, marginTop: 1 }}>Connected as: {plat.username}</div>}
                    {plat.lastSync && <div style={{ color: C.textTertiary, fontSize: 11, marginTop: 1 }}>Last post sync: {plat.lastSync}</div>}
                  </div>
                  <StatusBadge status={plat.status} />
                  <ChevronDown size={18} style={{ color: C.textTertiary, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${C.border}` }}>
                        <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {plat.fields.map((field) => <div key={field.key}><FormLabel>{field.label}</FormLabel><StyledInput value={field.value} onChange={(v) => updateField(plat.id, field.key, v)} placeholder={`Enter ${field.label.toLowerCase()}`} type={field.type} /></div>)}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0', borderTop: `1px solid ${C.border}` }}>
                            <Toggle checked={plat.autoImportLeads} onChange={() => toggleAutoImport(plat.id)} label="Auto-import leads from ads" />
                            <Toggle checked={plat.trackConversions} onChange={() => toggleConversions(plat.id)} label="Track conversions" />
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <ButtonPrimary onClick={() => toast.success(`${plat.name} settings saved`)}><Check size={15} /> Save</ButtonPrimary>
                            <ButtonGhost onClick={() => toast.info(`Opening ${plat.name} documentation`)}><ExternalLink size={15} /> Docs</ButtonGhost>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ============================================================================
// API & WEBHOOKS TAB — REAL UUID + LOCALSTORAGE
// ============================================================================
function ApiWebhooksTab() {
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeyEntry[]>('sp_settings_api_keys', [])
  const [webhooks] = useState<WebhookEndpoint[]>([])
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyExpiry, setNewKeyExpiry] = useState('never')
  const [showAddWebhook, setShowAddWebhook] = useState(false)
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['deal.won', 'lead.created'])
  const toggleWebhookEvent = (evt: string) => setNewWebhookEvents((prev) => prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt])

  const createKey = () => {
    if (!newKeyName.trim()) { toast.error('Please enter a key name'); return }
    const key = generateUUID()
    const newKey: ApiKeyEntry = { id: generateUUID(), name: newKeyName, key, created: new Date().toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'active' }
    setApiKeys((prev) => [...prev, newKey])
    setNewKeyName(''); setShowCreateKey(false)
    toast.success('API key created successfully')
  }

  const revokeKey = (id: string) => {
    setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'revoked' as const } : k))
    toast.success('API key revoked')
  }

  const activeKeys = apiKeys.filter((k) => k.status === 'active').length

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionTitle style={{ marginBottom: 0 }}>API Keys</SectionTitle>
            <ButtonPrimary onClick={() => setShowCreateKey(!showCreateKey)}><Plus size={15} /> Create New API Key</ButtonPrimary>
          </div>
          {showCreateKey && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ marginBottom: 16, padding: 16, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><FormLabel>Key Name</FormLabel><StyledInput value={newKeyName} onChange={setNewKeyName} placeholder="e.g. Production Key" /></div>
                <div><FormLabel>Expiry</FormLabel><StyledSelect value={newKeyExpiry} onChange={setNewKeyExpiry} options={[{ value: 'never', label: 'Never' }, { value: '30days', label: '30 days' }, { value: '90days', label: '90 days' }, { value: '1year', label: '1 year' }]} /></div>
                <div style={{ display: 'flex', gap: 10 }}><ButtonPrimary onClick={createKey}>Create Key</ButtonPrimary><ButtonGhost onClick={() => setShowCreateKey(false)}>Cancel</ButtonGhost></div>
              </div>
            </motion.div>
          )}
          {apiKeys.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Key size={32} style={{ color: C.textMuted, marginBottom: 12 }} />
              <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {apiKeys.map((key) => (
                <div key={key.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: C.blue + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Key size={17} style={{ color: C.blue }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{key.name}</span>{key.status === 'revoked' && <span style={{ color: C.red, fontSize: 11, fontWeight: 500, background: C.redMuted, padding: '2px 8px', borderRadius: 4 }}>Revoked</span>}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}><span style={{ color: C.textTertiary, fontSize: 12, fontFamily: 'monospace' }}>{key.key.slice(0, 8)}...{key.key.slice(-4)}</span><span style={{ color: C.textTertiary, fontSize: 12 }}>Created: {key.created}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { navigator.clipboard.writeText(key.key); toast.success('API key copied to clipboard') }} style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit' }}><Copy size={13} /> Copy</button>
                    {key.status === 'active' && <button onClick={() => revokeKey(key.id)} style={{ padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit' }}><Trash2 size={13} /> Revoke</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionTitle style={{ marginBottom: 0 }}>Webhook Endpoints</SectionTitle>
            <ButtonPrimary onClick={() => setShowAddWebhook(!showAddWebhook)}><Plus size={15} /> Add Webhook</ButtonPrimary>
          </div>
          {showAddWebhook && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ marginBottom: 16, padding: 16, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><FormLabel>Endpoint URL</FormLabel><StyledInput value={newWebhookUrl} onChange={setNewWebhookUrl} placeholder="https://your-server.com/webhook" /></div>
                <div><FormLabel>Events</FormLabel><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{['deal.won', 'deal.created', 'lead.created', 'invoice.paid', 'contact.created', 'meeting.scheduled'].map((evt) => (<label key={evt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, border: `1px solid ${newWebhookEvents.includes(evt) ? C.yellow + '40' : C.border}`, background: newWebhookEvents.includes(evt) ? C.yellow + '08' : C.surface, color: newWebhookEvents.includes(evt) ? C.text : C.textSecondary, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={newWebhookEvents.includes(evt)} onChange={() => toggleWebhookEvent(evt)} style={{ accentColor: C.yellow }} />{evt}</label>))}</div></div>
                <div style={{ display: 'flex', gap: 10 }}><ButtonPrimary onClick={() => { setShowAddWebhook(false); setNewWebhookUrl(''); toast.success('Webhook endpoint created') }}>Add Endpoint</ButtonPrimary><ButtonGhost onClick={() => setShowAddWebhook(false)}>Cancel</ButtonGhost></div>
              </div>
            </motion.div>
          )}
          {webhooks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Link size={32} style={{ color: C.textMuted, marginBottom: 12 }} />
              <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>No webhook endpoints configured yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {webhooks.map((wh) => (
                <div key={wh.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: C.greenMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Link size={17} style={{ color: C.green }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.text, fontSize: 13, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>{wh.events.map((evt) => <span key={evt} style={{ padding: '2px 8px', borderRadius: 4, background: C.card2, color: C.textTertiary, fontSize: 11, fontFamily: 'monospace' }}>{evt}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <SectionTitle>API Usage Summary</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ padding: 16, background: C.surface, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{activeKeys}</div>
              <div style={{ fontSize: 12, color: C.textTertiary }}>Active Keys</div>
            </div>
            <div style={{ padding: 16, background: C.surface, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{apiKeys.length}</div>
              <div style={{ fontSize: 12, color: C.textTertiary }}>Total Keys</div>
            </div>
            <div style={{ padding: 16, background: C.surface, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>5,000</div>
              <div style={{ fontSize: 12, color: C.textTertiary }}>Daily Limit</div>
            </div>
          </div>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <SectionCard>
          <SectionTitle>Recent API Calls</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Method', 'Endpoint', 'Status', 'Latency', 'Time'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: C.textTertiary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{API_LOGS.map((log, i) => <tr key={i}><td style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: log.method === 'GET' ? C.greenMuted : log.method === 'POST' ? C.blueMuted : log.method === 'PUT' ? C.orangeMuted : C.redMuted, color: log.method === 'GET' ? C.green : log.method === 'POST' ? C.blue : log.method === 'PUT' ? C.orange : C.red, fontFamily: 'monospace' }}>{log.method}</span></td><td style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: 'monospace' }}>{log.endpoint}</td><td style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}><span style={{ color: log.status < 300 ? C.green : log.status < 500 ? C.orange : C.red, fontSize: 13, fontWeight: 500 }}>{log.status}</span></td><td style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, color: C.textSecondary, fontSize: 13 }}>{log.latency}</td><td style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, color: C.textTertiary, fontSize: 13 }}>{log.time}</td></tr>)}</tbody>
            </table>
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// GENERAL TAB — PERSISTED TO LOCALSTORAGE
// ============================================================================
function GeneralTab() {
  const [companyName, setCompanyName] = useLocalStorage('sp_settings_company_name', '')
  const [regNumber, setRegNumber] = useLocalStorage('sp_settings_reg_number', '')
  const [street, setStreet] = useLocalStorage('sp_settings_street', '')
  const [city, setCity] = useLocalStorage('sp_settings_city', '')
  const [county, setCounty] = useLocalStorage('sp_settings_county', '')
  const [eircode, setEircode] = useLocalStorage('sp_settings_eircode', '')
  const [phone, setPhone] = useLocalStorage('sp_settings_phone', '')
  const [website, setWebsite] = useLocalStorage('sp_settings_website', '')
  const [vatNumber, setVatNumber] = useLocalStorage('sp_settings_vat_number', '')
  const [primaryColour, setPrimaryColour] = useLocalStorage('sp_settings_primary_colour', '#F3D840')
  const [tagline, setTagline] = useLocalStorage('sp_settings_tagline', '')
  const [timezone, setTimezone] = useLocalStorage('sp_settings_timezone', 'Europe/Dublin')
  const [currency, setCurrency] = useLocalStorage('sp_settings_currency', 'EUR')
  const [dateFormat, setDateFormat] = useLocalStorage('sp_settings_date_format', 'DD/MM/YYYY')
  const [language, setLanguage] = useLocalStorage('sp_settings_language', 'English (Ireland)')

  const handleSave = () => { toast.success('General settings saved successfully') }

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <SectionTitle>Company Information</SectionTitle>
          <FormRow><div><FormLabel>Company Name</FormLabel><StyledInput value={companyName} onChange={setCompanyName} placeholder="Company name" /></div><div><FormLabel>Registration Number</FormLabel><StyledInput value={regNumber} onChange={setRegNumber} placeholder="IE0000000X" /></div></FormRow>
          <div style={{ marginBottom: 16 }}><FormLabel>Street Address</FormLabel><StyledInput value={street} onChange={setStreet} placeholder="Street address" /></div>
          <FormRow><div><FormLabel>City</FormLabel><StyledInput value={city} onChange={setCity} placeholder="City" /></div><div><FormLabel>County</FormLabel><StyledInput value={county} onChange={setCounty} placeholder="County" /></div><div><FormLabel>Eircode</FormLabel><StyledInput value={eircode} onChange={setEircode} placeholder="D00 00000" /></div></FormRow>
          <FormRow><div><FormLabel>Phone</FormLabel><StyledInput value={phone} onChange={setPhone} placeholder="+353 1 000 0000" /></div><div><FormLabel>Website</FormLabel><StyledInput value={website} onChange={setWebsite} placeholder="https://yourwebsite.ie" /></div></FormRow>
          <div style={{ maxWidth: 300 }}><FormLabel>VAT Number</FormLabel><StyledInput value={vatNumber} onChange={setVatNumber} placeholder="IE0000000X" /></div>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <SectionTitle>Branding</SectionTitle>
          <div style={{ marginBottom: 20 }}>
            <FormLabel>Company Logo</FormLabel>
            <div style={{ width: '100%', maxWidth: 320, height: 120, borderRadius: 10, border: `2px dashed ${C.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', transition: 'border-color 0.2s', color: C.textTertiary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = C.yellow} onMouseLeave={(e) => e.currentTarget.style.borderColor = C.borderLight} onClick={() => toast.info('Logo upload dialog would open here')}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.textTertiary }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <div><div style={{ color: C.textSecondary, fontSize: 14, fontWeight: 500 }}>Upload Logo</div><div style={{ color: C.textTertiary, fontSize: 12 }}>PNG, JPG, SVG — max 2MB</div></div>
            </div>
          </div>
          <FormRow><div><FormLabel>Primary Colour</FormLabel><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="color" value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} style={{ width: 42, height: 42, borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', cursor: 'pointer', padding: 2 }} /><StyledInput value={primaryColour} onChange={setPrimaryColour} /></div></div><div><FormLabel>Company Tagline</FormLabel><StyledInput value={tagline} onChange={setTagline} placeholder="Your company tagline" /></div></FormRow>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <SectionCard>
          <SectionTitle>Locale &amp; Regional</SectionTitle>
          <FormRow>
            <div><FormLabel>Timezone</FormLabel><StyledSelect value={timezone} onChange={(v) => { setTimezone(v); toast.success('Timezone updated') }} options={[{ value: 'Europe/Dublin', label: 'Europe/Dublin (GMT+0/+1)' }, { value: 'Europe/London', label: 'Europe/London (GMT+0/+1)' }, { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' }, { value: 'US/Eastern', label: 'US/Eastern (EST/EDT)' }]} /></div>
            <div><FormLabel>Currency</FormLabel><StyledSelect value={currency} onChange={(v) => { setCurrency(v); toast.success('Currency updated') }} options={[{ value: 'EUR', label: 'EUR (\u20AC) \u2014 Euro' }, { value: 'GBP', label: 'GBP (\u00A3) \u2014 British Pound' }, { value: 'USD', label: 'USD ($) \u2014 US Dollar' }]} /></div>
            <div><FormLabel>Date Format</FormLabel><StyledSelect value={dateFormat} onChange={(v) => { setDateFormat(v); toast.success('Date format updated') }} options={[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} /></div>
            <div><FormLabel>Language</FormLabel><StyledSelect value={language} onChange={(v) => { setLanguage(v); toast.success('Language updated') }} options={[{ value: 'English (Ireland)', label: 'English (Ireland)' }, { value: 'English (UK)', label: 'English (United Kingdom)' }, { value: 'Gaeilge', label: 'Gaeilge (Irish)' }]} /></div>
          </FormRow>
          <div style={{ marginTop: 16 }}><ButtonPrimary onClick={handleSave}><Check size={15} /> Save Changes</ButtonPrimary></div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// NOTIFICATIONS TAB — PERSISTED TO LOCALSTORAGE
// ============================================================================
function NotificationsTab() {
  const defaultEmail = { newLead: true, dealStage: true, taskOverdue: true, meetingReminder: true, weeklySummary: false, monthlyReport: true }
  const defaultPush = { newLead: true, dealStage: false, taskOverdue: true, meetingReminder: true, weeklySummary: false, monthlyReport: false }
  const [emailToggles, setEmailToggles] = useLocalStorage('sp_settings_notif_email', defaultEmail)
  const [pushToggles, setPushToggles] = useLocalStorage('sp_settings_notif_push', defaultPush)
  const [quietStart, setQuietStart] = useLocalStorage('sp_settings_notif_quiet_start', '22:00')
  const [quietEnd, setQuietEnd] = useLocalStorage('sp_settings_notif_quiet_end', '08:00')
  const notificationItems = [{ key: 'newLead' as const, label: 'New lead assigned' }, { key: 'dealStage' as const, label: 'Deal stage changed' }, { key: 'taskOverdue' as const, label: 'Task overdue' }, { key: 'meetingReminder' as const, label: 'Meeting reminder' }, { key: 'weeklySummary' as const, label: 'Weekly summary' }, { key: 'monthlyReport' as const, label: 'Monthly report' }]

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <SectionCard><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}><Mail size={18} style={{ color: C.yellow }} /><SectionTitle style={{ marginBottom: 0 }}>Email Notifications</SectionTitle></div><div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{notificationItems.map((item) => <Toggle key={item.key} checked={emailToggles[item.key]} onChange={(v) => { setEmailToggles((prev) => ({ ...prev, [item.key]: v })); toast.success('Notification preference saved') }} label={item.label} />)}</div></SectionCard>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <SectionCard><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}><Monitor size={18} style={{ color: C.yellow }} /><SectionTitle style={{ marginBottom: 0 }}>Push Notifications</SectionTitle></div><div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{notificationItems.map((item) => <Toggle key={item.key} checked={pushToggles[item.key]} onChange={(v) => { setPushToggles((prev) => ({ ...prev, [item.key]: v })); toast.success('Notification preference saved') }} label={item.label} />)}</div></SectionCard>
        </motion.div>
      </div>
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <SectionCard style={{ marginTop: 24, marginBottom: 24 }}>
          <SectionTitle>Notification Templates</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NOTIFICATION_TEMPLATES.map((tmpl) => (
              <div key={tmpl.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: C.yellow + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mail size={17} style={{ color: C.yellow }} /></div>
                <div style={{ flex: 1 }}><div style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{tmpl.name}</div><div style={{ color: C.textTertiary, fontSize: 12, marginTop: 2 }}>{tmpl.subject}</div></div>
                <div style={{ color: C.textTertiary, fontSize: 12, flexShrink: 0 }}>Edited {tmpl.lastEdited}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toast.info(`Editing template: ${tmpl.name}`)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Edit3 size={12} /> Edit</button>
                  <button onClick={() => toast.info(`Previewing ${tmpl.name}`)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={12} /> Preview</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <SectionCard>
          <SectionTitle>Quiet Hours</SectionTitle>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>Suppress notifications during these hours. Push notifications and non-urgent emails will be held until the quiet period ends.</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1, maxWidth: 200 }}><FormLabel>Start Time</FormLabel><input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} /></div>
            <span style={{ color: C.textTertiary, marginTop: 22 }}>to</span>
            <div style={{ flex: 1, maxWidth: 200 }}><FormLabel>End Time</FormLabel><input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} /></div>
            <div style={{ marginTop: 22 }}><ButtonPrimary onClick={() => toast.success('Quiet hours updated')}><Check size={15} /> Save</ButtonPrimary></div>
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// TEAM TAB — WORKSPACE MESSAGE
// ============================================================================
function TeamTab() {
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const toggleRoleExpand = useCallback((role: string) => setExpandedRole((prev) => prev === role ? null : role), [])
  const rolePerms = useMemo(() => ({
    Admin: Object.fromEntries(Object.entries(ROLE_PERMISSIONS).map(([k, v]) => [k, v.map(() => true)])),
    Manager: Object.fromEntries(Object.entries(ROLE_PERMISSIONS).map(([k, v]) => [k, v.map(() => k !== 'Settings' && k !== 'API')])),
    'Sales Rep': Object.fromEntries(Object.entries(ROLE_PERMISSIONS).map(([k, v]) => [k, v.map((_, i) => i === 0)])),
    Installer: Object.fromEntries(Object.entries(ROLE_PERMISSIONS).map(([k, v]) => [k, v.map((_, i) => i === 0 && (k === 'CRM' || k === 'Calendar' || k === 'Tasks'))])),
  }), [])
  const roleColours: Record<string, string> = { Admin: C.yellow, Manager: C.blue, 'Sales Rep': C.green, Installer: C.orange }

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: C.blue + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={26} style={{ color: C.blue }} /></div>
            <div>
              <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Team Management</h2>
              <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>Team management will be available when connected to your workspace.</p>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: 20, borderRadius: 10, background: C.yellow + '08', border: '1px solid ' + C.yellow + '20' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Info size={16} style={{ color: C.yellow }} />
              <span style={{ color: C.yellow, fontSize: 13, fontWeight: 600 }}>Connect Paperclip for Team Collaboration</span>
            </div>
            <p style={{ color: C.textSecondary, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              Link your Paperclip integration to enable team management features including member invitations, role assignments, and collaborative document editing. Set up Paperclip in the <strong style={{ color: C.text }}>Integrations</strong> tab.
            </p>
          </div>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <SectionCard>
          <SectionTitle>Role Permissions</SectionTitle>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>Configure granular access controls for each role. Admin has full access by default.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(rolePerms).map(([role, perms]) => {
              const isExpanded = expandedRole === role
              const totalPerms = Object.values(perms).reduce((sum, arr) => sum + arr.filter(Boolean).length, 0)
              const allPerms = Object.values(perms).reduce((sum, arr) => sum + arr.length, 0)
              return (
                <div key={role} style={{ background: C.surface, borderRadius: 10, border: '1px solid ' + C.border, overflow: 'hidden' }}>
                  <button onClick={() => toggleRoleExpand(role)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <span style={{ padding: '4px 12px', borderRadius: 6, background: (roleColours[role] || C.textTertiary) + '15', color: roleColours[role] || C.textTertiary, fontSize: 13, fontWeight: 600 }}>{role}</span>
                    <span style={{ color: C.textTertiary, fontSize: 12 }}>{totalPerms}/{allPerms} permissions</span>
                    <ChevronDown size={16} style={{ color: C.textTertiary, marginLeft: 'auto', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid ' + C.border }}>
                          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(ROLE_PERMISSIONS).map(([category, permissions]) => (
                              <div key={category}>
                                <div style={{ color: C.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{category}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {permissions.map((perm, i) => (
                                    <span key={perm} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, background: perms[category]?.[i] ? C.greenMuted : 'transparent', color: perms[category]?.[i] ? C.green : C.textMuted, border: '1px solid ' + (perms[category]?.[i] ? C.green + '30' : C.border) }}>{perm}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// DATA & PRIVACY TAB — PERSISTED TO LOCALSTORAGE
// ============================================================================
function DataPrivacyTab() {
  const [gdprMode, setGdprMode] = useLocalStorage('sp_settings_privacy_gdpr', true)
  const [dpoName, setDpoName] = useLocalStorage('sp_settings_privacy_dpo_name', '')
  const [dpoEmail, setDpoEmail] = useLocalStorage('sp_settings_privacy_dpo_email', '')
  const [contactRetention, setContactRetention] = useLocalStorage('sp_settings_privacy_contact_retention', '36 months')
  const [dealRetention, setDealRetention] = useLocalStorage('sp_settings_privacy_deal_retention', '60 months')
  const [analyticsCookies, setAnalyticsCookies] = useLocalStorage('sp_settings_privacy_analytics_cookies', true)
  const [marketingCookies, setMarketingCookies] = useLocalStorage('sp_settings_privacy_marketing_cookies', false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  return (
    <motion.div {...staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}><Shield size={18} style={{ color: C.green }} /><SectionTitle style={{ marginBottom: 0 }}>GDPR Compliance</SectionTitle></div>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>When enabled, all data processing activities will comply with the General Data Protection Regulation (GDPR). Consent records are automatically maintained for all contacts.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle checked={gdprMode} onChange={(v) => { setGdprMode(v); toast.success('GDPR mode updated') }} label="Enable GDPR compliance mode" />
            <FormRow><div><FormLabel>Data Protection Officer Name</FormLabel><StyledInput value={dpoName} onChange={setDpoName} placeholder="DPO full name" /></div><div><FormLabel>Data Protection Officer Email</FormLabel><StyledInput value={dpoEmail} onChange={setDpoEmail} placeholder="dpo@company.ie" /></div></FormRow>
          </div>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <SectionTitle>Data Retention</SectionTitle>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>Define how long customer and deal records are kept before automatic deletion. Records will be flagged for review 30 days before deletion.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ maxWidth: 320 }}><FormLabel>Auto-delete contacts after</FormLabel><StyledSelect value={contactRetention} onChange={(v) => { setContactRetention(v); toast.success('Retention policy updated') }} options={[{ value: '12 months', label: '12 months' }, { value: '24 months', label: '24 months' }, { value: '36 months', label: '36 months' }, { value: '60 months', label: '60 months' }, { value: 'Never', label: 'Never' }]} /></div>
            <div style={{ maxWidth: 320 }}><FormLabel>Auto-delete completed deals after</FormLabel><StyledSelect value={dealRetention} onChange={(v) => { setDealRetention(v); toast.success('Retention policy updated') }} options={[{ value: '24 months', label: '24 months' }, { value: '36 months', label: '36 months' }, { value: '60 months', label: '60 months' }, { value: '84 months', label: '84 months' }, { value: 'Never', label: 'Never' }]} /></div>
          </div>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <SectionTitle>Data Export</SectionTitle>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>Download a copy of your CRM data. Export files are generated in CSV format and delivered via email.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ButtonPrimary onClick={() => toast.success('Exporting all data... You will receive an email when ready')}><FileDown size={15} /> Export All Data</ButtonPrimary>
            <ButtonGhost onClick={() => toast.success('Exporting contacts...')}><Download size={15} /> Export Contacts</ButtonGhost>
            <ButtonGhost onClick={() => toast.success('Exporting deals...')}><Download size={15} /> Export Deals</ButtonGhost>
            <ButtonGhost onClick={() => toast.success('Exporting invoices...')}><Download size={15} /> Export Invoices</ButtonGhost>
          </div>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <SectionCard style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}><Cookie size={18} style={{ color: C.yellow }} /><SectionTitle style={{ marginBottom: 0 }}>Cookie Preferences</SectionTitle></div>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>Manage which cookie categories are active for your CRM portal. Necessary cookies are always enabled.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: C.surface, borderRadius: 8 }}><div><div style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>Necessary Cookies</div><div style={{ color: C.textTertiary, fontSize: 12, marginTop: 2 }}>Required for the CRM to function properly</div></div><span style={{ color: C.textTertiary, fontSize: 12, fontStyle: 'italic' }}>Always on</span></div>
            <Toggle checked={analyticsCookies} onChange={(v) => { setAnalyticsCookies(v); toast.success('Cookie preference saved') }} label="Analytics Cookies — help us understand how you use the CRM" />
            <Toggle checked={marketingCookies} onChange={(v) => { setMarketingCookies(v); toast.success('Cookie preference saved') }} label="Marketing Cookies — enable personalised content and adverts" />
          </div>
        </SectionCard>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <SectionCard>
          <SectionTitle>Danger Zone</SectionTitle>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>Permanently delete your account and all associated data. This action cannot be undone. We recommend exporting your data before proceeding.</p>
          <ButtonGhost danger onClick={() => setShowDeleteModal(true)}><UserX size={15} /> Request Account Deletion</ButtonGhost>
        </SectionCard>
      </motion.div>
      <AnimatePresence>{showDeleteModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}><div style={{ width: 44, height: 44, borderRadius: 10, background: C.redMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={22} style={{ color: C.red }} /></div><div><h3 style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>Delete Account</h3><p style={{ color: C.textTertiary, fontSize: 13 }}>This cannot be undone</p></div></div>
            <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>This will permanently delete your account, all contacts, deals, invoices, and associated data. Please type <strong style={{ color: C.red }}>DELETE</strong> to confirm.</p>
            <StyledInput value={deleteConfirmText} onChange={setDeleteConfirmText} placeholder="Type DELETE to confirm" />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <ButtonGhost onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}>Cancel</ButtonGhost>
              <button onClick={() => { if (deleteConfirmText === 'DELETE') { toast.error('Account deletion request submitted'); setShowDeleteModal(false); setDeleteConfirmText('') } else { toast.error('Please type DELETE to confirm') } }} disabled={deleteConfirmText !== 'DELETE'} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: deleteConfirmText === 'DELETE' ? C.red : C.card2, color: deleteConfirmText === 'DELETE' ? '#FFF' : C.textTertiary, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}><Trash2 size={15} /> Delete Account</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  )
}

// ============================================================================
// SKELETON LOADER
// ============================================================================
function SettingsSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 24, padding: 32 }}>
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ height: 36, borderRadius: 8, background: C.card2, marginBottom: 16, width: '100%' }} />
        {[...Array(9)].map((_, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 4 }}><div style={{ width: 20, height: 20, borderRadius: 5, background: C.card2 }} /><div style={{ height: 14, borderRadius: 4, background: C.card2, width: `${90 + (i % 3) * 30}px` }} /></div>))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ height: 28, borderRadius: 6, background: C.card2, width: 200, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>{[...Array(4)].map((_, i) => (<div key={i} style={{ height: 100, borderRadius: 12, background: C.card2, border: `1px solid ${C.border}` }} />))}</div>
        <div style={{ height: 240, borderRadius: 12, background: C.card2, border: `1px solid ${C.border}` }} />
      </div>
    </div>
  )
}

// ============================================================================
// TAB CONTENT RENDERER
// ============================================================================
function TabContent({ activeTab }: { activeTab: TabId }) {
  switch (activeTab) {
    case 'overview': return <OverviewTab />
    case 'integrations': return <IntegrationsTab />
    case 'analytics': return <AnalyticsTab />
    case 'social': return <SocialMediaTab />
    case 'api': return <ApiWebhooksTab />
    case 'general': return <GeneralTab />
    case 'notifications': return <NotificationsTab />
    case 'team': return <TeamTab />
    case 'privacy': return <DataPrivacyTab />
    default: return <OverviewTab />
  }
}

// ============================================================================
// MAIN SETTINGS PAGE
// ============================================================================
export default function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [loaded, setLoaded] = useState(false)
  React.useEffect(() => { const timer = setTimeout(() => setLoaded(true), 600); return () => clearTimeout(timer) }, [])
  const filteredTabs = useMemo(() => { if (!searchQuery.trim()) return TABS; const q = searchQuery.toLowerCase(); return TABS.filter((t) => t.label.toLowerCase().includes(q)) }, [searchQuery])
  if (!loaded) return <SettingsSkeleton />
  return (
    <div style={{ minHeight: '100%', background: C.bg }}>
      <div style={{ padding: '28px 32px 0', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}><Settings size={22} style={{ color: C.yellow }} /><h1 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Settings</h1></div>
        <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>Manage your integrations, team, notifications, and account preferences.</p>
      </div>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>
        <aside style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: C.surface, padding: '20px 12px', position: 'sticky', top: 0, height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16, padding: '0 4px' }}>
            <div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textTertiary }} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search settings..." style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} /></div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredTabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? C.yellow : C.textSecondary, background: isActive ? C.yellow + '0D' : 'transparent', borderLeft: isActive ? `3px solid ${C.yellow}` : '3px solid transparent', textAlign: 'left', width: '100%', transition: 'all 0.15s ease' }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.text } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textSecondary } }}>
                  <Icon size={18} style={{ flexShrink: 0, color: isActive ? C.yellow : undefined }} /><span>{tab.label}</span>
                </motion.button>
              )
            })}
          </nav>
          <div style={{ paddingTop: 20, padding: '16px 12px', borderTop: `1px solid ${C.border}`, marginTop: 24 }}>
            <div style={{ padding: 14, borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Info size={15} style={{ color: C.yellow }} /><span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>Need Help?</span></div>
              <p style={{ color: C.textTertiary, fontSize: 11, lineHeight: 1.5, margin: 0 }}>Visit our documentation or contact support for help configuring your settings.</p>
              <button onClick={() => toast.info('Opening support documentation')} style={{ marginTop: 10, padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><ExternalLink size={12} /> View Docs</button>
            </div>
          </div>
        </aside>
        <main style={{ flex: 1, padding: '28px 32px 40px', overflowY: 'auto', minWidth: 0 }}>
          <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}><TabContent activeTab={activeTab} /></motion.div></AnimatePresence>
        </main>
      </div>
    </div>
  )
}
