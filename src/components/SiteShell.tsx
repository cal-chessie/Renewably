"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

/**
 * Wraps every page with the shared Header + Footer + ChatWidget.
 * Lives in the root layout so it's guaranteed consistent across all routes.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ChatWidget />
    </>
  );
}
