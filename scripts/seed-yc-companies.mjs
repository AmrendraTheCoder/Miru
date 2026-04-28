/**
 * MIRU — YC Companies Seeder
 * ═══════════════════════════════════════════════════════
 * Fetches the latest 1000 YC companies from the official
 * YC public API and stores them in Supabase.
 *
 * Usage:
 *   npm run seed:yc
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   must be set in .env or .env.local
 * ═══════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Load .env ─────────────────────────────────────────────
function loadEnv() {
  const paths = [resolve(__dir, "../.env.local"), resolve(__dir, "../.env")];
  const env = {};
  for (const p of paths) {
    try {
      for (const line of readFileSync(p, "utf-8").split("\n")) {
        const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── YC Official Public API ────────────────────────────────
const YC_API      = "https://api.ycombinator.com/v0.1/companies";
const PAGE_SIZE   = 100;   // max per page
const TARGET      = 1000;

// ── Helpers ───────────────────────────────────────────────

function parseBatch(batchStr) {
  if (!batchStr) return { batch: batchStr || null, batch_year: null, batch_season: null };
  const m = batchStr.match(/^([A-Z]+)(\d{2,4})$/i);
  if (!m) return { batch: batchStr, batch_year: null, batch_season: null };
  const seasonMap = { W: "Winter", S: "Summer", F: "Fall", P: "Spring" };
  const season = seasonMap[m[1].toUpperCase()] || m[1];
  const yr = parseInt(m[2]);
  const year = yr < 100 ? 2000 + yr : yr;
  return { batch: batchStr, batch_year: year, batch_season: season };
}

function parseLocation(company) {
  const locs = company.locations || [];
  if (!locs.length) return { location: null, country: null };
  const first = locs[0];
  const parts = first.split(",").map(s => s.trim());
  const city = parts[0] || null;
  // Extract country from regions
  const regions = company.regions || [];
  const country = regions.find(r =>
    !r.toLowerCase().includes("remote") &&
    !r.toLowerCase().includes("america / canada") &&
    !r.toLowerCase().includes("europe")
  ) || null;
  return { location: city, country };
}

function normaliseCompany(c) {
  const batchInfo = parseBatch(c.batch);
  const locInfo   = parseLocation(c);
  return {
    slug:         c.slug || String(c.id),
    name:         c.name || "",
    tagline:      c.oneLiner || "",
    description:  c.longDescription || "",
    website:      c.website || "",
    ...batchInfo,
    status:       c.status || "Active",
    stage:        null, // not in this API
    team_size:    c.teamSize ? parseInt(c.teamSize) : null,
    ...locInfo,
    sectors:      [
      ...(c.tags || []),
      ...(c.industries || []),
    ].filter((v, i, a) => a.indexOf(v) === i), // dedupe
    founders:     [],   // founders not in list API; enriched separately
    logo_url:     c.smallLogoUrl || null,
    yc_url:       c.url || `https://www.ycombinator.com/companies/${c.slug}`,
    launched_at:  null,
    updated_at:   new Date().toISOString(),
  };
}

async function fetchPage(page) {
  const url = `${YC_API}?page=${page}&limit=${PAGE_SIZE}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "Miru/1.0" },
  });
  if (!res.ok) throw new Error(`YC API HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function upsertBatch(companies) {
  const { error } = await db
    .from("yc_companies")
    .upsert(companies, { onConflict: "slug", ignoreDuplicates: false });
  if (error) {
    if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
      console.error("\n❌ Table not found. Run this SQL in your Supabase SQL editor first:");
      console.error("   → supabase-yc-companies.sql\n");
    }
    throw error;
  }
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log("🔍 Miru — YC Companies Seeder");
  console.log(`📡 Source: api.ycombinator.com (official public API)`);
  console.log(`🎯 Target: ${TARGET} companies\n`);

  // Check existing count
  const { count: existing } = await db
    .from("yc_companies")
    .select("*", { count: "exact", head: true });
  console.log(`📦 Existing rows in DB: ${existing ?? 0}\n`);

  let total = 0;
  let page  = 1;
  let hasMore = true;

  while (hasMore && total < TARGET) {
    process.stdout.write(`  Page ${page} — fetching... `);

    let data;
    try {
      data = await fetchPage(page);
    } catch (e) {
      console.error(`\n❌ Fetch failed: ${e.message}`);
      process.exit(1);
    }

    const companies = (data.companies || []).map(normaliseCompany).filter(c => c.slug && c.name);

    if (!companies.length) { console.log("no more results."); break; }

    try {
      await upsertBatch(companies);
    } catch (e) {
      console.error(`\n❌ Supabase error: ${e.message}`);
      process.exit(1);
    }

    total += companies.length;
    hasMore = companies.length === PAGE_SIZE && total < TARGET;
    console.log(`✓ ${companies.length} saved (${total} total)`);

    // Polite pacing — 100ms between pages
    if (hasMore) await new Promise(r => setTimeout(r, 100));
    page++;
  }

  // ── Summary ──────────────────────────────────────────────

  const { count: finalCount } = await db
    .from("yc_companies")
    .select("*", { count: "exact", head: true });

  console.log(`\n✅ Seeder complete`);
  console.log(`   This run : ${total} companies upserted`);
  console.log(`   Total DB : ${finalCount} companies\n`);

  // Batch breakdown
  const { data: rows } = await db
    .from("yc_companies")
    .select("batch, batch_year, batch_season")
    .not("batch", "is", null)
    .order("batch_year", { ascending: false });

  if (rows?.length) {
    const counts = {};
    for (const { batch } of rows) counts[batch] = (counts[batch] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15);
    console.log("Top batches in database:");
    for (const [b, n] of top) console.log(`  ${b.padEnd(6)} → ${n} companies`);
  }
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
