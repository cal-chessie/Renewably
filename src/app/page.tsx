import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

function HomePageSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Renewably — Leads as a Service for Renewable Energy Brands in Ireland",
          description: "Renewably combines AI-powered technology with data-driven strategy to deliver qualified leads for renewable energy companies in Ireland. Smart campaigns, smart conversions, smart bidding.",
          url: "https://renewably.ie",
          mainEntity: {
            "@type": "Service",
            name: "Leads as a Service",
            provider: {
              "@type": "Organization",
              name: "Renewably",
            },
            description: "Fully integrated lead generation and customer acquisition system powered by AI, combining smart campaigns, conversion optimisation, and automated bidding for renewable energy brands.",
            serviceType: "Digital Marketing & Lead Generation",
            areaServed: {
              "@type": "Country",
              name: "Ireland",
            },
          },
        }),
      }}
    />
  );
}

function FAQSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is Leads as a Service?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Leads as a Service (LaaS) is a fully managed lead generation solution where Renewably handles every aspect of customer acquisition — from campaign creation and ad copy generation to conversion optimisation and CRM integration. We use AI-powered technology and machine learning to automate and optimise paid media at scale, delivering qualified leads directly to your sales team.",
              },
            },
            {
              "@type": "Question",
              name: "How does Renewably help renewable energy companies in Ireland?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Renewably specialises in digital marketing for renewable energy brands in Ireland. We combine hyper-targeted paid media campaigns with AI-driven conversion optimisation, smart bidding strategies, and CRM integration to create a sustainable customer acquisition system. Our data-driven approach ensures you get qualified leads with lower customer acquisition costs and higher conversion rates.",
              },
            },
            {
              "@type": "Question",
              name: "What makes Renewably different from other digital marketing agencies?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Renewably differentiates through our exclusive Leads as a Service model. Unlike traditional agencies that only manage campaigns, we build a complete, automated customer acquisition system tailored to renewable energy brands. This includes AI-powered ad copy generation, multivariate landing page testing, automated bid management, and direct CRM integration — all continuously optimised through machine learning.",
              },
            },
            {
              "@type": "Question",
              name: "What results can I expect from Renewably's lead generation services?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Clients using our optimised conversion systems report up to 3 times lead volume lift through multivariate testing and machine learning. Our smart bidding strategies help reduce cost per acquisition while increasing conversion rates. Every campaign is continuously monitored and optimised to improve performance over time.",
              },
            },
          ],
        }),
      }}
    />
  );
}

export default function Home() {
  return (
    <>
      <HomePageSchema />
      <FAQSchema />
      <Header />
      <main>
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-900 via-gray-900 to-teal-900 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary-light)_0%,_transparent_50%)] opacity-20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
            <div className="max-w-3xl">
              <p className="text-teal-400 font-semibold text-sm tracking-wider uppercase mb-4">Leads as a Service</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                AI-Powered Lead Generation for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-300">
                  Renewable Energy Brands
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl">
                We build sustainable customer acquisition systems that combine smart campaigns, conversion optimisation, 
                and machine learning to deliver qualified leads at scale for renewable energy companies across Ireland.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact" className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition-colors text-center">
                  Book Your Free Strategy Call
                </Link>
                <Link href="/services" className="px-8 py-4 border border-gray-600 hover:border-teal-500 text-gray-300 hover:text-white font-semibold rounded-lg transition-colors text-center">
                  Explore Our Services
                </Link>
              </div>
              <div className="mt-12 flex items-center gap-8 text-gray-400">
                <div>
                  <p className="text-2xl font-bold text-white">3x</p>
                  <p className="text-sm">Lead Volume Lift</p>
                </div>
                <div className="w-px h-10 bg-gray-700" />
                <div>
                  <p className="text-2xl font-bold text-white">AI</p>
                  <p className="text-sm">Powered Optimisation</p>
                </div>
                <div className="w-px h-10 bg-gray-700" />
                <div>
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p className="text-sm">System Monitoring</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-teal-700 font-semibold text-sm tracking-wider uppercase mb-3">Our Process</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How We Build Your Lead Generation System
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Our proven four-phase methodology transforms your digital presence into a predictable, scalable lead generation machine.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Deep Dive Analysis", desc: "We analyse your company processes, competitors, and market position to define the parameters of success and identify untapped opportunities for growth." },
                { step: "02", title: "System Design", desc: "We design and implement our proven technology stack with data-driven cross-channel strategies engineered to drive and sustain higher conversions." },
                { step: "03", title: "Launch & Optimise", desc: "We deploy AI-powered campaigns with A/B testing, dynamic landing pages, and smart bidding. Every element is continuously optimised through machine learning." },
                { step: "04", title: "Scale & Sustain", desc: "Using text, email, and voice automation, we sustain growth and maintain healthy communication with your prospects until they convert." },
              ].map((item) => (
                <div key={item.step} className="relative p-6 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors group">
                  <span className="text-5xl font-bold text-teal-100 group-hover:text-teal-200 transition-colors">{item.step}</span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES OVERVIEW */}
        <section id="services" className="section-padding bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-teal-700 font-semibold text-sm tracking-wider uppercase mb-3">What We Do</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Fully Integrated Marketing Technology
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Every critical step in paid media lead acquisition — automated and optimised with continuous A/B testing and machine learning.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: "01", title: "Smart Campaigns", desc: "AI-generated ad copy with up to 4 A/B test variations per campaign. We highlight your unique selling points and attract high-intent customers through precisely targeted campaigns." },
                { icon: "02", title: "Smart Conversions", desc: "Personalised landing pages with dynamic titles and CTAs matched to each query. Engaging conversational forms, lightning-fast response times, and improved data capture with auto-validation." },
                { icon: "03", title: "Smart Bidding", desc: "Strategic bid management across multiple goal types — maximise conversions, minimise CPA, or target specific ROAS. Our machine learning engine adapts in real-time to market conditions." },
                { icon: "04", title: "CRM Integration", desc: "Seamless integration with your existing CRM through custom deliverables. We map every data field to ensure leads flow directly into your sales pipeline without manual intervention." },
                { icon: "05", title: "Continuous Optimisation", desc: "Multivariate testing across the entire conversion path. Our machine learning system optimises in response to user interactions, with clients reporting up to 3x lead volume improvements." },
                { icon: "06", title: "Analytics & Reporting", desc: "Real-time dashboards tracking every metric that matters — from impression to conversion. Transparent reporting that demonstrates clear ROI and informs strategic decisions." },
              ].map((service) => (
                <div key={service.icon} className="p-8 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
                    <span className="text-teal-700 font-bold">{service.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors">
                View All Services
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-teal-700 font-semibold text-sm tracking-wider uppercase mb-3">Why Renewably</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                  Your Unfair Advantage in Renewable Energy Marketing
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Search marketing and paid media are increasingly math-driven and automated. Without AI-powered tools 
                  and expert orchestration, you are being outgunned by competitors who have invested in automation at 
                  every step — from campaign management and bidding to conversion optimisation and real-time analytics.
                </p>
                <div className="space-y-4">
                  {[
                    "Hyper-targeted campaigns that find your buying audience",
                    "AI-powered ad copy generation with continuous A/B testing",
                    "Personalised landing pages that maximise conversion rates",
                    "Smart bidding strategies that reduce cost per acquisition",
                    "Full CRM integration for seamless lead handoff",
                    "Dedicated support from renewable energy marketing specialists",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-8 sm:p-12 text-white">
                <h3 className="text-2xl font-bold mb-6">Results Driven By Data</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Lead Volume Increase</span>
                      <span className="font-semibold">Up to 3x</span>
                    </div>
                    <div className="h-2 bg-teal-900 rounded-full"><div className="h-2 bg-teal-300 rounded-full" style={{ width: "85%" }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Conversion Rate Improvement</span>
                      <span className="font-semibold">150%</span>
                    </div>
                    <div className="h-2 bg-teal-900 rounded-full"><div className="h-2 bg-teal-300 rounded-full" style={{ width: "75%" }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cost Per Acquisition Reduction</span>
                      <span className="font-semibold">40%</span>
                    </div>
                    <div className="h-2 bg-teal-900 rounded-full"><div className="h-2 bg-teal-300 rounded-full" style={{ width: "60%" }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Client Retention Rate</span>
                      <span className="font-semibold">95%</span>
                    </div>
                    <div className="h-2 bg-teal-900 rounded-full"><div className="h-2 bg-teal-300 rounded-full" style={{ width: "95%" }} /></div>
                  </div>
                </div>
                <p className="text-teal-200 text-sm mt-8">Based on aggregated client performance data across renewable energy campaigns in Ireland.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION — Critical for AIO/AEO */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-teal-700 font-semibold text-sm tracking-wider uppercase mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: "What is Leads as a Service?",
                  a: "Leads as a Service (LaaS) is a fully managed lead generation solution where Renewably handles every aspect of customer acquisition — from campaign creation and ad copy generation to conversion optimisation and CRM integration. We use AI-powered technology and machine learning to automate and optimise paid media at scale, delivering qualified leads directly to your sales team."
                },
                {
                  q: "How does Renewably help renewable energy companies in Ireland?",
                  a: "Renewably specialises in digital marketing for renewable energy brands in Ireland. We combine hyper-targeted paid media campaigns with AI-driven conversion optimisation, smart bidding strategies, and CRM integration to create a sustainable customer acquisition system. Our data-driven approach ensures you get qualified leads with lower customer acquisition costs and higher conversion rates."
                },
                {
                  q: "What makes Renewably different from other digital marketing agencies?",
                  a: "Renewably differentiates through our exclusive Leads as a Service model. Unlike traditional agencies that only manage campaigns, we build a complete, automated customer acquisition system tailored to renewable energy brands. This includes AI-powered ad copy generation, multivariate landing page testing, automated bid management, and direct CRM integration — all continuously optimised through machine learning."
                },
                {
                  q: "What results can I expect from Renewably's lead generation services?",
                  a: "Clients using our optimised conversion systems report up to 3 times lead volume lift through multivariate testing and machine learning. Our smart bidding strategies help reduce cost per acquisition while increasing conversion rates. Every campaign is continuously monitored and optimised to improve performance over time."
                },
                {
                  q: "How quickly can I see results from lead generation campaigns?",
                  a: "Most clients begin seeing measurable results within the first 30 days of campaign launch. Our AI systems start optimising from day one, using A/B testing and machine learning to rapidly improve performance. By month three, campaigns typically reach peak efficiency with significant improvements in lead quality and volume."
                },
                {
                  q: "Do I need a large marketing budget to work with Renewably?",
                  a: "We work with businesses of all sizes and can scale our services to match your budget. Our AI-powered approach is inherently efficient — smart bidding reduces wasted spend, and our optimised conversion paths mean you get more value from every click. We recommend starting with a strategy call so we can recommend the best approach for your specific goals and budget."
                },
              ].map((faq) => (
                <details key={faq.q} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-6 text-left font-semibold text-gray-900 hover:text-teal-700 transition-colors">
                    <span>{faq.q}</span>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="section-padding bg-gradient-to-r from-teal-700 to-teal-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Lead Generation?
            </h2>
            <p className="text-teal-100 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Book a free strategy call with our team. We will analyse your current marketing performance and show you exactly how our AI-powered system can deliver qualified leads at scale.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Book Your Free Strategy Call
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
