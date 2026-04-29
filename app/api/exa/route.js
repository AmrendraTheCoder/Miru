/**
 * Exa API Server Proxy
 * ════════════════════════════════════════════════════════
 * WHY: Exa's API does not send Access-Control-Allow-Origin headers,
 * so direct browser → api.exa.ai calls are blocked by CORS in
 * production (Vercel, any real domain). All Exa traffic must go
 * through this server-side proxy instead.
 *
 * The client sends:
 *   POST /api/exa
 *   { path: "/search", body: {...}, apiKey?: "exa-xxx" }
 *
 * This route calls Exa server-to-server (no CORS), returns the
 * raw Exa JSON response back to the client.
 *
 * API key priority:  provided apiKey  →  EXA_API_KEY env var
 * ════════════════════════════════════════════════════════
 */

import { NextResponse } from "next/server";

const EXA_BASE = "https://api.exa.ai";

export async function POST(request) {
  let path, body, apiKey;
  try {
    ({ path, body, apiKey } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Resolve key: client-provided first, then server env
  const key = apiKey || process.env.EXA_API_KEY || "";
  if (!key) {
    return NextResponse.json(
      { error: "No Exa API key. Add EXA_API_KEY to .env or provide one in Settings." },
      { status: 401 }
    );
  }

  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const attempt = () =>
    fetch(`${EXA_BASE}${path}`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

  try {
    let res = await attempt();

    // One retry on rate limit
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await attempt();
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || `Exa ${path} failed (HTTP ${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
