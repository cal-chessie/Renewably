import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePageClient from "@/components/HomePageClient";

function HomePageSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Renewably — Leads as a Service for Renewable Energy Brands in Ireland",
          description: "Renewably combines AI-powered technology with data-driven strategy to deliver qualified leads for renewable energy companies in Ireland. Smart campaigns, smart conversions, smart bidding.",
          url: "https://renewably.ie",
          mainEntity: {
            "@type": "Service",
            name: "Leads as a Service",
            provider: {
              "@type": "Organization",
              name: "Renewably",
            },
            description: "Fully integrated lead generation and customer acquisition system powered by AI, combining smart campaigns, conversion optimisation, and automated bidding for renewable energy brands.",
            serviceType: "Digital Marketing & Lead Generation",
            areaServed: {
              "@type": "Country",
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
              name: "What is Leads as a Service?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Leads as a Service (LaaS) is a fully managed lead generation solution where Renewably handles every aspect of customer acquisition — from campaign creation and ad copy generation to conversion optimisation and CRM integration. We use AI-powered technology and machine learning to automate and optimise paid media at scale, delivering qualified leads directly to your sales team.",
              },
            },
            {
              "@type": "Question",
              name: "How does Renewably help renewable energy companies in Ireland?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Renewably specialises in digital marketing for renewable energy brands in Ireland. We combine hyper-targeted paid media campaigns with AI-driven conversion optimisation, smart bidding strategies, and CRM integration to create a sustainable customer acquisition system. Our data-driven approach ensures you get qualified leads with lower customer acquisition costs and higher conversion rates.",
              },
            },
            {
              "@type": "Question",
              name: "What makes Renewably different from other digital marketing agencies?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Renewably differentiates through our exclusive Leads as a Service model. Unlike traditional agencies that only manage campaigns, we build a complete, automated customer acquisition system tailored to renewable energy brands. This includes AI-powered ad copy generation, multivariate landing page testing, automated bid management, and direct CRM integration — all continuously optimised through machine learning.",
              },
            },
            {
              "@type": "Question",
              name: "What results can I expect from Renewably's lead generation services?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Clients using our optimised conversion systems report up to 3 times lead volume lift through multivariate testing and machine learning. Our smart bidding strategies help reduce cost per acquisition while increasing conversion rates. Every campaign is continuously monitored and optimised to improve performance over time.",
              },
            },
            {
              "@type": "Question",
              name: "How quickly can I see results from lead generation campaigns?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Most clients begin seeing measurable results within the first 30 days of campaign launch. Our AI systems start optimising from day one, using A/B testing and machine learning to rapidly improve performance. By month three, campaigns typically reach peak efficiency with significant improvements in lead quality and volume.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need a large marketing budget to work with Renewably?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "We work with businesses of all sizes and can scale our services to match your budget. Our AI-powered approach is inherently efficient — smart bidding reduces wasted spend, and our optimised conversion paths mean you get more value from every click. We recommend starting with a strategy call so we can recommend the best approach for your specific goals and budget.",
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
      <Header />
      <main>
        <HomePageClient />
      </main>
      <Footer />
    </>
  );
}
