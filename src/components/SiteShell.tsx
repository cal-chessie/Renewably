"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import CookieBanner from "@/components/CookieBanner";
import ExitIntentPopup from "@/components/ExitIntentPopup";

/**
 * Wraps every page with the shared Header + ChatWidget.
 * Lives in the root layout so it's guaranteed consistent across all routes.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ChatWidget />
      <CookieBanner />
      <ExitIntentPopup />
    </>
  );
}
