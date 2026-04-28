import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * News Cache Strategy:
 * - FRESH window : 24h  — serve from cache instantly
 * - STALE window : 15 days — return last known data + flag as stale
 *   (client shows stale badge but user still gets content, not a blank page)
 * - EXPIRED      : > 15 days — return null so client fetches fresh via Exa
 *
 * On POST (client saves new data): keep ALL rows within 15 days,
 * hard-delete only rows older than 15 days. Last good data always survives.
 */
const FRESH_TTL_HOURS = 24;
const STALE_TTL_DAYS = 15;

export async function GET() {
  const db = getSupabaseServer();

  if (db) {
    try {
      // Fetch the most recent news row regardless of age (up to 15 days)
      const staleWindow = new Date(Date.now() - STALE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { data } = await db
        .from("daily_news")
        .select("*")
        .gte("created_at", staleWindow)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data?.length) {
        const row = data[0];
        const ageMs = Date.now() - new Date(row.created_at).getTime();
        const freshCutoffMs = FRESH_TTL_HOURS * 60 * 60 * 1000;
        const isFresh = ageMs < freshCutoffMs;

        return NextResponse.json({
          news: row.items,
          cached: true,
          fresh: isFresh,           // fresh=true → use as-is; false → client may refresh in bg
          cachedAt: row.created_at,
          ageHours: Math.floor(ageMs / 3_600_000),
        });
      }
    } catch {}
  }

  // No usable cache — client must fetch via Exa
  return NextResponse.json({ news: null, cached: false, fresh: false });
}

export async function POST(request) {
  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ ok: false });

  try {
    const { items } = await request.json();
    if (!items?.length) return NextResponse.json({ ok: false });

    // Insert new snapshot first (never delete last row before insert)
    await db.from("daily_news").insert({ items, created_at: new Date().toISOString() });

    // Now purge rows older than 15 days (keep history within window)
    const hardCutoff = new Date(Date.now() - STALE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await db.from("daily_news").delete().lt("created_at", hardCutoff).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
