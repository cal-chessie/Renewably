import type { Metadata } from "next";
import PrivacyPageClient from "@/components/PrivacyPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy — Renewably",
  description:
    "Renewably's privacy policy. Learn how we collect, use, and protect your personal data in compliance with GDPR and Irish data protection law.",
  alternates: { canonical: "https://renewably.ie/privacy" },
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
