"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import ResearchReport from "./components/ResearchReport";
import { exaStartupResearch, exaDailyStartupNews } from "@/lib/exa";
import { analyseCompetitor, analyseNewsItems } from "@/lib/analyzer";
import { SearchEngine, getMemoryStats } from "@/lib/searchEngine";

/* ── Fallback static list shown before DB loads ── */
const STATIC_STARTUPS = [
  { name: "Airbnb", batch: "W09", sectors: ["Travel"], tagline: "Marketplace for short-term home rentals.", slug: "airbnb" },
  { name: "Stripe", batch: "S09", sectors: ["FinTech"], tagline: "Payment infrastructure for the internet.", slug: "stripe" },
  { name: "Dropbox", batch: "S07", sectors: ["SaaS"], tagline: "Cloud file storage and collaboration.", slug: "dropbox" },
  { name: "DoorDash", batch: "S13", sectors: ["Logistics"], tagline: "On-demand food delivery.", slug: "doordash" },
  { name: "Coinbase", batch: "S12", sectors: ["Crypto"], tagline: "Cryptocurrency exchange.", slug: "coinbase" },
  { name: "Brex", batch: "W17", sectors: ["FinTech"], tagline: "Corporate cards and financial software.", slug: "brex" },
  { name: "Scale AI", batch: "S16", sectors: ["AI/ML"], tagline: "Data labeling and AI infrastructure.", slug: "scale-ai" },
  { name: "Gusto", batch: "W12", sectors: ["HR Tech"], tagline: "Payroll and HR for small businesses.", slug: "gusto" },
];

function StatusDot({ active }) {
  return <span className={`status-dot ${active ? "on" : "off"}`} />;
}

function SettingsModal({ open, onClose, keys, setKeys, serverStatus }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">API Keys & Settings</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div>
            <div className="settings-label">Server Status</div>
            <div className="status-row"><StatusDot active={serverStatus.hasExaKey} /><span>Exa API Key</span><span className="status-tag">{serverStatus.hasExaKey ? "configured" : "not set"}</span></div>
            <div className="status-row"><StatusDot active={serverStatus.hasGeminiKey} /><span>Gemini API Key</span><span className="status-tag">{serverStatus.hasGeminiKey ? "configured" : "not set"}</span></div>
            <div className="status-row"><StatusDot active={serverStatus.hasSupabase} /><span>Supabase</span><span className="status-tag">{serverStatus.hasSupabase ? "connected" : "not set"}</span></div>
          </div>
          <div>
            <div className="settings-label">Override Keys (stored locally)</div>
            <div className="input-group">
              <label className="settings-label" style={{ textTransform: "none", fontSize: 12 }}>Exa API Key</label>
              <input className="settings-input" type="password" value={keys.exa} onChange={e => setKeys(p => ({ ...p, exa: e.target.value }))} placeholder="exa-xxxx" />
              <div className="input-help">Free at <a href="https://dashboard.exa.ai" target="_blank" rel="noopener noreferrer">dashboard.exa.ai</a></div>
            </div>
            <div className="input-group" style={{ marginTop: 10 }}>
              <label className="settings-label" style={{ textTransform: "none", fontSize: 12 }}>Gemini API Key</label>
              <input className="settings-input" type="password" value={keys.gemini} onChange={e => setKeys(p => ({ ...p, gemini: e.target.value }))} placeholder="AIzaSy..." />
              <div className="input-help">Free at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com</a></div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-sm" onClick={() => { setKeys({ exa: "", gemini: "" }); try { localStorage.removeItem("user_exa_key"); localStorage.removeItem("user_gemini_key"); } catch {} }}>Clear</button>
          <button className="btn btn-sm btn-primary" onClick={() => { try { localStorage.setItem("user_exa_key", keys.exa); localStorage.setItem("user_gemini_key", keys.gemini); } catch {} onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function RadarLoader({ message, score, strategy }) {
  return (
    <div className="loading-wrap">
      <div className="radar-container">
        <div className="radar-scan" />
        <div className="radar-core" />
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-ring" />
      </div>
      <div className="data-nodes">
        {[0,1,2,3,4].map(i => <div key={i} className="data-node" />)}
      </div>
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
      <div className="loading-steps" style={{ marginTop: 12 }}>
        Adaptive engine — stops at 75% confidence
      </div>
    </div>
  );
}

function StartupCard({ s, onResearch }) {
  const sector = s.sectors?.[0] || "";
  return (
    <div className="discover-card" onClick={() => onResearch(s.name)}>
      <div className="discover-card-top">
        <div className="startup-logo">{(s.name || "?")[0].toUpperCase()}</div>
        <div>
          <div className="startup-name">{s.name}</div>
          <div className="startup-batch">{s.batch}{sector ? ` · ${sector}` : ""}</div>
        </div>
      </div>
      <div className="startup-desc">{s.tagline || s.description}</div>
      <div className="startup-tags">
        {(s.sectors || []).slice(0, 3).map((t, i) => (
          <span key={i} className="startup-tag">{t}</span>
        ))}
        {s.status && s.status !== "Active" && (
          <span className="startup-tag" style={{ color: s.status === "Acquired" ? "var(--red)" : "var(--green)" }}>{s.status}</span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState("feed");
  const [query, setQuery] = useState("");

  // Research state
  const [loading, setLoading] = useState(false);
  const [rlProgress, setRlProgress] = useState({ message: "", score: 0, strategy: null });
  const [report, setReport] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [error, setError] = useState("");

  // Feed state
  const [news, setNews] = useState([]);
  const [newsFilter, setNewsFilter] = useState("All");
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsCacheInfo, setNewsCacheInfo] = useState(null);

  // Discover state — DB-driven
  const [companies, setCompanies] = useState(STATIC_STARTUPS);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverTotal, setDiscoverTotal] = useState(0);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [sectorFilter, setSectorFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [allSectors, setAllSectors] = useState([]);
  const discoverSearchRef = useRef(null);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userKeys, setUserKeys] = useState({ exa: "", gemini: "" });
  const [serverStatus, setServerStatus] = useState({ hasExaKey: false, hasGeminiKey: false, hasSupabase: false, exaKey: null, geminiKey: null });

  const exaKey    = userKeys.exa    || serverStatus.exaKey    || "";
  const geminiKey = userKeys.gemini || serverStatus.geminiKey || "";

  /* ── Init ── */
  useEffect(() => {
    try {
      setUserKeys({ exa: localStorage.getItem("user_exa_key") || "", gemini: localStorage.getItem("user_gemini_key") || "" });
    } catch {}
    fetch("/api/settings").then(r => r.json()).then(setServerStatus).catch(() => {});
    loadNews();
  }, []);

  /* ── Load DB companies when Discover tab opens ── */
  useEffect(() => {
    if (tab === "discover") loadCompanies(1, sectorFilter, batchFilter, discoverSearch);
  }, [tab]);

  /* ── News ── */
  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/news").then(r => r.json());
      if (res.news?.length) {
        setNews(res.news);
        setNewsCacheInfo(res);
        setNewsLoading(false);
        // If stale, refresh in background
        if (!res.fresh && exaKey) refreshNewsBackground();
        return;
      }
      if (exaKey) await fetchFreshNews();
    } catch (e) { console.warn("News error:", e.message); }
    setNewsLoading(false);
  };

  const fetchFreshNews = async () => {
    if (!exaKey) return;
    const raw = await exaDailyStartupNews(exaKey);
    if (!raw.length) return;
    if (geminiKey) {
      const parsed = await analyseNewsItems(geminiKey, raw);
      setNews(parsed);
      fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: parsed }) }).catch(() => {});
    }
  };

  const refreshNewsBackground = () => {
    fetchFreshNews().catch(() => {});
  };

  /* ── Load YC companies from DB ── */
  const loadCompanies = useCallback(async (page = 1, sector = "All", batch = "All", search = "") => {
    setDiscoverLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 60 });
      if (sector !== "All") params.set("sector", sector);
      if (batch  !== "All") params.set("batch",  batch);
      if (search.trim())    params.set("q",      search.trim());

      const res = await fetch(`/api/yc-companies?${params}`).then(r => r.json());
      if (res.companies?.length) {
        setCompanies(page === 1 ? res.companies : prev => [...prev, ...res.companies]);
        setDiscoverTotal(res.total || 0);
        // Extract unique sectors for filter
        if (page === 1) {
          const sectorSet = new Set();
          for (const c of res.companies) for (const s of (c.sectors || [])) sectorSet.add(s);
          setAllSectors(Array.from(sectorSet).sort());
        }
      } else if (page === 1) {
        // DB empty or error — keep static list
        setCompanies(STATIC_STARTUPS);
      }
    } catch (e) {
      console.warn("Discover load error:", e.message);
      setCompanies(STATIC_STARTUPS);
    }
    setDiscoverLoading(false);
  }, []);

  const handleDiscoverFilter = (sector, batch, search) => {
    setSectorFilter(sector);
    setBatchFilter(batch);
    setDiscoverSearch(search);
    setDiscoverPage(1);
    loadCompanies(1, sector, batch, search);
  };

  /* ── Research ── */
  const research = useCallback(async (startupName) => {
    const name = (startupName || query).trim();
    if (!name) return setError("Enter a startup name.");
    if (!exaKey) return setError("No Exa API key — add one in Settings.");
    if (!geminiKey) return setError("No Gemini key — add one in Settings.");

    setError(""); setLoading(true); setReport(null); setCompetitors([]);
    setRlProgress({ message: `Initialising research for "${name}"...`, score: 0, strategy: null });
    setQuery(name);
    setTab("research");

    try {
      const engine = new SearchEngine(exaKey, geminiKey, { maxRounds: 4, stopThreshold: 0.75 });
      const { report: result } = await engine.research(name, setRlProgress);
      if (!result) { setError("No data found. Try a more specific company name."); }
      else {
        setReport(result);
        if (result.competitorNames?.length) loadCompetitorProfiles(result.competitorNames, result.domain);
      }
    } catch (e) {
      setError(e.message || "Research failed.");
    }
    setLoading(false);
  }, [query, exaKey, geminiKey]);

  const loadCompetitorProfiles = async (names, domain) => {
    setLoadingComps(true);
    const results = [];
    for (const name of names.slice(0, 4)) {
      try {
        const pages = await exaStartupResearch(exaKey, name);
        if (pages.length && geminiKey) {
          const profile = await analyseCompetitor(geminiKey, name, pages);
          results.push(profile);
          setCompetitors([...results]); // stream results as they arrive
        }
      } catch {}
    }
    setLoadingComps(false);
  };

  const filteredNews = newsFilter === "All" ? news : news.filter(n =>
    n.stage?.toLowerCase().includes(newsFilter.toLowerCase())
  );

  /* ── Discover sectors/batches available for filter ── */
  const BATCH_OPTIONS = ["All","P26","W25","S24","W24","S23","W23","S22","W22"];

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <a className="header-logo" href="/">
            <span className="header-logo-box">M</span>
            Miru
          </a>
          <nav className="header-nav">
            {[["feed","Feed"],["discover","Discover"],["research","Research"],["competitors","Competitors"]].map(([id, label]) => (
              <button key={id} className={`nav-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
                {label}{id === "discover" && discoverTotal > 0 && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>({discoverTotal})</span>}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button className="settings-btn" onClick={() => setSettingsOpen(true)}>Settings</button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-wrap">
        <div className="search-inner">
          <div className="search-row">
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && research()}
              placeholder="Research any startup — Airbnb, Stripe, ReasonBlocks, GodHands..."
              autoComplete="off"
              spellCheck={false}
            />
            <button className="search-btn" onClick={() => research()} disabled={loading}>
              {loading ? "Researching..." : "Research"}
            </button>
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} keys={userKeys} setKeys={setUserKeys} serverStatus={serverStatus} />

      {/* Content */}
      <div className="shell content">
        {error && <div className="error-bar">{error} <button style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"inherit" }} onClick={() => setError("")}>×</button></div>}

        {/* ── FEED TAB ── */}
        {tab === "feed" && (
          <div>
            {/* Loading overlay only for news */}
            {newsLoading && (
              <div className="loading-wrap" style={{ padding: "32px 0" }}>
                <div className="spinner" style={{ marginBottom: 8 }} />
                <div className="loading-text">Loading today's startup news...</div>
              </div>
            )}

            {!newsLoading && (
              <>
                <div className="feed-header">
                  <div className="feed-title">
                    Startup Intelligence Feed
                    {newsCacheInfo && !newsCacheInfo.fresh && (
                      <span className="stale-badge" style={{ marginLeft: 8 }}>
                        ● {newsCacheInfo.ageHours}h old
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="feed-filters">
                      {["All","Seed","Series A","Acquired","IPO"].map(f => (
                        <button key={f} className={`filter-btn ${newsFilter === f ? "active" : ""}`} onClick={() => setNewsFilter(f)}>{f}</button>
                      ))}
                    </div>
                    {exaKey && <button className="btn btn-sm" onClick={fetchFreshNews} style={{ whiteSpace: "nowrap" }}>↻ Refresh</button>}
                  </div>
                </div>

                {filteredNews.length > 0 && (
                  <div className="news-list">
                    {filteredNews.map((item, i) => (
                      <div className="news-item" key={i}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span className="news-rank">{i + 1}.</span>
                          <div className="news-main">
                            <div className="news-headline" onClick={() => research(item.researchQuery || item.startup)}>{item.headline}</div>
                            <div className="news-meta">
                              {item.stage && <span className={`news-stage ${item.stage?.toLowerCase().includes("seed") ? "stage-seed" : item.stage?.toLowerCase().includes("series") ? "stage-series" : item.stage?.toLowerCase().includes("acquired") ? "stage-acquired" : "stage-ipo"}`}>{item.stage}</span>}
                              {item.amount && <span style={{ color: "var(--green)", fontWeight: 600 }}>{item.amount}</span>}
                              {item.source && <span>{item.source}</span>}
                              {item.date && <span>{item.date}</span>}
                            </div>
                            {item.summary && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{item.summary}</div>}
                          </div>
                        </div>
                        <button className="btn-research" onClick={() => research(item.researchQuery || item.startup)}>Research →</button>
                      </div>
                    ))}
                  </div>
                )}

                {!filteredNews.length && (
                  <div className="empty-wrap">
                    <div className="empty-title">No news loaded</div>
                    <div className="empty-desc">
                      {!exaKey
                        ? "Add an Exa API key in Settings to load today's startup news."
                        : <button className="btn btn-primary" onClick={loadNews}>Load Today's News</button>}
                    </div>
                  </div>
                )}

                {/* Featured from DB below news */}
                <div className="section-head" style={{ marginTop: 28 }}>
                  Featured YC Companies
                  <span className="section-badge">Database</span>
                </div>
                <div className="discover-grid">
                  {(companies.length > 0 ? companies : STATIC_STARTUPS).slice(0, 6).map((s, i) => (
                    <StartupCard key={i} s={s} onResearch={research} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── DISCOVER TAB ── */}
        {tab === "discover" && (
          <div>
            <div className="feed-header" style={{ flexWrap: "wrap", gap: 8 }}>
              <div>
                <div className="feed-title">YC Company Database</div>
                {discoverTotal > 0 && <div style={{ fontSize: 11, color: "var(--muted)" }}>{discoverTotal.toLocaleString()} companies</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {/* Search within discover */}
                <input
                  ref={discoverSearchRef}
                  style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font)", fontSize: 12, width: 160 }}
                  placeholder="Filter companies..."
                  defaultValue={discoverSearch}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleDiscoverFilter(sectorFilter, batchFilter, e.target.value);
                  }}
                />
                <select
                  style={{ padding: "4px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font)", fontSize: 12 }}
                  value={batchFilter}
                  onChange={e => handleDiscoverFilter(sectorFilter, e.target.value, discoverSearch)}
                >
                  {BATCH_OPTIONS.map(b => <option key={b}>{b}</option>)}
                </select>
                <select
                  style={{ padding: "4px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font)", fontSize: 12 }}
                  value={sectorFilter}
                  onChange={e => handleDiscoverFilter(e.target.value, batchFilter, discoverSearch)}
                >
                  {["All", ...allSectors.slice(0, 30)].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {discoverLoading && companies.length === 0 && (
              <div className="loading-wrap" style={{ padding: "24px 0" }}>
                <div className="spinner" style={{ marginBottom: 8 }} />
                <div className="loading-text">Loading from database...</div>
              </div>
            )}

            <div className="discover-grid">
              {companies.map((s, i) => <StartupCard key={s.slug || i} s={s} onResearch={research} />)}
            </div>

            {!discoverLoading && companies.length === 0 && (
              <div className="empty-wrap">
                <div className="empty-title">No companies found</div>
                <div className="empty-desc">Run <code>npm run seed:yc</code> to populate the database, then run the SQL migration first.</div>
              </div>
            )}

            {/* Load more */}
            {companies.length > 0 && companies.length < discoverTotal && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button className="btn" disabled={discoverLoading} onClick={() => {
                  const next = discoverPage + 1;
                  setDiscoverPage(next);
                  loadCompanies(next, sectorFilter, batchFilter, discoverSearch);
                }}>
                  {discoverLoading ? "Loading..." : `Load more (${discoverTotal - companies.length} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── RESEARCH TAB ── */}
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

        {/* ── COMPETITORS TAB ── */}
        {tab === "competitors" && (
          <div>
            {loading && <RadarLoader message={rlProgress.message} score={rlProgress.score} strategy={rlProgress.strategy} />}
            {!loading && (
              <>
                {report && (
                  <div className="feed-header">
                    <div className="feed-title">Competitors of {report.name}</div>
                    {loadingComps && <span style={{ fontSize: 12, color: "var(--muted)", display:"flex",alignItems:"center",gap:4 }}><div className="rl-live-dot"/> Loading profiles...</span>}
                  </div>
                )}
                {competitors.length > 0 && (
                  <div className="competitor-grid">
                    {competitors.map((c, i) => (
                      <div className="competitor-card" key={i}>
                        <div className="comp-name">{c.name}</div>
                        <div className="comp-founded">{c.founded ? `Founded ${c.founded}` : ""}{c.headquarters ? ` · ${c.headquarters}` : ""}</div>
                        <div className="comp-desc">{c.whatTheyDo}</div>
                        {c.totalFunding && <div className="comp-funding">Raised {c.totalFunding}</div>}
                        {c.differentiation && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{c.differentiation}</div>}
                        {c.keyStrengths?.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div className="signal-title">Strengths</div>
                            <div className="startup-tags" style={{ marginTop: 4 }}>
                              {c.keyStrengths.map((s, j) => <span key={j} className="startup-tag">{s}</span>)}
                            </div>
                          </div>
                        )}
                        {c.founders?.length > 0 && <div className="comp-founders">Founders: {c.founders.map(f => f.name).join(", ")}</div>}
                        {c.threatLevel && (
                          <div style={{ marginTop: 6 }}>
                            <span className={`comp-threat ${c.threatLevel === "High" ? "threat-high" : c.threatLevel === "Medium" ? "threat-med" : "threat-low"}`}>
                              {c.threatLevel} threat
                            </span>
                          </div>
                        )}
                        {c.threatReason && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{c.threatReason}</div>}
                        <button className="btn-research" style={{ marginTop: 10 }} onClick={() => research(c.name)}>Deep research →</button>
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
                {report && !loadingComps && competitors.length === 0 && (
                  <div className="empty-wrap">
                    <div className="empty-title">No competitors loaded</div>
                    <div className="empty-desc">The analysis didn't identify direct competitors. Try researching a different company.</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
