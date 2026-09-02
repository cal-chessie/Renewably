// Single source of truth for the "How it starts" steps. The visible section
// (HowItStartsSection) and the HowTo JSON-LD (app/page.tsx) both read this,
// so the structured data can never drift from what the page shows. Kept in a
// plain (non-client) module so the server page can import the real value.
export const howItStartsSteps = [
  "We talk for an hour.",
  "You show us how you work today.",
  "We build your team.",
  "You approve the hires.",
  "We turn it on.",
];
