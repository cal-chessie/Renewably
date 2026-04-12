import type { Metadata } from "next";
import BlogPageClient from "@/components/BlogPageClient";

export const metadata: Metadata = {
  title: "Blog — AI Operations, Grants & Logistics for Solar Installers",
  description:
    "Practical guides on AI-powered site assessment, SEAI grants, ESB permitting, logistics, customer support, and revenue forecasting. Written for solar companies doing 20+ jobs a month in Ireland.",
  alternates: { canonical: "https://renewably.ie/blog" },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
