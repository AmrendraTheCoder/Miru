import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const MAX_QUERIES = 3;
const TTL_MINUTES = 5;

export async function GET() {
  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ queries: [] });

  try {
    // Auto-purge queries older than TTL_MINUTES in the background
    const cutoff = new Date(Date.now() - TTL_MINUTES * 60 * 1000).toISOString();
    await db.from("search_queries").delete().lt("created_at", cutoff);

    // Fetch remaining last 3
    const { data, error } = await db
      .from("search_queries")
      .select("id, query, created_at")
      .order("created_at", { ascending: false })
      .limit(MAX_QUERIES);

    if (error) throw error;
    return NextResponse.json({ queries: data || [] });
  } catch (err) {
    // Silent failure — user never sees this
    return NextResponse.json({ queries: [] });
  }
}

export async function POST(request) {
  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ ok: true });

  try {
    const { query } = await request.json();
    if (!query?.trim()) return NextResponse.json({ ok: false });

    // Insert new query
    const { error: insertErr } = await db
      .from("search_queries")
      .insert({ query: query.trim() });

    if (insertErr) throw insertErr;

    // Keep only MAX_QUERIES — delete oldest if over limit
    const { data: all } = await db
      .from("search_queries")
      .select("id, created_at")
      .order("created_at", { ascending: false });

    if (all && all.length > MAX_QUERIES) {
      const toDelete = all.slice(MAX_QUERIES).map((r) => r.id);
      await db.from("search_queries").delete().in("id", toDelete);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false });
  }
}
