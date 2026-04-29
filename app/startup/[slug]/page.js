/**
 * /startup/[slug] — Public, SEO-optimized company intelligence page
 *
 * Each YC company gets its own indexed page:
 *   /startup/stripe      → "Stripe — Funding, Founders & Team | Miru"
 *   /startup/airbnb      → "Airbnb — Funding, Founders & Team | Miru"
 *
 * Features:
 *   - Dynamic metadata (title, description, OG tags) per company
 *   - JSON-LD structured data for Google Rich Snippets
 *   - Cached research report if available (from startup_reports table)
 *   - Employee finder (publicly available LinkedIn profiles via Exa)
 *   - "Research deeper" CTA back to main app
 */

import { getSupabaseServer } from "@/lib/supabase";
import { notFound } from "next/navigation";
import StartupPublicPage from "./StartupPublicPage";

const BASE_URL = "https://miru-1.vercel.app";

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Fetch data server-side ──────────────────────────────────────
async function getStartupData(slug) {
  const db = getSupabaseServer();
  if (!db) return null;

  // 1. Try to find a deep research report first (richest data)
  const { data: reports } = await db
    .from("startup_reports")
    .select("startup_name, domain, report, created_at")
    .ilike("startup_name", slug.replace(/-/g, " "))
    .order("created_at", { ascending: false })
    .limit(1);

  if (reports?.[0]?.report) {
    const r = reports[0];
    return { ...r.report, _source: "report", _updatedAt: r.created_at };
  }

  // 2. Fall back to YC companies table
  const { data: companies } = await db
    .from("yc_companies")
    .select("*")
    .or(`slug.eq.${slug},name.ilike.${slug.replace(/-/g, " ")}`)
    .limit(1);

  if (companies?.[0]) {
    const c = companies[0];
    return {
      name: c.name,
      tagline: c.one_liner || c.tagline,
      overview: c.long_description,
      stage: c.status,
      founded: c.year_founded,
      totalFunding: null,
      domain: c.website?.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      sector: c.tags?.[0] || null,
      founders: c.founders || [],
      batch: c.batch,
      logo_url: c.small_logo_thumb_url,
      _source: "yc_db",
    };
  }

  return null;
}

// ── generateMetadata — unique title/description per company ─────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getStartupData(slug);

  if (!data) {
    return {
      title: "Startup Not Found | Miru",
      description: "This startup hasn't been researched on Miru yet.",
    };
  }

  const name = data.name || slug;
  const funding = data.totalFunding ? ` Raised ${data.totalFunding}.` : "";
  const founderName = data.founders?.[0]?.name;
  const founderStr = founderName ? ` Founded by ${founderName}.` : "";

  return {
    title: `${name} — Funding History, Founders & Team | Miru`,
    description: `${name}: ${data.tagline || "Startup intelligence brief."}${funding}${founderStr} Full competitor analysis, funding timeline, and employee directory on Miru.`,
    keywords: [
      name,
      `${name} funding`,
      `${name} founders`,
      `${name} competitors`,
      `${name} interview prep`,
      `${name} investors`,
      `${name} employees`,
      "YC startup",
      data.sector,
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title: `${name} — Startup Intelligence | Miru`,
      description: data.tagline || `Full intelligence brief for ${name}.`,
      url: `${BASE_URL}/startup/${slug}`,
      type: "website",
      siteName: "Miru",
    },
    twitter: {
      card: "summary",
      title: `${name} on Miru`,
      description: data.tagline || `Funding, founders & team at ${name}.`,
    },
    alternates: {
      canonical: `${BASE_URL}/startup/${slug}`,
    },
  };
}

// ── JSON-LD Structured Data ──────────────────────────────────────
function JsonLd({ data, slug }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    description: data.tagline || data.overview,
    url: data.domain ? `https://${data.domain}` : undefined,
    foundingDate: data.founded?.toString(),
    sameAs: [
      data.domain ? `https://www.crunchbase.com/organization/${slug}` : null,
      data.domain ? `https://www.linkedin.com/company/${slug}` : null,
    ].filter(Boolean),
  };

  // Add founders as Person schema
  if (data.founders?.length) {
    schema.founder = data.founders.slice(0, 3).map((f) => ({
      "@type": "Person",
      name: f.name,
      jobTitle: f.role,
      url: f.linkedinUrl || undefined,
    }));
  }

  // BreadcrumbList
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Miru", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Startups",
        item: `${BASE_URL}/startup`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.name,
        item: `${BASE_URL}/startup/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}

// ── Page Component ───────────────────────────────────────────────
export default async function StartupPage({ params }) {
  const { slug } = await params;
  const data = await getStartupData(slug);

  if (!data) notFound();

  return (
    <>
      <JsonLd data={data} slug={slug} />
      <StartupPublicPage data={data} slug={slug} />
    </>
  );
}

// Generate static params for top YC companies (pre-renders at build time)
export async function generateStaticParams() {
  const db = getSupabaseServer();
  if (!db) return [];

  const { data } = await db
    .from("yc_companies")
    .select("slug, name")
    .limit(200); // Pre-render top 200 at build time; rest use ISR

  return (data || []).map((c) => ({
    slug: c.slug || toSlug(c.name),
  }));
}

export const revalidate = 86400; // Revalidate pages every 24 hours (ISR)
