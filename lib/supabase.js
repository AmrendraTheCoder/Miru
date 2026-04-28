import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side client (service role — used in API routes)
export function getSupabaseServer() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Client-side client (anon key — used in browser)
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * SQL to create the queries table (run this once in Supabase SQL editor):
 *
 * CREATE TABLE IF NOT EXISTS search_queries (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   query text NOT NULL,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * -- Enable RLS
 * ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
 *
 * -- Allow anon to insert and read
 * CREATE POLICY "allow_anon_insert" ON search_queries FOR INSERT TO anon WITH CHECK (true);
 * CREATE POLICY "allow_anon_select" ON search_queries FOR SELECT TO anon USING (true);
 * CREATE POLICY "allow_anon_delete" ON search_queries FOR DELETE TO anon USING (true);
 */
