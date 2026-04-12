"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";

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
    image: "/agents/agent-ceo.jpg",
  },
  {
    num: "02",
    title: "Operations Agent",
    tagline: "Runs the day to day. Coordinates installs. Manages timelines.",
    body: "The operations agent is your project manager. It tracks every job from quote to completion. It knows where each install is — assessment done, grant submitted, permit approved, equipment ordered, crew scheduled, installation complete, paperwork signed.",
    closing: "When a job stalls, the ops agent knows. When a timeline slips, the ops agent alerts you. When a customer asks 'where is my install?', the ops agent has the answer.",
    image: "/agents/agent-operations.jpg",
  },
  {
    num: "03",
    title: "Customer Support Agent",
    tagline: "Answers every message. Books every consult. Never sleeps.",
    body: "The support agent is your front desk. It answers emails, web forms, chat messages, and phone calls. It answers questions about pricing, grants, timelines, and technical specifications. It books consultations directly into your calendar. It follows up with customers who haven't responded.",
    closing: "Only what needs you gets to you. Everything else — handled.",
    image: "/agents/agent-support.jpg",
  },
  {
    num: "04",
    title: "Grants Agent",
    tagline: "Knows every SEAI scheme. Fills every form. Chases every application.",
    body: "The grants agent is your SEAI expert. It knows every grant scheme — Solar PV, Battery Storage, Heat Pumps. It knows every form, every requirement, every deadline. It completes applications. It gathers supporting documents. It tracks submission status. It follows up on delays. It resubmits rejections within 24 hours.",
    closing: "Your approval rate goes up. Your admin time goes to zero.",
    image: "/agents/agent-grants.jpg",
  },
  {
    num: "05",
    title: "Logistics Agent",
    tagline: "Orders equipment. Schedules crews. Manages inventory.",
    body: "The logistics agent runs your supply chain. It tracks inventory levels — panels, inverters, rails, brackets. It places orders before you run out. It schedules crews based on job requirements and availability. It confirms deliveries. It reschedules when weather hits or customers cancel.",
    closing: "No more crews showing up without materials. No more jobs delayed because equipment arrived late.",
    image: "/agents/agent-logistics.jpg",
  },
  {
    num: "06",
    title: "Permitting Agent",
    tagline: "Handles ESB. Tracks submissions. Follows up on delays.",
    body: "The permitting agent is your ESB Networks specialist. It knows every application type — NC6 for domestic, NC7 for commercial. It knows every form, every attachment, every submission method. It completes applications. It submits to the correct portal or email address. It tracks every submission. It follows up on day 5, day 10, day 15. It alerts you only when intervention is needed.",
    closing: "Average approval time: from 6 weeks to 10 days.",
    image: "/agents/agent-permitting.jpg",
  },
  {
    num: "07",
    title: "QA Agent",
    tagline: "Reviews every job before handover. Checks paperwork. Catches mistakes.",
    body: "The QA agent is your final check. Before any job is marked complete, the QA agent reviews everything. Paperwork signed? Photos uploaded? Permits approved? Grants paid? Customer satisfied?",
    closing: "If something is missing, the QA agent flags it. If something is wrong, the QA agent catches it. Your customer never sees a mistake.",
    image: "/agents/agent-qa.jpg",
  },
  {
    num: "08",
    title: "Reporting Agent",
    tagline: "Shows you exactly what's happening. Weekly summaries. Bottlenecks identified.",
    body: "The reporting agent is your dashboard. It tracks every metric that matters. Jobs in progress. Jobs completed. Revenue forecast. Bottlenecks identified. Agent performance. Cost tracking.",
    closing: "Every week, you get a summary. No guesswork. No spreadsheets. Just the truth about your business.",
    image: "/agents/agent-reporting.jpg",
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
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`${isReversed ? "lg:order-2" : "lg:order-1"}`}
        >
          <div className="relative overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={agent.image}
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
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={`${isReversed ? "lg:order-1" : "lg:order-2"}`}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] leading-tight mb-3">
            {agent.title}
          </h2>
          <p className="text-[#F3D840] text-base sm:text-lg font-bold mb-5 leading-snug">
            {agent.tagline}
          </p>
          <p className="text-[#535353] text-base sm:text-lg leading-relaxed mb-4">
            {agent.body}
          </p>
          <p className="text-[#1A1A1A] text-base sm:text-lg leading-relaxed font-semibold">
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
    <section className="bg-[#0A0A0A] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-10">
            <motion.span
              className="w-2 h-2 rounded-full bg-[#F3D840]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
              How it works together.
            </span>
          </div>
        </ScrollReveal>

        {/* Intro */}
        <ScrollReveal delay={0.1}>
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-12">
            A customer submits a web form at 10pm.
          </p>
        </ScrollReveal>

        {/* Steps */}
        <div ref={stepsRef} className="space-y-3 mb-14">
          {scenarioSteps.map((step, i) => (
            <motion.div
              key={step.agent}
              initial={{ opacity: 0, x: -20 }}
              animate={stepsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.45, ease: "easeOut" }}
              className="flex items-start gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={stepsInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.3, type: "spring", stiffness: 300 }}
                className="w-7 h-7 rounded-full bg-[#F3D840] flex items-center justify-center shrink-0 mt-0.5"
              >
                <span className="text-[#1A1A1A] font-extrabold text-[11px]">{i + 1}</span>
              </motion.div>
              <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                <span className="text-[#F3D840] font-bold">{step.agent}</span>{" "}
                {step.action}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing */}
        <ScrollReveal delay={0.3}>
          <div className="border-t border-white/10 pt-10">
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-3">
              You review the weekly summary. You approve the strategy. You intervene only when you want to.
            </p>
            <p className="text-[#F3D840] text-xl sm:text-2xl font-extrabold">
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
    <section className="bg-[#FFFDF5] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-8">
            <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
              Investment
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="text-[#535353] text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-6">
            Most solar installers pay &euro;1,000&ndash;&euro;1,500 per month plus a one-time setup fee. You bring your own AI keys. You pay the models directly. No markup from us.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-[#1A1A1A] text-lg sm:text-xl font-semibold mb-10">
            We&apos;ll give you an exact quote after a 30 minute call.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] hover:bg-[#374151] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Book a Call
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
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
    <section className="bg-[#F3D840] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] leading-tight mb-6">
            Let&apos;s build yours.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <p className="text-[#374151] text-lg sm:text-xl mb-10">
            <a
              href="mailto:hello@renewably.com"
              className="underline hover:text-[#1A1A1A] transition-colors font-semibold"
            >
              hello@renewably.com
            </a>
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] hover:bg-[#374151] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Get Started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
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
      {/* ===== HERO ===== */}
      <section data-theme="dark" className="relative overflow-hidden">
        {/* Robot image background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/service-hero.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Dark overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#0A0A0A]/85 via-[#0A0A0A]/70 to-[#0A0A0A]/50" />

        {/* Content */}
        <div className="relative z-[2] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8"
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse"
                style={{ boxShadow: "0 0 8px rgba(243,216,64,0.6)" }}
              />
              <span className="text-[#F3D840] text-xs sm:text-sm font-bold tracking-wide">
                Renewably
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-6"
            >
              The AI Workforce
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-2xl"
            >
              Eight AI employees. One team. Your solar company, automated.
            </motion.p>
          </div>
        </div>

        {/* Yellow fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-[3] pointer-events-none" />
      </section>

      {/* ===== EIGHT AGENTS ===== */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20 md:space-y-28">
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
