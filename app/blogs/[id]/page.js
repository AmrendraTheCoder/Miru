/**
 * /blogs/[id] — Server-rendered personalized blog page
 * 
 * SEO features:
 *  - generateMetadata: unique title/description/OG per blog
 *  - generateStaticParams: pre-render all blog IDs at build time
 *  - JSON-LD: BlogPosting + BreadcrumbList schema
 *  - ISR: revalidate every 24h
 */

import { dummyBlogs } from "@/lib/blogs";
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";

const BASE_URL = "https://miru-1.vercel.app";

// ── Pre-render all blog IDs at build time ────────────────────────
export function generateStaticParams() {
  return dummyBlogs.map((b) => ({ id: b.id }));
}

// ── Unique metadata per blog ─────────────────────────────────────
export async function generateMetadata({ params }) {
  const { id } = await params;
  const blog = dummyBlogs.find((b) => b.id === id);
  if (!blog) return { title: "Blog Not Found | Miru" };

  const totalReadTime = blog.sections.reduce((a, s) => a + s.readTime, 0);

  return {
    title: `${blog.headline} | Miru Insights`,
    description: blog.description,
    keywords: [
      "startup blog",
      "Miru insights",
      blog.headline,
      ...blog.sections.map((s) => s.label),
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title: blog.headline,
      description: blog.description,
      url: `${BASE_URL}/blogs/${id}`,
      type: "article",
      siteName: "Miru",
      images: blog.image ? [{ url: blog.image, alt: blog.headline }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.headline,
      description: blog.description,
    },
    alternates: { canonical: `${BASE_URL}/blogs/${id}` },
    other: {
      "article:published_time": new Date().toISOString(),
      "article:section": "Startup Intelligence",
    },
  };
}

// ── JSON-LD: BlogPosting + BreadcrumbList ─────────────────────────
function BlogPostJsonLd({ blog }) {
  const totalReadTime = blog.sections.reduce((a, s) => a + s.readTime, 0);

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.headline,
    description: blog.description,
    image: blog.image,
    url: `${BASE_URL}/blogs/${blog.id}`,
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    timeRequired: `PT${totalReadTime}M`,
    publisher: {
      "@type": "Organization",
      name: "Miru",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/apple-icon.svg`,
      },
    },
    author: {
      "@type": "Organization",
      name: "Miru Insights Team",
      url: BASE_URL,
    },
    keywords: blog.sections.map((s) => s.label).join(", "),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Miru", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blogs",
        item: `${BASE_URL}/blogs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.headline,
        item: `${BASE_URL}/blogs/${blog.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}

// ── Page component (server) ──────────────────────────────────────
export default async function BlogPostPage({ params, searchParams }) {
  const { id } = await params;
  const blog = dummyBlogs.find((b) => b.id === id);

  if (!blog) notFound();

  const sp = await searchParams;
  const sectionsParam = sp?.sections || null;

  return (
    <>
      <BlogPostJsonLd blog={blog} />
      <BlogPostClient blog={blog} sectionsParam={sectionsParam} />
    </>
  );
}

export const revalidate = 86400; // ISR — revalidate every 24h
