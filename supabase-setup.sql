-- Startup Intelligence Platform — Supabase Schema

-- Drop old tables
drop table if exists search_queries cascade;

-- Startup research reports
create table if not exists startup_reports (
  id uuid default gen_random_uuid() primary key,
  startup_name text not null,
  domain text,
  report jsonb not null,
  created_at timestamptz default now()
);
create index if not exists idx_startup_reports_name on startup_reports(startup_name);
create index if not exists idx_startup_reports_created on startup_reports(created_at desc);

-- Daily news cache (24h TTL)
create table if not exists daily_news (
  id uuid default gen_random_uuid() primary key,
  items jsonb not null,
  created_at timestamptz default now()
);
create index if not exists idx_daily_news_created on daily_news(created_at desc);

-- Saved/bookmarked startups
create table if not exists saved_startups (
  id uuid default gen_random_uuid() primary key,
  startup_name text not null,
  domain text,
  notes text,
  created_at timestamptz default now()
);

-- RLS: allow anon reads/writes (adjust for production auth)
alter table startup_reports enable row level security;
alter table daily_news enable row level security;
alter table saved_startups enable row level security;

create policy "public_read_reports" on startup_reports for select using (true);
create policy "public_insert_reports" on startup_reports for insert with check (true);
create policy "public_read_news" on daily_news for select using (true);
create policy "public_insert_news" on daily_news for insert with check (true);
create policy "public_all_saved" on saved_startups for all using (true);
