import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteConfig = {
  name: "Renewably",
  description: "Ireland's leading digital marketing agency for renewable energy brands. We deliver qualified leads through AI-powered campaigns, smart bidding, and conversion-optimised systems.",
  url: "https://renewably.ie",
  phone: "+353 873958424",
  email: "cal@renewably.ie",
  locale: "en_IE",
  type: "website",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Leads as a Service for Renewable Energy Brands`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "digital marketing Ireland",
    "lead generation renewable energy",
    "paid media management",
    "Google Ads Ireland",
    "renewable energy marketing",
    "customer acquisition",
    "Leads as a Service",
    "AI-powered marketing",
    "conversion rate optimisation Ireland",
    "search marketing Ireland",
  ],
  authors: [{ name: "Renewably", url: siteConfig.url }],
  creator: "Renewably",
  publisher: "Renewably",
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Leads as a Service for Renewable Energy Brands`,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Leads as a Service for Renewable Energy Brands`,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Renewably",
          url: siteConfig.url,
          logo: `${siteConfig.url}/logo.png`,
          description: siteConfig.description,
          telephone: siteConfig.phone,
          email: siteConfig.email,
          address: {
            "@type": "PostalAddress",
            addressCountry: "IE",
          },
          sameAs: [
            "https://www.facebook.com/renewably",
            "https://www.instagram.com/renewably",
          ],
          contactPoint: {
            "@type": "ContactPoint",
            telephone: siteConfig.phone,
            contactType: "sales",
            email: siteConfig.email,
            availableLanguage: ["English"],
          },
        }),
      }}
    />
  );
}

function WebSiteSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Renewably",
          url: siteConfig.url,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteConfig.url}/blog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }),
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className={`${inter.variable} ${inter.className} min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
