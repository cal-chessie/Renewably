import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Ireland's Renewable Energy Marketing Specialists",
  description: "Learn about Renewably, Ireland's leading digital marketing agency for renewable energy brands. We combine AI technology with data-driven strategy to build sustainable customer acquisition systems.",
  alternates: { canonical: "https://renewably.ie/about" },
};

const values = [
  { title: "Data-Driven", desc: "Every decision is backed by analytics and real-time performance data. We do not guess — we measure, test, and optimise continuously." },
  { title: "AI-Powered", desc: "We leverage machine learning and artificial intelligence to automate campaign management, bid optimisation, and conversion rate improvements at scale." },
  { title: "Transparent", desc: "Full visibility into campaign performance, costs, and results. We build trust through transparency in every interaction." },
  { title: "Results-Focused", desc: "We are only successful when you are successful. Our compensation is tied to delivering measurable outcomes for your business." },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Banner */}
        <section className="bg-[#F3D840] pt-8 pb-16 md:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-[#895A18] font-semibold text-sm tracking-wider uppercase mb-3">About Us</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#333333] mb-6">
              Building Sustainable Growth for Renewable Energy Brands
            </h1>
            <p className="text-[#535353] text-lg max-w-2xl mx-auto leading-relaxed">
              Renewably develops and operates a fully integrated Leads as a Service solution, combining exclusive technology 
              with AI to automate and optimise paid media and customer acquisition at scale.
            </p>
          </div>
        </section>

        {/* Barriers */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-3xl font-bold text-[#333333] mb-8">The Barriers We Break Down</h2>
                <div className="space-y-6">
                  {[
                    { title: "The Complexity Gap", desc: "Buying leads should be as easy as buying clicks. While ads have never been more accessible, bridging search and paid media with sales still requires significant complexity. We close that gap." },
                    { title: "The Competition Arms Race", desc: "Behind the simplicity of the search box lies great complexity and ever-growing competition for attention. We help you win that race through superior technology and strategy." },
                    { title: "The Automation Deficit", desc: "Search marketing is increasingly math-driven. Without AI and automation at every step — from campaign orchestration to bidding optimisation — you are being outgunned by A-players." },
                    { title: "The Pay-to-Play Reality", desc: "Paid ads are progressively dominating search results. Organic efforts are being pushed further below the fold, and pricing is volatile. We help you navigate this landscape profitably." },
                  ].map((item) => (
                    <div key={item.title} className="p-6 rounded-xl bg-[#FAFAFA] border border-gray-100">
                      <h3 className="font-semibold text-[#333333] mb-2">{item.title}</h3>
                      <p className="text-[#535353] text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#333333] mb-8">Our Values</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {values.map((v) => (
                    <div key={v.title} className="p-6 rounded-xl border border-[#F3D840] bg-[#FAFAFA]">
                      <h3 className="font-semibold text-[#895A18] mb-2">{v.title}</h3>
                      <p className="text-[#535353] text-sm leading-relaxed">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#FAFAFA] py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-[#333333] mb-4">Ready to Work Together?</h2>
            <p className="text-[#535353] mb-8 leading-relaxed">
              Let us show you how our AI-powered system can transform your customer acquisition. Book a free strategy call today.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#895A18] hover:bg-[#6B4510] text-white font-semibold rounded-lg transition-colors">
              Book a Strategy Call
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
