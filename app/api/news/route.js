import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const NEWS_TTL_HOURS = 24;

export async function GET() {
  const db = getSupabaseServer();
  
  if (db) {
    try {
      const cutoff = new Date(Date.now() - NEWS_TTL_HOURS * 60 * 60 * 1000).toISOString();
      const { data } = await db
        .from("daily_news")
        .select("*")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (data?.length) {
        return NextResponse.json({ news: data[0].items, cached: true, cachedAt: data[0].created_at });
      }
    } catch {}
  }

  // Signal client to fetch fresh via Exa directly
  return NextResponse.json({ news: null, cached: false });
}

export async function POST(request) {
  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ ok: false });

  try {
    const { items } = await request.json();
    if (!items?.length) return NextResponse.json({ ok: false });

    // Purge old news
    const cutoff = new Date(Date.now() - NEWS_TTL_HOURS * 60 * 60 * 1000).toISOString();
    await db.from("daily_news").delete().lt("created_at", cutoff).catch(() => {});

    await db.from("daily_news").insert({ items, created_at: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
