import type { Metadata } from "next";
import TermsPageClient from "@/components/TermsPageClient";

export const metadata: Metadata = {
  title: "Terms of Service — Renewably",
  description:
    "Terms of service for Renewably's AI-as-a-Service platform for Irish solar PV installers. Subscription terms, acceptable use, and legal details.",
  alternates: { canonical: "https://renewably.ie/terms" },
  openGraph: {
    title: "Terms of Service — Renewably",
    description:
      "Terms of service for Renewably's AI-as-a-Service platform for Irish solar PV installers. Subscription terms, acceptable use, and legal details.",
    url: "https://renewably.ie/terms",
    siteName: "Renewably",
    type: "website",
  },
};

export default function TermsPage() {
  return <TermsPageClient />;
}
