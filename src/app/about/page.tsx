import type { Metadata } from "next";
import AboutPageClient from "@/components/AboutPageClient";

export const metadata: Metadata = {
  title: "About — AI as a Service for Sales, Marketing & Automation",
  description: "Learn about Renewably, Ireland's leading AI as a Service provider. We build and operate AI systems that automate sales, marketing, and operations for ambitious businesses.",
  alternates: { canonical: "https://renewably.ie/about" },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
