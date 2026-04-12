import Link from "next/link";
import Image from "next/image";

const workforceLinks = [
  { label: "CEO Agent", href: "/workforce" },
  { label: "Operations Agent", href: "/workforce" },
  { label: "Customer Support Agent", href: "/workforce" },
  { label: "Grants Agent", href: "/workforce" },
  { label: "Permitting Agent", href: "/workforce" },
  { label: "QA Agent", href: "/workforce" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 64 }}>
          {/* Column 1: Logo & Description */}
          <div className="sm:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Image
                src="/logo-transparent.png"
                alt="Renewably"
                width={40}
                height={40}
                className="brightness-0 invert"
                style={{ objectFit: 'contain' }}
              />
              <span style={{ color: 'white', fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', marginLeft: 10, lineHeight: '40px' }}>
                Renewably
              </span>
            </Link>
            <p style={{ color: '#6B7280', maxWidth: 320, lineHeight: 1.7, fontSize: 14 }}>
              Ireland&apos;s leading AI workforce for solar installers. We deploy
              AI employees that handle grants, permits, customer support, and
              logistics — so you can focus on installing.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <a
                href="https://www.facebook.com/renewably"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg style={{ width: 16, height: 16, color: 'white' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/renewably"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg style={{ width: 16, height: 16, color: 'white' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://ie.linkedin.com/company/renewably"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg style={{ width: 16, height: 16, color: 'white' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Workforce */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ color: 'white', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Workforce
            </h3>
            {workforceLinks.map((link) => (
              <Link key={link.label} href={link.href} style={{ color: '#6B7280', fontSize: 14, lineHeight: 2.2 }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 style={{ color: 'white', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Company
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {companyLinks.map((link) => (
                <Link key={link.label} href={link.href} style={{ color: '#6B7280', fontSize: 14, lineHeight: 2.2 }}>
                  {link.label}
                </Link>
              ))}
            </div>

            <h3 style={{ color: 'white', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 36, marginBottom: 8 }}>
              Legal
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {legalLinks.map((link) => (
                <Link key={link.label} href={link.href} style={{ color: '#6B7280', fontSize: 14, lineHeight: 2.2 }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 4: Get In Touch */}
          <div>
            <h3 style={{ color: 'white', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Get In Touch
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <svg style={{ width: 20, height: 20, color: '#F3D840', marginTop: 2, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+353873958424" style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
                  +353 873958424
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <svg style={{ width: 20, height: 20, color: '#F3D840', marginTop: 2, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:hello@renewably.ie" style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
                  hello@renewably.ie
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <svg style={{ width: 20, height: 20, color: '#F3D840', marginTop: 2, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>Ireland</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ marginTop: 64, paddingTop: 40 }}>
          <p className="text-sm text-gray-500">
            &copy; 2026 Renewably. All rights reserved.
          </p>
          <p className="text-sm text-[#F3D840] font-medium">
            AI workforce for solar installers.
          </p>
        </div>
      </div>
    </footer>
  );
}
