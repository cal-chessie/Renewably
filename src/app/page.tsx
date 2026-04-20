import HomePageClient from "@/components/HomePageClient";

export const metadata = {
  title: 'Renewably — AI Workforce for Solar Installers in Ireland',
  description: 'Renewably deploys 8 AI agents that automate your solar PV business — grants, permits, customer support, logistics, and more. Purpose-built for Irish solar installers doing 20+ jobs a month.',
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
          name: "Renewably — AI Workforce for Solar Installers in Ireland",
          description: "Renewably deploys 8 AI employees that handle grants, permits, customer support, logistics, QA, and operations for solar PV installers across Ireland. Fully managed AI-as-a-Service.",
          url: "https://renewably.ie",
          mainEntity: {
            "@type": "Service",
            name: "AI Workforce for Solar Installers",
            provider: {
              "@type": "Organization",
              name: "Renewably",
            },
            description: "Fully managed AI workforce deploying 8 specialised agents for solar PV installation businesses: grants management, ESB permitting, customer support, logistics, operations, QA, reporting, and more.",
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
          mainEntity: [
            {
              "@type": "Question",
              name: "What does Renewably do?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Renewably provides an AI workforce of 8 specialised agents that automate every part of a solar PV installation business in Ireland. Our AI handles SEAI grant applications, ESB permit tracking, customer support, logistics coordination, quality assurance, operations management, and reporting — so you can focus on installing panels.",
              },
            },
            {
              "@type": "Question",
              name: "How does the AI workforce work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Each AI agent specialises in a specific area of your solar business. The CEO Agent orchestrates the team, the Operations Agent coordinates installs, the Grants Agent handles SEAI applications, and so on. They work 24/7, integrate with your existing tools, and report directly to you through a simple dashboard.",
              },
            },
            {
              "@type": "Question",
              name: "What makes Renewably different from other AI tools?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Renewably is purpose-built for Irish solar PV installers — not generic AI. Every agent knows SEAI schemes, ESB Networks processes, Irish building regulations, and the local solar market. You get 8 specialised AI employees working as a coordinated team, not a single chatbot or general-purpose tool.",
              },
            },
            {
              "@type": "Question",
              name: "How much does Renewably cost?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Plans start from €1,000/month for the full AI workforce of 8 agents. Clients bring their own AI API keys and pay model providers directly — no markup from Renewably. Typical AI model costs are €50-200/month depending on usage. A one-time setup fee applies. Free demos are available.",
              },
            },
            {
              "@type": "Question",
              name: "Is it easy to get started?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Absolutely. Book a 15-minute call and we will assess your business needs. Onboarding typically takes 1-2 weeks, and our team handles the entire setup — including integrating with your existing CRM, email, and calendar. No technical expertise required on your end.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need technical expertise to use Renewably?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. Our AI platform is fully managed — we handle setup, training, and ongoing optimisation. Your team simply uses the dashboard to monitor results and interact with leads. We provide full onboarding and support.",
              },
            },
          ],
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
