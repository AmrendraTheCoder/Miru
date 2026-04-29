import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * GET /api/yc-companies
 * Now queries the unified `companies` table (YC + Fortune500 + Unicorns + Tech Giants)
 * with a `tab` param to filter by source category.
 *
 * Params:
 *   q      — search query
 *   tab    — "yc" | "unicorn" | "fortune500" | "tech" | "all"
 *   sector — filter by sector string
 *   batch  — YC batch filter (yc only)
 *   page   — pagination page (default 1)
 *   limit  — results per page (max 100)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q      = searchParams.get("q")      || "";
  const tab    = searchParams.get("tab")    || "yc";
  const sector = searchParams.get("sector") || "";
  const batch  = searchParams.get("batch")  || "";
  const page   = parseInt(searchParams.get("page")  || "1");
  const limit  = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const from   = (page - 1) * limit;

  const db = getSupabaseServer();
  if (!db) return NextResponse.json({ companies: [], total: 0, error: "No DB" });

  try {
    let query = db
      .from("companies")
      .select("id, slug, name, tagline, description, sector, source, category, logo_url, " +
              "is_public, stock_ticker, ranking, revenue_usd, market_cap_usd, employee_count, " +
              "valuation_usd, total_funding, country, hq_city, yc_batch, yc_batch_year", { count: "exact" })
      .range(from, from + limit - 1);

    // Tab filter → maps to source column
    if (tab === "yc") {
      query = query.eq("source", "yc").order("yc_batch_year", { ascending: false }).order("name", { ascending: true });
    } else if (tab === "unicorn") {
      query = query.eq("source", "unicorn").order("valuation_usd", { ascending: false, nullsFirst: false }).order("name", { ascending: true });
    } else if (tab === "fortune500") {
      query = query.in("source", ["fortune500", "forbes2000"]).order("ranking", { ascending: true, nullsFirst: false }).order("name", { ascending: true });
    } else if (tab === "tech") {
      query = query.eq("source", "tech_list").order("market_cap_usd", { ascending: false, nullsFirst: false }).order("name", { ascending: true });
    } else {
      // "all" — everything, ordered by source priority then name
      query = query.order("source", { ascending: true }).order("name", { ascending: true });
    }

    // Search across name + tagline + description
    if (q) {
      query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // YC batch filter (only meaningful on yc tab)
    if (batch && tab === "yc") {
      query = query.eq("yc_batch", batch);
    }

    // Sector filter
    if (sector) {
      query = query.contains("sector", [sector]);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    // Normalise response shape so Discover cards work with either old or new fields
    const companies = (data || []).map(c => ({
      // Core (used by existing cards)
      id:         c.id,
      slug:       c.slug,
      name:       c.name,
      tagline:    c.tagline || null,
      one_liner:  c.tagline || null,        // legacy field alias
      description:c.description || null,
      sectors:    c.sector || [],           // legacy field alias
      sector:     c.sector || [],
      logo_url:   c.logo_url || null,
      batch:      c.yc_batch || null,
      batch_year: c.yc_batch_year || null,
      status:     c.category || null,

      // New fields
      source:        c.source,
      category:      c.category,
      is_public:     c.is_public,
      stock_ticker:  c.stock_ticker,
      ranking:       c.ranking,
      revenue_usd:   c.revenue_usd,
      market_cap_usd:c.market_cap_usd,
      employee_count:c.employee_count,
      valuation_usd: c.valuation_usd,
      total_funding: c.total_funding,
      country:       c.country,
      hq_city:       c.hq_city,
    }));

    return NextResponse.json({ companies, total: count || 0, page, limit });
  } catch (e) {
    return NextResponse.json({ companies: [], total: 0, error: e.message }, { status: 500 });
  }
}
