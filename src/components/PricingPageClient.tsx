"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { pricingFaqs } from "@/data/pricingFaqs";

const includedItems = [
  "Your full workforce of eight AI agents (CEO, Operations, Support, Grants, Logistics, ESB, QA, Reporting); start with two and add the rest as you scale, with the Marketing Agent on the roadmap",
  "Operations dashboard (works alongside your existing CRM)",
  "Calendar integration",
  "Email integration",
  "Weekly reports",
  "Dedicated support",
  "Free updates and new agents",
];

const separateItems = [
  "AI model usage (typically \u20AC50\u2013\u20AC200/month depending on volume)",
  "You bring your own API keys",
  "No markup, no middleman",
];

const faqs = pricingFaqs;

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: "#fff",
        border: isOpen ? "1px solid rgba(243,216,64,0.4)" : "1px solid rgba(0,0,0,0.06)",
        boxShadow: isOpen ? "0 4px 20px rgba(243,216,64,0.08)" : "none",
        transition: "border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "clamp(16px, 2.5vw, 20px) clamp(16px, 3vw, 24px)",
          cursor: "pointer",
          border: "none",
          backgroundColor: "transparent",
          textAlign: "left",
          gap: 16,
        }}
        aria-expanded={isOpen}
      >
        <span style={{ color: "#1A1A1A", fontSize: 16, fontWeight: 600, flex: 1, paddingRight: 16 }}>
          {q}
        </span>
        <span
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            minWidth: 24,
            borderRadius: "50%",
            backgroundColor: isOpen ? "#F3D840" : "rgba(0,0,0,0.05)",
            color: isOpen ? "#1A1A1A" : "#535353",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
            transition: "background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            flexShrink: 0,
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition: "grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.7, padding: "0 clamp(16px, 3vw, 24px) clamp(16px, 2.5vw, 20px)" }}>
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPageClient() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <div>
      {/* Hero - Dark */}
      <section style={{ position: "relative", overflow: "hidden", backgroundColor: "#0A0A0A" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "clamp(60px, 12vh, 100px) 20px 64px" }}>
          <ScrollReveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 9999, backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", marginBottom: 32 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#F3D840" }} />
              <span style={{ color: "#F3D840", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
                Simple, Honest Pricing
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 style={{ color: "#FFFFFF", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 16, textAlign: "center" }}>
              One price. Your whole AI team.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(16px, 2vw, 20px)", lineHeight: 1.7, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
              No hidden fees. No per-seat charges. No surprises. Just one monthly payment for your complete AI workforce.
            </p>
          </ScrollReveal>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: "linear-gradient(to top, white, transparent)", zIndex: 2, pointerEvents: "none" }} />
      </section>

      {/* Pricing Card */}
      <section style={{ backgroundColor: "#FFFFFF" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px 48px" }}>
          <ScrollReveal>
            <div className="hp-card" style={{
              borderRadius: 16,
              border: "2px solid #F3D840",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}>
              {/* Card Header */}
              <div style={{
                backgroundColor: "#0A0A0A",
                padding: "28px 20px 24px",
                textAlign: "center",
              }}>
                <p style={{ color: "#F3D840", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  AI Workforce Plan
                </p>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                  <span style={{ color: "#FFFFFF", fontSize: "clamp(32px, 10vw, 48px)", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>&euro;1,000</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, fontVariantNumeric: "tabular-nums" }}>&ndash; &euro;1,500</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 8 }}>per month, depending on team size</p>
                <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 9999, backgroundColor: "rgba(243,216,64,0.15)", border: "1px solid rgba(243,216,64,0.3)" }}>
                  <span style={{ color: "#F3D840", fontSize: 13, fontWeight: 600 }}>+ One-time setup fee</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "20px" }}>
                {/* Included */}
                <div style={{ marginBottom: 32 }}>
                  <p style={{ color: "#1A1A1A", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
                    What&apos;s included
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
                    {includedItems.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <svg style={{ width: 18, height: 18, color: "#8a6d05", flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span style={{ color: "#535353", fontSize: 14, lineHeight: 1.5 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 32 }} />

                {/* Separate Costs */}
                <div style={{ marginBottom: 32 }}>
                  <p style={{ color: "#1A1A1A", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
                    What you pay separately
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
                    {separateItems.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <svg style={{ width: 18, height: 18, color: "#6B7280", flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span style={{ color: "#535353", fontSize: 14, lineHeight: 1.5 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Link
                  href="/contact"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    padding: "16px 24px",
                    backgroundColor: "#F3D840",
                    color: "#0A0A0A",
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 12,
                    textDecoration: "none",
                    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(243,216,64,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Book a Call
                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 12 }}>
                  Month-to-month. No lock-in. Cancel anytime.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ backgroundColor: "#FFFDF5" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 64px" }}>
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 9999, backgroundColor: "rgba(243,216,64,0.1)", border: "1px solid rgba(243,216,64,0.2)" }}>
                  <span style={{ color: "#374151", fontSize: "clamp(11px, 1.3vw, 14px)", fontWeight: 600, letterSpacing: "0.04em" }}>
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 700, fontSize: "0.9em", letterSpacing: "0.06em", color: "#8a6d05", marginRight: 9 }}>01</span>Common Questions
                  </span>
                </div>
              </div>
              <h2 style={{ color: "#1A1A1A", fontSize: "clamp(24px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                Frequently asked questions
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1.5vw, 12px)" }}>
              {faqs.map((faq, i) => (
                <FAQItem
                  key={faq.q}
                  q={faq.q}
                  a={faq.a}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA - Yellow */}
      <section style={{ backgroundColor: "#F3D840" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "64px 20px", textAlign: "center" }}>
          <ScrollReveal>
            <h2 style={{ color: "#0A0A0A", fontSize: "clamp(24px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Ready to meet your team?
            </h2>
            <p style={{ color: "#374151", fontSize: "clamp(16px, 2vw, 20px)", lineHeight: 1.7, marginBottom: 32, maxWidth: 440, margin: "0 auto 32px" }}>
              Book a 15 minute call. We scope your build, quote it fixed, and you approve every hire before anything goes live.
            </p>
            <Link
              href="/contact"
              className="pricing-bottom-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 28px",
                backgroundColor: "#0A0A0A",
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 9999,
                textDecoration: "none",
                transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Book a Call
              <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </ScrollReveal>
          <style>{`
            @media (max-width: 767px) {
              .pricing-bottom-cta {
                width: 100% !important;
                box-sizing: border-box;
              }
            }
          `}</style>
        </div>
      </section>
    </div>
  );
}
