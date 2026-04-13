import type { Metadata } from "next";
import WorkforcePageClient from "@/components/WorkforcePageClient";

export const metadata: Metadata = {
  title: "AI Workforce — 8 AI Employees for Solar Installers (+ 1 Coming Soon) | Renewably",
  description: "Meet your new AI workforce. Eight AI employees — CEO, Operations, Customer Support, Grants, Logistics, Permitting, QA, and Reporting — that run your solar company on autopilot. Ninth agent (Marketing) coming soon.",
  alternates: { canonical: "https://renewably.ie/workforce" },
};

export default function WorkforcePage() {
  return <WorkforcePageClient />;
}
