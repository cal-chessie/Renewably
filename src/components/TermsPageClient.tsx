"use client";

import ScrollReveal from "@/components/ScrollReveal";

export default function TermsPageClient() {
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
                Terms of Service
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 style={{ color: "#FFFFFF", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
              The rules of engagement.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, lineHeight: 1.7 }}>
              These terms govern your use of Renewably&apos;s AI-as-a-Service platform. By subscribing, you agree to these terms in full.
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
              {/* 1. Service Description */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Service Description</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                  Renewably provides an AI-as-a-Service platform designed specifically for solar PV installers operating in Ireland. Our service deploys AI agents that perform operational tasks including grant application management, permit processing, customer support, logistics coordination, quality assurance, and reporting. The platform includes a CRM dashboard, calendar integration, email integration, and WhatsApp integration. All services are delivered through our web-based platform and associated integrations.
                </p>
              </div>

              {/* 2. Subscription Terms */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. Subscription Terms</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  Our subscription is structured as follows:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>Monthly subscription:</strong> €1,000 to €1,500 per month (VAT exclusive), depending on team size and the number of AI agents deployed.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>One-time setup fee:</strong> A one-off setup fee applies for initial configuration, integration setup, and team onboarding. The amount is confirmed before signing.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>AI usage costs:</strong> You are responsible for the cost of AI model usage (e.g. OpenAI API calls). These costs are paid directly to the AI provider. Renewably does not mark up or intermediate these charges.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Billing cycle:</strong> Monthly, billed in advance. Invoiced via email with payment due within 14 days unless otherwise agreed.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>No long-term contract:</strong> Subscriptions operate on a month-to-month basis. You may cancel at any time with notice before the next billing cycle.</li>
                </ul>
              </div>

              {/* 3. Acceptable Use */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. Acceptable Use</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  You agree to use our platform only for lawful purposes related to your solar PV installation business. You must not:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li>Use the platform for any purpose other than operating a legitimate solar PV installation business.</li>
                  <li>Input false, misleading, or defamatory information into the system.</li>
                  <li>Attempt to reverse-engineer, decompile, or disrupt the platform or its AI agents.</li>
                  <li>Share your account credentials with unauthorised third parties.</li>
                  <li>Use the platform to generate spam, unsolicited communications, or content that violates any applicable law.</li>
                  <li>Misrepresent AI-generated outputs as professional legal, financial, or engineering advice.</li>
                </ul>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
                  We reserve the right to suspend or terminate your account if you breach these terms.
                </p>
              </div>

              {/* 4. AI Output Disclaimer */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>4. AI Output Disclaimer</h2>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: "#FFFDF5", borderLeft: "4px solid #F3D840", marginBottom: 16 }}>
                  <p style={{ color: "#1A1A1A", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Important notice</p>
                  <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                    Outputs generated by our AI agents are provided for operational assistance only. They do not constitute legal advice, financial advice, engineering certification, or regulatory guidance. All AI-generated documents, communications, and recommendations must be reviewed and approved by a qualified professional before use. Renewably accepts no liability for decisions made based solely on AI-generated outputs.
                  </p>
                </div>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                  You are solely responsible for verifying the accuracy and completeness of any AI-generated content before submitting it to third parties, including SEAI, ESB Networks, local authorities, or customers.
                </p>
              </div>

              {/* 5. Intellectual Property */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>5. Intellectual Property</h2>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>Platform and AI agents:</strong> The Renewably platform, including its software, AI agent configurations, branding, and documentation, remains the intellectual property of Renewably.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Your data:</strong> All business data you input into the platform — including customer information, job details, and communications — remains your property. You retain full ownership at all times.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>AI-generated outputs:</strong> Outputs generated by our AI agents based on your inputs are owned by you and licensed to you for business use.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Restrictions:</strong> You may not copy, modify, redistribute, or resell access to the Renewably platform or its AI agents.</li>
                </ul>
              </div>

              {/* 6. Data Protection */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>6. Data Protection</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                  Your privacy is important to us. Our collection, processing, and storage of personal data is governed by our <a href="/privacy" style={{ color: "#F3D840", fontWeight: 600 }}>Privacy Policy</a>, which forms part of these terms. By using our platform, you acknowledge that you have read and agree to our Privacy Policy. We process data in compliance with the General Data Protection Regulation (GDPR) and Irish data protection law.
                </p>
              </div>

              {/* 7. Limitation of Liability */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>7. Limitation of Liability</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  To the fullest extent permitted by Irish law:
                </p>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li>Renewably provides the platform &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to merchantability and fitness for a particular purpose.</li>
                  <li>Renewably shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.</li>
                  <li>Our total liability for any claim arising from or related to these terms shall not exceed the total subscription fees paid by you in the 12 months preceding the claim.</li>
                  <li>Renewably is not liable for any loss resulting from AI-generated outputs, including but not limited to rejected grant applications, delayed permits, or customer complaints.</li>
                  <li>Renewably is not liable for any service interruptions, downtime, or data loss caused by third-party AI providers, hosting infrastructure, or force majeure events.</li>
                </ul>
              </div>

              {/* 8. Termination */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>8. Termination</h2>
                <ul style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong style={{ color: "#1A1A1A" }}>By you:</strong> You may cancel your subscription at any time by providing written notice to hello@renewably.ie. Your access continues until the end of the current billing period. Upon cancellation, you have 30 days to export your data.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>By Renewably:</strong> We may suspend or terminate your account immediately if you breach these terms, engage in fraudulent activity, or use the platform in a way that causes harm to Renewably or third parties.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>Data after termination:</strong> Following termination, your data will be retained for 30 days to allow export. After this period, all data is permanently and securely deleted, unless retention is required by law.</li>
                  <li><strong style={{ color: "#1A1A1A" }}>No penalties:</strong> There are no cancellation fees, early termination charges, or lock-in penalties.</li>
                </ul>
              </div>

              {/* 9. Governing Law */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>9. Governing Law</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                  These terms are governed by and construed in accordance with the laws of the Republic of Ireland. Any disputes arising from or related to these terms shall be subject to the exclusive jurisdiction of the Irish courts. Both parties agree to attempt to resolve disputes through good-faith negotiation before initiating legal proceedings.
                </p>
              </div>

              {/* 10. Changes to Terms */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>10. Changes to These Terms</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8 }}>
                  We may update these terms from time to time. Material changes will be communicated to you by email at least 30 days before they take effect. Continued use of the platform after changes take effect constitutes acceptance of the revised terms. The most current version is always available at renewably.ie/terms.
                </p>
              </div>

              {/* 11. Contact */}
              <div>
                <h2 style={{ color: "#1A1A1A", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>11. Contact Us</h2>
                <p style={{ color: "#535353", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  If you have any questions about these terms, please contact us:
                </p>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: "#FFFDF5", borderLeft: "4px solid #F3D840" }}>
                  <p style={{ color: "#1A1A1A", fontSize: 15, lineHeight: 1.8 }}>
                    <strong>Renewably</strong><br />
                    <strong>Email:</strong> <a href="mailto:hello@renewably.ie" style={{ color: "#F3D840", fontWeight: 600 }}>hello@renewably.ie</a><br />
                    <strong>Phone:</strong> <a href="tel:+353873958424" style={{ color: "#F3D840", fontWeight: 600 }}>+353 873958424</a><br />
                    <strong>Website:</strong> renewably.ie
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
