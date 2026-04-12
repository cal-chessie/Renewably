import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";

export const metadata: Metadata = {
  title: "Contact — Let's Talk | Renewably",
  description:
    "Get in touch with Renewably. We deploy AI agents across your solar operations — customer support, grants, logistics, and more. Book a free strategy call. We reply within 24 hours.",
  alternates: { canonical: "https://renewably.ie/contact" },
  openGraph: {
    title: "Contact Renewably — Your AI Team Starts Here",
    description:
      "Tell us about your solar business. We will show you what your AI workforce looks like. Free strategy call. No commitment.",
    url: "https://renewably.ie/contact",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Contact Renewably" }],
    type: "website",
  },
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
          description:
            "Get in touch with Renewably to discuss AI workforce solutions for your solar installation business.",
          mainEntity: {
            "@type": "Organization",
            name: "Renewably",
            telephone: "+353 873958424",
            email: "hello@renewably.ie",
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
      <ContactPageClient />
    </>
  );
}
