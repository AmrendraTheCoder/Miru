/**
 * MIRU — YC Companies Seeder (yc-oss GitHub API)
 * ═══════════════════════════════════════════════════════
 * Source: https://github.com/yc-oss/api
 *   → https://yc-oss.github.io/api/companies/all.json
 *   → 5,690 companies, free, no auth, no rate-limit
 *
 * Usage:
 *   npm run seed:yc              → seed 1000 newest companies
 *   npm run seed:yc -- --all    → seed all 5690 companies
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 * ═══════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ALL_FLAG = process.argv.includes("--all");
const TARGET   = ALL_FLAG ? Infinity : 1000;

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

// ── yc-oss API (community mirror, full dataset) ───────────
// Single JSON file, ~5MB, all companies since 2005
const YC_OSS_ALL = "https://yc-oss.github.io/api/companies/all.json";

// ── Batch normalisation ───────────────────────────────────
// yc-oss format: "Winter 2024", "Summer 2023", "Fall 2024", "Spring 2025"
const SEASON_ORDER = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 };
const SEASON_SHORT = { Winter: "W", Summer: "S", Fall: "F", Spring: "P" };

function parseBatch(raw) {
  if (!raw || raw === "Unspecified") return { batch: raw || null, batch_year: null, batch_season: null };

  // "Winter 2024" → season="Winter", year=2024
  const full = raw.match(/^(Winter|Summer|Fall|Spring)\s+(\d{4})$/i);
  if (full) {
    const season = full[1].charAt(0).toUpperCase() + full[1].slice(1).toLowerCase();
    const year   = parseInt(full[2]);
    const short  = (SEASON_SHORT[season] || season[0]) + String(year).slice(2);
    return { batch: short, batch_year: year, batch_season: season };
  }

  // Short codes already: "W24", "S23" etc.
  const short = raw.match(/^([WSFP])(\d{2,4})$/i);
  if (short) {
    const seasonMap = { W: "Winter", S: "Summer", F: "Fall", P: "Spring" };
    const season = seasonMap[short[1].toUpperCase()] || short[1];
    const yr = parseInt(short[2]);
    const year = yr < 100 ? 2000 + yr : yr;
    return { batch: raw, batch_year: year, batch_season: season };
  }

  return { batch: raw, batch_year: null, batch_season: null };
}

// Sort key: newest first. Spring < Summer < Fall < Winter within same year.
function batchSortKey(raw) {
  const { batch_year, batch_season } = parseBatch(raw);
  const seasonOrd = SEASON_ORDER[batch_season] || 0;
  return (batch_year || 0) * 10 + seasonOrd;
}


// ── Normalise one company row ─────────────────────────────
function normalise(c) {
  const batchInfo = parseBatch(c.batch);
  const sectors   = [...new Set([...(c.tags || []), ...(c.industries || [])])];
  // all_locations is a comma-separated string e.g. "San Francisco, CA, USA"
  const location  = c.all_locations?.split(",")[0]?.trim() || null;
  const country   = c.regions?.[0] || null;
  const founders  = (c.founders || []).map(f => ({
    name:     f.first_name ? `${f.first_name} ${f.last_name || ""}`.trim() : f.name || "",
    title:    f.title || "",
    linkedin: f.linkedin_url || f.linkedin || "",
  }));

  return {
    slug:         c.slug       || String(c.id),
    name:         c.name       || "",
    tagline:      c.one_liner  || "",
    description:  c.long_description || "",
    website:      c.website    || "",
    ...batchInfo,
    status:       c.status     || "Active",
    stage:        c.stage      || null,
    team_size:    c.team_size  ? parseInt(c.team_size) : null,
    location,
    country,
    sectors,
    founders,
    logo_url:     c.small_logo_thumb_url || null,
    yc_url:       c.url || (c.slug ? `https://www.ycombinator.com/companies/${c.slug}` : null),
    launched_at:  c.launched_at ? new Date(c.launched_at * 1000).toISOString() : null,
    updated_at:   new Date().toISOString(),
  };
}


// ── Upsert in chunks of 100 ───────────────────────────────
async function upsertChunk(rows) {
  const { error } = await db
    .from("yc_companies")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: false });
  if (error) {
    if (error.message?.includes("does not exist") || error.message?.includes("relation")) {
      console.error("\n❌ Table 'yc_companies' not found.");
      console.error("   Run the SQL migration first:");
      console.error("   https://supabase.com/dashboard/project/asmqgjvpnzqxkdfgnout/sql/new\n");
      process.exit(1);
    }
    throw error;
  }
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log("🔍 Miru — YC Companies Seeder (yc-oss GitHub API)");
  console.log(`📡 Source : yc-oss.github.io/api/companies/all.json`);
  console.log(`🎯 Target : ${ALL_FLAG ? "ALL" : TARGET} companies\n`);

  // Check existing
  const { count: existing } = await db
    .from("yc_companies")
    .select("*", { count: "exact", head: true });
  console.log(`📦 Existing rows: ${existing ?? 0}\n`);

  // Fetch full dataset
  process.stdout.write("⬇  Fetching full YC dataset... ");
  let raw;
  try {
    const res = await fetch(YC_OSS_ALL, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    raw = await res.json();
  } catch (e) {
    console.error(`\n❌ Fetch failed: ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error("❌ Unexpected response format (expected array).");
    process.exit(1);
  }

  console.log(`${raw.length} companies received.`);

  // Sort newest batch first, take TARGET
  const sorted = raw
    .filter(c => c.slug && c.name)
    .sort((a, b) => batchSortKey(b.batch) - batchSortKey(a.batch));

  const toSeed = ALL_FLAG ? sorted : sorted.slice(0, TARGET);
  console.log(`📋 Seeding ${toSeed.length} companies (newest first)...\n`);

  // Upsert in chunks of 100
  const CHUNK = 100;
  let done = 0;
  for (let i = 0; i < toSeed.length; i += CHUNK) {
    const chunk = toSeed.slice(i, i + CHUNK).map(normalise);
    process.stdout.write(`  Chunk ${Math.floor(i / CHUNK) + 1}/${Math.ceil(toSeed.length / CHUNK)} [${done + 1}–${done + chunk.length}]... `);
    try {
      await upsertChunk(chunk);
      done += chunk.length;
      console.log(`✓ (${done} total)`);
    } catch (e) {
      console.error(`\n❌ Supabase error: ${e.message}`);
      process.exit(1);
    }
    // 50ms between chunks — polite
    await new Promise(r => setTimeout(r, 50));
  }

  // Summary
  const { count: finalCount } = await db
    .from("yc_companies")
    .select("*", { count: "exact", head: true });

  console.log(`\n✅ Seeder complete`);
  console.log(`   This run : ${done} companies upserted`);
  console.log(`   Total DB : ${finalCount} companies\n`);

  // Batch breakdown
  const { data: rows } = await db
    .from("yc_companies")
    .select("batch")
    .not("batch", "is", null)
    .order("batch", { ascending: false })
    .limit(2000);

  if (rows?.length) {
    const counts = {};
    for (const { batch } of rows) counts[batch] = (counts[batch] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
    console.log("Top batches in database:");
    for (const [b, n] of top) console.log(`  ${b.padEnd(8)} → ${n} companies`);
  }
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
