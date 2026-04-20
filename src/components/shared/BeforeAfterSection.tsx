"use client";

import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

interface Comparison {
  before: string;
  after: string;
}

interface BeforeAfterSectionProps {
  comparisons: Comparison[];
  padding?: { top: string; bottom: string };
}

export default function BeforeAfterSection({ comparisons, padding }: BeforeAfterSectionProps) {
  const paddingTop = padding?.top ?? 'clamp(40px, 6vw, 80px)';
  const paddingBottom = padding?.bottom ?? 'clamp(64px, 10vw, 128px)';

  return (
    <section className="bg-white overflow-hidden" style={{ paddingTop, paddingBottom }}>
      <div className="max-w-[896px] mx-auto" style={{ paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(243,216,64,0.1)] border border-[rgba(243,216,64,0.2)]"
            style={{ marginBottom: 'clamp(20px, 4vw, 32px)' }}
          >
            <span
              className="text-[#374151] font-semibold tracking-[0.04em]"
              style={{ fontSize: 'clamp(11px, 1.3vw, 14px)' }}
            >
              What changes.
            </span>
          </div>
        </ScrollReveal>

        {/* Comparison cards */}
        <div className="flex flex-col" style={{ gap: 'clamp(20px, 4vw, 32px)' }}>
          {comparisons.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.12}>
              <div
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: 'clamp(12px, 2vw, 24px)' }}
              >
                {/* Before */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-2xl bg-[#FFFDF5] border border-[rgba(239,68,68,0.15)] border-l-4 border-l-[rgba(239,68,68,0.4)]"
                  style={{ padding: 'clamp(18px, 3vw, 28px) clamp(14px, 3vw, 24px)' }}
                >
                  <span
                    className="block text-[rgba(239,68,68,0.7)] text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ marginBottom: 'clamp(8px, 1.5vw, 12px)' }}
                  >
                    Before
                  </span>
                  <p
                    className="text-[#535353] leading-[1.7]"
                    style={{ fontSize: 'clamp(14px, 1.8vw, 16px)' }}
                  >
                    {item.before}
                  </p>
                </motion.div>

                {/* After */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-2xl bg-[#FFFDF5] border border-[rgba(243,216,64,0.15)] border-l-4 border-l-[#F3D840]"
                  style={{ padding: 'clamp(18px, 3vw, 28px) clamp(14px, 3vw, 24px)' }}
                >
                  <span
                    className="block text-[#B89A10] text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ marginBottom: 'clamp(8px, 1.5vw, 12px)' }}
                  >
                    After
                  </span>
                  <p
                    className="text-[#1A1A1A] font-semibold leading-[1.7]"
                    style={{ fontSize: 'clamp(14px, 1.8vw, 16px)' }}
                  >
                    {item.after}
                  </p>
                </motion.div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
