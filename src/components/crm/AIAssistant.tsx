'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageCircle, Mail, Phone, UserSearch, TrendingUp,
  FileText, ArrowRight, Shield, X, Send, Copy, Check,
  Trash2, Sparkles, ChevronDown, Loader2,
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
  shortcut?: string
}

// ============================================================================
// CONSTANTS — Design tokens matching CRM shell
// ============================================================================

const COLORS = {
  bg: '#0C0C0C',
  surface: '#161616',
  surfaceHover: '#1E1E1E',
  surfaceElevated: '#222222',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  primary: '#F3D840',
  primaryMuted: 'rgba(243,216,64,0.12)',
  primaryBorder: 'rgba(243,216,64,0.25)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.35)',
  green: '#10B981',
  blue: '#60A5FA',
  purple: '#A78BFA',
  orange: '#F97316',
  cyan: '#22D3EE',
  pink: '#EC4899',
  red: '#EF4444',
}

const ACTIONS: ActionOption[] = [
  { id: 'chat', label: 'Ask Anything', description: 'General CRM questions', icon: MessageCircle, color: COLORS.primary, shortcut: '1' },
  { id: 'draft_email', label: 'Draft Email', description: 'Professional outreach', icon: Mail, color: COLORS.blue, shortcut: '2' },
  { id: 'call_script', label: 'Call Script', description: 'Talking points & objection handling', icon: Phone, color: COLORS.green, shortcut: '3' },
  { id: 'summarize_contact', label: 'Contact Summary', description: 'History & insights', icon: UserSearch, color: COLORS.purple, shortcut: '4' },
  { id: 'deal_insights', label: 'Deal Intelligence', description: 'Health & risk analysis', icon: TrendingUp, color: COLORS.orange, shortcut: '5' },
  { id: 'generate_proposal', label: 'Generate Proposal', description: 'Full proposal content', icon: FileText, color: COLORS.cyan, shortcut: '6' },
  { id: 'next_actions', label: 'Next Actions', description: 'Prioritised recommendations', icon: ArrowRight, color: COLORS.pink, shortcut: '7' },
  { id: 'objection_handling', label: 'Objection Handling', description: 'Overcome common objections', icon: Shield, color: COLORS.red, shortcut: '8' },
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

let _msgId = 0
function uid() {
  return `ai-${Date.now()}-${++_msgId}`
}

// ============================================================================
// CSS ANIMATIONS (injected once — avoids Turbopack hydration issues)
// ============================================================================

const CSS_KEYFRAMES = `
@keyframes ai-fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ai-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ai-scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes ai-pulseRing {
  0% { transform: scale(1); opacity: 0.5; }
  70% { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes ai-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes ai-cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes ai-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes ai-slideDown {
  from { opacity: 0; transform: translateY(-8px) scaleY(0.95); }
  to { opacity: 1; transform: translateY(0) scaleY(1); }
}
@keyframes ai-glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(243,216,64,0.15), 0 0 0 0 rgba(243,216,64,0.1); }
  50% { box-shadow: 0 0 30px rgba(243,216,64,0.25), 0 0 0 8px rgba(243,216,64,0); }
}
.crm-ai-widget * { box-sizing: border-box; }
.crm-ai-widget input, .crm-ai-widget textarea, .crm-ai-widget button { font-family: inherit; }
.crm-ai-msg-enter { animation: ai-fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
.crm-ai-panel-enter { animation: ai-scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
.crm-ai-btn-pulse::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: rgba(243, 216, 64, 0.25);
  animation: ai-pulseRing 2.5s ease-out infinite;
  z-index: -1;
}
.crm-ai-typing-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.5);
  animation: ai-bounce 1.2s ease-in-out infinite;
}
.crm-ai-cursor::after {
  content: '\u258C';
  color: ${COLORS.primary};
  animation: ai-cursorBlink 0.8s step-end infinite;
  margin-left: 1px;
}
.crm-ai-shimmer {
  background: linear-gradient(90deg, transparent 0%, rgba(243,216,64,0.06) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: ai-shimmer 2s ease-in-out infinite;
}
.crm-ai-action-enter { animation: ai-fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
@media (max-width: 480px) {
  .crm-ai-panel {
    width: calc(100vw - 16px) !important;
    height: calc(100vh - 80px) !important;
    right: 8px !important;
    bottom: 72px !important;
    border-radius: 16px !important;
  }
  .crm-ai-fab { bottom: 16px !important; right: 16px !important; }
}
`

// ============================================================================
// UTILITY — Rich Markdown Renderer
// ============================================================================

function sanitize(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(text: string, isStreaming?: boolean): string {
  const escaped = sanitize(text)
  return escaped
    // Code blocks (``` ... ```)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
      return `<pre style="background:#0A0A0A;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 14px;margin:8px 0;overflow-x:auto;font-size:12.5px;line-height:1.5;color:${COLORS.textSecondary}"><code>${code.trim()}</code></pre>`
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(243,216,64,0.1);color:#F3D840;padding:1px 6px;border-radius:4px;font-size:12px;font-family:ui-monospace,monospace">$1</code>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, `<strong style="color:#FFF;font-weight:600">$1</strong>`)
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headings (### or ##)
    .replace(/^### (.+)$/gm, '<div style="font-size:13px;font-weight:700;color:#FFF;margin:12px 0 4px;letter-spacing:-0.01em">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-size:14px;font-weight:700;color:#FFF;margin:14px 0 6px;letter-spacing:-0.01em">$1</div>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:12px 0" />')
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, '<div style="display:flex;gap:8px;padding:1px 0;line-height:1.55"><span style="color:#F3D840;font-size:14px;flex-shrink:0;margin-top:1px">\u2022</span><span>$1</span></div>')
    // Ordered list items
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:8px;padding:1px 0;line-height:1.55"><span style="color:#F3D840;font-size:13px;font-weight:600;flex-shrink:0;min-width:18px">$1.</span><span>$2</span></div>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    // Single newlines
    .replace(/\n/g, '<br />')
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TypingIndicator({ label }: { label?: string }) {
  return (
    <div className="crm-ai-msg-enter" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: COLORS.primaryMuted, border: `1.5px solid ${COLORS.primaryBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Sparkles size={13} color={COLORS.primary} />
      </div>
      <div style={{
        background: COLORS.surface, borderRadius: '14px 14px 14px 4px',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span className="crm-ai-typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="crm-ai-typing-dot" style={{ animationDelay: '0.15s' }} />
        <span className="crm-ai-typing-dot" style={{ animationDelay: '0.3s' }} />
        {label && <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 6 }}>{label}</span>}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      style={{
        position: 'absolute', top: 6, right: 6,
        width: 26, height: 26, borderRadius: 6, border: 'none',
        background: 'rgba(255,255,255,0.06)', color: COLORS.textMuted,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, transition: 'opacity 0.15s, background 0.15s',
        padding: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={12} color={COLORS.green} /> : <Copy size={12} />}
    </button>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const actionDef = ACTIONS.find((a) => a.id === msg.action)

  return (
    <div
      className="crm-ai-msg-enter"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'column' : 'row',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 8,
        marginBottom: 12,
        maxWidth: isUser ? '85%' : '92%',
        marginLeft: isUser ? 'auto' : 0,
      }}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: COLORS.primaryMuted, border: `1.5px solid ${COLORS.primaryBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 2,
        }}>
          <Sparkles size={13} color={COLORS.primary} />
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {/* Action badge */}
        {actionDef && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 600, color: actionDef.color,
            background: `${actionDef.color}12`,
            padding: '2px 8px', borderRadius: 6,
            marginBottom: 4, marginLeft: isUser ? 'auto' : 0,
            letterSpacing: '0.02em',
          }}>
            <actionDef.icon size={10} />
            {actionDef.label}
          </div>
        )}

        {/* Bubble */}
        <div style={{
          background: isUser ? COLORS.primary : COLORS.surface,
          color: isUser ? '#0A0A0A' : COLORS.text,
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '10px 14px',
          fontSize: 13.5,
          lineHeight: 1.6,
          wordBreak: 'break-word',
          position: 'relative',
          whiteSpace: 'pre-wrap',
          fontWeight: isUser ? 500 : 400,
          ...(msg.isStreaming ? {} : {}),
        }}>
          {isUser ? (
            msg.content
          ) : (
            <span
              className={msg.isStreaming ? 'crm-ai-cursor' : ''}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content, msg.isStreaming) }}
            />
          )}
        </div>

        {/* Copy button for assistant messages (not during streaming) */}
        {!isUser && !msg.isStreaming && msg.content.length > 40 && (
          <CopyButton text={msg.content} />
        )}

        {/* Timestamp */}
        <div style={{
          fontSize: 10, color: COLORS.textMuted,
          marginTop: 3, padding: '0 4px',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {msg.timestamp.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </div>
  )
}

function ActionChip({
  action,
  onSelect,
  index,
}: {
  action: ActionOption
  onSelect: (a: ActionType) => void
  index: number
}) {
  const Icon = action.icon
  return (
    <button
      onClick={() => onSelect(action.id)}
      className="crm-ai-action-enter"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.surface,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        animationDelay: `${index * 40}ms`,
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = COLORS.surfaceHover
        e.currentTarget.style.borderColor = `${action.color}30`
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 4px 16px ${action.color}10`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = COLORS.surface
        e.currentTarget.style.borderColor = COLORS.border
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${action.color}14`,
        border: `1px solid ${action.color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={action.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, lineHeight: 1.2 }}>
          {action.label}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 1.3 }}>
          {action.description}
        </div>
      </div>
      {action.shortcut && (
        <div style={{
          fontSize: 10, fontWeight: 600, color: COLORS.textMuted,
          background: 'rgba(255,255,255,0.04)', padding: '2px 6px',
          borderRadius: 4, flexShrink: 0,
        }}>
          {action.shortcut}
        </div>
      )}
    </button>
  )
}

function WelcomeScreen({ onSelectAction }: { onSelectAction: (a: ActionType) => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px 24px', gap: 16,
    }}>
      {/* Logo + glow */}
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: `linear-gradient(145deg, ${COLORS.primary}25, ${COLORS.primary}08)`,
        border: `1.5px solid ${COLORS.primaryBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 32px ${COLORS.primary}12`,
      }}>
        <Sparkles size={24} color={COLORS.primary} />
      </div>

      <div style={{ textAlign: 'center', maxWidth: 280 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, letterSpacing: '-0.02em' }}>
          How can I help?
        </div>
        <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.5 }}>
          I can draft emails, write call scripts, analyse deals, and more. Pick an action or just type.
        </div>
      </div>

      {/* Action grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 6, width: '100%', maxWidth: 340,
      }}>
        {ACTIONS.map((action, i) => (
          <ActionChip key={action.id} action={action} onSelect={onSelectAction} index={i} />
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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<ActionType>('chat')
  const [showActionPicker, setShowActionPicker] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const typewriterRef = useRef<NodeJS.Timeout | null>(null)

  const contextLabel = CONTEXT_LABELS[pathname] || ''

  // Inject CSS once
  useEffect(() => {
    const id = 'crm-ai-widget-styles'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = CSS_KEYFRAMES
    document.head.appendChild(style)
  }, [])

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350)
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
      // Esc to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setShowActionPicker(false)
      }
      // Number keys 1-8 when panel is open and no input focus
      if (isOpen && !isLoading && messages.length === 0 && document.activeElement !== inputRef.current) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 8) {
          e.preventDefault()
          handleSelectAction(ACTIONS[num - 1].id)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, isLoading, messages.length])

  // Typewriter effect for streaming messages
  const typewriterDisplay = useCallback((fullText: string, msgId: string) => {
    let charIndex = 0
    const speed = Math.max(8, Math.min(25, 1500 / fullText.length)) // Adaptive speed

    const tick = () => {
      charIndex += Math.ceil(Math.random() * 3) + 1 // 1-4 chars per tick
      if (charIndex >= fullText.length) {
        charIndex = fullText.length
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, content: fullText, isStreaming: false } : m))
        )
        if (typewriterRef.current) clearInterval(typewriterRef.current)
        return
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: fullText.slice(0, charIndex), isStreaming: true } : m
        )
      )
    }

    if (typewriterRef.current) clearInterval(typewriterRef.current)
    typewriterRef.current = setInterval(tick, speed)
  }, [])

  // Select an action and set a prompt
  const handleSelectAction = useCallback((action: ActionType) => {
    setSelectedAction(action)
    setShowActionPicker(false)
    if (inputRef.current) inputRef.current.focus()

    // Pre-fill input with action-specific prompt
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

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      }

      const assistantMsgId = uid()
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        action: selectedAction !== 'chat' ? selectedAction : undefined,
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setInput('')
      setIsLoading(true)
      setError(null)

      // Auto-resize textarea back
      if (inputRef.current) inputRef.current.style.height = '38px'

      try {
        const conversationHistory = messages
          .filter((m) => !m.isStreaming && m.content)
          .map((m) => ({ role: m.role, content: m.content }))

        const body: Record<string, unknown> = {
          message: text.trim(),
          action: selectedAction !== 'chat' ? selectedAction : undefined,
          conversationHistory,
        }

        const res = await fetch('/api/crm/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to get response')
        }

        const data = await res.json()
        const reply = data.reply || 'Sorry, I couldn\'t generate a response.'

        // Typewriter effect
        typewriterDisplay(reply, assistantMsgId)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
        setError(errorMsg)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `Sorry, I encountered an error: ${errorMsg}`, isStreaming: false }
              : m
          )
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages, selectedAction, typewriterDisplay]
  )

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
    if (typewriterRef.current) clearInterval(typewriterRef.current)
    setMessages([])
    setError(null)
    setSelectedAction('chat')
    setInput('')
  }

  const currentAction = ACTIONS.find((a) => a.id === selectedAction)

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="crm-ai-widget">
      {/* ═══ FLOATING ACTION BUTTON ═══ */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="crm-ai-fab"
          title="AI Assistant (\u2318K)"
          aria-label="Open AI Assistant"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 52, height: 52, borderRadius: '50%',
            border: `1.5px solid ${COLORS.primaryBorder}`,
            background: `linear-gradient(145deg, ${COLORS.surfaceElevated}, ${COLORS.surface})`,
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 20px ${COLORS.primary}10`,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = `0 6px 32px rgba(0,0,0,0.5), 0 0 28px ${COLORS.primary}20`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.4), 0 0 20px ${COLORS.primary}10`
          }}
        >
          {/* Pulse ring */}
          <div className="crm-ai-btn-pulse" />
          <Sparkles size={22} color={COLORS.primary} />
        </button>
      )}

      {/* ═══ CHAT PANEL ═══ */}
      {isOpen && (
        <div
          ref={panelRef}
          className="crm-ai-panel crm-ai-panel-enter"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 420, height: 600,
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100vh - 80px)',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            boxShadow: `
              0 24px 80px rgba(0,0,0,0.5),
              0 0 0 1px rgba(255,255,255,0.03),
              0 0 40px ${COLORS.primary}06
            `,
          }}
        >
          {/* ─── HEADER ─── */}
          <div style={{
            padding: '14px 16px',
            background: `linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.bg} 100%)`,
            borderBottom: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}>
            {/* Top glow line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${COLORS.primary}50, transparent)`,
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Logo */}
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: COLORS.primaryMuted,
                  border: `1.5px solid ${COLORS.primaryBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={16} color={COLORS.primary} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
                      Renewably AI
                    </span>
                    {currentAction && selectedAction !== 'chat' && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, color: currentAction.color,
                        background: `${currentAction.color}15`,
                        padding: '1px 7px', borderRadius: 6,
                        letterSpacing: '0.02em',
                      }}>
                        {currentAction.label}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: isLoading ? COLORS.orange : COLORS.green,
                      display: 'block',
                      boxShadow: `0 0 6px ${isLoading ? COLORS.orange : COLORS.green}`,
                    }} />
                    <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 500 }}>
                      {isLoading ? 'Thinking...' : 'Online'}
                    </span>
                    {contextLabel && (
                      <>
                        <span style={{ color: COLORS.border }}>|</span>
                        <span style={{ fontSize: 11, color: COLORS.textMuted }}>{contextLabel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    title="Clear conversation"
                    aria-label="Clear conversation"
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: 'transparent', color: COLORS.textMuted,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', padding: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = COLORS.text }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textMuted }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => { setIsOpen(false); setShowActionPicker(false) }}
                  title="Close (\u2318K)"
                  aria-label="Close AI assistant"
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none',
                    background: 'transparent', color: COLORS.textMuted,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = COLORS.text }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textMuted }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── CONTENT AREA ─── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {messages.length === 0 && !isLoading ? (
              <WelcomeScreen onSelectAction={handleSelectAction} />
            ) : (
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                display: 'flex', flexDirection: 'column',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent',
              }}>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}

                {isLoading && messages[messages.length - 1]?.isStreaming === false && (
                  <TypingIndicator label={currentAction ? currentAction.label : undefined} />
                )}

                {error && (
                  <div style={{
                    textAlign: 'center', padding: '8px 12px',
                    background: 'rgba(239,68,68,0.08)', borderRadius: 10,
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: COLORS.red, fontSize: 12,
                  }}>
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ─── INPUT AREA ─── */}
          <div style={{
            padding: '12px 14px',
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
            flexShrink: 0,
          }}>
            {/* Action picker toggle */}
            {messages.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setShowActionPicker((v) => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 0', color: COLORS.textMuted, fontSize: 11,
                    fontWeight: 500, transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.textSecondary }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textMuted }}
                >
                  {currentAction ? (
                    <>
                      <currentAction.icon size={12} color={currentAction.color} />
                      <span style={{ color: COLORS.textSecondary }}>{currentAction.label}</span>
                    </>
                  ) : (
                    <span>Choose action</span>
                  )}
                  <ChevronDown
                    size={11}
                    style={{ transition: 'transform 0.2s', transform: showActionPicker ? 'rotate(180deg)' : 'none' }}
                  />
                </button>

                {/* Action picker dropdown */}
                {showActionPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 14, right: 14,
                      background: COLORS.surface,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      padding: 6,
                      display: 'grid', gridTemplateColumns: '1fr 1fr',
                      gap: 4,
                      marginBottom: 8,
                      boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
                      animation: 'ai-slideDown 0.2s ease both',
                      maxHeight: 260,
                      overflowY: 'auto',
                    }}
                  >
                    {ACTIONS.map((action) => {
                      const Icon = action.icon
                      const isActive = action.id === selectedAction
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleSelectAction(action.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 8, border: 'none',
                            background: isActive ? `${action.color}12` : 'transparent',
                            borderLeft: isActive ? `2px solid ${action.color}` : '2px solid transparent',
                            cursor: 'pointer', textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                        >
                          <Icon size={14} color={isActive ? action.color : COLORS.textMuted} />
                          <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? COLORS.text : COLORS.textSecondary }}>
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
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
              style={{ display: 'flex', alignItems: 'flex-end', gap: 8, position: 'relative' }}
            >
              <div style={{
                flex: 1, position: 'relative',
                borderRadius: 12,
                border: `1.5px solid ${COLORS.border}`,
                background: COLORS.surface,
                display: 'flex', alignItems: 'flex-end',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}>
                <label htmlFor="crm-ai-input" className="sr-only">Type your message</label>
                <textarea
                  ref={inputRef}
                  id="crm-ai-input"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={currentAction && selectedAction !== 'chat'
                    ? `${currentAction.label} mode...`
                    : 'Ask me anything...'
                  }
                  disabled={isLoading}
                  rows={1}
                  style={{
                    width: '100%', border: 'none', background: 'transparent',
                    padding: '9px 14px', fontSize: 13.5, color: COLORS.text,
                    resize: 'none', outline: 'none',
                    lineHeight: 1.4, height: 38, minHeight: 38, maxHeight: 100,
                    boxSizing: 'border-box',
                    '::placeholder': { color: COLORS.textMuted },
                  }}
                  onFocus={(e) => {
                    e.currentTarget.parentElement!.style.borderColor = COLORS.primaryBorder
                    e.currentTarget.parentElement!.style.boxShadow = `0 0 0 3px ${COLORS.primaryMuted}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement!.style.borderColor = COLORS.border
                    e.currentTarget.parentElement!.style.boxShadow = 'none'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                title="Send message"
                aria-label="Send message"
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none',
                  background: input.trim() && !isLoading ? COLORS.primary : COLORS.surface,
                  color: input.trim() && !isLoading ? '#0A0A0A' : COLORS.textMuted,
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, padding: 0,
                  transition: 'all 0.2s',
                  boxShadow: input.trim() && !isLoading ? `0 2px 12px ${COLORS.primary}25` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (input.trim() && !isLoading) e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {isLoading ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Send size={16} strokeWidth={2.5} />
                )}
              </button>
            </form>

            {/* Shortcut hint */}
            <div style={{
              textAlign: 'center', marginTop: 6,
              fontSize: 10, color: COLORS.textMuted,
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span>
                <kbd style={{
                  padding: '1px 5px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 9, fontFamily: 'ui-monospace, monospace',
                }}>\u2318K</kbd>
                {' '}to toggle
              </span>
              <span style={{ color: COLORS.border }}>|</span>
              <span>Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
