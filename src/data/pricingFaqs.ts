// Single source of truth for the pricing FAQ.
// Both the visible FAQ section (PricingPageClient) and the FAQPage JSON-LD
// (src/app/pricing/page.tsx) read this array, so the structured data can never
// drift from what the page actually shows (a Google FAQ-markup requirement).
export interface PricingFaq {
  q: string;
  a: string;
}

export const pricingFaqs: PricingFaq[] = [
  {
    q: "Is there a contract?",
    a: "No. Our subscription is month-to-month with no lock-in period. You can cancel at any time before the next billing cycle, and you won’t be charged again. There are no cancellation fees, no penalties, and no hassle.",
  },
  {
    q: "What does the setup fee cover?",
    a: "The one-time setup fee covers everything you need to get started: custom configuration of your AI agents, integration setup with your existing tools (calendar, email, WhatsApp), team onboarding and training, and importing your existing data into the CRM. We handle all of it so you don’t have to.",
  },
  {
    q: "How much are AI costs?",
    a: "AI model usage is typically €50 to €200 per month, depending on your volume. You pay OpenAI (or your chosen provider) directly using your own API key. We don’t mark up, resell, or intermediate these costs in any way. You see exactly what you’re spending.",
  },
  {
    q: "Can I start small?",
    a: "Absolutely. Many installers start with the core agents — CEO, Operations, and Support — then add Grants, Permitting, and others as their workload grows. Every agent is independent, so you can scale up or down whenever you like.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. We offer a 14-day free trial with full access to all features and agents. No credit card required. At the end of the trial, simply choose the plan that fits your team size and continue. If it’s not for you, walk away — no strings attached.",
  },
  {
    q: "What if I cancel?",
    a: "If you cancel, you keep all your data. We give you 30 days to export everything from the CRM in a standard format. There are no cancellation penalties, no data hostage situations, no hard feelings. Your data is yours.",
  },
];
