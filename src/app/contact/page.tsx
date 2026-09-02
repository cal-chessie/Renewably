import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";
import { faqPage, breadcrumb } from "@/lib/seo-schema";

const pageTitle = "Contact: Let's Talk";
const pageDescription =
  "Talk to Renewably about the AI workforce for your Irish solar business. Book a free strategy call and see your team. We reply within 24 hours.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "https://renewably.ie/contact" },
  openGraph: {
    title: "Contact Renewably: Your AI Team Starts Here",
    description:
      "Tell us about your solar business. We will show you what your AI workforce looks like. Free strategy call. No commitment.",
    url: "https://renewably.ie/contact",
    siteName: "Renewably",
    locale: "en_IE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Contact Renewably" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
};

// Real FAQ copy mirrored from ContactPageClient so the FAQPage schema matches
// exactly what renders on the page.
const contactFaqs = [
  { q: "Is there any commitment or contract?", a: "No. We operate month-to-month. There is no lock-in, no minimum term, and no cancellation penalty. You can cancel anytime. We believe our service should earn your business every single month." },
  { q: "How much does it cost?", a: "Monthly plans start at EUR 1,000. Your full workforce is eight agents, and you start with the two that move the needle first, adding the rest as your operation proves out and strengthens. Pricing scales with the number of agents deployed, up to EUR 1,500. There is a one-time setup fee. You bring your own AI API keys and pay model providers directly, typically EUR 50-200 per month. No markup from us." },
  { q: "How quickly can I get set up?", a: "It starts with a 15 minute call. If it fits, we scope your build properly, configuration takes 2-3 days, and we run a testing period before going live. Most installers are fully operational within one to two weeks. We do not rush." },
  { q: "Will this work for my size of operation?", a: "We work with solar installers doing anywhere from 5 to 100+ installs per month. The AI workforce scales with you. Whether you are a one-man band or a 20-person crew, we build your team to match your volume." },
  { q: "What integrations do you support?", a: "We integrate with your existing CRM, email (Gmail, Outlook), calendar (Google Calendar, Outlook), phone system, and project management tools. Your CRM stays yours. Nothing to migrate." },
  { q: "Is my data secure?", a: "Absolutely. All data is encrypted at rest and in transit. We are fully GDPR-compliant, based in Ireland, and never share your data with third parties. You can request data deletion at any time." },
];

function ContactSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Renewably",
          url: "https://renewably.ie/contact",
          description:
            "Get in touch with Renewably to discuss AI workforce solutions for your solar installation business.",
          mainEntity: {
            "@type": "Organization",
            name: "Renewably",
            telephone: "+353 873958424",
            email: "cal@renewably.ie",
            contactType: "sales",
            areaServed: "IE",
          },
        }),
      }}
    />
  );
}

export default function ContactPage() {
  return (
    <>
      <ContactSchema />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage(contactFaqs.map((f) => ({ q: f.q, a: f.a })))) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumb([
              { name: "Home", path: "/" },
              { name: "Contact", path: "/contact" },
            ]),
          ),
        }}
      />
      <main id="main-content">
        <ContactPageClient />
      </main>
    </>
  );
}
