"use client";

import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";
import { posts } from "@/lib/blog-data";

export default function BlogPageClient() {
  return (
    <main>
        {/* ── Hero (dark, full-screen robot bg) ── */}
        <section data-theme="dark" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {/* Robot hero background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <Image
              src="/robot-3.jpg"
              alt=""
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          {/* Dark overlay */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.3) 100%)' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 896, width: '100%', padding: '0 16px', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 9999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', marginBottom: 32, padding: '6px 16px', fontSize: 13, fontWeight: 600, letterSpacing: '0.03em' }}
            >
              <motion.span
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#F3D840', boxShadow: '0 0 8px rgba(243,216,64,0.6)' }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                Blog
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 24 }}
            >
              How Solar Installers
              <br />
              <span style={{ color: '#F3D840' }}>Stop Losing Leads</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}
            >
              Practical guides on AI operations, grants, permitting, logistics,
              and customer support. Written for solar companies doing twenty
              plus jobs a month.
            </motion.p>
          </div>

          {/* White fade at bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, #fff, transparent)', zIndex: 3, pointerEvents: 'none' }} />
        </section>

        {/* ── Blog Posts ── */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {posts.map((post, i) => (
                <ScrollReveal key={post.slug} delay={i * 0.06}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <article className="p-6 sm:p-8 rounded-2xl border border-gray-100 hover:border-[#F3D840] hover:shadow-xl transition-all duration-300 bg-white">
                      {/* Meta */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 text-xs font-bold bg-[#F3D840] text-[#1A1A1A] rounded-full">
                          {post.category}
                        </span>
                        <span className="text-sm text-gray-400">
                          {post.readTime}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1A1A] mb-3 group-hover:text-[#374151] transition-colors leading-tight">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-[#535353] leading-relaxed mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Date */}
                      <time
                        className="text-sm text-gray-400"
                        dateTime={post.date}
                      >
                        {new Date(post.date).toLocaleDateString("en-IE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </article>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#F3D840] py-16 md:py-20" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mb-4" style={{ marginBottom: 24 }}>
                Want the agents behind these articles?
              </h2>
              <p className="text-[#374151] text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ marginBottom: 40 }}>
                Everything we write about is deployed in real solar companies
                across Ireland. Let&apos;s show you how it works.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#374151] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', backgroundColor: '#1A1A1A', color: '#fff', borderRadius: 9999 }}
              >
                Let&apos;s Talk
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
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>
  );
}
