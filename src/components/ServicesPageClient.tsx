"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";

const services = [
  {
    id: "campaigns",
    title: "Smart Campaigns",
    desc: "AI automatically generates consistent ad titles and copy, with human validation for quality assurance. We A/B test up to 4 versions of ad copy simultaneously to improve click-through rates. Our campaigns are designed to highlight your unique selling points and attract high-intent customers across search and display networks.",
    features: ["AI-generated ad copy", "Up to 4 simultaneous A/B tests", "Multi-channel campaign management", "Keyword theme optimisation"],
    image: "/hero-illustration.png",
  },
  {
    id: "conversions",
    title: "Smart Conversions",
    desc: "Every landing page is personalised with dynamic titles and calls-to-action fully matched to the user's search query. We use engaging, conversational forms and surveys with lightning-fast response times to minimise drop-off. Data capture is improved through auto-completion, inline postal validation, and dynamic phone numbers for click-to-call tracking.",
    features: ["Dynamic landing page personalisation", "Conversational form design", "Real-time data validation", "Click-to-call tracking"],
    image: "/funnel-illustration.png",
  },
  {
    id: "bidding",
    title: "Smart Bidding",
    desc: "A variety of smart bidding strategies to choose from — increase conversions, decrease CPA, or target a specific ROAS. Clearly defining your goals is the key, and we help you pick the right strategy to reach them. Our machine learning engine adapts bids in real-time based on market conditions, competition, and user behaviour.",
    features: ["Target CPA bidding", "Target ROAS bidding", "Maximise conversions", "Real-time bid adjustment"],
    image: "/system-illustration.png",
  },
  {
    id: "crm",
    title: "CRM Integration",
    desc: "We enable seamless CRM integration through custom deliverables that map every data field from your lead capture forms directly into your CRM system. Leads flow automatically into your sales pipeline without manual data entry, reducing response times and ensuring no lead is lost.",
    features: ["Custom field mapping", "Automatic lead routing", "Real-time sync", "Sales pipeline integration"],
    image: "/crm-illustration.png",
  },
  {
    id: "optimisation",
    title: "Continuous Optimisation",
    desc: "We use multivariate testing — a sophisticated form of A/B testing — where the machine optimises the conversion path in response to user interactions. Clients report up to 3 times lead volume lift. Every element from ad copy to landing page layout is continuously refined.",
    features: ["Multivariate testing", "Machine learning optimisation", "Conversion path analysis", "Up to 3x lead volume lift"],
    image: "/ai-illustration.png",
  },
  {
    id: "analytics",
    title: "Analytics & Reporting",
    desc: "Real-time dashboards tracking every metric that matters — from impression to conversion. Our transparent reporting demonstrates clear ROI and informs strategic decisions. We provide regular performance reviews and actionable insights to continuously improve campaign performance.",
    features: ["Real-time dashboards", "ROI tracking", "Regular performance reviews", "Actionable insights"],
    image: "/hero-illustration.png",
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
              <p className="text-[#895A18] font-semibold text-sm tracking-wider uppercase mb-3">Our Services</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#333333] mb-6">
                AI-Powered Marketing, Fully Managed
              </h1>
              <p className="text-[#535353] text-lg max-w-2xl mx-auto leading-relaxed">
                A fully integrated Leads as a Service solution that automates and optimises every step of paid media 
                customer acquisition — powered by AI and machine learning.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Services Detail */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            {services.map((service, idx) => (
              <ScrollReveal key={service.id}>
                <div id={service.id} className={`grid lg:grid-cols-2 gap-12 items-center`}>
                  <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="w-12 h-12 rounded-lg bg-[#F3D840] flex items-center justify-center mb-4">
                      <span className="text-[#895A18] font-bold text-lg">{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-4">{service.title}</h2>
                    <p className="text-[#535353] leading-relaxed mb-6">{service.desc}</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[#535353]">
                          <svg className="w-4 h-4 text-[#895A18] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
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
        <section className="bg-[#F9F9F9] py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-[#333333] mb-4">Let&apos;s Build Your System</h2>
              <p className="text-[#535353] mb-8 leading-relaxed">
                Every project is an opportunity to create something unique. Book a call to discuss how we can design 
                and implement a lead generation system tailored to your business.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#895A18] hover:bg-[#6B4510] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
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
