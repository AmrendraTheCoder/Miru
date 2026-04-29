/**
 * Dynamic Sitemap — tells Google about every startup page on Miru.
 * Sources:
 *   1. startup_reports — deeply researched companies (highest priority)
 *   2. yc_companies    — all 2000+ YC companies (base coverage)
 *   3. Trending news companies (hardcoded seeds for crawl bootstrap)
 */

import { getSupabaseServer } from "@/lib/supabase";

const BASE_URL = "https://miru-1.vercel.app";

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Seed list — ensures Google crawls these high-traffic company pages
// even before they get researched by a user
const SEED_COMPANIES = [
  "Airbnb", "Stripe", "Coinbase", "DoorDash", "Dropbox", "Brex", "Gusto",
  "Scale AI", "OpenAI", "Anthropic", "Notion", "Linear", "Figma", "Vercel",
  "Supabase", "Airtable", "Retool", "Ramp", "Mercury", "Deel", "Rippling",
  "NeoCognition", "Perplexity", "Mistral", "Cohere", "Inflection", "Character.AI",
];

export default async function sitemap() {
  const db = getSupabaseServer();
  const now = new Date().toISOString();

  // ── Static pages ──────────────────────────────────────────────
  const staticPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/#discover`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE_URL}/#feed`, priority: 0.8, changeFrequency: "daily" },
  ];

  // ── Deeply researched startup pages (highest priority) ────────
  let reportPages = [];
  if (db) {
    const { data: reports } = await db
      .from("startup_reports")
      .select("startup_name, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (reports?.length) {
      reportPages = reports.map((r) => ({
        url: `${BASE_URL}/startup/${toSlug(r.startup_name)}`,
        lastModified: r.created_at,
        priority: 0.9,
        changeFrequency: "daily",
      }));
    }
  }

  // ── YC company pages (base coverage) ─────────────────────────
  let companyPages = [];
  if (db) {
    const { data: companies } = await db
      .from("yc_companies")
      .select("name, slug, updated_at")
      .limit(5000);

    if (companies?.length) {
      companyPages = companies.map((c) => ({
        url: `${BASE_URL}/startup/${c.slug || toSlug(c.name)}`,
        lastModified: c.updated_at || now,
        priority: 0.6,
        changeFrequency: "weekly",
      }));
    }
  }

  // ── Seed pages (high-traffic companies bootstrapped for crawl) ─
  const seedPages = SEED_COMPANIES.map((name) => ({
    url: `${BASE_URL}/startup/${toSlug(name)}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  // Merge: reports override yc_companies override seeds
  // Higher-priority sources first so dedup keeps them
  const allPages = [...staticPages, ...reportPages, ...seedPages, ...companyPages];
  const seen = new Set();
  const deduplicated = allPages.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  return deduplicated;
}
