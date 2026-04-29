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

  const nameFromSlug = slug.replace(/-/g, " ");
  const nameCapitalized = nameFromSlug
    .split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  if (db) {
    // 1. Check for a full AI research report (richest data)
    const { data: reports } = await db
      .from("startup_reports")
      .select("startup_name, domain, report, created_at")
      .or(`startup_name.ilike.%${nameFromSlug}%,startup_name.ilike.%${slug}%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (reports?.[0]?.report) {
      const r = reports[0];
      return { ...r.report, _source: "report", _updatedAt: r.created_at };
    }

    // 2. Check the new master companies table (YC + Fortune 500 + Unicorns + Tech Giants)
    const { data: masterHit } = await db
      .from("companies")
      .select("*")
      .or(`slug.eq.${slug},name.ilike.${nameCapitalized},name.ilike.%${nameFromSlug}%`)
      .order("source", { ascending: true }) // yc < unicorn < fortune500 < tech_list
      .limit(1);

    if (masterHit?.[0]) {
      const c = masterHit[0];
      return {
        name:          c.name,
        tagline:       c.tagline || null,
        overview:      c.description || null,
        stage:         c.category || null,
        founded:       c.yc_batch_year || null,
        totalFunding:  c.total_funding || null,
        sector:        c.sector?.[0] || null,
        founders:      [],
        domain:        c.website?.replace(/^https?:\/\//, "").replace(/\/$/, "") || null,
        logo_url:      c.logo_url || null,
        // Extra fields available for display
        employeeCount: c.employee_count || null,
        valuationUsd:  c.valuation_usd || null,
        revenueUsd:    c.revenue_usd || null,
        marketCapUsd:  c.market_cap_usd || null,
        stockTicker:   c.stock_ticker || null,
        isPublic:      c.is_public || false,
        ranking:       c.ranking || null,
        country:       c.country || null,
        hqCity:        c.hq_city || null,
        yc_batch:      c.yc_batch || null,
        _source:       c.source === "yc" ? "yc_db" : c.source,
        _dbSource:     c.source,
        _slug:         slug,
        _updatedAt:    c.updated_at,
      };
    }

    // 3. Legacy fallback to old yc_companies table
    const { data: ycHit } = await db
      .from("yc_companies")
      .select("*")
      .or(
        `slug.eq.${slug},` +
        `name.ilike.${nameFromSlug},` +
        `name.ilike.${nameCapitalized},` +
        `name.ilike.%${nameFromSlug}%`
      )
      .limit(1);

    if (ycHit?.[0]) {
      const c = ycHit[0];
      return {
        name: c.name,
        tagline: c.one_liner || c.tagline,
        overview: c.long_description || c.description,
        stage: c.status,
        founded: c.year_founded,
        totalFunding: null,
        domain: c.website?.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        sector: c.tags?.[0] || null,
        founders: c.founders || [],
        batch: c.batch,
        logo_url: c.small_logo_thumb_url,
        _source: "yc_db",
        _slug: slug,
      };
    }
  }

  // 4. Return stub — client will auto-trigger research
  return {
    name: nameCapitalized || slug,
    tagline: null,
    overview: null,
    _source: "stub",
    _slug: slug,
  };
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
    title: `${name} — Salary, Perks, Funding & Founders | Miru`,
    description: `${name}: ${data.tagline || "Company intelligence brief."}${funding}${founderStr} Salary benchmarks, employee perks, office culture, competitor analysis and funding history on Miru.`,
    keywords: [
      name,
      `${name} salary`,
      `${name} software engineer salary`,
      `${name} total compensation`,
      `${name} perks benefits`,
      `${name} work culture`,
      `${name} glassdoor rating`,
      `${name} interview process`,
      `${name} funding`,
      `${name} founders`,
      `${name} competitors`,
      `life at ${name}`,
      `work at ${name}`,
      `${name} employees`,
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

  // Never 404 — always render the page with whatever data we have
  // The client component handles the "stub" state by auto-triggering research
  if (!data) {
    const nameFromSlug = slug
      .replace(/-/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return (
      <>
        <StartupPublicPage
          data={{ name: nameFromSlug, tagline: null, overview: null, _source: "stub", _slug: slug }}
          slug={slug}
        />
      </>
    );
  }

  return (
    <>
      <JsonLd data={data} slug={slug} />
      <StartupPublicPage data={data} slug={slug} />
    </>
  );
}

// Pre-render top companies from all sources at build time
export async function generateStaticParams() {
  const db = getSupabaseServer();
  if (!db) return [];

  const { data } = await db
    .from("companies")
    .select("slug, name, source")
    .order("source")
    .limit(500); // Pre-render top 500; rest use ISR

  return (data || []).map((c) => ({
    slug: c.slug || toSlug(c.name),
  }));
}

export const revalidate = 86400; // Revalidate pages every 24 hours (ISR)
