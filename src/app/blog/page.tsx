import type { Metadata } from "next";
import BlogPageClient from "@/components/BlogPageClient";
import { breadcrumb } from "@/lib/seo-schema";

const blogDescription = "Guides on AI automation for Irish solar installers.";

export const metadata: Metadata = {
  title: "Blog: AI Operations, Grants & Logistics for Irish Solar Installers",
  description:
    "Practical guides on AI-powered operations, SEAI grants, ESB permitting, logistics, customer support, and revenue forecasting. Written for solar companies doing 20+ jobs a month in Ireland.",
  alternates: { canonical: "https://renewably.ie/blog" },
  openGraph: {
    title: "Renewably Blog: Solar is Changing. Stay Ahead.",
    description:
      "Practical guides on AI operations, SEAI grants, ESB permitting, and more. Written for Irish solar installers.",
    url: "https://renewably.ie/blog",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably Blog" }],
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumb([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Renewably Blog",
            description: blogDescription,
            url: "https://renewably.ie/blog",
            isPartOf: { "@id": "https://renewably.ie/#website" },
          }),
        }}
      />
      <main id="main-content">
        <BlogPageClient />
      </main>
    </>
  );
}
