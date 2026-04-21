'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageCircle, Mail, Phone, UserSearch, TrendingUp,
  FileText, ArrowRight, Shield, X, Send, Copy, Check,
  Trash2, Sparkles, ChevronDown, Loader2, ThumbsUp,
  ThumbsDown, RefreshCw, Maximize2, Minimize2, Mic, MicOff, StopCircle,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  action?: string
  isStreaming?: boolean
  feedback?: 'up' | 'down' | null
}

type ActionType =
  | 'chat'
  | 'draft_email'
  | 'call_script'
  | 'summarize_contact'
  | 'deal_insights'
  | 'generate_proposal'
  | 'next_actions'
  | 'objection_handling'

interface ActionOption {
  id: ActionType
  label: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  shortcut?: string
}

interface Suggestion {
  text: string
  action?: ActionType
  icon?: React.ElementType
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const C = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceHover: '#1C1C1C',
  surfaceElevated: '#1F1F1F',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  primary: '#F3D840',
  primaryDim: '#C4AD2E',
  primaryMuted: 'rgba(243,216,64,0.10)',
  primaryBorder: 'rgba(243,216,64,0.22)',
  primaryGlow: 'rgba(243,216,64,0.08)',
  text: '#F5F5F5',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.30)',
  green: '#34D399',
  blue: '#60A5FA',
  purple: '#A78BFA',
  orange: '#FB923C',
  cyan: '#22D3EE',
  pink: '#F472B6',
  red: '#F87171',
}

const ACTIONS: ActionOption[] = [
  { id: 'chat', label: 'Ask Anything', description: 'General CRM questions', icon: MessageCircle, color: C.primary, gradient: 'linear-gradient(135deg, rgba(243,216,64,0.15), rgba(243,216,64,0.04))', shortcut: '1' },
  { id: 'draft_email', label: 'Draft Email', description: 'Professional outreach', icon: Mail, color: C.blue, gradient: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.04))', shortcut: '2' },
  { id: 'call_script', label: 'Call Script', description: 'Talking points', icon: Phone, color: C.green, gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.04))', shortcut: '3' },
  { id: 'summarize_contact', label: 'Contact Summary', description: 'History & insights', icon: UserSearch, color: C.purple, gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.04))', shortcut: '4' },
  { id: 'deal_insights', label: 'Deal Intelligence', description: 'Health & risk analysis', icon: TrendingUp, color: C.orange, gradient: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(251,146,60,0.04))', shortcut: '5' },
  { id: 'generate_proposal', label: 'Generate Proposal', description: 'Full proposal content', icon: FileText, color: C.cyan, gradient: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.04))', shortcut: '6' },
  { id: 'next_actions', label: 'Next Actions', description: 'Prioritised steps', icon: ArrowRight, color: C.pink, gradient: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(244,114,182,0.04))', shortcut: '7' },
  { id: 'objection_handling', label: 'Objection Handling', description: 'Overcome objections', icon: Shield, color: C.red, gradient: 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(248,113,113,0.04))', shortcut: '8' },
]

const CONTEXT_LABELS: Record<string, string> = {
  '/crm/dashboard': 'Dashboard',
  '/crm/companies': 'Companies',
  '/crm/contacts': 'Contacts',
  '/crm/pipeline': 'Pipeline',
  '/crm/deals': 'Deals',
  '/crm/calendar': 'Calendar',
  '/crm/meetings': 'Meetings',
  '/crm/tasks': 'Tasks',
  '/crm/proposals': 'Proposals',
  '/crm/invoices': 'Invoices',
  '/crm/installers': 'Installers',
  '/crm/reports': 'Reports',
  '/crm/billing': 'Billing',
  '/crm/settings': 'Settings',
  '/crm/workflows': 'Workflows',
}

const STORAGE_KEY = 'renewably-ai-chat'

let _msgId = 0
function uid() { return `ai-${Date.now()}-${++_msgId}` }

// ============================================================================
// CSS ANIMATIONS
// ============================================================================

const CSS = `
@keyframes ai-fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
@keyframes ai-scaleIn { from { opacity:0; transform:scale(.93) } to { opacity:1; transform:scale(1) } }
@keyframes ai-fadeOut { from { opacity:1; transform:scale(1) } to { opacity:0; transform:scale(.93) } }
@keyframes ai-pulse { 0%,100%{ transform:scale(1); opacity:.4 } 70%{ transform:scale(1.7); opacity:0 } }
@keyframes ai-dot { 0%,80%,100%{ transform:translateY(0) } 40%{ transform:translateY(-5px) } }
@keyframes ai-cursor { 0%,100%{ opacity:1 } 50%{ opacity:0 } }
@keyframes ai-shimmer { 0%{ background-position:-200% 0 } 100%{ background-position:200% 0 } }
@keyframes ai-slideDown { from { opacity:0; transform:translateY(-6px) scaleY(.96) } to { opacity:1; transform:translateY(0) scaleY(1) } }
@keyframes ai-fabSpin { 0%{ --angle:0deg } 100%{ --angle:360deg } }
@keyframes ai-glow { 0%,100%{ box-shadow:0 0 20px rgba(243,216,64,.12) } 50%{ box-shadow:0 0 35px rgba(243,216,64,.22) } }
@keyframes ai-orbFloat { 0%,100%{ transform:translateY(0) scale(1) } 50%{ transform:translateY(-6px) scale(1.04) } }
@keyframes ai-orbPulse { 0%,100%{ opacity:.25 } 50%{ opacity:.45 } }
@keyframes ai-wave { 0%{ transform:rotate(0deg) } 10%{ transform:rotate(14deg) } 20%{ transform:rotate(-8deg) } 30%{ transform:rotate(14deg) } 40%{ transform:rotate(-4deg) } 50%{ transform:rotate(10deg) } 60%{ transform:rotate(0deg) } 100%{ transform:rotate(0deg) } }
@keyframes ai-stopPulse { 0%,100%{ opacity:1 } 50%{ opacity:.5 } }
@property --angle { syntax:"<angle>"; initial-value:0deg; inherits:false }

.crw * { box-sizing:border-box; }
.crw input,.crw textarea,.crw button { font-family:inherit; }
.crw-msg { animation: ai-fadeUp .28s cubic-bezier(.16,1,.3,1) both; }
.crw-panel-in { animation: ai-scaleIn .3s cubic-bezier(.16,1,.3,1) both; }
.crw-panel-out { animation: ai-fadeOut .18s ease-in both; }
.crw-fab-ring::before { content:''; position:absolute; inset:-5px; border-radius:50%; background:rgba(243,216,64,.22); animation: ai-pulse 2.8s ease-out infinite; z-index:-1; }
.crw-dot { width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.45); animation: ai-dot 1.4s ease-in-out infinite; }
.crw-cursor::after { content:'\\258C'; color:${C.primary}; animation: ai-cursor .7s step-end infinite; margin-left:1px; }
.crw-shimmer { background:linear-gradient(90deg,transparent 0%,rgba(243,216,64,.05) 50%,transparent 100%); background-size:200% 100%; animation: ai-shimmer 2s ease-in-out infinite; }
.crw-act { animation: ai-fadeUp .22s cubic-bezier(.16,1,.3,1) both; }
.crw-fab-grad {
  background: conic-gradient(from var(--angle), ${C.primary}, #F97316, #EC4899, #A78BFA, #22D3EE, ${C.primary});
  animation: ai-fabSpin 4s linear infinite;
}
.crw-orb { animation: ai-orbFloat 3s ease-in-out infinite; }
.crw-orb-glow { animation: ai-orbPulse 3s ease-in-out infinite; }
.crw-stop { animation: ai-stopPulse 1s ease-in-out infinite; }
.crw-suggest { animation: ai-fadeUp .25s cubic-bezier(.16,1,.3,1) both; }
.crw-mic-active { animation: ai-wave 1s ease-in-out infinite; }

/* Custom scrollbar */
.crw-scroll::-webkit-scrollbar { width:4px; }
.crw-scroll::-webkit-scrollbar-track { background:transparent; }
.crw-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); border-radius:4px; }
.crw-scroll::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,.15); }

@media(max-width:480px){
  .crw-panel { width:calc(100vw - 12px) !important; height:calc(100vh - 60px) !important; right:6px !important; bottom:64px !important; border-radius:16px !important; }
  .crw-fab { bottom:14px !important; right:14px !important; }
}
`

// ============================================================================
// UTILITY — Markdown Renderer (enhanced)
// ============================================================================

function esc(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function md(text: string): string {
  const s = esc(text)
  return s
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
      const label = lang ? `<div style="font-size:10px;color:rgba(255,255,255,.3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">${lang}</div>` : ''
      return `<pre style="background:#080808;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px 12px;margin:8px 0;overflow-x:auto;font-size:12px;line-height:1.5;color:rgba(255,255,255,.6)">${label}<code>${code.trim()}</code></pre>`
    })
    // Blockquotes
    .replace(/^&gt;\s?(.+)$/gm, '<div style="border-left:2.5px solid rgba(243,216,64,.35);padding:4px 12px;margin:6px 0;color:rgba(255,255,255,.65);font-style:italic;background:rgba(243,216,64,.03);border-radius:0 6px 6px 0">$1</div>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(243,216,64,.08);color:#F3D840;padding:1px 5px;border-radius:4px;font-size:11.5px;font-family:ui-monospace,monospace">$1</code>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#FFF;font-weight:600">$1</strong>')
    // Italic
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    // Headings
    .replace(/^### (.+)$/gm, '<div style="font-size:13px;font-weight:700;color:#FFF;margin:12px 0 3px;letter-spacing:-.01em">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-size:14px;font-weight:700;color:#FFF;margin:14px 0 5px;letter-spacing:-.01em">$1</div>')
    // HR
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,.06);margin:10px 0" />')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<div style="display:flex;gap:8px;padding:1px 0;line-height:1.55"><span style="color:#F3D840;font-size:13px;flex-shrink:0;margin-top:2px">\u2022</span><span>$1</span></div>')
    // Ordered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:8px;padding:1px 0;line-height:1.55"><span style="color:#F3D840;font-size:12px;font-weight:600;flex-shrink:0;min-width:16px">$1.</span><span>$2</span></div>')
    // Paragraphs
    .replace(/\n\n/g, '<div style="height:6px"></div>')
    // Single newlines
    .replace(/\n/g, '<br />')
}

// ============================================================================
// UTILITY — Time-based greeting
// ============================================================================

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ============================================================================
// UTILITY — localStorage persistence
// ============================================================================

function loadMessages(): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((m: Record<string, unknown>) => ({
      id: String(m.id),
      role: String(m.role),
      content: String(m.content),
      timestamp: new Date(m.timestamp as string),
      isStreaming: false,
    } as Message))
  } catch { return [] }
}

function saveMessages(msgs: Message[]) {
  if (typeof window === 'undefined') return
  try {
    const toSave = msgs.slice(-50).map(m => ({ ...m, isStreaming: false }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* quota exceeded — ignore */ }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TypingDots({ label }: { label?: string }) {
  return (
    <div className="crw-msg" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: C.primaryMuted, border: `1.5px solid ${C.primaryBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Sparkles size={12} color={C.primary} />
      </div>
      <div style={{
        background: C.surface, borderRadius: '14px 14px 14px 4px',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span className="crw-dot" style={{ animationDelay: '0ms' }} />
        <span className="crw-dot" style={{ animationDelay: '.15s' }} />
        <span className="crw-dot" style={{ animationDelay: '.3s' }} />
        {label && <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 5, fontWeight: 500 }}>{label}</span>}
      </div>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  const doCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setOk(true)
    setTimeout(() => setOk(false), 2000)
  }, [text])
  return (
    <button onClick={doCopy} aria-label="Copy" style={{
      position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 5,
      border: 'none', background: 'rgba(255,255,255,.05)', color: C.textMuted,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: 0, transition: 'opacity .15s, background .15s', padding: 0,
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,.1)' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
    >
      {ok ? <Check size={11} color={C.green} /> : <Copy size={11} />}
    </button>
  )
}

function FeedbackBtns({ msg, onFeedback }: { msg: Message; onFeedback: (id: string, f: 'up' | 'down') => void }) {
  if (msg.isStreaming || !msg.content) return null
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 4, paddingLeft: 4 }}>
      <button onClick={() => onFeedback(msg.id, 'up')} aria-label="Good response" style={{
        width: 22, height: 22, borderRadius: 5, border: 'none',
        background: msg.feedback === 'up' ? 'rgba(52,211,153,.12)' : 'transparent',
        color: msg.feedback === 'up' ? C.green : C.textMuted,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, transition: 'all .15s', opacity: 0.6,
      }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { if (msg.feedback !== 'up') e.currentTarget.style.opacity = '.6' }}
      >
        <ThumbsUp size={11} />
      </button>
      <button onClick={() => onFeedback(msg.id, 'down')} aria-label="Bad response" style={{
        width: 22, height: 22, borderRadius: 5, border: 'none',
        background: msg.feedback === 'down' ? 'rgba(248,113,113,.12)' : 'transparent',
        color: msg.feedback === 'down' ? C.red : C.textMuted,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, transition: 'all .15s', opacity: 0.6,
      }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { if (msg.feedback !== 'down') e.currentTarget.style.opacity = '.6' }}
      >
        <ThumbsDown size={11} />
      </button>
    </div>
  )
}

function MessageBubble({ msg, onFeedback, onRegenerate }: {
  msg: Message
  onFeedback: (id: string, f: 'up' | 'down') => void
  onRegenerate: (id: string) => void
}) {
  const isUser = msg.role === 'user'
  const actionDef = ACTIONS.find(a => a.id === msg.action)
  const isLast = !msg.isStreaming && msg.content

  return (
    <div className="crw-msg" style={{
      display: 'flex', flexDirection: isUser ? 'column' : 'row',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 8, marginBottom: 12, maxWidth: isUser ? '82%' : '95%',
      marginLeft: isUser ? 'auto' : 0,
    }}>
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: C.primaryMuted, border: `1.5px solid ${C.primaryBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
        }}>
          <Sparkles size={12} color={C.primary} />
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {actionDef && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 9.5, fontWeight: 600, color: actionDef.color,
            background: `${actionDef.color}10`,
            padding: '2px 7px', borderRadius: 5, marginBottom: 3,
            marginLeft: isUser ? 'auto' : 0, letterSpacing: '.02em',
          }}>
            <actionDef.icon size={9} />
            {actionDef.label}
          </div>
        )}

        <div style={{
          background: isUser ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDim})` : C.surface,
          color: isUser ? '#0A0A0A' : C.text,
          borderRadius: isUser ? '16px 16px 4px 16px' : '14px 14px 14px 4px',
          padding: '10px 13px', fontSize: 13, lineHeight: 1.6,
          wordBreak: 'break-word', position: 'relative',
          fontWeight: isUser ? 500 : 400,
          border: isUser ? 'none' : `1px solid ${C.border}`,
        }}>
          {isUser ? msg.content : (
            <span
              className={msg.isStreaming ? 'crw-cursor' : ''}
              dangerouslySetInnerHTML={{ __html: md(msg.content) }}
            />
          )}
        </div>

        {!isUser && !msg.isStreaming && msg.content.length > 40 && (
          <CopyBtn text={msg.content} />
        )}

        {!isUser && isLast && !msg.isStreaming && msg.content.length > 20 && (
          <div style={{ display: 'flex', gap: 2, marginTop: 4, paddingLeft: 4 }}>
            <FeedbackBtns msg={msg} onFeedback={onFeedback} />
            <button onClick={() => onRegenerate(msg.id)} aria-label="Regenerate" title="Regenerate response" style={{
              width: 22, height: 22, borderRadius: 5, border: 'none',
              background: 'transparent', color: C.textMuted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, transition: 'all .15s', opacity: 0.6,
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = C.textSecondary }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '.6'; e.currentTarget.style.color = C.textMuted }}
            >
              <RefreshCw size={11} />
            </button>
          </div>
        )}

        <div style={{
          fontSize: 9.5, color: C.textMuted, marginTop: 2, padding: '0 3px',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {msg.timestamp.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </div>
  )
}

function ActionCard({ action, onSelect, index }: {
  action: ActionOption; onSelect: (a: ActionType) => void; index: number
}) {
  const Icon = action.icon
  return (
    <button onClick={() => onSelect(action.id)} className="crw-act" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 11,
      border: `1px solid ${C.border}`, background: C.surface,
      cursor: 'pointer', textAlign: 'left',
      transition: 'all .18s ease', animationDelay: `${index * 35}ms`, width: '100%',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = C.surfaceHover
        e.currentTarget.style.borderColor = `${action.color}25`
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,.3), 0 0 16px ${action.color}08`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = C.surface
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: action.gradient,
        border: `1px solid ${action.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} color={action.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{action.label}</div>
        <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 1.5, lineHeight: 1.3 }}>{action.description}</div>
      </div>
      {action.shortcut && (
        <div style={{
          fontSize: 9, fontWeight: 600, color: C.textMuted,
          background: 'rgba(255,255,255,.03)', padding: '2px 5px',
          borderRadius: 4, flexShrink: 0, fontFamily: 'ui-monospace, monospace',
        }}>{action.shortcut}</div>
      )}
    </button>
  )
}

function SuggestionChip({ text, onClick, delay }: { text: string; onClick: () => void; delay?: number }) {
  return (
    <button onClick={onClick} className="crw-suggest" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 11px', borderRadius: 20, border: `1px solid ${C.border}`,
      background: C.surface, color: C.textSecondary, fontSize: 11.5,
      cursor: 'pointer', transition: 'all .15s', animationDelay: `${delay || 0}ms`,
      whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = C.surfaceHover
        e.currentTarget.style.borderColor = C.primaryBorder
        e.currentTarget.style.color = C.text
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = C.surface
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.color = C.textSecondary
      }}
    >
      <Sparkles size={10} color={C.primary} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
    </button>
  )
}

function WelcomeScreen({ onSelectAction, onSuggestion }: {
  onSelectAction: (a: ActionType) => void
  onSuggestion: (text: string) => void
}) {
  const greeting = useMemo(() => getGreeting(), [])

  const quickSuggestions: Suggestion[] = [
    { text: 'Draft a follow-up email' },
    { text: 'Analyse my pipeline' },
    { text: 'What should I prioritise today?' },
    { text: 'Help me handle price objections' },
  ]

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px 22px', gap: 18, overflowY: 'auto',
    }}>
      {/* Animated orb */}
      <div className="crw-orb" style={{ position: 'relative' }}>
        <div className="crw-orb-glow" style={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.primaryGlow}, transparent 70%)`,
        }} />
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: `linear-gradient(145deg, ${C.primaryMuted}, rgba(243,216,64,.03))`,
          border: `1.5px solid ${C.primaryBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Sparkles size={22} color={C.primary} />
        </div>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 280 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: '-.02em' }}>
          {greeting}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3, lineHeight: 1.5 }}>
          I can draft emails, write call scripts, analyse deals, and more.
        </div>
      </div>

      {/* Quick suggestions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 320 }}>
        {quickSuggestions.map((s, i) => (
          <SuggestionChip key={i} text={s.text} onClick={() => onSuggestion(s.text)} delay={i * 50} />
        ))}
      </div>

      {/* Action grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 5, width: '100%', maxWidth: 330,
      }}>
        {ACTIONS.map((a, i) => (
          <ActionCard key={a.id} action={a} onSelect={onSelectAction} index={i} />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIAssistant() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<ActionType>('chat')
  const [showActionPicker, setShowActionPicker] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [micSupported, setMicSupported] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const streamContentRef = useRef<string>('')

  const contextLabel = CONTEXT_LABELS[pathname] || ''

  // Load persisted messages on mount
  useEffect(() => {
    const saved = loadMessages()
    if (saved.length > 0) setMessages(saved)
  }, [])

  // Persist messages on change
  useEffect(() => {
    const nonStreaming = messages.filter(m => !m.isStreaming)
    if (nonStreaming.length > 0) saveMessages(nonStreaming)
  }, [messages])

  // Inject CSS once
  useEffect(() => {
    const id = 'crw-styles'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = CSS
    document.head.appendChild(style)
  }, [])

  // Check mic support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setMicSupported(true)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isLoading, isStreaming, scrollToBottom])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isClosing) return
        if (isOpen) { closePanel() } else { setIsOpen(true) }
      }
      if (e.key === 'Escape' && isOpen) {
        closePanel()
        setShowActionPicker(false)
      }
      if (isOpen && !isLoading && !isStreaming && messages.length === 0 && document.activeElement !== inputRef.current) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 8) {
          e.preventDefault()
          handleSelectAction(ACTIONS[num - 1].id)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, isLoading, isStreaming, messages.length, isClosing])

  const closePanel = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 180)
  }, [])

  // Voice input
  const toggleMic = useCallback(() => {
    if (isListening) {
      setIsListening(false)
      return
    }
    const SpeechRecognitionCtor = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return
     
    const recognition = new (SpeechRecognitionCtor as any)()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IE'
     
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev ? `${prev} ${transcript}` : transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
    setIsListening(true)
  }, [isListening])

  const handleSelectAction = useCallback((action: ActionType) => {
    setSelectedAction(action)
    setShowActionPicker(false)
    inputRef.current?.focus()
    const prompts: Record<ActionType, string> = {
      chat: '',
      draft_email: 'Draft a follow-up email for ',
      call_script: 'Write a call script for ',
      summarize_contact: 'Summarise this contact: ',
      deal_insights: 'Analyse this deal and give me insights: ',
      generate_proposal: 'Generate a proposal for ',
      next_actions: 'What should I do next? ',
      objection_handling: 'How should I handle the objection: ',
    }
    setInput(prompts[action])
  }, [])

  // Send with SSE streaming
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || isStreaming) return

    const userMsg: Message = { id: uid(), role: 'user', content: text.trim(), timestamp: new Date() }
    const assistantMsgId = uid()
    const assistantMsg: Message = {
      id: assistantMsgId, role: 'assistant', content: '',
      timestamp: new Date(), action: selectedAction !== 'chat' ? selectedAction : undefined,
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    if (inputRef.current) inputRef.current.style.height = '38px'

    try {
      const history = messages
        .filter(m => !m.isStreaming && m.content)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      abortRef.current = new AbortController()
      streamContentRef.current = ''

      const res = await fetch('/api/crm/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          action: selectedAction !== 'chat' ? selectedAction : undefined,
          conversationHistory: history,
          stream: true,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get response')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const chunk = parsed.content || parsed.token || parsed.reply || ''
              if (chunk) {
                streamContentRef.current += chunk
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: streamContentRef.current, isStreaming: true }
                    : m
                ))
              }
            } catch { /* skip */ }
          }
        }
      }

      // Finalise the message
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: streamContentRef.current, isStreaming: false }
          : m
      ))
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User stopped generation — keep partial content
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: streamContentRef.current || '(Stopped)', isStreaming: false }
            : m
        ))
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
        setError(errorMsg)
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `Sorry, I encountered an error: ${errorMsg}`, isStreaming: false }
            : m
        ))
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [isLoading, isStreaming, messages, selectedAction])

  // Stop generation
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // Regenerate
  const handleRegenerate = useCallback((msgId: string) => {
    // Find the user message before this assistant message
    const idx = messages.findIndex(m => m.id === msgId)
    if (idx <= 0) return
    const userMsg = messages[idx - 1]
    if (userMsg.role !== 'user') return

    // Remove the assistant message and re-send
    const action = messages[idx].action as ActionType | undefined
    if (action) setSelectedAction(action)
    else setSelectedAction('chat')

    setMessages(prev => prev.slice(0, idx))
    setTimeout(() => sendMessage(userMsg.content), 100)
  }, [messages, sendMessage])

  // Feedback
  const handleFeedback = useCallback((msgId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    ))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = '38px'
    if (el.scrollHeight > 38 && el.scrollHeight < 100) {
      el.style.height = `${el.scrollHeight}px`
    }
  }

  const clearChat = () => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setSelectedAction('chat')
    setInput('')
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleSuggestion = useCallback((text: string) => {
    setSelectedAction('chat')
    sendMessage(text)
  }, [sendMessage])

  const currentAction = ACTIONS.find(a => a.id === selectedAction)

  // Generate follow-up suggestions from last assistant message
  const followUps = useMemo(() => {
    if (messages.length === 0 || isStreaming || isLoading) return []
    const last = [...messages].reverse().find(m => m.role === 'assistant' && !m.isStreaming && m.content.length > 30)
    if (!last) return []

    const content = last.content.toLowerCase()
    const suggestions: Suggestion[] = []

    if (content.includes('email') && !content.includes('call script')) {
      suggestions.push({ text: 'Make it more concise' })
      suggestions.push({ text: 'Add a subject line' })
    }
    if (content.includes('deal') || content.includes('pipeline')) {
      suggestions.push({ text: 'What are the biggest risks?' })
      suggestions.push({ text: 'Suggest next steps' })
    }
    if (content.includes('objection') || content.includes('price')) {
      suggestions.push({ text: 'What if they ask about competitors?' })
    }
    if (content.includes('proposal')) {
      suggestions.push({ text: 'Add ROI calculations' })
    }
    if (content.includes('call script') || content.includes('talking point')) {
      suggestions.push({ text: 'Add more objections' })
      suggestions.push({ text: 'Make it shorter' })
    }

    if (suggestions.length === 0) {
      suggestions.push({ text: 'Tell me more' })
      suggestions.push({ text: 'Give me a different approach' })
    }

    return suggestions.slice(0, 3)
  }, [messages, isStreaming, isLoading])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="crw">
      {/* ═══ FLOATING ACTION BUTTON ═══ */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="crw-fab" title="AI Assistant (\u2318K)"
          aria-label="Open AI Assistant" style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 54, height: 54, borderRadius: '50%', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = `0 6px 32px rgba(0,0,0,.5), 0 0 30px ${C.primaryGlow}`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,.4), 0 0 16px ${C.primaryGlow}`
          }}
        >
          <div className="crw-fab-ring" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            padding: 2.5,
          }}>
            <div className="crw-fab-grad" style={{
              width: '100%', height: '100%', borderRadius: '50%',
              opacity: .7,
            }} />
          </div>
          <div style={{
            position: 'absolute', inset: 2.5, borderRadius: '50%',
            background: C.surfaceElevated,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={22} color={C.primary} />
          </div>
        </button>
      )}

      {/* ═══ CHAT PANEL ═══ */}
      {isOpen && (
        <div ref={panelRef}
          className={`crw-panel ${isClosing ? 'crw-panel-out' : 'crw-panel-in'}`}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: isExpanded ? 'calc(100vw - 48px)' : 430,
            maxWidth: 'calc(100vw - 16px)',
            height: isExpanded ? 'calc(100vh - 48px)' : 620,
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: 18, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            background: C.bg,
            border: `1px solid ${C.border}`,
            boxShadow: `0 24px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.02), 0 0 50px ${C.primaryGlow}`,
          }}
        >
          {/* ─── HEADER ─── */}
          <div style={{
            padding: '12px 14px',
            background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`,
            borderBottom: `1px solid ${C.border}`, flexShrink: 0, position: 'relative',
          }}>
            {/* Top glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${C.primary}40, transparent)`,
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: C.primaryMuted,
                  border: `1.5px solid ${C.primaryBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={15} color={C.primary} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: C.text, fontWeight: 700, fontSize: 13.5, letterSpacing: '-.01em' }}>
                      Renewably AI
                    </span>
                    {currentAction && selectedAction !== 'chat' && (
                      <span style={{
                        fontSize: 8.5, fontWeight: 600, color: currentAction.color,
                        background: `${currentAction.color}12`,
                        padding: '1px 6px', borderRadius: 5, letterSpacing: '.02em',
                      }}>{currentAction.label}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 4.5, height: 4.5, borderRadius: '50%',
                      background: isStreaming ? C.orange : isLoading ? C.orange : C.green,
                      display: 'block',
                      boxShadow: `0 0 5px ${isStreaming ? C.orange : isLoading ? C.orange : C.green}`,
                    }} />
                    <span style={{ fontSize: 10.5, color: C.textMuted, fontWeight: 500 }}>
                      {isStreaming ? 'Streaming...' : isLoading ? 'Thinking...' : 'Online'}
                    </span>
                    {contextLabel && (
                      <>
                        <span style={{ color: C.border, fontSize: 10 }}>|</span>
                        <span style={{ fontSize: 10.5, color: C.textMuted }}>{contextLabel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {messages.length > 0 && (
                  <button onClick={clearChat} title="Clear" aria-label="Clear" style={{
                    width: 30, height: 30, borderRadius: 7, border: 'none',
                    background: 'transparent', color: C.textMuted,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 0, transition: 'all .12s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = C.text }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button onClick={() => setIsExpanded(v => !v)} title={isExpanded ? 'Minimise' : 'Expand'}
                  aria-label={isExpanded ? 'Minimise' : 'Expand'} style={{
                    width: 30, height: 30, borderRadius: 7, border: 'none',
                    background: 'transparent', color: C.textMuted,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 0, transition: 'all .12s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = C.text }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button onClick={closePanel} title="Close (\u2318K)" aria-label="Close" style={{
                  width: 30, height: 30, borderRadius: 7, border: 'none',
                  background: 'transparent', color: C.textMuted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: 0, transition: 'all .12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── CONTENT AREA ─── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {messages.length === 0 && !isLoading ? (
              <WelcomeScreen onSelectAction={handleSelectAction} onSuggestion={handleSuggestion} />
            ) : (
              <div className="crw-scroll" style={{
                flex: 1, overflowY: 'auto', padding: '14px',
                display: 'flex', flexDirection: 'column',
                scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,.08) transparent',
              }}>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} onFeedback={handleFeedback} onRegenerate={handleRegenerate} />
                ))}

                {isLoading && !isStreaming && messages[messages.length - 1]?.isStreaming === false && (
                  <TypingDots label={currentAction ? currentAction.label : undefined} />
                )}

                {error && (
                  <div style={{
                    textAlign: 'center', padding: '7px 11px',
                    background: 'rgba(248,113,113,.06)', borderRadius: 9,
                    border: '1px solid rgba(248,113,113,.12)',
                    color: C.red, fontSize: 11.5,
                  }}>{error}</div>
                )}

                {/* Follow-up suggestions */}
                {followUps.length > 0 && !isStreaming && !isLoading && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4, paddingLeft: 4 }}>
                    {followUps.map((s, i) => (
                      <SuggestionChip key={i} text={s.text} onClick={() => handleSuggestion(s.text)} delay={i * 60} />
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ─── INPUT AREA ─── */}
          <div style={{
            padding: '10px 12px',
            borderTop: `1px solid ${C.border}`,
            background: C.bg, flexShrink: 0,
          }}>
            {/* Action picker toggle */}
            {messages.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <button onClick={() => setShowActionPicker(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '3px 0', color: C.textMuted, fontSize: 10.5,
                  fontWeight: 500, transition: 'color .12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.textSecondary }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.textMuted }}
                >
                  {currentAction ? (
                    <>
                      <currentAction.icon size={11} color={currentAction.color} />
                      <span style={{ color: C.textSecondary }}>{currentAction.label}</span>
                    </>
                  ) : <span>Choose action</span>}
                  <ChevronDown size={10} style={{ transition: 'transform .2s', transform: showActionPicker ? 'rotate(180deg)' : 'none' }} />
                </button>

                {showActionPicker && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 12, right: 12,
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 11, padding: 5,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3,
                    marginBottom: 6, boxShadow: '0 -8px 32px rgba(0,0,0,.45)',
                    animation: 'ai-slideDown .18s ease both',
                    maxHeight: 240, overflowY: 'auto',
                  }}>
                    {ACTIONS.map(action => {
                      const Icon = action.icon
                      const isActive = action.id === selectedAction
                      return (
                        <button key={action.id} onClick={() => handleSelectAction(action.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '7px 9px', borderRadius: 7, border: 'none',
                          background: isActive ? `${action.color}10` : 'transparent',
                          borderLeft: isActive ? `2px solid ${action.color}` : '2px solid transparent',
                          cursor: 'pointer', textAlign: 'left', transition: 'background .12s',
                        }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.03)' }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                        >
                          <Icon size={13} color={isActive ? action.color : C.textMuted} />
                          <span style={{ fontSize: 11.5, fontWeight: isActive ? 600 : 400, color: isActive ? C.text : C.textSecondary }}>
                            {action.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Input row */}
            <form onSubmit={e => { e.preventDefault(); sendMessage(input) }}
              style={{ display: 'flex', alignItems: 'flex-end', gap: 6, position: 'relative' }}>
              <div style={{
                flex: 1, position: 'relative', borderRadius: 11,
                border: `1.5px solid ${C.border}`, background: C.surface,
                display: 'flex', alignItems: 'flex-end',
                transition: 'border-color .2s, box-shadow .2s',
              }}>
                <label htmlFor="crw-input" className="sr-only">Type your message</label>
                <textarea ref={inputRef} id="crw-input" value={input}
                  onChange={handleInputChange} onKeyDown={handleKeyDown}
                  placeholder={currentAction && selectedAction !== 'chat'
                    ? `${currentAction.label} mode...` : 'Ask me anything...'}
                  disabled={isLoading || isStreaming} rows={1} style={{
                    width: '100%', border: 'none', background: 'transparent',
                    padding: '9px 12px', fontSize: 13, color: C.text,
                    resize: 'none', outline: 'none', lineHeight: 1.4,
                    height: 38, minHeight: 38, maxHeight: 100, boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    e.currentTarget.parentElement!.style.borderColor = C.primaryBorder
                    e.currentTarget.parentElement!.style.boxShadow = `0 0 0 3px ${C.primaryMuted}`
                  }}
                  onBlur={e => {
                    e.currentTarget.parentElement!.style.borderColor = C.border
                    e.currentTarget.parentElement!.style.boxShadow = 'none'
                  }}
                />

                {/* Mic button */}
                {micSupported && !isLoading && !isStreaming && (
                  <button type="button" onClick={toggleMic} title={isListening ? 'Stop listening' : 'Voice input'}
                    aria-label={isListening ? 'Stop listening' : 'Voice input'} style={{
                      position: 'absolute', right: 6, bottom: 5,
                      width: 28, height: 28, borderRadius: 6, border: 'none',
                      background: isListening ? 'rgba(248,113,113,.12)' : 'transparent',
                      color: isListening ? C.red : C.textMuted,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', padding: 0, transition: 'all .15s',
                    }}
                      className={isListening ? 'crw-mic-active' : ''}
                    >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                )}
              </div>

              {/* Send / Stop button */}
              {isStreaming ? (
                <button type="button" onClick={stopGeneration} title="Stop generating"
                  aria-label="Stop generating" className="crw-stop" style={{
                    width: 38, height: 38, borderRadius: 10, border: 'none',
                    background: `rgba(248,113,113,.12)`, color: C.red,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, padding: 0,
                    transition: 'all .15s',
                  }}
                  >
                  <StopCircle size={16} />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim() || isLoading}
                  title="Send" aria-label="Send" style={{
                    width: 38, height: 38, borderRadius: 10, border: 'none',
                    background: input.trim() && !isLoading ? C.primary : C.surface,
                    color: input.trim() && !isLoading ? '#0A0A0A' : C.textMuted,
                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, padding: 0,
                    transition: 'all .18s',
                    boxShadow: input.trim() && !isLoading ? `0 2px 12px ${C.primaryGlow}` : 'none',
                  }}
                  onMouseEnter={e => { if (input.trim() && !isLoading) e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {isLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} strokeWidth={2.5} />}
                </button>
              )}
            </form>

            {/* Shortcut hint */}
            <div style={{
              textAlign: 'center', marginTop: 5, fontSize: 9.5, color: C.textMuted,
              letterSpacing: '.01em', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}>
              <span>
                <kbd style={{
                  padding: '1px 4px', borderRadius: 3,
                  background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)',
                  fontSize: 8.5, fontFamily: 'ui-monospace, monospace',
                }}>\u2318K</kbd> toggle
              </span>
              <span style={{ color: C.border }}>|</span>
              <span>Shift+Enter new line</span>
              {micSupported && (
                <>
                  <span style={{ color: C.border }}>|</span>
                  <span>Mic for voice</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
