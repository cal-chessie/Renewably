"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollReveal from "@/components/ScrollReveal";

/* ============================================================
   SECTION 1: HERO — Full-Screen Robot Background
   ============================================================ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-10"
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse"
            style={{ boxShadow: "0 0 8px rgba(243,216,64,0.6)" }}
          />
          <span className="text-[#F3D840] text-sm sm:text-base font-bold tracking-wide">
            Renewably
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight text-white mb-6"
        >
          You&apos;re trying to run a solar company.
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-white/70 text-xl sm:text-2xl lg:text-3xl font-medium mb-8"
        >
          But you can&apos;t find the staff.
        </motion.p>

        {/* Highlight line */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="text-[#F3D840] text-2xl sm:text-3xl lg:text-4xl font-bold mb-12"
        >
          We built the next best thing.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
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
  );
}

/* ============================================================
   SECTION 2: PROBLEM SECTION — Dark Background
   ============================================================ */
function ProblemSection() {
  const calloutRef = useRef<HTMLDivElement>(null);
  const calloutInView = useInView(calloutRef, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0A0A0A] py-20 md:py-28 overflow-hidden">
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
          className="bg-[#F3D840] rounded-2xl px-8 py-10 sm:px-12 sm:py-12"
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
   SECTION 4: FEATURES SECTION — Off-White Background
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
            <ScrollReveal key={agent.title} delay={i * 0.1}>
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
   SECTION 6: VIDEO TOUR SECTION — Dark Background
   ============================================================ */
function VideoTourSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="bg-[#0A0A0A] py-20 md:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-6">
              <span className="text-[#F3D840] text-xs sm:text-sm font-semibold tracking-wide">Platform Tour</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">See It In Action</h2>
            <p className="text-white/60 text-lg leading-relaxed">
              Watch how the AI agents work across your entire solar operations &mdash; from first customer inquiry to completed installation.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div
            className="relative rounded-2xl overflow-hidden border border-white/10 cursor-pointer group"
            style={{ boxShadow: "0 0 40px rgba(243,216,64,0.08)" }}
            onClick={togglePlay}
          >
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="w-full aspect-video object-cover"
            >
              <source src="https://paperclip.ing/videos/full-tour.webm" type="video/webm" />
            </video>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ opacity: isPlaying ? 0 : 1, scale: isPlaying ? 0.8 : 1 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 rounded-full bg-[#F3D840] flex items-center justify-center shadow-2xl"
              >
                <svg className="w-8 h-8 text-[#1A1A1A] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </motion.div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/80 text-xs font-medium">Full Platform Tour</span>
            </div>
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
  const pricingItems = [
    { name: "CEO agent", price: "~\u20AC60/month" },
    { name: "Ops agent", price: "~\u20AC50/month" },
    { name: "Support agent", price: "~\u20AC40/month" },
    { name: "Grants agent", price: "~\u20AC40/month" },
    { name: "Logistics agent", price: "~\u20AC40/month" },
    { name: "Permitting agent", price: "~\u20AC40/month" },
    { name: "QA agent", price: "~\u20AC35/month" },
    { name: "Reporting agent", price: "~\u20AC30/month" },
  ];

  return (
    <section className="bg-[#FFFDF5] py-20 md:py-28 overflow-hidden">
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
        <div className="space-y-3 mb-10">
          {pricingItems.map((item, i) => (
            <ScrollReveal key={item.name} delay={0.15 + i * 0.08}>
              <div className="flex items-center justify-between p-5 rounded-xl bg-white border border-[#F3D840]/15 hover:border-[#F3D840]/40 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F3D840] group-hover:scale-125 transition-transform" />
                  <span className="text-[#1A1A1A] font-semibold text-base sm:text-lg">{item.name}</span>
                </div>
                <span className="text-[#374151] font-bold text-base sm:text-lg">{item.price}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Total callout */}
        <ScrollReveal delay={0.6}>
          <motion.div
            whileInView={{ scale: [0.97, 1] }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-[#F3D840] rounded-2xl px-8 py-8 sm:px-12 sm:py-10 text-center mb-6"
          >
            <p className="text-[#1A1A1A] text-3xl sm:text-4xl lg:text-5xl font-extrabold">
              Total workforce: ~&#8364;335/month
            </p>
          </motion.div>
        </ScrollReveal>

        <ScrollReveal delay={0.7}>
          <p className="text-center text-[#535353] text-base sm:text-lg">
            That&apos;s less than one day of a contractor. For a full team.
          </p>
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
    <section className="bg-white py-20 md:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-12">
            <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
              What changes.
            </span>
          </div>
        </ScrollReveal>

        {/* Comparison cards */}
        <div className="space-y-8">
          {comparisons.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.12}>
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
   SECTION 10: AUDIENCE SECTION — Dark Background
   ============================================================ */
function AudienceSection() {
  return (
    <section className="bg-[#0A0A0A] py-20 md:py-28 overflow-hidden">
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
    <section className="bg-[#F3D840] py-20 md:py-28 overflow-hidden">
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
            <MagneticButton href="/contact">
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </MagneticButton>
          </div>
        </ScrollReveal>
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
      <FeaturesSection />
      <AgentsSection />
      <VideoTourSection />
      <PricingSection />
      <BeforeAfterSection />
      <AudienceSection />
      <HowItStartsSection />
    </>
  );
}
