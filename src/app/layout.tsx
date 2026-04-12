import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import LoadingScreen from "@/components/LoadingScreen";
import CustomCursor from "@/components/CustomCursor";
import SiteShell from "@/components/SiteShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const siteConfig = {
  name: "Renewably",
  description: "AI workforce for solar installers in Ireland. Renewably deploys AI employees that handle grants, permits, customer support, and logistics — so you can focus on installing.",
  url: "https://renewably.ie",
  phone: "+353 873958424",
  email: "hello@renewably.ie",
  locale: "en_IE",
  type: "website",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — AI Workforce for Solar Installers`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "AI workforce Ireland",
    "AI solar installers",
    "solar grant automation",
    "ESB permit tracking",
    "AI customer support solar",
    "solar operations AI",
    "AI site assessment",
    "solar logistics automation",
    "SEAI grant AI",
    "solar installer AI Ireland",
  ],
  authors: [{ name: "Renewably", url: siteConfig.url }],
  creator: "Renewably",
  publisher: "Renewably",
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — AI as a Service for Sales, Marketing & Automation`,
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
    title: `${siteConfig.name} — AI as a Service for Sales, Marketing & Automation`,
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
      <body className={`${poppins.variable} ${poppins.className} min-h-screen`}>
        <LoadingScreen />
        <CustomCursor />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
