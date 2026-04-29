/**
 * POST /api/employees
 * { companyName: "Stripe", domain: "stripe.com" }
 *
 * Finds publicly available LinkedIn profiles of people
 * currently working at the company using Exa neural search.
 *
 * Returns profiles from linkedin.com/in/ URLs only —
 * these are public pages, no login required, no scraping walls.
 *
 * Results cached 48h in Supabase to avoid repeat Exa credits.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const EXA_KEY = process.env.EXA_API_KEY;
const CACHE_HOURS = 48;

// Extract name + role from a LinkedIn public profile URL/title/summary
function parseProfile(result) {
  const url = result.url || "";
  if (!url.includes("linkedin.com/in/")) return null;

  // Clean URL — remove query params and trailing slashes
  const cleanUrl = url.split("?")[0].replace(/\/$/, "");

  // Name from title: "John Smith - Software Engineer at Stripe | LinkedIn"
  const title = result.title || "";
  const namePart = title.split(" - ")[0]?.split(" | ")[0]?.trim();
  const rolePart = title.split(" - ")[1]?.split(" | ")[0]?.trim() || "";

  // Filter out generic LinkedIn pages
  if (!namePart || namePart.toLowerCase().includes("linkedin") || namePart.length < 3) {
    return null;
  }

  // Extract role from pattern "X at Company" or just take whatever is there
  const roleClean = rolePart.replace(/ at .+$/, "").trim();

  return {
    name: namePart,
    role: roleClean || "Employee",
    linkedinUrl: cleanUrl,
  };
}

export async function POST(request) {
  const { companyName, domain } = await request.json().catch(() => ({}));
  if (!companyName) {
    return NextResponse.json({ employees: [] });
  }

  const db = getSupabaseServer();
  const cacheKey = `employees::${companyName.toLowerCase().trim()}`;

  // ── 1. Check cache ─────────────────────────────────────────
  if (db) {
    const cutoff = new Date(Date.now() - CACHE_HOURS * 3_600_000).toISOString();
    const { data } = await db
      .from("employee_cache")
      .select("employees, created_at")
      .eq("company_key", cacheKey)
      .gte("created_at", cutoff)
      .limit(1);

    if (data?.[0]?.employees) {
      return NextResponse.json({ employees: data[0].employees, cached: true });
    }
  }

  // ── 2. Fetch from Exa ──────────────────────────────────────
  if (!EXA_KEY) {
    return NextResponse.json({
      employees: [],
      error: "No EXA_API_KEY — add it to .env to enable employee search",
    });
  }

  try {
    const domainStr = domain ? domain.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";

    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": EXA_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Target individual LinkedIn profile pages directly
        query: `site:linkedin.com/in Software Engineer SDE "${companyName}" current employee`,
        type: "keyword",
        numResults: 25,
        includeDomains: ["linkedin.com"],
        contents: {
          text: { maxCharacters: 0 }, // Title only — saves credits
        },
      }),
    });

    const data = await res.json();
    const raw = data.results || [];

    // Parse and filter valid LinkedIn /in/ profiles
    const employees = raw
      .map(parseProfile)
      .filter(Boolean)
      .filter(
        // Remove duplicates by URL
        (emp, idx, arr) => arr.findIndex((e) => e.linkedinUrl === emp.linkedinUrl) === idx
      )
      .slice(0, 12); // Show max 12

    // ── 3. Cache result ──────────────────────────────────────
    if (db && employees.length > 0) {
      await db.from("employee_cache").upsert(
        {
          company_key: cacheKey,
          company_name: companyName,
          employees,
          created_at: new Date().toISOString(),
        },
        { onConflict: "company_key" }
      );
    }

    return NextResponse.json({ employees });
  } catch (e) {
    console.error("[employees]", e.message);
    return NextResponse.json({ employees: [], error: e.message });
  }
}
