/**
 * MIRU — YC Companies Seeder
 * ═══════════════════════════════════════════════════════
 * Fetches the latest 1000 YC companies from YC's public
 * Algolia search API and stores them in Supabase.
 *
 * Usage:
 *   node scripts/seed-yc-companies.mjs
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

// Load .env manually (no dotenv needed in Node 20+)
function loadEnv() {
  const paths = [resolve(__dir, "../.env.local"), resolve(__dir, "../.env")];
  const env = {};
  for (const p of paths) {
    try {
      const lines = readFileSync(p, "utf-8").split("\n");
      for (const line of lines) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
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

// ── YC Algolia API (public search credentials, read-only) ──
const ALGOLIA_APP_ID = "UJ5WYC0LIO";
const ALGOLIA_KEY    = "8bbe4c87e233ccebb8934d55c65e75f9";
const ALGOLIA_INDEX  = "companies_production";
const ALGOLIA_URL    = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;

const PAGE_SIZE = 100; // Algolia max per page
const TARGET    = 1000;

// ── Helpers ──────────────────────────────────────────────

function parseBatch(batchStr) {
  if (!batchStr) return { batch: null, batch_year: null, batch_season: null };
  const m = batchStr.match(/^([WSF])(\d{2}|\d{4})$/i);
  if (!m) return { batch: batchStr, batch_year: null, batch_season: null };
  const seasonMap = { W: "Winter", S: "Summer", F: "Fall", SP: "Spring" };
  const season = seasonMap[m[1].toUpperCase()] || m[1];
  const yr = parseInt(m[2]);
  const year = yr < 100 ? (yr > 50 ? 1900 + yr : 2000 + yr) : yr;
  return { batch: batchStr, batch_year: year, batch_season: season };
}

function normaliseCompany(hit) {
  const batchInfo = parseBatch(hit.batch);
  return {
    slug:          hit.slug || hit.objectID || "",
    name:          hit.name || "",
    tagline:       hit.one_liner || hit.tagline || "",
    description:   hit.long_description || hit.description || "",
    website:       hit.website || "",
    ...batchInfo,
    status:        hit.status || "Active",
    stage:         hit.stage || null,
    team_size:     hit.team_size ? parseInt(hit.team_size) : null,
    location:      hit.city || hit.location || null,
    country:       hit.country || null,
    sectors:       Array.isArray(hit.tags) ? hit.tags : [],
    founders:      Array.isArray(hit.founders) ? hit.founders.map(f => ({
      name:     f.full_name || f.name || "",
      title:    f.title || "",
      linkedin: f.linkedin_url || null,
    })) : [],
    logo_url:      hit.small_logo_url || hit.logo_url || null,
    yc_url:        hit.slug ? `https://www.ycombinator.com/companies/${hit.slug}` : null,
    launched_at:   hit.launched_at ? new Date(hit.launched_at * 1000).toISOString() : null,
    updated_at:    new Date().toISOString(),
  };
}

async function fetchPage(page) {
  const res = await fetch(ALGOLIA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": ALGOLIA_APP_ID,
      "X-Algolia-API-Key": ALGOLIA_KEY,
    },
    body: JSON.stringify({
      query: "",
      hitsPerPage: PAGE_SIZE,
      page,
      attributesToRetrieve: [
        "slug", "name", "one_liner", "long_description", "website",
        "batch", "status", "stage", "team_size", "city", "country",
        "tags", "founders", "small_logo_url", "launched_at",
      ],
      filters: "status:Active OR status:Inactive OR status:Acquired OR status:Public",
    }),
  });
  if (!res.ok) throw new Error(`Algolia HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function upsertBatch(companies) {
  const { error } = await db
    .from("yc_companies")
    .upsert(companies, { onConflict: "slug", ignoreDuplicates: false });
  if (error) throw error;
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log("🔍 Miru — YC Companies Seeder");
  console.log(`🎯 Target: ${TARGET} companies`);
  console.log("📡 Source: YC Algolia API (public)\n");

  let total = 0;
  let page = 0;
  let maxPages = Math.ceil(TARGET / PAGE_SIZE);

  // Check existing count
  const { count: existing } = await db
    .from("yc_companies")
    .select("*", { count: "exact", head: true });
  console.log(`📦 Existing rows in DB: ${existing || 0}\n`);

  while (page < maxPages) {
    process.stdout.write(`  Page ${page + 1}/${maxPages} — fetching ${PAGE_SIZE} companies... `);

    let data;
    try {
      data = await fetchPage(page);
    } catch (e) {
      console.error(`\n❌ Algolia fetch failed: ${e.message}`);
      console.log("💡 YC may have rotated their Algolia key. Run the fallback Exa seeder instead.");
      process.exit(1);
    }

    const hits = data.hits || [];
    if (!hits.length) {
      console.log("no more results.");
      break;
    }

    const companies = hits.map(normaliseCompany).filter(c => c.slug && c.name);

    try {
      await upsertBatch(companies);
    } catch (e) {
      console.error(`\n❌ Supabase upsert failed: ${e.message}`);
      console.error("💡 Did you run supabase-yc-companies.sql in your Supabase SQL editor?");
      process.exit(1);
    }

    total += companies.length;
    const nbPages = data.nbPages || maxPages;
    maxPages = Math.min(maxPages, nbPages);

    console.log(`✓ ${companies.length} saved (${total} total)`);

    // Respect rate limits
    if (page < maxPages - 1) await new Promise(r => setTimeout(r, 120));
    page++;
  }

  // Final count in DB
  const { count: finalCount } = await db
    .from("yc_companies")
    .select("*", { count: "exact", head: true });

  console.log(`\n✅ Done! ${total} companies upserted this run.`);
  console.log(`📊 Total in database: ${finalCount}`);
  console.log("\nTop batches stored:");

  const { data: batches } = await db
    .from("yc_companies")
    .select("batch")
    .not("batch", "is", null)
    .order("batch_year", { ascending: false });

  if (batches) {
    const counts = {};
    for (const { batch } of batches) counts[batch] = (counts[batch] || 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [b, n] of sorted) console.log(`  ${b.padEnd(6)} → ${n} companies`);
  }
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
