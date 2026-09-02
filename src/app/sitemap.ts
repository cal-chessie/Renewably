import type { MetadataRoute } from "next";
import { posts } from "@/lib/blog-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://renewably.ie";
  // Stable last-content-update date. Using new Date() here churned lastModified
  // on every deploy, which is a weak signal to crawlers; bump this when the
  // static marketing pages actually change.
  const lastUpdated = new Date("2026-08-27");

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: lastUpdated, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: lastUpdated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/workforce`, lastModified: lastUpdated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: lastUpdated, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: lastUpdated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: lastUpdated, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: lastUpdated, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/pricing`, lastModified: lastUpdated, changeFrequency: "monthly", priority: 0.9 },
  ];

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
