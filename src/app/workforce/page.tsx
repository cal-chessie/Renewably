import type { Metadata } from "next";
import WorkforcePageClient from "@/components/WorkforcePageClient";

export const metadata: Metadata = {
  title: "AI Workforce — 8 AI Employees for Solar Installers (+ 1 Coming Soon) | Renewably",
  description: "Meet your AI workforce. Eight specialised agents — CEO, Operations, Support, Grants, Logistics, Permitting, QA, and Reporting — that automate your Irish solar business. Marketing agent coming soon.",
  alternates: { canonical: "https://renewably.ie/workforce" },
  openGraph: {
    title: "Meet Your AI Workforce — 8 Agents for Irish Solar Installers",
    description:
      "Eight AI employees that run your solar company on autopilot. Grants, permits, logistics, customer support — all handled.",
    url: "https://renewably.ie/workforce",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably AI Workforce" }],
    type: "website",
  },
};

export default function WorkforcePage() {
  return <WorkforcePageClient />;
}
