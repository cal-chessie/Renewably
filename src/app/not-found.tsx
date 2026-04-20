"use client";

import Link from "next/link";

const YELLOW = "#F3D840";
const DARK = "#0A0A0A";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: DARK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "inherit",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        {/* 404 number */}
        <div
          style={{
            fontSize: "clamp(100px, 20vw, 160px)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            background: `linear-gradient(135deg, ${YELLOW} 0%, #FF9F1C 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          404
        </div>

        {/* Divider line */}
        <div
          style={{
            width: 60,
            height: 3,
            background: YELLOW,
            borderRadius: 2,
            margin: "0 auto 24px",
          }}
        />

        {/* Message */}
        <h1
          style={{
            color: "#FFF",
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: 700,
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(14px, 2.5vw, 16px)",
            lineHeight: 1.6,
            margin: "0 0 36px",
          }}
        >
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              background: YELLOW,
              color: DARK,
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 12,
              textDecoration: "none",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 4px 20px ${YELLOW}44`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <Link
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 12,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
