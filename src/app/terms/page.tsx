import type { Metadata } from "next";
import TermsPageClient from "@/components/TermsPageClient";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for Renewably's AI-as-a-Service platform for Irish solar PV installers. Subscription terms, acceptable use, and legal details.",
  alternates: { canonical: "https://renewably.ie/terms" },
  openGraph: {
    title: "Terms of Service",
    description:
      "Terms of service for Renewably's AI-as-a-Service platform for Irish solar PV installers. Subscription terms, acceptable use, and legal details.",
    url: "https://renewably.ie/terms",
    siteName: "Renewably",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably" }],
  },
};

export default function TermsPage() {
  return (
    <main id="main-content">
      <TermsPageClient />
    </main>
  );
}
