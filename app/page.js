"use client";
import { useState, useEffect, useCallback } from "react";
import ResearchReport from "./components/ResearchReport";
import {
  exaFindCompetitors, exaDailyStartupNews
} from "@/lib/exa";
import { analyseCompetitor, analyseNewsItems } from "@/lib/analyzer";
import { SearchEngine, scoreState, getMemoryStats, clearMemory } from "@/lib/searchEngine";

const DISCOVER_STARTUPS = [
  { name: "Airbnb", batch: "W09", sector: "Travel", description: "Marketplace for short-term home rentals. Disrupted the hotel industry.", domain: "airbnb.com" },
  { name: "Stripe", batch: "S09", sector: "FinTech", description: "Payment infrastructure for the internet. Powers millions of businesses.", domain: "stripe.com" },
  { name: "Dropbox", batch: "S07", sector: "SaaS", description: "Cloud file storage and collaboration. One of YC's biggest exits.", domain: "dropbox.com" },
  { name: "DoorDash", batch: "S13", sector: "Logistics", description: "On-demand food delivery. Now a publicly traded company.", domain: "doordash.com" },
  { name: "Coinbase", batch: "S12", sector: "Crypto", description: "Cryptocurrency exchange. First major crypto company to go public.", domain: "coinbase.com" },
  { name: "Instacart", batch: "S12", sector: "Grocery", description: "Same-day grocery delivery from local stores.", domain: "instacart.com" },
  { name: "Brex", batch: "W17", sector: "FinTech", description: "Corporate credit cards and financial software for startups.", domain: "brex.com" },
  { name: "Gusto", batch: "W12", sector: "HR Tech", description: "Payroll, benefits, and HR platform for small businesses.", domain: "gusto.com" },
  { name: "Notion", batch: "N/A", sector: "SaaS", description: "All-in-one workspace for notes, docs, and project management.", domain: "notion.so" },
  { name: "Figma", batch: "N/A", sector: "Design", description: "Collaborative interface design tool. Acquired by Adobe for $20B.", domain: "figma.com" },
  { name: "Rippling", batch: "N/A", sector: "HR Tech", description: "Workforce management platform connecting HR, IT, and Finance.", domain: "rippling.com" },
  { name: "Scale AI", batch: "S16", sector: "AI/ML", description: "Data labeling and AI infrastructure for ML teams.", domain: "scale.com" },
];

// RL progress state replaces static steps

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

export default function Home() {
  const [tab, setTab] = useState("feed");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [rlProgress, setRlProgress] = useState({ message: "", score: 0, strategy: null });
  const [report, setReport] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [news, setNews] = useState([]);
  const [newsFilter, setNewsFilter] = useState("All");
  const [newsLoading, setNewsLoading] = useState(false);
  const [discoverList, setDiscoverList] = useState(DISCOVER_STARTUPS);
  const [discoverSector, setDiscoverSector] = useState("All");
  const [error, setError] = useState("");
  const [memoryStats, setMemoryStats] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userKeys, setUserKeys] = useState({ exa: "", gemini: "" });
  const [serverStatus, setServerStatus] = useState({ hasExaKey: false, hasGeminiKey: false, hasSupabase: false, exaKey: null, geminiKey: null });

  const exaKey = userKeys.exa || serverStatus.exaKey || "";
  const geminiKey = userKeys.gemini || serverStatus.geminiKey || "";

  useEffect(() => {
    try {
      setUserKeys({ exa: localStorage.getItem("user_exa_key") || "", gemini: localStorage.getItem("user_gemini_key") || "" });
    } catch {}
    fetch("/api/settings").then(r => r.json()).then(setServerStatus).catch(() => {});
    setMemoryStats(getMemoryStats());
  }, []);

  // Load news on mount
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const cached = await fetch("/api/news").then(r => r.json());
      if (cached.news) { setNews(cached.news); setNewsLoading(false); return; }
      if (!exaKey) { setNewsLoading(false); return; }
      const raw = await exaDailyStartupNews(exaKey);
      if (geminiKey && raw.length) {
        const parsed = await analyseNewsItems(geminiKey, raw);
        setNews(parsed);
        fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: parsed }) }).catch(() => {});
      }
    } catch (e) { console.warn("News load failed:", e.message); }
    setNewsLoading(false);
  };

  const research = useCallback(async (startupName) => {
    const name = startupName || query.trim();
    if (!name) return setError("Enter a startup name or domain.");
    if (!exaKey) return setError("No Exa API key. Add one in Settings.");
    if (!geminiKey) return setError("No Gemini key. Add one in Settings.");
    setError(""); setLoading(true); setReport(null); setCompetitors([]);
    setRlProgress({ message: "Initialising adaptive research engine...", score: 0, strategy: null });
    setQuery(name); setTab("research");

    try {
      const engine = new SearchEngine(exaKey, geminiKey, { maxRounds: 4, stopThreshold: 0.75 });
      const { report: result, score, log } = await engine.research(name, (progress) => {
        setRlProgress(progress);
      });

      if (!result) { setError("Research returned no data. Try a more specific name."); setLoading(false); return; }
      setReport(result);
      setMemoryStats(getMemoryStats()); // Refresh memory stats after learning

      // Load competitors in background after report is shown
      if (result.competitorNames?.length) {
        loadCompetitors(result.competitorNames, result.domain);
      }
    } catch (e) {
      setError(e.message || "Research failed.");
    }
    setLoading(false);
  }, [query, exaKey, geminiKey]);

  const loadCompetitors = async (names, domain) => {
    setLoadingComps(true);
    const results = [];
    for (const name of names.slice(0, 4)) {
      try {
        const pages = await exaStartupResearch(exaKey, name);
        if (pages.length && geminiKey) {
          const profile = await analyseCompetitor(geminiKey, name, pages);
          results.push(profile);
        }
      } catch {}
    }
    setCompetitors(results);
    setLoadingComps(false);
  };

  const sectors = ["All", ...new Set(DISCOVER_STARTUPS.map(s => s.sector))];
  const filteredDiscover = discoverSector === "All" ? discoverList : discoverList.filter(s => s.sector === discoverSector);
  const filteredNews = newsFilter === "All" ? news : news.filter(n => n.stage?.toLowerCase().includes(newsFilter.toLowerCase()));

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
              <button key={id} className={`nav-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
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
              placeholder="Research any startup — Airbnb, Stripe, Brex, or any company name..."
              autoComplete="off"
              spellCheck={false}
            />
            <button className="search-btn" onClick={() => research()} disabled={loading}>
              {loading ? "Researching..." : "Research"}
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} keys={userKeys} setKeys={setUserKeys} serverStatus={serverStatus} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} keys={userKeys} setKeys={setUserKeys} serverStatus={serverStatus} memoryStats={memoryStats} />

      {/* Content */}
      <div className="shell content">
        {error && <div className="error-bar">{error}</div>}

        {loading && (
            <div className="loading-wrap">
              {/* Radar animation */}
              <div className="radar-container">
                <div className="radar-scan" />
                <div className="radar-core" />
                <div className="radar-ring" />
                <div className="radar-ring" />
                <div className="radar-ring" />
                <div className="radar-ring" />
              </div>

              {/* Data nodes */}
              <div className="data-nodes">
                {[0,1,2,3,4].map(i => <div key={i} className="data-node" />)}
              </div>

              <div className="loading-text">{rlProgress.message || "Initialising Miru..."}</div>

              {/* RL Knowledge score bar */}
              {rlProgress.score > 0 && (
                <div className="rl-progress-wrap">
                  <div className="rl-progress-header">
                    <span>Knowledge score</span>
                    <span className="rl-progress-score">{Math.round(rlProgress.score * 100)}%</span>
                  </div>
                  <div className="rl-bar-track">
                    <div
                      className="rl-bar-fill"
                      style={{ width: `${Math.round(rlProgress.score * 100)}%` }}
                    />
                  </div>
                  {rlProgress.strategy && (
                    <div className="rl-strategy-tag">
                      <div className="rl-live-dot" />
                      Strategy: {rlProgress.strategy}
                    </div>
                  )}
                </div>
              )}

              <div className="loading-steps" style={{ marginTop: 12 }}>
                Adaptive engine — stops at 75% confidence
              </div>
            </div>
          )}

        {/* ── FEED TAB ── */}
        {tab === "feed" && !loading && (
          <div>
            <div className="feed-header">
              <div className="feed-title">Startup Intelligence Feed</div>
              <div className="feed-filters">
                {["All","Seed","Series A","Acquired","IPO"].map(f => (
                  <button key={f} className={`filter-btn ${newsFilter === f ? "active" : ""}`} onClick={() => setNewsFilter(f)}>{f}</button>
                ))}
              </div>
            </div>

            {newsLoading && <div className="loading-wrap" style={{ padding: "20px" }}><div className="spinner" /><div className="loading-text">Loading today's news...</div></div>}

            {!newsLoading && filteredNews.length > 0 && (
              <div className="news-list">
                {filteredNews.map((item, i) => (
                  <div className="news-item" key={i}>
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
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
                    </div>
                    <button className="btn-research" onClick={() => research(item.researchQuery || item.startup)}>Research →</button>
                  </div>
                ))}
              </div>
            )}

            {!newsLoading && !filteredNews.length && (
              <div className="empty-wrap">
                <div className="empty-title">No news loaded</div>
                <div className="empty-desc">
                  {!exaKey ? "Add an Exa API key in Settings to load today's startup news." : <button className="btn btn-primary" onClick={loadNews}>Load Today's News</button>}
                </div>
              </div>
            )}

            {/* Quick discover below news */}
            <div className="section-head" style={{ marginTop: 28 }}>
              Featured YC Companies <span className="section-badge">Quick Research</span>
            </div>
            <div className="discover-grid">
              {DISCOVER_STARTUPS.slice(0, 6).map((s, i) => (
                <div className="discover-card" key={i} onClick={() => research(s.name)}>
                  <div className="discover-card-top">
                    <div className="startup-logo">{s.name[0]}</div>
                    <div>
                      <div className="startup-name">{s.name}</div>
                      <div className="startup-batch">{s.batch} · {s.sector}</div>
                    </div>
                  </div>
                  <div className="startup-desc">{s.description}</div>
                  <div className="startup-tags"><span className="startup-tag">{s.sector}</span><span className="startup-tag">{s.batch}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCOVER TAB ── */}
        {tab === "discover" && !loading && (
          <div>
            <div className="feed-header">
              <div className="feed-title">YC & Top Incubator Companies</div>
              <div className="feed-filters">
                {sectors.map(s => (
                  <button key={s} className={`filter-btn ${discoverSector === s ? "active" : ""}`} onClick={() => setDiscoverSector(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="discover-grid">
              {filteredDiscover.map((s, i) => (
                <div className="discover-card" key={i} onClick={() => research(s.name)}>
                  <div className="discover-card-top">
                    <div className="startup-logo">{s.name[0]}</div>
                    <div>
                      <div className="startup-name">{s.name}</div>
                      <div className="startup-batch">{s.batch} · {s.sector}</div>
                    </div>
                  </div>
                  <div className="startup-desc">{s.description}</div>
                  <div className="startup-tags"><span className="startup-tag">{s.sector}</span><span className="startup-tag">{s.batch}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESEARCH TAB ── */}
        {tab === "research" && !loading && (
          report
            ? <ResearchReport report={report} apiKey={geminiKey} />
            : (
              <div className="empty-wrap">
                <div className="empty-title">No research loaded</div>
                <div className="empty-desc">Search any startup above, or pick one from Discover.</div>
              </div>
            )
        )}

        {/* ── COMPETITORS TAB ── */}
        {tab === "competitors" && !loading && (
          <div>
            {report && (
              <div className="feed-header">
                <div className="feed-title">Competitors of {report.name}</div>
                {loadingComps && <span style={{ fontSize: 12, color: "var(--muted)" }}>Loading profiles...</span>}
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
                    {c.founders?.length > 0 && (
                      <div className="comp-founders">
                        Founders: {c.founders.map(f => f.name).join(", ")}
                      </div>
                    )}
                    {c.threatLevel && (
                      <div>
                        <span className={`comp-threat ${c.threatLevel === "High" ? "threat-high" : c.threatLevel === "Medium" ? "threat-med" : "threat-low"}`}>
                          {c.threatLevel} threat
                        </span>
                      </div>
                    )}
                    {c.threatReason && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{c.threatReason}</div>}
                    <button className="btn-research" style={{ marginTop: 10 }} onClick={() => research(c.name)}>
                      Deep research →
                    </button>
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
                <div className="empty-title">No competitors loaded yet</div>
                <div className="empty-desc">Competitor profiles are loading in the background. Check back in a moment.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
