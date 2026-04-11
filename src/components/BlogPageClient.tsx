"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";

const blogPosts = [
  {
    slug: "ai-sales-agents-2026-guide",
    title: "The Complete Guide to AI Sales Agents in 2026: From Prospect to Close",
    excerpt: "AI sales agents are transforming how businesses find, qualify, and close deals. This comprehensive guide covers everything from implementation strategy to measuring ROI — including real-world case studies from companies that have automated 80% of their top-of-funnel activities.",
    date: "2026-04-01",
    category: "Sales AI",
    readTime: "10 min read",
  },
  {
    slug: "marketing-automation-stack-2026",
    title: "Building the Ultimate Marketing Automation Stack in 2026: Tools, Strategies & AI Integration",
    excerpt: "The marketing automation landscape has exploded. Learn how to build a cohesive tech stack that actually works together — from AI-powered content generation and multi-channel campaign orchestration to predictive analytics and automated lead scoring.",
    date: "2026-03-15",
    category: "Automation",
    readTime: "14 min read",
  },
  {
    slug: "ai-crm-integration-guide",
    title: "AI + CRM Integration: How to Turn Your Customer Data into a Revenue Machine",
    excerpt: "Most businesses use less than 30% of their CRM data. Learn how AI-powered CRM integration can automatically enrich records, score leads, predict churn, and surface the insights that drive revenue — without manual data entry.",
    date: "2026-03-01",
    category: "CRM",
    readTime: "11 min read",
  },
  {
    slug: "workflow-automation-roi",
    title: "The ROI of Workflow Automation: How AI-Driven Processes Save 20+ Hours Per Week",
    excerpt: "We analysed 100+ businesses that implemented AI workflow automation and found an average time savings of 23 hours per week per team member. Here's the exact framework they used — and how to apply it to your sales, marketing, and operations.",
    date: "2026-02-15",
    category: "Productivity",
    readTime: "9 min read",
  },
  {
    slug: "predictive-revenue-forecasting",
    title: "Predictive Revenue Forecasting: Why AI Beats Spreadsheets Every Time",
    excerpt: "Traditional pipeline forecasting relies on gut feelings and outdated data. AI-powered revenue forecasting analyses thousands of signals to predict quarterly revenue with 90%+ accuracy. Learn the methodology and tools that make it possible.",
    date: "2026-02-01",
    category: "Analytics",
    readTime: "8 min read",
  },
  {
    slug: "ai-lead-generation-strategies",
    title: "7 AI Lead Generation Strategies That Outperform Manual Prospecting by 5x",
    excerpt: "Manual prospecting is dead. These seven AI-powered lead generation strategies — from intent signal detection to automated multi-touch sequences — are delivering 5x more qualified leads at 60% lower cost per acquisition.",
    date: "2026-01-15",
    category: "Lead Gen",
    readTime: "12 min read",
  },
];

export default function BlogPageClient() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Banner */}
        <section className="bg-[#F3D840] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <p className="text-[#374151] font-semibold text-sm tracking-wider uppercase mb-3">Blog</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#333333] mb-6">
                AI Insights for Modern Growth Teams
              </h1>
              <p className="text-[#535353] text-lg max-w-2xl mx-auto leading-relaxed">
                Expert analysis, strategies, and trends in AI-powered sales, marketing automation, and business intelligence. Stay ahead of the curve.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {blogPosts.map((post, i) => (
                <ScrollReveal key={post.slug} delay={i * 0.08}>
                  <article className="group p-6 sm:p-8 rounded-xl border border-gray-100 hover:border-[#F3D840] hover:shadow-lg transition-all duration-300 bg-white cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 text-xs font-medium bg-[#F3D840] text-[#374151] rounded-full">{post.category}</span>
                      <span className="text-sm text-gray-400">{post.readTime}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#333333] mb-3 group-hover:text-[#374151] transition-colors">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="text-[#535353] leading-relaxed mb-4">{post.excerpt}</p>
                    <time className="text-sm text-gray-400" dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
