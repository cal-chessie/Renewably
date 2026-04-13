"use client";

import ScrollReveal from "@/components/ScrollReveal";

interface AudienceSectionProps {
  badgeText?: string;
  padding?: { top: string; bottom: string };
}

export default function AudienceSection({ badgeText = "Who is this for?", padding }: AudienceSectionProps) {
  const paddingTop = padding?.top ?? 'clamp(48px, 6vw, 80px)';
  const paddingBottom = padding?.bottom ?? 'clamp(48px, 6vw, 112px)';

  return (
    <section data-theme="dark" style={{ backgroundColor: '#0A0A0A', paddingTop, paddingBottom, overflow: 'hidden' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 'clamp(28px, 5vw, 48px)' }}>
            <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
            <span style={{ color: '#fff', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
              {badgeText}
            </span>
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={0.1}>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 'clamp(16px, 3vw, 32px)' }}>
            Solar installers doing 20+ jobs a month.
          </h2>
        </ScrollReveal>

        {/* Body */}
        <ScrollReveal delay={0.2}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(15px, 2vw, 20px)', lineHeight: 1.7, marginBottom: 'clamp(12px, 2vw, 24px)' }}>
            You have more work than time. You&apos;re turning down leads because you can&apos;t handle the admin. You&apos;re burning out your best people.
          </p>
        </ScrollReveal>

        {/* Closing */}
        <ScrollReveal delay={0.3}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(14px, 1.8vw, 18px)', lineHeight: 1.7, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            Not for one-person shows. Not for hobbyists. For actual solar companies that want to scale without hiring ten more humans.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
