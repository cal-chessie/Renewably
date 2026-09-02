import type { Metadata } from "next";
import AboutPageClient from "@/components/AboutPageClient";
import { breadcrumb, howTo } from "@/lib/seo-schema";

const pageTitle = "About: AI Workforce for Solar Installers in Ireland";
const pageDescription =
  "Renewably deploys 8 AI employees across your solar operations: grants, ESB applications, customer support, logistics, QA, and reporting. Based in Ireland. Built for solar installers.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "https://renewably.ie/about" },
  openGraph: {
    title: "About Renewably: The AI Workforce for Irish Solar Installers",
    description:
      "We built the team you can't find. Eight AI agents live, ninth coming soon. Built for Irish solar companies doing 20+ jobs a month.",
    url: "https://renewably.ie/about",
    siteName: "Renewably",
    locale: "en_IE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably About" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
};

function AboutSchema() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumb([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            howTo("How Renewably builds your AI workforce", [
              {
                name: "Have a conversation",
                text: "We talk for an hour. You show us how you work today.",
              },
              {
                name: "We build your team",
                text: "We build your team of AI agents for your solar operations.",
              },
              {
                name: "You approve the hires",
                text: "You approve the hires. You set every budget. You review every strategy.",
              },
              {
                name: "We turn it on",
                text: "We turn it on. That is the entire process.",
              },
            ])
          ),
        }}
      />
    </>
  );
}

export default function AboutPage() {
  return (
    <>
      <AboutSchema />
      <main id="main-content">
        <AboutPageClient />
      </main>
    </>
  );
}
