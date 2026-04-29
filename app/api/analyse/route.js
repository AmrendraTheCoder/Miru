/**
 * POST /api/analyse
 * Body: { query: "Coinbase" }
 *
 * Runs the full research pipeline server-side using EXA_API_KEY + GEMINI_API_KEY
 * env vars, saves the report to Supabase, and returns it.
 * Called automatically by /startup/[slug] when no cached report exists.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const EXA_BASE = "https://api.exa.ai";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

// ── Exa search ────────────────────────────────────────────────────
async function exaSearch(query, opts = {}) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY not set");

  const res = await fetch(`${EXA_BASE}/search`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      type: "neural",
      numResults: opts.numResults || 8,
      contents: { text: { maxCharacters: 3000 }, highlights: { numSentences: 3, highlightsPerUrl: 2 } },
      ...opts,
    }),
  });

  if (!res.ok) throw new Error(`Exa search failed: ${res.status}`);
  return res.json();
}

// ── Gemini analysis ───────────────────────────────────────────────
async function geminiAnalyse(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
          },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      try { return JSON.parse(cleaned); }
      catch {
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) return JSON.parse(m[0]);
      }
    } catch { continue; }
  }
  throw new Error("All Gemini models exhausted");
}

// ── Main handler ──────────────────────────────────────────────────
export async function POST(request) {
  const { query } = await request.json().catch(() => ({}));
  if (!query?.trim()) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  const name = query.trim();

  // Check if already cached in Supabase
  const db = getSupabaseServer();
  if (db) {
    const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data: existing } = await db
      .from("startup_reports")
      .select("report, created_at")
      .ilike("startup_name", name)
      .gte("created_at", cutoff)
      .limit(1);

    if (existing?.[0]?.report) {
      return NextResponse.json({ report: existing[0].report, cached: true });
    }
  }

  try {
    // 1. Fetch raw intelligence via Exa
    const [fundingData, pressData] = await Promise.all([
      exaSearch(`${name} startup funding investors pitch deck`, {
        numResults: 6,
        includeDomains: ["crunchbase.com", "techcrunch.com", "bloomberg.com", "forbes.com", "pitchbook.com"],
      }).catch(() => ({ results: [] })),
      exaSearch(`${name} company overview founders team`, {
        numResults: 6,
        includeDomains: ["linkedin.com", "crunchbase.com", "ycombinator.com", "techcrunch.com"],
      }).catch(() => ({ results: [] })),
    ]);

    const allResults = [
      ...(fundingData.results || []),
      ...(pressData.results || []),
    ].slice(0, 12);

    const context = allResults
      .map((r, i) => `[Source ${i + 1}] ${r.url}\nTitle: ${r.title || ""}\n${r.text?.slice(0, 1500) || ""}`)
      .join("\n\n---\n\n");

    // 2. Analyse with Gemini
    const prompt = `You are a senior startup analyst. Based on the sources below, generate a comprehensive intelligence report for "${name}".

SOURCES:
${context}

Return ONLY valid JSON matching this exact schema:
{
  "name": "exact company name",
  "tagline": "1 sentence tagline",
  "overview": "3-4 sentence overview",
  "stage": "Seed|Series A|Series B|Series C|Late Stage|Public|Acquired",
  "founded": "year as string",
  "headquarters": "City, State/Country",
  "totalFunding": "e.g. $40M",
  "sector": "primary sector",
  "problem": { "statement": "...", "urgency": "...", "marketSize": "..." },
  "solution": "what they built",
  "whyFunded": "why investors funded this",
  "competitiveAdvantage": "moat / key differentiator",
  "founders": [{ "name": "...", "role": "...", "background": "...", "linkedinUrl": null }],
  "fundingTimeline": [{ "date": "...", "event": "...", "amount": "...", "investors": "..." }],
  "insights": ["key insight 1", "key insight 2", "key insight 3"],
  "risks": ["risk 1", "risk 2"],
  "competitorNames": ["competitor1", "competitor2", "competitor3"],
  "analystVerdict": {
    "summary": "2-3 sentence verdict",
    "watchScore": 7,
    "moatStrength": "Strong|Moderate|Weak",
    "marketPosition": "Leader|Challenger|Niche|Emerging",
    "fundingLikelihood": "High|Medium|Low"
  },
  "pressArticles": [{ "title": "...", "url": "...", "source": "...", "date": "..." }]
}`;

    const report = await geminiAnalyse(prompt);
    report._source = "report";
    report._updatedAt = new Date().toISOString();

    // 3. Save to Supabase for future visits
    if (db) {
      await db.from("startup_reports").insert({
        startup_name: report.name || name,
        domain: null,
        report,
        created_at: new Date().toISOString(),
      }).catch(() => {}); // non-fatal
    }

    return NextResponse.json({ report, cached: false });
  } catch (err) {
    console.error("[analyse]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
