import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BlogPostClient from "@/components/BlogPostClient";

const posts: Record<string, { title: string; date: string; category: string; content: string }> = {
  "ai-powered-lead-generation-renewable-energy": {
    title: "How AI-Powered Lead Generation Is Transforming Renewable Energy Marketing in 2026",
    date: "2026-04-01",
    category: "Lead Generation",
    content: "",
  },
  "google-ads-strategy-renewable-energy": {
    title: "The Complete Google Ads Strategy for Renewable Energy Companies in Ireland",
    date: "2026-03-15",
    category: "Paid Media",
    content: "",
  },
  "conversion-rate-optimisation-energy-sector": {
    title: "Conversion Rate Optimisation: Why Energy Sector Landing Pages Need a Different Approach",
    date: "2026-03-01",
    category: "CRO",
    content: "",
  },
  "smart-bidding-strategies-2026": {
    title: "Smart Bidding Strategies That Actually Work in 2026: A Data-Driven Analysis",
    date: "2026-02-15",
    category: "PPC",
    content: "",
  },
  "aio-seo-renewable-energy-brands": {
    title: "AIO and AEO: How to Optimise Your Renewable Energy Brand for AI Search Engines",
    date: "2026-02-01",
    category: "SEO",
    content: "",
  },
  "crm-integration-lead-quality": {
    title: "CRM Integration Secrets: How to Improve Lead Quality by 40% Without Spending More on Ads",
    date: "2026-01-15",
    category: "Strategy",
    content: "",
  },
};

export async function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: `Read our expert analysis on ${post.category.toLowerCase()} for renewable energy brands. Published ${new Date(post.date).toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}.`,
    alternates: { canonical: `https://renewably.ie/blog/${slug}` },
    openGraph: {
      title: post.title,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!posts[slug]) notFound();

  return <BlogPostClient />;
}
