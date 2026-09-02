import type { Metadata } from "next";
import ServicesPageClient from "@/components/ServicesPageClient";
import { serviceList, breadcrumb } from "@/lib/seo-schema";
import servicesData from "@/data/services.json";

const pageTitle = "Services: AI Workforce for Solar PV Installers";
const pageDescription =
  "Renewably's AI agents for Irish solar installers: grants, ESB applications, support, logistics, operations, QA, reporting. Start with two, scale to eight.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "https://renewably.ie/services" },
  openGraph: {
    title: "Renewably Services: AI Agents for Irish Solar PV",
    description:
      "Grants, ESB applications, customer support, logistics, QA: 8 AI agents purpose-built for Irish solar installers.",
    url: "https://renewably.ie/services",
    siteName: "Renewably",
    locale: "en_IE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably Services" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
};

// Service catalogue for JSON-LD, pulled from the real agents in services.json.
const serviceCatalogue = servicesData
  .filter((service) => service.published)
  .map((service) => ({ name: service.title, description: service.description }));

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceList(serviceCatalogue)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumb([
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
            ])
          ),
        }}
      />
      <main id="main-content">
        <ServicesPageClient />
      </main>
    </>
  );
}
