/**
 * POST /api/analyse  { query: "Stripe" }
 *
 * Research pipeline: Exa search runs first (always), then Gemini
 * tries to analyse it. If Gemini quota is exhausted, returns the
 * Exa data directly as a structured report. Never hangs.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const EXA_BASE    = "https://api.exa.ai";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Models ordered by RPM availability (highest first → best chance of success)
// jsonMode=false for Gemma — those models don't support responseMimeType
const GEMINI_MODELS = [
  { id: "gemini-2.0-flash-lite",          jsonMode: true  }, // 4K RPM, Unlimited RPD ← best
  { id: "gemini-2.0-flash",               jsonMode: true  }, // 2K RPM, Unlimited RPD
  { id: "gemini-2.5-flash",               jsonMode: true  }, // 5+ RPM, 250K TPM
  { id: "gemini-2.5-flash-preview-04-17", jsonMode: true  }, // alternate 2.5 flash ID
  { id: "gemini-2.5-pro",                 jsonMode: true  }, // 0+150 RPM
  { id: "gemini-2.5-pro-preview-03-25",   jsonMode: true  }, // alternate 2.5 pro ID
  { id: "gemma-3-27b-it",                 jsonMode: false }, // 30 RPM, best Gemma quality
  { id: "gemma-3-12b-it",                 jsonMode: false }, // 30 RPM
  { id: "gemma-3-4b-it",                  jsonMode: false }, // 30 RPM
  { id: "gemma-3-2b-it",                  jsonMode: false }, // 30 RPM
  { id: "gemma-3-1b-it",                  jsonMode: false }, // 30 RPM ← last resort
];

// ── Helpers ────────────────────────────────────────────────────────

function cleanQuery(raw = "") {
  return raw
    .replace(/['']s\s+.*/i, "")
    .replace(/\s+(raises?|bets?|launches?|gets?|lands?|closes?|secures?|acquires?).*/i, "")
    .replace(/\s*[\|–—]\s*.*/g, "")
    .replace(/\$[\d,.]+[MmBbKk]?(\s+\w+)*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function exaSearch(query, opts = {}) {
  const key = process.env.EXA_API_KEY;
  if (!key) throw new Error("EXA_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${EXA_BASE}/search`, {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        type: "neural",
        numResults: opts.numResults || 6,
        contents: { text: { maxCharacters: 2000 }, highlights: { numSentences: 2, highlightsPerUrl: 2 } },
        ...opts,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Exa ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Try one Gemini/Gemma model with a hard 15s timeout
async function tryGemini(model, apiKey, prompt) {
  const { id, jsonMode } = model;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const genConfig = { temperature: 0.15, maxOutputTokens: 3500 };
    if (jsonMode) genConfig.responseMimeType = "application/json";

    const res = await fetch(`${GEMINI_BASE}/${id}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: genConfig,
      }),
      signal: controller.signal,
    });

    if (res.status === 429) throw new Error("quota");
    if (!res.ok) throw new Error(`http_${res.status}`);

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Strip markdown fences and extract JSON object
    const cleaned = text.replace(/```json[\s\S]*?```|```[\s\S]*?```/g, "").trim();
    const parsed = (() => {
      try { return JSON.parse(cleaned); }
      catch {
        const m = cleaned.match(/\{[\s\S]*\}/);
        return m ? JSON.parse(m[0]) : null;
      }
    })();

    if (!parsed || typeof parsed !== "object") throw new Error("json_parse");
    return { result: parsed, model: id };
  } finally {
    clearTimeout(timeout);
  }
}

// Try all models in cascade — no delays, first success wins
async function geminiCascade(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  for (const model of GEMINI_MODELS) {
    try {
      return await tryGemini(model, key, prompt);
    } catch (e) {
      console.warn(`[analyse] ${model.id}: ${e.message}`);
    }
  }
  return null;
}

// Structured report from raw Exa results when Gemini is unavailable
function stripMd(text = "") {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")  // [text](url) → text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")      // images
    .replace(/^#{1,6}\s+/gm, "")               // headers
    .replace(/[*_`~>]+/g, "")                  // bold/italic/code/blockquote
    .replace(/\|.*\|/g, "")                    // tables
    .replace(/\n{3,}/g, "\n\n")                // excess newlines
    .replace(/https?:\/\/\S+/g, "")            // bare URLs
    .trim();
}

function exaFallbackReport(name, results) {
  const allText = results.map(r => r.text || r.title || "").join(" ");
  const cleanText = stripMd(allText);
  const fundingMatch = allText.match(/\$([\d.]+)\s*([BMmKk](?:illion|M|B|K)?)/);
  const funding = fundingMatch ? `$${fundingMatch[1]}${fundingMatch[2].charAt(0).toUpperCase()}` : null;

  // Build a readable 2–3 sentence overview from clean snippets
  const sentences = cleanText.split(/\.\s+/).filter(s => s.length > 40 && !s.includes("http")).slice(0, 3);
  const overview = sentences.length
    ? sentences.join(". ").slice(0, 500) + "."
    : `${name} is a company. Full intelligence brief loading — click Research above to generate the complete analysis.`;

  return {
    name,
    tagline: results[0]?.title?.replace(new RegExp(`${name}[:\\s\\-]*`, "i"), "").slice(0, 120) || null,
    overview,
    stage: null,
    founded: null,
    headquarters: null,
    totalFunding: funding,
    sector: null,
    problem: null,
    solution: null,
    whyFunded: null,
    competitiveAdvantage: null,
    founders: [],
    fundingTimeline: [],
    insights: [],
    risks: [],
    competitorNames: [],
    analystVerdict: null,
    pressArticles: results.slice(0, 5).map(r => ({
      title: r.title || "",
      url: r.url || "",
      source: (() => { try { return new URL(r.url).hostname.replace("www.", ""); } catch { return ""; } })(),
      date: r.publishedDate?.slice(0, 10) || null,
    })).filter(a => a.url),
    _source: "exa_fallback",
    _updatedAt: new Date().toISOString(),
  };
}

// ── Route ──────────────────────────────────────────────────────────
export const maxDuration = 55;

export async function POST(request) {
  try {
  const body = await request.json().catch(() => ({}));
  const raw   = body?.query?.trim();
  const force = body?.force === true;   // force-refresh: bypass + delete cache
  if (!raw) return NextResponse.json({ error: "query required" }, { status: 400 });

  const name = cleanQuery(raw);
  if (!name) return NextResponse.json({ error: "Could not parse company name" }, { status: 400 });

  console.log(`[analyse] "${name}" force=${force}`);

  // 1. Supabase cache check (skipped when force=true)
  const db = getSupabaseServer();
  if (db && !force) {
    const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data: hit } = await db
      .from("startup_reports")
      .select("report")
      .ilike("startup_name", name)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1);

    if (hit?.[0]?.report) {
      console.log(`[analyse] cache hit for "${name}"`);
      return NextResponse.json({ report: hit[0].report, cached: true });
    }
  }

  // 1b. Force-refresh — delete old cache entry so fresh data is saved
  if (db && force) {
    await db.from("startup_reports").delete().ilike("startup_name", name);
    console.log(`[analyse] cache cleared for "${name}" (force refresh)`);
  }

  // 2. Exa search (parallel — always runs)
  let exaResults = [];
  try {
    const [r1, r2] = await Promise.all([
      exaSearch(`${name} startup funding investors valuation`, {
        numResults: 5,
        includeDomains: ["crunchbase.com", "techcrunch.com", "bloomberg.com", "forbes.com"],
      }),
      exaSearch(`${name} company founders CEO team overview`, {
        numResults: 5,
        includeDomains: ["crunchbase.com", "ycombinator.com", "techcrunch.com", "linkedin.com"],
      }),
    ]);
    exaResults = [...(r1.results || []), ...(r2.results || [])].slice(0, 10);
    console.log(`[analyse] Exa returned ${exaResults.length} results for "${name}"`);
  } catch (e) {
    console.error(`[analyse] Exa failed: ${e.message}`);
    return NextResponse.json({ error: `Data fetch failed: ${e.message}` }, { status: 502 });
  }

  // 3. Gemini analysis (falls back to Exa-only on quota)
  const context = exaResults
    .map((r, i) => `[${i + 1}] ${r.url}\n${r.title || ""}\n${(r.text || "").slice(0, 1500)}`)
    .join("\n\n---\n\n");

  const prompt = `You are a senior startup analyst. Based on these sources, write a JSON intelligence report for "${name}".

SOURCES:
${context}

Return ONLY a valid JSON object:
{
  "name": "${name}",
  "tagline": "one sharp sentence",
  "overview": "3-4 sentence overview paragraph",
  "stage": "Seed|Series A|Series B|Series C|Late Stage|Public|Acquired",
  "founded": "YYYY",
  "headquarters": "City, Country",
  "totalFunding": "$XM or null",
  "sector": "primary sector",
  "problem": { "statement": "...", "urgency": "...", "marketSize": "..." },
  "solution": "what they built",
  "whyFunded": "investor thesis 2-3 sentences",
  "competitiveAdvantage": "key moat",
  "founders": [{ "name": "...", "role": "...", "background": "...", "linkedinUrl": null }],
  "fundingTimeline": [{ "date": "Mon YYYY", "event": "...", "amount": "$XM", "investors": "..." }],
  "insights": ["insight 1", "insight 2", "insight 3"],
  "risks": ["risk 1", "risk 2"],
  "competitorNames": ["name1", "name2", "name3"],
  "analystVerdict": { "summary": "...", "watchScore": 8, "moatStrength": "Strong|Moderate|Weak", "marketPosition": "Leader|Challenger|Niche|Emerging", "fundingLikelihood": "High|Medium|Low" },
  "pressArticles": [{ "title": "...", "url": "...", "source": "...", "date": "YYYY-MM-DD" }]
}`;

  const geminiResult = await geminiCascade(prompt);

  let report;
  if (geminiResult) {
    report = { ...geminiResult.result, _source: "report", _model: geminiResult.model, _updatedAt: new Date().toISOString() };
    console.log(`[analyse] Gemini succeeded with ${geminiResult.model}`);
  } else {
    report = exaFallbackReport(name, exaResults);
    console.warn(`[analyse] Gemini unavailable — using Exa fallback for "${name}"`);
  }

  // 4. Save to Supabase (plain insert — no unique constraint on startup_name)
  if (db) {
    db.from("startup_reports")
      .insert({ startup_name: report.name || name, domain: null, report, created_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.warn("[analyse] Supabase save:", error.message); })
      .catch(e => console.warn("[analyse] Supabase save error:", e.message));
  }

  return NextResponse.json({ report, cached: false });
  } catch (err) {
    console.error("[analyse] Unhandled error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
