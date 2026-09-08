import HomePageClient from "@/components/HomePageClient";
import { homeFaqs } from "@/data/homeFaqs";
import { howItStartsSteps } from "@/data/howItStartsSteps";
import { howTo } from "@/lib/seo-schema";

export const metadata = {
  title: { absolute: 'Renewably: AI Workforce for Solar Installers in Ireland' },
  description: 'AI agents for Irish solar installers. Start with the two that move the needle, scale to a team of eight: grants, ESB applications, support, logistics.',
  alternates: {
    canonical: 'https://renewably.ie',
  },
  openGraph: {
    title: 'Renewably: AI Workforce for Solar Installers in Ireland',
    description: 'AI agents that run your solar pipeline from first enquiry to booked survey to handover: answering enquiries, booking surveys, tracking SEAI grants, chasing quiet follow-ups. Purpose-built for Irish installers doing 20+ jobs a month.',
    url: 'https://renewably.ie',
    siteName: 'Renewably',
    locale: 'en_IE',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Renewably' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Renewably: AI Workforce for Solar Installers in Ireland',
    description: 'AI agents that run your solar pipeline from first enquiry to booked survey to handover: answering enquiries, booking surveys, tracking SEAI grants, chasing quiet follow-ups. Purpose-built for Irish installers doing 20+ jobs a month.',
    images: ['/og-image.png'],
  },
}

function HomePageSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Renewably: AI Workforce for Solar Installers in Ireland",
          description: "Renewably gives solar PV installers across Ireland a team of AI agents that run the pipeline from first enquiry to booked survey to handover: lead response, site survey booking, proposals, SEAI grant tracking, follow-ups, and install coordination.",
          url: "https://renewably.ie",
          mainEntity: {
            "@type": "Service",
            name: "AI Workforce for Solar Installers",
            provider: {
              "@type": "Organization",
              name: "Renewably",
            },
            description: "An AI workforce for solar PV installers in Ireland that runs the pipeline from enquiry to booked survey to handover: lead response, site survey booking, proposals, SEAI grant tracking, follow-ups, and install coordination.",
            serviceType: "AI Workforce for Solar PV Installers",
            areaServed: {
              "@type": "Place",
              name: "Ireland",
            },
          },
        }),
      }}
    />
  );
}

function FAQSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: homeFaqs.map((faq) => ({
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

function HowToSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          howTo(
            "How Renewably starts",
            howItStartsSteps.map((step) => ({ name: step, text: step }))
          )
        ),
      }}
    />
  );
}

export default function Home() {
  return (
    <>
      <HomePageSchema />
      <FAQSchema />
      <HowToSchema />
      <main id="main-content">
        <HomePageClient />
      </main>
    </>
  );
}
