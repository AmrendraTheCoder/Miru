import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasExaKey: !!process.env.EXA_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasSupabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    exaKey: process.env.EXA_API_KEY || null,
    geminiKey: process.env.GEMINI_API_KEY || null,
  });
}
