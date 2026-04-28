import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

// Reports stay "fresh" for 7 days — re-research after that
const FRESH_DAYS = 7;

// GET /api/reports?name=Stripe
export async function GET(request) {
  const name = new URL(request.url).searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ report: null });

  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ report: null });

  try {
    const cutoff = new Date(Date.now() - FRESH_DAYS * 86_400_000).toISOString();
    const { data } = await db
      .from("startup_reports")
      .select("report, created_at")
      .ilike("startup_name", name)   // case-insensitive match
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data?.length) {
      const row = data[0];
      const ageHours = Math.floor((Date.now() - new Date(row.created_at)) / 3_600_000);
      return NextResponse.json({ report: row.report, cached: true, ageHours });
    }
    return NextResponse.json({ report: null, cached: false });
  } catch (e) {
    return NextResponse.json({ report: null, error: e.message });
  }
}

// POST /api/reports  { name, domain, report }
export async function POST(request) {
  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ ok: false });

  try {
    const { name, domain, report } = await request.json();
    if (!name || !report) return NextResponse.json({ ok: false });

    await db.from("startup_reports").insert({
      startup_name: name,
      domain: domain || null,
      report,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
