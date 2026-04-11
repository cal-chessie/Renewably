"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { useParams } from "next/navigation";

const posts: Record<string, { title: string; date: string; category: string; content: string }> = {
  "ai-powered-lead-generation-renewable-energy": {
    title: "How AI-Powered Lead Generation Is Transforming Renewable Energy Marketing in 2026",
    date: "2026-04-01",
    category: "Lead Generation",
    content: `The renewable energy sector in Ireland is experiencing unprecedented growth. Government targets, rising energy costs, and increased environmental awareness have created a surge in demand for solar panels, heat pumps, wind energy solutions, and energy retrofitting services. But with this growth comes intense competition for customer attention, making effective lead generation more critical than ever.

Artificial intelligence is fundamentally changing how renewable energy companies acquire customers. Traditional approaches — manually managed campaigns, static landing pages, and one-size-fits-all ad copy — simply cannot compete with AI-powered systems that learn, adapt, and optimise in real-time. Here is how AI is transforming lead generation for the renewable energy sector in Ireland.

## The Challenge: Complex Products, Informed Buyers

Renewable energy products are not impulse purchases. Customers typically spend weeks or months researching options, comparing providers, and evaluating returns on investment. This extended decision journey means that lead generation must focus not just on capturing initial interest, but on nurturing and qualifying prospects through every stage of the funnel.

AI-powered systems excel at this because they can track and respond to individual user behaviour patterns. When a prospect visits your website multiple times, views specific product pages, and downloads a guide on solar panel ROI, an AI system can automatically adjust their journey — showing them more relevant content, triggering personalised email sequences, and alerting your sales team when they reach a threshold of buying intent.

## Smart Campaigns: Beyond Manual Ad Management

Google Ads has become increasingly automated, and the agencies that succeed are those that leverage AI at every level. Smart campaigns use machine learning to identify the most effective ad combinations, targeting parameters, and bid strategies for each individual prospect.

At Renewably, our AI automatically generates ad copy variations, tests them simultaneously, and continuously refines messaging based on real performance data. This means your campaigns improve over time without requiring constant manual intervention — the system learns what works and does more of it.

## Smart Conversions: Personalised Landing Experiences

One of the most powerful applications of AI in lead generation is landing page personalisation. Instead of showing every visitor the same generic page, AI-powered systems dynamically adjust headlines, calls-to-action, and content based on the specific search query, the user's location, their device type, and their previous interactions with your brand.

For a renewable energy company, this might mean showing different content to a homeowner searching for "solar panel cost Ireland" versus a business owner searching for "commercial solar installation." Each visitor sees a landing page that speaks directly to their specific needs and concerns, dramatically increasing conversion rates.

## The Future: AI-Native Marketing

As AI technology continues to evolve, the companies that adopt AI-native marketing approaches early will build a lasting competitive advantage. The gap between AI-powered and traditional marketing will only widen, making it increasingly difficult for late adopters to compete effectively.

If you are a renewable energy company in Ireland looking to scale your customer acquisition, the time to invest in AI-powered lead generation is now. Book a strategy call with our team to learn how we can build a custom system tailored to your business.`,
  },
  "google-ads-strategy-renewable-energy": {
    title: "The Complete Google Ads Strategy for Renewable Energy Companies in Ireland",
    date: "2026-03-15",
    category: "Paid Media",
    content: `Google Ads remains the most powerful platform for acquiring high-intent customers in the renewable energy sector. When someone searches for "solar panel installers near me" or "heat pump grants Ireland," they are actively looking for a solution. This guide covers everything you need to build a winning Google Ads strategy for your renewable energy business.

## Foundation: Keyword Research and Account Structure

The foundation of any successful Google Ads campaign is comprehensive keyword research. For renewable energy companies in Ireland, this means going beyond obvious terms to capture the full spectrum of search intent.

We categorise keywords into three tiers: high-intent transactional terms (e.g., "solar panel installation Dublin"), research-oriented terms (e.g., "how much do solar panels cost Ireland"), and problem-awareness terms (e.g., "reduce energy bills Ireland"). Each tier requires different ad messaging and landing page strategies.

## Campaign Structure Best Practices

A well-structured Google Ads account is essential for achieving strong Quality Scores and low cost-per-click. We recommend organising campaigns by product category (solar, heat pumps, insulation, etc.) and creating tightly themed ad groups around specific keyword clusters.

## Conversion Tracking and Measurement

Without proper conversion tracking, you are flying blind. Every renewable energy campaign should track form submissions, phone calls, and other key actions. Advanced implementation includes offline conversion tracking to connect Google Ads data with your CRM, enabling true ROI measurement.`,
  },
  "conversion-rate-optimisation-energy-sector": {
    title: "Conversion Rate Optimisation: Why Energy Sector Landing Pages Need a Different Approach",
    date: "2026-03-01",
    category: "CRO",
    content: `The renewable energy sector presents unique conversion rate optimisation challenges that generic CRO advice simply does not address. When a homeowner is considering investing tens of thousands of euros in solar panels or a heat pump, they need more than a compelling headline and a bright CTA button — they need trust, education, and reassurance.

## Understanding the Energy Buyer Journey

Unlike e-commerce purchases where decisions can be made in minutes, renewable energy investments typically involve weeks or months of research. Your landing pages must address every stage of this journey, from initial awareness through to final decision.

## Trust Signals That Convert

For renewable energy companies, trust signals are not optional — they are essential. This includes SEAI registration, installation certifications, customer testimonials with specific results, case studies with real data, and transparent pricing information. The more specific and verifiable your trust signals, the higher your conversion rates will be.

## Personalisation at Scale

The most effective landing pages in the renewable energy sector are personalised. This means matching headlines to search queries, dynamically adjusting content based on location, and showing relevant case studies based on the user's specific interest (solar, heat pumps, retrofitting, etc.).`,
  },
  "smart-bidding-strategies-2026": {
    title: "Smart Bidding Strategies That Actually Work in 2026: A Data-Driven Analysis",
    date: "2026-02-15",
    category: "PPC",
    content: `Google's smart bidding has matured significantly, but choosing the right strategy for your renewable energy campaigns requires understanding both the options available and how they perform in practice. After analysing over 200 campaigns in the renewable energy sector, we have identified clear patterns in what works and what does not.

## The Current Smart Bidding Landscape

Google now offers several smart bidding strategies: Target CPA, Target ROAS, Maximise Conversions, Maximise Conversion Value, and Maximize Clicks. Each has specific strengths and ideal use cases for renewable energy campaigns.

## Key Findings from Our Analysis

Our data shows that Target CPA bidding delivers the most consistent results for lead generation campaigns, while Target ROAS performs best for companies with established sales tracking. The key insight is that smart bidding works best when you give it enough data — campaigns need at least 30 conversions in the past 30 days for optimal performance.

## Getting Started with Smart Bidding

For renewable energy companies new to smart bidding, we recommend starting with Maximise Conversions with a CPA cap. This provides the benefits of automated bidding while maintaining control over costs. Once the system has accumulated sufficient data, you can transition to more targeted strategies.`,
  },
  "aio-seo-renewable-energy-brands": {
    title: "AIO and AEO: How to Optimise Your Renewable Energy Brand for AI Search Engines",
    date: "2026-02-01",
    category: "SEO",
    content: `The rise of AI-powered search engines — including Perplexity, ChatGPT Search, and Google's AI Overviews — is fundamentally changing how customers find information about renewable energy products and services. Traditional SEO alone is no longer sufficient. You need an Answer Engine Optimisation (AEO) strategy.

## Understanding AI Search Engines

AI search engines do not just return links — they generate direct answers to user questions by synthesising information from multiple sources. This means your content needs to be structured, comprehensive, and authoritative enough to be selected as a source for AI-generated answers.

## Structured Data and Schema Markup

One of the most effective ways to improve your visibility in AI search results is through structured data. FAQ schemas, service schemas, and organisation schemas help AI systems understand your content and present it directly in search results.

## Content Strategy for AI Visibility

The content that AI search engines favour is comprehensive, well-structured, and directly answers user questions. For renewable energy companies, this means creating detailed guides, comparison articles, and FAQ content that addresses every question a potential customer might ask.`,
  },
  "crm-integration-lead-quality": {
    title: "CRM Integration Secrets: How to Improve Lead Quality by 40% Without Spending More on Ads",
    date: "2026-01-15",
    category: "Strategy",
    content: `The gap between marketing and sales is where most renewable energy companies lose potential customers. Leads come in from various channels, but without proper CRM integration, valuable data is lost, response times suffer, and conversion rates plummet.

## The True Cost of Poor CRM Integration

Research shows that the speed of lead response is one of the strongest predictors of conversion. Companies that respond within 5 minutes are 21 times more likely to qualify a lead than those that respond after 30 minutes. Yet many renewable energy companies still rely on manual lead processing, resulting in delayed responses and lost opportunities.

## Automated Lead Scoring

One of the most powerful applications of CRM integration is automated lead scoring. By connecting your marketing data with your CRM, you can automatically assign scores based on factors like lead source, search query, company size, and engagement level. This allows your sales team to prioritise the highest-value leads first.

## Real-Time Lead Routing

CRM integration enables real-time lead routing, ensuring that leads are immediately assigned to the right sales representative based on geography, product interest, or company size. This eliminates bottlenecks and ensures every lead receives prompt attention.`,
  },
};

export default function BlogPostClient() {
  const params = useParams();
  const slug = params.slug as string;
  const post = posts[slug];

  if (!post) {
    return (
      <>
        <Header />
        <main className="pt-20">
          <section className="py-32 text-center">
            <h1 className="text-4xl font-bold text-[#333333] mb-4">Post Not Found</h1>
            <Link href="/blog" className="text-[#895A18] hover:text-[#6B4510]">
              &larr; Back to Blog
            </Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const paragraphs = post.content.split("\n\n").filter(Boolean);

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Article Header */}
        <article className="bg-[#F3D840] py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <Link href="/blog" className="text-[#895A18] hover:text-[#6B4510] text-sm font-medium mb-6 inline-block">
                &larr; Back to Blog
              </Link>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-[#895A18]/20 text-[#895A18] rounded-full mb-4">
                {post.category}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#333333] leading-tight mb-4">
                {post.title}
              </h1>
              <time className="text-[#535353]" dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </ScrollReveal>
          </div>
        </article>

        {/* Article Content */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {paragraphs.map((p, i) => {
              if (p.startsWith("## ")) {
                return (
                  <ScrollReveal key={i}>
                    <h2 className="text-2xl font-bold text-[#333333] mt-10 mb-4">{p.replace("## ", "")}</h2>
                  </ScrollReveal>
                );
              }
              return (
                <ScrollReveal key={i} delay={0.05}>
                  <p className="text-[#535353] leading-relaxed mb-6">{p}</p>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#FAFAFA]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#895A18] hover:bg-[#6B4510] text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
                Ready to Transform Your Lead Generation?
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
