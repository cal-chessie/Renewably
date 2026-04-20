'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  BarChart3,
  Lightbulb,
  Target,
  Shield,
  Zap,
  Leaf,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'

// ============================================================================
// TYPES
// ============================================================================

type ClaudeAction =
  | 'chat'
  | 'draft_email'
  | 'call_script'
  | 'summarize_contact'
  | 'deal_insights'
  | 'generate_proposal'
  | 'next_actions'
  | 'objection_handling'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: ClaudeAction
  timestamp: Date
  isStreaming?: boolean
}

interface ActionDef {
  id: ClaudeAction
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

// ============================================================================
// ACTION DEFINITIONS
// ============================================================================

const ACTIONS: ActionDef[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-3.5 w-3.5" />, description: 'Ask anything', color: '#F3D840' },
  { id: 'draft_email', label: 'Email', icon: <Mail className="h-3.5 w-3.5" />, description: 'Draft an email', color: '#60A5FA' },
  { id: 'call_script', label: 'Call Script', icon: <Phone className="h-3.5 w-3.5" />, description: 'Call prep', color: '#34D399' },
  { id: 'summarize_contact', label: 'Summary', icon: <FileText className="h-3.5 w-3.5" />, description: 'Contact brief', color: '#A78BFA' },
  { id: 'deal_insights', label: 'Insights', icon: <BarChart3 className="h-3.5 w-3.5" />, description: 'Deal analysis', color: '#FB923C' },
  { id: 'generate_proposal', label: 'Proposal', icon: <Lightbulb className="h-3.5 w-3.5" />, description: 'Create proposal', color: '#F472B6' },
  { id: 'next_actions', label: 'Next Steps', icon: <Target className="h-3.5 w-3.5" />, description: 'Prioritised actions', color: '#2DD4BF' },
  { id: 'objection_handling', label: 'Objections', icon: <Shield className="h-3.5 w-3.5" />, description: 'Handle pushback', color: '#F87171' },
]

const SUGGESTIONS = [
  { text: 'Draft a follow-up email for the hottest deal', action: 'draft_email' as ClaudeAction },
  { text: 'What should I focus on today?', action: 'next_actions' as ClaudeAction },
  { text: 'Summarise my most active contact', action: 'summarize_contact' as ClaudeAction },
  { text: 'Write a call script for our demo next week', action: 'call_script' as ClaudeAction },
]

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const STORAGE_KEY = 'renewably-ai-messages'
const MAX_STORED_MESSAGES = 50

function loadMessages(): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return []
  }
}

function saveMessages(messages: Message[]) {
  if (typeof window === 'undefined') return
  try {
    const toStore = messages.slice(-MAX_STORED_MESSAGES).map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
      isStreaming: false,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ============================================================================
// MARKDOWN RENDERER (lightweight — no external deps)
// ============================================================================

function renderMarkdown(text: string): string {
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="ai-code-block"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="ai-h2">$1</h2>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="ai-blockquote">$1</blockquote>')
    // Unordered lists
    .replace(/^[\-\*] (.+)$/gm, '<li class="ai-li">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ai-li">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="ai-hr" />')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br />')

  // Wrap in paragraph if not starting with a block element
  if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<blockquote')) {
    html = `<p>${html}</p>`
  }

  return html
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => loadMessages())
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<ClaudeAction>('chat')
  const [showActions, setShowActions] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Pulse animation for the FAB
  const pulseRing = useSpring(0, { stiffness: 200, damping: 15 })
  const pulseOpacity = useMotionValue(0.6)
  const pulseScale = useMotionValue(1)

  useEffect(() => {
    const interval = setInterval(() => {
      pulseScale.set(1.2)
      pulseOpacity.set(0)
      setTimeout(() => {
        pulseScale.set(1)
        pulseOpacity.set(0.6)
      }, 1000)
    }, 3000)
    return () => clearInterval(interval)
  }, [pulseScale, pulseOpacity])

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      const timeout = setTimeout(() => saveMessages(messages), 500)
      return () => clearTimeout(timeout)
    }
  }, [messages])

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  // Copy message to clipboard
  const copyMessage = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopiedId(msg.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  // Clear conversation
  const clearConversation = () => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  // Send message with streaming
  const sendMessage = async (messageText: string, action: ClaudeAction = activeAction) => {
    const trimmed = messageText.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      action,
      timestamp: new Date(),
    }

    const assistantId = generateId()
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      action,
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsLoading(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      abortRef.current = new AbortController()

      // Build conversation history (exclude current streaming message)
      const history = messages
        .concat(userMessage)
        .filter(m => !m.isStreaming)
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/crm/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          action,
          history,
          stream: true,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get response')
      }

      // Handle SSE stream
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response stream')

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.content) {
                fullContent += parsed.content
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: fullContent, isStreaming: true }
                      : m
                  )
                )
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue // Ignore JSON parse errors for partial chunks
              throw e
            }
          }
        }
      }

      // Finalize message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: fullContent || "I couldn't generate a response. Please try again.", isStreaming: false }
            : m
        )
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: m.content || 'Response cancelled.', isStreaming: false }
              : m
          )
        )
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`, isStreaming: false }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
      scrollToBottom()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleSuggestion = (text: string, action: ClaudeAction) => {
    setActiveAction(action)
    sendMessage(text, action)
  }

  const selectedAction = useMemo(() => ACTIONS.find(a => a.id === activeAction), [activeAction])

  return (
    <>
      {/* ================================================================= */}
      {/* FLOATING ACTION BUTTON                                            */}
      {/* ================================================================= */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-[#F3D840]/30"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsOpen(true)}
              className="relative h-14 w-14 rounded-full bg-gradient-to-br from-[#F3D840] to-[#E5B800] text-[#1A1A1A] shadow-2xl hover:shadow-[0_0_30px_rgba(243,216,64,0.4)] flex items-center justify-center transition-shadow duration-300"
              aria-label="Open AI Assistant"
            >
              <Sparkles className="h-6 w-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* CHAT PANEL                                                        */}
      {/* ================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl crm-ai-panel"
            style={{
              width: '440px',
              height: '620px',
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {/* ── HEADER ── */}
            <div className="relative flex items-center justify-between px-4 py-3 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
              }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  background: 'radial-gradient(circle at 20% 50%, #F3D840 0%, transparent 60%)',
                }}
              />

              <div className="relative flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F3D840 0%, #E5B800 100%)' }}
                >
                  <Sparkles className="h-4.5 w-4.5 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Renewably AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-[#F3D840] animate-pulse' : 'bg-emerald-400'}`} />
                    <p className="text-[11px] text-white/50 font-medium">
                      {isLoading ? 'Thinking...' : 'Online'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center gap-1">
                {/* Clear chat */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearConversation}
                  className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
                  title="Clear conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                {/* Close */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ── ACTION BAR ── */}
            <div className="relative border-b border-gray-100 bg-gray-50/80">
              <button
                onClick={() => setShowActions(!showActions)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${selectedAction?.color}20` }}
                  >
                    <span style={{ color: selectedAction?.color, fontSize: '12px' }}>{selectedAction?.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{selectedAction?.label}</span>
                  <span className="text-[10px] text-gray-400">—</span>
                  <span className="text-[10px] text-gray-500">{selectedAction?.description}</span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showActions ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-1 px-3 pb-3">
                      {ACTIONS.map(act => (
                        <button
                          key={act.id}
                          onClick={() => {
                            setActiveAction(act.id)
                            setShowActions(false)
                          }}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-all duration-150 ${
                            activeAction === act.id
                              ? 'bg-white shadow-sm ring-1 ring-gray-200'
                              : 'hover:bg-white/60'
                          }`}
                        >
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                            style={{
                              backgroundColor: activeAction === act.id ? `${act.color}20` : 'transparent',
                              color: act.color,
                            }}
                          >
                            {act.icon}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-semibold leading-tight ${
                              activeAction === act.id ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {act.label}
                            </p>
                            <p className="text-[9px] text-gray-400 leading-tight">{act.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── MESSAGES AREA ── */}
            <div ref={scrollAreaRef} className="flex-1 overflow-hidden flex flex-col bg-white">
              {messages.length === 0 ? (
                /* ── EMPTY STATE ── */
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-4"
                  >
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #F3D840 0%, #E5B800 100%)' }}
                    >
                      <Sparkles className="h-8 w-8 text-[#1A1A1A]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                      <Leaf className="h-3.5 w-3.5 text-green-500" />
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm font-semibold text-gray-900 mb-1"
                  >
                    Hey! How can I help?
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xs text-gray-500 text-center mb-5 max-w-[260px]"
                  >
                    I can draft emails, write call scripts, analyse deals, and keep your pipeline moving.
                  </motion.p>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col gap-2 w-full max-w-[300px]"
                  >
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestion(s.text, s.action)}
                        className="group text-left text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-[#F3D840]/5 hover:border-[#F3D840]/30 hover:text-gray-900 transition-all duration-200 hover:shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          {ACTIONS.find(a => a.id === s.action)?.icon}
                          <span className="font-medium">{s.text}</span>
                        </span>
                      </button>
                    ))}
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-5 text-[10px] text-gray-300 font-medium"
                  >
                    Powered by Claude AI
                  </motion.p>
                </div>
              ) : (
                /* ── MESSAGE LIST ── */
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                            msg.role === 'user'
                              ? 'bg-gray-100'
                              : ''
                          }`}
                          style={msg.role === 'assistant' ? {
                            background: 'linear-gradient(135deg, #F3D840 0%, #E5B800 100%)',
                          } : {}}
                        >
                          {msg.role === 'user' ? (
                            <User className="h-3.5 w-3.5 text-gray-500" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-[#1A1A1A]" />
                          )}
                        </div>

                        {/* Message content */}
                        <div className={`max-w-[300px] min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {/* Action badge */}
                          {msg.action && msg.action !== 'chat' && msg.role === 'assistant' && (
                            <div className="flex items-center gap-1 mb-1">
                              {ACTIONS.find(a => a.id === msg.action)?.icon}
                              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                {ACTIONS.find(a => a.id === msg.action)?.label}
                              </span>
                            </div>
                          )}

                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-[#F3D840] text-[#1A1A1A] rounded-tr-md font-medium'
                                : 'bg-gray-50 text-gray-800 rounded-tl-md'
                            }`}
                          >
                            {msg.role === 'user' ? (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            ) : msg.content ? (
                              <div
                                className="ai-message-content prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                              />
                            ) : null}

                            {/* Streaming cursor */}
                            {msg.isStreaming && (
                              <motion.span
                                className="inline-block w-0.5 h-4 bg-[#F3D840] ml-0.5 align-middle"
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                              />
                            )}
                          </div>

                          {/* Copy button + timestamp */}
                          {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                            <div className="flex items-center gap-2 mt-1 px-1">
                              <button
                                onClick={() => copyMessage(msg)}
                                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                                title="Copy response"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span className="text-green-500">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (!messages.length || messages[messages.length - 1]?.role === 'user' || messages[messages.length - 1]?.content === '') && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2.5"
                      >
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
                          style={{ background: 'linear-gradient(135deg, #F3D840 0%, #E5B800 100%)' }}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#1A1A1A]" />
                        </div>
                        <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map(i => (
                              <motion.span
                                key={i}
                                className="h-2 w-2 rounded-full bg-[#F3D840]/60"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* ── INPUT AREA ── */}
            <div className="border-t border-gray-100 px-3 py-3 bg-white">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedAction ? `Ask as ${selectedAction.label.toLowerCase()}...` : 'Ask me anything...'}
                    disabled={isLoading}
                    rows={1}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F3D840]/30 focus:border-[#F3D840]/50 transition-all duration-200 disabled:opacity-50"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0 transition-all duration-200 disabled:opacity-30"
                  style={{
                    background: input.trim() && !isLoading
                      ? 'linear-gradient(135deg, #F3D840 0%, #E5B800 100%)'
                      : '#e5e7eb',
                    color: input.trim() && !isLoading ? '#1A1A1A' : '#9ca3af',
                    boxShadow: input.trim() && !isLoading ? '0 2px 8px rgba(243,216,64,0.3)' : 'none',
                  }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* GLOBAL STYLES                                                     */}
      {/* ================================================================= */}
      <style>{`
        /* ── AI Message Content Styling ── */
        .ai-message-content p {
          margin: 0 0 0.5em 0;
        }
        .ai-message-content p:last-child {
          margin-bottom: 0;
        }
        .ai-message-content strong {
          font-weight: 600;
          color: #1a1a1a;
        }
        .ai-message-content em {
          font-style: italic;
        }
        .ai-message-content ul, .ai-message-content ol {
          margin: 0.5em 0;
          padding-left: 1.25em;
        }
        .ai-message-content .ai-li {
          list-style: disc;
          margin: 0.2em 0;
        }
        .ai-message-content .ai-h2 {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0.75em 0 0.3em 0;
          letter-spacing: -0.01em;
        }
        .ai-message-content .ai-h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0.6em 0 0.2em 0;
        }
        .ai-message-content .ai-h4 {
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          margin: 0.5em 0 0.15em 0;
        }
        .ai-message-content .ai-blockquote {
          border-left: 3px solid #F3D840;
          padding: 0.4em 0.75em;
          margin: 0.5em 0;
          background: #FEFCE8;
          border-radius: 0 6px 6px 0;
          color: #713f12;
          font-style: italic;
        }
        .ai-message-content .ai-code-block {
          background: #1a1a1a;
          color: #e5e7eb;
          border-radius: 8px;
          padding: 0.75em 1em;
          margin: 0.5em 0;
          font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
          font-size: 0.8em;
          line-height: 1.5;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .ai-message-content .ai-inline-code {
          background: #f3f4f6;
          color: #dc2626;
          padding: 0.1em 0.35em;
          border-radius: 4px;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.85em;
        }
        .ai-message-content .ai-hr {
          border: none;
          height: 1px;
          background: #e5e7eb;
          margin: 0.75em 0;
        }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .crm-ai-panel {
            width: calc(100vw - 32px) !important;
            height: calc(100vh - 100px) !important;
            right: 16px !important;
            bottom: 16px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
    </>
  )
}
