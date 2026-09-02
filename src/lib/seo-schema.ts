/**
 * Shared JSON-LD builders so every page emits consistent, correct structured
 * data for search and AI engines. One source of truth for the entity, the
 * service catalogue, pricing, FAQs, breadcrumbs and how-to steps.
 */

export const SITE = {
  name: "Renewably",
  url: "https://renewably.ie",
  phone: "+353873958424",
  email: "cal@renewably.ie",
  logo: "https://renewably.ie/logo.png",
} as const;

type Json = Record<string, unknown>;

/** ProfessionalService (a LocalBusiness) entity node, id-linked so other nodes reference it. */
export function professionalService(): Json {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: SITE.logo,
    image: `${SITE.url}/og-image.png`,
    description:
      "An AI workforce for solar PV installers in Ireland. Renewably deploys AI agents that run the front and back office: enquiries and lead follow-up, SEAI grant paperwork, ESB Networks grid applications, logistics and reporting.",
    telephone: SITE.phone,
    email: SITE.email,
    priceRange: "€€",
    areaServed: { "@type": "Country", name: "Ireland" },
    address: { "@type": "PostalAddress", addressCountry: "IE" },
    knowsAbout: [
      "Solar PV installation",
      "SEAI solar grants",
      "ESB Networks grid connection (NC6)",
      "AI automation for solar installers",
    ],
    sameAs: [
      "https://www.facebook.com/Renewably.ie/",
      "https://www.instagram.com/renewablyhq/",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      email: SITE.email,
      contactType: "sales",
      areaServed: "IE",
      availableLanguage: ["English"],
    },
  };
}

/** BreadcrumbList from ordered { name, path } items (path relative to root). */
export function breadcrumb(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}

/** FAQPage from question/answer pairs. */
export function faqPage(faqs: { q: string; a: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** ItemList of the AI agents as Service offerings, tied to the org as provider. */
export function serviceList(services: { name: string; description: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        serviceType: "AI automation for solar installers",
        provider: { "@id": `${SITE.url}/#organization` },
        areaServed: { "@type": "Country", name: "Ireland" },
      },
    })),
  };
}

/** The monthly service Offer with a price range. */
export function offer(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: "Renewably AI workforce",
    description: "Managed monthly AI workforce for Irish solar installers. No lock-in.",
    priceSpecification: {
      "@type": "PriceSpecification",
      minPrice: 1000,
      maxPrice: 1500,
      priceCurrency: "EUR",
      valueAddedTaxIncluded: false,
      unitText: "MONTH",
    },
    availability: "https://schema.org/InStock",
    seller: { "@id": `${SITE.url}/#organization` },
  };
}

/** HowTo for a short ordered process (e.g. how it starts). */
export function howTo(name: string, steps: { name: string; text: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}
