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
    a: "Renewably gives Irish solar installers an AI workforce that runs the day-to-day admin of a solar PV business, so you can focus on installing panels instead of drowning in admin. The agents answer enquiries and text back missed calls, book and prep site surveys, draft proposals for you to sign off, track SEAI grant applications and deadlines, chase quiet leads, and schedule installs while tracking ESB Networks grid connection paperwork. Your CRM stays yours; Renewably runs the front desk on top of it.",
  },
  {
    q: "How does the AI workforce work?",
    a: "Each AI agent owns one job. The Lead Response Agent answers enquiries and texts back missed calls, the Operations Agent tracks the pipeline and sends you a weekly brief, the Grants Agent fills the SEAI paperwork and tracks applications and deadlines, and the Install Coordinator Agent schedules installs and tracks ESB Networks grid connection paperwork. They work around the clock, plug into the tools you already use, and report to you through a single dashboard. You manage them like a real team.",
  },
  {
    q: "How much does it cost?",
    a: "Most solar installers pay €1,000 – €1,500 per month plus a one-time setup fee. You bring your own AI API keys and pay model providers directly. We do not mark up AI usage costs. Typical AI model costs are €50–200/month depending on your volume. No hidden fees.",
  },
  {
    q: "What makes Renewably different from other AI tools?",
    a: "Renewably is purpose-built for Irish solar PV installers, not a generic chatbot or CRM plugin. Every agent knows SEAI schemes, ESB Networks processes, Irish building regulations, and the local solar market. You get a coordinated AI workforce built for how Irish solar installers actually work, not a single general-purpose tool.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. Your data is encrypted at rest and in transit, stored in EU-based data centres, and never shared with third parties. We comply with GDPR and Irish data protection regulations. Your customer data, business information, and conversation histories are yours alone. We do not use them to train AI models.",
  },
  {
    q: "Do I have to take the whole workforce at once?",
    a: "No. Most installers start with the front desk: the Lead Response agent that answers every enquiry and texts back missed calls, and the Operations agent that runs your pipeline and briefs you each week. It works the front of your funnel, and your CRM stays yours. When you're ready, the same system grows into the full workforce. You approve every hire.",
  },
  {
    q: "How do I get started?",
    a: "Book a 15-minute call through our website or ring us on +353 87 395 8424. We will walk you through the platform, discuss your specific needs, and provide a tailored quote. Once you sign up, our team handles the entire setup, typically within one to two weeks. No technical expertise required.",
  },
];
