"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import MagneticButton from "@/components/MagneticButton";
import Link from "next/link";
import { useParams } from "next/navigation";
import { posts, getPostBySlug } from "@/lib/blog-data";

/* ============================================================
   CONSTANTS
   ============================================================ */
const DARK = "#0A0A0A";
const YELLOW = "#F3D840";

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
function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ArrowRightIcon({ color = "#F3D840" }: { color?: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ClockIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="14" height="14" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

/* ============================================================
   TABLE OF CONTENTS
   ============================================================ */
function TableOfContents({ blocks }: { blocks: string[] }) {
  const headings = blocks
    .filter((b) => b.startsWith("## "))
    .map((b) => b.replace("## ", "").trim());

  const [copied, setCopied] = useState(false);

  if (headings.length === 0) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollReveal>
      <div style={{
        padding: 'clamp(16px, 3vw, 24px)', borderRadius: 16, backgroundColor: "#F9FAFB",
        border: "1px solid rgba(26,26,26,0.06)", marginBottom: 48,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Contents
          </h4>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              backgroundColor: copied ? "#10B981" : "#fff", color: copied ? "#fff" : "#535353",
              border: "1px solid rgba(26,26,26,0.08)", cursor: "pointer",
            }}
          >
            <LinkIcon /> {copied ? "Copied!" : "Copy link"}
          </motion.button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {headings.map((h, i) => (
            <a
              key={i}
              href={`#section-${i}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={{
                fontSize: 14, color: "#535353", lineHeight: 1.6,
                paddingLeft: 12, borderLeft: "2px solid rgba(26,26,26,0.08)",
                textDecoration: "none", transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = YELLOW;
                e.currentTarget.style.borderLeftColor = YELLOW;
                e.currentTarget.style.paddingLeft = 16;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#535353";
                e.currentTarget.style.borderLeftColor = "rgba(26,26,26,0.08)";
                e.currentTarget.style.paddingLeft = 12;
              }}
            >
              {h}
            </a>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ============================================================
   MARKDOWN RENDERERS
   ============================================================ */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700, color: "#1A1A1A" }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function RenderedBlock({ text, index }: { text: string; index: number }) {
  // Heading
  if (text.startsWith("## ")) {
    const headingIndex = index;
    return (
      <ScrollReveal key={index}>
        <h2
          id={`section-${headingIndex}`}
          style={{
            fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, color: "#1A1A1A",
            lineHeight: 1.2, marginTop: 'clamp(32px, 6vw, 48px)', marginBottom: 'clamp(16px, 3vw, 20px)', paddingTop: 'clamp(12px, 2vw, 20px)',
            scrollMarginTop: 100,
          }}
        >
          {text.replace("## ", "")}
        </h2>
      </ScrollReveal>
    );
  }

  // Separator
  if (text.startsWith("---")) {
    return (
      <div key={index} style={{ margin: "32px 0", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, height: 1, backgroundColor: "rgba(243,216,64,0.2)" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: YELLOW }} />
        <div style={{ flex: 1, height: 1, backgroundColor: "rgba(243,216,64,0.2)" }} />
      </div>
    );
  }

  // Pull quote (full line bold)
  const pullQuoteMatch = text.match(/^\*\*(.+)\*\*$/);
  if (pullQuoteMatch) {
    return (
      <ScrollReveal key={index}>
        <blockquote style={{
          borderLeft: "4px solid", borderLeftColor: YELLOW,
          paddingLeft: 24, paddingTop: 8, paddingBottom: 8, margin: "32px 0",
        }}>
          <p style={{
            fontSize: "clamp(18px, 2.5vw, 22px)", fontWeight: 700, color: "#1A1A1A",
            lineHeight: 1.5, fontStyle: "italic",
          }}>
            {pullQuoteMatch[1]}
          </p>
        </blockquote>
      </ScrollReveal>
    );
  }

  // Regular paragraph
  return (
    <p key={index} style={{
      fontSize: 16, lineHeight: 1.8, color: "#4A4A4A", marginBottom: 20,
    }}>
      {renderInline(text)}
    </p>
  );
}

/* ============================================================
   RELATED POST CARD
   ============================================================ */
function RelatedCard({ post }: { post: typeof posts[0] }) {
  const [isHovered, setIsHovered] = useState(false);
  const catColor = categoryColors[post.category] || "#9CA3AF";

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <motion.div
        whileHover={{ y: -2 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: 24, borderRadius: 16, backgroundColor: "#F9FAFB",
          border: `1px solid ${isHovered ? `${catColor}25` : "rgba(26,26,26,0.06)"}`,
          transition: "all 0.2s ease", cursor: "pointer",
        }}
      >
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 9999,
          backgroundColor: `${catColor}15`, color: catColor, marginBottom: 12, display: "inline-block",
        }}>
          {post.category}
        </span>
        <h4 style={{
          fontSize: 16, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.35, marginBottom: 8,
        }}>
          {post.title}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
            <ClockIcon /> {post.readTime}
          </span>
          <motion.div animate={{ x: isHovered ? 3 : 0 }} transition={{ duration: 0.2 }}>
            <ArrowRightIcon color="#9CA3AF" />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function BlogPostClient() {
  const params = useParams();
  const slug = params.slug as string;
  const post = getPostBySlug(slug);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setShareUrl(window.location.href);
  }, []);

  const blocks = useMemo(() => {
    if (!post) return [];
    return post.content.split("\n\n").filter(Boolean);
  }, [post]);

  if (!post) {
    return (
      <main>
        <section style={{ padding: "128px 20px", textAlign: "center", backgroundColor: "#fff" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1A1A1A", marginBottom: 16 }}>Post Not Found</h1>
          <p style={{ fontSize: 16, color: "#9CA3AF", marginBottom: 24 }}>The article you are looking for does not exist.</p>
          <MagneticButton href="/blog">
            <ArrowLeftIcon /> Back to Blog
          </MagneticButton>
        </section>
      </main>
    );
  }

  const related = posts.filter((p) => p.slug !== slug && p.category === post.category).slice(0, 3);
  const catColor = categoryColors[post.category] || YELLOW;
  const nextPost = post.nextSlug ? getPostBySlug(post.nextSlug) : null;

  return (
    <main>
      {/* ===== ARTICLE HEADER ===== */}
      <article>
        <section style={{ position: "relative", overflow: "hidden", backgroundColor: DARK }}>
          {/* Dot grid */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.03,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

          {/* Glow */}
          <motion.div
            animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute", top: "-30%", right: "5%", width: 400, height: 400,
              borderRadius: "50%", background: `radial-gradient(circle, ${catColor}15 0%, transparent 70%)`,
              filter: "blur(60px)", pointerEvents: "none",
            }}
          />

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[1]" style={{ paddingTop: 'clamp(100px, 14vh, 120px)', paddingBottom: 'clamp(40px, 8vh, 64px)' }}>
            {/* Back link */}
            <ScrollReveal>
              <Link
                href="/blog"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 500,
                  textDecoration: "none", marginBottom: 32,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = YELLOW; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
              >
                <ArrowLeftIcon /> All articles
              </Link>
            </ScrollReveal>

            {/* Meta */}
            <ScrollReveal delay={0.1}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 9999,
                  backgroundColor: catColor, color: "#fff",
                }}>
                  {post.category}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  <ClockIcon color="rgba(255,255,255,0.4)" /> {post.readTime}
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                  {new Date(post.date).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </ScrollReveal>

            {/* Title */}
            <ScrollReveal delay={0.2}>
              <h1 style={{
                fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#fff",
                lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 20,
              }}>
                {post.title}
              </h1>
            </ScrollReveal>

            {/* Excerpt */}
            <ScrollReveal delay={0.3}>
              <p style={{
                fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.45)",
                maxWidth: 600, marginBottom: 32,
              }}>
                {post.excerpt}
              </p>
            </ScrollReveal>

            {/* Author + Share */}
            <ScrollReveal delay={0.4}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", backgroundColor: YELLOW,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "#1A1A1A",
                  }}>
                    R
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Renewably Team</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>AI Operations, Ireland</p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: post.title, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href).catch(() => {});
                    }
                  }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 18px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                    backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                  }}
                >
                  <ShareIcon /> Share
                </motion.button>
              </div>
            </ScrollReveal>
          </div>

          {/* Bottom fade */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, #fff, transparent)", zIndex: 2, pointerEvents: "none" }} />
        </section>

        {/* ===== ARTICLE CONTENT ===== */}
        <section style={{ backgroundColor: "#fff", paddingTop: 'clamp(40px, 8vw, 64px)', paddingBottom: 'clamp(40px, 8vw, 64px)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Table of Contents */}
            <TableOfContents blocks={blocks} />

            {/* Content blocks */}
            {blocks.map((block, i) => {
              const el = RenderedBlock({ text: block, index: i });
              // Assign heading IDs for TOC navigation
              if (block.startsWith("## ")) {
                return <div key={i}>{el}</div>;
              }
              return <div key={i}>{el}</div>;
            })}

            {/* Inline share bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "24px 0",
              borderTop: "1px solid rgba(26,26,26,0.06)", marginTop: 40,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>Share this article</span>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "LinkedIn", href: shareUrl ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` : undefined },
                  { label: "Twitter", href: shareUrl ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}` : undefined },
                ].map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      backgroundColor: "#F9FAFB", color: "#535353", border: "1px solid rgba(26,26,26,0.06)",
                      textDecoration: "none", transition: "all 0.2s",
                    }}
                  >
                    {s.label}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </article>

      {/* ===== CTA ===== */}
      <section style={{ backgroundColor: YELLOW, paddingTop: 'clamp(48px, 8vw, 72px)', paddingBottom: 'clamp(48px, 8vw, 72px)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" style={{ textAlign: "center" }}>
          <ScrollReveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.1, marginBottom: 16 }}>
              Ready to see this in action?
            </h2>
            <p style={{ fontSize: 16, color: "#374151", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Every agent on this page is deployed in real solar companies across Ireland. Book a call and we will show you how.
            </p>
            <MagneticButton href="/contact">
              Book a Free Call <ArrowRightIcon />
            </MagneticButton>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== RELATED ARTICLES ===== */}
      {related.length > 0 && (
        <section style={{ backgroundColor: "#fff", paddingTop: 'clamp(40px, 8vw, 64px)', paddingBottom: 'clamp(40px, 8vw, 64px)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", marginBottom: 24 }}>
                More on {post.category}
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <RelatedCard key={r.slug} post={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== NEXT ARTICLE ===== */}
      {nextPost && (
        <section style={{ backgroundColor: DARK }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 'clamp(40px, 8vw, 64px)', paddingBottom: 'clamp(40px, 8vw, 64px)' }}>
            <ScrollReveal>
              <p style={{ fontSize: 12, fontWeight: 700, color: YELLOW, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                Up next
              </p>
              <Link href={`/blog/${nextPost.slug}`} className="group block">
                <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                  <h3 style={{
                    fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, color: "#fff",
                    lineHeight: 1.3, marginBottom: 8, transition: "color 0.2s",
                  }}>
                    {nextPost.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 9999,
                      backgroundColor: categoryColors[nextPost.category] || "rgba(255,255,255,0.1)",
                      color: "#fff",
                    }}>
                      {nextPost.category}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
                      <ClockIcon color="rgba(255,255,255,0.4)" /> {nextPost.readTime}
                    </span>
                  </div>
                </motion.div>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ===== BACK TO BLOG ===== */}
      <section style={{ backgroundColor: "#F9FAFB", paddingTop: 'clamp(32px, 6vw, 48px)', paddingBottom: 'clamp(32px, 6vw, 48px)' }}>
        <div style={{ textAlign: "center" }}>
          <MagneticButton href="/blog">
            <ArrowLeftIcon /> All Articles
          </MagneticButton>
        </div>
      </section>
    </main>
  );
}
