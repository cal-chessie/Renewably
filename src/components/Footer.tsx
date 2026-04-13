"use client";

import Link from "next/link";

const BRAND_YELLOW = "#F3D840";
const DARK = "#0A0A0A";
const LIGHT_TEXT = "rgba(255, 255, 255, 0.75)";
const FAINT_TEXT = "rgba(255, 255, 255, 0.45)";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Workforce", href: "/workforce" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Pricing", href: "/pricing" },
  { label: "Admin Portal", href: "/crm/login" },
];

const services = [
  "Customer Support",
  "Grants Management",
  "Operations",
  "Logistics",
];

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: DARK,
        color: LIGHT_TEXT,
        padding: "clamp(2rem, 5vw, 4rem) clamp(1.25rem, 5vw, 6rem)",
      }}
    >
      {/* Top section — 4-col grid on desktop, 2 on tablet, 1 on mobile */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "clamp(1.5rem, 4vw, 2.5rem)",
          maxWidth: 1200,
          margin: "0 auto",
        }}
        className="footer-grid"
      >
        {/* Brand column */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/logo-transparent.png"
              alt="Renewably logo"
              width={36}
              height={36}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <span
              style={{
                fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              Renewably
            </span>
          </div>
          <p
            style={{
              marginTop: 12,
              fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
              lineHeight: 1.6,
              maxWidth: 280,
              color: FAINT_TEXT,
            }}
          >
            AI-as-a-Service CRM purpose-built for Irish solar installers.
            Streamline your operations, manage grants, and grow your business.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3
            style={{
              fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Quick Links
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {quickLinks.map((link) => (
              <li key={link.href} className="footer-link-item" style={{ marginBottom: "0.5rem" }}>
                <Link
                  href={link.href}
                  style={{
                    fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
                    color: link.href.startsWith("/crm") ? "rgba(255, 255, 255, 0.35)" : LIGHT_TEXT,
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = BRAND_YELLOW;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = link.href.startsWith("/crm") ? "rgba(255, 255, 255, 0.35)" : LIGHT_TEXT;
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3
            style={{
              fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Services
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {services.map((service) => (
              <li
                key={service}
                style={{
                  marginBottom: "0.5rem",
                  fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
                  color: LIGHT_TEXT,
                }}
              >
                {service}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3
            style={{
              fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Contact
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <a
                href="mailto:hello@renewably.ie"
                className="footer-contact-link"
                style={{
                  fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
                  color: LIGHT_TEXT,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = BRAND_YELLOW;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = LIGHT_TEXT;
                }}
              >
                hello@renewably.ie
              </a>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <a
                href="tel:+353873958424"
                className="footer-contact-link"
                style={{
                  fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
                  color: LIGHT_TEXT,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = BRAND_YELLOW;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = LIGHT_TEXT;
                }}
              >
                +353 873958424
              </a>
            </li>
            <li
              style={{
                fontSize: "clamp(0.75rem, 1.2vw, 0.85rem)",
                color: FAINT_TEXT,
                marginTop: "0.5rem",
              }}
            >
              Mon–Fri 9am–6pm GMT
            </li>
            <li className="footer-social-row" style={{ display: "flex", gap: 12, marginTop: "0.75rem" }}>
              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(243,216,64,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                }}
              >
                <svg width="18" height="18" fill={FAINT_TEXT} viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065 2.063 0 01-2.063 2.065zm11.318 13.019H5.337V9h11.318v11.452z"/></svg>
              </a>
              {/* Twitter/X */}
              <a
                href="#"
                aria-label="X (Twitter)"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(243,216,64,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                }}
              >
                <svg width="16" height="16" fill={FAINT_TEXT} viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: 1200,
          margin: "clamp(1.5rem, 3vw, 2.5rem) auto 0",
          borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
          paddingTop: "clamp(1rem, 2vw, 1.5rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
        className="footer-bottom"
      >
        <span
          style={{
            fontSize: "clamp(0.7rem, 1.2vw, 0.8rem)",
            color: FAINT_TEXT,
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} Renewably. All rights reserved.
        </span>
        <div
          style={{
            display: "flex",
            gap: "clamp(0.75rem, 1.5vw, 1rem)",
            alignItems: "center",
          }}
        >
          <Link
            href="/privacy"
            style={{
              fontSize: "clamp(0.7rem, 1.2vw, 0.8rem)",
              color: FAINT_TEXT,
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = BRAND_YELLOW;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = FAINT_TEXT;
            }}
          >
            Privacy Policy
          </Link>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
          <Link
            href="/terms"
            style={{
              fontSize: "clamp(0.7rem, 1.2vw, 0.8rem)",
              color: FAINT_TEXT,
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = BRAND_YELLOW;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = FAINT_TEXT;
            }}
          >
            Terms of Service
          </Link>
        </div>
      </div>

      {/* Responsive overrides via a tiny style tag — no Tailwind, no external CSS */}
      <style>{`
        .footer-grid {
          grid-template-columns: 1fr !important;
        }
        @media (min-width: 640px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .footer-grid {
            grid-template-columns: 2fr 1fr 1fr 1fr !important;
          }
        }
        .footer-bottom {
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
        }
        @media (min-width: 640px) {
          .footer-bottom {
            flex-direction: row !important;
            justify-content: space-between !important;
            text-align: left !important;
          }
        }
        /* Very small screens: prevent awkward text wrapping in bottom bar */
        @media (max-width: 374px) {
          .footer-bottom > div {
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
        }
        /* Mobile: 44px minimum tap targets for accessibility */
        @media (max-width: 767px) {
          .footer-social-row a {
            width: 44px !important;
            height: 44px !important;
          }
          .footer-link-item a {
            display: block !important;
            padding: 10px 0 !important;
            font-size: 15px !important;
          }
          .footer-contact-link {
            display: block !important;
            padding: 10px 0 !important;
            font-size: 15px !important;
          }
        }
      `}</style>
    </footer>
  );
}
