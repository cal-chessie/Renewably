import HomePageClient from "@/components/HomePageClient";
import { homeFaqs } from "@/data/homeFaqs";

export const metadata = {
  title: { absolute: 'Renewably: AI Workforce for Solar Installers in Ireland' },
  description: 'Renewably deploys 8 AI agents that automate your solar PV business: grants, ESB applications, customer support, logistics, and more. Purpose-built for Irish solar installers doing 20+ jobs a month.',
  alternates: {
    canonical: 'https://renewably.ie',
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
          description: "Renewably deploys 8 AI employees that handle grants, ESB applications, customer support, logistics, QA, and operations for solar PV installers across Ireland. Fully managed AI-as-a-Service.",
          url: "https://renewably.ie",
          mainEntity: {
            "@type": "Service",
            name: "AI Workforce for Solar Installers",
            provider: {
              "@type": "Organization",
              name: "Renewably",
            },
            description: "Fully managed AI workforce deploying 8 specialised agents for solar PV installation businesses: grants management, ESB applications, customer support, logistics, operations, QA, reporting, and more.",
            serviceType: "AI as a Service for Solar PV",
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

export default function Home() {
  return (
    <>
      <HomePageSchema />
      <FAQSchema />
      <main id="main-content">
        <HomePageClient />
      </main>
    </>
  );
}
