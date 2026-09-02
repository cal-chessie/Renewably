"use client";

import { useState, useMemo } from "react";
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

/* The featured post sits above the grid, so both the browse counts and the
   grid exclude it. That keeps every chip count equal to what the list shows. */
const featuredSlug = posts[0].slug;
const browsablePosts = posts.filter((p) => p.slug !== featuredSlug);

const categoryCounts: Record<string, number> = browsablePosts.reduce(
  (acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

/* Real topics, real counts: one chip per category actually present. */
const topics = Array.from(new Set(browsablePosts.map((p) => p.category))).map(
  (label) => ({ label, count: categoryCounts[label] })
);

/* "All" clears the filter; the rest are the real categories. */
const topicChips = [
  { label: "All", count: browsablePosts.length },
  ...topics,
];

const categoryColors: Record<string, string> = {
  Operations: "#3B82F6",
  Grants: "#10B981",
  "Customer Support": "#F59E0B",
  "ESB Applications": "#8B5CF6",
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
function HeroSection({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) {
  return (
    <section
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
          sizes="100vw"
          className="blog-hero-bg"
          style={{ objectFit: "cover" }}
          priority
        />
        <style>{`
          .blog-hero-bg { object-position: 65% center !important; }
          @media (min-width: 768px) { .blog-hero-bg { object-position: center !important; } }
        `}</style>
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
      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: 896,
          width: "100%",
          padding: "0 16px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div style={{ paddingTop: 'clamp(100px, 14vh, 120px)', paddingBottom: 'clamp(40px, 8vh, 64px)' }}>
          {/* Badge */}
          <div
            className="hp-rise"
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
              animationDelay: "0.3s",
            }}
          >
            <span
              className="hp-pulse"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: YELLOW,
                boxShadow: "0 0 8px rgba(243,216,64,0.6)",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.85)" }}>Insights</span>
          </div>

          {/* Headline */}
          <h1
            className="hp-rise"
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              marginBottom: 24,
              animationDelay: "0.5s",
            }}
          >
            Solar is changing.
            <br />
            <span style={{ color: YELLOW }}>Stay ahead.</span>
          </h1>

          {/* Sub */}
          <p
            className="hp-rise"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "clamp(17px, 2vw, 21px)",
              lineHeight: 1.6,
              maxWidth: 640,
              margin: "0 auto 40px",
              animationDelay: "0.8s",
            }}
          >
            Practical guides on AI operations, SEAI grants, ESB Networks,
            logistics, and customer support. Written for solar companies doing
            20+ jobs a month in Ireland.
          </p>

          {/* Search bar */}
          <div
            className="hp-rise"
            style={{ maxWidth: 520, margin: "0 auto", animationDelay: "1s" }}
          >
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </div>

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
function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search articles, topics, guides..."
        aria-label="Search articles"
        className="blog-search-input"
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "#fff",
          fontSize: 15,
          fontWeight: 400,
        }}
      />
      <style>{`
        .blog-search-input::placeholder { color: rgba(255,255,255,0.5); }
      `}</style>
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
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: isActive
                    ? catColor || YELLOW
                    : "transparent",
                  color: isActive ? "#1A1A1A" : "#6B7280",
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
              </button>
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
        <div
          className="hp-lift-sm"
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
              padding: "28px 20px",
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
                <span
                  className="hp-pulse"
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
                    color: "rgba(255,255,255,0.62)",
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
                    color: "rgba(255,255,255,0.62)",
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
                    color: "rgba(255,255,255,0.62)",
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
                  fontSize: "clamp(14px, 2.5vw, 16px)",
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
                    color: "rgba(255,255,255,0.62)",
                  }}
                >
                  {new Date(post.date).toLocaleDateString("en-IE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <span
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
                </span>
              </div>
            </div>
          </div>

          {/* Ambient glow */}
          <div
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
        </div>
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
  const catColor = categoryColors[post.category] || "#6B7280";

  return (
    <ScrollReveal delay={index * 0.05}>
      <Link href={`/blog/${post.slug}`} className="group block">
        <div
          className="hp-lift-sm"
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
                color: "#6B7280",
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
              style={{ fontSize: 13, color: "#6B7280" }}
              dateTime={post.date}
            >
              {new Date(post.date).toLocaleDateString("en-IE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </time>
            <div
              style={{
                transform: isHovered ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.2s ease",
              }}
            >
              <ArrowIcon color={isHovered ? catColor : "#6B7280"} />
            </div>
          </div>
        </div>
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
        paddingTop: 'clamp(48px, 10vw, 96px)',
        paddingBottom: 'clamp(48px, 10vw, 96px)',
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
              fontSize: 'clamp(15px, 2vw, 17px)',
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 480,
              margin: "0 auto 36px",
            }}
          >
            One email per week. No spam. No fluff. Practical insights on AI
            operations, SEAI grant changes, ESB Networks updates, and what&apos;s
            actually working for Irish solar installers right now.
          </p>
        </ScrollReveal>

        {/* No automated list yet, so route to a real conversation
            instead of faking a subscription. */}
        <ScrollReveal delay={0.3}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              maxWidth: 480,
              margin: "0 auto 24px",
            }}
          >
            <p
              style={{
                fontSize: "clamp(15px, 2vw, 17px)",
                color: "rgba(255,255,255,0.7)",
                margin: 0,
              }}
            >
              Want these in your inbox? Talk to us.
            </p>
            <Link
              href="/contact"
              className="hp-lift-sm"
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                backgroundColor: YELLOW,
                color: "#1A1A1A",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              Talk to us <ArrowIcon />
            </Link>
          </div>
        </ScrollReveal>

        {/* Ambient glow */}
        <div
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
function TopicsSection({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}) {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  const handleTopicClick = (label: string) => {
    setActiveCategory(label);
    if (typeof document !== "undefined") {
      document
        .getElementById("blog-articles")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      style={{
        backgroundColor: "#fff",
        paddingTop: 'clamp(48px, 10vw, 96px)',
        paddingBottom: 'clamp(48px, 10vw, 96px)',
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
            gap: "clamp(6px, 1.2vw, 12px)",
          }}
        >
          {topicChips.map((topic, i) => {
            const isActive = activeCategory === topic.label;
            const isHot = hoveredTopic === topic.label || isActive;
            return (
              <ScrollReveal key={topic.label} delay={i * 0.04}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleTopicClick(topic.label)}
                  onMouseEnter={() => setHoveredTopic(topic.label)}
                  onMouseLeave={() => setHoveredTopic(null)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "clamp(4px, 0.8vw, 10px)",
                    padding: "clamp(7px, 1.2vw, 12px) clamp(10px, 2vw, 22px)",
                    borderRadius: "clamp(8px, 1.5vw, 14px)",
                    backgroundColor: isHot ? DARK : "#F9FAFB",
                    border: isHot
                      ? "1.5px solid rgba(243,216,64,0.4)"
                      : "1.5px solid rgba(26,26,26,0.06)",
                    color: isHot ? YELLOW : "#374151",
                    fontSize: "clamp(11px, 1.4vw, 14px)",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    boxShadow: isHot
                      ? "0 8px 24px rgba(243,216,64,0.12)"
                      : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {topic.label}
                  <span
                    style={{
                      fontSize: "clamp(9px, 1.2vw, 11px)",
                      fontWeight: 700,
                      padding: "clamp(1px, 0.3vw, 2px) clamp(4px, 0.8vw, 8px)",
                      borderRadius: 9999,
                      backgroundColor: isHot
                        ? "rgba(243,216,64,0.15)"
                        : "rgba(0,0,0,0.05)",
                      color: isHot ? YELLOW : "#6B7280",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {topic.count}
                  </span>
                </button>
              </ScrollReveal>
            );
          })}
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
        paddingTop: 'clamp(48px, 8vw, 64px)',
        paddingBottom: 'clamp(48px, 8vw, 64px)',
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
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: "#374151",
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 480,
              margin: "0 auto 36px",
            }}
          >
            The ones who act on it are the ones winning. Stop reading. Start
            deploying. Every article on this page is built for real
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
            <a
              href="/contact"
              className="blog-final-cta hp-lift-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "16px 36px",
                fontSize: 'clamp(14px, 1.8vw, 16px)',
                fontWeight: 700,
                borderRadius: 9999,
                backgroundColor: "#1A1A1A",
                color: YELLOW,
                textDecoration: "none",
                boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              }}
            >
              Get Started <ArrowIcon color={YELLOW} />
            </a>
            <a
              href="/workforce"
              className="blog-final-cta hp-lift-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "16px 36px",
                fontSize: 'clamp(14px, 1.8vw, 16px)',
                fontWeight: 700,
                borderRadius: 9999,
                backgroundColor: "transparent",
                color: "#1A1A1A",
                textDecoration: "none",
                border: "2px solid #1A1A1A",
              }}
            >
              Meet the AI Team <ArrowIcon />
            </a>
          </div>
          <style>{`
            @media (max-width: 767px) {
              .blog-final-cta {
                width: 100% !important;
                box-sizing: border-box;
              }
            }
          `}</style>
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
  const [searchQuery, setSearchQuery] = useState("");

  const featuredPost = posts[0];
  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      if (p.slug === featuredPost.slug) return false;
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (q) {
        const haystack = `${p.title} ${p.excerpt} ${p.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery, featuredPost.slug]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div>
      {/* 1. HERO */}
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* 2. FEATURED POST */}
      <section
        style={{
          backgroundColor: "#F9FAFB",
          paddingTop: 'clamp(48px, 8vw, 64px)',
          paddingBottom: 0,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedCard post={featuredPost} />
        </div>
      </section>

      {/* 3. CATEGORY FILTERS (sticky) */}
      <div
        id="blog-articles"
        style={{ backgroundColor: "#F9FAFB", scrollMarginTop: 64 }}
      >
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
          paddingBottom: 'clamp(48px, 10vw, 96px)',
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
                {isSearching
                  ? "Search results"
                  : activeCategory === "All"
                  ? "All articles"
                  : activeCategory}
              </h2>
              <span
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  fontWeight: 500,
                }}
              >
                {filteredPosts.length} article
                {filteredPosts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </ScrollReveal>

          {/* Posts grid - re-animates on category change via key + hp-rise */}
          <div
            key={activeCategory}
            className="hp-rise"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {filteredPosts.map((post, i) => (
              <ArticleCard key={post.slug} post={post} index={i} />
            ))}
          </div>

          {/* Empty state */}
          {filteredPosts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontSize: 16, color: "#6B7280" }}>
                {isSearching
                  ? "No articles match your search."
                  : "No articles in this category yet."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. NEWSLETTER SIGNUP */}
      <NewsletterSection />

      {/* 6. TOPICS CLOUD */}
      <TopicsSection
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* 7. FINAL CTA */}
      <FinalCTA />
    </div>
  );
}
