"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const YELLOW = "#F3D840";
const DARK = "#0A0A0A";

/* ------------------------------------------------------------------ */
/*  The wizard: our own installer-qualification questions.            */
/*  "Which part of your business do you want help with" is the spine. */
/* ------------------------------------------------------------------ */
type ChoiceStep = { key: string; title: string; subtitle?: string; type: "choice"; options: string[] };
type ContactStep = { key: string; title: string; subtitle?: string; type: "contact" };
type Step = ChoiceStep | ContactStep;

const STEPS: Step[] = [
  {
    key: "pain",
    title: "Which part of your business is eating you alive?",
    type: "choice",
    options: [
      "Chasing leads",
      "Quotes & proposals",
      "SEAI / ESB paperwork",
      "Scheduling & surveys",
      "Follow-ups & aftercare",
      "All of it",
    ],
  },
  {
    key: "volume",
    title: "How many installs a month?",
    type: "choice",
    options: ["Just starting", "1–5", "6–15", "16–40", "40+"],
  },
  {
    key: "who",
    title: "Who's handling it right now?",
    type: "choice",
    options: ["Just me", "A small office team", "A mix, and things still slip", "Nobody, it piles up"],
  },
  {
    key: "handoff",
    title: "What would you hand off first?",
    subtitle: "The one you'd take off your plate today.",
    type: "choice",
    options: [
      "Chasing leads",
      "Quotes & proposals",
      "SEAI / ESB paperwork",
      "Scheduling & surveys",
      "Follow-ups & aftercare",
    ],
  },
  {
    key: "contact",
    title: "Almost done",
    subtitle: "Where do we send your setup plan?",
    type: "contact",
  },
];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // Only show on public pages (not CRM or API routes)
  const isPublicPage = !pathname.startsWith("/crm") && !pathname.startsWith("/api");

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (!isPublicPage) return;
      // Only fire when mouse leaves through the top of the viewport (desktop behaviour)
      if (e.clientY <= 0 && !sessionStorage.getItem("exit_intent_shown")) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        setIsOpen(true);
        sessionStorage.setItem("exit_intent_shown", "1");
      }
    },
    [isPublicPage]
  );

  useEffect(() => {
    if (!isPublicPage) return;
    // Don't add listener on mobile/touch devices
    if (typeof window !== "undefined" && !window.matchMedia("(hover: none)").matches) {
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }
  }, [handleMouseLeave, isPublicPage]);

  // Focus trap + Escape key handling
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        previousFocusRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusableSelectors =
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors);
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    previousFocusRef.current?.focus();
  }, []);

  const chooseOption = (key: string, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setError(null);
    // brief highlight, then advance
    window.setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 180);
  };

  const submit = async () => {
    setError(null);
    const name = form.name.trim();
    if (!name) return setError("Please add your name.");
    if (!isEmail(form.email)) return setError("Please add a valid email address.");
    if (!consent) return setError("Please tick the box so we can share your details with the team.");

    const parts = name.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || parts[0];
    const message = [
      "Popup qualification:",
      `- Biggest drain: ${answers.pain || "—"}`,
      `- Installs/month: ${answers.volume || "—"}`,
      `- Handled by now: ${answers.who || "—"}`,
      `- Would hand off first: ${answers.handoff || "—"}`,
      form.notes.trim() ? `- Notes: ${form.notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          jobsPerMonth: answers.volume,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        setError(data.message || data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again, or email cal@renewably.ie.");
    }
    setSubmitting(false);
  };

  if (!isPublicPage) return null;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #E5E7EB",
    fontSize: 15,
    color: "#1A1A1A",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          {/* Backdrop */}
          <div
            onClick={close}
            style={{ position: "absolute", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(8px)" }}
            aria-hidden="true"
          />

          {/* Card */}
          <m.div
            ref={modalRef}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            style={{
              position: "relative",
              backgroundColor: "#fff",
              borderRadius: 20,
              maxWidth: 500,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "clamp(24px, 4vw, 36px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Yellow accent bar */}
            <div
              style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${YELLOW}, #E5C832, ${YELLOW})` }}
              aria-hidden="true"
            />

            {/* Close */}
            <button
              ref={closeButtonRef}
              onClick={close}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                backgroundColor: "#F3F4F6",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
              aria-label="Close"
            >
              <svg width="16" height="16" fill="none" stroke="#535353" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitted ? (
              /* ---------- SUCCESS ---------- */
              <div style={{ textAlign: "center", paddingTop: 8 }}>
                <div
                  style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: YELLOW, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}
                  aria-hidden="true"
                >
                  <svg width="28" height="28" fill="none" stroke={DARK} strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 id="exit-intent-title" style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, color: "#1A1A1A", marginBottom: 10 }}>
                  You&apos;re in.
                </h2>
                <p style={{ fontSize: 15, color: "#535353", lineHeight: 1.7, marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>
                  Thanks{form.name.trim() ? `, ${form.name.trim().split(/\s+/)[0]}` : ""}. We&apos;ve got your details and we&apos;ll be in touch within 24 hours. Want to grab a slot now?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Link
                    href="/contact"
                    onClick={close}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 24px", borderRadius: 9999, backgroundColor: YELLOW, color: "#1A1A1A", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
                  >
                    Book a Call
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <button onClick={close} style={{ padding: "10px 24px", borderRadius: 9999, border: "1px solid #E5E7EB", background: "transparent", color: "#535353", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    Done for now
                  </button>
                </div>
              </div>
            ) : (
              /* ---------- WIZARD ---------- */
              <div>
                {/* Header: title + step count */}
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14, paddingRight: 28 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8a6d05" }}>
                    Get your AI team
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                    {step + 1} / {STEPS.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 3, backgroundColor: "#EEF0F2", overflow: "hidden", marginBottom: 22 }}>
                  <div style={{ height: "100%", width: `${progress}%`, backgroundColor: YELLOW, borderRadius: 3, transition: "width 0.35s cubic-bezier(0.22,1,0.36,1)" }} />
                </div>

                <h2 id="exit-intent-title" style={{ fontSize: "clamp(19px, 3vw, 23px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.25, marginBottom: current.subtitle ? 4 : 18 }}>
                  {current.title}
                </h2>
                {current.subtitle && (
                  <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 18 }}>{current.subtitle}</p>
                )}

                {current.type === "choice" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {current.options.map((opt) => {
                      const selected = answers[current.key] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => chooseOption(current.key, opt)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: `1.5px solid ${selected ? "#E5B417" : "#E5E7EB"}`,
                            backgroundColor: selected ? "rgba(243,216,64,0.14)" : "#fff",
                            color: "#1A1A1A",
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "border-color 0.15s ease, background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) e.currentTarget.style.borderColor = "#D1D5DB";
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) e.currentTarget.style.borderColor = "#E5E7EB";
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Contact step */
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input style={inputStyle} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                    <input style={inputStyle} placeholder="Company name (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" />
                    <input style={inputStyle} type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                    <input style={inputStyle} type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
                    <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} placeholder="Anything you want us to know? (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#535353", lineHeight: 1.5, cursor: "pointer", marginTop: 2 }}>
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: "#E5B417", flexShrink: 0 }} />
                      <span>
                        I agree to Renewably contacting me about my enquiry. See our{" "}
                        <Link href="/privacy" style={{ color: "#8a6d05", textDecoration: "underline" }}>
                          privacy policy
                        </Link>
                        .
                      </span>
                    </label>

                    <button
                      onClick={submit}
                      disabled={submitting}
                      style={{
                        marginTop: 6,
                        width: "100%",
                        padding: "14px 24px",
                        borderRadius: 9999,
                        border: "none",
                        backgroundColor: submitting ? "#E5E7EB" : YELLOW,
                        color: submitting ? "#9CA3AF" : "#1A1A1A",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: submitting ? "default" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {submitting ? "Sending..." : "Book a Call"}
                      {!submitting && (
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}

                {error && (
                  <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "#DC2626", textAlign: "center" }}>
                    {error}
                  </p>
                )}

                {/* Footer: back + trust strip */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F1F1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  {step > 0 ? (
                    <button
                      onClick={() => {
                        setError(null);
                        setStep((s) => Math.max(0, s - 1));
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <span style={{ fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                    No obligation. You approve every hire.
                  </span>
                </div>
              </div>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
