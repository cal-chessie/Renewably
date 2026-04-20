import type { Metadata } from "next";
import AboutPageClient from "@/components/AboutPageClient";

export const metadata: Metadata = {
  title: "About — AI Workforce for Solar Installers in Ireland | Renewably",
  description:
    "Renewably deploys 8 AI employees across your solar operations — grants, permits, customer support, logistics, QA, and reporting. Based in Ireland. Built for solar installers.",
  alternates: { canonical: "https://renewably.ie/about" },
  openGraph: {
    title: "About Renewably — The AI Workforce for Irish Solar Installers",
    description:
      "We built the team you can't find. Eight AI agents live, ninth coming soon. Deployed across Irish solar companies doing 20+ jobs a month.",
    url: "https://renewably.ie/about",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably About" }],
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
