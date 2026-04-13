"use client";

import { useRef, useState, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import ScrollReveal from "@/components/ScrollReveal";
import BeforeAfterSection from "@/components/shared/BeforeAfterSection";
import AudienceSection from "@/components/shared/AudienceSection";
import HowItStartsSection from "@/components/shared/HowItStartsSection";

/* ============================================================
   SECTION 1: HERO — Full-bleed cinematic background, responsive
   ============================================================ */
function HeroSection() {
  return (
    <section
      data-theme="dark"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#0A0A0A',
      }}
    >
      {/* Full-screen background image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="/robot-hero.jpg"
          alt=""
          fill
          className="hero-bg-img"
          style={{ objectFit: 'cover', objectPosition: '65% center' }}
          priority
        />
      </div>

      {/* Dark gradient overlay — lighter on mobile so robot stays visible longer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'linear-gradient(180deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.4) 40%, rgba(10,10,10,0.2) 100%)',
        }}
      />

      {/* Subtle dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
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
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* Hero content — responsive sizing via clamp */}
      <div
        style={{
          position: 'relative',
          zIndex: 4,
          maxWidth: 800,
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 80,
          paddingBottom: 'clamp(60px, 12vw, 100px)',
          textAlign: 'center',
        }}
      >
        {/* Brand badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 9999,
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            marginBottom: 'clamp(16px, 3vw, 32px)',
            padding: '5px 14px',
            fontSize: 'clamp(11px, 1.3vw, 13px)',
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse"
            style={{ boxShadow: '0 0 8px rgba(243,216,64,0.6)' }}
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
          style={{
            fontSize: 'clamp(17px, 3.5vw, 30px)',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 'clamp(6px, 1.2vw, 16px)',
            lineHeight: 1.4,
          }}
        >
          You don&apos;t need more staff.
        </motion.p>

        {/* Hero statement */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(28px, 7vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: '#F3D840',
            marginBottom: 'clamp(24px, 4vw, 48px)',
          }}
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
      {/* Responsive objectPosition — desktop centres, mobile shifts right to show the robot */}
      <style>{`
        .hero-bg-img {
          object-position: 65% center !important;
        }
        @media (min-width: 768px) {
          .hero-bg-img {
            object-position: center !important;
          }
        }
      `}</style>
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
    <section
      data-theme="dark"
      style={{
        backgroundColor: '#0A0A0A',
        paddingTop: 'clamp(80px, 10vw, 112px)',
        paddingBottom: 'clamp(60px, 8vw, 112px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ marginBottom: 'clamp(32px, 5vw, 40px)' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 9999,
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse"
              />
              <span style={{ color: '#fff', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
                You know the problem.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Body paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 24px)', marginBottom: 'clamp(40px, 6vw, 48px)' }}>
          <ScrollReveal delay={0.1}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(17px, 2.5vw, 20px)', lineHeight: 1.7 }}>
              You have work. Lots of it. More quotes than you can price. More sites than you can assess. More customers than you can call back.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(17px, 2.5vw, 20px)', lineHeight: 1.7 }}>
              But you can&apos;t find the people.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7 }}>
              Electricians are booked out. Admin staff are impossible to keep. Project managers are burning out. And every time you lose someone, you lose three months of knowledge.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7 }}>
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
          style={{ padding: 'clamp(20px, 4vw, 32px) clamp(16px, 3vw, 32px)' }}
        >
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(20px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.2 }}>
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
    <section style={{ backgroundColor: '#fff', paddingTop: 'clamp(48px, 6vw, 80px)', paddingBottom: 'clamp(48px, 6vw, 112px)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Headline */}
        <ScrollReveal>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            What if you could hire a team that never sleeps, never quits, and costs a fraction of what a person costs?
          </h2>
        </ScrollReveal>

        {/* Sub-text */}
        <ScrollReveal delay={0.15}>
          <p style={{ color: '#374151', fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.7, marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            Not robots. Not chatbots. Actual employees. With roles. With responsibilities. With a boss.
          </p>
        </ScrollReveal>

        {/* Body */}
        <ScrollReveal delay={0.25}>
          <p style={{ color: '#535353', fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.7, marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            They assess roofs. They fill out grant applications. They call customers back. They coordinate installers. They order equipment. They flag problems before you know they exist.
          </p>
        </ScrollReveal>

        {/* Closing */}
        <ScrollReveal delay={0.35}>
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 700, lineHeight: 1.7 }}>
            You manage them like a real team. They work like a real team.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 4: PLATFORM TOUR — Dark Background (Lazy Video)
   ============================================================ */
function PlatformTourSection() {
  const videoRef = useRef<HTMLDivElement>(null);
  const videoInView = useInView(videoRef, { once: true, margin: "200px" });
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section
      data-theme="dark"
      style={{
        backgroundColor: '#0A0A0A',
        paddingTop: 'clamp(80px, 10vw, 112px)',
        paddingBottom: 'clamp(60px, 8vw, 112px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1024, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(28px, 4vw, 40px)' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 9999,
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
              <span style={{ color: '#fff', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
                See it in action.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={0.1}>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.15, marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            This is what your Monday looks like now.
          </h2>
        </ScrollReveal>

        {/* Sub-text */}
        <ScrollReveal delay={0.2}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(15px, 2.2vw, 20px)', textAlign: 'center', lineHeight: 1.7, marginBottom: 'clamp(32px, 5vw, 48px)', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            No more chasing. No more spreadsheeting. No more &quot;I&apos;ll get to that tomorrow.&quot;
            Open the dashboard. Your team is already working.
          </p>
        </ScrollReveal>

        {/* Video container — lazy loaded when scrolled into view */}
        <ScrollReveal delay={0.3}>
          <div ref={videoRef} className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50" style={{ background: '#0A0A0A' }}>
            {/* Yellow glow accent */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#F3D840]/20 via-transparent to-transparent pointer-events-none z-10" />

            {/* Skeleton placeholder until video loads */}
            {!videoLoaded && (
              <div className="w-full aspect-video flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(243,216,64,0.1)', border: '1px solid rgba(243,216,64,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="20" height="20" fill="none" stroke="#F3D840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 500 }}>Loading platform tour...</span>
                </div>
              </div>
            )}

            {/* Video — only rendered when in viewport */}
            {videoInView && (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full aspect-video object-cover"
                poster=""
                onCanPlay={() => setVideoLoaded(true)}
                style={videoLoaded ? {} : { position: 'absolute', inset: 0, opacity: 0 }}
              >
                <source src="/full-tour.webm" type="video/webm" />
              </video>
            )}
          </div>
        </ScrollReveal>

        {/* Bottom line */}
        <ScrollReveal delay={0.4}>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(12px, 1.4vw, 14px)', marginTop: 'clamp(24px, 3vw, 32px)' }}>
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
  const features = useMemo(() => [
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
  ], []);

  return (
    <section
      style={{
        backgroundColor: '#FFFDF5',
        paddingTop: 'clamp(48px, 6vw, 80px)',
        paddingBottom: 'clamp(48px, 6vw, 112px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 9999,
                backgroundColor: 'rgba(243,216,64,0.1)',
                border: '1px solid rgba(243,216,64,0.2)',
              }}
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-[#F3D840]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
                Here&apos;s what they do.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(243,216,64,0.12)" }}
                className="p-5 lg:p-6 rounded-2xl bg-white border border-[#F3D840]/15 hover:border-[#F3D840]/40 transition-all duration-300 cursor-pointer group h-full"
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
  const agents = useMemo(() => [
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
      desc: "Coming soon. Runs campaigns. Generates leads. Writes copy. Manages socials.",
      comingSoon: true,
    },
  ], []);

  return (
    <section
      style={{
        backgroundColor: '#fff',
        paddingTop: 'clamp(48px, 6vw, 80px)',
        paddingBottom: 'clamp(48px, 6vw, 112px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 9999,
                backgroundColor: 'rgba(243,216,64,0.1)',
                border: '1px solid rgba(243,216,64,0.2)',
              }}
            >
              <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
                What you actually get.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5" style={{ marginBottom: 'clamp(32px, 4vw, 48px)' }}>
          {agents.map((agent, i) => (
            <ScrollReveal key={agent.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(243,216,64,0.1)" }}
                className={`p-5 lg:p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group h-full ${'comingSoon' in agent ? 'bg-[#0A0A0A] border-[#F3D840]/30 opacity-50' : 'bg-white border-[#F3D840]/30 hover:border-[#F3D840]/60'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full group-hover:scale-125 transition-transform duration-300 ${'comingSoon' in agent ? 'bg-[#F3D840]/40' : 'bg-[#F3D840]'}`} />
                  <h3 className={`text-lg font-bold ${'comingSoon' in agent ? 'text-[#F3D840]/70' : 'text-[#1A1A1A]'}`}>
                    {agent.title}
                    {'comingSoon' in agent && <span className="ml-2 text-xs font-semibold text-[#F3D840]/50 uppercase tracking-wider">Coming soon</span>}
                  </h3>
                </div>
                <p className={`text-sm leading-relaxed ${'comingSoon' in agent ? 'text-white/40' : 'text-[#535353]'}`}>
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
                className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border-2 border-[#F3D840]/40 hover:border-[#F3D840] transition-all duration-300 cursor-pointer group h-full flex flex-col items-center justify-center text-center min-h-[100px]"
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
          <div style={{ maxWidth: 768, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
            <p style={{ color: '#535353', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, marginBottom: 'clamp(12px, 2vw, 24px)' }}>
              You approve every hire. You set every budget. You review every strategy.
            </p>
            <p style={{ color: '#1A1A1A', fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800 }}>
              You&apos;re the board. They&apos;re the workforce.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 7: FAQ SECTION — Off-White Background
   ============================================================ */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = useMemo(() => [
    {
      q: "What does Renewably do?",
      a: "Renewably deploys 8 specialised AI agents that automate every part of a solar PV installation business in Ireland. Our AI handles SEAI grant applications, ESB permit tracking, customer support, logistics coordination, quality assurance, operations management, and reporting — so you can focus on installing panels instead of drowning in admin.",
    },
    {
      q: "How does the AI workforce work?",
      a: "Each AI agent specialises in a specific area of your solar business. The CEO Agent orchestrates the team, the Operations Agent coordinates installs, the Grants Agent handles SEAI applications, and so on. They work 24/7, integrate with your existing tools, and report directly to you through a single dashboard. You manage them like a real team.",
    },
    {
      q: "How much does it cost?",
      a: "Most solar installers pay €1,000 – €1,500 per month plus a one-time setup fee. You bring your own AI API keys and pay model providers directly — we do not mark up AI usage costs. Typical AI model costs are €50–200/month depending on your volume. No hidden fees.",
    },
    {
      q: "What makes Renewably different from other AI tools?",
      a: "Renewably is purpose-built for Irish solar PV installers — not a generic chatbot or CRM plugin. Every agent knows SEAI schemes, ESB Networks processes, Irish building regulations, and the local solar market. You get 8 specialised AI employees working as a coordinated team, not a single general-purpose tool.",
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. Your data is encrypted at rest and in transit, stored in EU-based data centres, and never shared with third parties. We comply with GDPR and Irish data protection regulations. Your customer data, business information, and conversation histories are yours alone — we do not use them to train AI models.",
    },
    {
      q: "How do I get started?",
      a: "Book a 15-minute call through our website or ring us on +353 873 958 424. We will walk you through the platform, discuss your specific needs, and provide a tailored quote. Once you sign up, our team handles the entire setup — typically within one to two weeks. No technical expertise required.",
    },
  ], []);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section style={{ backgroundColor: '#FFFDF5', paddingTop: 'clamp(48px, 6vw, 80px)', paddingBottom: 'clamp(48px, 6vw, 112px)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, backgroundColor: 'rgba(243,216,64,0.1)', border: '1px solid rgba(243,216,64,0.2)' }}>
              <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
                Common questions.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={0.1}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: '#1A1A1A', textAlign: 'center', lineHeight: 1.15, marginBottom: 'clamp(32px, 4vw, 48px)' }}>
            Still have questions?
          </h2>
        </ScrollReveal>

        {/* FAQ button tap target styles — rendered once outside loop */}
        <style>{`
          .home-faq-btn {
            min-height: 44px !important;
          }
          .home-faq-btn > span:last-child {
            width: 44px !important;
            height: 44px !important;
            minWidth: 44px !important;
            font-size: 18px !important;
          }
        `}</style>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 12px)' }} role="region" aria-label="Frequently asked questions">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <ScrollReveal key={i} delay={i * 0.06}>
                <div
                  style={{
                    borderRadius: 12,
                    backgroundColor: '#fff',
                    border: isOpen ? '1px solid rgba(243,216,64,0.4)' : '1px solid rgba(0,0,0,0.06)',
                    boxShadow: isOpen ? '0 4px 20px rgba(243,216,64,0.08)' : 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                    className="home-faq-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: 'clamp(16px, 2.5vw, 20px) clamp(16px, 3vw, 24px)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: 16,
                    }}
                  >
                    <span style={{ color: '#1A1A1A', fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', fontWeight: 600, lineHeight: 1.5 }}>
                      {faq.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      aria-hidden="true"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        minWidth: 24,
                        borderRadius: '50%',
                        backgroundColor: isOpen ? '#F3D840' : 'rgba(0,0,0,0.05)',
                        transition: 'background-color 0.3s ease',
                        color: isOpen ? '#1A1A1A' : '#535353',
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      +
                    </motion.span>
                  </button>

                  <motion.div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-labelledby={`faq-question-${i}`}
                    initial={false}
                    animate={{
                      height: isOpen ? 'auto' : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{
                      color: '#535353',
                      fontSize: 'clamp(0.9rem, 1.4vw, 0.95rem)',
                      lineHeight: 1.7,
                      padding: '0 clamp(16px, 3vw, 24px) clamp(16px, 2.5vw, 20px)',
                    }}>
                      {faq.a}
                    </p>
                  </motion.div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <ScrollReveal delay={0.4}>
          <p style={{ textAlign: 'center', color: '#535353', fontSize: 'clamp(14px, 1.8vw, 16px)', lineHeight: 1.7, marginTop: 'clamp(32px, 4vw, 48px)', marginBottom: 'clamp(12px, 2vw, 16px)' }}>
            Can&apos;t find what you&apos;re looking for?
          </p>
          <div style={{ textAlign: 'center' }}>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: 'clamp(12px, 1.5vw, 12px) 28px',
                backgroundColor: '#1A1A1A',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 9999,
                textDecoration: 'none',
                letterSpacing: '0.02em',
                minWidth: 180,
              }}
            >
              Ask us anything
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
   SECTION 8: PRICING SECTION — Off-White Background
   ============================================================ */
function PricingSection() {
  return (
    <section style={{ backgroundColor: '#FFFDF5', paddingTop: 'clamp(48px, 6vw, 80px)', paddingBottom: 'clamp(48px, 6vw, 112px)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(16px, 4vw, 32px)', paddingRight: 'clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
        {/* Badge */}
        <ScrollReveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, backgroundColor: 'rgba(243,216,64,0.1)', border: '1px solid rgba(243,216,64,0.2)', marginBottom: 'clamp(20px, 4vw, 40px)' }}>
            <span style={{ color: '#374151', fontSize: 'clamp(11px, 1.3vw, 14px)', fontWeight: 600, letterSpacing: '0.04em' }}>
              What it costs.
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, marginBottom: 'clamp(16px, 3vw, 32px)' }}>
            Less than a junior admin.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p style={{ color: '#535353', fontSize: 'clamp(15px, 2vw, 20px)', lineHeight: 1.7, marginBottom: 'clamp(12px, 2vw, 24px)', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            Most solar installers pay €1,000 – €1,500 per month plus a one-time setup fee.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <p style={{ color: '#535353', fontSize: 'clamp(15px, 2vw, 20px)', lineHeight: 1.7, marginBottom: 'clamp(12px, 2vw, 24px)', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            You bring your own AI keys. You pay the models directly. No markup from us.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p style={{ color: '#1A1A1A', fontSize: 'clamp(15px, 2vw, 20px)', fontWeight: 600, marginBottom: 'clamp(20px, 4vw, 40px)' }}>
            We&apos;ll give you an exact quote after a 30 minute call.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.5}>
          <div style={{ marginTop: 'clamp(24px, 3vw, 48px)' }}>
            <Link
              href="/contact"
              className="home-pricing-cta"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 12, borderRadius: 9999, fontWeight: 700, textDecoration: 'none', padding: 'clamp(12px, 1.5vw, 14px) 28px', fontSize: 14, letterSpacing: '0.02em', backgroundColor: '#1A1A1A', color: '#fff', transition: 'box-shadow 0.3s ease', minWidth: 180 }}
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
      <BeforeAfterSection
        comparisons={[
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
        ]}
      />
      <AudienceSection />
      <FAQSection />
      <HowItStartsSection
        ctaTitle="Ready to meet your new team?"
        ctaButtonLabel="Let's Talk"
        ctaButtonColor="#F3D840"
      />
    </>
  );
}
