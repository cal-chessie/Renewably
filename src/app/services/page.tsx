import type { Metadata } from "next";
import ServicesPageClient from "@/components/ServicesPageClient";

export const metadata: Metadata = {
  title: "Services — AI Workforce for Solar PV Installers",
  description: "Explore Renewably's 8 AI agents: grants management, ESB permitting, customer support, logistics, operations, QA, and reporting — purpose-built for Irish solar installers.",
  alternates: { canonical: "https://renewably.ie/services" },
  openGraph: {
    title: "Renewably Services — AI Agents for Irish Solar PV",
    description:
      "Grants, ESB permitting, customer support, logistics, QA — 8 AI agents purpose-built for Irish solar installers.",
    url: "https://renewably.ie/services",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably Services" }],
    type: "website",
  },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
