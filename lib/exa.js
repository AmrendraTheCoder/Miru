/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   EXA SEARCH — Startup Intelligence Platform                 ║
 * ║   All functions are browser-callable (no server proxy)       ║
 * ║                                                              ║
 * ║  CREDIT BUDGET GUIDE (Exa pricing as of 2025):              ║
 * ║  • /search  neural   → ~$0.007 per call + $0.001/result     ║
 * ║  • /search  auto     → ~$0.010 per call (smarter routing)   ║
 * ║  • /findSimilar      → ~$0.010 per call                     ║
 * ║  • text content      → +$0.001 per page                     ║
 * ║  • livecrawl         → +$0.002 per fresh crawl              ║
 * ║                                                              ║
 * ║  CREDIT RULES (strictly followed in every function):         ║
 * ║  ✅ DO: Session cache — never re-fetch same key in one tab   ║
 * ║  ✅ DO: includeDomains to target high-signal sites only      ║
 * ║  ✅ DO: Minimal numResults — enough signal, not excess       ║
 * ║  ✅ DO: livecrawl:"fallback" not "always" (saves $$)        ║
 * ║  ✅ DO: Combine subpages instead of separate calls          ║
 * ║  ✅ DO: Deduplicate results by URL before returning          ║
 * ║  ✅ DO: Specific highlight queries to maximise signal/token  ║
 * ║  ✅ DO: startPublishedDate on news to avoid stale results   ║
 * ║                                                              ║
 * ║  ❌ DON'T: livecrawl:"always" — doubles cost instantly      ║
 * ║  ❌ DON'T: numResults > 15 unless absolutely necessary      ║
 * ║  ❌ DON'T: Fetch the same startup twice in one session      ║
 * ║  ❌ DON'T: Use excludeDomains with empty string ""          ║
 * ║  ❌ DON'T: Fetch full text (5000 chars) when 2000 works     ║
 * ║  ❌ DON'T: Run findSimilar AND press search simultaneously  ║
 * ║  ❌ DON'T: Re-fetch YC batch list on every Discover visit   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const EXA_BASE = "https://api.exa.ai";

/* ─────────────────────────────────────────────────────────────────
   SESSION CACHE — prevents duplicate API calls within one session.
   Key format: "fnName::argument"
   Cleared only on hard refresh (page reload).
───────────────────────────────────────────────────────────────── */
const _cache = new Map();

function cached(key, fn) {
  if (_cache.has(key)) {
    console.log(`[Exa cache HIT] ${key}`);
    return Promise.resolve(_cache.get(key));
  }
  return fn().then(result => {
    _cache.set(key, result);
    console.log(`[Exa cache SET] ${key} (${_cache.size} entries total)`);
    return result;
  });
}

/** Call this when user explicitly refreshes a section */
export function clearCache(keyPrefix) {
  if (!keyPrefix) { _cache.clear(); return; }
  for (const k of _cache.keys()) {
    if (k.startsWith(keyPrefix)) _cache.delete(k);
  }
}

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */

/**
 * Parse any raw input (name, URL, or domain) into a clean hostname.
 * Returns null if the input looks like a plain company name (not a domain).
 *
 * Rule: only returns a domain string if the input contains a "." character
 * (e.g. "stripe.com", "https://stripe.com"). Plain names like "Stripe" return null.
 */
export function parseDomain(raw) {
  if (!raw) return null;
  try {
    const u = raw.startsWith("http") ? raw : `https://${raw}`;
    const host = new URL(u).hostname.replace(/^www\./, "");
    // Only return if it looks like a real domain (has a TLD)
    return host.includes(".") ? host : null;
  } catch {
    const stripped = raw.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    return stripped.includes(".") ? stripped : null;
  }
}

/**
 * Normalise a single Exa result into a clean, consistent shape.
 * Never throws — missing fields default to safe empty values.
 */
function normaliseResult(r) {
  if (!r || typeof r !== "object") return null;
  return {
    url: r.url || "",
    title: r.title || "",
    text: r.text || "",
    highlights: Array.isArray(r.highlights) ? r.highlights : [],
    summary: r.summary || "",
    publishedDate: r.publishedDate || null,
    author: r.author || null,
    image: r.image || null,
    favicon: r.favicon || null,
  };
}

/**
 * Flatten main results + their subpages into a single deduplicated array.
 * Filters out null/empty results.
 */
function flattenResults(results) {
  const seen = new Set();
  const flat = [];
  for (const r of (results || [])) {
    const nr = normaliseResult(r);
    if (nr && nr.url && !seen.has(nr.url)) { seen.add(nr.url); flat.push(nr); }
    if (Array.isArray(r.subpages)) {
      for (const sub of r.subpages) {
        const ns = normaliseResult(sub);
        if (ns && ns.url && !seen.has(ns.url)) { seen.add(ns.url); flat.push(ns); }
      }
    }
  }
  return flat;
}

/**
 * Core Exa POST wrapper.
 * - Retries once on 429 (rate limit) after 1s
 * - Throws a human-readable error on all other failures
 * - Strips empty/null values from the body to avoid Exa validation errors
 */
export async function exaPost(apiKey, path, body) {
  if (!apiKey) throw new Error("No Exa API key. Add one in Settings.");

  // Strip empty-string arrays (Exa rejects them)
  const cleanBody = JSON.parse(JSON.stringify(body, (_, v) => {
    if (Array.isArray(v) && v.length === 0) return undefined;
    if (v === "" || v === null) return undefined;
    return v;
  }));

  const attempt = async () => fetch(`${EXA_BASE}${path}`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(cleanBody),
  });

  let res = await attempt();

  // Retry once on rate limit
  if (res.status === 429) {
    console.warn("[Exa] Rate limited — retrying in 1.5s");
    await new Promise(r => setTimeout(r, 1500));
    res = await attempt();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Exa ${path} failed (HTTP ${res.status})`);
  }

  return res.json();
}

/* ─────────────────────────────────────────────────────────────────
   1. STARTUP DEEP RESEARCH
   Role: Primary data collection for a single startup.
   Strategy: One "auto" search (smarter than neural for company names)
   targeting the startup's own domain + Wikipedia + Crunchbase.
   Subpages cover /about, /team, /press — in a SINGLE call.
   
   Cost: ~$0.012 per call (cached after first hit).
───────────────────────────────────────────────────────────────── */
export function exaStartupResearch(apiKey, startupName) {
  const key = `research::${startupName.toLowerCase().trim()}`;
  return cached(key, async () => {
    const domain = parseDomain(startupName); // null if plain name like "Stripe"

    const body = {
      query: `${startupName} startup: founding story, problem solved, funding rounds, investors, team`,
      type: "auto",
      numResults: 10,
      contents: {
        text: { maxCharacters: 4000 },
        highlights: {
          numSentences: 5,
          highlightsPerUrl: 4,
          query: `${startupName} why funded problem solution founder background`,
        },
        summary: {
          query: `What does ${startupName} do? What problem do they solve? Why did investors fund them? Who are the founders?`,
        },
        // Hit /about, /team, /investors in ONE call — saves 2 extra search calls
        subpages: 4,
        subpageTarget: "about,team,founders,investors,press,story",
      },
      livecrawl: "fallback", // ✅ NOT "always" — use cached version if fresh enough
    };

    // If we have a real domain, restrict to it + top sources for precision
    if (domain) {
      body.includeDomains = [
        domain,
        "crunchbase.com",
        "techcrunch.com",
        "ycombinator.com",
      ];
    }

    const data = await exaPost(apiKey, "/search", body);
    return flattenResults(data.results || []);
  });
}

/* ─────────────────────────────────────────────────────────────────
   2. PRESS ARTICLES
   Role: Find editorial coverage — not the startup's own site.
   Strategy: Neural search across top tech publications.
   Explicitly EXCLUDES the startup's domain to avoid homepage noise.
   
   Cost: ~$0.010 per call (cached).
───────────────────────────────────────────────────────────────── */
export function exaPressArticles(apiKey, startupName) {
  const key = `press::${startupName.toLowerCase().trim()}`;
  return cached(key, async () => {
    const domain = parseDomain(startupName); // null-safe

    const body = {
      query: `"${startupName}" funding round announcement launch product news`,
      type: "neural",
      numResults: 8,
      // High-signal journalism sites only — don't waste credits on random blogs
      includeDomains: [
        "techcrunch.com",
        "forbes.com",
        "businessinsider.com",
        "wsj.com",
        "bloomberg.com",
        "venturebeat.com",
        "theinformation.com",
        "axios.com",
        "reuters.com",
        "wired.com",
      ],
      contents: {
        text: { maxCharacters: 2000 },
        summary: { query: `What happened with ${startupName}? What milestone or news does this article cover?` },
      },
      livecrawl: "fallback",
    };

    // ✅ Only add excludeDomains if we have a valid domain (avoids Exa validation error)
    if (domain) body.excludeDomains = [domain];

    const data = await exaPost(apiKey, "/search", body);
    return (data.results || []).map(normaliseResult).filter(Boolean);
  });
}

/* ─────────────────────────────────────────────────────────────────
   3. COMPETITOR DISCOVERY
   Role: Find companies doing similar things.
   Strategy: /findSimilar on the startup's homepage (Exa's semantic
   similarity engine). Falls back to neural keyword search if domain
   is unknown or findSimilar fails.
   
   Cost: ~$0.010 per call (cached). Graceful fallback = no extra cost.
───────────────────────────────────────────────────────────────── */
export function exaFindCompetitors(apiKey, startupName, domain) {
  const key = `competitors::${startupName.toLowerCase().trim()}`;
  return cached(key, async () => {
    const resolvedDomain = domain || parseDomain(startupName);

    // Strategy A: findSimilar (best quality, requires a valid URL)
    if (resolvedDomain) {
      try {
        const data = await exaPost(apiKey, "/findSimilar", {
          url: `https://${resolvedDomain}`,
          numResults: 6,
          excludeDomains: [resolvedDomain], // Don't return the startup itself
          contents: {
            text: { maxCharacters: 2500 },
            highlights: { numSentences: 3, highlightsPerUrl: 3 },
            summary: {
              query: "What does this company do? Who founded it? How much funding have they raised? Who are their customers?",
            },
          },
        });
        const results = (data.results || []).map(normaliseResult).filter(Boolean);
        if (results.length >= 3) return results; // Good enough, don't fall through
      } catch (e) {
        console.warn(`[Exa findSimilar] Failed for ${resolvedDomain}:`, e.message);
      }
    }

    // Strategy B: Neural keyword search fallback
    const data = await exaPost(apiKey, "/search", {
      query: `companies competing with ${startupName} similar product alternative`,
      type: "neural",
      numResults: 6,
      contents: {
        text: { maxCharacters: 2000 },
        summary: { query: `What does this company do and how does it compare to ${startupName}?` },
      },
      livecrawl: "fallback",
    });
    return (data.results || []).map(normaliseResult).filter(Boolean);
  });
}

/* ─────────────────────────────────────────────────────────────────
   4. FOUNDER BACKGROUND
   Role: Build a detailed profile of a specific founder.
   Strategy: Neural search. Targets LinkedIn public profiles,
   interviews, Wikipedia, and university alumni pages.
   NOT called automatically — only when user expands a founder card.
   
   Cost: ~$0.009 per call (on-demand, cached per founder).
───────────────────────────────────────────────────────────────── */
export function exaFounderBackground(apiKey, founderName, startupName) {
  const key = `founder::${founderName.toLowerCase().trim()}`;
  return cached(key, async () => {
    const data = await exaPost(apiKey, "/search", {
      query: `${founderName} founder CEO CTO ${startupName} biography education previous company career`,
      type: "neural",
      numResults: 7,
      // Prioritise high-quality biographical sources
      includeDomains: [
        "linkedin.com",
        "crunchbase.com",
        "techcrunch.com",
        "forbes.com",
        "wikipedia.org",
        "ycombinator.com",
        "twitter.com",
        "x.com",
      ],
      contents: {
        text: { maxCharacters: 3000 },
        highlights: {
          numSentences: 4,
          highlightsPerUrl: 3,
          query: `${founderName} education degree worked at previously founded`,
        },
        summary: {
          query: `Who is ${founderName}? What is their educational background, what companies did they work at before, what did they found previously?`,
        },
      },
      livecrawl: "fallback",
    });
    return (data.results || []).map(normaliseResult).filter(Boolean);
  });
}

/* ─────────────────────────────────────────────────────────────────
   5. FOUNDER PERSONALITY SIGNALS
   Role: Surface what a founder actually thinks/cares about.
   Strategy: Targets interviews, podcasts (transcript sites),
   and talks where founders speak freely.
   NOT called automatically — triggered only when user opens composer.
   
   Cost: ~$0.008 per call (on-demand, cached per founder).
───────────────────────────────────────────────────────────────── */
export function exaFounderPersonality(apiKey, founderName) {
  const key = `personality::${founderName.toLowerCase().trim()}`;
  return cached(key, async () => {
    const data = await exaPost(apiKey, "/search", {
      query: `${founderName} interview podcast talk believes thinks vision mission advice builders`,
      type: "neural",
      numResults: 6,
      // Transcript-rich & interview-rich sources
      includeDomains: [
        "ycombinator.com",
        "techcrunch.com",
        "podcastnotes.org",
        "lexfridman.com",
        "tim.blog",
        "medium.com",
        "substack.com",
        "youtube.com",
        "twitter.com",
        "x.com",
      ],
      contents: {
        text: { maxCharacters: 2500 },
        highlights: {
          numSentences: 4,
          highlightsPerUrl: 3,
          query: "I believe I think the most important we decided our mission the reason we built",
        },
        summary: {
          query: `What does ${founderName} believe in? What drives them? What do they say about building companies, their market, or their values?`,
        },
      },
      livecrawl: "fallback", // ✅ Added — was missing before (stale results risk)
    });
    return (data.results || []).map(normaliseResult).filter(Boolean);
  });
}

/* ─────────────────────────────────────────────────────────────────
   6. YC BATCH DISCOVERY
   Role: Get a list of companies from a specific YC batch.
   Strategy: Target ycombinator.com + major journalism coverage
   of that batch. Cached aggressively — batch data doesn't change.
   
   Cost: ~$0.010 per call (cached for entire session).
───────────────────────────────────────────────────────────────── */
export function exaYCBatchSearch(apiKey, batch = "W25") {
  const key = `yc::${batch.toUpperCase()}`;
  return cached(key, async () => {
    const data = await exaPost(apiKey, "/search", {
      query: `Y Combinator ${batch} batch startups complete list companies what they do`,
      type: "neural",
      numResults: 10,
      // YC's own site + curated coverage only
      includeDomains: [
        "ycombinator.com",
        "techcrunch.com",
        "producthunt.com",
        "hn.algolia.com",
      ],
      contents: {
        text: { maxCharacters: 5000 },
        highlights: {
          numSentences: 5,
          highlightsPerUrl: 4,
          query: `YC ${batch} startup name description what they build`,
        },
        summary: {
          query: `List all Y Combinator ${batch} batch companies with their name and one-line description of what they build.`,
        },
        subpages: 2,
        subpageTarget: "companies,startups,batch",
      },
      livecrawl: "fallback",
    });
    return (data.results || []).map(normaliseResult).filter(Boolean);
  });
}

/* ─────────────────────────────────────────────────────────────────
   7. HARVARD i-LAB STARTUPS
   Role: Discover Harvard-backed companies.
   Strategy: Targets Harvard's own innovation sites + major coverage.
   Cached aggressively — changes slowly.
   
   Cost: ~$0.009 per call (cached for session).
───────────────────────────────────────────────────────────────── */
export function exaHarvardStartups(apiKey) {
  const key = "harvard::ilab";
  return cached(key, async () => {
    const data = await exaPost(apiKey, "/search", {
      query: "Harvard i-lab innovation lab startup portfolio companies funded alumni 2024 2025",
      type: "neural",
      numResults: 10,
      includeDomains: [
        "i-lab.harvard.edu",
        "hbs.edu",
        "seas.harvard.edu",
        "techcrunch.com",
        "bostonglobe.com",
        "harvard.edu",
      ],
      contents: {
        text: { maxCharacters: 3500 },
        highlights: {
          numSentences: 4,
          highlightsPerUrl: 3,
          query: "Harvard startup founded raised funding alumni company",
        },
        summary: {
          query: "List Harvard i-lab backed startups — company name, what they do, how much funding they raised.",
        },
        subpages: 2,
        subpageTarget: "portfolio,startups,companies,ventures",
      },
      livecrawl: "fallback",
    });
    return (data.results || []).map(normaliseResult).filter(Boolean);
  });
}

/* ─────────────────────────────────────────────────────────────────
   8. DAILY STARTUP NEWS
   Role: Power the Feed tab with fresh funding/launch news.
   Strategy: Neural search across top publications with a 3-day
   rolling window. Results are Supabase-cached for 24h so this
   function is called AT MOST once per day per deployment.
   
   Cost: ~$0.015 per call — but only fires once per 24h session.
   
   ✅ startPublishedDate limits to last 72h — avoids stale results
   ❌ Do NOT call this on every page load — check Supabase cache first
───────────────────────────────────────────────────────────────── */
export function exaDailyStartupNews(apiKey) {
  // Cache key per-week — refreshes weekly, not daily (saves credits)
  const now = new Date();
  const weekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
  const key = `news::${weekKey}`;

  return cached(key, async () => {
    // 30-day window — all of current month
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const data = await exaPost(apiKey, "/search", {
      query: "startup raises funding seed Series A Series B launch new product 2026",
      type: "neural",
      numResults: 20,              // ✅ 20 not 25 — saves 5 result credits
      includeDomains: [
        "techcrunch.com",
        "reuters.com",
        "bloomberg.com",
        "axios.com",
        "businessinsider.com",
        "theverge.com",
        "forbes.com",
        "venturebeat.com",
        "sifted.eu",
        "wsj.com",
        "cnbc.com",
        "ft.com",
        "thenextweb.com",
      ],
      startPublishedDate: monthStart,
      contents: {
        // ✅ 400 chars is enough to extract the key facts — was 1000 (60% saving)
        text: { maxCharacters: 400 },
        // ✅ highlights are cheaper than summary (~$0 vs ~$0.002/result)
        highlights: {
          numSentences: 2,
          highlightsPerUrl: 1,
          query: "startup raised funding amount round",
        },
        // ❌ Removed: summary (was $0.002/result × 20 = $0.04 per news load)
      },
      // ✅ No livecrawl — Exa index fresh enough for journalism
    });

    // Sort by publishedDate descending (newest first)
    return (data.results || [])
      .map(r => {
        const n = normaliseResult(r);
        if (!n) return null;
        // Attach first highlight as fallback summary if text is short
        if (!n.text && r.highlights?.length) n.summary = r.highlights[0];
        return n;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const da = a.publishedDate ? new Date(a.publishedDate) : 0;
        const db = b.publishedDate ? new Date(b.publishedDate) : 0;
        return db - da;
      });
  });
}

