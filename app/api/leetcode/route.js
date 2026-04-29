/**
 * GET /api/leetcode?company=stripe
 *
 * Returns LeetCode interview questions for a specific company.
 * Strategy (3-tier, no LeetCode Premium required):
 *   1. Direct link to leetcode.com/company/[slug]/ (always works)
 *   2. Exa search for public question lists (GitHub, blog posts)
 *   3. Cached 7 days in Supabase — LeetCode questions don't change often
 *
 * Each question returned: { title, url, difficulty, frequency, topic }
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const EXA_KEY = process.env.EXA_API_KEY;
const CACHE_DAYS = 7;

// Known LeetCode company slugs for direct linking
const LEETCODE_SLUGS = {
  google: "google", amazon: "amazon", meta: "meta", apple: "apple",
  microsoft: "microsoft", netflix: "netflix", stripe: "stripe",
  airbnb: "airbnb", uber: "uber", lyft: "lyft", twitter: "twitter-2",
  linkedin: "linkedin", salesforce: "salesforce", adobe: "adobe",
  nvidia: "nvidia", coinbase: "coinbase", doordash: "doordash",
  robinhood: "robinhood", brex: "brex", figma: "figma",
  notion: "notion", openai: "openai", anthropic: "anthropic",
  databricks: "databricks", snowflake: "snowflake", palantir: "palantir",
  instacart: "instacart", dropbox: "dropbox", twilio: "twilio",
  datadog: "datadog", mongodb: "mongodb", gitlab: "gitlab",
  atlassian: "atlassian", shopify: "shopify", asana: "asana",
};

function getSlug(companyName = "") {
  const normalized = companyName.toLowerCase().trim().replace(/\s+/g, "-");
  return LEETCODE_SLUGS[normalized] || normalized;
}

// Parse Exa results to extract question data
function parseQuestion(result) {
  const url = result.url || "";
  const title = result.title || "";
  const text = result.text || result.summary || "";

  // Only include actual LeetCode problem pages
  if (url.includes("leetcode.com/problems/")) {
    const slug = url.split("/problems/")[1]?.replace(/\/$/, "").split("/")[0] || "";
    const qTitle = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    // Infer difficulty from text signals
    let difficulty = "Medium";
    const lower = (title + text).toLowerCase();
    if (lower.includes("easy")) difficulty = "Easy";
    else if (lower.includes("hard")) difficulty = "Hard";

    return { title: qTitle, url, difficulty, type: "problem" };
  }

  // Include curated lists from GitHub/blogs
  if (url.includes("github.com") || url.includes("leetcode.com")) {
    return { title, url, type: "resource" };
  }

  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company") || "";
  if (!company) return NextResponse.json({ questions: [], resources: [] });

  const db = getSupabaseServer();
  const cacheKey = `leetcode::${company.toLowerCase().trim()}`;

  // ── 1. Check cache ─────────────────────────────────────────────
  if (db) {
    const cutoff = new Date(Date.now() - CACHE_DAYS * 86400000).toISOString();
    const { data } = await db
      .from("employee_cache") // reuse same table with different key prefix
      .select("employees, created_at")
      .eq("company_key", cacheKey)
      .gte("created_at", cutoff)
      .limit(1);

    if (data?.[0]?.employees) {
      return NextResponse.json(data[0].employees);
    }
  }

  const lcSlug = getSlug(company);
  const lcDirectUrl = `https://leetcode.com/company/${lcSlug}/`;

  // ── 2. Exa search for free question resources ──────────────────
  let questions = [];
  let resources = [];

  if (EXA_KEY) {
    try {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: { "x-api-key": EXA_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${company} LeetCode interview questions most asked problems 2024 2025`,
          type: "neural",
          numResults: 15,
          includeDomains: [
            "leetcode.com",
            "github.com",
            "geeksforgeeks.org",
            "interviewbit.com",
          ],
          contents: {
            text: { maxCharacters: 500 },
          },
        }),
      });

      const data = await res.json();
      const parsed = (data.results || []).map(parseQuestion).filter(Boolean);

      questions = parsed
        .filter((p) => p.type === "problem")
        .slice(0, 10);

      resources = parsed
        .filter((p) => p.type === "resource")
        .slice(0, 6);
    } catch (e) {
      console.error("[leetcode]", e.message);
    }
  }

  const result = {
    questions,
    resources,
    directUrl: lcDirectUrl,
    companySlug: lcSlug,
  };

  // ── 3. Cache result ────────────────────────────────────────────
  if (db) {
    await db.from("employee_cache").upsert(
      {
        company_key: cacheKey,
        company_name: company,
        employees: result, // reusing column
        created_at: new Date().toISOString(),
      },
      { onConflict: "company_key" }
    );
  }

  return NextResponse.json(result);
}
