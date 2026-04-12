"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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

const allCategories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];

/* ============================================================
   ARROW ICON
   ============================================================ */
function ArrowIcon({ color = "#1A1A1A" }: { color?: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ============================================================
   CATEGORY BADGE COLORS
   ============================================================ */
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
   FEATURED POST CARD (for the first / latest post)
   ============================================================ */
function FeaturedCard({ post }: { post: typeof posts[0] }) {
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
          <div style={{ padding: "40px 36px", position: "relative", zIndex: 2 }}>
            {/* Dot grid bg */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.04,
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Badge row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: YELLOW, boxShadow: "0 0 12px rgba(243,216,64,0.6)" }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: YELLOW, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Featured
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>|</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 9999,
                  backgroundColor: categoryColors[post.category] || "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}>
                  {post.category}
                </span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "#fff",
                lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16, maxWidth: 600,
              }}>
                {post.title}
              </h2>

              {/* Excerpt */}
              <p style={{
                fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.5)",
                marginBottom: 24, maxWidth: 540, display: "-webkit-box",
                WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {post.excerpt}
              </p>

              {/* Meta + CTA */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                    <ClockIcon />
                    {post.readTime}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                    {new Date(post.date).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                <motion.span
                  className="group-hover:inline-flex"
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 24px", borderRadius: 9999,
                    backgroundColor: YELLOW, color: "#1A1A1A",
                    fontWeight: 700, fontSize: 14, textDecoration: "none",
                  }}
                >
                  Read Article <ArrowIcon />
                </motion.span>
              </div>
            </div>
          </div>

          {/* Glow */}
          <motion.div
            animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute", top: "-20%", right: "-10%", width: 350, height: 350,
              borderRadius: "50%", background: "radial-gradient(circle, rgba(243,216,64,0.08) 0%, transparent 70%)",
              filter: "blur(60px)", pointerEvents: "none",
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
function ArticleCard({ post, index }: { post: typeof posts[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const catColor = categoryColors[post.category] || "#9CA3AF";

  return (
    <ScrollReveal delay={index * 0.05}>
      <Link href={`/blog/${post.slug}`} className="group block">
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.25 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            padding: 28,
            borderRadius: 20,
            border: "1px solid",
            borderColor: isHovered ? `${catColor}30` : "rgba(26,26,26,0.06)",
            backgroundColor: isHovered ? "#FAFAFA" : "#fff",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
        >
          {/* Category + Read time */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 9999,
              backgroundColor: isHovered ? catColor : `${catColor}15`,
              color: isHovered ? "#fff" : catColor,
              transition: "all 0.3s ease",
            }}>
              {post.category}
            </span>
            <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
              <ClockIcon /> {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: 18, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.35,
            marginBottom: 10, transition: "color 0.2s",
          }}>
            {post.title}
          </h3>

          {/* Excerpt */}
          <p style={{
            fontSize: 14, lineHeight: 1.7, color: "#535353", marginBottom: 20,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {post.excerpt}
          </p>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <time style={{ fontSize: 13, color: "#9CA3AF" }} dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
            </time>
            <motion.div animate={{ x: isHovered ? 4 : 0 }} transition={{ duration: 0.2 }}>
              <ArrowIcon color={isHovered ? catColor : "#9CA3AF"} />
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </ScrollReveal>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function BlogPageClient() {
  const [activeCategory, setActiveCategory] = useState("All");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const filteredPosts = activeCategory === "All"
    ? posts.slice(1) // Skip first (featured)
    : posts.filter((p) => p.category === activeCategory);

  return (
    <main>
      {/* ===== HERO ===== */}
      <section ref={heroRef} style={{ position: "relative", overflow: "hidden", backgroundColor: DARK }}>
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Animated glow orbs */}
        <motion.div
          animate={{ x: [0, 50, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.15, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", top: "10%", right: "10%", width: 500, height: 500,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(243,216,64,0.08) 0%, transparent 70%)",
            filter: "blur(80px)", pointerEvents: "none",
          }}
        />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ paddingTop: 140, paddingBottom: 80 }}>
            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                display: "flex", gap: 32, marginBottom: 48, flexWrap: "wrap",
              }}
            >
              {[
                { value: `${posts.length}`, label: "Articles" },
                { value: `${allCategories.length - 1}`, label: "Topics" },
                { value: "Solar", label: "Focused" },
              ].map((stat) => (
                <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 3, height: 28, borderRadius: 2, backgroundColor: YELLOW }} />
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{stat.value}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, color: "#fff", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 20, maxWidth: 700 }}
            >
              How solar installers{" "}
              <span style={{ color: YELLOW }}>stop losing leads</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.5)", maxWidth: 540, marginBottom: 0 }}
            >
              Practical guides on AI operations, SEAI grants, ESB permitting, logistics, and customer support. Written for solar companies doing 20+ jobs a month in Ireland.
            </motion.p>
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #F9FAFB, transparent)", zIndex: 2, pointerEvents: "none" }} />
      </section>

      {/* ===== FEATURED POST ===== */}
      <section style={{ backgroundColor: "#F9FAFB", paddingTop: 64, paddingBottom: 0 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedCard post={posts[0]} />
        </div>
      </section>

      {/* ===== CATEGORY FILTERS + POSTS ===== */}
      <section style={{ backgroundColor: "#F9FAFB", paddingTop: 48, paddingBottom: 96 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category filters */}
          <ScrollReveal>
            <div style={{
              display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap",
              paddingBottom: 24, borderBottom: "1px solid rgba(26,26,26,0.06)",
            }}>
              {allCategories.map((cat) => {
                const isActive = activeCategory === cat;
                const catColor = categoryColors[cat];
                return (
                  <motion.button
                    key={cat}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: "8px 20px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                      backgroundColor: isActive ? (catColor || YELLOW) : "transparent",
                      color: isActive ? "#1A1A1A" : "#9CA3AF",
                      border: `1px solid ${isActive ? (catColor || YELLOW) : "rgba(26,26,26,0.08)"}`,
                      cursor: "pointer", transition: "all 0.2s ease",
                    }}
                  >
                    {cat}
                  </motion.button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Section title */}
          <ScrollReveal>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
              <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: "#1A1A1A" }}>
                {activeCategory === "All" ? "All articles" : activeCategory}
              </h2>
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>
                {filteredPosts.length} article{filteredPosts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </ScrollReveal>

          {/* Post grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {filteredPosts.map((post, i) => (
                <ArticleCard key={post.slug} post={post} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Empty state */}
          {filteredPosts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontSize: 16, color: "#9CA3AF" }}>No articles in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== NEWSLETTER / CTA ===== */}
      <section style={{ backgroundColor: "#fff", paddingTop: 96, paddingBottom: 96 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div style={{
              padding: 48, borderRadius: 24, backgroundColor: "#F9FAFB",
              border: "1px solid rgba(26,26,26,0.06)", textAlign: "center",
            }}>
              <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#1A1A1A", marginBottom: 12, lineHeight: 1.15 }}>
                Not reading, but ready to act?
              </h2>
              <p style={{ fontSize: 16, color: "#535353", lineHeight: 1.7, marginBottom: 32, maxWidth: 440, margin: "0 auto 32px" }}>
                Everything we write about is deployed in real solar companies across Ireland. Book a free strategy call and we will show you the real thing.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                <MagneticButton href="/contact">
                  Book a Free Call <ArrowIcon />
                </MagneticButton>
                <MagneticButton href="/workforce">
                  Meet the AI Team <ArrowIcon />
                </MagneticButton>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== FINAL YELLOW CTA ===== */}
      <section style={{ backgroundColor: YELLOW, paddingTop: 72, paddingBottom: 72 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" style={{ textAlign: "center" }}>
          <ScrollReveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.1, marginBottom: 16 }}>
              Your competitors are reading this.
            </h2>
            <p style={{ fontSize: 17, color: "#374151", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
              The ones who act on it are the ones winning. Stop reading. Start deploying.
            </p>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "16px 36px", fontSize: 16, fontWeight: 700, borderRadius: 9999,
                backgroundColor: "#1A1A1A", color: YELLOW, textDecoration: "none",
                boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              }}
            >
              Get Started <ArrowIcon color={YELLOW} />
            </motion.a>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
