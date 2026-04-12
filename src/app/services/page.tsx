import type { Metadata } from "next";
import ServicesPageClient from "@/components/ServicesPageClient";

export const metadata: Metadata = {
  title: "Services — AI Sales Agents, Marketing Automation & Workflow Intelligence",
  description: "Explore Renewably's AI as a Service platform: autonomous sales agents, marketing automation, intelligent lead generation, workflow automation, revenue intelligence, and CRM integration.",
  alternates: { canonical: "https://renewably.ie/services" },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
