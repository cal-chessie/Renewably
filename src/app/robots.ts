import type { MetadataRoute } from "next";

const blocked = ["/api/", "/crm/", "/onboarding"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: blocked },
      // AI search and citation crawlers are welcome, so ChatGPT, Claude,
      // Perplexity and Gemini can read the public site and cite it.
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "anthropic-ai",
          "Claude-Web",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
        ],
        allow: "/",
        disallow: blocked,
      },
      // Bulk training-only crawler with no citation value: blocked.
      { userAgent: "CCBot", disallow: "/" },
    ],
    sitemap: "https://renewably.ie/sitemap.xml",
  };
}
