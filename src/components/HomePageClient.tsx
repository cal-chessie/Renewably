"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollReveal from "@/components/ScrollReveal";

/* ============================================================
   HERO SECTION — Agentic AI + Renewables | Yellow-Dominant
   ============================================================ */
function HeroSection() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" });

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#FFFDF5] via-white to-[#FFF9E0]">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 z-0">
        {/* Primary yellow glow - top right */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 10, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(243,216,64,0.3) 0%, rgba(243,216,64,0) 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Secondary yellow glow - bottom left */}
        <motion.div
          animate={{
            x: [0, -25, 15, 0],
            y: [0, 15, -25, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(243,216,64,0.18) 0%, rgba(243,216,64,0) 70%)",
            filter: "blur(100px)",
          }}
        />
        {/* Subtle warm brown accent glow - center */}
        <motion.div
          animate={{
            x: [0, 15, -10, 0],
            y: [0, -10, 20, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(137,90,24,0.06) 0%, rgba(137,90,24,0) 70%)",
            filter: "blur(120px)",
          }}
        />
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #895A18 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Neural network node pattern - subtle */}
        <div className="absolute inset-0 opacity-[0.015]">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="neuralGrid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="2" fill="#895A18" />
                <line x1="40" y1="0" x2="40" y2="40" stroke="#F3D840" strokeWidth="0.5" />
                <line x1="40" y1="40" x2="80" y2="40" stroke="#F3D840" strokeWidth="0.5" />
                <line x1="0" y1="40" x2="40" y2="40" stroke="#F3D840" strokeWidth="0.5" />
                <line x1="40" y1="40" x2="40" y2="80" stroke="#F3D840" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neuralGrid)" />
          </svg>
        </div>
        {/* Floating accent image - top right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 100 }}
          animate={{ opacity: 0.06, scale: 1, x: 0 }}
          transition={{ delay: 1, duration: 1.5 }}
          className="absolute top-10 right-0 w-[500px] h-[500px] hidden xl:block"
        >
          <Image
            src="/hero-bg-accent.png"
            alt=""
            width={1024}
            height={1024}
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32 md:pt-40 md:pb-40 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/15 border border-[#F3D840]/30 backdrop-blur-sm mb-8"
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse"
                style={{ boxShadow: "0 0 8px rgba(243,216,64,0.6)" }}
              />
              <span className="text-[#895A18] text-xs sm:text-sm font-semibold tracking-wide">
                Agentic AI for Renewable Energy
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] font-extrabold leading-[1.08] tracking-tight mb-6"
            >
              <span className="text-[#1A1A1A]">AI Agents That</span>
              <br />
              <span className="bg-gradient-to-r from-[#F3D840] via-[#E5C832] to-[#D4BA28] bg-clip-text text-transparent">
                Power Your Growth.
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-[#535353] text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-lg"
            >
              Autonomous AI agents that find, nurture, and convert leads for renewable energy brands — 24/7, on autopilot.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <MagneticButton href="/contact" className="animate-subtle-pulse">
                Book Your Free Call
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </MagneticButton>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-[#895A18] hover:text-[#6B4510] border border-[#895A18]/20 hover:border-[#895A18]/40 hover:bg-[#895A18]/5 transition-all duration-300"
              >
                Explore Services
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex items-center gap-6 mt-10 pt-8 border-t border-[#F3D840]/20"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[{ bg: 'bg-[#F3D840]', label: 'SE' }, { bg: 'bg-[#E5C832]', label: 'FD' }, { bg: 'bg-[#D4BA28]', label: 'AK' }, { bg: 'bg-[#895A18]', label: 'RM' }].map((item, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${item.bg} border-2 border-white flex items-center justify-center`}>
                      <span className="text-[10px] font-bold text-[#1A1A1A]">{item.label}</span>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-[#535353] font-medium">150+ clients</span>
              </div>
              <div className="w-px h-8 bg-[#F3D840]/30" />
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-[#F3D840]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-[#535353] font-medium ml-1">5.0 on Google</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            {/* Orbit rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="w-[520px] h-[520px] rounded-full border border-[#F3D840]/10"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="w-[440px] h-[440px] rounded-full border border-dashed border-[#895A18]/[0.08]"
              />
            </div>

            {/* Floating agent nodes on orbit */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-3 h-3 rounded-full bg-[#F3D840]"
                  style={{ boxShadow: "0 0 12px rgba(243,216,64,0.6)" }}
                />
              </div>
            </motion.div>

            {/* Glass card wrapper */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Image
                src="/hero-visual.png"
                alt="AI agents powering renewable energy marketing"
                width={1344}
                height={768}
                className="w-full rounded-2xl shadow-2xl shadow-[#F3D840]/15"
                priority
              />
              {/* Glass overlay bottom edge */}
              <div className="absolute bottom-0 left-4 right-4 h-24 bg-gradient-to-t from-white/60 to-transparent rounded-b-2xl" />
            </motion.div>

            {/* Floating glass metric card - AI Agents */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute -left-8 top-1/4"
            >
              <div className="bg-white/90 backdrop-blur-xl border border-[#F3D840]/20 rounded-2xl px-5 py-4 shadow-xl shadow-[#F3D840]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3D840] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#895A18]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#535353] text-xs font-medium">AI Agents Active</p>
                    <p className="text-[#1A1A1A] font-bold text-lg">24 / 7</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating glass metric card - Leads */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="absolute -right-6 bottom-1/4"
            >
              <div className="bg-white/90 backdrop-blur-xl border border-[#F3D840]/20 rounded-2xl px-5 py-4 shadow-xl shadow-[#F3D840]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#895A18]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#895A18]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#535353] text-xs font-medium">Lead Growth</p>
                    <p className="text-[#1A1A1A] font-bold text-lg">+247%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating glass metric card - ROI */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="absolute -right-2 top-12"
            >
              <div className="bg-white/90 backdrop-blur-xl border border-[#F3D840]/20 rounded-xl px-4 py-3 shadow-lg shadow-[#F3D840]/8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">8.4x ROI</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div ref={statsRef} className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { value: 3, suffix: "x", label: "Lead Volume", desc: "Average increase" },
              { value: 40, suffix: "%", label: "Lower CPA", desc: "Cost per acquisition" },
              { value: 24, suffix: "/7", label: "AI Monitoring", desc: "Always optimising" },
              { value: 150, suffix: "+", label: "Clients Served", desc: "Across Ireland" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                className="bg-white/80 backdrop-blur-md border border-[#F3D840]/15 rounded-2xl px-5 py-4 hover:bg-white/95 hover:border-[#F3D840]/30 transition-all duration-300"
              >
                <div className="text-2xl sm:text-3xl font-bold text-[#895A18] mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2} />
                </div>
                <p className="text-[#1A1A1A] text-sm font-semibold">{stat.label}</p>
                <p className="text-[#535353] text-xs mt-0.5">{stat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AI AGENTS SHOWCASE — New Section
   ============================================================ */
function AIAgentsSection() {
  const agents = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      ),
      title: "Campaign Agent",
      desc: "Autonomously generates, tests, and optimises ad creatives across channels — learning what resonates with your ideal customer.",
      status: "Active",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: "Analytics Agent",
      desc: "Monitors every metric in real-time — spotting trends, anomalies, and opportunities before your competitors see them.",
      status: "Active",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
      title: "Bidding Agent",
      desc: "Machine learning algorithms that adjust bids in real-time across Google, Meta, and LinkedIn to maximise your return.",
      status: "Active",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      title: "Nurture Agent",
      desc: "Automated email, SMS, and voice sequences that warm up cold leads and move prospects through your pipeline.",
      status: "Active",
    },
  ];

  return (
    <section className="bg-white py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-6"
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-[#F3D840]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[#895A18] text-xs sm:text-sm font-semibold tracking-wide">
                Meet Your AI Workforce
              </span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] mb-4">
              An Army of AI Agents,{" "}
              <span className="bg-gradient-to-r from-[#F3D840] to-[#D4BA28] bg-clip-text text-transparent">
                Working for You
              </span>
            </h2>
            <p className="text-[#535353] text-lg leading-relaxed">
              Each agent specialises in a specific domain — together they create an autonomous marketing machine that never sleeps.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {agents.map((agent, i) => (
            <ScrollReveal key={agent.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(243,216,64,0.12)" }}
                className="p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-white to-[#FFFDF5] border border-[#F3D840]/15 hover:border-[#F3D840]/40 transition-all duration-300 cursor-pointer group h-full"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#F3D840] flex items-center justify-center text-[#895A18] group-hover:scale-110 transition-transform duration-300">
                    {agent.icon}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-700 text-xs font-medium">{agent.status}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2 group-hover:text-[#895A18] transition-colors">
                  {agent.title}
                </h3>
                <p className="text-[#535353] text-sm leading-relaxed">
                  {agent.desc}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   MARQUEE SECTION
   ============================================================ */
function MarqueeSection() {
  const text =
    "AGENTIC AI • LEAD GENERATION • RENEWABLE ENERGY • SMART BIDDING • AI OPTIMISATION • CRM INTEGRATION • PAID MEDIA • IRELAND • ";

  return (
    <section className="bg-[#F3D840] py-4 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex">
        <span className="text-[#895A18] font-bold text-sm sm:text-base tracking-widest uppercase mx-4">
          {text}
        </span>
        <span className="text-[#895A18] font-bold text-sm sm:text-base tracking-widest uppercase mx-4">
          {text}
        </span>
      </div>
    </section>
  );
}

/* ============================================================
   ABOUT SNIPPET SECTION
   ============================================================ */
function AboutSection() {
  return (
    <section className="bg-white py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <ScrollReveal>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] leading-tight mb-6">
                We Find Your Buying Audience, by{" "}
                <span className="relative inline-block">
                  <span className="text-[#F3D840] bg-[#F3D840]/20 px-1">
                    Hyper-Targeting
                  </span>
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#F3D840] rounded-full"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    style={{ originX: 0 }}
                  />
                </span>{" "}
                and{" "}
                <span className="relative inline-block">
                  <span className="text-[#F3D840] bg-[#F3D840]/20 px-1">
                    Re-Targeting
                  </span>
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#F3D840] rounded-full"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    style={{ originX: 0 }}
                  />
                </span>{" "}
                Your Customers!
              </h2>
              <p className="text-[#535353] leading-relaxed mb-4">
                We start by analyzing your company processes, competitors, and market
                position. This deep dive helps us define the parameters of success and
                identify untapped opportunities for growth in the renewable energy sector.
              </p>
              <p className="text-[#535353] leading-relaxed mb-8">
                Through advanced hyper-targeting and retargeting strategies powered by agentic AI,
                we find the people most likely to buy from you and ensure your brand stays
                visible throughout their decision-making journey.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F3D840] hover:bg-[#E5C832] text-[#1A1A1A] font-bold rounded-full transition-all duration-300 text-sm shadow-md hover:shadow-lg hover:shadow-[#F3D840]/20"
              >
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ y: 0 }}
                whileInView={{ y: -20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Image
                  src="/funnel-illustration.png"
                  alt="AI-powered marketing funnel"
                  width={1152}
                  height={864}
                  className="w-full max-w-md drop-shadow-xl rounded-2xl"
                />
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SUSTAINABLE SYSTEM SECTION
   ============================================================ */
function SustainableSystemSection() {
  const checklistRef = useRef<HTMLDivElement>(null);
  const checklistInView = useInView(checklistRef, { once: true, margin: "-80px" });

  const items = [
    "Autonomous AI agents managing your campaigns 24/7",
    "Data-driven cross-channel strategies",
    "Engineered to drive higher conversions",
    "Continuous optimisation through machine learning",
    "Full CRM integration and lead pipeline",
    "Transparent reporting and real-time analytics",
  ];

  return (
    <section className="bg-[#FFFDF5] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <ScrollReveal>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] leading-tight mb-6">
                We Build You A{" "}
                <span className="text-[#895A18]">Sustainable System</span>, Where You
                Take All The Points!
              </h2>
              <p className="text-[#535353] leading-relaxed mb-8">
                We design and implement our proven technology stack with data-driven
                cross-channel strategies engineered to drive and sustain higher
                conversions. Using text, email, and voice automation, we sustain
                growth and maintain healthy communication with your prospects until
                they convert.
              </p>

              {/* Animated Checklist */}
              <div ref={checklistRef} className="space-y-4">
                {items.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={checklistInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.2 + i * 0.15, duration: 0.4, ease: "easeOut" }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={checklistInView ? { scale: 1 } : { scale: 0 }}
                      transition={{ delay: 0.2 + i * 0.15, duration: 0.3, type: "spring", stiffness: 300 }}
                      className="w-6 h-6 rounded-full bg-[#F3D840] flex items-center justify-center shrink-0"
                    >
                      <svg className="w-3.5 h-3.5 text-[#895A18]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    <p className="text-[#535353] text-sm leading-relaxed">{item}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/system-illustration.png"
                alt="AI agent ecosystem for renewable energy"
                width={1152}
                height={864}
                className="w-full max-w-md drop-shadow-xl rounded-2xl"
              />
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   YELLOW DIVIDER
   ============================================================ */
function YellowDivider() {
  return (
    <section className="bg-[#895A18] py-16 md:py-20">
      <ScrollReveal>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight"
            initial={{ scale: 0.95 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            The Barriers Between You and Your Future Customers, Can Be Tough!
          </motion.h2>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ============================================================
   SERVICES GRID
   ============================================================ */
function ServicesGrid() {
  const services = [
    {
      num: "01",
      icon: "🤖",
      title: "AI Campaign Agent",
      desc: "Autonomous AI agents that generate, test, and optimise ad copy across channels — learning what converts in real-time.",
    },
    {
      num: "02",
      icon: "🔄",
      title: "Smart Conversions",
      desc: "Personalised landing pages with dynamic titles and CTAs matched to every search query for maximum conversion.",
    },
    {
      num: "03",
      icon: "📊",
      title: "Smart Bidding",
      desc: "ML-driven bid strategies that adapt in real-time to reduce cost per acquisition and maximise returns.",
    },
    {
      num: "04",
      icon: "🔗",
      title: "CRM Integration",
      desc: "Seamless data flow from lead capture directly into your CRM with custom field mapping and real-time sync.",
    },
    {
      num: "05",
      icon: "⚡",
      title: "AI Optimisation",
      desc: "Continuous multivariate testing where the machine optimises the conversion path in response to user interactions.",
    },
    {
      num: "06",
      icon: "📈",
      title: "Analytics Agent",
      desc: "Real-time dashboards tracking every metric from impression to conversion with transparent ROI reporting.",
    },
  ];

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[#F3D840] font-bold text-sm tracking-wider uppercase mb-3">
              What We Do
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
              Our Services
            </h2>
            <div className="w-16 h-1 bg-[#F3D840] mx-auto rounded-full" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, i) => (
            <ScrollReveal key={service.num} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(243,216,64,0.12)" }}
                className="p-6 rounded-xl bg-white border border-gray-100 hover:border-l-[#F3D840] transition-all duration-300 cursor-pointer group h-full"
                style={{ borderLeftWidth: "4px", borderLeftColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = "#F3D840"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = "transparent"; }}
              >
                <div className="w-12 h-12 rounded-full bg-[#F3D840] flex items-center justify-center mb-4 text-xl">
                  <span className="text-[#895A18] font-bold text-sm">{service.num}</span>
                </div>
                <div className="text-2xl mb-3">{service.icon}</div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2 group-hover:text-[#895A18] transition-colors">
                  {service.title}
                </h3>
                <p className="text-[#535353] text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   RESULTS / STATS SECTION
   ============================================================ */
function ResultsSection() {
  const stats = [
    { value: 3, suffix: "x", label: "Lead Volume Increase" },
    { value: 150, suffix: "%", label: "Conversion Rate Improvement" },
    { value: 40, suffix: "%", label: "Cost Per Acquisition Reduction" },
    { value: 95, suffix: "%", label: "Client Retention Rate" },
  ];

  return (
    <section className="bg-[#895A18] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-[#F3D840] font-bold text-sm tracking-wider uppercase mb-3">
              Our Impact
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Results That Speak
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.15}>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F3D840] mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2} />
                </div>
                <p className="text-white/80 text-sm sm:text-base font-medium">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TESTIMONIALS SECTION
   ============================================================ */
function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const testimonials = [
    {
      quote:
        "Renewably transformed our lead generation completely. We went from struggling to find qualified leads to having a consistent pipeline of high-intent customers.",
      name: "Sean M.",
      company: "Solar Energy Company, Dublin",
    },
    {
      quote:
        "The AI-powered approach is genuinely different. Our cost per lead dropped by 40% in the first quarter while lead quality actually improved.",
      name: "Fiona K.",
      company: "Heat Pump Installer, Cork",
    },
    {
      quote:
        "Their team understands the renewable energy market inside out. The campaigns feel authentic and the results speak for themselves.",
      name: "David R.",
      company: "EV Charging Provider, Galway",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="bg-[#FFFDF5] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-[#F3D840] font-bold text-sm tracking-wider uppercase mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              What Our Clients Say
            </h2>
          </div>
        </ScrollReveal>

        <div className="relative min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-[#F3D840]/10"
            >
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-[#F3D840]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-lg sm:text-xl text-[#1A1A1A] leading-relaxed mb-6 font-medium italic">
                &ldquo;{testimonials[current].quote}&rdquo;
              </blockquote>

              <div>
                <p className="font-bold text-[#1A1A1A]">{testimonials[current].name}</p>
                <p className="text-[#895A18] text-sm font-medium">{testimonials[current].company}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === current ? "bg-[#F3D840] w-8" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   WHY CHOOSE US SECTION
   ============================================================ */
function WhyChooseSection() {
  const features = [
    "Hyper-targeted campaigns for your buying audience",
    "Autonomous AI agents with continuous A/B testing",
    "Personalised landing pages maximising conversion rates",
    "Smart bidding strategies reducing cost per acquisition",
    "Full CRM integration for seamless lead handoff",
    "Dedicated renewable energy marketing specialists",
  ];

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <ScrollReveal>
            <div>
              <p className="text-[#F3D840] font-bold text-sm tracking-wider uppercase mb-3">
                Why Renewably
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] leading-tight mb-6">
                Unleashing Your Unfair Advantage!
              </h2>
              <p className="text-[#535353] leading-relaxed mb-8">
                Search marketing and paid media are increasingly math-driven and
                automated. Without AI-powered tools and expert orchestration, you are
                being outgunned by competitors who have invested in agentic AI at every
                step. Renewably levels the playing field with autonomous technology
                that works 24/7 to deliver qualified leads.
              </p>

              <div className="space-y-4">
                {features.map((feature, i) => (
                  <ScrollReveal key={feature} delay={i * 0.08}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F3D840] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[#895A18]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-[#535353] text-sm font-medium">{feature}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/ai-illustration.png"
                alt="Agentic AI for renewable energy marketing"
                width={1152}
                height={864}
                className="w-full max-w-md drop-shadow-xl rounded-2xl mx-auto"
              />
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ SECTION
   ============================================================ */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is Leads as a Service?",
      a: "Leads as a Service (LaaS) is a fully managed lead generation solution where Renewably handles every aspect of customer acquisition — from campaign creation and ad copy generation to conversion optimisation and CRM integration. We use AI-powered technology and machine learning to automate and optimise paid media at scale, delivering qualified leads directly to your sales team.",
    },
    {
      q: "How does Renewably help renewable energy companies?",
      a: "Renewably specialises in digital marketing for renewable energy brands in Ireland. We combine hyper-targeted paid media campaigns with AI-driven conversion optimisation, smart bidding strategies, and CRM integration to create a sustainable customer acquisition system. Our data-driven approach ensures you get qualified leads with lower customer acquisition costs and higher conversion rates.",
    },
    {
      q: "What makes Renewably different?",
      a: "Renewably differentiates through our exclusive Leads as a Service model and agentic AI approach. Unlike traditional agencies that only manage campaigns, we deploy autonomous AI agents that build a complete, automated customer acquisition system tailored to renewable energy brands. This includes AI-powered ad copy generation, multivariate landing page testing, automated bid management, and direct CRM integration — all continuously optimised through machine learning.",
    },
    {
      q: "What results can I expect?",
      a: "Clients using our optimised conversion systems report up to 3 times lead volume lift through multivariate testing and machine learning. Our smart bidding strategies help reduce cost per acquisition while increasing conversion rates. Every campaign is continuously monitored and optimised to improve performance over time.",
    },
    {
      q: "How quickly can I see results?",
      a: "Most clients begin seeing measurable results within the first 30 days of campaign launch. Our AI agents start optimising from day one, using A/B testing and machine learning to rapidly improve performance. By month three, campaigns typically reach peak efficiency with significant improvements in lead quality and volume.",
    },
    {
      q: "Do I need a large marketing budget?",
      a: "We work with businesses of all sizes and can scale our services to match your budget. Our AI-powered approach is inherently efficient — smart bidding reduces wasted spend, and our optimised conversion paths mean you get more value from every click. We recommend starting with a strategy call so we can recommend the best approach for your specific goals and budget.",
    },
  ];

  return (
    <section className="bg-[#FFFDF5] py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-[#F3D840] font-bold text-sm tracking-wider uppercase mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
              Frequently Asked Questions
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={faq.q} delay={i * 0.05}>
              <div className="bg-white rounded-xl border border-[#F3D840]/10 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left font-semibold text-[#1A1A1A] hover:text-[#895A18] transition-colors cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <motion.svg
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-5 h-5 text-[#F3D840] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-[#535353] text-sm leading-relaxed">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
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
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] mb-6"
            initial={{ scale: 0.95 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Ready to Deploy Your AI Agents?
          </motion.h2>
          <p className="text-[#895A18] text-lg mb-10 max-w-2xl mx-auto">
            Join 150+ renewable energy brands that trust Renewably&apos;s autonomous AI to deliver qualified leads on autopilot.
          </p>
          <MagneticButton href="/contact">
            Get Started Today
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </MagneticButton>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   MAIN EXPORT
   ============================================================ */
export default function HomePageClient() {
  return (
    <>
      <HeroSection />
      <AIAgentsSection />
      <MarqueeSection />
      <AboutSection />
      <SustainableSystemSection />
      <YellowDivider />
      <ServicesGrid />
      <ResultsSection />
      <TestimonialsSection />
      <WhyChooseSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
