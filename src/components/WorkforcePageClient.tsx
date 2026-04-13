"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";
import MiniDesktop from "@/components/MiniDesktop";
import OperationsDashboard from "@/components/OperationsDashboard";
import SupportDashboard from "@/components/SupportDashboard";
import GrantsDashboard from "@/components/GrantsDashboard";
import LogisticsDashboard from "@/components/LogisticsDashboard";
import PermittingDashboard from "@/components/PermittingDashboard";
import QADashboard from "@/components/QADashboard";
import ReportingDashboard from "@/components/ReportingDashboard";

/* ============================================================
   DATA — 8 AI Agents
   ============================================================ */
const agents = [
  {
    num: "01",
    title: "CEO Agent",
    tagline: "Sets strategy. Assigns work. Manages the team. Reports to you weekly.",
    body: "The CEO agent oversees everything. It sets weekly priorities based on your goals. It assigns tasks to the right agents. It monitors performance across the workforce. It spots problems before you do — a grant stuck for two weeks, a permit that hasn't moved, a customer who hasn't heard anything.",
    closing: "Every Monday, you get a summary. What happened last week. What's planned for this week. Where attention is needed. You review. You approve. You override if you want.",
  },
  {
    num: "02",
    title: "Operations Agent",
    tagline: "Runs the day to day. Coordinates installs. Manages timelines.",
    body: "The operations agent is your project manager. It tracks every job from quote to completion. It knows where each install is — assessment done, grant submitted, permit approved, equipment ordered, crew scheduled, installation complete, paperwork signed.",
    closing: "When a job stalls, the ops agent knows. When a timeline slips, the ops agent alerts you. When a customer asks 'where is my install?', the ops agent has the answer.",
  },
  {
    num: "03",
    title: "Customer Support Agent",
    tagline: "Answers every message. Books every consult. Never sleeps.",
    body: "The support agent is your front desk. It answers emails, web forms, chat messages, and phone calls. It answers questions about pricing, grants, timelines, and technical specifications. It books consultations directly into your calendar. It follows up with customers who haven't responded.",
    closing: "Only what needs you gets to you. Everything else — handled.",
  },
  {
    num: "04",
    title: "Grants Agent",
    tagline: "Knows every SEAI scheme. Fills every form. Chases every application.",
    body: "The grants agent is your SEAI expert. It knows every grant scheme — Solar PV, Battery Storage, Heat Pumps. It knows every form, every requirement, every deadline. It completes applications. It gathers supporting documents. It tracks submission status. It follows up on delays. It resubmits rejections within 24 hours.",
    closing: "Your approval rate goes up. Your admin time goes to zero.",
  },
  {
    num: "05",
    title: "Logistics Agent",
    tagline: "Orders equipment. Schedules crews. Manages inventory.",
    body: "The logistics agent runs your supply chain. It tracks inventory levels — panels, inverters, rails, brackets. It places orders before you run out. It schedules crews based on job requirements and availability. It confirms deliveries. It reschedules when weather hits or customers cancel.",
    closing: "No more crews showing up without materials. No more jobs delayed because equipment arrived late.",
  },
  {
    num: "06",
    title: "Permitting Agent",
    tagline: "Handles ESB. Tracks submissions. Follows up on delays.",
    body: "The permitting agent is your ESB Networks specialist. It knows every application type — NC6 for domestic, NC7 for commercial. It knows every form, every attachment, every submission method. It completes applications. It submits to the correct portal or email address. It tracks every submission. It follows up on day 5, day 10, day 15. It alerts you only when intervention is needed.",
    closing: "Average approval time: from 6 weeks to 10 days.",
  },
  {
    num: "07",
    title: "QA Agent",
    tagline: "Reviews every job before handover. Checks paperwork. Catches mistakes.",
    body: "The QA agent is your final check. Before any job is marked complete, the QA agent reviews everything. Paperwork signed? Photos uploaded? Permits approved? Grants paid? Customer satisfied?",
    closing: "If something is missing, the QA agent flags it. If something is wrong, the QA agent catches it. Your customer never sees a mistake.",
  },
  {
    num: "08",
    title: "Reporting Agent",
    tagline: "Shows you exactly what's happening. Weekly summaries. Bottlenecks identified.",
    body: "The reporting agent is your dashboard. It tracks every metric that matters. Jobs in progress. Jobs completed. Revenue forecast. Bottlenecks identified. Agent performance. Cost tracking.",
    closing: "Every week, you get a summary. No guesswork. No spreadsheets. Just the truth about your business.",
  },
];

/* How It Works Together — scenario steps */
const scenarioSteps = [
  { agent: "Support Agent", action: "answers instantly. Books a consultation." },
  { agent: "CEO Agent", action: "assigns the lead to operations." },
  { agent: "Operations Agent", action: "schedules a site assessment." },
  { agent: "Grants Agent", action: "prepares the SEAI application." },
  { agent: "Permitting Agent", action: "prepares the ESB application." },
  { agent: "Logistics Agent", action: "checks inventory. Orders equipment." },
  { agent: "QA Agent", action: "reviews every step." },
  { agent: "Reporting Agent", action: "tracks everything." },
];

/* ============================================================
   AGENT DETAIL CARD (alternating image/copy)
   ============================================================ */
function AgentCard({ agent, index }: { agent: (typeof agents)[0]; index: number }) {
  const isReversed = index % 2 === 1;

  return (
    <ScrollReveal>
      <div
        className="grid grid-cols-1 lg:grid-cols-2 items-center"
        style={{ gap: "clamp(24px, 5vw, 48px)", alignItems: 'center' }}
      >
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`${isReversed ? "lg:order-2" : "lg:order-1"}`}
        >
          {agent.num === "01" ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              <MiniDesktop />
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
                {agent.num}
              </div>
            </div>
          ) : agent.num === "02" ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              <OperationsDashboard />
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
                {agent.num}
              </div>
            </div>
          ) : agent.num === "03" ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              <SupportDashboard />
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
                {agent.num}
              </div>
            </div>
          ) : agent.num === "04" ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              <GrantsDashboard />
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
                {agent.num}
              </div>
            </div>
          ) : agent.num === "05" ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              <LogisticsDashboard />
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
                {agent.num}
              </div>
            </div>
          ) : agent.num === "06" ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              <PermittingDashboard />
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
                {agent.num}
              </div>
            </div>
          ) : agent.num === "07" ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              <QADashboard />
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
                {agent.num}
              </div>
            </div>
          ) : agent.num === "08" ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              <ReportingDashboard />
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#F3D840', color: '#1A1A1A', fontWeight: 800, fontSize: 14, padding: '6px 12px', borderRadius: 9999 }}>
                {agent.num}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={agent.image!}
                alt={`${agent.title} — Renewably AI Workforce`}
                width={1344}
                height={768}
                className="w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F3D840]/40 to-transparent" />
              <div className="absolute top-4 left-4 bg-[#F3D840] text-[#1A1A1A] font-extrabold text-sm px-3 py-1.5 rounded-full shadow-lg">
                {agent.num}
              </div>
            </div>
          )}
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={isReversed ? "lg:order-first" : "lg:order-last"}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, marginBottom: 12 }}>
            {agent.title}
          </h2>
          <p style={{ color: '#F3D840', fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', fontWeight: 700, marginBottom: 20, lineHeight: 1.5 }}>
            {agent.tagline}
          </p>
          <p style={{ color: '#535353', fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', lineHeight: 1.7, marginBottom: 16 }}>
            {agent.body}
          </p>
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', lineHeight: 1.7, fontWeight: 600 }}>
            {agent.closing}
          </p>
        </motion.div>
      </div>
    </ScrollReveal>
  );
}

/* ============================================================
   HOW IT WORKS TOGETHER — Scenario Flow
   ============================================================ */
function ScenarioSection() {
  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsInView = useInView(stepsRef, { once: true, margin: "-60px" });

  return (
    <section style={{ backgroundColor: '#0A0A0A', paddingTop: 'clamp(48px, 10vw, 96px)', paddingBottom: 'clamp(48px, 10vw, 96px)' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', padding: '6px 16px', borderRadius: 9999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
            <motion.span
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#F3D840' }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ color: '#fff', fontSize: 'clamp(11px, 1.5vw, 14px)', fontWeight: 600, letterSpacing: '0.03em' }}>
              How it works together.
            </span>
          </div>
        </ScrollReveal>

        {/* Intro */}
        <ScrollReveal delay={0.1}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(16px, 2.2vw, 20px)', lineHeight: 1.7, marginBottom: 'clamp(20px, 4vw, 32px)' }}>
            A customer submits a web form at 10pm.
          </p>
        </ScrollReveal>

        {/* Steps */}
        <div ref={stepsRef} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 12px)', marginBottom: 'clamp(24px, 5vw, 40px)' }}>
          {scenarioSteps.map((step, i) => (
            <motion.div
              key={step.agent}
              initial={{ opacity: 0, x: -20 }}
              animate={stepsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.45, ease: "easeOut" }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(12px, 2vw, 16px)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={stepsInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.3, type: "spring", stiffness: 300 }}
                style={{ width: 28, height: 28, minWidth: 28, borderRadius: '50%', background: '#F3D840', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}
              >
                <span style={{ color: '#1A1A1A', fontWeight: 800, fontSize: 11 }}>{i + 1}</span>
              </motion.div>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.7 }}>
                <span style={{ color: '#F3D840', fontWeight: 700 }}>{step.agent}</span>{" "}
                {step.action}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing */}
        <ScrollReveal delay={0.3}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'clamp(20px, 4vw, 32px)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.7, marginBottom: 'clamp(12px, 2vw, 16px)' }}>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', padding: '6px 16px', borderRadius: 9999, background: 'rgba(243,216,64,0.1)', border: '1px solid rgba(243,216,64,0.2)', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
            <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.5vw, 14px)', fontWeight: 600, letterSpacing: '0.03em' }}>
              Investment
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p style={{ color: '#535353', fontSize: 'clamp(16px, 2.2vw, 20px)', lineHeight: 1.7, maxWidth: 672, marginLeft: 'auto', marginRight: 'auto', marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            Most solar installers pay €1,000 – €1,500 per month plus a one-time setup fee. You bring your own AI keys. You pay the models directly. No markup from us.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(16px, 2.2vw, 20px)', fontWeight: 600, marginBottom: 'clamp(24px, 5vw, 40px)' }}>
            We&apos;ll give you an exact quote after a 30 minute call.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div style={{ marginTop: 'clamp(16px, 3vw, 32px)' }}>
          <Link
            href="/contact"
            className="hover:bg-[#374151] transition-all duration-300 shadow-md hover:shadow-lg"
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
          <h2 style={{ fontSize: 'clamp(1.875rem, 5vw, 3rem)', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.1, marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            Let&apos;s build yours.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <p style={{ color: '#374151', fontSize: 'clamp(16px, 2.2vw, 20px)', marginBottom: 'clamp(24px, 5vw, 40px)' }}>
            <a
              href="mailto:hello@renewably.ie"
              className="hover:text-[#1A1A1A] transition-colors"
              style={{ textDecoration: 'underline', fontWeight: 600 }}
            >
              hello@renewably.ie
            </a>
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <div style={{ marginTop: 'clamp(16px, 3vw, 32px)' }}>
          <Link
            href="/contact"
            className="hover:bg-[#374151] transition-all duration-300 shadow-md hover:shadow-lg"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', padding: '10px 24px', backgroundColor: '#1A1A1A', color: '#fff', fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 14px)', letterSpacing: '0.02em', borderRadius: 9999, textDecoration: 'none' }}
          >
            Get Started
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
    <main>
      <style>{`
        .workforce-hero-bg { object-position: 60% center !important; }
        @media (min-width: 768px) { .workforce-hero-bg { object-position: center !important; } }
      `}</style>

      {/* ===== HERO ===== */}
      <section data-theme="dark" style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Robot image background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Image
            src="/robot-2.jpg"
            alt=""
            fill
            className="workforce-hero-bg"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.3) 100%)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 896, width: '100%', padding: '0 clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', borderRadius: 9999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', marginBottom: 'clamp(20px, 4vw, 32px)', padding: '6px 16px', fontSize: 'clamp(12px, 1.5vw, 13px)', fontWeight: 600, letterSpacing: '0.03em' }}
          >
            <motion.span
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#F3D840', boxShadow: '0 0 8px rgba(243,216,64,0.6)' }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>
              Ready to meet your new team?
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: '#F3D840', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 'clamp(16px, 3vw, 24px)' }}
          >
            The AI Workforce
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}
          >
            Eight AI employees. One team. Your solar company, automated.
          </motion.p>
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
    </main>
  );
}
