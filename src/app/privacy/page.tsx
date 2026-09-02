import type { Metadata } from "next";
import PrivacyPageClient from "@/components/PrivacyPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Renewably's privacy policy. Learn how we collect, use, and protect your personal data in compliance with GDPR and Irish data protection law.",
  alternates: { canonical: "https://renewably.ie/privacy" },
  openGraph: {
    title: "Privacy Policy",
    description:
      "Renewably's privacy policy. Learn how we collect, use, and protect your personal data in compliance with GDPR and Irish data protection law.",
    url: "https://renewably.ie/privacy",
    siteName: "Renewably",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably" }],
  },
};

export default function PrivacyPage() {
  return (
    <main id="main-content">
      <PrivacyPageClient />
    </main>
  );
}
