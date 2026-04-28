-- ══════════════════════════════════════════════════════════════════════
-- MIRU — MASTER MIGRATION
-- Run this ONE file in your Supabase SQL editor.
-- URL: https://supabase.com/dashboard/project/asmqgjvpnzqxkdfgnout/sql/new
--
-- ✅ Fully idempotent — safe to re-run any number of times
-- ✅ All tables, indexes, RLS, and policies in correct dependency order
-- ✅ DROP POLICY guards prevent "already exists" errors on re-run
--
-- ORDER OF EXECUTION (all handled automatically below):
--   1. Cleanup old / conflicting objects
--   2. Create tables
--   3. Create indexes
--   4. Enable Row Level Security
--   5. Create RLS policies
-- ══════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────
-- STEP 1 — CLEANUP
-- Remove leftover tables from old versions of this project.
-- ────────────────────────────────────────────────────────────────────

drop table if exists search_queries cascade;


-- ────────────────────────────────────────────────────────────────────
-- STEP 2 — TABLES
-- ────────────────────────────────────────────────────────────────────

-- 2a. Daily news cache
--     Stores parsed startup news items from Exa.
--     Fresh window : 24h (served instantly)
--     Stale window : 15 days (served as fallback, flagged as stale)
--     Hard expiry  : rows older than 15 days are deleted on next write
create table if not exists daily_news (
  id         uuid        default gen_random_uuid() primary key,
  items      jsonb       not null,                  -- array of parsed news objects
  created_at timestamptz default now() not null
);

-- 2b. Startup research reports
--     One row per research run. Keyed by startup_name + domain.
--     Used to avoid re-running expensive AI analysis for the same company.
create table if not exists startup_reports (
  id           uuid        default gen_random_uuid() primary key,
  startup_name text        not null,
  domain       text,
  report       jsonb       not null,                -- full structured report object
  created_at   timestamptz default now() not null
);

-- 2c. Saved / bookmarked startups
--     User's personal research list. No TTL — kept indefinitely.
create table if not exists saved_startups (
  id           uuid        default gen_random_uuid() primary key,
  startup_name text        not null,
  domain       text,
  notes        text,
  tags         text[]      default '{}',            -- user labels
  created_at   timestamptz default now() not null
);

-- 2d. YC Companies directory
--     1000+ companies from api.ycombinator.com, seeded by npm run seed:yc.
--     Upserted on slug (unique YC identifier) — safe to re-seed.
create table if not exists yc_companies (
  id           uuid        default gen_random_uuid() primary key,
  slug         text        unique not null,         -- e.g. "stripe", "airbnb"
  name         text        not null,
  tagline      text,                                -- one-liner
  description  text,                               -- long description
  website      text,
  batch        text,                               -- "W24", "S23", "P26"
  batch_year   int,                                -- 2024
  batch_season text,                              -- "Winter" | "Summer" | "Spring" | "Fall"
  status       text        default 'Active',       -- "Active" | "Inactive" | "Acquired" | "Public"
  stage        text,                               -- funding stage if known
  team_size    int,
  location     text,                              -- city
  country      text,
  sectors      text[]      default '{}',           -- ["AI", "B2B", "SaaS", "FinTech"]
  founders     jsonb       default '[]',           -- [{name, title, linkedin}]
  logo_url     text,
  yc_url       text,
  launched_at  timestamptz,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);


-- ────────────────────────────────────────────────────────────────────
-- STEP 3 — INDEXES
-- Optimised for the query patterns used by Miru:
--   • News   : latest row first (ORDER BY created_at DESC LIMIT 1)
--   • Reports: lookup by name, latest first
--   • YC     : filter by batch, year, status, sector; sort by year DESC
-- ────────────────────────────────────────────────────────────────────

-- daily_news
create index if not exists idx_daily_news_created
  on daily_news(created_at desc);

-- startup_reports
create index if not exists idx_reports_name
  on startup_reports(startup_name);
create index if not exists idx_reports_created
  on startup_reports(created_at desc);

-- saved_startups
create index if not exists idx_saved_name
  on saved_startups(startup_name);
create index if not exists idx_saved_tags
  on saved_startups using gin(tags);

-- yc_companies  (most important — used heavily for Discover + Research)
create index if not exists idx_yc_batch
  on yc_companies(batch);
create index if not exists idx_yc_batch_year
  on yc_companies(batch_year desc);                -- newest first
create index if not exists idx_yc_status
  on yc_companies(status);
create index if not exists idx_yc_name
  on yc_companies(name);
create index if not exists idx_yc_sectors
  on yc_companies using gin(sectors);             -- fast array contains query


-- ────────────────────────────────────────────────────────────────────
-- STEP 4 — ROW LEVEL SECURITY
-- Enable on all tables. Policies below grant appropriate access.
-- ────────────────────────────────────────────────────────────────────

alter table daily_news     enable row level security;
alter table startup_reports enable row level security;
alter table saved_startups  enable row level security;
alter table yc_companies    enable row level security;


-- ────────────────────────────────────────────────────────────────────
-- STEP 5 — RLS POLICIES
-- DROP IF EXISTS before each CREATE to allow idempotent re-runs.
-- ────────────────────────────────────────────────────────────────────

-- daily_news
drop policy if exists "news_public_read"   on daily_news;
drop policy if exists "news_public_insert" on daily_news;
drop policy if exists "news_public_delete" on daily_news;
create policy "news_public_read"   on daily_news for select using (true);
create policy "news_public_insert" on daily_news for insert with check (true);
create policy "news_public_delete" on daily_news for delete using (true);

-- startup_reports
drop policy if exists "reports_public_read"   on startup_reports;
drop policy if exists "reports_public_insert" on startup_reports;
create policy "reports_public_read"   on startup_reports for select using (true);
create policy "reports_public_insert" on startup_reports for insert with check (true);

-- saved_startups
drop policy if exists "saved_public_all" on saved_startups;
create policy "saved_public_all" on saved_startups for all using (true) with check (true);

-- yc_companies
drop policy if exists "yc_public_read"  on yc_companies;
drop policy if exists "yc_service_write" on yc_companies;
create policy "yc_public_read"   on yc_companies for select using (true);
create policy "yc_service_write" on yc_companies for all   using (true) with check (true);


-- ════════════════════════════════════════════════════════════════════
-- ✅ Done. You can now run:  npm run seed:yc
-- ════════════════════════════════════════════════════════════════════
