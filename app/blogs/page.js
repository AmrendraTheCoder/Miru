import { dummyBlogs } from "@/lib/blogs";
import BlogsListingClient from "./BlogsListingClient";

const BASE_URL = "https://miru-1.vercel.app";

export const metadata = {
  title: "Miru Insights — Startup Blogs, Funding Breakdowns & Founder Guides",
  description:
    "In-depth startup blogs on funding landscapes, founder playbooks, product interview prep, and YC batch breakdowns. Personalized reading for builders and students.",
  keywords:
    "startup blog, YC startups, founder insights, funding breakdown, product interview prep, Miru insights, startup news",
  openGraph: {
    title: "Miru Insights — Startup Blogs & Founder Guides",
    description:
      "Deep-dive blogs on startup funding, founders, and how to crack product interviews at top companies.",
    url: `${BASE_URL}/blogs`,
    type: "website",
    siteName: "Miru",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miru Insights — Startup Blogs",
    description:
      "Funding breakdowns, founder guides, placement prep — personalized for you.",
  },
  alternates: { canonical: `${BASE_URL}/blogs` },
};

// JSON-LD: BlogPosting list → helps Google show sitelinks
function BlogListJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Miru Insights",
    description:
      "Startup intelligence blogs — funding, founders, and placement guides.",
    url: `${BASE_URL}/blogs`,
    blogPost: dummyBlogs.map((b) => ({
      "@type": "BlogPosting",
      headline: b.headline,
      description: b.description,
      url: `${BASE_URL}/blogs/${b.id}`,
      image: b.image,
      timeRequired: `PT${b.sections.reduce((a, s) => a + s.readTime, 0)}M`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Server component — renders the JSON-LD + hands off to client for interactivity
export default function BlogsPage() {
  return (
    <>
      <BlogListJsonLd />
      <BlogsListingClient blogs={dummyBlogs} />
    </>
  );
}
