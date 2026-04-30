import { NextResponse } from "next/server";

export const maxDuration = 55;

// This route is kept for backwards compat but the main research
// now runs client-side via lib/exa.js + lib/analyzer.js directly.
export async function POST() {
  return NextResponse.json(
    { error: "Use the client-side research flow — see lib/exa.js and lib/analyzer.js" },
    { status: 410 }
  );
}
