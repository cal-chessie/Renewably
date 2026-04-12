"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import MagneticButton from "@/components/MagneticButton";
import Link from "next/link";
import Image from "next/image";

/* ============================================================
   CONSTANTS
   ============================================================ */
const DARK = "#0A0A0A";
const YELLOW = "#F3D840";

/* ============================================================
   DATA
   ============================================================ */
const journey = [
  {
    phase: "The Problem",
    year: "2024",
    text: "Irish solar installers were drowning in admin. Grant paperwork piling up. Customers going unanswered overnight. Installers working 70-hour weeks and still losing leads. We talked to dozens of founders. The story was always the same: more work than people, and no way to hire fast enough.",
  },
  {
    phase: "The Realisation",
    year: "2024",
    text: "The problem wasn't that solar companies needed better software. They'd tried CRM systems, scheduling tools, project management platforms. The problem was that none of these tools actually did the work. They just organised the chaos. Installers didn't need another dashboard. They needed workers.",
  },
  {
    phase: "The Build",
    year: "2024",
    text: "We started building AI agents that could actually do the jobs. An agent that fills out SEAI grant applications correctly. An agent that responds to customer enquiries at midnight. An agent that tracks ESB permit submissions and follows up on delays. Not chatbots. Not automations. Actual digital employees.",
  },
  {
    phase: "The Launch",
    year: "2025",
    text: "We deployed our first AI workforce with a solar installer in Ireland. Within 30 days, their grant approval rate doubled. Their customer response time dropped from 12 hours to 2 minutes. Their install velocity increased by 40%. The founder told us: 'It's like hiring six people overnight.'",
  },
  {
    phase: "The Scale",
    year: "2025",
    text: "Today we deploy AI workforces across Irish solar companies doing 20+ jobs a month. Nine specialised agents. One unified dashboard. Full management and reporting. Our clients are installing more panels, serving more customers, and finally getting home before dark.",
  },
];

const problems = [
  {
    title: "The Staffing Ceiling",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    desc: "You have more work than people. Electricians are booked out. Admin staff don't stay. Project managers burn out. Every time you lose someone, you lose months of knowledge, relationships, and momentum. The work keeps coming. The people keep leaving.",
    stat: "73%",
    statLabel: "of Irish installers can't hire fast enough",
  },
  {
    title: "The Admin Trap",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    desc: "Grant applications. ESB paperwork. Customer follow-ups. Equipment ordering. Permit chasing. You started a solar company to install panels. Instead you spend half your week on tasks that have nothing to do with your craft. That's not what you signed up for.",
    stat: "18hrs",
    statLabel: "per week wasted on admin tasks",
  },
  {
    title: "The Lead Leakage",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    desc: "A customer submits an enquiry at nine on a Tuesday night. You see it at eight the next morning. They've already called three other installers. One answered at seven. They booked with them. You lost a deal not because you're bad. Because you were asleep.",
    stat: "47%",
    statLabel: "of leads go cold before follow-up",
  },
  {
    title: "The Visibility Problem",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    desc: "Where is every job right now? Which grants are approved? Which permits are stuck? Which customer hasn't heard from you in two weeks? You don't know. Your spreadsheets don't know. Your WhatsApp groups don't know. Nobody knows. That's not a system. That's chaos.",
    stat: "3x",
    statLabel: "more jobs handled with full visibility",
  },
];

const values = [
  {
    title: "Built for Solar",
    desc: "Every agent is trained on Irish solar operations. SEAI grants, ESB permits, Irish building regulations, Irish weather patterns. We know your industry because we work in your industry.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    title: "Managed, Not Self-Service",
    desc: "You don't install software. You don't configure APIs. We deploy the agents, manage them, and report weekly. You review, approve, and manage the team. That's it.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Results, Not Promises",
    desc: "Response times, approval rates, install velocity, customer satisfaction. Every metric is visible in your dashboard. You see exactly what your AI workforce is doing and what value it delivers.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Grows With You",
    desc: "Start with three agents. Add two more next quarter. Build out the full team over six months. Every agent is independent. Cancel anytime. No contracts. No lock-in.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

const agents = [
  "CEO Agent",
  "Operations Agent",
  "Customer Support Agent",
  "Grants Agent",
  "Logistics Agent",
  "Permitting Agent",
  "QA Agent",
  "Reporting Agent",
  "Marketing Agent",
];

/* ============================================================
   HERO SECTION
   ============================================================ */
function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={heroRef}
      data-theme="dark"
      style={{ position: "relative", overflow: "hidden", backgroundColor: DARK }}
    >
      {/* Robot hero background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Image
          src="/robot-3.jpg"
          alt=""
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(135deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.65) 50%, rgba(10,10,10,0.4) 100%)",
        }}
      />

      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          opacity: 0.04,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <motion.div
        style={{
          y: heroY,
          opacity: heroOpacity,
          position: "relative",
          zIndex: 3,
          maxWidth: 896,
          width: "100%",
          padding: "0 16px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div style={{ paddingTop: 140, paddingBottom: 100 }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              marginBottom: 32,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.03em",
            }}
          >
            <motion.span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: YELLOW,
                boxShadow: "0 0 8px rgba(243,216,64,0.6)",
              }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ color: "rgba(255,255,255,0.85)" }}>About Us</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              marginBottom: 24,
            }}
          >
            We built the team
            <br />
            <span style={{ color: YELLOW }}>you can&apos;t find.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "clamp(17px, 2vw, 21px)",
              lineHeight: 1.6,
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            Renewably deploys AI employees across your solar operations. Not
            chatbots. Not software. Actual workers with roles, responsibilities,
            and a boss. Based in Ireland. Built for Irish solar installers.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            style={{ marginTop: 40 }}
          >
            <MagneticButton href="/contact">
              Meet the Team
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </MagneticButton>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          background: "linear-gradient(to top, #fff, transparent)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />
    </section>
  );
}

/* ============================================================
   OUR STORY / JOURNEY TIMELINE
   ============================================================ */
function StorySection() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  return (
    <section style={{ backgroundColor: "#fff", paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 9999,
              backgroundColor: "rgba(243,216,64,0.1)",
              border: "1px solid rgba(243,216,64,0.2)",
              marginBottom: 32,
            }}
          >
            <span
              style={{
                color: "#374151",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              How it started.
            </span>
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={0.1}>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: "#1A1A1A",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 16,
              maxWidth: 600,
            }}
          >
            We didn&apos;t start an AI company.
            <br />
            <span style={{ color: YELLOW }}>We started a workforce company.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: "#535353",
              maxWidth: 560,
              marginBottom: 48,
            }}
          >
            Click each phase to see how we got here. The story starts where every
            solar installer&apos;s story starts: overwhelmed.
          </p>
        </ScrollReveal>

        {/* Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {journey.map((step, i) => {
            const isExpanded = expandedStep === i;
            const isLast = i === journey.length - 1;

            return (
              <ScrollReveal key={i} delay={i * 0.08}>
                <motion.div
                  onClick={() => setExpandedStep(isExpanded ? null : i)}
                  style={{ cursor: "pointer" }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Row */}
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      paddingTop: 24,
                      paddingBottom: 24,
                      borderBottom: isLast
                        ? "none"
                        : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Left: phase + year */}
                    <div
                      style={{
                        minWidth: 100,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: YELLOW,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {step.year}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#1A1A1A",
                        }}
                      >
                        {step.phase}
                      </span>
                    </div>

                    {/* Right: text + expand */}
                    <div style={{ flex: 1 }}>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={isExpanded ? "full" : "preview"}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                          }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          style={{
                            fontSize: 15,
                            lineHeight: 1.7,
                            color: isExpanded ? "#374151" : "#535353",
                            overflow: "hidden",
                          }}
                        >
                          {isExpanded
                            ? step.text
                            : step.text.slice(0, 120) + "..."}
                        </motion.p>
                      </AnimatePresence>

                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          color: YELLOW,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {isExpanded ? "Click to collapse" : "Click to read more"}
                      </span>
                    </div>

                    {/* Expand icon */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        paddingTop: 4,
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke={YELLOW}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   THE PROBLEMS WE SOLVE
   ============================================================ */
function ProblemsSection() {
  const [activeProblem, setActiveProblem] = useState(0);

  return (
    <section
      style={{ backgroundColor: "#F9FAFB", paddingTop: 96, paddingBottom: 96 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 9999,
              backgroundColor: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.15)",
              marginBottom: 32,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#3B82F6",
                display: "inline-block",
              }}
            />
            <span
              style={{
                color: "#374151",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              The problems we solve.
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: "#1A1A1A",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 48,
              maxWidth: 600,
            }}
          >
            Every solar installer in Ireland
            <br />
            <span style={{ color: "#3B82F6" }}>has the same problems.</span>
          </h2>
        </ScrollReveal>

        {/* Problem tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {problems.map((problem, i) => (
            <ScrollReveal key={problem.title} delay={i * 0.08}>
              <motion.div
                onClick={() => setActiveProblem(i)}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                style={{
                  cursor: "pointer",
                  padding: "24px 28px",
                  borderRadius: 16,
                  backgroundColor: activeProblem === i ? "#fff" : "transparent",
                  border:
                    activeProblem === i
                      ? "2px solid rgba(243,216,64,0.5)"
                      : "2px solid transparent",
                  boxShadow:
                    activeProblem === i
                      ? "0 8px 30px rgba(243,216,64,0.1)"
                      : "none",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 20,
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      minWidth: 48,
                      borderRadius: 14,
                      backgroundColor:
                        activeProblem === i
                          ? "rgba(243,216,64,0.15)"
                          : "rgba(0,0,0,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: activeProblem === i ? YELLOW : "#9CA3AF",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {problem.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: activeProblem === i ? 12 : 0,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#1A1A1A",
                        }}
                      >
                        {problem.title}
                      </h3>

                      {/* Stat pill */}
                      <div
                        style={{
                          display:
                            activeProblem === i ? "inline-flex" : "none",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 14px",
                          borderRadius: 9999,
                          backgroundColor: "rgba(59,130,246,0.08)",
                          border: "1px solid rgba(59,130,246,0.15)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#3B82F6",
                          }}
                        >
                          {problem.stat}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#6B7280",
                            fontWeight: 500,
                          }}
                        >
                          {problem.statLabel}
                        </span>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {activeProblem === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{
                            fontSize: 15,
                            lineHeight: 1.7,
                            color: "#535353",
                            overflow: "hidden",
                          }}
                        >
                          {problem.desc}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   VALUES SECTION
   ============================================================ */
function ValuesSection() {
  return (
    <section data-theme="dark" style={{ backgroundColor: DARK, paddingTop: 96, paddingBottom: 96 }}>
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position: "relative", zIndex: 1 }}>
        {/* Badge */}
        <ScrollReveal>
          <div
            style={{
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                What we stand for.
              </span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            Not an AI company.
            <br />
            <span style={{ color: YELLOW }}>A workforce company.</span>
          </h2>
        </ScrollReveal>

        {/* Value cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {values.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 0.1}>
              <motion.div
                whileHover={{
                  y: -6,
                  boxShadow: "0 20px 40px rgba(243,216,64,0.08)",
                }}
                style={{
                  padding: "32px 28px",
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  height: "100%",
                  cursor: "default",
                  transition: "border-color 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: "rgba(243,216,64,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: YELLOW,
                    marginBottom: 20,
                  }}
                >
                  {v.icon}
                </div>

                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 10,
                  }}
                >
                  {v.title}
                </h3>

                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {v.desc}
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
   THE WORKFORCE SECTION
   ============================================================ */
function WorkforceSection() {
  return (
    <section
      style={{ backgroundColor: "#fff", paddingTop: 96, paddingBottom: 96 }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 9999,
              backgroundColor: "rgba(243,216,64,0.1)",
              border: "1px solid rgba(243,216,64,0.2)",
              marginBottom: 32,
            }}
          >
            <span
              style={{
                color: "#374151",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              Your new team.
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: "#1A1A1A",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 16,
              maxWidth: 500,
            }}
          >
            Nine agents. One mission.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: "#535353",
              maxWidth: 520,
              marginBottom: 48,
            }}
          >
            Each agent is a specialist. They work together as a team. You manage
            them like real employees. They deliver like real employees. Because
            they are real employees. Just digital.
          </p>
        </ScrollReveal>

        {/* Agent list with stagger */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {agents.map((agent, i) => (
            <ScrollReveal key={agent} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderRadius: 14,
                  backgroundColor: "#FFFDF5",
                  border: "1.5px solid rgba(243,216,64,0.15)",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: YELLOW,
                    minWidth: 10,
                    boxShadow: "0 0 8px rgba(243,216,64,0.3)",
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1A1A1A",
                  }}
                >
                  {agent}
                </span>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div
            style={{
              padding: "28px 32px",
              borderRadius: 16,
              backgroundColor: DARK,
              border: "2px solid rgba(243,216,64,0.2)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
              You approve every hire. You set every budget. You review every strategy.
            </p>
            <p style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
              You&apos;re the board. They&apos;re the workforce.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   FOUNDER / CTA SECTION
   ============================================================ */
function FounderSection() {
  const founderRef = useRef<HTMLDivElement>(null);
  const isInView = useScroll({
    target: founderRef,
    offset: ["start end", "end start"],
  });
  const bgScale = useTransform(isInView.scrollYProgress, [0.2, 0.6], [1.05, 1]);

  return (
    <section
      ref={founderRef}
      style={{
        backgroundColor: "#FFFDF5",
        paddingTop: 96,
        paddingBottom: 96,
        overflow: "hidden",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 48,
            alignItems: "center",
          }}
          className="lg:grid-cols-2"
        >
          {/* Photo */}
          <ScrollReveal>
            <div style={{ maxWidth: 400, margin: "0 auto" }}>
              <motion.div
                style={{ scale: bgScale, borderRadius: 20, overflow: "hidden" }}
              >
                <div
                  style={{
                    position: "relative",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
                  }}
                >
                  <Image
                    src="/founder-photo.png"
                    alt="Renewably founder"
                    width={432}
                    height={576}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      objectFit: "cover",
                    }}
                    priority
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 120,
                      background:
                        "linear-gradient(to top, rgba(243,216,64,0.4), transparent)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </motion.div>

              {/* Caption */}
              <p
                style={{
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: 13,
                  color: "#9CA3AF",
                  fontStyle: "italic",
                }}
              >
                Based in Ireland. Working with Irish solar installers every day.
              </p>
            </div>
          </ScrollReveal>

          {/* Copy */}
          <div>
            <ScrollReveal>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  borderRadius: 9999,
                  backgroundColor: "rgba(243,216,64,0.1)",
                  border: "1px solid rgba(243,216,64,0.2)",
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    color: "#374151",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                  }}
                >
                  Why we exist.
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h2
                style={{
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 800,
                  color: "#1A1A1A",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  marginBottom: 20,
                }}
              >
                We talked to solar installers.
                <br />
                <span style={{ color: YELLOW }}>Then we built what they needed.</span>
              </h2>
            </ScrollReveal>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ScrollReveal delay={0.2}>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: "#535353" }}>
                  Every feature in our platform exists because a solar installer
                  asked for it. We didn&apos;t sit in an office theorising about
                  what the industry needs. We went on site visits. We sat in on
                  team meetings. We watched founders answer emails at midnight
                  and chase permits on Saturdays.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: "#535353" }}>
                  What we found was simple: solar installers don&apos;t need
                  better tools. They need more people. And since they can&apos;t
                  find the people, we built them. Digital people. Who work
                  around the clock. Who never quit. Who cost a fraction of what
                  a human costs.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.4}>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: "#535353" }}>
                  That&apos;s Renewably. That&apos;s what we do. And we&apos;re
                  just getting started.
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={0.5}>
              <div style={{ marginTop: 32 }}>
                <MagneticButton href="/contact">
                  Have a Conversation
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </MagneticButton>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA
   ============================================================ */
function FinalCTA() {
  return (
    <section style={{ backgroundColor: YELLOW, paddingTop: 80, paddingBottom: 80 }}>
      <div
        style={{
          maxWidth: 700,
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: 24,
          paddingRight: 24,
          textAlign: "center",
        }}
      >
        <ScrollReveal>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 44px)",
              fontWeight: 800,
              color: DARK,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            Your competitors are already building their teams.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: "#374151",
              marginBottom: 32,
              maxWidth: 500,
              margin: "0 auto 32px auto",
            }}
          >
            We talk for an hour. You show us how you work today. We build your
            team. You approve the hires. We turn it on. That&apos;s the entire
            process.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 32px",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: YELLOW,
                backgroundColor: DARK,
                borderRadius: 9999,
                textDecoration: "none",
                border: "none",
                lineHeight: 1,
                transition: "all 0.3s ease",
              }}
            >
              Let&apos;s Talk
              <span style={{ display: "inline-block", marginLeft: 2 }}>
                &#8594;
              </span>
            </a>
            <a
              href="/workforce"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 32px",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: DARK,
                backgroundColor: "transparent",
                borderRadius: 9999,
                textDecoration: "none",
                border: "2px solid rgba(26,26,26,0.3)",
                lineHeight: 1,
                transition: "all 0.3s ease",
              }}
            >
              See the Workforce
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p style={{ marginTop: 32, fontSize: 14, color: "rgba(55,65,81,0.7)" }}>
            <a
              href="mailto:hello@renewably.ie"
              style={{ textDecoration: "underline", color: "#374151" }}
            >
              hello@renewably.ie
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   MAIN EXPORT
   ============================================================ */
export default function AboutPageClient() {
  return (
    <main>
      <HeroSection />
      <StorySection />
      <ProblemsSection />
      <ValuesSection />
      <WorkforceSection />
      <FounderSection />
      <FinalCTA />
    </main>
  );
}
