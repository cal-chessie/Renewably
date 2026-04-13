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
    <section style={{ backgroundColor: '#fff', paddingTop, paddingBottom, overflow: 'hidden' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, backgroundColor: 'rgba(243,216,64,0.1)', border: '1px solid rgba(243,216,64,0.2)', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
            <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
              What changes.
            </span>
          </div>
        </ScrollReveal>

        {/* Comparison cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 4vw, 32px)' }}>
          {comparisons.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.12}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'clamp(12px, 2vw, 24px)' }} className="md:grid-cols-2">
                {/* Before */}
                <motion.div
                  whileHover={{ y: -2 }}
                  style={{ padding: 'clamp(18px, 3vw, 28px) clamp(14px, 3vw, 24px)', borderRadius: 16, backgroundColor: '#FFFDF5', borderLeft: '4px solid rgba(239,68,68,0.4)', border: '1px solid rgba(239,68,68,0.15)', borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: 'rgba(239,68,68,0.4)' }}
                >
                  <span style={{ display: 'block', color: 'rgba(239,68,68,0.7)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'clamp(8px, 1.5vw, 12px)' }}>
                    Before
                  </span>
                  <p style={{ color: '#535353', fontSize: 'clamp(14px, 1.8vw, 16px)', lineHeight: 1.7 }}>
                    {item.before}
                  </p>
                </motion.div>

                {/* After */}
                <motion.div
                  whileHover={{ y: -2 }}
                  style={{ padding: 'clamp(18px, 3vw, 28px) clamp(14px, 3vw, 24px)', borderRadius: 16, backgroundColor: '#FFFDF5', borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: '#F3D840', border: '1px solid rgba(243,216,64,0.15)' }}
                >
                  <span style={{ display: 'block', color: '#B89A10', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'clamp(8px, 1.5vw, 12px)' }}>
                    After
                  </span>
                  <p style={{ color: '#1A1A1A', fontSize: 'clamp(14px, 1.8vw, 16px)', lineHeight: 1.7, fontWeight: 600 }}>
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
