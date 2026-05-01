import { NextResponse } from "next/server";

export async function GET() {
  // SECURITY: Never expose raw key values to the client.
  // Only return boolean presence flags. Keys are consumed server-side only.
  return NextResponse.json({
    hasExaKey:    !!process.env.EXA_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasSupabase:  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
