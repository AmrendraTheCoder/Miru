/**
 * ingest-forbes2000.js
 * Scrapes Forbes Global 2000 from Wikipedia.
 * Source: https://en.wikipedia.org/wiki/Forbes_Global_2000
 * Run: node scripts/ingest/ingest-forbes2000.js
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function toSlug(n = "") { return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function stripHtml(s = "") { return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\[.*?\]/g, "").trim(); }
function parseBillions(s = "") {
  const m = s.match(/([\d.]+)/);
  return m ? Math.round(parseFloat(m[1]) * 1_000_000_000) : null;
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWikiPage(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": "Miru/1.0" } });
  const data = await res.json();
  return data?.parse?.text?.["*"] || "";
}

function parseForbesTable(html) {
  const companies = [];
  const tableMatches = [...html.matchAll(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/g)];

  for (const tableMatch of tableMatches) {
    const rows = tableMatch[1].split(/<tr[^>]*>/).slice(2);
    for (const row of rows) {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g);
      if (!cells || cells.length < 4) continue;
      const t = (c) => stripHtml(c || "");

      const rank       = parseInt(t(cells[0])) || null;
      const name       = t(cells[1]);
      const country    = t(cells[2]);
      const sales      = parseBillions(t(cells[3]));    // Revenue in $B
      const marketCap  = cells[6] ? parseBillions(t(cells[6])) : null;

      if (!name || !rank) continue;
      companies.push({ rank, name, country, sales, marketCap });
    }
  }
  return companies;
}

async function main() {
  console.log("🌍 Ingesting Forbes Global 2000 from Wikipedia...\n");
  const { error: check } = await db.from("companies").select("id").limit(1);
  if (check?.code === "42P01") { console.error("❌ Run setup.sql first."); process.exit(1); }

  const html = await fetchWikiPage("Forbes_Global_2000");
  console.log(`  Fetched page (${html.length} chars)`);

  const parsed = parseForbesTable(html);
  console.log(`  Parsed ${parsed.length} companies`);

  if (!parsed.length) { console.error("❌ Could not parse Forbes table."); return; }

  const rows = parsed.map(c => ({
    slug:          toSlug(c.name),
    name:          c.name,
    source:        "forbes2000",
    category:      "public",
    is_public:     true,
    ranking:       c.rank,
    revenue_usd:   c.sales,
    market_cap_usd:c.marketCap,
    country:       c.country || "US",
    updated_at:    new Date().toISOString(),
  }));

  let total = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await db.from("companies").upsert(batch, { onConflict: "slug" });
    if (error) console.error(`  Batch ${Math.floor(i/100)+1} error:`, error.message);
    else { total += batch.length; process.stdout.write(`  ✅ ${total} companies\r`); }
    await sleep(300);
  }

  console.log(`\n✅ Forbes 2000 ingestion complete: ${total} companies`);
}

main().catch(console.error);
