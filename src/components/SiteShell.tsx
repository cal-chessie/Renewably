"use client";

import Header from "@/components/Header";
import ChatWidget from "@/components/ChatWidget";

/**
 * Wraps every page with the shared Header + ChatWidget.
 * Lives in the root layout so it's guaranteed consistent across all routes.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <ChatWidget />
    </>
  );
}
