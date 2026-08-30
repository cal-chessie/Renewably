import type { Metadata } from "next";
import PricingPageClient from "@/components/PricingPageClient";
import { pricingFaqs } from "@/data/pricingFaqs";

export const metadata: Metadata = {
  title: "Pricing — AI Workforce for Solar Installers | Renewably",
  description:
    "Simple pricing for Renewably's AI workforce. From €1,000/month with no hidden fees. All 8 agents, an operations dashboard, and dedicated support included. Purpose-built for Irish solar installers.",
  alternates: { canonical: "https://renewably.ie/pricing" },
  openGraph: {
    title: "Renewably Pricing — AI Workforce for Irish Solar Installers",
    description:
      "From €1,000/month. All 8 AI agents, an operations dashboard, dedicated support. No hidden fees. Scale as you grow.",
    url: "https://renewably.ie/pricing",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably Pricing" }],
    type: "website",
  },
};

function FAQSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pricingFaqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }),
      }}
    />
  );
}

export default function PricingPage() {
  return (
    <>
      <FAQSchema />
      <main id="main-content">
        <PricingPageClient />
      </main>
    </>
  );
}
