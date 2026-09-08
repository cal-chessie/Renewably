"use client";

import dynamic from "next/dynamic";
import ScrollReveal from "@/components/ScrollReveal";
import { useInViewOnce } from "@/lib/useInViewOnce";
import Link from "next/link";
import Image from "next/image";
/* Skeleton loader for lazy-loaded dashboards */
function DashboardSkeleton() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)', borderRadius: 16, aspectRatio: '16/10', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar skeleton */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 120, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 60, height: 12, borderRadius: 4, background: 'rgba(243,216,64,0.15)' }} />
      </div>
      {/* Stats row skeleton */}
      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ width: 40, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
            <div style={{ width: 56, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{ flex: 1, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, height: 80 }} />
        ))}
      </div>
    </div>
  );
}
const OperationsDashboard = dynamic(() => import("@/components/OperationsDashboard"), { ssr: false, loading: () => <DashboardSkeleton /> });
const SupportDashboard = dynamic(() => import("@/components/SupportDashboard"), { ssr: false, loading: () => <DashboardSkeleton /> });
const GrantsDashboard = dynamic(() => import("@/components/GrantsDashboard"), { ssr: false, loading: () => <DashboardSkeleton /> });
const LogisticsDashboard = dynamic(() => import("@/components/LogisticsDashboard"), { ssr: false, loading: () => <DashboardSkeleton /> });
const ReportingDashboard = dynamic(() => import("@/components/ReportingDashboard"), { ssr: false, loading: () => <DashboardSkeleton /> });

/* ============================================================
   DATA - 8 AI Agents (Marketing on the roadmap)
   ============================================================ */
const agents: Array<{ num: string; title: string; tagline: string; body: string; closing: string }> = [
  {
    num: "01",
    title: "Lead Response Agent",
    tagline: "Answers every enquiry. Books the call. Texts back missed calls.",
    body: "This is your front desk. It answers emails, web forms and chat the moment they land, and it texts back the calls you miss while you are up on a roof. It handles the usual questions on pricing, grants and timelines, and it books consultations straight into your calendar.",
    closing: "You only see the ones that need you. The rest are handled before you check your phone.",
  },
  {
    num: "02",
    title: "Operations Agent",
    tagline: "Runs the pipeline. Briefs you weekly. Spots the stalls.",
    body: "This is your chief of staff. It tracks every job from enquiry to handover, and it knows where each one sits: survey booked, proposal sent, grant tracked, install scheduled, paperwork signed. When a job stops moving, it tells you.",
    closing: "Every week you get one brief. What moved, what stalled, what needs you. You approve, you override, you stay in charge.",
  },
  {
    num: "03",
    title: "Site Survey Agent",
    tagline: "Books the survey. Preps the details. Confirms the visit.",
    body: "Once a lead is warm, this agent finds your next free working day, skips the weekends, and books the site survey into your diary. It sends the customer the details and the confirmation, and it reschedules when something changes.",
    closing: "No back and forth on times. The survey is booked before the lead goes cold.",
  },
  {
    num: "04",
    title: "Proposal Agent",
    tagline: "Drafts the proposal. Prices the job. Ready for your sign-off.",
    body: "After the survey, this agent drafts the proposal from the numbers: system size, output, the SEAI grant, the savings. It lays it out the way you present it. You read it, change what you want, and send it.",
    closing: "The draft is on your desk, not on your to-do list. You approve every one before it goes out.",
  },
  {
    num: "05",
    title: "Grant Tracker Agent",
    tagline: "Tracks every SEAI application. Watches the deadlines. Flags the delays.",
    body: "This agent keeps your SEAI grants moving. It tracks where each application is, what it is waiting on, and when it is due. It watches the deadlines so none slip, and it flags anything that stalls so you can step in.",
    closing: "Nothing sits forgotten. You always know which grant is where. It tracks the application; you and the customer stay in control of the submission.",
  },
  {
    num: "06",
    title: "Follow-Up Agent",
    tagline: "Chases the quiet leads. Re-warms the cold ones. Never forgets.",
    body: "Leads go quiet. Jobs stall. This agent chases the ones that have gone silent, re-warms the ones that cooled off, and nudges the customer who has not replied. It knows how long since the last contact and what the next step is.",
    closing: "The follow-up you meant to do at 10pm is already done. Nothing falls through.",
  },
  {
    num: "07",
    title: "Install Coordinator Agent",
    tagline: "Schedules the install. Lines up the ESB Networks paperwork. Confirms the crew.",
    body: "This agent runs the install. It finds the next free working day with enough notice for materials, schedules the crew, and tracks the ESB Networks grid connection paperwork so the job is ready to energise. It confirms the details with the customer.",
    closing: "No crew turning up without materials. No install held up by paperwork nobody chased.",
  },
  {
    num: "08",
    title: "Aftercare Agent",
    tagline: "Handles the handover. Follows up after. Asks for the review.",
    body: "The job is not done when the panels are on the roof. This agent handles the handover pack, checks in after the install, and asks the happy customer for a review at the right moment.",
    closing: "Your customer feels looked after. Your reputation looks after itself.",
  },
];

/* How It Works Together - scenario steps */
const scenarioSteps = [
  { agent: "Lead Response Agent", action: "answers instantly. Books the call." },
  { agent: "Operations Agent", action: "picks it up and tracks it." },
  { agent: "Site Survey Agent", action: "books the survey into your diary." },
  { agent: "Proposal Agent", action: "drafts the proposal for your sign-off." },
  { agent: "Grant Tracker Agent", action: "tracks the SEAI application." },
  { agent: "Install Coordinator Agent", action: "schedules the install and the ESB paperwork." },
  { agent: "Follow-Up Agent", action: "chases anything that goes quiet." },
  { agent: "Aftercare Agent", action: "handles the handover and the review." },
];

/* Lookup map: agent.num → dashboard component */
const dashboardMap: Record<string, React.ComponentType> = {
  "01": SupportDashboard,
  "02": OperationsDashboard,
  "03": OperationsDashboard,
  "04": ReportingDashboard,
  "05": GrantsDashboard,
  "06": SupportDashboard,
  "07": LogisticsDashboard,
  "08": ReportingDashboard,
};

/* ============================================================
   AGENT DETAIL CARD (alternating image/copy)
   ============================================================ */
function AgentCard({ agent, index }: { agent: (typeof agents)[0]; index: number }) {
  const isReversed = index % 2 === 1;
  const DashboardComponent = dashboardMap[agent.num];
  const [frameRef, frameInView] = useInViewOnce<HTMLDivElement>("200px");

  return (
    <ScrollReveal>
      <div
        className="grid grid-cols-1 lg:grid-cols-2 items-center"
        style={{ gap: "clamp(24px, 5vw, 48px)", alignItems: 'center' }}
      >
        {/* Image */}
        <div
          className={`${isReversed ? "lg:order-2" : "lg:order-1"}`}
        >
          <div ref={frameRef} className="hp-lift hp-card-dark" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
            {/* Dashboard mounts only when scrolled into view, so its animation timers stay idle until then */}
            {frameInView ? <DashboardComponent /> : <DashboardSkeleton />}
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
              {agent.num}
            </div>
            {/* Illustrative data caption - figures shown are mockups, not real customer results */}
            <div style={{ position: 'absolute', bottom: 8, right: 10, zIndex: 10, display: 'inline-flex', alignItems: 'center', background: 'rgba(10,10,10,0.55)', color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 500, letterSpacing: '0.02em', padding: '2px 8px', borderRadius: 6, backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>
              Illustrative data
            </div>
          </div>
        </div>

        {/* Copy */}
        <div
          className={isReversed ? "lg:order-first" : "lg:order-last"}
        >
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 12 }}>
            {agent.title}
          </h2>
          <p style={{ color: '#8a6d05', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 700, marginBottom: 20, lineHeight: 1.7 }}>
            {agent.tagline}
          </p>
          <p style={{ color: '#535353', fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.7, marginBottom: 16 }}>
            {agent.body}
          </p>
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.7, fontWeight: 600 }}>
            {agent.closing}
          </p>
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ============================================================
   HOW IT WORKS TOGETHER - Scenario Flow
   ============================================================ */
function ScenarioSection() {
  return (
    <section style={{ backgroundColor: '#0A0A0A', paddingTop: 'clamp(48px, 10vw, 96px)', paddingBottom: 'clamp(48px, 10vw, 96px)' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', padding: '6px 14px', borderRadius: 9999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 'clamp(24px, 4vw, 40px)' }}>
            <span
              className="hp-pulse"
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#F3D840' }}
            />
            <span style={{ color: '#fff', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700, fontSize: '0.9em', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)', marginRight: 9 }}>01</span>How it works together.
            </span>
          </div>
        </ScrollReveal>

        {/* Intro */}
        <ScrollReveal delay={0.1}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.7, marginBottom: 'clamp(20px, 4vw, 32px)' }}>
            A customer submits a web form at 10pm.
          </p>
        </ScrollReveal>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 12px)', marginBottom: 'clamp(24px, 5vw, 40px)' }}>
          {scenarioSteps.map((step, i) => (
            <ScrollReveal key={step.agent} delay={0.15 + i * 0.08} direction="left">
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(12px, 2vw, 16px)' }}
              >
                <div
                  style={{ width: 28, height: 28, minWidth: 28, borderRadius: '50%', background: '#F3D840', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}
                >
                  <span style={{ color: '#1A1A1A', fontWeight: 800, fontSize: 11 }}>{i + 1}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.7 }}>
                  <span style={{ color: '#F3D840', fontWeight: 700 }}>{step.agent}</span>{" "}
                  {step.action}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Closing */}
        <ScrollReveal delay={0.3}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'clamp(20px, 4vw, 32px)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.7, marginBottom: 'clamp(12px, 2vw, 16px)' }}>
              You review the weekly summary. You approve the strategy. You intervene only when you want to.
            </p>
            <p style={{ color: '#F3D840', fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800 }}>
              That&apos;s the workforce.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   INVESTMENT SECTION
   ============================================================ */
function InvestmentSection() {
  return (
    <section style={{ backgroundColor: '#FFFDF5', paddingTop: 'clamp(48px, 10vw, 96px)', paddingBottom: 'clamp(48px, 10vw, 96px)' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', padding: '6px 14px', borderRadius: 9999, background: 'rgba(243,216,64,0.1)', border: '1px solid rgba(243,216,64,0.2)', marginBottom: 'clamp(24px, 4vw, 40px)' }}>
            <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700, fontSize: '0.9em', letterSpacing: '0.06em', color: '#8a6d05', marginRight: 9 }}>02</span>Investment
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p style={{ color: '#535353', fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.7, fontVariantNumeric: 'tabular-nums', maxWidth: 672, marginLeft: 'auto', marginRight: 'auto', marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            Most solar installers pay €1,000 – €1,500 per month plus a one-time setup fee. You bring your own AI keys. You pay the models directly. No markup from us.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 600, marginBottom: 'clamp(24px, 5vw, 40px)' }}>
            Book a 15 minute call. If it fits, we scope your build and give you a fixed quote.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div style={{ marginTop: 'clamp(16px, 3vw, 32px)' }}>
          <Link
            href="/contact"
            className="hover:bg-[#374151] transition-colors duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', padding: '10px 24px', backgroundColor: '#1A1A1A', color: '#fff', fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 14px)', letterSpacing: '0.02em', borderRadius: 9999, textDecoration: 'none' }}
          >
            Book a Call
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

/* ============================================================
   CTA SECTION
   ============================================================ */
function CTASection() {
  return (
    <section style={{ backgroundColor: '#F3D840', paddingTop: 'clamp(48px, 10vw, 96px)', paddingBottom: 'clamp(48px, 10vw, 96px)' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
        <ScrollReveal>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            Let&apos;s build yours.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <p style={{ color: '#374151', fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.7, marginBottom: 'clamp(24px, 5vw, 40px)' }}>
            <a
              href="mailto:cal@renewably.ie"
              className="hover:text-[#1A1A1A] transition-colors duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ textDecoration: 'underline', fontWeight: 600 }}
            >
              cal@renewably.ie
            </a>
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <div style={{ marginTop: 'clamp(16px, 3vw, 32px)' }}>
          <Link
            href="/contact"
            className="hover:bg-[#374151] transition-colors duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', padding: '10px 24px', backgroundColor: '#1A1A1A', color: '#fff', fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 14px)', letterSpacing: '0.02em', borderRadius: 9999, textDecoration: 'none' }}
          >
            Book a Call
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

/* ============================================================
   MAIN EXPORT
   ============================================================ */
export default function WorkforcePageClient() {
  return (
    <div>
      <style>{`.workforce-hero-bg { object-position: 60% 45% !important; } @media (min-width: 768px) { .workforce-hero-bg { object-position: center center !important; } }`}</style>

      {/* ===== HERO ===== */}
      <section data-theme="dark" style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Robot image background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Image
            src="/robot-2.jpg"
            alt=""
            fill
            sizes="100vw"
            className="workforce-hero-bg"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.3) 100%)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 896, width: '100%', padding: '0 clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
          <div
            className="hp-rise"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', borderRadius: 9999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', marginBottom: 'clamp(20px, 4vw, 32px)', padding: '6px 16px', fontSize: 'clamp(12px, 1.5vw, 13px)', fontWeight: 600, letterSpacing: '0.03em', animationDelay: '0.3s' }}
          >
            <span
              className="hp-pulse"
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#F3D840', boxShadow: '0 0 8px rgba(243,216,64,0.6)' }}
            />
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>
              Ready to meet your new team?
            </span>
          </div>

          <h1
            className="hp-rise"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: '#F3D840', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 'clamp(16px, 3vw, 24px)', animationDelay: '0.5s' }}
          >
            The AI Workforce
          </h1>

          <p
            className="hp-rise"
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', lineHeight: 1.6, maxWidth: 640, margin: '0 auto', animationDelay: '0.8s' }}
          >
            Eight AI agents at full strength. You start with the two that move the needle first, then switch on the rest as your operation captures evidence and strengthens.
          </p>
        </div>

        {/* Yellow fade at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, #F3D840, transparent)', zIndex: 3, pointerEvents: 'none' }} />
      </section>

      {/* ===== EIGHT AGENTS ===== */}
      <section style={{ backgroundColor: '#fff', paddingTop: 'clamp(48px, 10vw, 96px)', paddingBottom: 'clamp(48px, 10vw, 96px)' }}>
        <div style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: "clamp(64px, 15vw, 120px)" }}>
            {agents.map((agent, i) => (
              <AgentCard key={agent.num} agent={agent} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS TOGETHER ===== */}
      <ScenarioSection />

      {/* ===== INVESTMENT ===== */}
      <InvestmentSection />

      {/* ===== CTA ===== */}
      <CTASection />
    </div>
  );
}
