"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Wraps every page with the shared Header + Footer.
 * Lives in the root layout so it's guaranteed consistent across all routes.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
