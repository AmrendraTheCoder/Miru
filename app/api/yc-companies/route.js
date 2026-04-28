import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sector  = searchParams.get("sector") || "";
  const batch   = searchParams.get("batch")  || "";
  const status  = searchParams.get("status") || "";
  const q       = searchParams.get("q")      || "";
  const page    = parseInt(searchParams.get("page") || "1");
  const limit   = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const from    = (page - 1) * limit;

  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ companies: [], total: 0, error: "No DB" });

  try {
    let query = db
      .from("yc_companies")
      .select("*", { count: "exact" })
      .order("batch_year", { ascending: false })
      .order("name",       { ascending: true })
      .range(from, from + limit - 1);

    if (q)      query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%`);
    if (status) query = query.eq("status", status);
    if (batch)  query = query.eq("batch", batch);
    if (sector) query = query.contains("sectors", [sector]);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ companies: data || [], total: count || 0, page, limit });
  } catch (e) {
    return NextResponse.json({ companies: [], total: 0, error: e.message }, { status: 500 });
  }
}
