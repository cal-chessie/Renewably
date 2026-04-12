"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";

const problems = [
  {
    title: "The Staffing Ceiling",
    desc: "You have more work than people. Every installer in Ireland knows this. Electricians are booked out. Admin staff don't stay. Project managers burn out. You can't hire fast enough to keep up with demand, and every time you lose someone, you lose months of knowledge and relationships.",
  },
  {
    title: "The Admin Trap",
    desc: "Grant applications. ESB paperwork. Customer follow-ups. Equipment ordering. Permit chasing. You started a solar company because you know how to install panels. Instead, you spend half your week on tasks that have nothing to do with installation. That's not what you signed up for.",
  },
  {
    title: "The Lead Leakage",
    desc: "A customer submits an enquiry at nine on a Tuesday night. You see it at eight the next morning. They've already called three other installers. One answered at seven. They booked with them. You lost a deal not because you're bad. Because you were asleep.",
  },
  {
    title: "The Visibility Problem",
    desc: "Where is every job right now? Which grants are approved? Which permits are stuck? Which customer hasn't heard from you in two weeks? You don't know. Your spreadsheets don't know. Your WhatsApp groups don't know. Nobody knows. That's not a system. That's chaos.",
  },
];

const values = [
  {
    title: "Built for Solar",
    desc: "We don't build generic AI tools. Every agent we deploy is trained on Irish solar operations. SEAI grants. ESB permits. Irish building regulations. Irish weather patterns. We know your industry because we work in your industry.",
  },
  {
    title: "Managed, Not Self-Service",
    desc: "You don't install software. You don't configure APIs. You don't learn a new system. We deploy the agents. We manage them. We report to you weekly. You review. You approve. You manage the team. That's it.",
  },
  {
    title: "Results, Not Promises",
    desc: "We track everything. Response times. Approval rates. Install velocity. Customer satisfaction. Every metric is visible in your dashboard. You see exactly what your AI workforce is doing and what value it's delivering. Always.",
  },
  {
    title: "Grows With You",
    desc: "Start with three agents. Add two more next quarter. Build out the full team over six months. Every agent is independent. You can cancel any agent anytime. No contracts. No lock-in. The team scales with your business.",
  },
];

export default function AboutPageClient() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero — Dark */}
        <section className="relative overflow-hidden bg-[#0A0A0A]">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Image */}
              <ScrollReveal>
                <div className="relative max-w-md mx-auto lg:mx-0">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/founder-photo.png"
                      alt="Renewably founder"
                      width={432}
                      height={576}
                      className="w-full object-cover"
                      priority
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F3D840]/50 to-transparent" />
                  </div>
                </div>
              </ScrollReveal>

              {/* Right: Copy */}
              <div>
                <ScrollReveal>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
                    <span className="w-2 h-2 rounded-full bg-[#F3D840] animate-pulse" />
                    <span className="text-[#F3D840] text-xs sm:text-sm font-bold tracking-wide">
                      About Us
                    </span>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                    We built the team
                    <br />
                    <span className="text-[#F3D840]">you can&apos;t find.</span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                  <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-6 max-w-lg">
                    Renewably deploys AI employees across your solar operations.
                    Not chatbots. Not software. Actual workers with roles,
                    responsibilities, and a boss.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.3}>
                  <p className="text-white/50 text-base leading-relaxed max-w-lg">
                    Based in Ireland. Built for Irish solar installers. We handle
                    the work you hate doing so you can focus on the work you love
                    doing.
                  </p>
                </ScrollReveal>
              </div>
            </div>
          </div>

          {/* Yellow fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-[2] pointer-events-none" />
        </section>

        {/* The Problems We Solve */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-6">
                  <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
                    The problems we solve.
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] leading-tight">
                  Every solar installer in Ireland has the same problems.
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {problems.map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 0.1}>
                  <div className="p-6 lg:p-8 rounded-2xl bg-[#FFFDF5] border border-[#F3D840]/10 hover:border-[#F3D840]/30 transition-all duration-300 h-full">
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">
                      {item.title}
                    </h3>
                    <p className="text-[#535353] text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* What We Stand For */}
        <section className="bg-[#FFFDF5] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3D840]/10 border border-[#F3D840]/20 mb-6">
                  <span className="text-[#374151] text-xs sm:text-sm font-semibold tracking-wide">
                    What we stand for.
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] leading-tight">
                  Not an AI company. A workforce company.
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v, i) => (
                <ScrollReveal key={v.title} delay={i * 0.1}>
                  <div className="p-6 rounded-2xl border-2 border-[#F3D840]/30 bg-white hover:border-[#F3D840] transition-all duration-300 h-full">
                    <h3 className="font-bold text-[#1A1A1A] mb-3">{v.title}</h3>
                    <p className="text-[#535353] text-sm leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#F3D840] py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mb-4">
                Ready to meet your new team?
              </h2>
              <p className="text-[#374151] text-base sm:text-lg mb-8 max-w-xl mx-auto">
                We talk for an hour. You show us how you work today. We build
                your team. You approve the hires.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] hover:bg-[#374151] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Let&apos;s Talk
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
