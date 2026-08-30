// Single source of truth for the homepage FAQ.
// Both the visible FAQSection (HomePageClient) and the FAQPage JSON-LD
// (src/app/page.tsx) read this array, so the structured data can never drift
// from what the page actually shows (a Google FAQ-markup requirement).
export interface HomeFaq {
  q: string;
  a: string;
}

export const homeFaqs: HomeFaq[] = [
  {
    q: "What does Renewably do?",
    a: "Renewably deploys 8 specialised AI agents that automate every part of a solar PV installation business in Ireland. Our AI handles SEAI grant applications, ESB permit tracking, customer support, logistics coordination, quality assurance, operations management, and reporting — so you can focus on installing panels instead of drowning in admin.",
  },
  {
    q: "How does the AI workforce work?",
    a: "Each AI agent specialises in a specific area of your solar business. The CEO Agent orchestrates the team, the Operations Agent coordinates installs, the Grants Agent handles SEAI applications, and so on. They work 24/7, integrate with your existing tools, and report directly to you through a single dashboard. You manage them like a real team.",
  },
  {
    q: "How much does it cost?",
    a: "Most solar installers pay €1,000 – €1,500 per month plus a one-time setup fee. You bring your own AI API keys and pay model providers directly — we do not mark up AI usage costs. Typical AI model costs are €50–200/month depending on your volume. No hidden fees.",
  },
  {
    q: "What makes Renewably different from other AI tools?",
    a: "Renewably is purpose-built for Irish solar PV installers — not a generic chatbot or CRM plugin. Every agent knows SEAI schemes, ESB Networks processes, Irish building regulations, and the local solar market. You get 8 specialised AI employees working as a coordinated team, not a single general-purpose tool.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. Your data is encrypted at rest and in transit, stored in EU-based data centres, and never shared with third parties. We comply with GDPR and Irish data protection regulations. Your customer data, business information, and conversation histories are yours alone — we do not use them to train AI models.",
  },
  {
    q: "How do I get started?",
    a: "Book a 15-minute call through our website or ring us on +353 87 395 8424. We will walk you through the platform, discuss your specific needs, and provide a tailored quote. Once you sign up, our team handles the entire setup — typically within one to two weeks. No technical expertise required.",
  },
];
