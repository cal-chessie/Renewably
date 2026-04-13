"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import MagneticButton from "@/components/MagneticButton";
import Image from "next/image";
import Link from "next/link";

/* ============================================================
   CONSTANTS
   ============================================================ */
const DARK = "#0A0A0A";
const YELLOW = "#F3D840";
const WHITE = "#FFFFFF";

const contactChannels = [
  {
    icon: "phone",
    label: "Call Us",
    value: "+353 873958424",
    href: "tel:+353873958424",
    desc: "Mon-Fri, 9am-6pm GMT",
  },
  {
    icon: "email",
    label: "Email Us",
    value: "hello@renewably.ie",
    href: "mailto:hello@renewably.ie",
    desc: "We reply within 2 hours during business hours",
  },
  {
    icon: "location",
    label: "Based In",
    value: "Ireland",
    href: null,
    desc: "Serving every county",
  },
];

const steps = [
  { num: "01", title: "You fill in the form", desc: "Takes 60 seconds. Tell us about your business, your pain points, and what you need." },
  { num: "02", title: "We reply within 24 hours", desc: "A real human reviews your enquiry and sends a personalised response with a suggested call time." },
  { num: "03", title: "We jump on a 60-minute call", desc: "You show us how you work. We show you what your AI team would look like. No pitch, no pressure." },
  { num: "04", title: "We build your team", desc: "We configure your AI agents, connect your tools, and deploy everything. You approve every step." },
  { num: "05", title: "You start managing instead of doing", desc: "Your AI team handles the grunt work. You focus on growing your business and installing more solar." },
];

const painPoints = [
  "Drowning in customer emails and missing leads?",
  "Spending weekends on grant paperwork?",
  "Losing track of jobs and chasing your own team?",
  "Turning away work because you can't handle the admin?",
  "Paying staff to do work a machine could do faster?",
  "Missing SEAI deadlines and losing grant money?",
];

const faqs = [
  { q: "Is there any commitment or contract?", a: "No. We operate month-to-month. There is no lock-in, no minimum term, and no cancellation penalty. You can cancel anytime. We believe our service should earn your business every single month." },
  { q: "How much does it cost?", a: "Monthly plans start at EUR 1,000 for the full AI workforce of 8 agents. There is a one-time setup fee. You bring your own AI API keys and pay model providers directly, typically EUR 50-200/month. No markup from us." },
  { q: "How quickly can I get set up?", a: "Most installers are fully operational within 5-7 business days. The initial call takes 60 minutes, configuration takes 2-3 days, and we run a testing period before going live. We do not rush." },
  { q: "Will this work for my size of operation?", a: "We work with solar installers doing anywhere from 5 to 100+ installs per month. The AI workforce scales with you. Whether you are a one-man band or a 20-person crew, we build your team to match your volume." },
  { q: "What integrations do you support?", a: "We integrate with your existing CRM, email (Gmail, Outlook), calendar (Google Calendar, Outlook), phone system, and project management tools. We also support WhatsApp Business for customer communication." },
  { q: "Is my data secure?", a: "Absolutely. All data is encrypted at rest and in transit. We are fully GDPR-compliant, based in Ireland, and never share your data with third parties. You can request data deletion at any time." },
];

/* ============================================================
   ICON COMPONENTS (inline SVG to avoid surrogate pairs)
   ============================================================ */
function PhoneIcon({ color = "#374151" }: { color?: string }) {
  return (
    <svg width="20" height="20" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function EmailIcon({ color = "#374151" }: { color?: string }) {
  return (
    <svg width="20" height="20" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function MapPinIcon({ color = "#374151" }: { color?: string }) {
  return (
    <svg width="20" height="20" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke={YELLOW} viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon({ color = "#1A1A1A" }: { color?: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="#535353" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="20" height="20" fill="none" stroke="#535353" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  );
}

/* ============================================================
   MINI COMPONENTS
   ============================================================ */
function ContactCard({ item, index }: { item: typeof contactChannels[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const iconMap = { phone: <PhoneIcon />, email: <EmailIcon />, location: <MapPinIcon /> };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 20,
        borderRadius: 16,
        border: "1px solid",
        borderColor: isHovered ? "rgba(243,216,64,0.3)" : "rgba(26,26,26,0.08)",
        backgroundColor: isHovered ? "#FFFDF5" : WHITE,
        cursor: item.href ? "pointer" : "default",
        transition: "all 0.3s ease",
      }}
      onClick={() => item.href && window.open(item.href, "_self")}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: isHovered ? YELLOW : "#F7F7F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.3s ease",
        flexShrink: 0,
      }}>
        {iconMap[item.icon as keyof typeof iconMap]}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
          {item.label}
        </p>
        {item.href ? (
          <a href={item.href} style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", textDecoration: "none" }}>
            {item.value}
          </a>
        ) : (
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{item.value}</p>
        )}
        <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>{item.desc}</p>
      </div>
      {item.href && (
        <motion.div animate={{ x: isHovered ? 4 : 0 }} transition={{ duration: 0.2 }}>
          <ArrowRightIcon color="#9CA3AF" />
        </motion.div>
      )}
    </motion.div>
  );
}

function FAQItem({ item, index, isOpen, onToggle }: { item: typeof faqs[0]; index: number; isOpen: boolean; onToggle: () => void }) {
  return (
    <ScrollReveal delay={index * 0.05}>
      <div
        onClick={onToggle}
        style={{
          borderBottom: "1px solid rgba(26,26,26,0.08)",
          cursor: "pointer",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 0",
          gap: 16,
        }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", flex: 1 }}>{item.q}</h4>
          <div style={{ flexShrink: 0 }}>
            <ChevronDownIcon open={isOpen} />
          </div>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#535353", paddingBottom: 20 }}>
                {item.a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollReveal>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function ContactPageClient() {
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formError, setFormError] = useState<string>("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobsPerMonth: "",
    message: "",
  });



  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePainPointToggle = (point: string) => {
    setSelectedPainPoints((prev) => {
      const next = prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point];
      // Pre-fill message from selected pain points
      if (next.length > 0) {
        setFormData((fd) => ({
          ...fd,
          message: next.map((p) => p.replace("?", ".")).join(" "),
        }));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");
    setFormError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || "Something went wrong. Please try again.");
        setFormState("error");
        return;
      }

      setFormState("sent");
    } catch {
      setFormError("Could not connect to the server. Please check your connection and try again.");
      setFormState("error");
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "2px solid #e5e7eb",
    outline: "none",
    color: "#1A1A1A",
    backgroundColor: "#fff",
    fontSize: 15,
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  };

  const getInputStyle = (name: string): React.CSSProperties => ({
    ...inputBase,
    borderColor: focusedField === name ? YELLOW : "#e5e7eb",
    boxShadow: focusedField === name ? "0 0 0 3px rgba(243,216,64,0.15)" : "none",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 8,
  };

  return (
    <main>
      {/* ===== HERO SECTION ===== */}
      <section ref={heroRef} style={{ position: "relative", minHeight: '100dvh', display: 'flex', alignItems: 'center', overflow: "hidden", backgroundColor: DARK }}>
        {/* Animated dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Yellow glow orb */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: "10%",
            right: "15%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(243,216,64,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" >
          <div style={{ padding: 'clamp(60px, 10vh, 100px) 0' }}>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Copy */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 16px",
                    borderRadius: 9999,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    marginBottom: 28,
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: YELLOW, boxShadow: "0 0 12px rgba(243,216,64,0.6)" }}
                  />
                  <span style={{ color: YELLOW, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Let&apos;s talk
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, color: WHITE, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 24 }}
                >
                  Stop doing
                  <br />
                  <span style={{ color: YELLOW }}>everything yourself.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", marginBottom: 40, maxWidth: 480 }}
                >
                  One hour. That is all it takes. We will look at your operation, show you what your AI team would look like, and give you a straight answer on whether it makes sense for your business. No fluff, no sales pitch.
                </motion.p>

                {/* Quick stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="flex flex-wrap gap-6"
                >
                  {[
                    { value: "< 24h", label: "Response time" },
                    { value: "60 min", label: "Strategy call" },
                    { value: "5-7 days", label: "To go live" },
                  ].map((stat) => (
                    <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: YELLOW }} />
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 800, color: WHITE, lineHeight: 1.2 }}>{stat.value}</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right: Founder photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative max-w-md mx-auto lg:mx-0"
                style={{ maxWidth: 400 }}
              >
                <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.4)" }}>
                  <Image
                    src="/founder-photo-contact.jpg"
                    alt="Renewably founder"
                    width={832}
                    height={1248}
                    className="w-full object-cover"
                    priority
                  />
                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: "linear-gradient(to top, rgba(243,216,64,0.4), transparent)" }} />
                </div>
                {/* Floating badge */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  style={{
                    position: "absolute",
                    bottom: -12,
                    right: -12,
                    backgroundColor: YELLOW,
                    color: "#1A1A1A",
                    padding: "10px 20px",
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 13,
                    boxShadow: "0 8px 30px rgba(243,216,64,0.3)",
                  }}
                >
                  Free strategy call
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #FFFFFF, transparent)", zIndex: 2, pointerEvents: "none" }} />
      </section>

      {/* ===== PAIN POINTS SECTION ===== */}
      <section style={{ backgroundColor: WHITE, paddingTop: 'clamp(48px, 10vw, 80px)', paddingBottom: 'clamp(48px, 10vw, 80px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Sound familiar?
              </p>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15 }}>
                Tick the ones that keep you up at night.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {painPoints.map((point, i) => {
              const isSelected = selectedPainPoints.includes(point);
              return (
                <motion.button
                  key={point}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePainPointToggle(point)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: "2px solid",
                    borderColor: isSelected ? YELLOW : "rgba(26,26,26,0.08)",
                    backgroundColor: isSelected ? "#FFFDF5" : WHITE,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    fontSize: 15,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? "#1A1A1A" : "#535353",
                    width: "100%",
                    boxShadow: isSelected ? "0 4px 20px rgba(243,216,64,0.1)" : "none",
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: "2px solid",
                    borderColor: isSelected ? YELLOW : "#d1d5db",
                    backgroundColor: isSelected ? YELLOW : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}>
                    {isSelected && <CheckIcon />}
                  </div>
                  {point}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedPainPoints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginTop: 32 }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 24px",
                  borderRadius: 12,
                  backgroundColor: "#FFFDF5",
                  border: "1px solid rgba(243,216,64,0.2)",
                }}>
                  <div style={{ color: YELLOW, flexShrink: 0 }}>
                    <ClockIcon />
                  </div>
                  <p style={{ fontSize: 14, color: "#374151" }}>
                    <strong>{selectedPainPoints.length} thing{selectedPainPoints.length > 1 ? "s" : ""} you should not have to deal with.</strong>{" "}
                    Skip the queue and book a call directly.
                  </p>
                  <a
                    href="tel:+353873958424"
                    style={{
                      marginLeft: "auto",
                      padding: "8px 20px",
                      borderRadius: 9999,
                      backgroundColor: YELLOW,
                      color: "#1A1A1A",
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Call Now
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ===== FORM + SIDEBAR ===== */}
      <section style={{ backgroundColor: "#F9FAFB", paddingTop: 'clamp(48px, 10vw, 96px)', paddingBottom: 'clamp(48px, 10vw, 96px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start" style={{ gap: 64 }}>
            {/* Form — 3 columns */}
            <div className="lg:col-span-3">
              <ScrollReveal>
                <div style={{ marginBottom: 40 }}>
                  <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "#1A1A1A", marginBottom: 12 }}>
                    Tell us about your business
                  </h2>
                  <p style={{ fontSize: 16, lineHeight: 1.7, color: "#535353" }}>
                    Fill this in and we will get back to you within 24 hours with a personalised response.
                    Takes about 60 seconds.
                  </p>
                </div>
              </ScrollReveal>

              <AnimatePresence mode="wait">
                {formState === "sent" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Success State */}
                    <div style={{
                      padding: "32px 20px",
                      borderRadius: 24,
                      backgroundColor: "#FFFDF5",
                      border: "1px solid rgba(243,216,64,0.2)",
                      textAlign: "center",
                    }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          backgroundColor: YELLOW,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 24px",
                        }}
                      >
                        <svg width="32" height="32" fill="none" stroke="#1A1A1A" viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>

                      <h3 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", marginBottom: 12 }}>
                        You are in.
                      </h3>
                      <p style={{ fontSize: 16, lineHeight: 1.7, color: "#535353", maxWidth: 400, margin: "0 auto 32px" }}>
                        We have received your enquiry. A real human will review it and get back to you within 24 hours with a suggested call time. Check your inbox for a confirmation.
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                        <MagneticButton href="/">
                          Back to Home
                          <ArrowRightIcon />
                        </MagneticButton>
                        <a href="mailto:hello@renewably.ie" style={{ fontSize: 14, color: "#9CA3AF", textDecoration: "underline", marginTop: 8 }}>
                          Or email us directly at hello@renewably.ie
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ) : formState === "error" ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div style={{
                      padding: "32px 20px",
                      borderRadius: 24,
                      backgroundColor: "#FEF2F2",
                      border: "1px solid rgba(239,68,68,0.2)",
                      textAlign: "center",
                    }}>
                      <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        backgroundColor: "#FEE2E2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                      }}>
                        <svg width="32" height="32" fill="none" stroke="#EF4444" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                      <h3 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", marginBottom: 12 }}>Something went wrong</h3>
                      <p style={{ fontSize: 16, lineHeight: 1.7, color: "#535353", marginBottom: 32 }}>{formError}</p>
                      <button
                        type="button"
                        onClick={() => setFormState("idle")}
                        style={{
                          padding: "14px 32px",
                          fontSize: 15,
                          fontWeight: 700,
                          borderRadius: 9999,
                          backgroundColor: YELLOW,
                          color: "#1A1A1A",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: "0 4px 15px rgba(243,216,64,0.2)",
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                  >
                    {/* Progress indicator */}
                    <div style={{ marginBottom: 32 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        {["Name", "Email", "Company", "Message"].map((field, i) => {
                          const fieldMap = ["firstName", "email", "company", "message"];
                          const isFilled = formData[fieldMap[i] as keyof typeof formData]?.trim().length > 0;
                          return (
                            <motion.div
                              key={field}
                              animate={{
                                backgroundColor: isFilled ? YELLOW : "#E5E7EB",
                                width: isFilled ? 32 : 24,
                              }}
                              transition={{ duration: 0.3 }}
                              style={{
                                height: 4,
                                borderRadius: 2,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Form fields in a card */}
                    <div style={{
                      padding: "20px 16px",
                      borderRadius: 20,
                      backgroundColor: WHITE,
                      border: "1px solid rgba(26,26,26,0.06)",
                      boxShadow: "0 4px 30px rgba(0,0,0,0.04)",
                    }}>
                      {/* Name row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="firstName" style={labelStyle}>First Name *</label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            required
                            placeholder="John"
                            value={formData.firstName}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("firstName")}
                            onBlur={() => setFocusedField(null)}
                            style={getInputStyle("firstName")}
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" style={labelStyle}>Last Name *</label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            required
                            placeholder="Murphy"
                            value={formData.lastName}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("lastName")}
                            onBlur={() => setFocusedField(null)}
                            style={getInputStyle("lastName")}
                          />
                        </div>
                      </div>

                      {/* Email + Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ marginTop: 20 }}>
                        <div>
                          <label htmlFor="email" style={labelStyle}>Email Address *</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="john@solarco.ie"
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            style={getInputStyle("email")}
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" style={labelStyle}>Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            placeholder="+353 87 123 4567"
                            value={formData.phone}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("phone")}
                            onBlur={() => setFocusedField(null)}
                            style={getInputStyle("phone")}
                          />
                        </div>
                      </div>

                      {/* Company */}
                      <div style={{ marginTop: 20 }}>
                        <label htmlFor="company" style={labelStyle}>Company Name</label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          placeholder="SolarCo Ireland"
                          value={formData.company}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("company")}
                          onBlur={() => setFocusedField(null)}
                          style={getInputStyle("company")}
                        />
                      </div>

                      {/* Jobs per month */}
                      <div style={{ marginTop: 20 }}>
                        <label htmlFor="jobsPerMonth" style={labelStyle}>Installs Per Month</label>
                        <select
                          id="jobsPerMonth"
                          name="jobsPerMonth"
                          value={formData.jobsPerMonth}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("jobsPerMonth")}
                          onBlur={() => setFocusedField(null)}
                          style={{ ...getInputStyle("jobsPerMonth"), cursor: "pointer" }}
                        >
                          <option value="">Select range</option>
                          <option value="1-5">1 - 5 installs/month</option>
                          <option value="5-10">5 - 10 installs/month</option>
                          <option value="10-20">10 - 20 installs/month</option>
                          <option value="20-50">20 - 50 installs/month</option>
                          <option value="50+">50+ installs/month</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div style={{ marginTop: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <label htmlFor="message" style={labelStyle}>Tell us what you need help with *</label>
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                            {formData.message.length > 0 && `${formData.message.length} characters`}
                          </span>
                        </div>
                        <textarea
                          id="message"
                          name="message"
                          rows={5}
                          required
                          placeholder="We are struggling with grant paperwork and customer follow-up. We do about 25 installs a month..."
                          value={formData.message}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("message")}
                          onBlur={() => setFocusedField(null)}
                          style={{ ...getInputStyle("message"), resize: "vertical", minHeight: 120 }}
                        />
                      </div>

                      {/* Submit */}
                      <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        <motion.button
                          type="submit"
                          disabled={formState === "sending"}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "16px 36px",
                            fontSize: 16,
                            fontWeight: 700,
                            borderRadius: 9999,
                            backgroundColor: formState === "sending" ? "#E5C832" : YELLOW,
                            color: "#1A1A1A",
                            border: "none",
                            cursor: formState === "sending" ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease",
                            boxShadow: "0 8px 30px rgba(243,216,64,0.2)",
                          }}
                        >
                          {formState === "sending" ? (
                            <>
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" />
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
                              <ArrowRightIcon />
                            </>
                          )}
                        </motion.button>
                        <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                          We will never spam you. Read our{" "}
                          <Link href="/privacy" style={{ color: "#535353", textDecoration: "underline" }}>Privacy Policy</Link>
                        </p>
                      </div>
                    </div>

                    {/* Inline spin animation */}
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar — 2 columns */}
            <div className="lg:col-span-2">
              <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "sticky", top: 100 }}>
                {/* Contact channels */}
                <ScrollReveal direction="right" delay={0.2}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {contactChannels.map((item, i) => (
                      <ContactCard key={item.label} item={item} index={i} />
                    ))}
                  </div>
                </ScrollReveal>

                {/* What happens next — dark card */}
                <ScrollReveal direction="right" delay={0.3}>
                  <div style={{
                    padding: 28,
                    borderRadius: 20,
                    backgroundColor: DARK,
                    color: WHITE,
                  }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>What happens next?</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {steps.slice(0, 3).map((item) => (
                        <div key={item.num} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                          <div style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            backgroundColor: YELLOW,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#1A1A1A",
                          }}>
                            {item.num}
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: WHITE, marginBottom: 2 }}>{item.title}</p>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                        <strong style={{ color: YELLOW }}>Zero commitment.</strong> No contracts, no lock-in. We earn your business every month.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Quick CTA — Yellow card */}
                <ScrollReveal direction="right" delay={0.4}>
                  <div style={{
                    padding: 28,
                    borderRadius: 20,
                    backgroundColor: YELLOW,
                    textAlign: "center",
                  }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#1A1A1A", marginBottom: 6 }}>
                      Prefer to talk right now?
                    </p>
                    <p style={{ fontSize: 14, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
                      Grab your phone. We pick up fast.
                    </p>
                    <MagneticButton href="tel:+353873958424">
                      <PhoneIcon color="#1A1A1A" />
                      Call +353 873958424
                    </MagneticButton>
                  </div>
                </ScrollReveal>

                {/* Social proof mini */}
                <ScrollReveal direction="right" delay={0.5}>
                  <div style={{
                    padding: 20,
                    borderRadius: 16,
                    border: "1px solid rgba(26,26,26,0.06)",
                    backgroundColor: WHITE,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      {/* Star rating */}
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={YELLOW} stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Trusted by Irish installers</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#535353", lineHeight: 1.7, fontStyle: "italic" }}>
                      &ldquo;Renewably cut our admin time by 70%. The grants agent alone paid for itself in the first month.&rdquo;
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", marginTop: 8 }}>
                      Eamonn K. — SolarCo Dublin
                    </p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — FULL TIMELINE ===== */}
      <section style={{ backgroundColor: WHITE, paddingTop: 96, paddingBottom: 96 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                The process
              </p>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 16 }}>
                Five steps. That is it.
              </h2>
              <p style={{ fontSize: 16, color: "#535353", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
                From first contact to a fully operational AI team. No complicated onboarding. No IT department required.
              </p>
            </div>
          </ScrollReveal>

          {/* Timeline */}
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute",
              left: 24,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: "#E5E7EB",
            }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {steps.map((step, i) => (
                <ScrollReveal key={step.num} delay={i * 0.08}>
                  <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                    {/* Circle */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        backgroundColor: i < 3 ? YELLOW : "#F3F4F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 16,
                        fontWeight: 800,
                        color: i < 3 ? "#1A1A1A" : "#9CA3AF",
                        boxShadow: i < 3 ? "0 4px 20px rgba(243,216,64,0.25)" : "none",
                        zIndex: 1,
                      }}
                    >
                      {step.num}
                    </motion.div>

                    {/* Content */}
                    <div style={{ paddingTop: 4, flex: 1 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
                        {step.title}
                      </h3>
                      <p style={{ fontSize: 15, lineHeight: 1.7, color: "#535353" }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section style={{ backgroundColor: "#F9FAFB", paddingTop: 96, paddingBottom: 96 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Common questions
              </p>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15 }}>
                Got questions? We have answers.
              </h2>
            </div>
          </ScrollReveal>

          <div>
            {faqs.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                index={i}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>

          <ScrollReveal>
            <div style={{ textAlign: "center", marginTop: 48, padding: "24px 32px", borderRadius: 16, backgroundColor: WHITE, border: "1px solid rgba(26,26,26,0.06)" }}>
              <p style={{ fontSize: 16, color: "#535353", marginBottom: 16 }}>
                Still have questions?
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <MagneticButton href="mailto:hello@renewably.ie">
                  <EmailIcon color="#1A1A1A" />
                  Email Us
                </MagneticButton>
                <MagneticButton href="tel:+353873958424">
                  <PhoneIcon color="#1A1A1A" />
                  Call Us
                </MagneticButton>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== FINAL CTA — Yellow ===== */}
      <section style={{ backgroundColor: YELLOW, paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" style={{ textAlign: "center" }}>
          <ScrollReveal>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.1, marginBottom: 20 }}
            >
              Your AI team is ready.
              <br />
              Are you?
            </motion.h2>
            <p style={{ fontSize: 17, color: "#374151", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.7 }}>
              Every day you wait is another day of doing admin that your AI team could handle in seconds.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.a
                href="#contact-form"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 36px",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 9999,
                  backgroundColor: "#1A1A1A",
                  color: YELLOW,
                  textDecoration: "none",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                }}
              >
                Get Started Now
                <ArrowRightIcon color={YELLOW} />
              </motion.a>
              <motion.a
                href="tel:+353873958424"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 36px",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 9999,
                  backgroundColor: "rgba(0,0,0,0.08)",
                  color: "#1A1A1A",
                  textDecoration: "none",
                }}
              >
                <PhoneIcon color="#1A1A1A" />
                Call Instead
              </motion.a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
