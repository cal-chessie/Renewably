"use client";

import { useState, useRef, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import MagneticButton from "@/components/MagneticButton";
import Link from "next/link";
import Image from "next/image";
import { posts } from "@/lib/blog-data";

/* ============================================================
   CONSTANTS
   ============================================================ */
const DARK = "#0A0A0A";
const YELLOW = "#F3D840";

/* ============================================================
   DATA
   ============================================================ */
const allCategories = [
  "All",
  ...Array.from(new Set(posts.map((p) => p.category))),
];

const topics = [
  { label: "SEAI Grants", count: 2 },
  { label: "ESB Networks", count: 2 },
  { label: "AI Operations", count: 3 },
  { label: "Customer Retention", count: 2 },
  { label: "Lead Generation", count: 2 },
  { label: "Solar PV", count: 5 },
  { label: "Revenue Growth", count: 3 },
  { label: "Site Assessment", count: 2 },
  { label: "Equipment Logistics", count: 2 },
  { label: "Permit Tracking", count: 2 },
  { label: "Forecasting", count: 1 },
  { label: "Automation", count: 4 },
];

const categoryColors: Record<string, string> = {
  Operations: "#3B82F6",
  Grants: "#10B981",
  "Customer Support": "#F59E0B",
  Permitting: "#8B5CF6",
  Logistics: "#EF4444",
  Reporting: "#06B6D4",
  "Lead Generation": "#EC4899",
};

/* ============================================================
   ICONS
   ============================================================ */
function ArrowIcon({ color = "#1A1A1A" }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke={color}
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke={YELLOW}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

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
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: DARK,
      }}
    >
      {/* Robot hero background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Image
          src="/robot-4.jpg"
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
            "linear-gradient(135deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.35) 100%)",
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
        <div style={{ paddingTop: 140, paddingBottom: 80 }}>
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
            <span style={{ color: "rgba(255,255,255,0.85)" }}>Insights</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.5,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              marginBottom: 24,
            }}
          >
            Solar is changing.
            <br />
            <span style={{ color: YELLOW }}>Stay ahead.</span>
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
              margin: "0 auto 40px",
            }}
          >
            Practical guides on AI operations, SEAI grants, ESB permitting,
            logistics, and customer support. Written for solar companies doing
            20+ jobs a month in Ireland.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            style={{ maxWidth: 520, margin: "0 auto" }}
          >
            <SearchBar />
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
          background: "linear-gradient(to top, #F9FAFB, transparent)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />
    </section>
  );
}

/* ============================================================
   SEARCH BAR (used in hero)
   ============================================================ */
function SearchBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
        <SearchIcon />
      </span>
      <span
        style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 15,
          fontWeight: 400,
        }}
      >
        Search articles, topics, guides...
      </span>
      <span
        style={{
          marginLeft: "auto",
          padding: "4px 10px",
          borderRadius: 6,
          backgroundColor: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.3)",
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        CMD+K
      </span>
    </div>
  );
}

/* ============================================================
   CATEGORY FILTERS (sticky)
   ============================================================ */
function CategoryFilters({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 64,
        zIndex: 30,
        backgroundColor: "rgba(249,250,251,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(26,26,26,0.06)",
        padding: "16px 0",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {allCategories.map((cat) => {
            const isActive = activeCategory === cat;
            const catColor = categoryColors[cat];
            return (
              <motion.button
                key={cat}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: isActive
                    ? catColor || YELLOW
                    : "transparent",
                  color: isActive ? "#1A1A1A" : "#9CA3AF",
                  border: `1px solid ${
                    isActive
                      ? catColor || YELLOW
                      : "rgba(26,26,26,0.08)"
                  }`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {cat}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FEATURED POST
   ============================================================ */
function FeaturedCard({ post }: { post: (typeof posts)[0] }) {
  const catColor = categoryColors[post.category] || "#9CA3AF";

  return (
    <ScrollReveal>
      <Link href={`/blog/${post.slug}`} className="group block">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "relative",
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: DARK,
            cursor: "pointer",
          }}
        >
          {/* Content overlay */}
          <div
            style={{
              padding: "48px 40px",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Dot grid bg */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.04,
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Badge row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: YELLOW,
                    boxShadow: "0 0 12px rgba(243,216,64,0.6)",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: YELLOW,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Latest
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  |
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 9999,
                    backgroundColor: catColor,
                    color: "#fff",
                  }}
                >
                  {post.category}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  |
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  <ClockIcon /> {post.readTime}
                </span>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: "clamp(24px, 3.5vw, 36px)",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  marginBottom: 16,
                  maxWidth: 640,
                }}
              >
                {post.title}
              </h2>

              {/* Excerpt */}
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 28,
                  maxWidth: 560,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {post.excerpt}
              </p>

              {/* Meta + CTA row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {new Date(post.date).toLocaleDateString("en-IE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <motion.span
                  className="group-hover:inline-flex"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 28px",
                    borderRadius: 9999,
                    backgroundColor: YELLOW,
                    color: "#1A1A1A",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  Read Article <ArrowIcon />
                </motion.span>
              </div>
            </div>
          </div>

          {/* Ambient glow */}
          <motion.div
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 20, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              top: "-20%",
              right: "-10%",
              width: 350,
              height: 350,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(243,216,64,0.08) 0%, transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />
        </motion.div>
      </Link>
    </ScrollReveal>
  );
}

/* ============================================================
   ARTICLE CARD
   ============================================================ */
function ArticleCard({
  post,
  index,
}: {
  post: (typeof posts)[0];
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const catColor = categoryColors[post.category] || "#9CA3AF";

  return (
    <ScrollReveal delay={index * 0.05}>
      <Link href={`/blog/${post.slug}`} className="group block">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.25 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            padding: 28,
            borderRadius: 20,
            border: "1.5px solid",
            borderColor: isHovered
              ? `${catColor}40`
              : "rgba(26,26,26,0.06)",
            backgroundColor: isHovered ? "#fff" : "#fff",
            boxShadow: isHovered
              ? `0 12px 40px ${catColor}10, 0 2px 8px rgba(0,0,0,0.04)`
              : "0 2px 8px rgba(0,0,0,0.03)",
            transition: "all 0.3s ease",
            cursor: "pointer",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Category + Read time */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 9999,
                backgroundColor: isHovered ? catColor : `${catColor}15`,
                color: isHovered ? "#fff" : catColor,
                transition: "all 0.3s ease",
              }}
            >
              {post.category}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ClockIcon /> {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1A1A1A",
              lineHeight: 1.35,
              marginBottom: 10,
              transition: "color 0.2s",
            }}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#535353",
              marginBottom: 20,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: 1,
            }}
          >
            {post.excerpt}
          </p>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              borderTop: "1px solid rgba(26,26,26,0.05)",
            }}
          >
            <time
              style={{ fontSize: 13, color: "#9CA3AF" }}
              dateTime={post.date}
            >
              {new Date(post.date).toLocaleDateString("en-IE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </time>
            <motion.div
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowIcon color={isHovered ? catColor : "#9CA3AF"} />
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </ScrollReveal>
  );
}

/* ============================================================
   NEWSLETTER SECTION
   ============================================================ */
function NewsletterSection() {
  return (
    <section
      data-theme="dark"
      style={{
        backgroundColor: DARK,
        paddingTop: 96,
        paddingBottom: 96,
        position: "relative",
        overflow: "hidden",
      }}
    >
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

      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ position: "relative", zIndex: 1, textAlign: "center" }}
      >
        {/* Badge */}
        <ScrollReveal>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              marginBottom: 32,
            }}
          >
            <MailIcon />
            <span
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              Weekly Briefing
            </span>
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
              marginBottom: 16,
            }}
          >
            Get the weekly briefing.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 480,
              margin: "0 auto 36px",
            }}
          >
            One email per week. No spam. No fluff. Practical insights on AI
            operations, SEAI grant changes, ESB permit updates, and what&apos;s
            actually working for Irish solar installers right now.
          </p>
        </ScrollReveal>

        {/* Email input + button */}
        <ScrollReveal delay={0.3}>
          <div
            style={{
              display: "flex",
              gap: 12,
              maxWidth: 480,
              margin: "0 auto 24px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              style={{
                flex: 1,
                minWidth: 240,
                padding: "14px 20px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 400,
                outline: "none",
              }}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                backgroundColor: YELLOW,
                color: "#1A1A1A",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              Subscribe <ArrowIcon />
            </motion.button>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Join 200+ Irish solar professionals. Unsubscribe anytime.
          </p>
        </ScrollReveal>

        {/* Ambient glow */}
        <motion.div
          animate={{ x: [-30, 20, -30], y: [10, -20, 10] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: "-15%",
            left: "20%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(243,216,64,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}

/* ============================================================
   TOPICS CLOUD SECTION
   ============================================================ */
function TopicsSection() {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  return (
    <section
      style={{
        backgroundColor: "#fff",
        paddingTop: 96,
        paddingBottom: 96,
      }}
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
            <TagIcon />
            <span
              style={{
                color: "#374151",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              Browse by topic
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              color: "#1A1A1A",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 16,
              maxWidth: 500,
            }}
          >
            Everything Irish solar
            <br />
            <span style={{ color: YELLOW }}>in one place.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: "#535353",
              maxWidth: 480,
              marginBottom: 40,
            }}
          >
            We cover every angle of running a solar installation business in
            Ireland. Click a topic to explore.
          </p>
        </ScrollReveal>

        {/* Topic chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {topics.map((topic, i) => (
            <ScrollReveal key={topic.label} delay={i * 0.04}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredTopic(topic.label)}
                onMouseLeave={() => setHoveredTopic(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 22px",
                  borderRadius: 14,
                  backgroundColor:
                    hoveredTopic === topic.label
                      ? DARK
                      : "#F9FAFB",
                  border:
                    hoveredTopic === topic.label
                      ? "1.5px solid rgba(243,216,64,0.4)"
                      : "1.5px solid rgba(26,26,26,0.06)",
                  color:
                    hoveredTopic === topic.label
                      ? YELLOW
                      : "#374151",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  boxShadow:
                    hoveredTopic === topic.label
                      ? "0 8px 24px rgba(243,216,64,0.12)"
                      : "none",
                }}
              >
                {topic.label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 9999,
                    backgroundColor:
                      hoveredTopic === topic.label
                        ? "rgba(243,216,64,0.15)"
                        : "rgba(0,0,0,0.05)",
                    color:
                      hoveredTopic === topic.label
                        ? YELLOW
                        : "#9CA3AF",
                  }}
                >
                  {topic.count}
                </span>
              </motion.button>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA SECTION
   ============================================================ */
function FinalCTA() {
  return (
    <section
      style={{
        backgroundColor: YELLOW,
        paddingTop: 80,
        paddingBottom: 80,
      }}
    >
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ textAlign: "center" }}
      >
        <ScrollReveal>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "#1A1A1A",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            Your competitors are reading this.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p
            style={{
              fontSize: 17,
              color: "#374151",
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 480,
              margin: "0 auto 36px",
            }}
          >
            The ones who act on it are the ones winning. Stop reading. Start
            deploying. Every article on this page is already deployed in real
            solar companies across Ireland.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 36px",
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 9999,
                backgroundColor: "#1A1A1A",
                color: YELLOW,
                textDecoration: "none",
                boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              }}
            >
              Get Started <ArrowIcon color={YELLOW} />
            </motion.a>
            <motion.a
              href="/workforce"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 36px",
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 9999,
                backgroundColor: "transparent",
                color: "#1A1A1A",
                textDecoration: "none",
                border: "2px solid #1A1A1A",
              }}
            >
              Meet the AI Team <ArrowIcon />
            </motion.a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function BlogPageClient() {
  const [activeCategory, setActiveCategory] = useState("All");

  const featuredPost = posts[0];
  const filteredPosts = useMemo(() => {
    if (activeCategory === "All") return posts.slice(1);
    return posts.filter(
      (p) => p.category === activeCategory && p.slug !== featuredPost.slug
    );
  }, [activeCategory, featuredPost.slug]);

  return (
    <main>
      {/* 1. HERO */}
      <HeroSection />

      {/* 2. FEATURED POST */}
      <section
        style={{
          backgroundColor: "#F9FAFB",
          paddingTop: 64,
          paddingBottom: 0,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedCard post={featuredPost} />
        </div>
      </section>

      {/* 3. CATEGORY FILTERS (sticky) */}
      <div style={{ backgroundColor: "#F9FAFB" }}>
        <CategoryFilters
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </div>

      {/* 4. BLOG GRID */}
      <section
        style={{
          backgroundColor: "#F9FAFB",
          paddingTop: 0,
          paddingBottom: 96,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <ScrollReveal>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 36,
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(22px, 3vw, 30px)",
                  fontWeight: 800,
                  color: "#1A1A1A",
                }}
              >
                {activeCategory === "All"
                  ? "All articles"
                  : activeCategory}
              </h2>
              <span
                style={{
                  fontSize: 13,
                  color: "#9CA3AF",
                  fontWeight: 500,
                }}
              >
                {filteredPosts.length} article
                {filteredPosts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </ScrollReveal>

          {/* Posts grid with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 20,
              }}
            >
              {filteredPosts.map((post, i) => (
                <ArticleCard key={post.slug} post={post} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Empty state */}
          {filteredPosts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontSize: 16, color: "#9CA3AF" }}>
                No articles in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. NEWSLETTER SIGNUP */}
      <NewsletterSection />

      {/* 6. TOPICS CLOUD */}
      <TopicsSection />

      {/* 7. FINAL CTA */}
      <FinalCTA />
    </main>
  );
}
