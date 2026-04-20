"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Image from "next/image";

/* ─── Types ─── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Suggestion {
  text: string;
  icon: string;
}

/* ─── Constants ─── */
const YELLOW = "#F3D840";
const DARK = "#0A0A0A";
const DARK2 = "#1A1A1A";

const WELCOME_MESSAGE = `Hey there! I'm the Renewably AI assistant. I can help you learn about our AI workforce platform for solar PV installers in Ireland.

What would you like to know?`;

const INITIAL_SUGGESTIONS: Suggestion[] = [
  { text: "What is Renewably?", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { text: "Pricing info", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" },
  { text: "Book a demo", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { text: "How does it work?", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

const FOLLOW_UP_SUGGESTIONS: Suggestion[] = [
  { text: "Pricing details", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" },
  { text: "AI agents list", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { text: "Getting started", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { text: "Free trial?", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const PAGE_CONTEXT_MAP: Record<string, string> = {
  "/": "the homepage",
  "/about": "the About Us page",
  "/workforce": "the AI Workforce page — showing the 9 AI agents",
  "/services": "the Services page",
  "/pricing": "the Pricing page",
  "/blog": "the Blog page",
  "/contact": "the Contact page — looking to get in touch",
};

let msgCounter = 0;
function uid() {
  return `msg-${Date.now()}-${++msgCounter}`;
}

// Persistent visitor ID for lead deduplication (stored in sessionStorage per tab)
function getVisitorId(): string {
  if (typeof window === 'undefined') return `srv-${Date.now()}`;
  // GDPR: Check cookie consent before creating/storing visitor ID
  try {
    const consent = localStorage.getItem('renewably_cookie_consent');
    if (consent) {
      const prefs = JSON.parse(consent);
      if (!prefs.marketing) return `anon-${Date.now()}`;
    }
  } catch { /* ignore */ }
  let id = sessionStorage.getItem('renewably_vid');
  if (!id) {
    id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('renewably_vid', id);
  }
  return id;
}

/* ─── Typing Indicator Component ─── */
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 4 }}>
      {/* Bot avatar */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        border: `2px solid ${YELLOW}33`,
      }}>
        <Image
          src="/robot-2-nobg.png"
          alt=""
          width={28}
          height={28}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {/* Dots bubble */}
      <div style={{
        background: "#F5F5F5",
        borderRadius: 16,
        borderRadiusBottomRight: 4,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        maxWidth: 60,
      }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#999",
              display: "block",
            }}
            animate={{
              y: [0, -5, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Chat Widget ─── */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  /* ─── Scroll to bottom ─── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* ─── Focus input when opened ─── */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  /* ─── Add welcome message on first open ─── */
  useEffect(() => {
    if (open && !hasInteracted && messages.length === 0) {
      setMessages([
        {
          id: uid(),
          role: "assistant",
          content: WELCOME_MESSAGE,
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, hasInteracted, messages.length]);

  /* ─── Send message ─── */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      setError(null);
      setShowSuggestions(false);
      setHasInteracted(true);

      // Auto-resize textarea back
      if (inputRef.current) {
        inputRef.current.style.height = "40px";
      }

      try {
        const pageContext = PAGE_CONTEXT_MAP[pathname] || `page: ${pathname}`;
        const visitorId = getVisitorId();
        const res = await fetch("/api/chat-widget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            pageContext,
            visitorId,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to get response");
        }

        const data = await res.json();
        const botMsg: Message = {
          id: uid(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);

        // Show follow-up suggestions after a short delay
        setTimeout(() => {
          setSuggestions(FOLLOW_UP_SUGGESTIONS);
          setShowSuggestions(true);
        }, 600);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages, pathname]
  );

  /* ─── Handle submit ─── */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  /* ─── Handle suggestion click ─── */
  const handleSuggestion = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  /* ─── Auto-resize textarea ─── */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = "40px";
      if (el.scrollHeight > 40 && el.scrollHeight < 120) {
        el.style.height = `${el.scrollHeight}px`;
      }
    },
    []
  );

  /* ─── Handle key down ─── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  /* ─── Format time ─── */
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  /* ─── Render message content with basic markdown-like formatting ─── */
  const renderContent = (content: string) => {
    // Split by newlines and render
    const lines = content.split("\n");
    return lines.map((line, i) => {
      // Bullet point
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={i} style={{ display: "flex", gap: 6, paddingLeft: 4, marginBottom: 2 }}>
            <span style={{ color: YELLOW, fontSize: 13, flexShrink: 0, lineHeight: "20px" }}>&#8226;</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineStyles(line.slice(2)) }} />
          </div>
        );
      }
      // Numbered list
      const numMatch = line.match(/^(\d+)\.\s/);
      if (numMatch) {
        return (
          <div key={i} style={{ display: "flex", gap: 6, paddingLeft: 4, marginBottom: 2 }}>
            <span style={{ color: YELLOW, fontSize: 13, flexShrink: 0, lineHeight: "20px", minWidth: 16 }}>
              {numMatch[1]}.
            </span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineStyles(line.slice(numMatch[0].length)) }} />
          </div>
        );
      }
      // Bold headings (lines ending with :)
      if (line.endsWith(":") && line.length < 60) {
        return (
          <div key={i} style={{ fontWeight: 600, marginBottom: 2, marginTop: i > 0 ? 8 : 0 }}>
            {line}
          </div>
        );
      }
      // Empty line
      if (line.trim() === "") {
        return <div key={i} style={{ height: 8 }} />;
      }
      return (
        <div key={i} dangerouslySetInnerHTML={{ __html: formatInlineStyles(line) }} />
      );
    });
  };

  /* ─── Basic inline formatting (bold with **) ─── */
  const formatInlineStyles = (text: string) => {
    // Sanitize: escape HTML entities first to prevent XSS from AI output
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong style="fontWeight:600;color:#1A1A1A">$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:#F3D84022;padding:1px 5px;borderRadius:4px;fontSize:12px;color:#1A1A1A">$1</code>');
  };

  /* ─── SVG Icon helper ─── */
  const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );

  const unreadCount = open ? 0 : hasInteracted ? 0 : 1;

  return (
    <>
      {/* ── Floating Button ── */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 150 }}>
        <motion.button
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 60,
            height: 60,
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            padding: 0,
            overflow: "hidden",
            background: DARK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          animate={
            !open
              ? {
                  boxShadow: [
                    `0 4px 24px ${YELLOW}55, 0 0 0 0 ${YELLOW}44`,
                    `0 4px 24px ${YELLOW}55, 0 0 0 12px ${YELLOW}00`,
                  ],
                }
              : {}
          }
          transition={
            !open
              ? { boxShadow: { duration: 2, repeat: Infinity, ease: "easeOut" } }
              : { duration: 0.2 }
          }
          aria-label="Open chat"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="24" height="24" fill="none" stroke="#FFF" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="avatar"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 50,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src="/robot-2-nobg.png"
                  alt="Chat with Renewably"
                  fill
                  style={{
                    objectFit: "cover",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Unread badge — outside button so it's not clipped by overflow:hidden */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#EF4444",
              color: "#FFF",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${DARK}`,
              zIndex: 1,
            }}
          >
            1
          </motion.div>
        )}
      </div>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
            style={{
              position: "fixed",
              bottom: 90,
              right: 20,
              zIndex: 150,
              width: 380,
              maxWidth: "calc(100vw - 24px)",
              borderRadius: 20,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px " + YELLOW + "22",
              height: "min(600px, calc(100vh - 120px))",
              background: "#FFF",
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                background: `linear-gradient(135deg, ${DARK} 0%, ${DARK2} 100%)`,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Renewably Logo */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: `${YELLOW}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                    padding: 3,
                  }}
                >
                  <Image
                    src="/logo-white.png"
                    alt=""
                    width={44}
                    height={44}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ color: "#FFF", fontWeight: 700, fontSize: 14, margin: 0, letterSpacing: "-0.01em" }}>
                      Renewably AI
                    </p>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: DARK,
                        background: YELLOW,
                        padding: "1px 6px",
                        borderRadius: 6,
                        letterSpacing: "0.02em",
                      }}
                    >
                      LIVE
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#4ADE80",
                        display: "block",
                      }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 500 }}>
                      {isTyping ? "Typing..." : "Online now"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.5)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                aria-label="Close chat"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* ── Messages Area ── */}
            <div
              id="chat-messages"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "#FAFAFA",
                /* Custom scrollbar */
                scrollbarWidth: "thin",
                scrollbarColor: `${YELLOW}44 transparent`,
              }}
            >
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "assistant" ? (
                    /* ── Bot Message ── */
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "85%" }}>
                      {/* Robot avatar */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          overflow: "hidden",
                          flexShrink: 0,
                          border: `2px solid ${YELLOW}33`,
                          background: "#FFF",
                        }}
                      >
                        <Image
                          src="/robot-2-nobg.png"
                          alt=""
                          width={28}
                          height={28}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      {/* Message bubble */}
                      <div>
                        <div
                          style={{
                            background: "#FFF",
                            borderRadius: "16px 16px 16px 4px",
                            padding: "10px 14px",
                            color: "#1A1A1A",
                            fontSize: 13.5,
                            lineHeight: 1.55,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {renderContent(msg.content)}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#AAA",
                            marginTop: 3,
                            paddingLeft: 4,
                          }}
                        >
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── User Message ── */
                    <div style={{ maxWidth: "80%" }}>
                      <div
                        style={{
                          background: DARK,
                          borderRadius: "16px 16px 4px 16px",
                          padding: "10px 14px",
                          color: "#FFF",
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.content}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#AAA",
                          marginTop: 3,
                          paddingRight: 4,
                          textAlign: "right",
                        }}
                      >
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    textAlign: "center",
                    padding: "8px 12px",
                    background: "#FEF2F2",
                    borderRadius: 10,
                    color: "#DC2626",
                    fontSize: 12,
                  }}
                >
                  {error}
                  <button
                    onClick={() => setError(null)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#DC2626",
                      cursor: "pointer",
                      fontWeight: 600,
                      marginLeft: 8,
                      fontSize: 12,
                    }}
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {/* Quick reply suggestions */}
              {showSuggestions && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    paddingTop: 4,
                  }}
                >
                  {suggestions.map((s) => (
                    <motion.button
                      key={s.text}
                      onClick={() => handleSuggestion(s.text)}
                      whileHover={{ y: -1, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: 20,
                        border: `1px solid ${YELLOW}33`,
                        background: `${YELLOW}08`,
                        color: DARK,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${YELLOW}18`;
                        e.currentTarget.style.borderColor = `${YELLOW}66`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${YELLOW}08`;
                        e.currentTarget.style.borderColor = `${YELLOW}33`;
                      }}
                    >
                      <Icon d={s.icon} size={14} />
                      {s.text}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid #F0F0F0",
                background: "#FFF",
                flexShrink: 0,
              }}
            >
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    borderRadius: 14,
                    border: `1.5px solid #E5E5E5`,
                    background: "#F9F9F9",
                    display: "flex",
                    alignItems: "flex-end",
                    transition: "border-color 0.2s",
                  }}
                >
                  <label htmlFor="chat-input" className="sr-only">Type your message</label>
                  <textarea
                    id="chat-input"
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    aria-label="Type your message"
                    placeholder="Ask me anything about Renewably..."
                    rows={1}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      padding: "10px 14px",
                      fontSize: 13.5,
                      color: DARK,
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      lineHeight: 1.4,
                      height: 40,
                      maxHeight: 120,
                      minHeight: 40,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Send message"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    border: "none",
                    background: input.trim() && !isTyping ? YELLOW : "#E5E5E5",
                    cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={input.trim() && !isTyping ? DARK : "#999"}
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                </motion.button>
              </form>
              <div
                style={{
                  textAlign: "center",
                  marginTop: 6,
                  fontSize: 10,
                  color: "#BBB",
                  letterSpacing: "0.01em",
                }}
              >
                Powered by Renewably AI &middot;{" "}
                <a
                  href="/contact"
                  onClick={() => setOpen(false)}
                  style={{ color: YELLOW, textDecoration: "none", fontWeight: 500 }}
                >
                  Talk to a human
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
