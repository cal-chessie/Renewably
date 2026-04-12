import HomePageClient from "@/components/HomePageClient";

function HomePageSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Renewably — AI as a Service for Sales, Marketing & Automation",
          description: "Renewably deploys AI agents, automations, and intelligent systems that transform how businesses find, nurture, and close customers. Sales automation, marketing AI, and workflow optimisation — fully managed.",
          url: "https://renewably.ie",
          mainEntity: {
            "@type": "Service",
            name: "AI as a Service",
            provider: {
              "@type": "Organization",
              name: "Renewably",
            },
            description: "Fully managed AI as a Service solution deploying autonomous agents for sales, marketing automation, lead generation, and workflow optimisation.",
            serviceType: "AI as a Service & Sales Automation",
            areaServed: {
              "@type": "Place",
              name: "Worldwide",
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
              name: "What is AI as a Service?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "AI as a Service (AIaaS) is a fully managed solution where we deploy AI agents, automations, and intelligent systems across your sales, marketing, and operations. Our AI handles prospecting, lead qualification, campaign management, follow-ups, and reporting — all on autopilot, all optimised by machine learning.",
              },
            },
            {
              "@type": "Question",
              name: "How does AI-powered sales automation work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Our AI sales agents analyse your ideal customer profile, then autonomously prospect, engage, and qualify leads across multiple channels. When a prospect shows buying intent, the AI routes them to your team with full context — so you only spend time on conversations that convert.",
              },
            },
            {
              "@type": "Question",
              name: "What makes Renewably different from other AI agencies?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "We don't just implement AI tools — we build custom AI systems tailored to your specific sales and marketing workflows. Every agent is trained on your business, every automation is designed around your goals, and everything connects into a unified platform that drives measurable revenue growth.",
              },
            },
            {
              "@type": "Question",
              name: "What results can I expect?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Clients typically see a 3x increase in qualified pipeline volume, 40% reduction in customer acquisition costs, and 20+ hours saved per week on manual tasks. Most teams see measurable results within the first 30 days.",
              },
            },
            {
              "@type": "Question",
              name: "How quickly can I see results?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Our AI systems start learning and optimising from day one. Most clients see measurable improvements in lead quality and pipeline activity within the first two weeks. By month three, campaigns reach peak efficiency.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need technical expertise to use your AI platform?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Absolutely not. Our AI platform is fully managed — we handle setup, training, and ongoing optimisation. Your team simply uses the dashboard to monitor results and interact with leads. We provide full onboarding and support.",
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
      <main>
        <HomePageClient />
      </main>
    </>
  );
}
