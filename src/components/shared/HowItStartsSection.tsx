"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";

interface HowItStartsSectionProps {
  ctaTitle?: string;
  ctaButtonLabel?: string;
  ctaButtonColor?: string;
  padding?: { top: string; bottom: string };
}

const steps = [
  "We talk for an hour.",
  "You show us how you work today.",
  "We build your team.",
  "You approve the hires.",
  "We turn it on.",
];

export default function HowItStartsSection({
  ctaTitle = "Let\u2019s talk.",
  ctaButtonLabel = "Get Started",
  ctaButtonColor = "#fff",
  padding,
}: HowItStartsSectionProps) {
  const paddingTop = padding?.top ?? 'clamp(40px, 6vw, 64px)';
  const paddingBottom = padding?.bottom ?? 'clamp(40px, 6vw, 64px)';

  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsInView = useInView(stepsRef, { once: true, margin: "-80px" });

  return (
    <section style={{ backgroundColor: '#F3D840', paddingTop, paddingBottom, overflow: 'hidden' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, backgroundColor: 'rgba(26,26,26,0.1)', border: '1px solid rgba(26,26,26,0.15)', marginBottom: 'clamp(20px, 4vw, 40px)' }}>
            <span style={{ color: '#1A1A1A', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
              How it starts.
            </span>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div ref={stepsRef} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vw, 16px)', marginBottom: 'clamp(24px, 4vw, 48px)' }}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={stepsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.4, ease: "easeOut" }}
              style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 16px)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={stepsInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.3, type: "spring", stiffness: 300 }}
                style={{ width: 'clamp(28px, 4vw, 32px)', height: 'clamp(28px, 4vw, 32px)', minWidth: 'clamp(28px, 4vw, 32px)', borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ color: '#F3D840', fontWeight: 700, fontSize: 'clamp(11px, 1.5vw, 13px)' }}>{i + 1}</span>
              </motion.div>
              <p style={{ color: '#1A1A1A', fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', fontWeight: 600 }}>{step}</p>
            </motion.div>
          ))}
        </div>

        {/* Closing text */}
        <ScrollReveal delay={0.5}>
          <p style={{ color: '#374151', fontSize: 'clamp(1rem, 1.6vw, 1.125rem)', lineHeight: 1.7, marginBottom: 'clamp(12px, 2vw, 24px)' }}>
            You don&apos;t install software. You don&apos;t configure APIs. You don&apos;t learn a new system.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.6}>
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', fontWeight: 800, marginBottom: 'clamp(24px, 4vw, 48px)' }}>
            You just start managing instead of doing.
          </p>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={0.7}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 5vw, 3rem)', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, marginBottom: 'clamp(10px, 1.5vw, 16px)' }}>
              {ctaTitle}
            </h2>
            <p style={{ color: '#374151', fontSize: 'clamp(1rem, 1.6vw, 1.125rem)', marginBottom: 'clamp(20px, 3vw, 32px)' }}>
              <a href="mailto:hello@renewably.ie" style={{ textDecoration: 'underline' }}>
                hello@renewably.ie
              </a>
            </p>
            <Link
              href="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: 'clamp(12px, 2vw, 14px) 24px', background: '#1A1A1A', color: ctaButtonColor, fontWeight: 700, fontSize: 'clamp(0.875rem, 1.3vw, 1rem)', borderRadius: 9999, textDecoration: 'none' }}
            >
              {ctaButtonLabel}
              <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
