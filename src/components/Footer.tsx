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
              <li key={link.href} style={{ marginBottom: "0.5rem" }}>
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
          © 2026 Renewably. All rights reserved.
        </span>
        <span
          style={{
            fontSize: "clamp(0.7rem, 1.2vw, 0.8rem)",
            color: FAINT_TEXT,
            textAlign: "center",
          }}
        >
          Built in Ireland.
        </span>
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
      `}</style>
    </footer>
  );
}
