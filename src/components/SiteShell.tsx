"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import CookieBanner from "@/components/CookieBanner";

// Lazy-load ExitIntentPopup only on public pages (not CRM)
// This avoids loading framer-motion overhead on CRM routes
const ExitIntentPopup = dynamic(
  () => import("@/components/ExitIntentPopup"),
  { ssr: false }
);

/**
 * Wraps every page with the shared Header + Footer + ChatWidget.
 * Lives in the root layout so it's guaranteed consistent across all routes.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCRMRoute = pathname.startsWith("/crm");

  return (
    <>
      <Header />
      {children}
      <Footer />
      <ChatWidget />
      <CookieBanner />
      {!isCRMRoute && <ExitIntentPopup />}
    </>
  );
}
