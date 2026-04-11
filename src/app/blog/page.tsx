import type { Metadata } from "next";
import BlogPageClient from "@/components/BlogPageClient";

export const metadata: Metadata = {
  title: "Blog — Digital Marketing Insights for Renewable Energy Brands",
  description: "Expert insights, strategies, and trends in digital marketing for renewable energy companies. Stay updated with the latest in AI-powered lead generation, paid media, and conversion optimisation.",
  alternates: { canonical: "https://renewably.ie/blog" },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
