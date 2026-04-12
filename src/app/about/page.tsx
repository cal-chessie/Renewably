import type { Metadata } from "next";
import AboutPageClient from "@/components/AboutPageClient";

export const metadata: Metadata = {
  title: "About — AI Workforce for Solar Installers in Ireland",
  description:
    "Renewably deploys AI employees across your solar operations — grants, permits, customer support, logistics, and site assessment. Based in Ireland. Built for solar installers doing 20+ jobs a month.",
  alternates: { canonical: "https://renewably.ie/about" },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
