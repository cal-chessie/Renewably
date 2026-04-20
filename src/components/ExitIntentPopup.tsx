"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // Only show on public pages (not CRM or API routes)
  const isPublicPage = !pathname.startsWith("/crm") && !pathname.startsWith("/api");

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (!isPublicPage) return;
      // Only fire when mouse leaves through the top of the viewport (desktop behaviour)
      if (e.clientY <= 0 && !sessionStorage.getItem("exit_intent_shown")) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        setIsOpen(true);
        sessionStorage.setItem("exit_intent_shown", "1");
      }
    },
    [isPublicPage]
  );

  useEffect(() => {
    if (!isPublicPage) return;

    // Don't add listener on mobile/touch devices
    if (typeof window !== "undefined" && !window.matchMedia("(hover: none)").matches) {
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }
  }, [handleMouseLeave, isPublicPage]);

  // Focus trap + Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        previousFocusRef.current?.focus();
        return;
      }

      // Focus trap: Tab / Shift+Tab cycles within the modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableSelectors =
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors);
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  // Reset sessionStorage flag when navigating (optional UX improvement)
  useEffect(() => {
    // Clear on navigation so exit intent can fire again on new page visits
  }, [pathname]);

  const close = useCallback(() => {
    setIsOpen(false);
    previousFocusRef.current?.focus();
  }, []);

  if (!isPublicPage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
          aria-describedby="exit-intent-desc"
        >
          {/* Backdrop */}
          <div
            onClick={close}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(10,10,10,0.7)",
              backdropFilter: "blur(8px)",
            }}
            aria-hidden="true"
          />

          {/* Card */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative",
              backgroundColor: "#fff",
              borderRadius: 20,
              maxWidth: 480,
              width: "100%",
              padding: "clamp(28px, 5vw, 40px)",
              textAlign: "center",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            {/* Yellow accent bar at top */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: "linear-gradient(90deg, #F3D840, #E5C832, #F3D840)",
              }}
              aria-hidden="true"
            />

            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={close}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                backgroundColor: "#F3F4F6",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s",
              }}
              aria-label="Close popup"
            >
              <svg width="16" height="16" fill="none" stroke="#535353" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: "#F3D840",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
              aria-hidden="true"
            >
              <svg width="24" height="24" fill="none" stroke="#1A1A1A" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            <h2
              id="exit-intent-title"
              style={{
                fontSize: "clamp(20px, 4vw, 26px)",
                fontWeight: 800,
                color: "#1A1A1A",
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              Before you go...
            </h2>

            <p
              id="exit-intent-desc"
              style={{
                fontSize: "clamp(14px, 2vw, 16px)",
                color: "#535353",
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Book a free 15-minute call. No commitment, no pitch. Just a conversation about your business and whether AI is the right fit.
            </p>

            {/* CTA buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <Link
                href="/contact"
                onClick={close}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "clamp(12px, 2vw, 14px) 24px",
                  borderRadius: 9999,
                  backgroundColor: "#F3D840",
                  color: "#1A1A1A",
                  fontWeight: 700,
                  fontSize: "clamp(14px, 1.5vw, 15px)",
                  letterSpacing: "0.01em",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 15px rgba(243,216,64,0.3)",
                }}
              >
                Book a 15-Minute Call
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <button
                onClick={close}
                style={{
                  padding: "10px 24px",
                  borderRadius: 9999,
                  border: "1px solid #E5E7EB",
                  backgroundColor: "transparent",
                  color: "#535353",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                No thanks, I&apos;ll keep browsing
              </button>
            </div>

            <p
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                marginTop: 16,
              }}
            >
              Free. No obligation. Takes 15 minutes.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
