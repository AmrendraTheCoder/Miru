-- Run this in your Supabase SQL editor
-- Creates the job_listings table for Miru Module 1

CREATE TABLE IF NOT EXISTS job_listings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  company          text,
  location         text DEFAULT 'Remote',
  type             text DEFAULT 'job' CHECK (type IN ('job', 'internship', 'freelance')),
  source           text,                    -- 'remotive' | 'remoteok' | 'wellfound' | 'internshala'
  source_url       text UNIQUE NOT NULL,   -- original listing URL (dedup key)
  salary           text,
  skills           text[] DEFAULT '{}',
  full_description text,                   -- stored where allowed (Remotive)
  logo_url         text,
  closes_at        timestamptz,
  status           text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'unverified')),
  last_verified_at timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

-- Indexes for fast filtered queries
CREATE INDEX IF NOT EXISTS idx_jobs_type   ON job_listings(type);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON job_listings(source);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON job_listings(created_at DESC);

-- Enable Row Level Security (public read)
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON job_listings
  FOR SELECT USING (true);

-- Full-text search index (optional, for advanced search later)
CREATE INDEX IF NOT EXISTS idx_jobs_fts ON job_listings
  USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company,'') || ' ' || coalesce(location,'')));
