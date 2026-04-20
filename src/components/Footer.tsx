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
              src="/logo-white.png"
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
              {/* Facebook */}
              <a
                href="https://facebook.com/renewably"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
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
                <svg width="18" height="18" fill={FAINT_TEXT} viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com/renewably"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
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
                <svg width="18" height="18" fill={FAINT_TEXT} viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
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
