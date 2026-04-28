-- ══════════════════════════════════════════════════════════
-- MIRU — YC Companies Table
-- Stores 1000+ YC-funded companies, sorted & structured
-- ══════════════════════════════════════════════════════════

create table if not exists yc_companies (
  id            uuid default gen_random_uuid() primary key,
  slug          text unique not null,          -- YC slug, e.g. "stripe"
  name          text not null,
  tagline       text,
  description   text,
  website       text,
  batch         text,                          -- "W24", "S23", etc.
  batch_year    int,                           -- 2024
  batch_season  text,                          -- "Winter" | "Summer" | "Spring" | "Fall"
  status        text,                          -- "Active" | "Inactive" | "Acquired" | "Public"
  stage         text,                          -- funding stage
  team_size     int,
  location      text,
  country       text,
  sectors       text[],                        -- ["AI", "B2B", "SaaS"]
  founders      jsonb,                         -- [{name, title, linkedin}]
  logo_url      text,
  yc_url        text,
  launched_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes for fast sorting + filtering
create index if not exists idx_yc_batch       on yc_companies(batch);
create index if not exists idx_yc_batch_year  on yc_companies(batch_year desc);
create index if not exists idx_yc_status      on yc_companies(status);
create index if not exists idx_yc_name        on yc_companies(name);
create index if not exists idx_yc_sectors     on yc_companies using gin(sectors);

-- RLS
alter table yc_companies enable row level security;
create policy "public_read_yc" on yc_companies for select using (true);
create policy "service_write_yc" on yc_companies for all using (true);

-- Keep other tables from previous migration
-- startup_reports, daily_news, saved_startups already exist
