import type { Metadata } from "next";
import PricingPageClient from "@/components/PricingPageClient";
import { pricingFaqs } from "@/data/pricingFaqs";
import { offer, faqPage, breadcrumb } from "@/lib/seo-schema";

const ogTitle = "Renewably Pricing: AI Workforce for Irish Solar Installers";
const ogDescription =
  "From €1,000/month. All 8 AI agents, an operations dashboard, dedicated support. No hidden fees. Scale as you grow.";

export const metadata: Metadata = {
  title: "Pricing: AI Workforce for Solar Installers",
  description:
    "AI workforce for Irish solar installers from €1,000/month. Start with two agents, scale to eight. One-time setup, no hidden fees, bring your own keys.",
  alternates: { canonical: "https://renewably.ie/pricing" },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: "https://renewably.ie/pricing",
    siteName: "Renewably",
    locale: "en_IE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably Pricing" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offer()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage(pricingFaqs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumb([
              { name: "Home", path: "/" },
              { name: "Pricing", path: "/pricing" },
            ])
          ),
        }}
      />
      <main id="main-content">
        <PricingPageClient />
      </main>
    </>
  );
}
