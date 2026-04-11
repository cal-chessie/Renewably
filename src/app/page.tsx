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
        {/* ===== SECTION 0+1: HEADER ON YELLOW — HERO ===== */}
        <section className="bg-[#F3D840]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pb-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#333333] leading-tight mb-6">
                  Your Unfair AD-Vantage. Come To Us With A Vision &amp; We&apos;ll Help You Craft It.
                </h2>
                <p className="text-[#535353] text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                  Helping Renewable Energy Brands Build Sustainable Systems, Create &amp; Sustain Healthy
                  Transactions By Building Transparency and Trust with their customers.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#895A18] hover:bg-[#6B4510] text-white font-semibold rounded-lg transition-colors"
                >
                  Book Your Free Call Today!
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Isometric-style illustration placeholder */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  <svg viewBox="0 0 400 320" fill="none" className="w-full h-auto">
                    {/* Dashboard base */}
                    <rect x="40" y="180" width="200" height="120" rx="12" fill="#FFFFFF" stroke="#333333" strokeWidth="2" opacity="0.9"/>
                    <rect x="56" y="200" width="80" height="8" rx="4" fill="#895A18" opacity="0.3"/>
                    <rect x="56" y="216" width="120" height="6" rx="3" fill="#333333" opacity="0.15"/>
                    <rect x="56" y="230" width="100" height="6" rx="3" fill="#333333" opacity="0.1"/>
                    <rect x="56" y="244" width="90" height="6" rx="3" fill="#333333" opacity="0.1"/>
                    <rect x="56" y="258" width="110" height="6" rx="3" fill="#333333" opacity="0.1"/>
                    <rect x="56" y="272" width="70" height="6" rx="3" fill="#333333" opacity="0.1"/>
                    {/* Chart bars */}
                    <rect x="160" y="250" width="16" height="40" rx="3" fill="#895A18" opacity="0.6"/>
                    <rect x="184" y="230" width="16" height="60" rx="3" fill="#895A18" opacity="0.8"/>
                    <rect x="208" y="210" width="16" height="80" rx="3" fill="#895A18"/>
                    {/* Phone */}
                    <rect x="260" y="60" width="120" height="200" rx="16" fill="#FFFFFF" stroke="#333333" strokeWidth="2"/>
                    <rect x="272" y="88" width="96" height="8" rx="4" fill="#895A18" opacity="0.2"/>
                    <rect x="272" y="104" width="70" height="6" rx="3" fill="#333333" opacity="0.1"/>
                    <circle cx="320" cy="244" r="8" fill="#895A18" opacity="0.3"/>
                    {/* Pie chart on phone */}
                    <circle cx="320" cy="180" r="30" fill="#895A18" opacity="0.15"/>
                    <path d="M320 180 L320 150 A30 30 0 0 1 346 195 Z" fill="#895A18" opacity="0.6"/>
                    {/* Growth arrow */}
                    <path d="M300 280 L340 200" stroke="#895A18" strokeWidth="3" strokeLinecap="round"/>
                    <polygon points="340,192 346,206 334,204" fill="#895A18"/>
                    {/* Floating elements */}
                    <circle cx="60" cy="60" r="20" fill="#FFFFFF" stroke="#333333" strokeWidth="1.5"/>
                    <text x="60" y="66" textAnchor="middle" fontSize="16" fill="#895A18">📈</text>
                    <circle cx="380" cy="100" r="16" fill="#FFFFFF" stroke="#333333" strokeWidth="1.5"/>
                    <text x="380" y="106" textAnchor="middle" fontSize="14" fill="#895A18">⚡</text>
                    <circle cx="200" cy="40" r="18" fill="#FFFFFF" stroke="#333333" strokeWidth="1.5"/>
                    <text x="200" y="46" textAnchor="middle" fontSize="14" fill="#895A18">🎯</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: AUDIENCE TARGETING ===== */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#333333] leading-tight mb-6">
                  We Find Your Buying Audience, by Hyper-Targeting and Re-Targeting your customers!
                </h2>
                <p className="text-[#535353] leading-relaxed mb-4">
                  We start by analyzing your company processes, competitors, and market position. This deep dive
                  helps us define the parameters of success and identify untapped opportunities for growth.
                </p>
                <p className="text-[#535353] leading-relaxed mb-8">
                  Through advanced hyper-targeting and retargeting strategies, we find the people most likely to
                  buy from you and ensure your brand stays visible throughout their decision-making journey.
                </p>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#895A18] hover:bg-[#6B4510] text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Funnel illustration */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-sm">
                  <svg viewBox="0 0 320 280" fill="none" className="w-full h-auto">
                    {/* Funnel shape */}
                    <path d="M40 30 L280 30 L220 120 L100 120 Z" fill="#F3D840" stroke="#333333" strokeWidth="2" opacity="0.9"/>
                    <path d="M100 120 L220 120 L190 200 L130 200 Z" fill="#E5C832" stroke="#333333" strokeWidth="2" opacity="0.9"/>
                    <path d="M130 200 L190 200 L170 260 L150 260 Z" fill="#895A18" stroke="#333333" strokeWidth="2"/>
                    {/* Audience dots */}
                    <circle cx="80" cy="15" r="5" fill="#895A18" opacity="0.4"/>
                    <circle cx="120" cy="10" r="5" fill="#895A18" opacity="0.5"/>
                    <circle cx="160" cy="12" r="5" fill="#895A18" opacity="0.6"/>
                    <circle cx="200" cy="8" r="5" fill="#895A18" opacity="0.7"/>
                    <circle cx="240" cy="14" r="5" fill="#895A18" opacity="0.8"/>
                    {/* Labels */}
                    <text x="160" y="80" textAnchor="middle" fontSize="11" fontWeight="600" fill="#333333">Awareness</text>
                    <text x="160" y="165" textAnchor="middle" fontSize="11" fontWeight="600" fill="#333333">Interest</text>
                    <text x="160" y="238" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">Leads</text>
                    {/* Digital icons */}
                    <rect x="10" y="140" width="36" height="28" rx="4" fill="white" stroke="#333333" strokeWidth="1.5"/>
                    <text x="28" y="159" textAnchor="middle" fontSize="16">🔍</text>
                    <rect x="274" y="140" width="36" height="28" rx="4" fill="white" stroke="#333333" strokeWidth="1.5"/>
                    <text x="292" y="159" textAnchor="middle" fontSize="16">📊</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: SUSTAINABLE SYSTEM ===== */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Basketball / +1 illustration */}
              <div className="order-2 lg:order-1 flex items-center justify-center">
                <div className="relative w-full max-w-sm">
                  <svg viewBox="0 0 320 280" fill="none" className="w-full h-auto">
                    {/* Hoop */}
                    <rect x="200" y="40" width="80" height="6" rx="3" fill="#333333"/>
                    <rect x="200" y="40" width="4" height="60" fill="#333333"/>
                    <rect x="276" y="40" width="4" height="60" fill="#333333"/>
                    {/* Backboard */}
                    <rect x="196" y="20" width="88" height="24" rx="2" fill="white" stroke="#333333" strokeWidth="2"/>
                    {/* Net */}
                    <path d="M210 46 L220 80 M240 46 L240 80 M260 46 L260 80" stroke="#333333" strokeWidth="1.5" opacity="0.3"/>
                    <path d="M210 60 L260 60 M215 70 L255 70" stroke="#333333" strokeWidth="1" opacity="0.2"/>
                    {/* Ball going in */}
                    <circle cx="240" cy="70" r="18" fill="#E5C832" stroke="#895A18" strokeWidth="2"/>
                    <path d="M222 70 Q240 52 258 70" stroke="#895A18" strokeWidth="1.5" fill="none"/>
                    <line x1="240" y1="52" x2="240" y2="88" stroke="#895A18" strokeWidth="1.5"/>
                    {/* +1 badge */}
                    <circle cx="80" cy="160" r="40" fill="#F3D840" stroke="#333333" strokeWidth="2"/>
                    <text x="80" y="154" textAnchor="middle" fontSize="14" fontWeight="700" fill="#333333">+1</text>
                    <text x="80" y="172" textAnchor="middle" fontSize="10" fontWeight="500" fill="#535353">Score!</text>
                    {/* Scoreboard */}
                    <rect x="20" y="60" width="100" height="60" rx="8" fill="white" stroke="#333333" strokeWidth="2"/>
                    <text x="70" y="84" textAnchor="middle" fontSize="10" fontWeight="600" fill="#535353">SCORE</text>
                    <text x="70" y="108" textAnchor="middle" fontSize="24" fontWeight="700" fill="#895A18">24/7</text>
                    {/* Arrow */}
                    <path d="M150 100 L180 50" stroke="#895A18" strokeWidth="2.5" strokeLinecap="round" markerEnd="url(#arrowhead)"/>
                    <defs>
                      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#895A18"/>
                      </marker>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#333333] leading-tight mb-6">
                  We Build You A Sustainable System, Where You Take All The Points!
                </h2>
                <p className="text-[#535353] leading-relaxed mb-4">
                  We design and implement our proven technology stack with data-driven cross-channel strategies
                  engineered to drive and sustain higher conversions.
                </p>
                <p className="text-[#535353] leading-relaxed mb-8">
                  Using text, email, and voice automation, we sustain growth and maintain healthy communication
                  with your prospects until they convert. Our system works around the clock, so you score every
                  opportunity.
                </p>
                <div className="space-y-4">
                  {[
                    "AI-powered ad copy with continuous A/B testing",
                    "Dynamic landing pages matched to every search query",
                    "Smart bidding strategies for lower acquisition costs",
                    "Full CRM integration for seamless lead delivery",
                    "Multivariate optimisation delivering up to 3x lift",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#895A18] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-[#535353] text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 4: YELLOW STRIPE DIVIDER ===== */}
        <section className="bg-[#F3D840] py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#333333] leading-tight">
              The Barriers Between You and Your Future Customers, can be tough!
            </h2>
          </div>
        </section>

        {/* ===== SECTION 5: BARRIERS ===== */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {[
                {
                  num: "01",
                  title: "The Complexity Gap",
                  desc: "Buying leads should be as easy as buying clicks. While ads have never been more accessible, bridging search and paid media with sales still requires significant complexity. We close that gap.",
                  icon: "🔗",
                },
                {
                  num: "02",
                  title: "The Competition Arms Race",
                  desc: "Behind the simplicity of the search box lies great complexity and ever-growing competition for attention. We help you win that race through superior technology and strategy.",
                  icon: "⚔️",
                },
                {
                  num: "03",
                  title: "The Automation Deficit",
                  desc: "Search marketing is increasingly math-driven. Without AI and automation at every step — from campaign orchestration to bidding optimisation — you are being outgunned by A-players.",
                  icon: "🤖",
                },
                {
                  num: "04",
                  title: "The Pay-to-Play Reality",
                  desc: "Paid ads are progressively dominating search results. Organic efforts are being pushed further below the fold, and pricing is volatile. We help you navigate this landscape profitably.",
                  icon: "💰",
                },
                {
                  num: "05",
                  title: "Building Trust & Transparency",
                  desc: "Your customers need to trust you before they buy. We build systems that create transparency and trust at every touchpoint, turning sceptical browsers into confident buyers.",
                  icon: "🛡️",
                },
                {
                  num: "06",
                  title: "Sustaining Healthy Transactions",
                  desc: "Acquiring customers is only half the battle. We help you sustain healthy, long-term relationships through automated follow-ups, retargeting, and data-driven engagement strategies.",
                  icon: "🔄",
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-5 p-6 rounded-xl bg-[#FAFAFA] border border-gray-100 hover:border-[#F3D840] transition-colors group">
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-[#F3D840] flex items-center justify-center">
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#895A18] tracking-wider">{item.num}</span>
                    <h3 className="text-lg font-semibold text-[#333333] mt-1 mb-2">{item.title}</h3>
                    <p className="text-[#535353] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: UNFAIR ADVANTAGE ===== */}
        <section className="bg-[#FAFAFA] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-[#895A18] font-semibold text-sm tracking-wider uppercase mb-3">Why Renewably</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#333333] mb-4">
                Unleashing Your Unfair Advantage!
              </h2>
              <p className="text-[#535353] leading-relaxed">
                Search marketing and paid media are increasingly math-driven and automated. Without AI-powered tools
                and expert orchestration, you are being outgunned by competitors who have invested in automation at
                every step.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Smart Campaigns",
                  desc: "AI automatically generates consistent ad titles and copy. We A/B test up to 4 versions of ad copy simultaneously to improve click-through rates.",
                  icon: "01",
                },
                {
                  title: "Smart Conversions",
                  desc: "Every landing page is personalised with dynamic titles and CTAs matched to the user's search query. Lightning-fast response times minimise drop-off.",
                  icon: "02",
                },
                {
                  title: "Smart Bidding",
                  desc: "A variety of smart bidding strategies — increase conversions, decrease CPA, or target specific ROAS. Our ML engine adapts in real-time.",
                  icon: "03",
                },
                {
                  title: "CRM Integration",
                  desc: "Seamless CRM integration through custom deliverables. Leads flow directly into your sales pipeline without manual data entry.",
                  icon: "04",
                },
                {
                  title: "Continuous Optimisation",
                  desc: "Multivariate testing where the machine optimises the conversion path in response to user interactions. Clients report up to 3x lead volume lift.",
                  icon: "05",
                },
                {
                  title: "Analytics & Reporting",
                  desc: "Real-time dashboards tracking every metric — from impression to conversion. Transparent reporting that demonstrates clear ROI.",
                  icon: "06",
                },
              ].map((service) => (
                <div key={service.icon} className="p-6 rounded-xl bg-white border border-gray-100 hover:border-[#F3D840] hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-lg bg-[#F3D840] flex items-center justify-center mb-4">
                    <span className="text-[#895A18] font-bold">{service.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#333333] mb-2">{service.title}</h3>
                  <p className="text-[#535353] text-sm leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#895A18] hover:bg-[#6B4510] text-white font-semibold rounded-lg transition-colors text-sm"
              >
                View All Services
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FAQ SECTION ===== */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-[#895A18] font-semibold text-sm tracking-wider uppercase mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#333333] mb-4">Frequently Asked Questions</h2>
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
                <details key={faq.q} className="group bg-[#FAFAFA] rounded-xl border border-gray-100 overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-6 text-left font-semibold text-[#333333] hover:text-[#895A18] transition-colors">
                    <span>{faq.q}</span>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-[#535353] text-sm leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 7+8: CTA / YELLOW STRIPE ===== */}
        <section className="bg-[#F3D840] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#333333] mb-4">
              Ready to Transform Your Lead Generation?
            </h2>
            <p className="text-[#535353] text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Book a free strategy call with our team. We will analyse your current marketing performance and show you
              exactly how our AI-powered system can deliver qualified leads at scale.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#895A18] hover:bg-[#6B4510] text-white font-semibold rounded-lg transition-colors"
            >
              Book Your Free Strategy Call
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
