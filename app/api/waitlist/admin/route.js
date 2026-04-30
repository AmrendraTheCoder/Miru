import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { password } = await req.json();

    // Simple hardcoded password for the MVP admin dashboard.
    // In production, use env variable: process.env.ADMIN_PASSWORD
    if (password !== "miru-admin-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Waitlist Admin] DB Error:", error);
      return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
    }

    return NextResponse.json({ entries: data || [] });
  } catch (err) {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
