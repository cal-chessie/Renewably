import type { Metadata } from "next";
import ServicesPageClient from "@/components/ServicesPageClient";

export const metadata: Metadata = {
  title: "Services — AI Workforce for Solar PV Installers",
  description: "Explore Renewably's 8 AI agents: grants management, ESB permitting, customer support, logistics, operations, QA, and reporting — purpose-built for Irish solar installers.",
  alternates: { canonical: "https://renewably.ie/services" },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
