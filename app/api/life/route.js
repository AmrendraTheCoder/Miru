/**
 * GET /api/life?company=Stripe
 *
 * Returns salary benchmarks, perks, office culture, and Glassdoor
 * data for any company. Results are cached in startup_reports with
 * a "life:" prefix to avoid a new table.
 *
 * Data sources (all via Exa neural search, no extra API keys):
 *   Salary  → levels.fyi, glassdoor.com, blind.com
 *   Perks   → glassdoor.com, builtin.com, comparably.com
 *   Culture → glassdoor.com, reddit.com, blind.com
 *   Photos  → techcrunch.com, businessinsider.com, blog posts
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const EXA_BASE = "https://api.exa.ai";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const GEMINI_MODELS = [
  { id: "gemini-2.0-flash-lite", jsonMode: true  },
  { id: "gemini-2.0-flash",      jsonMode: true  },
  { id: "gemini-2.5-flash",      jsonMode: true  },
  { id: "gemma-3-27b-it",        jsonMode: false },
  { id: "gemma-3-12b-it",        jsonMode: false },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Exa search helper ───────────────────────────────────────────
async function exaSearch(query, opts = {}) {
  const key = process.env.EXA_API_KEY;
  if (!key) throw new Error("EXA_API_KEY not configured");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${EXA_BASE}/search`, {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        type: "neural",
        numResults: opts.numResults || 5,
        contents: {
          text: { maxCharacters: 2500 },
          highlights: { numSentences: 3, highlightsPerUrl: 2 },
        },
        ...opts,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Exa ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(t);
  }
}

// ── Gemini structuring (optional enhancement) ───────────────────
async function tryGemini(model, key, prompt) {
  const { id, jsonMode } = model;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 18000);
  try {
    const genConfig = { temperature: 0.1, maxOutputTokens: 3000 };
    if (jsonMode) genConfig.responseMimeType = "application/json";

    const res = await fetch(`${GEMINI_BASE}/${id}:generateContent?key=${key}`, {
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
    const cleaned = text.replace(/```json[\s\S]*?```|```[\s\S]*?```/g, "").trim();
    const parsed = (() => {
      try { return JSON.parse(cleaned); }
      catch { const m = cleaned.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; }
    })();
    if (!parsed || typeof parsed !== "object") throw new Error("json_parse");
    return { result: parsed, model: id };
  } finally {
    clearTimeout(t);
  }
}

async function geminiStructure(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  for (const model of GEMINI_MODELS) {
    try { return await tryGemini(model, key, prompt); }
    catch (e) { console.warn(`[life] ${model.id}: ${e.message}`); }
  }
  return null;
}

// ── Text parsers (pure Exa fallback) ────────────────────────────
function extractSalaries(results) {
  const salaries = [];
  const roleMap = {
    "new grad": "New Grad SWE",
    "software engineer l1": "SWE L1 / New Grad",
    "software engineer l2": "SWE L2",
    "software engineer l3": "SWE L3",
    "software engineer l4": "SWE L4 / Senior",
    "software engineer l5": "SWE L5 / Staff",
    "software engineer l6": "SWE L6 / Principal",
    "senior engineer": "Senior Engineer",
    "staff engineer": "Staff Engineer",
    "principal engineer": "Principal Engineer",
    "product manager": "Product Manager",
    "data scientist": "Data Scientist",
    "engineering manager": "Engineering Manager",
  };

  const allText = results.map((r) => (r.text || "") + " " + (r.highlights || []).join(" ")).join("\n");
  const lines = allText.split(/[\n.]+/).map((l) => l.trim()).filter((l) => l.length > 15);

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Look for lines with salary data
    const hasMoney = /\$[\d,]+[kKmM]?|\b\d{3,3},\d{3}\b|\b\d{2,3}[kK]\b/.test(line);
    if (!hasMoney) continue;

    let role = null;
    for (const [key, label] of Object.entries(roleMap)) {
      if (lower.includes(key)) { role = label; break; }
    }
    if (!role) continue;

    // Extract numbers
    const nums = [...line.matchAll(/\$([\d,]+)[kK]?/g)].map((m) => {
      const n = parseInt(m[1].replace(/,/g, ""));
      return line[m.index + m[0].length]?.toLowerCase() === "k" ? n * 1000 : n < 1000 ? n * 1000 : n;
    }).filter((n) => n >= 50000 && n <= 2000000);

    if (nums.length === 0) continue;

    const base  = nums[0];
    const total = nums.length > 1 ? Math.max(...nums) : null;
    const fmt   = (n) => n ? `$${Math.round(n / 1000)}K` : null;

    if (!salaries.find((s) => s.role === role)) {
      salaries.push({ role, base: fmt(base), total: fmt(total) });
    }
    if (salaries.length >= 6) break;
  }
  return salaries;
}

function extractPerks(results) {
  const PERK_KEYWORDS = [
    ["free food", "free meal", "free lunch", "free breakfast", "cafeteria", "catered"],
    ["health insurance", "medical", "dental", "vision", "healthcare"],
    ["remote", "work from home", "wfh", "hybrid", "flexible work"],
    ["equity", "rsu", "stock", "espp"],
    ["401k", "retirement", "pension"],
    ["commuter", "transport", "shuttle", "transit"],
    ["parental leave", "maternity", "paternity"],
    ["learning", "education", "tuition", "l&d", "training budget"],
    ["unlimited pto", "unlimited vacation", "flexible pto"],
    ["gym", "wellness", "fitness"],
    ["home office", "wfh stipend", "equipment"],
    ["mental health", "therapy", "counseling"],
  ];

  const PERK_LABELS = [
    "Free meals & snacks", "Health, dental & vision insurance",
    "Remote / hybrid work", "Equity & RSUs",
    "401(k) matching", "Commuter & transport benefits",
    "Parental leave", "Learning & development budget",
    "Unlimited PTO", "Gym & wellness perks",
    "Home office stipend", "Mental health support",
  ];

  const allText = results.map((r) =>
    (r.text || "") + " " + (r.highlights || []).join(" ")
  ).join(" ").toLowerCase();

  return PERK_KEYWORDS
    .map((keywords, i) => ({
      label: PERK_LABELS[i],
      found: keywords.some((k) => allText.includes(k)),
    }))
    .filter((p) => p.found)
    .map((p) => p.label);
}

function extractGlassdoor(results) {
  const allText = results.map((r) => (r.text || "") + " " + (r.highlights || []).join(" ")).join(" ");

  // Rating pattern: "4.3 out of 5" or "Rating: 4.3" or "4.3/5"
  const ratingMatch = allText.match(/\b([3-5]\.\d)\s*(?:out of\s*5|\/\s*5|stars?)/i)
    || allText.match(/(?:rating|rated|score)[:\s]+([3-5]\.\d)/i);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  // Review count
  const reviewMatch = allText.match(/([\d,]+)\s+(?:reviews?|ratings?)/i);
  const reviews = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, "")) : null;

  // Extract culture highlights (short, meaningful sentences)
  const highlights = results.flatMap((r) => r.highlights || [])
    .filter((h) => h.length > 30 && h.length < 200)
    .filter((h) => {
      const l = h.toLowerCase();
      return l.includes("culture") || l.includes("team") || l.includes("work") ||
             l.includes("manage") || l.includes("growth") || l.includes("balance");
    })
    .slice(0, 4);

  return { rating, reviews, highlights };
}

function extractPhotos(results) {
  return results
    .filter((r) => r.url && r.title)
    .map((r) => ({
      title: r.title?.slice(0, 80) || "Office photo",
      sourceUrl: r.url,
      // Try to find an image URL from the result
      imageUrl: r.image || null,
    }))
    .slice(0, 6);
}

// ── Build Exa-only report ────────────────────────────────────────
function buildExaReport(name, salary, perks, culture, photos) {
  return {
    company: name,
    salaries: extractSalaries(salary),
    perks: extractPerks(perks),
    ...extractGlassdoor(culture),
    officePhotos: extractPhotos(photos),
    cultureSnippets: culture.flatMap((r) => r.highlights || []).slice(0, 6),
    faq: [],
    sources: [
      { name: "Levels.fyi", url: `https://www.levels.fyi/companies/${name.toLowerCase().replace(/\s+/g, "-")}/salaries/software-engineer/` },
      { name: "Glassdoor", url: `https://www.glassdoor.com/Reviews/${name.replace(/\s+/g, "-")}-Reviews-E.htm` },
      { name: "Blind", url: `https://www.teamblind.com/company/${name.replace(/\s+/g, "-")}` },
    ],
    _source: "exa",
    _updatedAt: new Date().toISOString(),
  };
}

// ── Route ────────────────────────────────────────────────────────
export const maxDuration = 55;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company")?.trim();
    if (!company) return NextResponse.json({ error: "company param required" }, { status: 400 });

    // 1. Cache check (30-day TTL)
    const db = getSupabaseServer();
    const cacheKey = `life:${company.toLowerCase()}`;
    if (db) {
      const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data: hit } = await db
        .from("startup_reports")
        .select("report, created_at")
        .eq("startup_name", cacheKey)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1);

      if (hit?.[0]?.report) {
        return NextResponse.json({ life: hit[0].report, cached: true });
      }
    }

    // 2. Parallel Exa searches
    const [salaryRes, perksRes, cultureRes, photosRes] = await Promise.allSettled([
      exaSearch(`${company} software engineer salary compensation 2024`, {
        numResults: 6,
        includeDomains: ["levels.fyi", "glassdoor.com", "teamblind.com", "reddit.com"],
      }),
      exaSearch(`${company} employee benefits perks work culture 2024`, {
        numResults: 5,
        includeDomains: ["glassdoor.com", "builtin.com", "comparably.com", "linkedin.com", "themuse.com"],
      }),
      exaSearch(`what is it like to work at ${company} employee review culture`, {
        numResults: 5,
        includeDomains: ["glassdoor.com", "reddit.com", "teamblind.com", "comparably.com"],
      }),
      exaSearch(`${company} office headquarters photos tour workspace`, {
        numResults: 5,
      }),
    ]);

    const salary  = salaryRes.status  === "fulfilled" ? salaryRes.value.results  || [] : [];
    const perks   = perksRes.status   === "fulfilled" ? perksRes.value.results   || [] : [];
    const culture = cultureRes.status === "fulfilled" ? cultureRes.value.results || [] : [];
    const photos  = photosRes.status  === "fulfilled" ? photosRes.value.results  || [] : [];

    console.log(`[life] ${company}: salary=${salary.length} perks=${perks.length} culture=${culture.length} photos=${photos.length}`);

    // 3. Try Gemini to structure everything intelligently
    const allContext = [
      ...salary.slice(0, 3), ...perks.slice(0, 3), ...culture.slice(0, 3)
    ].map((r, i) => `[${i + 1}] ${r.url}\n${r.title || ""}\n${(r.text || "").slice(0, 1000)}`).join("\n\n---\n\n");

    const prompt = `You are an expert at extracting structured company data for job seekers.

Based on these sources about "${company}", return a JSON report:

SOURCES:
${allContext}

Return ONLY valid JSON:
{
  "company": "${company}",
  "salaries": [
    { "role": "Software Engineer L3 / New Grad", "base": "$165K", "equity": "$80K/yr", "total": "$250K" },
    { "role": "Software Engineer L4 / Senior", "base": "$200K", "equity": "$120K/yr", "total": "$330K" },
    { "role": "Software Engineer L5 / Staff", "base": "$240K", "equity": "$180K/yr", "total": "$440K" },
    { "role": "Product Manager L4", "base": "$190K", "equity": "$100K/yr", "total": "$300K" },
    { "role": "Data Scientist", "base": "$170K", "equity": "$80K/yr", "total": "$260K" },
    { "role": "Engineering Manager", "base": "$220K", "equity": "$200K/yr", "total": "$440K" }
  ],
  "perks": [
    "Free meals (breakfast, lunch, dinner)",
    "$X,000/yr learning & development budget",
    "Remote-friendly / hybrid",
    "Comprehensive health + dental + vision",
    "Commuter/transport benefits",
    "Equity (RSUs/stock options)",
    "Parental leave",
    "Home office stipend"
  ],
  "glassdoorRating": 4.3,
  "glassdoorReviews": 2847,
  "cultureSnippets": [
    "High ownership and autonomy — engineers ship features end-to-end.",
    "Mission-driven company with a focus on growing internet commerce.",
    "Fast-paced environment with smart, collaborative colleagues.",
    "Strong emphasis on documentation and written communication."
  ],
  "faq": [
    { "q": "What is the interview process like?", "a": "Typically 4-6 rounds: phone screen, technical, system design, behavioral. Loop takes 3-4 weeks." },
    { "q": "How is work-life balance?", "a": "Varies by team. Engineering teams often work 45-55 hrs/week. Strong PTO culture but high expectations." },
    { "q": "Does ${company} offer remote work?", "a": "Hybrid model: most teams require 2-3 days in office per week." },
    { "q": "Is equity meaningful?", "a": "RSUs vest over 4 years with 1-year cliff. At this valuation, meaningful upside exists." }
  ]
}

Use ONLY data from the sources. If a value is unknown, use null. Return NO markdown, only pure JSON.`;

    const gemini = await geminiStructure(prompt);

    let life;
    if (gemini?.result) {
      life = {
        ...gemini.result,
        officePhotos: extractPhotos(photos),
        sources: [
          { name: "Levels.fyi", url: `https://www.levels.fyi/companies/${company.toLowerCase().replace(/\s+/g, "-")}/salaries/software-engineer/` },
          { name: "Glassdoor", url: `https://www.glassdoor.com/Reviews/${company.replace(/\s+/g, "-")}-Reviews-E.htm` },
        ],
        _source: "gemini",
        _model: gemini.model,
        _updatedAt: new Date().toISOString(),
      };
    } else {
      life = buildExaReport(company, salary, perks, culture, photos);
    }

    // 4. Cache result
    if (db) {
      db.from("startup_reports")
        .insert({ startup_name: cacheKey, report: life, created_at: new Date().toISOString() })
        .then(({ error }) => { if (error) console.warn("[life] cache save:", error.message); })
        .catch(() => {});
    }

    return NextResponse.json({ life, cached: false });
  } catch (err) {
    console.error("[life] error:", err?.message);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
