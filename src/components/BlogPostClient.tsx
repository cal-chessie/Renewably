"use client";

import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { useParams } from "next/navigation";
import { posts, getPostBySlug } from "@/lib/blog-data";
import { useMemo } from "react";

/* ============================================================
   Markdown-lite renderer
   ============================================================ */
function renderInline(text: string) {
  // Convert **bold** to <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[#1A1A1A]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function RenderedBlock({ text }: { text: string }) {
  if (text.startsWith("## ")) {
    return (
      <ScrollReveal>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] mt-12 mb-5 leading-tight">
          {text.replace("## ", "")}
        </h2>
      </ScrollReveal>
    );
  }

  if (text.startsWith("---")) {
    return <hr className="border-none border-t border-[#F3D840]/30 my-10" />;
  }

  // Pull quote: line starting with "** and ending with **"
  const pullQuoteMatch = text.match(/^\*\*(.+)\*\*$/);
  if (pullQuoteMatch) {
    return (
      <ScrollReveal>
        <blockquote className="border-l-4 border-[#F3D840] pl-6 py-2 my-8">
          <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-relaxed italic">
            {pullQuoteMatch[1]}
          </p>
        </blockquote>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal>
      <p className="text-[#4A4A4A] text-base sm:text-lg leading-relaxed mb-6">
        {renderInline(text)}
      </p>
    </ScrollReveal>
  );
}

/* ============================================================
   Next Article navigation
   ============================================================ */
function NextArticleCard({ nextSlug }: { nextSlug: string }) {
  const next = getPostBySlug(nextSlug);
  if (!next) return null;

  return (
    <section className="bg-[#0A0A0A]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <ScrollReveal>
          <p className="text-[#F3D840] text-xs font-bold uppercase tracking-widest mb-4">
            Next article
          </p>
          <Link
            href={`/blog/${next.slug}`}
            className="group block"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#F3D840] transition-colors duration-300 mb-2">
              {next.title}
            </h3>
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <span>{next.category}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{next.readTime}</span>
            </div>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   Main Component
   ============================================================ */
export default function BlogPostClient() {
  const params = useParams();
  const slug = params.slug as string;
  const post = getPostBySlug(slug);

  const blocks = useMemo(() => {
    if (!post) return [];
    return post.content.split("\n\n").filter(Boolean);
  }, [post]);

  if (!post) {
    return (
      <main className="pt-20">
          <section className="py-32 text-center bg-white">
            <h1 className="text-4xl font-extrabold text-[#1A1A1A] mb-4">
              Post Not Found
            </h1>
            <Link
              href="/blog"
              className="text-[#374151] hover:text-[#F3D840] transition-colors font-semibold"
            >
              &larr; Back to Blog
            </Link>
          </section>
      </main>
    );
  }

  // Related posts: pick 3 from same or similar category, excluding current
  const related = posts
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  return (
    <main className="pt-20">
        {/* ── Article Header (dark) ── */}
        <article>
          <section data-theme="dark" className="bg-[#0A0A0A] py-20 md:py-28">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-white/60 hover:text-[#F3D840] text-sm font-medium mb-8 transition-colors"
                >
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
                      d="M7 16l-4-4m0 0l4-4m-4 4h18"
                    />
                  </svg>
                  Back to Blog
                </Link>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-block px-3 py-1 text-xs font-bold bg-[#F3D840] text-[#1A1A1A] rounded-full">
                    {post.category}
                  </span>
                  <span className="text-white/40 text-sm">{post.readTime}</span>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.15}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
                  {post.title}
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-2xl">
                  {post.excerpt}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.25}>
                <time
                  className="block mt-6 text-white/30 text-sm"
                  dateTime={post.date}
                >
                  {new Date(post.date).toLocaleDateString("en-IE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </ScrollReveal>
            </div>
          </section>

          {/* ── Article Content ── */}
          <section className="bg-white py-16 md:py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              {blocks.map((block, i) => (
                <RenderedBlock key={i} text={block} />
              ))}
            </div>
          </section>
        </article>

        {/* ── CTA ── */}
        <section className="bg-[#F3D840] py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mb-4">
                Ready to see this in action?
              </h2>
              <p className="text-[#374151] text-base sm:text-lg mb-8 max-w-xl mx-auto">
                Every agent on this page is deployed in real solar companies
                across Ireland. Book a call and we&apos;ll show you how.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] hover:bg-[#374151] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
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

        {/* ── Related Articles ── */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-8">
                More from the blog
              </h2>
            </ScrollReveal>
            <div className="space-y-4">
              {related.map((r, i) => (
                <ScrollReveal key={r.slug} delay={i * 0.08}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="group block p-5 rounded-xl border border-gray-100 hover:border-[#F3D840] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F3D840]/15 text-[#374151] rounded-full">
                        {r.category}
                      </span>
                      <span className="text-gray-400 text-xs">{r.readTime}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] group-hover:text-[#374151] transition-colors">
                      {r.title}
                    </h3>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Next Article ── */}
        {post.nextSlug && <NextArticleCard nextSlug={post.nextSlug} />}
      </main>
  );
}
