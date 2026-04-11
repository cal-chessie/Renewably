import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BlogPostClient from "@/components/BlogPostClient";

const posts: Record<string, { title: string; date: string; category: string; content: string }> = {
  "ai-sales-agents-2026-guide": {
    title: "The Complete Guide to AI Sales Agents in 2026: From Prospect to Close",
    date: "2026-04-01",
    category: "Sales AI",
    content: "",
  },
  "marketing-automation-stack-2026": {
    title: "Building the Ultimate Marketing Automation Stack in 2026: Tools, Strategies & AI Integration",
    date: "2026-03-15",
    category: "Automation",
    content: "",
  },
  "ai-crm-integration-guide": {
    title: "AI + CRM Integration: How to Turn Your Customer Data into a Revenue Machine",
    date: "2026-03-01",
    category: "CRM",
    content: "",
  },
  "workflow-automation-roi": {
    title: "The ROI of Workflow Automation: How AI-Driven Processes Save 20+ Hours Per Week",
    date: "2026-02-15",
    category: "Productivity",
    content: "",
  },
  "predictive-revenue-forecasting": {
    title: "Predictive Revenue Forecasting: Why AI Beats Spreadsheets Every Time",
    date: "2026-02-01",
    category: "Analytics",
    content: "",
  },
  "ai-lead-generation-strategies": {
    title: "7 AI Lead Generation Strategies That Outperform Manual Prospecting by 5x",
    date: "2026-01-15",
    category: "Lead Gen",
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
    description: `Read our expert analysis on ${post.category.toLowerCase()} for modern growth teams. Published ${new Date(post.date).toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}.`,
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
