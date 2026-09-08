"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const YELLOW = "#F3D840";
const DARK = "#0A0A0A";

/* ------------------------------------------------------------------ */
/*  The wizard: our own installer-qualification questions.            */
/*  "Which part of your business do you want help with" is the spine. */
/* ------------------------------------------------------------------ */
type ChoiceStep = { key: string; title: string; subtitle?: string; type: "choice"; options: string[]; icons?: boolean };
type ContactStep = { key: string; title: string; subtitle?: string; type: "contact" };
type Step = ChoiceStep | ContactStep;

const STEPS: Step[] = [
  {
    key: "pain",
    title: "Which part of your business needs the most help?",
    type: "choice",
    icons: true,
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
    icons: true,
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

/* Line icon per business area (used on the "which part" steps). */
function AreaIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    "Chasing leads": "M13 10V3L4 14h7v7l9-11h-7z",
    "Quotes & proposals":
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    "SEAI / ESB paperwork":
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    "Scheduling & surveys":
      "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    "Follow-ups & aftercare":
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    "All of it": "M5 3v4M3 5h4M19 17v4m-2-2h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z",
  };
  const d = paths[label];
  if (!d) return null;
  return (
    <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
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
  const reduce = useReducedMotion();

  const isPublicPage = !pathname.startsWith("/crm") && !pathname.startsWith("/api");

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (!isPublicPage) return;
      if (e.clientY <= 0 && !sessionStorage.getItem("exit_intent_shown")) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        setStep(0);
        setDir(1);
        setSubmitted(false);
        setError(null);
        setIsOpen(true);
        sessionStorage.setItem("exit_intent_shown", "1");
      }
    },
    [isPublicPage]
  );

  useEffect(() => {
    if (!isPublicPage) return;
    if (typeof window !== "undefined" && !window.matchMedia("(hover: none)").matches) {
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }
  }, [handleMouseLeave, isPublicPage]);

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
    setDir(1);
    window.setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 190);
  };

  const goBack = () => {
    setError(null);
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    setError(null);
    const name = form.name.trim();
    if (!name) return setError("Please add your name.");
    if (!isEmail(form.email)) return setError("Please add a valid email address.");
    if (!consent) return setError("Please tick the box so we can get in touch.");

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
  const slide = reduce ? 0 : 34;

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
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };
  const focusOn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "#E5B417";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(243,216,64,0.18)";
  };
  const focusOff = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "#E5E7EB";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          <div
            onClick={close}
            style={{ position: "absolute", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(8px)" }}
            aria-hidden="true"
          />

          <m.div
            ref={modalRef}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            style={{
              position: "relative",
              backgroundColor: "#fff",
              borderRadius: 22,
              maxWidth: 500,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "clamp(24px, 4vw, 36px)",
              boxShadow: "0 30px 70px rgba(10,10,10,0.35)",
            }}
          >
            <div
              style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${YELLOW}, #E5C832, ${YELLOW})` }}
              aria-hidden="true"
            />

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
                zIndex: 3,
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E9EAEC")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
              aria-label="Close"
            >
              <svg width="16" height="16" fill="none" stroke="#535353" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitted ? (
              /* ---------- SUCCESS ---------- */
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                style={{ textAlign: "center", paddingTop: 8 }}
              >
                <m.div
                  initial={reduce ? false : { scale: 0.6, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                  style={{ width: 120, height: 120, margin: "0 auto 8px" }}
                >
                  <Image
                    src="/robots/waving-nobg.png"
                    alt=""
                    aria-hidden
                    width={159}
                    height={308}
                    style={{ width: "auto", height: 120, margin: "0 auto", display: "block", filter: "drop-shadow(0 12px 16px rgba(0,0,0,0.15))" }}
                  />
                </m.div>
                <h2 id="exit-intent-title" style={{ fontSize: "clamp(21px, 4vw, 27px)", fontWeight: 800, color: "#1A1A1A", marginBottom: 10 }}>
                  You&apos;re in.
                </h2>
                <p style={{ fontSize: 15, color: "#535353", lineHeight: 1.7, maxWidth: 390, margin: "0 auto 24px" }}>
                  Thanks{form.name.trim() ? `, ${form.name.trim().split(/\s+/)[0]}` : ""}. We&apos;ve got your details and we&apos;ll be in touch within 24 hours.
                </p>
                <button
                  onClick={close}
                  style={{ width: "100%", padding: "13px 24px", borderRadius: 9999, border: "none", backgroundColor: YELLOW, color: "#1A1A1A", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 22px rgba(243,216,64,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  Done
                </button>
              </m.div>
            ) : (
              /* ---------- WIZARD ---------- */
              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12, paddingRight: 28 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8a6d05" }}>
                    Get your AI team
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                    {step + 1} / {STEPS.length}
                  </span>
                </div>

                <div style={{ height: 6, borderRadius: 3, backgroundColor: "#EEF0F2", overflow: "hidden", marginBottom: 22 }}>
                  <m.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                    style={{ height: "100%", background: `linear-gradient(90deg, #E5C832, ${YELLOW})`, borderRadius: 3 }}
                  />
                </div>

                <AnimatePresence mode="wait" custom={dir}>
                  <m.div
                    key={step}
                    custom={dir}
                    initial={{ opacity: 0, x: dir * slide }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir * slide }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] as const }}
                  >
                    <h2 id="exit-intent-title" style={{ fontSize: "clamp(19px, 3vw, 23px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.25, marginBottom: current.subtitle ? 4 : 18 }}>
                      {current.title}
                    </h2>
                    {current.subtitle && <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 18 }}>{current.subtitle}</p>}

                    {current.type === "choice" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {current.options.map((opt) => {
                          const selected = answers[current.key] === opt;
                          const withIcon = current.icons;
                          return (
                            <button
                              key={opt}
                              onClick={() => chooseOption(current.key, opt)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                width: "100%",
                                textAlign: "left",
                                padding: withIcon ? "12px 14px" : "14px 16px",
                                borderRadius: 12,
                                border: `1.5px solid ${selected ? "#E5B417" : "#E5E7EB"}`,
                                backgroundColor: selected ? "rgba(243,216,64,0.14)" : "#fff",
                                color: "#1A1A1A",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (!selected) e.currentTarget.style.borderColor = "#D1D5DB";
                                e.currentTarget.style.transform = "translateX(2px)";
                              }}
                              onMouseLeave={(e) => {
                                if (!selected) e.currentTarget.style.borderColor = "#E5E7EB";
                                e.currentTarget.style.transform = "translateX(0)";
                              }}
                            >
                              {withIcon && (
                                <span
                                  style={{
                                    flexShrink: 0,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: selected ? YELLOW : "rgba(243,216,64,0.16)",
                                    color: selected ? DARK : "#8a6d05",
                                    transition: "background-color 0.15s ease, color 0.15s ease",
                                  }}
                                >
                                  <AreaIcon label={opt} />
                                </span>
                              )}
                              <span style={{ flex: 1 }}>{opt}</span>
                              <span style={{ flexShrink: 0, color: selected ? "#1A1A1A" : "#C7CACE", display: "flex" }} aria-hidden="true">
                                {selected ? (
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <input style={inputStyle} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onFocus={focusOn} onBlur={focusOff} autoComplete="name" />
                        <input style={inputStyle} placeholder="Company name (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} onFocus={focusOn} onBlur={focusOff} autoComplete="organization" />
                        <input style={inputStyle} type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onFocus={focusOn} onBlur={focusOff} autoComplete="email" />
                        <input style={inputStyle} type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} onFocus={focusOn} onBlur={focusOff} autoComplete="tel" />
                        <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} placeholder="Anything you want us to know? (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} onFocus={focusOn} onBlur={focusOff} />

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
                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (submitting) return;
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 8px 22px rgba(243,216,64,0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
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
                  </m.div>
                </AnimatePresence>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F1F1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  {step > 0 ? (
                    <button
                      onClick={goBack}
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
                  <span style={{ fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>No obligation. You approve every hire.</span>
                </div>
              </div>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
