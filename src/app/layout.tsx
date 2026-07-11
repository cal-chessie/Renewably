import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

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
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
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
    title: `${siteConfig.name} — AI Workforce for Solar Installers`,
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
    title: `${siteConfig.name} — AI Workforce for Solar Installers`,
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
    <html lang="en-IE" suppressHydrationWarning>
      <head>
        {/* Polyfill for framer-motion Turbopack compatibility — external file for CSP compliance */}
        <Script src="/scripts/polyfills.js" strategy="beforeInteractive" />
        <OrganizationSchema />
        <WebSiteSchema />
        {/* Critical inline CSS — ensures page is never unstyled even if Tailwind HMR fails */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
              html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
              body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #535353; background: #fff; -webkit-font-smoothing: antialiased; line-height: 1.6; }
              img { max-width: 100%; height: auto; display: block; }
              a { color: inherit; text-decoration: none; }
              .min-h-screen { min-height: 100vh; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .justify-center { justify-content: center; }
              .text-center { text-align: center; }
              .relative { position: relative; }
              .absolute { position: absolute; }
              .fixed { position: fixed; }
              .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
              .overflow-hidden { overflow: hidden; }
              .grid { display: grid; }
              .gap-4 { gap: 1rem; }
              .rounded-2xl { border-radius: 1rem; }
              .bg-\\[\\#0A0A0A\\] { background-color: #0A0A0A; }
              .bg-white { background-color: #fff; }
              .bg-\\[\\#F3D840\\] { background-color: #F3D840; }
              .bg-\\[\\#FFFDF5\\] { background-color: #FFFDF5; }
              .text-white { color: #fff; }
              .text-\\[\\#1A1A1A\\] { color: #1A1A1A; }
              .text-\\[\\#F3D840\\] { color: #F3D840; }
              .text-\\[\\#535353\\] { color: #535353; }
              .text-\\[\\#374151\\] { color: #374151; }
              .font-bold { font-weight: 700; }
              .font-extrabold { font-weight: 800; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-20 { padding-top: 5rem; padding-bottom: 5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mb-12 { margin-bottom: 3rem; }
              .mb-16 { margin-bottom: 4rem; }
              .max-w-4xl { max-width: 56rem; }
              .max-w-7xl { max-width: 80rem; }
              .hidden { display: none; }
              .pointer-events-none { pointer-events: none; }
              .z-\\[100\\] { z-index: 100; }
              .z-\\[200\\] { z-index: 200; }
              @media (min-width: 768px) { .md\\:py-28 { padding-top: 7rem; padding-bottom: 7rem; } .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .md\\:hidden { display: none; } .md\\:flex { display: flex; } .md\\:inline-flex { display: inline-flex; } }
              @media (min-width: 1024px) { .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .lg\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); } .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; } .lg\\:text-5xl { font-size: 3rem; } .lg\\:py-8 { padding-top: 2rem; padding-bottom: 2rem; } }
              .skip-link:focus { top: 8px !important; }
            `,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${poppins.className} min-h-screen`} suppressHydrationWarning>
        {/* Accessibility: Skip to main content link */}
        <a
          href="#main-content"
          style={{
            position: "absolute",
            top: -100,
            left: 16,
            zIndex: 9999,
            padding: "8px 16px",
            background: "#F3D840",
            color: "#1A1A1A",
            fontWeight: 700,
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
          }}
          className="skip-link"
        >
          Skip to main content
        </a>
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
