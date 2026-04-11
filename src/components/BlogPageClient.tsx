"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";

const blogPosts = [
  {
    slug: "ai-powered-lead-generation-renewable-energy",
    title: "How AI-Powered Lead Generation Is Transforming Renewable Energy Marketing in 2026",
    excerpt: "The renewable energy sector in Ireland is experiencing rapid growth, and with it comes increasing competition for customer attention. Discover how AI-powered lead generation is giving forward-thinking companies a decisive advantage in acquiring qualified leads at scale.",
    date: "2026-04-01",
    category: "Lead Generation",
    readTime: "8 min read",
  },
  {
    slug: "google-ads-strategy-renewable-energy",
    title: "The Complete Google Ads Strategy for Renewable Energy Companies in Ireland",
    excerpt: "A comprehensive guide to building high-performing Google Ads campaigns for solar, wind, and heat pump installation companies. From keyword research to conversion tracking, learn the strategies that deliver measurable results.",
    date: "2026-03-15",
    category: "Paid Media",
    readTime: "12 min read",
  },
  {
    slug: "conversion-rate-optimisation-energy-sector",
    title: "Conversion Rate Optimisation: Why Energy Sector Landing Pages Need a Different Approach",
    excerpt: "Generic landing page advice does not work for the renewable energy sector. Customers making significant energy decisions need trust signals, social proof, and educational content. Learn the specific CRO strategies that drive results in this unique market.",
    date: "2026-03-01",
    category: "CRO",
    readTime: "10 min read",
  },
  {
    slug: "smart-bidding-strategies-2026",
    title: "Smart Bidding Strategies That Actually Work in 2026: A Data-Driven Analysis",
    excerpt: "Google's smart bidding has evolved significantly. We analysed over 200 campaigns in the renewable energy sector to identify which bidding strategies deliver the best ROAS. The results challenge several common assumptions about automated bidding.",
    date: "2026-02-15",
    category: "PPC",
    readTime: "9 min read",
  },
  {
    slug: "aio-seo-renewable-energy-brands",
    title: "AIO and AEO: How to Optimise Your Renewable Energy Brand for AI Search Engines",
    excerpt: "With AI-powered search engines like Perplexity and ChatGPT Search reshaping how customers find information, traditional SEO is no longer enough. Learn how to optimise your content for AI answer engines and capture voice search traffic.",
    date: "2026-02-01",
    category: "SEO",
    readTime: "11 min read",
  },
  {
    slug: "crm-integration-lead-quality",
    title: "CRM Integration Secrets: How to Improve Lead Quality by 40% Without Spending More on Ads",
    excerpt: "The gap between marketing and sales is where most renewable energy companies lose potential customers. Learn how proper CRM integration, automated lead scoring, and instant follow-up workflows can dramatically improve your lead-to-customer conversion rate.",
    date: "2026-01-15",
    category: "Strategy",
    readTime: "7 min read",
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
                Insights for Renewable Energy Marketing
              </h1>
              <p className="text-[#535353] text-lg max-w-2xl mx-auto leading-relaxed">
                Expert analysis, strategies, and trends to help you stay ahead in digital marketing for the renewable energy sector.
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
