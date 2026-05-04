"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ResearchReport from "./ResearchReport";
import { exaStartupResearch } from "@/lib/exa";
import { analyseCompetitor } from "@/lib/analyzer";
import { SearchEngine } from "@/lib/searchEngine";
import SettingsModal from "./SettingsModal";
import FeedTab from "./FeedTab";
import DiscoverTab from "./DiscoverTab";
import SalariesTab from "./SalariesTab";

// ── Helpers ────────────────────────────────────────────────────────
function RadarLoader({ message, score, strategy }) {
  return (
    <div className="loading-wrap">
      <div className="loading-text">{message || "Researching..."}</div>
      {score > 0 && (
        <div className="rl-progress-wrap">
          <div className="rl-progress-header">
            <span>Knowledge score</span>
            <span className="rl-progress-score">{Math.round(score * 100)}%</span>
          </div>
          <div className="rl-bar-track">
            <div className="rl-bar-fill" style={{ width: `${Math.round(score * 100)}%` }} />
          </div>
          {strategy && (
            <div className="rl-strategy-tag">
              <div className="rl-live-dot" />
              Strategy: {strategy}
            </div>
          )}
        </div>
      )}
      <div className="loading-steps">Adaptive engine — stops at 75% confidence</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function MiruApp({ initialTab = "feed" }) {
  const router = useRouter();
  const [tab, setTab]     = useState(initialTab);
  const [query, setQuery] = useState("");

  // ── Research state ──────────────────────────────────────────────
  const [loading, setLoading]       = useState(false);
  const [rlProgress, setRlProgress] = useState({ message: "", score: 0, strategy: null });
  const [report, setReport]         = useState(null);
  const [competitors, setCompetitors]   = useState([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [error, setError]           = useState("");

  // ── Feed / News state ───────────────────────────────────────────
  const [news, setNews]               = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsCacheInfo, setNewsCacheInfo] = useState(null);

  // ── Settings ────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState({ hasExaKey: false, hasGeminiKey: false, hasSupabase: false });

  // geminiKey used only for NewsCard enrichment (optional, from server)
  const [geminiKey, setGeminiKey] = useState("");

  // ── Init ────────────────────────────────────────────────────────
  useEffect(() => {
    // Fetch server settings (boolean flags only — no key values)
    fetch("/api/settings")
      .then(r => r.json())
      .then(status => {
        setServerStatus(status);
        // Store gemini flag for NewsCard enrichment hint
        // (actual enrichment uses server-side API — geminiKey stays empty client-side)
      })
      .catch(() => {});

    // Load news from server (no user key needed)
    loadNews();

    // Handle ?q= from URL (startup page "Run AI research" CTA)
    const urlQ = new URLSearchParams(window.location.search).get("q");
    if (urlQ?.trim()) {
      setQuery(urlQ.trim());
      setTab("research");
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => research(urlQ.trim()), 300);
    }
  }, []); // eslint-disable-line

  // ── Tab effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "research") setQuery("");
  }, [tab]);

  // ── News ────────────────────────────────────────────────────────
  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/news").then(r => r.json());
      if (res.news?.length) {
        setNews(res.news);
        setNewsCacheInfo(res);
      }
    } catch (e) { console.warn("News load error:", e.message); }
    setNewsLoading(false);
  };

  // ── Research ────────────────────────────────────────────────────
  const research = useCallback(async (startupName) => {
    const name = (startupName || query).trim();
    if (!name) return setError("Enter a startup name.");

    setError(""); setLoading(true); setReport(null); setCompetitors([]);
    setRlProgress({ message: `Checking cache for "${name}"...`, score: 0, strategy: null });
    setQuery(name);
    setTab("research");

    try {
      const cached = await fetch(`/api/reports?name=${encodeURIComponent(name)}`)
        .then(r => r.json()).catch(() => ({ report: null }));
      if (cached.report) {
        setRlProgress({ message: `Loaded from cache (${cached.ageHours}h old)`, score: 1, strategy: "CACHE" });
        await new Promise(r => setTimeout(r, 600));
        setReport(cached.report);
        setLoading(false);
        if (cached.report.competitorNames?.length) loadCompetitorProfiles(cached.report.competitorNames, cached.report.domain);
        return;
      }

      setRlProgress({ message: `Starting adaptive research for "${name}"...`, score: 0, strategy: null });

      // Research uses server-side keys via /api/exa proxy
      // No client-side key needed — server reads process.env.EXA_API_KEY
      const engine = new SearchEngine("", "", { maxRounds: 4, stopThreshold: 0.75 });
      const { report: result } = await engine.research(name, setRlProgress);

      if (!result) {
        setError("No data found. Try a more specific company name.");
      } else {
        setReport(result);
        fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, domain: result.domain, report: result }),
        }).catch(() => {});
        if (result.competitorNames?.length) loadCompetitorProfiles(result.competitorNames, result.domain);
      }
    } catch (e) {
      setError(e.message || "Research failed.");
    }
    setLoading(false);
  }, [query]); // eslint-disable-line

  const loadCompetitorProfiles = async (names, domain) => {
    setLoadingComps(true);
    const results = [];
    for (const name of names.slice(0, 4)) {
      try {
        const pages = await exaStartupResearch("", name);
        if (pages.length) {
          const profile = await analyseCompetitor("", name, pages);
          results.push(profile);
          setCompetitors([...results]);
        }
      } catch {}
    }
    setLoadingComps(false);
  };

  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Header ── */}
      <div className="header">
        <div className="header-inner">
          <a className="header-logo" href="/">
            <span className="header-logo-box">M</span>
            Miru
          </a>
          <nav className="header-nav">
            {[
              ["/feed",      "feed",      "Feed"],
              ["/discover",  "discover",  "Discover"],
              ["/salaries",  "salaries",  "Salaries"],
            ].map(([href, id, label]) => (
              <button key={id}
                className={`nav-tab ${tab === id ? "active" : ""}`}
                onClick={() => { setTab(id); router.push(href); }}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
              <span className="settings-label">Settings</span>
              <svg className="settings-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Settings">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="search-wrap">
        <div className="search-inner">
          <div className="search-row">
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && research()}
              placeholder="Research any startup..."
              autoComplete="off"
              spellCheck={false}
            />
            <button className="search-btn" onClick={() => research()} disabled={loading}>
              <span className="search-btn-label">{loading ? "…" : "Research"}</span>
              <span className="search-btn-icon">{loading ? "…" : "→"}</span>
            </button>
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} serverStatus={serverStatus} />

      {/* ── Content ── */}
      <div className="shell content">
        {error && (
          <div className="error-bar">
            {error}
            <button style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"inherit" }}
              onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* FEED */}
        {tab === "feed" && (
          <FeedTab
            news={news}
            newsLoading={newsLoading}
            newsCacheInfo={newsCacheInfo}
            geminiKey={geminiKey}
            onResearch={research}
          />
        )}

        {/* DISCOVER */}
        {tab === "discover" && <DiscoverTab onResearch={research} />}

        {/* RESEARCH */}
        {tab === "research" && (
          loading
            ? <RadarLoader message={rlProgress.message} score={rlProgress.score} strategy={rlProgress.strategy} />
            : report
              ? <ResearchReport report={report} apiKey={geminiKey} />
              : (
                <div className="empty-wrap">
                  <div className="empty-title">No research loaded</div>
                  <div className="empty-desc">Search any startup above, or click a company from Discover or Feed.</div>
                </div>
              )
        )}

        {/* COMPETITORS */}
        {tab === "competitors" && (
          <div>
            {loading && <RadarLoader message={rlProgress.message} score={rlProgress.score} strategy={rlProgress.strategy} />}
            {!loading && (
              <>
                {report && (
                  <div className="feed-header">
                    <div className="feed-title">Competitors of {report.name}</div>
                    {loadingComps && <span style={{ fontSize:12, color:"var(--muted)", display:"flex", alignItems:"center", gap:4 }}><div className="rl-live-dot"/> Loading profiles...</span>}
                  </div>
                )}
                {competitors.length > 0 && (
                  <div className="competitor-grid">
                    {competitors.map((c, i) => (
                      <div className="competitor-card" key={i}>
                        <div className="comp-main">
                          <div className="comp-name">{c.name}</div>
                          <div className="comp-founded">{c.founded ? `Founded ${c.founded}` : ""}{c.headquarters ? ` · ${c.headquarters}` : ""}</div>
                          <div className="comp-desc">{c.whatTheyDo}</div>
                          {c.differentiation && <div className="comp-diff">{c.differentiation}</div>}
                          {c.founders?.length > 0 && <div className="comp-founders">Founders: {c.founders.map(f => f.name).join(", ")}</div>}
                        </div>
                        <div className="comp-side">
                          {c.totalFunding && <div className="comp-funding">Raised {c.totalFunding}</div>}
                          {c.keyStrengths?.length > 0 && (
                            <div>
                              <div className="comp-strengths-title">Strengths</div>
                              <div className="comp-strengths">{c.keyStrengths.map((s,j) => <div key={j} className="comp-strength-item">{s}</div>)}</div>
                            </div>
                          )}
                          {c.threatLevel && (
                            <div>
                              <span className={`comp-threat ${c.threatLevel === "High" ? "threat-high" : c.threatLevel === "Medium" ? "threat-med" : "threat-low"}`}>{c.threatLevel} threat</span>
                              {c.threatReason && <div className="comp-threat-reason" style={{ marginTop:5 }}>{c.threatReason}</div>}
                            </div>
                          )}
                          <button className="btn-research" style={{ marginTop:4 }} onClick={() => research(c.name)}>Deep research →</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!report && (
                  <div className="empty-wrap">
                    <div className="empty-title">Research a startup first</div>
                    <div className="empty-desc">Competitor profiles load automatically after you research a company.</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* SALARIES */}
        {tab === "salaries" && <SalariesTab />}

      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        <button className={`mbn-tab ${tab === "feed" ? "active" : ""}`} onClick={() => { setTab("feed"); router.push("/feed"); }} aria-label="Feed">
          <svg className="mbn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h10"/></svg>
          <span className="mbn-label">Feed</span>
        </button>
        <button className={`mbn-tab ${tab === "discover" ? "active" : ""}`} onClick={() => { setTab("discover"); router.push("/discover"); }} aria-label="Discover">
          <svg className="mbn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span className="mbn-label">Discover</span>
        </button>
        <button className={`mbn-tab ${tab === "salaries" ? "active" : ""}`} onClick={() => { setTab("salaries"); router.push("/salaries"); }} aria-label="Salaries">
          <svg className="mbn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span className="mbn-label">Salaries</span>
        </button>
      </nav>
    </>
  );
}
