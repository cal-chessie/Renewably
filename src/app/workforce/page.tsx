import type { Metadata } from "next";
import WorkforcePageClient from "@/components/WorkforcePageClient";
import { serviceList, breadcrumb } from "@/lib/seo-schema";

const ogTitle = "Meet Your AI Workforce: 8 Agents for Irish Solar Installers";
const ogDescription =
  "Eight AI employees that run your solar company on autopilot. Grants, ESB applications, logistics, customer support: all handled.";

export const metadata: Metadata = {
  title: "AI Workforce: 8 AI Employees for Solar Installers (+ 1 Coming Soon)",
  description: "Meet your AI workforce. Eight specialised agents: CEO, Operations, Support, Grants, Logistics, ESB, QA, and Reporting: that automate your Irish solar business. Marketing agent coming soon.",
  alternates: { canonical: "https://renewably.ie/workforce" },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: "https://renewably.ie/workforce",
    siteName: "Renewably",
    locale: "en_IE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably AI Workforce" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
  },
};

/* The 8 agents that run on this page, name + short description drawn from the
   on-page agent copy (title + tagline). The Marketing agent is Coming Soon and
   is deliberately excluded. */
const workforceAgents = [
  { name: "CEO Agent", description: "Sets strategy. Assigns work. Manages the team. Reports to you weekly." },
  { name: "Operations Agent", description: "Runs the day to day. Coordinates installs. Manages timelines." },
  { name: "Customer Support Agent", description: "Answers every message. Books every consult. Never sleeps." },
  { name: "Grants Agent", description: "Knows every SEAI scheme. Fills every form. Chases every application." },
  { name: "Logistics Agent", description: "Orders equipment. Schedules crews. Manages inventory." },
  { name: "ESB Agent", description: "Handles ESB. Tracks submissions. Follows up on delays." },
  { name: "QA Agent", description: "Reviews every job before handover. Checks paperwork. Catches mistakes." },
  { name: "Reporting Agent", description: "Shows you exactly what's happening. Weekly summaries. Bottlenecks identified." },
];

export default function WorkforcePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceList(workforceAgents)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumb([
              { name: "Home", path: "/" },
              { name: "Workforce", path: "/workforce" },
            ])
          ),
        }}
      />
      <main id="main-content">
        <WorkforcePageClient />
      </main>
    </>
  );
}
