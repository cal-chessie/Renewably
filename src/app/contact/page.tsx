import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Book a Free Strategy Call",
  description: "Get in touch with Renewably to discuss how our AI-powered lead generation system can transform your renewable energy business. Book a free strategy call today.",
  alternates: { canonical: "https://renewably.ie/contact" },
};

function ContactSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Renewably",
          url: "https://renewably.ie/contact",
          mainEntity: {
            "@type": "Organization",
            name: "Renewably",
            telephone: "+353 873958424",
            email: "cal@renewably.ie",
            contactType: "sales",
          },
        }),
      }}
    />
  );
}

export default function ContactPage() {
  return (
    <>
      <ContactSchema />
      <Header />
      <main>
        <section className="pt-32 pb-20 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-teal-400 font-semibold text-sm tracking-wider uppercase mb-3">Contact Us</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Your Unfair AD-Vantage Starts Here
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Come to us with a vision and we will help you craft it. Book a free strategy call to discover how our 
              AI-powered system can transform your customer acquisition.
            </p>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input type="text" id="firstName" name="firstName" required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors outline-none" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input type="text" id="lastName" name="lastName" required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors outline-none" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input type="email" id="email" name="email" required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors outline-none" />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input type="text" id="company" name="company"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors outline-none" />
                  </div>
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">Service Interested In</label>
                    <select id="service" name="service"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors outline-none bg-white">
                      <option value="">Select a service</option>
                      <option value="smart-campaigns">Smart Campaigns</option>
                      <option value="smart-conversions">Smart Conversions</option>
                      <option value="smart-bidding">Smart Bidding</option>
                      <option value="crm-integration">CRM Integration</option>
                      <option value="full-service">Full Leads as a Service</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea id="message" name="message" rows={5} required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors outline-none resize-y" />
                  </div>
                  <button type="submit"
                    className="w-full sm:w-auto px-8 py-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors">
                    Send Message
                  </button>
                </form>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Phone</p>
                        <a href="tel:+353873958424" className="text-teal-700 hover:text-teal-800">+353 873958424</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Email</p>
                        <a href="mailto:cal@renewably.ie" className="text-teal-700 hover:text-teal-800">cal@renewably.ie</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Location</p>
                        <p className="text-gray-600">Ireland</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-teal-50 border border-teal-100">
                  <h3 className="font-semibold text-teal-800 mb-2">Free Strategy Call</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Book a complimentary 30-minute strategy call with our team. We will analyse your current 
                    marketing performance and show you exactly how our AI-powered system can deliver qualified 
                    leads at scale for your renewable energy business.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
