"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";

export default function ContactPageClient() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Banner */}
        <section className="bg-[#F3D840] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <p className="text-[#374151] font-semibold text-sm tracking-wider uppercase mb-3">Contact Us</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#333333] mb-6">
                Let&apos;s Build Your AI Advantage
              </h1>
              <p className="text-[#535353] text-lg max-w-2xl mx-auto leading-relaxed">
                Tell us about your business goals and we&apos;ll show you how autonomous AI agents can transform your sales pipeline, marketing performance, and operational efficiency.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16">
              <ScrollReveal>
                <div>
                  <h2 className="text-2xl font-bold text-[#333333] mb-6">Send Us a Message</h2>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-[#333333] mb-2">First Name</label>
                        <input type="text" id="firstName" name="firstName" required
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#374151] focus:ring-2 focus:ring-[#374151]/20 transition-colors outline-none" />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-[#333333] mb-2">Last Name</label>
                        <input type="text" id="lastName" name="lastName" required
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#374151] focus:ring-2 focus:ring-[#374151]/20 transition-colors outline-none" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[#333333] mb-2">Email Address</label>
                      <input type="email" id="email" name="email" required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#374151] focus:ring-2 focus:ring-[#374151]/20 transition-colors outline-none" />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-[#333333] mb-2">Company Name</label>
                      <input type="text" id="company" name="company"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#374151] focus:ring-2 focus:ring-[#374151]/20 transition-colors outline-none" />
                    </div>
                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-[#333333] mb-2">Service Interested In</label>
                      <select id="service" name="service"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#374151] focus:ring-2 focus:ring-[#374151]/20 transition-colors outline-none bg-white">
                        <option value="">Select a service</option>
                        <option value="ai-sales-agents">AI Sales Agents</option>
                        <option value="marketing-automation">Marketing Automation</option>
                        <option value="lead-generation">Lead Generation</option>
                        <option value="workflow-automation">Workflow Automation</option>
                        <option value="revenue-intelligence">Revenue Intelligence</option>
                        <option value="full-ai-platform">Full AI Platform</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-[#333333] mb-2">Message</label>
                      <textarea id="message" name="message" rows={5} required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#374151] focus:ring-2 focus:ring-[#374151]/20 transition-colors outline-none resize-y" />
                    </div>
                    <button type="submit"
                      className="w-full sm:w-auto px-8 py-4 bg-[#374151] hover:bg-[#1F2937] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
                      Send Message
                    </button>
                  </form>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right" delay={0.2}>
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-[#333333] mb-6">Get in Touch</h2>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#F3D840] flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div>
                          <p className="font-semibold text-[#333333]">Phone</p>
                          <a href="tel:+353873958424" className="text-[#374151] hover:text-[#1F2937]">+353 873958424</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#F3D840] flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="font-semibold text-[#333333]">Email</p>
                          <a href="mailto:cal@renewably.ie" className="text-[#374151] hover:text-[#1F2937]">cal@renewably.ie</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#F3D840] flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                          <p className="font-semibold text-[#333333]">Location</p>
                          <p className="text-[#535353]">Ireland</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#F3D840]/10 border border-[#F3D840]">
                    <h3 className="font-semibold text-[#374151] mb-2">Free Strategy Call</h3>
                    <p className="text-[#535353] text-sm leading-relaxed">
                      Book a complimentary 30-minute strategy call with our team. We&apos;ll analyse your current
                      sales and marketing stack, identify automation opportunities, and show you exactly how
                      AI agents can deliver measurable revenue growth.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
