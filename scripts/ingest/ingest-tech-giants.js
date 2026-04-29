/**
 * ingest-tech-giants.js
 * Seeds ~70 major tech companies with hardcoded data (no API needed).
 * Run: node scripts/ingest/ingest-tech-giants.js
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function toSlug(n = "") { return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

// [name, ticker, marketCapM, revenueM, employees, hq, country, sectors]
const COMPANIES = [
  ["Apple",     "AAPL", 3_300_000, 383_000, 164_000, "Cupertino",     "US", ["Consumer Electronics","Software","AI"]],
  ["Microsoft", "MSFT", 3_100_000, 212_000, 221_000, "Redmond",       "US", ["Cloud","Enterprise Software","AI","Gaming"]],
  ["Nvidia",    "NVDA", 2_800_000, 130_000,  36_000, "Santa Clara",   "US", ["Semiconductors","AI","Data Centers"]],
  ["Google",    "GOOGL",2_100_000, 307_000, 182_000, "Mountain View", "US", ["Search","Cloud","AI","Advertising"]],
  ["Alphabet",  "GOOGL",2_100_000, 307_000, 182_000, "Mountain View", "US", ["Search","Cloud","AI"]],
  ["Amazon",    "AMZN", 2_000_000, 590_000,1_525_000,"Seattle",       "US", ["E-Commerce","Cloud","Logistics","AI"]],
  ["Meta",      "META", 1_400_000, 135_000,  70_000, "Menlo Park",    "US", ["Social Media","VR/AR","AI"]],
  ["Tesla",     "TSLA",   800_000,  97_000, 140_000, "Austin",        "US", ["Electric Vehicles","Energy","AI"]],
  ["Netflix",   "NFLX",   300_000,  37_000,  13_000, "Los Gatos",     "US", ["Streaming","Entertainment"]],
  ["Salesforce","CRM",    250_000,  34_000,  72_000, "San Francisco", "US", ["CRM","Enterprise Software","Cloud"]],
  ["Oracle",    "ORCL",   400_000,  53_000, 164_000, "Austin",        "US", ["Database","Cloud","Enterprise Software"]],
  ["Adobe",     "ADBE",   200_000,  20_000,  30_000, "San Jose",      "US", ["Creative Software","SaaS","Marketing"]],
  ["Intel",     "INTC",   100_000,  54_000, 124_000, "Santa Clara",   "US", ["Semiconductors","Hardware"]],
  ["AMD",       "AMD",    250_000,  23_000,  26_000, "Santa Clara",   "US", ["Semiconductors","AI","Gaming"]],
  ["TSMC",      "TSM",    900_000,  93_000,  65_000, "Hsinchu",       "TW", ["Semiconductors","Foundry"]],
  ["Broadcom",  "AVGO",   800_000,  51_000,  20_000, "San Jose",      "US", ["Semiconductors","Networking"]],
  ["Qualcomm",  "QCOM",   190_000,  39_000,  51_000, "San Diego",     "US", ["Semiconductors","Mobile","IoT"]],
  ["Visa",      "V",      560_000,  33_000,  30_000, "San Francisco", "US", ["Payments","Fintech"]],
  ["Mastercard","MA",     430_000,  25_000,  34_000, "Purchase",      "US", ["Payments","Fintech"]],
  ["PayPal",    "PYPL",    70_000,  31_000,  26_000, "San Jose",      "US", ["Payments","Fintech"]],
  ["Shopify",   "SHOP",   110_000,   8_000,  11_000, "Ottawa",        "CA", ["E-Commerce","SaaS","Payments"]],
  ["Uber",      "UBER",   160_000,  38_000,  32_000, "San Francisco", "US", ["Ride-sharing","Food Delivery","Logistics"]],
  ["Airbnb",    "ABNB",    80_000,  10_000,   6_900, "San Francisco", "US", ["Travel","Marketplace","Hospitality"]],
  ["DoorDash",  "DASH",    25_000,   9_000,  21_000, "San Francisco", "US", ["Food Delivery","Logistics"]],
  ["Palantir",  "PLTR",   100_000,   3_000,   4_000, "Denver",        "US", ["Data Analytics","AI","Government"]],
  ["CrowdStrike","CRWD",   90_000,   3_000,   9_000, "Austin",        "US", ["Cybersecurity","AI","Cloud"]],
  ["Palo Alto Networks","PANW",120_000,8_000,15_000,"Santa Clara",   "US", ["Cybersecurity","Cloud","Networking"]],
  ["Cloudflare","NET",     40_000,   2_000,   4_000, "San Francisco", "US", ["CDN","Security","Cloud"]],
  ["Datadog",   "DDOG",    40_000,   2_400,   6_800, "New York",      "US", ["DevOps","Monitoring","Cloud"]],
  ["Snowflake", "SNOW",    48_000,   3_000,   7_000, "Bozeman",       "US", ["Data Cloud","Analytics","SaaS"]],
  ["ServiceNow","NOW",    190_000,  10_000,  23_000, "Santa Clara",   "US", ["Enterprise Software","Cloud","IT Management"]],
  ["Workday",   "WDAY",    65_000,   8_000,  19_000, "Pleasanton",    "US", ["HR Software","Finance Software","SaaS"]],
  ["Atlassian", "TEAM",    50_000,   4_000,  12_000, "Sydney",        "AU", ["Developer Tools","Project Management","SaaS"]],
  ["Spotify",   "SPOT",    80_000,  15_000,   9_000, "Stockholm",     "SE", ["Music Streaming","Podcasting"]],
  ["SAP",       "SAP",    250_000,  34_000, 107_000, "Walldorf",      "DE", ["Enterprise Software","ERP","Cloud"]],
  ["IBM",       "IBM",    190_000,  61_000, 288_000, "Armonk",        "US", ["Cloud","AI","Consulting","IT Services"]],
  ["Accenture", "ACN",    200_000,  65_000, 733_000, "Dublin",        "IE", ["IT Consulting","Strategy","Technology"]],
  ["Zoom",      "ZM",      20_000,   4_400,   8_000, "San Jose",      "US", ["Video Communications","SaaS"]],
  ["Twilio",    "TWLO",    10_000,   4_100,   6_000, "San Francisco", "US", ["Communications","API","SaaS"]],
  ["GitLab",    "GTLB",     8_000,     700,   2_100, "San Francisco", "US", ["DevOps","Developer Tools","Cloud"]],
  ["Dropbox",   "DBX",     10_000,   2_500,   3_000, "San Francisco", "US", ["Cloud Storage","SaaS","Productivity"]],
  ["Block",     "SQ",      40_000,  22_000,  12_000, "Oakland",       "US", ["Payments","Fintech","Crypto"]],
  // Indian IT
  ["TCS",       "TCS",    175_000,  29_000, 606_000, "Mumbai",        "IN", ["IT Services","Consulting","Outsourcing"]],
  ["Infosys",   "INFY",    75_000,  18_000, 317_000, "Bengaluru",     "IN", ["IT Services","Consulting","Outsourcing"]],
  ["Wipro",     "WIT",     28_000,  11_000, 230_000, "Bengaluru",     "IN", ["IT Services","Consulting"]],
  ["HCLTech",   "HCL",     50_000,  14_000, 225_000, "Noida",         "IN", ["IT Services","Cloud","Engineering"]],
  ["Cognizant", "CTSH",    37_000,  19_000, 346_000, "Teaneck",       "US", ["IT Services","Consulting","BPO"]],
  // Private/unicorn tech
  ["OpenAI",    null,     157_000,   2_000,   1_700, "San Francisco", "US", ["AI","LLM","Research"]],
  ["Anthropic", null,      61_000,   1_000,     900, "San Francisco", "US", ["AI","LLM","Safety Research"]],
  ["Stripe",    null,      70_000,  15_000,   8_000, "San Francisco", "US", ["Payments","Fintech","API"]],
  ["Databricks",null,      62_000,   2_400,   6_000, "San Francisco", "US", ["Data & AI","Lakehouse","Cloud"]],
  ["Canva",     null,      26_000,   2_300,   4_500, "Sydney",        "AU", ["Design","SaaS","Creative"]],
  ["Figma",     null,      20_000,     600,   1_400, "San Francisco", "US", ["Design","Collaboration","SaaS"]],
  ["Notion",    null,      10_000,     300,     500, "San Francisco", "US", ["Productivity","Collaboration","SaaS"]],
  ["Perplexity",null,       9_000,     100,     100, "San Francisco", "US", ["AI","Search","LLM"]],
  ["Mistral AI",null,       6_000,      50,     200, "Paris",         "FR", ["AI","LLM","Open Source"]],
  ["Cohere",    null,       5_500,     100,     500, "Toronto",       "CA", ["AI","LLM","Enterprise"]],
  ["Rippling",  null,      13_500,     400,   3_000, "San Francisco", "US", ["HR Tech","Payroll","IT Management"]],
  ["Deel",      null,      12_000,     500,   4_000, "San Francisco", "US", ["HR Tech","Payroll","Global Employment"]],
  ["Brex",      null,      12_000,     500,   1_500, "San Francisco", "US", ["Fintech","Corporate Cards","Banking"]],
  ["Plaid",     null,       6_000,     400,   1_400, "San Francisco", "US", ["Fintech","Banking API","Data"]],
  ["GitHub",    null,        null,    1_000,  3_000, "San Francisco", "US", ["Developer Tools","Code Hosting"]],
  ["Ramp",      null,       7_700,     300,   1_000, "New York",      "US", ["Fintech","Corporate Cards","Spend Management"]],
  ["Linear",    null,         400,      20,      60, "San Francisco", "US", ["Developer Tools","Project Management","SaaS"]],
  ["Vercel",    null,       3_200,     100,     500, "San Francisco", "US", ["Cloud","Developer Tools","Frontend"]],
  ["Supabase",  null,         200,      20,     150, "San Francisco", "US", ["Database","BaaS","Open Source"]],
];

async function main() {
  console.log("🏢 Seeding tech giants & major companies...\n");
  const { error: check } = await db.from("companies").select("id").limit(1);
  if (check?.code === "42P01") { console.error("❌ Run setup.sql first."); process.exit(1); }

  const rows = COMPANIES.map(([name, ticker, capM, revM, emp, hq, country, sector]) => ({
    slug:           toSlug(name),
    name,
    source:         "tech_list",
    category:       ticker ? "public" : "mnc",
    sector,
    is_public:      !!ticker,
    stock_ticker:   ticker || null,
    market_cap_usd: capM ? capM * 1_000_000 : null,
    revenue_usd:    revM ? revM * 1_000_000 : null,
    employee_count: emp || null,
    valuation_usd:  !ticker && capM ? capM * 1_000_000 : null,
    country:        country || "US",
    hq_city:        hq || null,
    updated_at:     new Date().toISOString(),
  }));

  const { error } = await db.from("companies").upsert(rows, { onConflict: "slug" });
  if (error) console.error("❌", error.message);
  else console.log(`✅ Seeded ${rows.length} companies`);
}

main().catch(console.error);
