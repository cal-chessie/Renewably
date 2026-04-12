import type { Metadata } from "next";
import BlogPageClient from "@/components/BlogPageClient";

export const metadata: Metadata = {
  title: "Blog — AI Operations, Grants & Logistics for Irish Solar Installers",
  description:
    "Practical guides on AI-powered operations, SEAI grants, ESB permitting, logistics, customer support, and revenue forecasting. Written for solar companies doing 20+ jobs a month in Ireland.",
  alternates: { canonical: "https://renewably.ie/blog" },
  openGraph: {
    title: "Renewably Blog — Solar is Changing. Stay Ahead.",
    description:
      "Practical guides on AI operations, SEAI grants, ESB permitting, and more. Written for Irish solar installers.",
    url: "https://renewably.ie/blog",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably Blog" }],
    type: "website",
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
