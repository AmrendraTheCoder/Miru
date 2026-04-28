/**
 * MIRU — Run SQL migrations via Supabase REST
 * Usage: node scripts/migrate.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

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
const URL  = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

const SQL = `
create table if not exists yc_companies (
  id            uuid default gen_random_uuid() primary key,
  slug          text unique not null,
  name          text not null,
  tagline       text,
  description   text,
  website       text,
  batch         text,
  batch_year    int,
  batch_season  text,
  status        text default 'Active',
  stage         text,
  team_size     int,
  location      text,
  country       text,
  sectors       text[],
  founders      jsonb default '[]',
  logo_url      text,
  yc_url        text,
  launched_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_yc_batch      on yc_companies(batch);
create index if not exists idx_yc_batch_year on yc_companies(batch_year desc);
create index if not exists idx_yc_status     on yc_companies(status);
create index if not exists idx_yc_name       on yc_companies(name);
`;

const res = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${KEY}`,
    "apikey": KEY,
  },
  body: JSON.stringify({ sql: SQL }),
});

// Supabase doesn't expose raw SQL via REST — use pg endpoint instead
// Fall back to psql if available
const { execSync } = await import("child_process");
console.log("Creating yc_companies table via Supabase...");
try {
  // Try using psql if DATABASE_URL is set
  const dbUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;
  if (dbUrl) {
    execSync(`psql "${dbUrl}" -f "${resolve(__dir, "../supabase-yc-companies.sql")}"`, { stdio: "inherit" });
    console.log("✅ Migration applied via psql");
  } else {
    console.log("⚠️  Cannot run migration automatically — no DATABASE_URL in .env");
    console.log("\n📋 Copy and run this SQL in your Supabase SQL editor:");
    console.log("   https://supabase.com/dashboard/project/asmqgjvpnzqxkdfgnout/sql/new\n");
    console.log(SQL);
  }
} catch (e) {
  console.error("❌", e.message);
}
