import type { Metadata } from "next";
import PricingPageClient from "@/components/PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing — AI Workforce for Solar Installers | Renewably",
  description:
    "Simple, honest pricing for Renewably's AI workforce. From €1,000/month with no hidden fees. All 8 AI agents, full CRM dashboard, and dedicated support included.",
  alternates: { canonical: "https://renewably.ie/pricing" },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
