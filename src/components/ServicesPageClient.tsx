"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";

const services = [
  {
    id: "ai-sales-agents",
    title: "AI Sales Agents",
    desc: "Autonomous AI agents that prospect, qualify, and nurture leads across multiple channels. They identify buying signals, engage prospects with personalised outreach, and route hot leads to your sales team with full context and timing.",
    features: ["Automated prospecting", "Lead qualification scoring", "Multi-channel outreach", "Smart lead routing"],
    image: "/crm-illustration.png",
  },
  {
    id: "marketing-automation",
    title: "Marketing Automation",
    desc: "End-to-end campaign automation across email, social media, paid ads, and SMS. Our AI generates creative, tests variations, and optimises every campaign in real-time based on performance data and audience behaviour.",
    features: ["AI content generation", "Multi-channel campaigns", "Real-time optimisation", "Audience segmentation"],
    image: "/system-illustration.png",
  },
  {
    id: "intelligent-lead-generation",
    title: "Intelligent Lead Generation",
    desc: "AI-powered prospecting that identifies and engages your ideal customers before your competitors do. We analyse market signals, company data, and behavioural patterns to find high-intent buyers actively looking for solutions like yours.",
    features: ["Intent signal detection", "Lookalike audience building", "Predictive lead scoring", "Automated enrichment"],
    image: "/funnel-illustration.png",
  },
  {
    id: "workflow-automation",
    title: "Workflow Automation",
    desc: "Automated sequences for follow-ups, task assignments, approvals, notifications, and cross-team handoffs that eliminate manual bottlenecks. When a lead moves stages, every downstream action triggers automatically.",
    features: ["Trigger-based workflows", "Cross-system automation", "Conditional logic rules", "SLA management"],
    image: "/system-illustration.png",
  },
  {
    id: "revenue-intelligence",
    title: "Revenue Intelligence",
    desc: "Real-time dashboards and predictive analytics tracking every metric from first touch to closed-won. Our AI spots trends, forecasts revenue, and surfaces the insights your team needs to make better decisions faster.",
    features: ["Predictive forecasting", "Pipeline health scoring", "ROI attribution", "Custom dashboards"],
    image: "/ai-illustration.png",
  },
  {
    id: "ai-platform-crm",
    title: "AI Platform + CRM Integration",
    desc: "We build a unified AI platform where every system talks to every other system. Leads, contacts, deals, emails, calls, and campaigns are all connected — giving your AI agents full context and your team complete visibility.",
    features: ["Bi-directional CRM sync", "Unified contact profiles", "AI-powered insights", "Custom API integrations"],
    image: "/crm-illustration.png",
  },
];

export default function ServicesPageClient() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Banner */}
        <section className="bg-[#F3D840] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <p className="text-[#374151] font-semibold text-sm tracking-wider uppercase mb-3">Our Services</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-6">
                AI Systems That Drive Revenue, On Autopilot
              </h1>
              <p className="text-[#535353] text-lg max-w-2xl mx-auto leading-relaxed">
                A fully managed AI as a Service platform that deploys autonomous agents across your sales, marketing, and operations — powered by machine learning and built for growth.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Services Detail */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            {services.map((service, idx) => (
              <ScrollReveal key={service.id}>
                <div id={service.id} className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="w-12 h-12 rounded-lg bg-[#F3D840] flex items-center justify-center mb-4">
                      <span className="text-[#374151] font-bold text-lg">{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-4">{service.title}</h2>
                    <p className="text-[#535353] leading-relaxed mb-6">{service.desc}</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[#535353]">
                          <svg className="w-4 h-4 text-[#374151] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                    <Image
                      src={service.image}
                      alt={`${service.title} illustration`}
                      width={672}
                      height={384}
                      className="w-full rounded-2xl shadow-lg"
                    />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#F3D840] py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Let&apos;s Build Your AI Stack</h2>
              <p className="text-[#374151] mb-8 leading-relaxed">
                Every business is unique. Book a call to discuss how we can design and deploy an AI system tailored to your sales process, marketing goals, and growth targets.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] hover:bg-[#374151] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
                Book a Strategy Call
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
