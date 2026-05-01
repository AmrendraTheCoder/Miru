import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/jobs?type=all&source=all&q=&page=1
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type   = searchParams.get("type")   || "all";
  const source = searchParams.get("source") || "all";
  const q      = searchParams.get("q")      || "";
  const page   = parseInt(searchParams.get("page") || "1");
  const limit  = 20;

  let query = supabase
    .from("job_listings")
    .select("*")
    .neq("status", "expired")
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (type !== "all") query = query.eq("type", type);
  if (source !== "all") query = query.eq("source", source);
  if (q.trim()) {
    query = query.or(
      `title.ilike.%${q}%,company.ilike.%${q}%,skills.cs.{${q}}`
    );
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ jobs: data || [], page, hasMore: (data || []).length === limit });
}
