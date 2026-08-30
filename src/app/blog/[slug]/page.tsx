import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BlogPostClient from "@/components/BlogPostClient";
import { posts, getPostBySlug } from "@/lib/blog-data";

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://renewably.ie/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      url: `https://renewably.ie/blog/${slug}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: "https://renewably.ie/og-image.png",
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "Renewably",
      url: "https://renewably.ie",
    },
    publisher: {
      "@type": "Organization",
      name: "Renewably",
      url: "https://renewably.ie",
      logo: {
        "@type": "ImageObject",
        url: "https://renewably.ie/logo-icon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://renewably.ie/blog/${slug}`,
    },
    articleSection: post.category,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://renewably.ie",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://renewably.ie/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://renewably.ie/blog/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogPostClient />
    </>
  );
}
