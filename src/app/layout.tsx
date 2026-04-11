import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import LoadingScreen from "@/components/LoadingScreen";
import CustomCursor from "@/components/CustomCursor";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const siteConfig = {
  name: "Renewably",
  description: "AI as a Service for sales, marketing, and automation. Renewably deploys autonomous AI agents, intelligent systems, and workflow automations that transform how businesses find, nurture, and close customers.",
  url: "https://renewably.ie",
  phone: "+353 873958424",
  email: "cal@renewably.ie",
  locale: "en_IE",
  type: "website",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — AI as a Service for Sales, Marketing & Automation`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "AI as a Service Ireland",
    "AI sales agents",
    "marketing automation",
    "AI lead generation",
    "workflow automation",
    "AI-powered CRM",
    "sales automation",
    "revenue intelligence",
    "AI marketing agency",
    "business automation Ireland",
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
        {children}
      </body>
    </html>
  );
}
