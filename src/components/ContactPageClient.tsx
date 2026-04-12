"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";
import MagneticButton from "@/components/MagneticButton";

/* ============================================================
   DATA
   ============================================================ */
const contactInfo = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: "Phone",
    value: "+353 873958424",
    href: "tel:+353873958424",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: "Email",
    value: "hello@renewably.ie",
    href: "mailto:hello@renewably.ie",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: "Location",
    value: "Ireland",
    href: null,
  },
];

/* ============================================================
   MAIN EXPORT
   ============================================================ */
export default function ContactPageClient() {
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobsPerMonth: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setFormState("sent");
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    outline: 'none',
    color: '#1A1A1A',
    backgroundColor: '#fff',
    fontSize: 15,
    transition: 'all 0.3s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  };

  return (
    <main>
        {/* ===== HERO — Dark with photo + copy ===== */}
        <section data-theme="dark" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#0A0A0A' }}>
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32" style={{ paddingTop: 128, paddingBottom: 128 }}>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center" style={{ gap: 48 }}>
              {/* Left: Photo */}
              <ScrollReveal>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="relative max-w-md mx-auto lg:mx-0" style={{ maxWidth: 448 }}
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/founder-photo-contact.jpg"
                      alt="Renewably founder"
                      width={832}
                      height={1248}
                      className="w-full object-cover"
                      priority
                    />
                    {/* Yellow accent at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F3D840]/50 to-transparent" />
                  </div>
                  {/* Floating badge */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="absolute -bottom-4 -right-4 bg-[#F3D840] text-[#1A1A1A] px-5 py-3 rounded-xl shadow-lg font-bold text-sm"
                  >
                    Let&apos;s talk.
                  </motion.div>
                </motion.div>
              </ScrollReveal>

              {/* Right: Copy */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8"
                >
                  <motion.span
                    className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse"
                    style={{ boxShadow: "0 0 8px rgba(243,216,64,0.6)" }}
                  />
                  <span className="text-[#F3D840] text-xs sm:text-sm font-bold tracking-wide">
                    Renewably
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-6"
                >
                  Ready to stop doing
                  <br />
                  <span className="text-[#F3D840]">everything yourself?</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg"
                >
                  We talk for an hour. You show us how you work today. We build your team. You approve the hires. We turn it on.
                </motion.p>

                {/* Quick contact info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <a
                    href="mailto:hello@renewably.ie"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-[#F3D840] transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    hello@renewably.ie
                  </a>
                  <a
                    href="tel:+353873958424"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-[#F3D840] transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    +353 873958424
                  </a>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Yellow fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-[2] pointer-events-none" />
        </section>

        {/* ===== FORM + INFO SECTION ===== */}
        <section className="bg-white py-20 md:py-28" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16" style={{ gap: 64 }}>
              {/* Form — 3 columns */}
              <div className="lg:col-span-3">
                <ScrollReveal>
                  <div style={{ marginBottom: 40 }}>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] mb-3">
                      Tell us about your business
                    </h2>
                    <p className="text-[#535353] text-base leading-relaxed">
                      Fill this out and we&apos;ll get back to you within 24 hours. Or skip the form and email us directly at{" "}
                      <a href="mailto:hello@renewably.ie" className="text-[#F3D840] font-semibold hover:underline">
                        hello@renewably.ie
                      </a>.
                    </p>
                  </div>
                </ScrollReveal>

                <AnimatePresence mode="wait">
                  {formState === "sent" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#FFFDF5] border border-[#F3D840]/30 rounded-2xl p-10 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-[#F3D840] flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Message sent</h3>
                      <p className="text-[#535353]">
                        We&apos;ll be in touch within 24 hours. In the meantime, check your inbox for a confirmation email.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-6" style={{ marginTop: 32 }}
                    >
                      {/* Name row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="firstName" style={labelStyle}>First Name</label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            required
                            placeholder="John"
                            value={formData.firstName}
                            onChange={handleChange}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" style={labelStyle}>Last Name</label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            required
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={handleChange}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" style={labelStyle}>Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          placeholder="john@solarcompany.ie"
                          value={formData.email}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>

                      {/* Company */}
                      <div>
                        <label htmlFor="company" style={labelStyle}>Company Name</label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          placeholder="SolarCo Ireland"
                          value={formData.company}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>

                      {/* Jobs per month */}
                      <div>
                        <label htmlFor="jobsPerMonth" style={labelStyle}>How many installs per month?</label>
                        <select
                          id="jobsPerMonth"
                          name="jobsPerMonth"
                          value={formData.jobsPerMonth}
                          onChange={handleChange}
                          style={{ ...inputStyle, backgroundColor: '#fff' }}
                        >
                          <option value="">Select range</option>
                          <option value="1-5">1–5 installs/month</option>
                          <option value="5-10">5–10 installs/month</option>
                          <option value="10-20">10–20 installs/month</option>
                          <option value="20-50">20–50 installs/month</option>
                          <option value="50+">50+ installs/month</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label htmlFor="message" style={labelStyle}>Tell us what you need help with</label>
                        <textarea
                          id="message"
                          name="message"
                          rows={5}
                          required
                          placeholder="We're struggling with grant paperwork and customer follow-up. We do about 25 installs a month..."
                          value={formData.message}
                          onChange={handleChange}
                          style={{ ...inputStyle, resize: 'vertical' }}
                        />
                      </div>

                      {/* Submit */}
                      <div style={{ marginTop: 32 }}>
                      <button
                        type="submit"
                        disabled={formState === "sending"}
                        className="w-full sm:w-auto px-6 py-3 bg-[#F3D840] hover:bg-[#E5C832] text-[#1A1A1A] font-bold rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-[#F3D840]/20 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ padding: '12px 32px', fontSize: 15, fontWeight: 700, borderRadius: 9999 }}
                      >
                        {formState === "sending" ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </>
                        )}
                      </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar — 2 columns */}
              <div className="lg:col-span-2">
                <ScrollReveal direction="right" delay={0.2}>
                  <div className="space-y-8 lg:sticky lg:top-28" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Contact details */}
                    <div className="bg-[#FFFDF5] rounded-2xl p-6 sm:p-8 border border-[#F3D840]/10" style={{ padding: 32 }}>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-6" style={{ marginBottom: 24 }}>Get in touch directly</h3>
                      <div className="space-y-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {contactInfo.map((item) => (
                          <div key={item.label} className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F3D840] flex items-center justify-center text-[#374151] shrink-0">
                              {item.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1A1A1A] text-sm">{item.label}</p>
                              {item.href ? (
                                <a href={item.href} className="text-[#535353] hover:text-[#374151] transition-colors text-sm">
                                  {item.value}
                                </a>
                              ) : (
                                <p className="text-[#535353] text-sm">{item.value}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What happens next card */}
                    <div className="bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 text-white" style={{ padding: 32 }}>
                      <h3 className="text-lg font-bold mb-4" style={{ marginBottom: 20 }}>What happens next?</h3>
                      <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                          { step: "1", text: "We reply within 24 hours with a suggested call time." },
                          { step: "2", text: "We jump on a 60-minute call. You show us your operation." },
                          { step: "3", text: "We build your AI team and deploy it. You approve everything." },
                        ].map((item) => (
                          <div key={item.step} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#F3D840] flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[#1A1A1A] font-bold text-xs">{item.step}</span>
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick CTA */}
                    <div className="bg-[#F3D840] rounded-2xl p-6 sm:p-8 text-center" style={{ padding: 32 }}>
                      <p className="text-[#1A1A1A] font-bold text-lg mb-2" style={{ marginBottom: 8 }}>Prefer to talk now?</p>
                      <p className="text-[#374151] text-sm mb-4" style={{ marginBottom: 24 }}>Book a free strategy call and we&apos;ll walk you through everything.</p>
                      <MagneticButton href="tel:+353873958424">
                        Call Us
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </MagneticButton>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
