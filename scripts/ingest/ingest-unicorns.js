/**
 * ingest-unicorns.js
 * Scrapes the Wikipedia "List of unicorn companies" table.
 * Source: https://en.wikipedia.org/wiki/List_of_unicorn_companies
 * Run: node scripts/ingest/ingest-unicorns.js
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function toSlug(n = "") { return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function stripHtml(s = "") { return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#[0-9]+;/g, "").replace(/\[.*?\]/g, "").trim(); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWikiPage(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": "Miru/1.0" } });
  const data = await res.json();
  return data?.parse?.text?.["*"] || "";
}

function parseUnicornTable(html) {
  const companies = [];
  const tableMatches = [...html.matchAll(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/g)];

  for (const tableMatch of tableMatches) {
    const rows = tableMatch[1].split(/<tr[^>]*>/).slice(2);
    for (const row of rows) {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g);
      if (!cells || cells.length < 3) continue;
      const getText = (c) => stripHtml(c || "");

      const name       = getText(cells[0]);
      const valStr     = getText(cells[1]); // "$X billion" or "$X"
      const country    = getText(cells[3] || cells[2]);
      const city       = getText(cells[4] || "");
      const industry   = getText(cells[5] || cells[2]);

      if (!name || name.length < 2) continue;

      // Parse valuation: "$150 billion" or "$1.2" etc
      const valMatch = valStr.match(/\$?([\d.]+)\s*(billion|trillion|B|T)?/i);
      let valuationUsd = null;
      if (valMatch) {
        const num = parseFloat(valMatch[1]);
        const unit = (valMatch[2] || "B").toLowerCase();
        valuationUsd = unit.startsWith("t") ? Math.round(num * 1_000_000_000_000)
                     : Math.round(num * 1_000_000_000);
      }

      companies.push({ name, valuationUsd, country: country || "US", city, industry });
    }
  }
  return companies;
}

async function main() {
  console.log("🦄 Ingesting unicorn companies from Wikipedia...\n");
  const { error: check } = await db.from("companies").select("id").limit(1);
  if (check?.code === "42P01") { console.error("❌ Run setup.sql first."); process.exit(1); }

  const html = await fetchWikiPage("List_of_unicorn_companies");
  console.log(`  Fetched page (${html.length} chars)`);

  const parsed = parseUnicornTable(html);
  console.log(`  Parsed ${parsed.length} unicorns`);

  if (!parsed.length) { console.error("❌ Could not parse table."); return; }

  const rows = parsed.map(c => ({
    slug:          toSlug(c.name),
    name:          c.name,
    source:        "unicorn",
    category:      "unicorn",
    sector:        c.industry ? [c.industry] : [],
    is_public:     false,
    valuation_usd: c.valuationUsd,
    country:       c.country || "US",
    hq_city:       c.city || null,
    updated_at:    new Date().toISOString(),
  }));

  let total = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await db.from("companies").upsert(batch, { onConflict: "slug" });
    if (error) console.error(`  Batch error:`, error.message);
    else { total += batch.length; process.stdout.write(`  ✅ ${total} unicorns inserted\r`); }
    await sleep(200);
  }

  console.log(`\n✅ Unicorn ingestion complete: ${total} companies`);
}

main().catch(console.error);
