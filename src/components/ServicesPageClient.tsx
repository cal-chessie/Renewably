"use client";

import { useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";

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

const comparisons = [
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
];

const steps = [
  "We talk for an hour.",
  "You show us how you work today.",
  "We build your team.",
  "You approve the hires.",
  "We turn it on.",
];

/* ============================================================
   AGENT DETAIL SECTION (alternating layout with robot images)
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
              alt={`${agent.title} — AI workforce for solar`}
              width={1360}
              height={768}
              className="w-full object-cover"
            />
            {/* Yellow gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F3D840]/40 to-transparent" />
            {/* Number badge */}
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
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] leading-tight mb-4">
            {agent.title}
          </h2>
          <p className="text-[#535353] text-base sm:text-lg leading-relaxed">
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
    <section className="bg-[#FFFDF5] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-6">
            <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
              What it costs.
            </span>
          </div>
        </ScrollReveal>

        {/* Intro */}
        <ScrollReveal delay={0.1}>
          <p className="text-[#535353] text-base sm:text-lg leading-relaxed mb-12 max-w-2xl">
            Less than one junior admin. Less than the time you spend on grants yourself. Less than the customers you lose because nobody called back.
          </p>
        </ScrollReveal>

        {/* Pricing list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {pricingItems.map((item, i) => (
            <ScrollReveal key={item.name} delay={0.1 + i * 0.06}>
              <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-white border border-[#F3D840]/15 hover:border-[#F3D840]/40 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F3D840] group-hover:scale-125 transition-transform" />
                  <span className="text-[#1A1A1A] font-semibold text-sm sm:text-base">{item.name}</span>
                </div>
                <span className="text-[#374151] font-bold text-sm sm:text-base">{item.price}</span>
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
          className="bg-[#F3D840] rounded-2xl px-8 py-8 sm:px-12 sm:py-10 text-center mb-4"
        >
          <p className="text-[#1A1A1A] text-3xl sm:text-4xl lg:text-5xl font-extrabold">
            €1,000 – €1,500/month for your full AI team
          </p>
        </motion.div>

        <ScrollReveal delay={0.3}>
          <p className="text-center text-[#535353] text-base sm:text-lg mb-4">
            That&apos;s less than one day of a contractor. For a full team.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p className="text-center text-[#374151] text-sm font-semibold">
            One-time setup fee. You bring your own AI keys — you pay the models directly.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   BEFORE / AFTER SECTION
   ============================================================ */
function BeforeAfterSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-12">
            <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
              What changes.
            </span>
          </div>
        </ScrollReveal>

        {/* Comparisons */}
        <div className="space-y-8">
          {comparisons.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Before */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-xl bg-[#FFFDF5] border-l-4 border-l-[#EF4444]/40 border border-[#EF4444]/15"
                >
                  <span className="inline-block text-[#EF4444]/70 text-xs font-bold uppercase tracking-wider mb-3">
                    Before
                  </span>
                  <p className="text-[#535353] text-sm sm:text-base leading-relaxed">
                    {item.before}
                  </p>
                </motion.div>

                {/* After */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-xl bg-[#FFFDF5] border-l-4 border-l-[#F3D840] border border-[#F3D840]/15"
                >
                  <span className="inline-block text-[#F3D840] text-xs font-bold uppercase tracking-wider mb-3">
                    After
                  </span>
                  <p className="text-[#1A1A1A] text-sm sm:text-base leading-relaxed font-semibold">
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

/* ============================================================
   AUDIENCE SECTION
   ============================================================ */
function AudienceSection() {
  return (
    <section data-theme="dark" className="bg-[#0A0A0A] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-10">
            <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
            <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
              Who is this for.
            </span>
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-8">
            Solar installers doing 20+ jobs a month.
          </h2>
        </ScrollReveal>

        {/* Body */}
        <ScrollReveal delay={0.2}>
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-6">
            You have more work than time. You&apos;re turning down leads because you can&apos;t handle the admin. You&apos;re burning out your best people.
          </p>
        </ScrollReveal>

        {/* Closing */}
        <ScrollReveal delay={0.3}>
          <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Not for one-person shows. Not for hobbyists. For actual solar companies that want to scale without hiring ten more humans.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   HOW IT STARTS + CTA SECTION
   ============================================================ */
function HowItStartsSection() {
  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsInView = useInView(stepsRef, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#F3D840] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A]/10 border border-[#1A1A1A]/15 mb-10">
            <span className="text-[#1A1A1A] text-xs sm:text-sm font-semibold tracking-wide">
              How it starts.
            </span>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div ref={stepsRef} className="space-y-4 mb-12">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={stepsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.4, ease: "easeOut" }}
              className="flex items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={stepsInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.3, type: "spring", stiffness: 300 }}
                className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0"
              >
                <span className="text-[#F3D840] font-bold text-xs">{i + 1}</span>
              </motion.div>
              <p className="text-[#1A1A1A] text-lg sm:text-xl font-semibold">{step}</p>
            </motion.div>
          ))}
        </div>

        {/* Closing text */}
        <ScrollReveal delay={0.5}>
          <p className="text-[#374151] text-base sm:text-lg leading-relaxed mb-6">
            You don&apos;t install software. You don&apos;t configure APIs. You don&apos;t learn a new system.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.6}>
          <p className="text-[#1A1A1A] text-xl sm:text-2xl font-extrabold mb-12">
            You just start managing instead of doing.
          </p>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={0.7}>
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] mb-4">
              Let&apos;s talk.
            </h2>
            <p className="text-[#374151] text-base sm:text-lg mb-8">
              <a href="mailto:hello@renewably.ie" className="underline hover:text-[#1A1A1A] transition-colors">
                hello@renewably.ie
              </a>
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#374151] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Get Started
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

/* ============================================================
   MAIN EXPORT
   ============================================================ */
export default function ServicesPageClient() {
  return (
    <main>
        {/* ===== HERO — Full-Width Robot Banner ===== */}
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
                AI Workforce That Runs Your Solar Company, On Autopilot
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-2xl"
              >
                A fully managed AI workforce deployed across your operations, customer support, grants, and logistics. Built for solar companies that want to scale without finding staff they can&apos;t hire.
              </motion.p>
            </div>
          </div>

          {/* Yellow fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-[3] pointer-events-none" />
        </section>

        {/* ===== AGENTS SHOWCASE ===== */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Badge */}
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-6">
                  <motion.span
                    className="w-2 h-2 rounded-full bg-[#F3D840]"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
                    Here&apos;s what we deploy.
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Agent cards — alternating image/copy layout */}
            <div className="space-y-20 md:space-y-28">
              {agents.map((agent, i) => (
                <AgentCard key={agent.num} agent={agent} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <PricingSection />

        {/* ===== BEFORE / AFTER ===== */}
        <BeforeAfterSection />

        {/* ===== AUDIENCE ===== */}
        <AudienceSection />

        {/* ===== HOW IT STARTS + CTA ===== */}
        <HowItStartsSection />
      </main>
  );
}
