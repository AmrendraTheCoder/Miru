-- Run this ONCE in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bgnhrbzwvukdszjliira/sql

CREATE TABLE IF NOT EXISTS companies (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug           text UNIQUE NOT NULL,
  name           text NOT NULL,
  tagline        text,
  description    text,
  website        text,
  logo_url       text,

  -- Classification
  source         text NOT NULL,          -- 'yc' | 'fortune500' | 'forbes2000' | 'unicorn' | 'tech_list'
  category       text,                   -- 'startup' | 'public' | 'unicorn' | 'mnc'
  sector         text[],
  is_public      boolean DEFAULT false,
  stock_ticker   text,

  -- Size & rankings
  ranking        integer,
  revenue_usd    bigint,
  market_cap_usd bigint,
  employee_count integer,
  valuation_usd  bigint,
  total_funding  text,

  -- Geography
  country        text DEFAULT 'US',
  hq_city        text,

  -- YC-specific
  yc_batch       text,
  yc_batch_year  integer,

  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug   ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_name   ON companies(lower(name));
CREATE INDEX IF NOT EXISTS idx_companies_source ON companies(source);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies USING GIN(sector);

-- Full-text search column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(tagline, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_companies_fts ON companies USING GIN(fts);

-- Allow public read (same policy as yc_companies)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_public_read" ON companies FOR SELECT TO anon USING (true);
CREATE POLICY "allow_service_write" ON companies FOR ALL TO service_role USING (true);
