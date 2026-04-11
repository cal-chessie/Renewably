"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";

const barriers = [
  { title: "The Lead Generation Ceiling", desc: "Manual prospecting doesn't scale. Your sales team spends 70% of their time on research and outreach instead of actually selling. Our AI agents handle the entire top of funnel — so your team only talks to qualified buyers." },
  { title: "The Follow-Up Gap", desc: "80% of sales require five or more follow-ups, but 44% of reps give up after one. Our Automation Agent ensures every lead gets the right touchpoint at the right time — automatically, persistently, and intelligently." },
  { title: "The Data Overload Problem", desc: "Teams drown in dashboards but starve for insights. Our Analytics Agent cuts through the noise to deliver clear, actionable intelligence about what's working, what's not, and where your next revenue opportunity is." },
  { title: "The Integration Nightmare", desc: "CRM, email, ads, phone — your tools don't talk to each other. We build a unified AI platform where every system, every data point, and every workflow is connected and optimised as one." },
];

const values = [
  { title: "AI-First", desc: "We believe every business process can be enhanced by intelligent automation. We lead with AI, not bolt it on as an afterthought." },
  { title: "Revenue-Driven", desc: "Technology is only valuable if it drives measurable business outcomes. Every system we build is optimised for pipeline growth and revenue." },
  { title: "Transparent", desc: "Full visibility into system performance, costs, and results. You'll always know exactly what your AI agents are doing and the value they're delivering." },
  { title: "Partner-Led", desc: "We succeed when you succeed. Our team is embedded in your goals, deeply understanding your business and continuously optimising for better results." },
];

export default function AboutPageClient() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Banner */}
        <section className="bg-[#F3D840] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <p className="text-[#374151] font-semibold text-sm tracking-wider uppercase mb-3">About Us</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-6">
                AI-Powered Growth Systems, Built for Ambitious Teams
              </h1>
              <p className="text-[#535353] text-lg max-w-2xl mx-auto leading-relaxed">
                Renewably builds and operates fully managed AI systems that automate sales, marketing, and operations — helping businesses scale revenue without scaling headcount.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Founder / Our Story Section */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <ScrollReveal direction="left">
                <Image
                  src="/founder-photo.png"
                  alt="Renewably founder"
                  width={432}
                  height={576}
                  className="w-full max-w-sm mx-auto rounded-2xl shadow-xl"
                />
              </ScrollReveal>
              <ScrollReveal direction="right">
                <div>
                  <p className="text-[#374151] font-semibold text-sm tracking-wider uppercase mb-3">Our Story</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-6">
                    From Marketing Agency to AI Powerhouse
                  </h2>
                  <p className="text-[#535353] leading-relaxed mb-4">
                    Founded with a mission to make cutting-edge AI accessible to growing businesses, Renewably has evolved from a traditional digital marketing agency into Ireland&apos;s leading AI as a Service provider. We saw the future of business growth — and it&apos;s autonomous, intelligent, and always-on.
                  </p>
                  <p className="text-[#535353] leading-relaxed mb-6">
                    Our team combines deep expertise in AI engineering, sales strategy, marketing automation, and the practical realities of scaling a business. We don&apos;t just deploy technology — we build AI systems that understand your market, your customers, and your goals.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* The Problems We Solve */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <ScrollReveal>
                <div>
                  <h2 className="text-3xl font-bold text-[#1A1A1A] mb-8">The Problems We Solve</h2>
                  <div className="space-y-6">
                    {barriers.map((item, i) => (
                      <ScrollReveal key={item.title} delay={i * 0.1}>
                        <div className="p-6 rounded-xl bg-[#FAFAFA] border border-gray-100 hover:border-[#F3D840] transition-colors">
                          <h3 className="font-semibold text-[#1A1A1A] mb-2">{item.title}</h3>
                          <p className="text-[#535353] text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right" delay={0.2}>
                <div>
                  <h2 className="text-3xl font-bold text-[#1A1A1A] mb-8">What We Stand For</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {values.map((v, i) => (
                      <ScrollReveal key={v.title} delay={i * 0.1}>
                        <div className="p-6 rounded-xl border-2 border-[#F3D840] bg-[#FAFAFA] hover:shadow-md transition-shadow">
                          <h3 className="font-semibold text-[#374151] mb-2">{v.title}</h3>
                          <p className="text-[#535353] text-sm leading-relaxed">{v.desc}</p>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#F3D840] py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Ready to Transform Your Operations?</h2>
              <p className="text-[#374151] mb-8 leading-relaxed">
                Let us show you how AI agents can automate your sales pipeline, supercharge your marketing, and free your team to focus on closing deals.
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
