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
    <section data-theme="dark" className="bg-[#0A0A0A] overflow-hidden" style={{ paddingTop, paddingBottom }}>
      <div className="max-w-[896px] mx-auto text-center" style={{ paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15"
            style={{ marginBottom: 'clamp(28px, 5vw, 48px)' }}
          >
            <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
            <span
              className="text-white font-semibold tracking-[0.04em]"
              style={{ fontSize: 'clamp(11px, 1.3vw, 14px)' }}
            >
              {badgeText}
            </span>
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={0.1}>
          <h2
            className="font-extrabold text-white leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(24px, 5vw, 48px)', marginBottom: 'clamp(16px, 3vw, 32px)' }}
          >
            Solar installers doing 20+ jobs a month.
          </h2>
        </ScrollReveal>

        {/* Body */}
        <ScrollReveal delay={0.2}>
          <p
            className="text-white/70 leading-[1.7]"
            style={{ fontSize: 'clamp(15px, 2vw, 20px)', marginBottom: 'clamp(12px, 2vw, 24px)' }}
          >
            You have more work than time. You&apos;re turning down leads because you can&apos;t handle the admin. You&apos;re burning out your best people.
          </p>
        </ScrollReveal>

        {/* Closing */}
        <ScrollReveal delay={0.3}>
          <p
            className="text-white/50 leading-[1.7] max-w-[640px] mx-auto"
            style={{ fontSize: 'clamp(14px, 1.8vw, 18px)' }}
          >
            Not for one-person shows. Not for hobbyists. For actual solar companies that want to scale without hiring ten more humans.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
