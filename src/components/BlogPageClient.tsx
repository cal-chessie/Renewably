"use client";

import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { posts } from "@/lib/blog-data";

export default function BlogPageClient() {
  return (
    <main>
        {/* ── Hero (dark) ── */}
        <section data-theme="dark" className="relative overflow-hidden bg-[#0A0A0A] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Text side */}
              <div className="flex-1 text-center lg:text-left">
                <ScrollReveal>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-8">
                    <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
                    <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
                      Blog
                    </span>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                    How Solar Installers
                    <br />
                    <span className="text-[#F3D840]">Stop Losing Leads</span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                  <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    Practical guides on AI operations, grants, permitting, logistics,
                    and customer support. Written for solar companies doing twenty
                    plus jobs a month.
                  </p>
                </ScrollReveal>
              </div>

              {/* Robot image side */}
              <ScrollReveal delay={0.15} className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute -inset-4 bg-[#F3D840]/10 rounded-3xl blur-2xl" />
                  <img
                    src="/robot-2.jpg"
                    alt="AI-powered blog for solar installers"
                    className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 object-cover rounded-3xl shadow-2xl"
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Subtle gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
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
