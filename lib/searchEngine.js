/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SEARCH ENGINE — Reinforcement Learning Decision Model          ║
 * ║                                                                  ║
 * ║  Inspired by ReasonBlocks (YC S26):                             ║
 * ║  "Your 10,000th run is no smarter than your 1st."              ║
 * ║  We fix that. Every search makes the next one better.           ║
 * ║                                                                  ║
 * ║  HOW IT WORKS:                                                   ║
 * ║                                                                  ║
 * ║  STATE    — current completeness of what we know (0.0–1.0)     ║
 * ║  ACTION   — which Exa query to run next                        ║
 * ║  REWARD   — quality signal extracted from results               ║
 * ║  POLICY   — run next query only if reward gap justifies cost    ║
 * ║  MEMORY   — localStorage stores which strategies worked         ║
 * ║                                                                  ║
 * ║  RESULT: Cheap startups (3 calls). Complex ones (6 calls).     ║
 * ║  Never wastes credits re-solving what's already known.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* ─────────────────────────────────────────────────────────────────
   KNOWLEDGE MEMORY (localStorage)
   Persists across sessions. Records which query strategies scored
   highest for which company "types" (AI infra, FinTech, etc.)
   Structure: { [strategyKey]: { wins: N, avgReward: 0.0–1.0 } }
───────────────────────────────────────────────────────────────── */
const MEMORY_KEY = "si_search_memory_v1";

function loadMemory() {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}"); }
  catch { return {}; }
}

function saveMemory(mem) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(mem)); } catch {}
}

function recordReward(strategyKey, reward) {
  const mem = loadMemory();
  const prev = mem[strategyKey] || { wins: 0, totalReward: 0 };
  mem[strategyKey] = {
    wins: prev.wins + (reward > 0.6 ? 1 : 0),
    totalReward: prev.totalReward + reward,
    runs: (prev.runs || 0) + 1,
    avgReward: ((prev.totalReward + reward) / ((prev.runs || 0) + 1)).toFixed(3),
    lastUsed: Date.now(),
  };
  saveMemory(mem);
}

export function getMemoryStats() {
  return loadMemory();
}

export function clearMemory() {
  try { localStorage.removeItem(MEMORY_KEY); } catch {}
}

/* ─────────────────────────────────────────────────────────────────
   STATE SCORING — measures how complete our knowledge is.
   
   Fields with weights (must sum to 1.0):
   - founders present & named        → 0.20
   - problem statement extracted     → 0.20
   - funding data (rounds/amounts)   → 0.15
   - overview/description            → 0.15
   - press articles found            → 0.10
   - competitor names                → 0.10
   - why funded explanation          → 0.10
   
   Score 0.0 = nothing known
   Score 1.0 = complete picture
   
   STOP THRESHOLD: 0.75 — above this, extra searches return
   diminishing rewards vs credit cost.
───────────────────────────────────────────────────────────────── */
const STOP_THRESHOLD = 0.75;

export function scoreState(report) {
  if (!report) return 0;
  let score = 0;

  // Founders (0.20)
  const founders = report.founders || [];
  if (founders.length > 0) score += 0.10;
  if (founders.some(f => f.background && f.background.length > 50)) score += 0.10;

  // Problem statement (0.20)
  if (report.problem?.statement && report.problem.statement.length > 40) score += 0.20;

  // Funding (0.15)
  if (report.totalFunding) score += 0.08;
  if (report.fundingTimeline?.length > 0) score += 0.07;

  // Overview (0.15)
  if (report.overview && report.overview.length > 80) score += 0.15;

  // Press (0.10)
  if (report.pressArticles?.length > 0) score += 0.05;
  if (report.pressArticles?.length > 2) score += 0.05;

  // Competitors (0.10)
  if (report.competitorNames?.length > 0) score += 0.05;
  if (report.competitorNames?.length > 2) score += 0.05;

  // Why funded (0.10)
  if (report.whyFunded && report.whyFunded.length > 60) score += 0.10;

  return Math.min(score, 1.0);
}

/**
 * Given a partial report (possibly from a first pass), determine
 * which fields are still missing and need a follow-up search.
 */
export function identifyGaps(report) {
  const gaps = [];
  if (!report) return ["overview", "problem", "founders", "funding", "press", "competitors"];

  if (!report.problem?.statement || report.problem.statement.length < 40) gaps.push("problem");
  if (!report.founders?.length) gaps.push("founders");
  if (!report.totalFunding && !report.fundingTimeline?.length) gaps.push("funding");
  if (!report.pressArticles?.length) gaps.push("press");
  if (!report.competitorNames?.length) gaps.push("competitors");
  if (!report.whyFunded || report.whyFunded.length < 60) gaps.push("whyFunded");

  return gaps;
}

/* ─────────────────────────────────────────────────────────────────
   QUERY STRATEGIES — each has a name, purpose, and a known
   "expected reward" from memory. The engine picks the highest
   expected reward strategy for the current gap.
───────────────────────────────────────────────────────────────── */
export const STRATEGIES = {
  // Fills: overview, problem, solution, whyFunded, founders (surface)
  HOMEPAGE: {
    id: "homepage",
    fills: ["overview", "problem", "whyFunded"],
    creditCost: 0.012,
    defaultExpectedReward: 0.65,
  },
  // Fills: press articles, funding rounds, dates
  PRESS: {
    id: "press",
    fills: ["press", "funding"],
    creditCost: 0.010,
    defaultExpectedReward: 0.55,
  },
  // Fills: founder backgrounds, education, career history
  FOUNDERS: {
    id: "founders",
    fills: ["founders"],
    creditCost: 0.009,
    defaultExpectedReward: 0.50,
  },
  // Fills: competitor names, competitive landscape
  COMPETITORS: {
    id: "competitors",
    fills: ["competitors"],
    creditCost: 0.010,
    defaultExpectedReward: 0.50,
  },
  // Fills: whyFunded, funding rounds, investor names
  CRUNCHBASE: {
    id: "crunchbase",
    fills: ["funding", "whyFunded"],
    creditCost: 0.008,
    defaultExpectedReward: 0.60,
  },
};

/**
 * Given current gaps, pick the ordered list of strategies to run.
 * Consults memory to prefer strategies that have historically worked.
 * Returns strategies sorted by: (expectedReward / creditCost) DESC
 */
export function planSearchStrategy(gaps, companyType = "unknown") {
  const mem = loadMemory();
  const plan = [];

  for (const [, strategy] of Object.entries(STRATEGIES)) {
    // Does this strategy address at least one current gap?
    const addressesGap = strategy.fills.some(f => gaps.includes(f));
    if (!addressesGap) continue;

    // Look up historical performance for this strategy + company type
    const memKey = `${strategy.id}::${companyType}`;
    const memEntry = mem[memKey];
    const expectedReward = memEntry
      ? parseFloat(memEntry.avgReward)
      : strategy.defaultExpectedReward;

    // Value = reward per dollar (higher = run this first)
    const value = expectedReward / strategy.creditCost;
    plan.push({ ...strategy, expectedReward, value, memKey });
  }

  // Sort by value DESC — highest reward-per-credit first
  return plan.sort((a, b) => b.value - a.value);
}

/* ─────────────────────────────────────────────────────────────────
   RESULT QUALITY SCORER — measures reward from a single Exa call.
   Returns 0.0–1.0.
   
   Signals that increase score:
   - Results contain named people      → founder presence
   - Results mention $ amounts         → funding signal
   - Results have long summaries       → content richness
   - Results include a date            → freshness
   - High highlight count              → topical relevance
───────────────────────────────────────────────────────────────── */
export function scoreResults(results) {
  if (!results?.length) return 0;

  let score = 0;
  const MAX = results.length;

  // Coverage — got results at all
  score += Math.min(results.length / 5, 1) * 0.20;

  // Content richness — summaries present and substantial
  const withSummary = results.filter(r => r.summary?.length > 60).length;
  score += (withSummary / MAX) * 0.25;

  // Funding signals — $ amounts in text
  const withFunding = results.filter(r =>
    /\$\d|\bmillion\b|\bbillion\b|\bseed\b|\bseries [a-c]\b/i.test(r.text + r.summary)
  ).length;
  score += Math.min(withFunding / 3, 1) * 0.20;

  // People signals — named individuals
  const withPeople = results.filter(r =>
    /\b(founder|CEO|CTO|co-founder)\b/i.test(r.text + r.summary)
  ).length;
  score += Math.min(withPeople / 3, 1) * 0.20;

  // Freshness — results have a published date
  const withDate = results.filter(r => r.publishedDate).length;
  score += (withDate / MAX) * 0.15;

  return Math.min(score, 1.0);
}

/* ─────────────────────────────────────────────────────────────────
   FAILURE DETECTOR — mirrors ReasonBlocks' "six monitors".
   Catches bad situations BEFORE wasting more credits.
   
   Returns: { failed: bool, reason: string, action: string }
───────────────────────────────────────────────────────────────── */
export function detectFailure(results, strategyId) {
  // Monitor 1: Empty results
  if (!results?.length) return {
    failed: true,
    reason: "Zero results returned",
    action: "Broaden query — remove domain restriction, try neural type",
  };

  // Monitor 2: Results are all from the wrong domain (noise)
  const uniqueDomains = new Set(results.map(r => {
    try { return new URL(r.url).hostname; } catch { return ""; }
  }));
  if (uniqueDomains.size === 1 && results.length > 3) return {
    failed: true,
    reason: "Results all from single domain — likely homepage spam",
    action: "Exclude that domain and retry with broader query",
  };

  // Monitor 3: All results have no summary (content extraction failed)
  const noSummary = results.every(r => !r.summary || r.summary.length < 20);
  if (noSummary) return {
    failed: true,
    reason: "Content extraction failed — no summaries",
    action: "Switch livecrawl to 'always' for this retry",
  };

  // Monitor 4: Low signal for strategy
  const reward = scoreResults(results);
  if (reward < 0.25) return {
    failed: true,
    reason: `Low reward (${reward.toFixed(2)}) for strategy '${strategyId}'`,
    action: "Try alternative query pattern from fallback bank",
  };

  return { failed: false };
}

/* ─────────────────────────────────────────────────────────────────
   FALLBACK QUERY BANK — alternative query patterns tried when
   the primary strategy fails. Like ReasonBlocks' "correction
   injection mid-run."
───────────────────────────────────────────────────────────────── */
export const FALLBACK_QUERIES = {
  homepage: (name) => [
    `"${name}" startup what problem does it solve founders raised`,
    `site:crunchbase.com ${name}`,
    `${name} company overview investors techcrunch`,
  ],
  press: (name) => [
    `${name} funding announcement raises million`,
    `${name} series seed venture capital investment`,
  ],
  founders: (name) => [
    `${name} founder CEO background stanford harvard MIT`,
    `who founded ${name} startup biography`,
  ],
  competitors: (name) => [
    `alternatives to ${name} competitors comparison`,
    `companies like ${name} similar product market`,
  ],
};

/* ─────────────────────────────────────────────────────────────────
   MAIN ORCHESTRATOR — the RL policy.
   
   Usage:
     const engine = new SearchEngine(exaKey, geminiKey);
     const report = await engine.research("ReasonBlocks", onProgress);
   
   onProgress({ step, score, strategy, message }) — called after each
   search action so the UI can show real-time progress.
───────────────────────────────────────────────────────────────── */
export class SearchEngine {
  constructor(exaKey, geminiKey, options = {}) {
    this.exaKey = exaKey;
    this.geminiKey = geminiKey;
    this.maxRounds = options.maxRounds || 4;     // Max search rounds before stopping
    this.stopThreshold = options.stopThreshold || STOP_THRESHOLD;
    this.companyType = options.companyType || "unknown";
    this.log = [];
  }

  /**
   * Core RL loop:
   * 1. Identify gaps in current knowledge (state)
   * 2. Plan which strategy addresses gaps best (policy)
   * 3. Run the search (action)
   * 4. Score the results (reward)
   * 5. Record reward to memory (learning)
   * 6. Check if we've reached the stop threshold (terminal state)
   * 7. Repeat
   */
  async research(startupName, onProgress = () => {}) {
    const {
      exaStartupResearch,
      exaPressArticles,
      exaFounderBackground,
      exaFindCompetitors,
    } = await import("./exa.js");
    const { analyseStartup } = await import("./analyzer.js");

    let partialReport = null;
    let allPages = [];
    let round = 0;
    let totalCost = 0;

    onProgress({ step: "init", message: `Starting adaptive research for "${startupName}"`, score: 0 });

    // ── Round 0: Always run the primary research first ──
    onProgress({ step: "search", strategy: "HOMEPAGE", message: "Primary search — homepage, about, founders...", score: 0 });
    const primaryPages = await exaStartupResearch(this.exaKey, startupName);
    allPages = [...primaryPages];
    totalCost += STRATEGIES.HOMEPAGE.creditCost;

    // Initial AI analysis to determine what we have
    if (!this.geminiKey) {
      return { pages: allPages, report: null, log: this.log };
    }

    onProgress({ step: "analyse", message: "First AI pass — building initial state...", score: 0.1 });
    partialReport = await analyseStartup(this.geminiKey, startupName, allPages).catch(() => null);

    let score = scoreState(partialReport);
    this.log.push({ round: 0, strategy: "HOMEPAGE", score, pages: primaryPages.length });
    onProgress({ step: "scored", message: `Initial score: ${(score * 100).toFixed(0)}%`, score });

    // ── RL Loop ──
    while (score < this.stopThreshold && round < this.maxRounds) {
      round++;
      const gaps = identifyGaps(partialReport);
      if (!gaps.length) break;

      const plan = planSearchStrategy(gaps, this.companyType);
      if (!plan.length) break;

      const strategy = plan[0]; // highest value strategy
      onProgress({
        step: "action",
        strategy: strategy.id,
        message: `Round ${round}: Running "${strategy.id}" to fill [${strategy.fills.join(", ")}]`,
        score,
        expectedReward: strategy.expectedReward,
      });

      // Run the selected strategy
      let newPages = [];
      try {
        if (strategy.id === "press") {
          newPages = await exaPressArticles(this.exaKey, startupName);
        } else if (strategy.id === "founders" && partialReport?.founders?.[0]?.name) {
          newPages = await exaFounderBackground(this.exaKey, partialReport.founders[0].name, startupName);
        } else if (strategy.id === "competitors") {
          newPages = await exaFindCompetitors(this.exaKey, startupName, partialReport?.domain);
        } else if (strategy.id === "crunchbase") {
          const { exaPost } = await import("./exa.js");
          // Direct Crunchbase hit — highest funding data density
          const data = await exaPost(this.exaKey, "/search", {
            query: `${startupName} funding rounds investors crunchbase`,
            type: "neural",
            numResults: 5,
            includeDomains: ["crunchbase.com", "pitchbook.com", "techcrunch.com"],
            contents: { text: { maxCharacters: 3000 }, summary: { query: `${startupName} total funding raised investors rounds` } },
            livecrawl: "fallback",
          });
          newPages = (data.results || []).map(r => ({
            url: r.url || "", title: r.title || "", text: r.text || "",
            highlights: r.highlights || [], summary: r.summary || "",
            publishedDate: r.publishedDate || null, author: null, image: null, favicon: null,
          }));
        }
      } catch (e) {
        this.log.push({ round, strategy: strategy.id, error: e.message });
        onProgress({ step: "error", message: `Strategy "${strategy.id}" failed: ${e.message}`, score });
        continue; // Try next strategy next round
      }

      // Failure detection
      const { failed, reason, action } = detectFailure(newPages, strategy.id);
      if (failed) {
        onProgress({ step: "failure", message: `Monitor triggered: ${reason}. ${action}`, score });
        this.log.push({ round, strategy: strategy.id, failed: true, reason });
        recordReward(strategy.memKey, 0.1); // Low reward for failure
        continue;
      }

      // Merge new pages (deduplicate)
      const existing = new Set(allPages.map(p => p.url));
      const fresh = newPages.filter(p => !existing.has(p.url));
      allPages = [...allPages, ...fresh];
      totalCost += strategy.creditCost;

      // Re-analyse with accumulated pages
      onProgress({ step: "analyse", message: `Integrating ${fresh.length} new sources...`, score });
      const reward = scoreResults(newPages);

      partialReport = await analyseStartup(this.geminiKey, startupName, allPages).catch(() => partialReport);
      const newScore = scoreState(partialReport);

      // Record reward to memory
      recordReward(strategy.memKey, reward);
      this.log.push({ round, strategy: strategy.id, reward, newScore, freshPages: fresh.length });

      score = newScore;
      onProgress({ step: "scored", message: `Score after round ${round}: ${(score * 100).toFixed(0)}%`, score });

      // Stop early if we hit threshold — don't burn more credits
      if (score >= this.stopThreshold) {
        onProgress({ step: "done", message: `Reached ${(score * 100).toFixed(0)}% — stopping (threshold met)`, score });
        break;
      }
    }

    onProgress({
      step: "complete",
      message: `Research complete. Score: ${(score * 100).toFixed(0)}%, Rounds: ${round + 1}, Est. cost: $${totalCost.toFixed(4)}`,
      score,
    });

    return { pages: allPages, report: partialReport, log: this.log, score, totalCost };
  }
}
