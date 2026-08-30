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
    a: "The one-time setup fee covers everything you need to get started: custom configuration of your AI agents, integration setup with your existing tools (calendar, email and your existing CRM), team onboarding and training, and importing your existing data. We handle all of it so you don’t have to.",
  },
  {
    q: "How much are AI costs?",
    a: "AI model usage is typically €50 to €200 per month, depending on your volume. You pay OpenAI (or your chosen provider) directly using your own API key. We don’t mark up, resell, or intermediate these costs in any way. You see exactly what you’re spending.",
  },
  {
    q: "Can I start small?",
    a: "Most installers do. The usual starting point is the front office: a PA that does the sending and a Chief of Staff that decides and drafts. They work the messy front of your funnel while your CRM stays yours. When you're ready, the same system grows into the full workforce. You approve every hire.",
  },
  {
    q: "Is there a free trial?",
    a: "No, because this is a managed service, not software you poke at alone. We build your team, test it against your real jobs, and hand it over working. What you get instead: month-to-month billing, no lock-in, and in week one nothing reaches a customer without your approval. If it's not for you, cancel and keep your data.",
  },
  {
    q: "What if I cancel?",
    a: "If you cancel, you keep all your data. We give you 30 days to export everything from the CRM in a standard format. There are no cancellation penalties, no data hostage situations, no hard feelings. Your data is yours.",
  },
];
