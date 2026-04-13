"use client";

import { useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";
import BeforeAfterSection from "@/components/shared/BeforeAfterSection";
import AudienceSection from "@/components/shared/AudienceSection";
import HowItStartsSection from "@/components/shared/HowItStartsSection";

/* ============================================================
   DATA
   ============================================================ */
const agents = [
  {
    num: "01",
    title: "Customer Support Agent",
    desc: "Answers every customer. Immediately. 24/7. Books consultations. Answers questions. Escalates only what needs you. No lost leads. No unanswered emails.",
    image: "/agents/agent-support.jpg",
  },
  {
    num: "02",
    title: "Grants Agent",
    desc: "Handles every grant from start to finish. SEAI applications. Paperwork. Follow-ups. Resubmissions. Knows every form, every deadline, every requirement. Your approval rate goes up. Your admin time goes to zero.",
    image: "/agents/agent-grants.jpg",
  },
  {
    num: "03",
    title: "Operations Agent",
    desc: "Manages every install from quote to completion. Tracks timelines. Coordinates crews. Flags delays. Reports daily. You know where every job is without chasing anyone.",
    image: "/agents/agent-operations.jpg",
  },
  {
    num: "04",
    title: "Logistics Agent",
    desc: "Orders equipment. Schedules crews. Manages inventory. Confirms deliveries. Reschedules when weather hits. Runs the back end so you don\u2019t have to.",
    image: "/agents/agent-logistics.jpg",
  },
  {
    num: "05",
    title: "Permitting Agent",
    desc: "Handles ESB Networks applications. Tracks grid connection paperwork. Follows up on delays. Alerts you only when something needs your attention.",
    image: "/agents/agent-permitting.jpg",
  },
  {
    num: "06",
    title: "QA Agent",
    desc: "Reviews every job before handover. Checks paperwork. Verifies photos. Confirms sign-offs. Catches mistakes before the customer does.",
    image: "/agents/agent-qa.jpg",
  },
  {
    num: "07",
    title: "Reporting Agent",
    desc: "Shows you exactly what\u2019s happening across every job. Weekly summaries. Bottlenecks identified. Money tracked. No more guessing.",
    image: "/agents/agent-reporting.jpg",
  },
  {
    num: "08",
    title: "CEO Agent",
    desc: "Sets strategy. Assigns work. Manages the team. Reports to you weekly. Spots problems before you do.",
    image: "/agents/agent-ceo.jpg",
  },
];

const pricingItems = [
  { name: "Monthly subscription", price: "€1,000 – €1,500" },
  { name: "Setup fee", price: "One-time" },
  { name: "AI costs", price: "You pay directly (~€50–€200/mo)" },
];



/* ============================================================
   AGENT DETAIL SECTION (alternating layout with robot images)
   ============================================================ */
function AgentCard({ agent, index }: { agent: (typeof agents)[0]; index: number }) {
  const isReversed = index % 2 === 1;

  return (
    <ScrollReveal>
      <div
        className="grid grid-cols-1 lg:grid-cols-2 items-center"
        style={{ gap: 'clamp(24px, 5vw, 48px)', alignItems: 'center' }}
      >
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`${isReversed ? "lg:order-2" : "lg:order-1"}`}
        >
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <Image
              src={agent.image}
              alt={`${agent.title} — AI workforce for solar`}
              width={1360}
              height={768}
              style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
            />
            {/* Yellow gradient overlay at bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, background: 'linear-gradient(to top, rgba(243,216,64,0.4), transparent)' }} />
            {/* Number badge */}
            <div style={{ position: 'absolute', top: 12, left: 12, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 13, padding: '5px 12px', borderRadius: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              {agent.num}
            </div>
          </div>
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={isReversed ? "lg:order-1" : "lg:order-2"}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, marginBottom: 'clamp(10px, 1.5vw, 16px)' }}>
            {agent.title}
          </h2>
          <p style={{ color: '#535353', fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', lineHeight: 1.7 }}>
            {agent.desc}
          </p>
        </motion.div>
      </div>
    </ScrollReveal>
  );
}

/* ============================================================
   PRICING SECTION
   ============================================================ */
function PricingSection() {
  const totalRef = useRef<HTMLDivElement>(null);
  const totalInView = useInView(totalRef, { once: true, margin: "-60px" });

  return (
    <section style={{ backgroundColor: '#FFFDF5', paddingTop: 'clamp(48px, 10vw, 112px)', paddingBottom: 'clamp(48px, 10vw, 112px)' }}>
      <div style={{ maxWidth: 896, margin: '0 auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(243,216,64,0.1)', border: '1px solid rgba(243,216,64,0.2)', marginBottom: 'clamp(20px, 3vw, 24px)' }}>
            <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
              What it costs.
            </span>
          </div>
        </ScrollReveal>

        {/* Intro */}
        <ScrollReveal delay={0.1}>
          <p style={{ color: '#535353', fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', lineHeight: 1.7, marginBottom: 'clamp(32px, 5vw, 48px)', maxWidth: 640 }}>
            Less than one junior admin. Less than the time you spend on grants yourself. Less than the customers you lose because nobody called back.
          </p>
        </ScrollReveal>

        {/* Pricing list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: 'clamp(24px, 4vw, 40px)' }}>
          {pricingItems.map((item, i) => (
            <ScrollReveal key={item.name} delay={0.1 + i * 0.06}>
              <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-white border border-[#F3D840]/15 hover:border-[#F3D840]/40 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F3D840] group-hover:scale-125 transition-transform" />
                  <span style={{ color: '#1A1A1A', fontWeight: 600, fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}>{item.name}</span>
                </div>
                <span style={{ color: '#374151', fontWeight: 700, fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}>{item.price}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Total callout */}
        <motion.div
          ref={totalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={totalInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ backgroundColor: '#F3D840', borderRadius: 16, padding: 'clamp(20px, 4vw, 40px) clamp(16px, 3vw, 48px)', textAlign: 'center', marginBottom: 'clamp(12px, 2vw, 16px)' }}
        >
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(1.25rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.2 }}>
            €1,000 – €1,500/month for your full AI team
          </p>
        </motion.div>

        <ScrollReveal delay={0.3}>
          <p style={{ textAlign: 'center', color: '#535353', fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', marginBottom: 'clamp(10px, 1.5vw, 16px)' }}>
            That&apos;s less than one day of a contractor. For a full team.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p style={{ textAlign: 'center', color: '#374151', fontSize: 'clamp(0.875rem, 1.2vw, 0.875rem)', fontWeight: 600 }}>
            One-time setup fee. You bring your own AI keys — you pay the models directly.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}



/* ============================================================
   MAIN EXPORT
   ============================================================ */
export default function ServicesPageClient() {
  return (
    <main>
        {/* ===== HERO — Full-Width Robot Banner ===== */}
        <section data-theme="dark" style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          {/* Robot image background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <Image
              src="/service-hero.jpg"
              alt=""
              fill
              className="services-hero-bg"
              style={{ objectFit: 'cover' }}
              priority
            />
            <style>{`
              .services-hero-bg { object-position: 65% center !important; }
              @media (min-width: 768px) { .services-hero-bg { object-position: center !important; } }
            `}</style>
          </div>
          {/* Dark overlay */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.3) 100%)' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 896, margin: '0 auto', padding: 'clamp(80px, 15vh, 160px) clamp(16px, 4vw, 32px)' }}>
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', marginBottom: 'clamp(20px, 4vw, 32px)' }}
              >
                <motion.span
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#F3D840', boxShadow: '0 0 8px rgba(243,216,64,0.6)' }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span style={{ color: '#F3D840', fontSize: 'clamp(12px, 1.5vw, 14px)', fontWeight: 700, letterSpacing: '0.03em' }}>
                  Renewably
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)', fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 'clamp(16px, 3vw, 24px)' }}
              >
                AI Workforce That Runs Your Solar Company, On Autopilot
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: 1.7, maxWidth: 640 }}
              >
                A fully managed AI workforce deployed across your operations, customer support, grants, and logistics. Built for solar companies that want to scale without finding staff they can&apos;t hire.
              </motion.p>
            </div>
          </div>

          {/* Yellow fade at bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 96, background: 'linear-gradient(to top, white, transparent)', zIndex: 3, pointerEvents: 'none' }} />
        </section>

        {/* ===== AGENTS SHOWCASE ===== */}
        <section style={{ backgroundColor: '#fff', paddingTop: 'clamp(48px, 10vw, 112px)', paddingBottom: 'clamp(48px, 10vw, 112px)' }}>
          <div style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
            {/* Badge */}
            <ScrollReveal>
              <div style={{ textAlign: 'center', maxWidth: 768, margin: '0 auto clamp(32px, 5vw, 80px)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(243,216,64,0.1)', border: '1px solid rgba(243,216,64,0.2)' }}>
                  <motion.span
                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#F3D840' }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
                    Here&apos;s what we deploy.
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Agent cards — alternating image/copy layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(64px, 15vw, 120px)' }}>
              {agents.map((agent, i) => (
                <AgentCard key={agent.num} agent={agent} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <PricingSection />

        {/* ===== BEFORE / AFTER ===== */}
        <BeforeAfterSection
          comparisons={[
            {
              before: "You answer every customer email yourself. You lose leads at 6pm. On weekends. When you\u2019re on a roof.",
              after: "Support agent handles it. You review the summary. Customers get answers instantly.",
            },
            {
              before: "You spend 10 hours a week on grant paperwork. You miss deadlines. You make mistakes.",
              after: "Grants agent handles it. Your approval rate doubles. You do zero hours.",
            },
            {
              before: "You have no idea where every job is. You chase your team. You find out about delays too late.",
              after: "Ops agent tracks everything. You open the dashboard. You know instantly.",
            },
            {
              before: "Equipment orders get missed. Crews show up without materials. Jobs get delayed by a week.",
              after: "Logistics agent orders everything. Confirms deliveries. Alerts you only when something goes wrong.",
            },
            {
              before: "You lose money on admin. You lose sleep on coordination. You lose customers on follow-up.",
              after: "You run a solar company. Not a chaos factory.",
            },
          ]}
          padding={{ top: 'clamp(48px, 10vw, 112px)', bottom: 'clamp(48px, 10vw, 112px)' }}
        />

        {/* ===== AUDIENCE ===== */}
        <AudienceSection
          badgeText="Who is this for."
          padding={{ top: 'clamp(48px, 10vw, 112px)', bottom: 'clamp(48px, 10vw, 112px)' }}
        />

        {/* ===== HOW IT STARTS + CTA ===== */}
        <HowItStartsSection
          ctaTitle="Let\u2019s talk."
          ctaButtonLabel="Get Started"
          ctaButtonColor="#fff"
          padding={{ top: 'clamp(48px, 10vw, 112px)', bottom: 'clamp(48px, 10vw, 112px)' }}
        />
      </main>
  );
}
