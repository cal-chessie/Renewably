"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_KEY = "renewably_cookie_consent";

function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function storeConsent(prefs: ConsentPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
  // Dispatch a custom event so other scripts can react
  window.dispatchEvent(new CustomEvent("cookie-consent", { detail: prefs }));
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Only show if no consent has been given
    if (!getStoredConsent()) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const all: ConsentPreferences = { necessary: true, analytics: true, marketing: true };
    storeConsent(all);
    setIsVisible(false);
  };

  const rejectOptional = () => {
    const min: ConsentPreferences = { necessary: true, analytics: false, marketing: false };
    storeConsent(min);
    setIsVisible(false);
  };

  const saveCustom = () => {
    storeConsent(prefs);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            padding: "clamp(12px, 2vw, 16px)",
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              backgroundColor: "#fff",
              borderRadius: 16,
              boxShadow: "0 -4px 40px rgba(0,0,0,0.15)",
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {showCustomise ? (
              /* ========== CUSTOMISE VIEW ========== */
              <div style={{ padding: "clamp(20px, 3vw, 28px)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>
                    Cookie preferences
                  </h3>
                  <button
                    onClick={() => setShowCustomise(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "none",
                      backgroundColor: "#F3F4F6",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Back"
                  >
                    <svg width="16" height="16" fill="none" stroke="#535353" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Necessary */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      minWidth: 20,
                      borderRadius: 6,
                      backgroundColor: "#F3D840",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                    }}
                  >
                    <svg width="12" height="12" fill="none" stroke="#1A1A1A" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1A1A", marginBottom: 4 }}>Necessary</p>
                    <p style={{ fontSize: 13, color: "#535353", lineHeight: 1.5 }}>
                      Required for the website to function. Cannot be disabled.
                    </p>
                  </div>
                </div>

                {/* Analytics */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <button
                    onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}
                    style={{
                      width: 20,
                      height: 20,
                      minWidth: 20,
                      borderRadius: 6,
                      border: prefs.analytics ? "none" : "2px solid #D1D5DB",
                      backgroundColor: prefs.analytics ? "#F3D840" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                      padding: 0,
                      transition: "all 0.15s ease",
                    }}
                    role="checkbox"
                    aria-checked={prefs.analytics}
                    aria-label="Analytics cookies"
                  >
                    {prefs.analytics && (
                      <svg width="12" height="12" fill="none" stroke="#1A1A1A" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1A1A", marginBottom: 4 }}>Analytics</p>
                    <p style={{ fontSize: 13, color: "#535353", lineHeight: 1.5 }}>
                      Help us understand how visitors interact with the website. We use this to improve the experience.
                    </p>
                  </div>
                </div>

                {/* Marketing */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0" }}>
                  <button
                    onClick={() => setPrefs((p) => ({ ...p, marketing: !p.marketing }))}
                    style={{
                      width: 20,
                      height: 20,
                      minWidth: 20,
                      borderRadius: 6,
                      border: prefs.marketing ? "none" : "2px solid #D1D5DB",
                      backgroundColor: prefs.marketing ? "#F3D840" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                      padding: 0,
                      transition: "all 0.15s ease",
                    }}
                    role="checkbox"
                    aria-checked={prefs.marketing}
                    aria-label="Marketing cookies"
                  >
                    {prefs.marketing && (
                      <svg width="12" height="12" fill="none" stroke="#1A1A1A" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1A1A", marginBottom: 4 }}>Marketing</p>
                    <p style={{ fontSize: 13, color: "#535353", lineHeight: 1.5 }}>
                      Used to track visitors across websites for advertising purposes. We never sell your data.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button
                    onClick={rejectOptional}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 9999,
                      border: "1px solid #E5E7EB",
                      backgroundColor: "transparent",
                      color: "#535353",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Reject optional
                  </button>
                  <button
                    onClick={saveCustom}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 9999,
                      border: "none",
                      backgroundColor: "#F3D840",
                      color: "#1A1A1A",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 10px rgba(243,216,64,0.3)",
                    }}
                  >
                    Save preferences
                  </button>
                </div>
              </div>
            ) : (
              /* ========== DEFAULT VIEW ========== */
              <div style={{ padding: "clamp(20px, 3vw, 28px)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "clamp(12px, 2vw, 16px)", marginBottom: "clamp(16px, 2vw, 20px)" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      minWidth: 40,
                      borderRadius: 12,
                      backgroundColor: "#F3D840",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" fill="none" stroke="#1A1A1A" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "clamp(13px, 1.6vw, 15px)", color: "#1A1A1A", lineHeight: 1.6, margin: 0 }}>
                      We use cookies to improve your experience. By clicking "Accept all", you consent to our use of cookies.{" "}
                      <Link href="/privacy" style={{ color: "#1A1A1A", textDecoration: "underline", fontWeight: 600 }}>
                        Privacy policy
                      </Link>
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(8px, 1.5vw, 10px)", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setShowCustomise(true)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 9999,
                      border: "1px solid #E5E7EB",
                      backgroundColor: "transparent",
                      color: "#535353",
                      fontWeight: 600,
                      fontSize: "clamp(12px, 1.3vw, 13px)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Customise
                  </button>
                  <div style={{ display: "flex", gap: "clamp(8px, 1.5vw, 10px)" }}>
                    <button
                      onClick={rejectOptional}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 9999,
                        border: "1px solid #E5E7EB",
                        backgroundColor: "transparent",
                        color: "#535353",
                        fontWeight: 600,
                        fontSize: "clamp(12px, 1.3vw, 13px)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Reject optional
                    </button>
                    <button
                      onClick={acceptAll}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 9999,
                        border: "none",
                        backgroundColor: "#F3D840",
                        color: "#1A1A1A",
                        fontWeight: 700,
                        fontSize: "clamp(12px, 1.3vw, 13px)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 10px rgba(243,216,64,0.3)",
                      }}
                    >
                      Accept all
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
