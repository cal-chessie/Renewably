"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { howItStartsSteps } from "@/data/howItStartsSteps";

interface HowItStartsSectionProps {
  ctaTitle?: string;
  ctaButtonLabel?: string;
  ctaButtonColor?: string;
  sectionNumber?: string;
  padding?: { top: string; bottom: string };
}

export default function HowItStartsSection({
  ctaTitle = "Let\u2019s talk.",
  ctaButtonLabel = "Get Started",
  ctaButtonColor = "#fff",
  sectionNumber = "08",
  padding,
}: HowItStartsSectionProps) {
  const paddingTop = padding?.top ?? 'clamp(40px, 6vw, 64px)';
  const paddingBottom = padding?.bottom ?? 'clamp(40px, 6vw, 64px)';

  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsInView = useInView(stepsRef, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#F3D840] overflow-hidden" style={{ paddingTop, paddingBottom }}>
      <div className="max-w-[896px] mx-auto" style={{ paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A]/10 border border-[#1A1A1A]/15"
            style={{ marginBottom: 'clamp(24px, 4vw, 40px)' }}
          >
            <span
              className="text-[#1A1A1A] font-semibold tracking-[0.04em]"
              style={{ fontSize: 'clamp(11px, 1.3vw, 14px)' }}
            >
<span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700, fontSize: '0.9em', letterSpacing: '0.06em', color: 'rgba(26,26,26,0.5)', marginRight: 9 }}>{sectionNumber}</span>How it starts.
            </span>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div
          ref={stepsRef}
          className="flex flex-col relative"
          style={{ gap: 'clamp(10px, 2vw, 16px)', marginBottom: 'clamp(24px, 4vw, 48px)' }}
        >
          {/* Connecting spine drawn through the step dots */}
          <motion.div
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            animate={stepsInView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              top: "clamp(14px, 2vw, 16px)",
              bottom: "clamp(14px, 2vw, 16px)",
              left: "calc(clamp(28px, 4vw, 32px) / 2 - 1px)",
              width: 2,
              background: "rgba(26,26,26,0.18)",
              transformOrigin: "top",
              borderRadius: 2,
              zIndex: 0,
            }}
          />
          {howItStartsSteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={stepsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center"
              style={{ gap: 'clamp(10px, 2vw, 16px)', position: 'relative', zIndex: 1 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={stepsInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.3, type: "spring", stiffness: 300 }}
                className="rounded-full bg-[#1A1A1A] flex items-center justify-center"
                style={{ width: 'clamp(28px, 4vw, 32px)', height: 'clamp(28px, 4vw, 32px)', minWidth: 'clamp(28px, 4vw, 32px)' }}
              >
                <span
                  className="text-[#F3D840] font-bold"
                  style={{ fontSize: 'clamp(11px, 1.5vw, 13px)' }}
                >
                  {i + 1}
                </span>
              </motion.div>
              <p
                className="text-[#1A1A1A] font-semibold"
                style={{ fontSize: 'clamp(1rem, 1.8vw, 1.25rem)' }}
              >
                {step}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing text */}
        <ScrollReveal delay={0.5}>
          <p
            className="text-gray-700 leading-[1.7]"
            style={{ fontSize: 'clamp(0.9375rem, 1.8vw, 1.125rem)', marginBottom: 'clamp(12px, 2vw, 24px)' }}
          >
            You don&apos;t install software. You don&apos;t configure APIs. You don&apos;t learn a new system.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.6}>
          <p
            className="text-[#1A1A1A] font-extrabold"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', marginBottom: 'clamp(24px, 4vw, 48px)' }}
          >
            You just start managing instead of doing.
          </p>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={0.7}>
          <div className="text-center">
            <h2
              className="font-extrabold text-[#1A1A1A] leading-[1.15]"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', letterSpacing: '-0.02em', marginBottom: 'clamp(10px, 1.5vw, 16px)' }}
            >
              {ctaTitle}
            </h2>
            <p
              className="text-gray-700"
              style={{ fontSize: 'clamp(0.9375rem, 1.8vw, 1.125rem)', marginBottom: 'clamp(20px, 3vw, 32px)' }}
            >
              <a href="mailto:cal@renewably.ie" className="underline">
                cal@renewably.ie
              </a>
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#1A1A1A] font-bold rounded-full no-underline"
              style={{ padding: 'clamp(12px, 2vw, 14px) 24px', color: ctaButtonColor, fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
            >
              {ctaButtonLabel}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
