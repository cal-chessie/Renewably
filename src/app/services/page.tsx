import type { Metadata } from "next";
import ServicesPageClient from "@/components/ServicesPageClient";

export const metadata: Metadata = {
  title: "Services — AI-Powered Lead Generation & Digital Marketing",
  description: "Explore Renewably's comprehensive digital marketing services for renewable energy brands: smart campaigns, AI-powered conversions, automated bidding, CRM integration, and continuous optimisation.",
  alternates: { canonical: "https://renewably.ie/services" },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
