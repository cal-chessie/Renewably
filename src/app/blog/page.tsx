import type { Metadata } from "next";
import BlogPageClient from "@/components/BlogPageClient";

export const metadata: Metadata = {
  title: "Blog — AI Insights for Sales, Marketing & Automation",
  description: "Expert analysis, strategies, and trends in AI-powered sales automation, marketing intelligence, and workflow optimisation for modern growth teams.",
  alternates: { canonical: "https://renewably.ie/blog" },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
