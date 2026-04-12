"use client";

import ScrollReveal from "@/components/ScrollReveal";

export default function PrivacyPageClient() {
  return (
    <main>
      {/* Hero — Dark */}
      <section style={{ position: "relative", overflow: "hidden", backgroundColor: "#0A0A0A" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "80px 24px" }}>
          <ScrollReveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 9999, backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", marginBottom: 32 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#F3D840" }} />
              <span style={{ color: "#F3D840", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
                Privacy Policy
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 style={{ color: "#FFFFFF", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
              Your data, your rights.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, lineHeight: 1.7 }}>
              We take your privacy seriously. This policy explains how Renewably collects, uses, and protects your personal data in compliance with GDPR and Irish data protection law.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 24 }}>
              Last updated: April 2026
            </p>
          </ScrollReveal>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: "linear-gradient(to top, white, transparent)", zIndex: 2, pointerEvents: "none" }} />
      </section>

      {/* Body Content */}
      <section style={{ backgroundColor: "#FFFFFF" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px" }}>
          <ScrollReveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
              {/* 1. Data Controller */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Data Controller</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                  The data controller responsible for your personal data is:
                </p>
                <div style={{ marginTop: 12, padding: 20, borderRadius: 12, backgroundColor: "#FFFDF5", borderLeft: "4px solid #F3D840" }}>
                  <p style={{ color: "#1A1A1A", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Renewably</p>
                  <p style={{ color: "#535353", fontSize: 14, lineHeight: 1.7 }}>
                    Registered in Ireland<br />
                    Email: hello@renewably.ie<br />
                    Phone: +353 873958424<br />
                    Website: renewably.ie
                  </p>
                </div>
              </div>

              {/* 2. Types of Data */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. Types of Data We Collect</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  We collect and process the following categories of personal data:
                </p>
                <h3 style={{ color: "#1A1A1A", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Personal Information</h3>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  When you use our services or contact us, we may collect your name, email address, phone number, company name, and job title. If you create a CRM account, we also store your login credentials (encrypted) and profile information.
                </p>
                <h3 style={{ color: "#1A1A1A", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Usage Data</h3>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  We automatically collect technical data when you interact with our platform, including your IP address, browser type, device information, pages visited, time spent on pages, and interaction patterns with our AI agents.
                </p>
                <h3 style={{ color: "#1A1A1A", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>CRM and Business Data</h3>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                  If you use our CRM dashboard, the data you input — including customer details, leads, job progress, grant applications, and communications — is stored securely. This data belongs to you; we process it only to provide the service.
                </p>
              </div>

              {/* 3. How Data Is Used */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. How We Use Your Data</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  We process your personal data for the following purposes:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>Service delivery:</strong> To provide and maintain our AI-as-a-Service platform, including CRM functionality, AI agent operations, and reporting dashboards.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>AI processing:</strong> To process your inputs through our AI agents (grant writing, permit applications, customer communications, reporting). Inputs may be sent to third-party AI providers (e.g. OpenAI) for processing. See Section 5 for details.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Communications:</strong> To respond to your enquiries, send service updates, provide weekly reports, and deliver marketing communications (only where you have consented).</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Platform improvement:</strong> To analyse usage patterns, improve our AI agents, and enhance the user experience.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Legal compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
                </ul>
              </div>

              {/* 4. Legal Basis */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>4. Legal Basis for Processing</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  Under Article 6 of the General Data Protection Regulation (GDPR), we process your data based on:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>Contract (Art. 6(1)(b)):</strong> Processing necessary to provide our services under your subscription agreement.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Consent (Art. 6(1)(a)):</strong> Where you have given explicit consent, such as for marketing communications or optional features.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Legitimate interest (Art. 6(1)(f)):</strong> For platform improvement, fraud prevention, and security monitoring.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Legal obligation (Art. 6(1)(c)):</strong> Where required by Irish or EU law.</li>
                </ul>
              </div>

              {/* 5. Data Sharing */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>5. Data Sharing</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  We may share your data with the following categories of third parties:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>AI providers:</strong> Inputs to our AI agents may be sent to providers such as OpenAI for processing. These providers process data under their own GDPR-compliant agreements. We do not use your data to train AI models.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Email and communication services:</strong> We use third-party services to send transactional and marketing emails on our behalf.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Analytics providers:</strong> We use anonymised analytics to understand platform usage and improve performance.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Hosting and infrastructure:</strong> Your data is stored on secure cloud infrastructure within the EU/EEA.</li>
                </ul>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
                  We will never sell your personal data to third parties.
                </p>
              </div>

              {/* 6. Data Retention */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>6. Data Retention</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  We retain your personal data only for as long as necessary:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>Active subscription data:</strong> Retained for the duration of your subscription.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>CRM business data:</strong> You retain full control. Upon cancellation, you may export your data within 30 days, after which it is securely deleted.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Usage and analytics data:</strong> Anonymised after 24 months.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Marketing consent records:</strong> Retained for 6 years from last interaction (as required by Irish law).</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Account data:</strong> Deleted within 90 days of account closure, unless retention is required by law.</li>
                </ul>
              </div>

              {/* 7. Your Rights */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>7. Your Rights</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  Under GDPR, you have the following rights regarding your personal data:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>Right of access (Art. 15):</strong> Request a copy of the personal data we hold about you.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Right to rectification (Art. 16):</strong> Request correction of inaccurate or incomplete data.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Right to erasure (Art. 17):</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;).</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Right to data portability (Art. 20):</strong> Receive your data in a structured, machine-readable format.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Right to object (Art. 21):</strong> Object to processing based on legitimate interests or for direct marketing.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Right to restrict processing (Art. 18):</strong> Request that we limit how we use your data.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Right to withdraw consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
                </ul>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
                  To exercise any of these rights, contact us at <a href="mailto:hello@renewably.ie" style={{ color: "#F3D840", fontWeight: 600 }}>hello@renewably.ie</a>. We will respond within 30 days as required by GDPR.
                </p>
              </div>

              {/* 8. Cookies */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>8. Cookies</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  Our platform uses cookies and similar tracking technologies:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>Essential cookies:</strong> Required for platform functionality, authentication, and security. These cannot be disabled.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Analytics cookies:</strong> Help us understand how visitors use our platform. Anonymised and aggregated.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Preference cookies:</strong> Remember your settings and preferences for a better experience.</li>
                </ul>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
                  You can manage your cookie preferences through your browser settings at any time.
                </p>
              </div>

              {/* 9. Data Security */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>9. Data Security</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                  We implement appropriate technical and organisational measures to protect your personal data, including encryption in transit (TLS 1.3) and at rest, access controls, regular security reviews, and secure infrastructure hosted within the EU/EEA. While no system is completely secure, we are committed to protecting your data to the highest standard.
                </p>
              </div>

              {/* 10. Contact */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>10. Contact Us</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  If you have any questions about this privacy policy or how we handle your data, please contact us:
                </p>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: "#FFFDF5", borderLeft: "4px solid #F3D840" }}>
                  <p style={{ color: "#1A1A1A", fontSize: 15, lineHeight: 1.8 }}>
                    <strong>Email:</strong> <a href="mailto:hello@renewably.ie" style={{ color: "#F3D840", fontWeight: 600 }}>hello@renewably.ie</a><br />
                    <strong>Phone:</strong> <a href="tel:+353873958424" style={{ color: "#F3D840", fontWeight: 600 }}>+353 873958424</a><br />
                    <strong>Data Protection Officer:</strong> You may also contact the Data Protection Commission (DPC) at <span style={{ color: "#F3D840", fontWeight: 600 }}>dataprotection.ie</span> if you believe your data protection rights have been violated.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
