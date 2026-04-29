/**
 * Dynamic Sitemap — tells Google about every startup page on Miru.
 * Pulls from two sources:
 *   1. yc_companies table — all 2000+ YC companies (base coverage)
 *   2. startup_reports table — deeply researched companies (higher priority)
 *
 * Google will crawl these and index them as individual pages,
 * giving Miru thousands of keyword-targeted entry points.
 */

import { getSupabaseServer } from "@/lib/supabase";

const BASE_URL = "https://miru-1.vercel.app";

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function sitemap() {
  const db = getSupabaseServer();

  // ── Static pages ──────────────────────────────────────────────
  const staticPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/#discover`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE_URL}/#feed`, priority: 0.8, changeFrequency: "daily" },
  ];

  // ── YC company pages (base) ───────────────────────────────────
  let companyPages = [];
  if (db) {
    const { data: companies } = await db
      .from("yc_companies")
      .select("name, slug, updated_at")
      .limit(5000);

    if (companies?.length) {
      companyPages = companies.map((c) => ({
        url: `${BASE_URL}/startup/${c.slug || toSlug(c.name)}`,
        lastModified: c.updated_at || new Date().toISOString(),
        priority: 0.6,
        changeFrequency: "weekly",
      }));
    }
  }

  // ── Deeply researched startup pages (higher priority) ─────────
  let reportPages = [];
  if (db) {
    const { data: reports } = await db
      .from("startup_reports")
      .select("startup_name, domain, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (reports?.length) {
      reportPages = reports.map((r) => ({
        url: `${BASE_URL}/startup/${toSlug(r.startup_name)}`,
        lastModified: r.created_at,
        priority: 0.9, // Higher — these have rich AI-generated content
        changeFrequency: "daily",
      }));
    }
  }

  // Deduplicate by URL (researched companies override base company pages)
  const allPages = [...staticPages, ...companyPages, ...reportPages];
  const seen = new Set();
  const deduplicated = allPages.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  return deduplicated;
}
