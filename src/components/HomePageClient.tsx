"use client";

import { useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollReveal from "@/components/ScrollReveal";

/* ============================================================
   SECTION 1: HERO — Mobile-first robot image, Desktop cinematic bg
   ============================================================ */
function HeroSection() {
  return (
    <>
      {/* ── MOBILE HERO (< md) — full-screen background with text overlay ── */}
      <section
        className="md:hidden"
        style={{
          position: 'relative',
          minHeight: '100vh',
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#F3D840',
        }}
      >
        {/* Full-screen background image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Image
            src="/robot-mobile-hero.png"
            alt=""
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            priority
          />
        </div>

        {/* Dark gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'linear-gradient(180deg, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0.55) 40%, rgba(10,10,10,0.3) 100%)',
          }}
        />

        {/* Yellow fade at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: 'linear-gradient(to top, #F3D840, transparent)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            paddingLeft: 24,
            paddingRight: 24,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          {/* Brand badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 9999,
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              marginBottom: 24,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.03em',
            }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse"
              style={{ boxShadow: '0 0 8px rgba(243,216,64,0.6)' }}
            />
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>AI as a Service</span>
          </motion.div>

          {/* Setup line */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 8,
              lineHeight: 1.4,
            }}
          >
            You don&apos;t need more staff.
          </motion.p>

          {/* Hero statement */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 34,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#F3D840',
              marginBottom: 32,
            }}
          >
            You need a workforce that never sleeps.
          </motion.h1>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
          >
            <a
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 32px',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: '#1A1A1A',
                background: 'linear-gradient(to right, #F3D840, #E5C832)',
                borderRadius: 9999,
                textDecoration: 'none',
                border: 'none',
                lineHeight: 1,
                boxShadow: '0 10px 25px rgba(243,216,64,0.2)',
              }}
            >
              Let&apos;s Talk
              <span style={{ display: 'inline-block', marginLeft: 2 }}>&#8594;</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── DESKTOP HERO (>= md) ── */}
      <section
        data-theme="dark"
        className="hidden md:flex relative min-h-screen items-center justify-center overflow-hidden"
      >
        {/* Full-screen background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/robot-hero.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#0A0A0A]/80 via-[#0A0A0A]/50 to-[#0A0A0A]/30" />

        {/* Subtle dot grid on dark */}
        <div
          className="absolute inset-0 z-[2] opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Subtle neural grid */}
        <div className="absolute inset-0 z-[2] opacity-[0.03]">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="heroNeuralGrid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="1.5" fill="white" />
                <line x1="40" y1="0" x2="40" y2="40" stroke="white" strokeWidth="0.3" />
                <line x1="40" y1="40" x2="80" y2="40" stroke="white" strokeWidth="0.3" />
                <line x1="0" y1="40" x2="40" y2="40" stroke="white" strokeWidth="0.3" />
                <line x1="40" y1="40" x2="40" y2="80" stroke="white" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroNeuralGrid)" />
          </svg>
        </div>

        {/* Yellow fade at very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#F3D840] to-transparent z-[3] pointer-events-none" />

        {/* Hero content */}
        <div className="relative z-[4] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Brand badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"
            style={{ marginBottom: 32, padding: '6px 16px', fontSize: 13, fontWeight: 600, letterSpacing: '0.03em' }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse"
              style={{ boxShadow: "0 0 8px rgba(243,216,64,0.6)" }}
            />
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>
              AI as a Service
            </span>
          </motion.div>

          {/* Setup line */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl sm:text-2xl lg:text-3xl font-medium text-white/70 mb-4"
          >
            You don&apos;t need more staff.
          </motion.p>

          {/* Hero statement */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight text-[#F3D840] mb-12"
          >
            You need a workforce that never sleeps.
          </motion.h1>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            <MagneticButton href="/contact">
              Let&apos;s Talk
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </MagneticButton>
          </motion.div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   SECTION 2: PROBLEM SECTION — Dark Background
   ============================================================ */
function ProblemSection() {
  const calloutRef = useRef<HTMLDivElement>(null);
  const calloutInView = useInView(calloutRef, { once: true, margin: "-80px" });

  return (
    <section data-theme="dark" className="bg-[#0A0A0A] py-20 md:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-10">
            <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
            <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
              You know the problem.
            </span>
          </div>
        </ScrollReveal>

        {/* Body paragraphs */}
        <div className="space-y-6 mb-12">
          <ScrollReveal delay={0.1}>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed">
              You have work. Lots of it. More quotes than you can price. More sites than you can assess. More customers than you can call back.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed">
              But you can&apos;t find the people.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed">
              Electricians are booked out. Admin staff are impossible to keep. Project managers are burning out. And every time you lose someone, you lose three months of knowledge.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed">
              So you do it yourself. You&apos;re answering emails at 10pm. You&apos;re chasing permits on a Saturday. You&apos;re quoting roofs on your phone between site visits.
            </p>
          </ScrollReveal>
        </div>

        {/* Callout */}
        <motion.div
          ref={calloutRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={calloutInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#F3D840] rounded-2xl"
          style={{ padding: '32px 20px' }}
        >
          <p className="text-[#1A1A1A] text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
            That&apos;s not a business. That&apos;s a hostage situation.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 3: SOLUTION SECTION — White Background
   ============================================================ */
function SolutionSection() {
  return (
    <section className="bg-white py-20 md:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] leading-tight mb-6">
            What if you could hire a team that never sleeps, never quits, and costs a fraction of what a person costs?
          </h2>
        </ScrollReveal>

        {/* Sub-text */}
        <ScrollReveal delay={0.15}>
          <p className="text-[#374151] text-lg sm:text-xl leading-relaxed mb-6">
            Not robots. Not chatbots. Actual employees. With roles. With responsibilities. With a boss.
          </p>
        </ScrollReveal>

        {/* Body */}
        <ScrollReveal delay={0.25}>
          <p className="text-[#535353] text-base sm:text-lg leading-relaxed mb-6">
            They assess roofs. They fill out grant applications. They call customers back. They coordinate installers. They order equipment. They flag problems before you know they exist.
          </p>
        </ScrollReveal>

        {/* Closing */}
        <ScrollReveal delay={0.35}>
          <p className="text-[#1A1A1A] text-lg sm:text-xl font-bold leading-relaxed">
            You manage them like a real team. They work like a real team.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 4: PLATFORM TOUR — Dark Background
   ============================================================ */
function PlatformTourSection() {
  return (
    <section data-theme="dark" className="bg-[#0A0A0A] py-20 md:py-28 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
              <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
                See it in action.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center leading-tight mb-6">
            This is what your Monday looks like now.
          </h2>
        </ScrollReveal>

        {/* Sub-text */}
        <ScrollReveal delay={0.2}>
          <p className="text-white/60 text-lg sm:text-xl text-center leading-relaxed mb-12 max-w-2xl mx-auto">
            No more chasing. No more spreadsheeting. No more &quot;I&apos;ll get to that tomorrow.&quot;
            Open the dashboard. Your team is already working.
          </p>
        </ScrollReveal>

        {/* Video container */}
        <ScrollReveal delay={0.3}>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            {/* Yellow glow accent */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#F3D840]/20 via-transparent to-transparent pointer-events-none z-10" />

            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full aspect-video object-cover"
              poster=""
            >
              <source src="/full-tour.webm" type="video/webm" />
            </video>
          </div>
        </ScrollReveal>

        {/* Bottom line */}
        <ScrollReveal delay={0.4}>
          <p className="text-center text-white/40 text-sm mt-8">
            That is the platform. That is your workforce.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 5: FEATURES SECTION — Off-White Background
   ============================================================ */
function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      title: "Answer every customer. Immediately.",
      desc: "No more 'we'll call you back.' No more lost leads. Customer support agent responds 24/7. Books consultations. Answers questions. Escalates only what needs you.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ),
      title: "Assess sites. Automatically.",
      desc: "Upload roof photos. Agent analyses shade, orientation, structural issues. Generates report. Adds to quote. All before lunch.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      title: "Handle every grant.",
      desc: "SEAI applications. Paperwork. Follow-ups. Resubmissions. Agent knows every form, every deadline, every requirement. Your grant approval rate goes up. Your admin time goes to zero.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      title: "Coordinate installers.",
      desc: "Schedule crews. Order materials. Confirm deliveries. Reschedule when weather hits. Agent runs the logistics so you don't have to.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      ),
      title: "Chase permits.",
      desc: "ESB Networks applications. Grid connection paperwork. Agent tracks every submission. Follows up on delays. Escalates only when stuck.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      title: "Flag problems before they blow up.",
      desc: "Job taking too long? Customer hasn't heard anything in a week? Budget running over? Agent alerts you. Not after the fact. Before.",
    },
  ];

  return (
    <section className="bg-[#FFFDF5] py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-6">
              <motion.span
                className="w-2 h-2 rounded-full bg-[#F3D840]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
                Here&apos;s what they do.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(243,216,64,0.12)" }}
                className="p-6 lg:p-8 rounded-2xl bg-white border border-[#F3D840]/15 hover:border-[#F3D840]/40 transition-all duration-300 cursor-pointer group h-full"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F3D840] flex items-center justify-center text-[#374151] group-hover:scale-110 transition-transform duration-300 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 group-hover:text-[#374151] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[#535353] text-sm leading-relaxed">
                  {feature.desc}
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
   SECTION 5: AGENTS SECTION — White Background
   ============================================================ */
function AgentsSection() {
  const agents = [
    {
      title: "CEO agent",
      desc: "Sets strategy. Assigns work. Manages the team. Reports to you weekly.",
    },
    {
      title: "Operations agent",
      desc: "Runs the day to day. Coordinates installs. Manages timelines.",
    },
    {
      title: "Customer support agent",
      desc: "Answers every message. Books every consult. Never sleeps.",
    },
    {
      title: "Grants agent",
      desc: "Knows every SEAI scheme. Fills every form. Chases every application.",
    },
    {
      title: "Logistics agent",
      desc: "Orders equipment. Schedules crews. Manages inventory.",
    },
    {
      title: "Permitting agent",
      desc: "Handles ESB. Tracks submissions. Follows up on delays.",
    },
    {
      title: "QA agent",
      desc: "Reviews every job before handover. Checks paperwork. Catches mistakes.",
    },
    {
      title: "Reporting agent",
      desc: "Shows you exactly what's happening. Weekly summaries. Bottlenecks identified.",
    },
    {
      title: "Marketing agent",
      desc: "Runs campaigns. Generates leads. Writes copy. Manages socials. Fills your pipeline while you sleep.",
    },
  ];

  return (
    <section className="bg-white py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-6">
              <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
                What you actually get.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {agents.map((agent, i) => (
            <ScrollReveal key={agent.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(243,216,64,0.1)" }}
                className="p-6 lg:p-8 rounded-2xl bg-white border-2 border-[#F3D840]/30 hover:border-[#F3D840]/60 transition-all duration-300 cursor-pointer group h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#F3D840] group-hover:scale-125 transition-transform duration-300" />
                  <h3 className="text-lg font-bold text-[#1A1A1A]">
                    {agent.title}
                  </h3>
                </div>
                <p className="text-[#535353] text-sm leading-relaxed">
                  {agent.desc}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}

          {/* Much more card */}
          <ScrollReveal delay={0.72}>
            <Link href="/workforce">
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(243,216,64,0.15)" }}
                className="p-6 lg:p-8 rounded-2xl bg-[#0A0A0A] border-2 border-[#F3D840]/40 hover:border-[#F3D840] transition-all duration-300 cursor-pointer group h-full flex flex-col items-center justify-center text-center min-h-[120px]"
              >
                <span className="text-[#F3D840] text-2xl font-extrabold mb-2 group-hover:scale-110 transition-transform duration-300">
                  + Much More
                </span>
                <span className="text-white/50 text-sm">
                  See the full workforce
                </span>
              </motion.div>
            </Link>
          </ScrollReveal>
        </div>

        {/* Callout + closing */}
        <ScrollReveal delay={0.3}>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[#535353] text-lg leading-relaxed mb-6">
              You approve every hire. You set every budget. You review every strategy.
            </p>
            <p className="text-[#1A1A1A] text-xl sm:text-2xl font-extrabold">
              You&apos;re the board. They&apos;re the workforce.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 8: PRICING SECTION — Off-White Background
   ============================================================ */
function PricingSection() {
  return (
    <section className="bg-[#FFFDF5] py-20 md:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-10">
            <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
              What it costs.
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="text-[#1A1A1A] text-2xl sm:text-3xl font-extrabold mb-8">
            Less than a junior admin.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-[#535353] text-lg sm:text-xl leading-relaxed mb-6 max-w-2xl mx-auto">
            Most solar installers pay €1,000 – €1,500 per month plus a one-time setup fee.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <p className="text-[#535353] text-lg sm:text-xl leading-relaxed mb-6 max-w-2xl mx-auto">
            You bring your own AI keys. You pay the models directly. No markup from us.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p className="text-[#1A1A1A] text-lg sm:text-xl font-semibold mb-10">
            We&apos;ll give you an exact quote after a 30 minute call.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.5}>
          <div style={{ marginTop: 48 }}>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 rounded-full font-bold transition-all duration-300 shadow-md hover:shadow-lg"
              style={{ padding: "10px 24px", fontSize: 14, letterSpacing: "0.02em", backgroundColor: "#1A1A1A", color: "#fff" }}
          >
            Book a Call
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
   SECTION 9: BEFORE/AFTER SECTION — White Background
   ============================================================ */
function BeforeAfterSection() {
  const comparisons = [
    {
      before: "You answer every customer email yourself. You lose leads at 6pm. On weekends. When you're on a roof.",
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
      before: "You lose money on admin. You lose sleep on coordination. You lose customers on follow-up.",
      after: "You run a solar company. Not a chaos factory.",
    },
  ];

  return (
    <section className="bg-white py-12 md:py-20 lg:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20" style={{ marginBottom: 40 }}>
            <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
              What changes.
            </span>
          </div>
        </ScrollReveal>

        {/* Comparison cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {comparisons.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.12}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" style={{ gap: 24 }}>
                {/* Before */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-xl bg-[#FFFDF5] border-l-4 border-l-[#EF4444]/40 border border-[#EF4444]/15"
                  style={{ padding: '28px 24px' }}
                >
                  <span className="inline-block text-[#EF4444]/70 text-xs font-bold uppercase tracking-wider" style={{ marginBottom: 12, display: 'block' }}>
                    Before
                  </span>
                  <p className="text-[#535353] text-sm sm:text-base leading-relaxed" style={{ fontSize: 16, lineHeight: 1.7 }}>
                    {item.before}
                  </p>
                </motion.div>

                {/* After */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-xl bg-[#FFFDF5] border-l-4 border-l-[#F3D840] border border-[#F3D840]/15"
                  style={{ padding: '28px 24px' }}
                >
                  <span className="inline-block text-[#F3D840] text-xs font-bold uppercase tracking-wider" style={{ marginBottom: 12, display: 'block' }}>
                    After
                  </span>
                  <p className="text-[#1A1A1A] text-sm sm:text-base leading-relaxed font-semibold" style={{ fontSize: 16, lineHeight: 1.7 }}>
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
   SECTION 10: AUDIENCE SECTION — Dark Background
   ============================================================ */
function AudienceSection() {
  return (
    <section data-theme="dark" className="bg-[#0A0A0A] py-20 md:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-10">
            <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
            <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
              Who is this for?
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
   SECTION 11: HOW IT STARTS + CTA — Yellow Background
   ============================================================ */
function HowItStartsSection() {
  const steps = [
    "We talk for an hour.",
    "You show us how you work today.",
    "We build your team.",
    "You approve the hires.",
    "We turn it on.",
  ];

  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsInView = useInView(stepsRef, { once: true, margin: "-80px" });

  return (
    <section style={{ backgroundColor: '#F3D840', paddingTop: 64, paddingBottom: 64, overflow: 'hidden' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, backgroundColor: 'rgba(26,26,26,0.1)', border: '1px solid rgba(26,26,26,0.15)', marginBottom: 32 }}>
          <span style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 600, letterSpacing: '0.03em' }}>
            How it starts.
          </span>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: '50%', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#F3D840', fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
              </div>
              <p style={{ color: '#1A1A1A', fontSize: 16, fontWeight: 600 }}>{step}</p>
            </div>
          ))}
        </div>

        {/* Closing text */}
        <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
          You don&apos;t install software. You don&apos;t configure APIs. You don&apos;t learn a new system.
        </p>

        <p style={{ color: '#1A1A1A', fontSize: 18, fontWeight: 800, marginBottom: 32 }}>
          You just start managing instead of doing.
        </p>

        {/* CTA */}
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <h2 style={{ color: '#1A1A1A', fontSize: 28, fontWeight: 800, lineHeight: 1.15, marginBottom: 12, textAlign: 'center' }}>
            Ready to meet your new team?
          </h2>
          <p style={{ color: '#374151', fontSize: 16, marginBottom: 24, textAlign: 'center' }}>
            <a href="mailto:hello@renewably.ie" style={{ textDecoration: 'underline', color: '#374151' }}>
              hello@renewably.ie
            </a>
          </p>
          <div style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
            <a
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 32px',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: '#F3D840',
                backgroundColor: '#0A0A0A',
                borderRadius: 9999,
                textDecoration: 'none',
                border: 'none',
                lineHeight: 1,
              }}
            >
              Let&apos;s Talk
              <span style={{ display: 'inline-block', marginLeft: 2 }}>&#8594;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   DEFAULT EXPORT — Page Assembly
   ============================================================ */
export default function HomePageClient() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <PlatformTourSection />
      <FeaturesSection />
      <AgentsSection />
      <PricingSection />
      <BeforeAfterSection />
      <AudienceSection />
      <HowItStartsSection />
    </>
  );
}
