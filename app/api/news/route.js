import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const maxDuration = 55;

/**
 * News Cache Strategy:
 * - FRESH window : 24h  — serve from cache instantly, no Exa call
 * - STALE window : 15 days — return cached data + flag stale
 *   (client shows stale badge, triggers bg refresh)
 * - EXPIRED      : >15 days — fetch fresh via server-side Exa key
 *
 * ✅ No user-supplied API keys required.
 *    All Exa calls use EXA_API_KEY from server environment.
 */
const FRESH_TTL_HOURS = 24;
const STALE_TTL_DAYS = 15;
const EXA_BASE = "https://api.exa.ai";

async function fetchNewsFromExa() {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.warn("[News API] EXA_API_KEY not set — skipping Exa fetch");
    return null;
  }

  const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const DOMAINS = [
    "techcrunch.com", "reuters.com", "bloomberg.com", "axios.com",
    "businessinsider.com", "theverge.com", "forbes.com", "venturebeat.com",
    "sifted.eu", "wsj.com", "cnbc.com", "ft.com", "thenextweb.com",
  ];

  const CONTENTS = {
    text: { maxCharacters: 800 },           // more text → better bullet points
    highlights: {
      numSentences: 3,
      highlightsPerUrl: 2,
      query: "startup raised funding amount investors round",
    },
  };

  // Run two parallel queries for diversity
  const [r1, r2] = await Promise.allSettled([
    fetch(`${EXA_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        query: "startup raises funding seed Series A Series B launch new product 2026",
        type: "neural",
        numResults: 20,
        includeDomains: DOMAINS,
        startPublishedDate: monthStart,
        contents: CONTENTS,
        livecrawl: "fallback",
      }),
    }).then(r => r.ok ? r.json() : Promise.reject()),
    fetch(`${EXA_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        query: "AI startup acquisition IPO unicorn funding announcement 2026",
        type: "neural",
        numResults: 15,
        includeDomains: DOMAINS,
        startPublishedDate: monthStart,
        contents: CONTENTS,
        livecrawl: "fallback",
      }),
    }).then(r => r.ok ? r.json() : Promise.reject()),
  ]);

  // Merge, deduplicate by URL
  const seen = new Set();
  const merged = [];
  for (const res of [r1, r2]) {
    if (res.status === "fulfilled") {
      for (const r of (res.value?.results || [])) {
        if (r.url && !seen.has(r.url)) {
          seen.add(r.url);
          merged.push(r);
        }
      }
    }
  }

  if (!merged.length) return null;



  // Normalise into the shape the client expects
  return merged.map(r => ({
    id:        r.id || r.url,
    headline:  r.title,
    title:     r.title,
    url:       r.url,
    source:    (() => { try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return "unknown"; } })(),
    // Prefer highlights, then text — gives us sentences for bullet points
    summary:   (r.highlights || []).join(" ") || r.text?.slice(0, 600) || "",
    text:      r.text || "",
    image:     r.image || null,
    stage:     null,
    amount:    null,
    date:      r.publishedDate || new Date().toISOString(),
    publishedDate: r.publishedDate,
    researchQuery: r.title?.split(" ").slice(0, 3).join(" "),
  }))
  .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function GET() {
  const db = getSupabaseServer();

  // ── 1. Try Supabase cache ─────────────────────────────────
  if (db) {
    try {
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
        const isFresh = ageMs < FRESH_TTL_HOURS * 60 * 60 * 1000;

        if (isFresh) {
          // Cache is fresh — return immediately, no Exa call
          return NextResponse.json({
            news: row.items,
            cached: true,
            fresh: true,
            cachedAt: row.created_at,
            ageHours: Math.floor(ageMs / 3_600_000),
          });
        }

        // Stale but not expired — return cached data AND trigger a bg Exa refresh
        // The bg refresh is fire-and-forget; client gets data immediately
        fetchNewsFromExa().then(async items => {
          if (items?.length && db) {
            await db.from("daily_news").insert({ items, created_at: new Date().toISOString() }).catch(() => {});
            const hardCutoff = new Date(Date.now() - STALE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
            await db.from("daily_news").delete().lt("created_at", hardCutoff).catch(() => {});
          }
        }).catch(() => {});

        return NextResponse.json({
          news: row.items,
          cached: true,
          fresh: false,
          cachedAt: row.created_at,
          ageHours: Math.floor(ageMs / 3_600_000),
        });
      }
    } catch (e) {
      console.warn("[News API] Supabase read error:", e.message);
    }
  }

  // ── 2. No cache — fetch live from Exa server-side ─────────
  try {
    const items = await fetchNewsFromExa();
    if (items?.length) {
      // Save to Supabase for next time
      if (db) {
        db.from("daily_news")
          .insert({ items, created_at: new Date().toISOString() })
          .catch(() => {});
      }
      return NextResponse.json({ news: items, cached: false, fresh: true });
    }
  } catch (e) {
    console.warn("[News API] Exa fetch error:", e.message);
  }

  // ── 3. Total fallback — empty response ────────────────────
  return NextResponse.json({ news: [], cached: false, fresh: false });
}

export async function POST(request) {
  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ ok: false });

  try {
    const { items } = await request.json();
    if (!items?.length) return NextResponse.json({ ok: false });

    await db.from("daily_news").insert({ items, created_at: new Date().toISOString() });

    const hardCutoff = new Date(Date.now() - STALE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await db.from("daily_news").delete().lt("created_at", hardCutoff).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
