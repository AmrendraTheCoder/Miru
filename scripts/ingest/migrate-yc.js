/**
 * migrate-yc.js
 * Migrates all 5,715 rows from yc_companies → companies table.
 * Run: node scripts/ingest/migrate-yc.js
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseSectors(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return [String(raw)]; }
}

async function main() {
  console.log("📦 Migrating yc_companies → companies...\n");

  // Check companies table exists
  const { error: tableCheck } = await db.from("companies").select("id").limit(1);
  if (tableCheck?.code === "42P01") {
    console.error("❌ companies table does not exist. Run setup.sql in Supabase dashboard first.");
    process.exit(1);
  }

  let page = 0;
  const PAGE_SIZE = 500;
  let total = 0;
  let skipped = 0;

  while (true) {
    const { data: rows, error } = await db
      .from("yc_companies")
      .select("*")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) { console.error("Fetch error:", error.message); break; }
    if (!rows?.length) break;

    const companies = rows.map((r) => ({
      slug:          r.slug || toSlug(r.name),
      name:          r.name,
      tagline:       r.tagline || null,
      description:   r.description || null,
      website:       r.website || null,
      logo_url:      r.logo_url || null,
      source:        "yc",
      category:      "startup",
      sector:        parseSectors(r.sectors),
      is_public:     false,
      country:       r.country || "US",
      hq_city:       r.location || null,
      yc_batch:      r.batch || null,
      yc_batch_year: r.batch_year || null,
      employee_count: r.team_size || null,
      updated_at:    new Date().toISOString(),
    }));

    const { error: upsertErr } = await db
      .from("companies")
      .upsert(companies, { onConflict: "slug", ignoreDuplicates: false });

    if (upsertErr) {
      console.error(`Page ${page} error:`, upsertErr.message);
      skipped += companies.length;
    } else {
      total += companies.length;
      console.log(`  ✅ Page ${page + 1}: ${companies.length} companies (total: ${total})`);
    }

    page++;
    if (rows.length < PAGE_SIZE) break;
    await new Promise((r) => setTimeout(r, 200)); // rate limit
  }

  console.log(`\n✅ YC migration complete: ${total} companies inserted, ${skipped} skipped`);
}

main().catch(console.error);
