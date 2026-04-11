import type { Metadata } from "next";
import AboutPageClient from "@/components/AboutPageClient";

export const metadata: Metadata = {
  title: "About Us — Ireland's Renewable Energy Marketing Specialists",
  description: "Learn about Renewably, Ireland's leading digital marketing agency for renewable energy brands. We combine AI technology with data-driven strategy to build sustainable customer acquisition systems.",
  alternates: { canonical: "https://renewably.ie/about" },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
