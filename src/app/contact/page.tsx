import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";

export const metadata: Metadata = {
  title: "Contact — Book a Free AI Strategy Call",
  description: "Get in touch with Renewably to discover how our AI as a Service platform can transform your sales, marketing, and operations. Book a free strategy call today.",
  alternates: { canonical: "https://renewably.ie/contact" },
};

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
          mainEntity: {
            "@type": "Organization",
            name: "Renewably",
            telephone: "+353 873958424",
            email: "cal@renewably.ie",
            contactType: "sales",
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
      <ContactPageClient />
    </>
  );
}
