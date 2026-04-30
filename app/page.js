"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import ResearchReport from "./components/ResearchReport";
import { exaStartupResearch, exaDailyStartupNews } from "@/lib/exa";
import { analyseCompetitor, analyseNewsItems } from "@/lib/analyzer";
import { SearchEngine, getMemoryStats } from "@/lib/searchEngine";

/* ── Fallback static list ── */
const STATIC_STARTUPS = [
  { name: "Airbnb",    batch: "W09", sectors: ["Travel"],    tagline: "Marketplace for short-term home rentals.",       slug: "airbnb",   website: "airbnb.com" },
  { name: "Stripe",   batch: "S09", sectors: ["FinTech"],   tagline: "Payment infrastructure for the internet.",        slug: "stripe",   website: "stripe.com" },
  { name: "Dropbox",  batch: "S07", sectors: ["SaaS"],      tagline: "Cloud file storage and collaboration.",           slug: "dropbox",  website: "dropbox.com" },
  { name: "DoorDash", batch: "S13", sectors: ["Logistics"], tagline: "On-demand food delivery platform.",               slug: "doordash", website: "doordash.com" },
  { name: "Coinbase", batch: "S12", sectors: ["Crypto"],    tagline: "Cryptocurrency exchange. First major crypto IPO.", slug: "coinbase", website: "coinbase.com" },
  { name: "Brex",     batch: "W17", sectors: ["FinTech"],   tagline: "Corporate cards and financial software.",         slug: "brex",     website: "brex.com" },
  { name: "Scale AI", batch: "S16", sectors: ["AI/ML"],     tagline: "Data labeling and AI infrastructure for ML.",    slug: "scale-ai", website: "scale.com" },
  { name: "Gusto",    batch: "W12", sectors: ["HR Tech"],   tagline: "Payroll and HR for small businesses.",            slug: "gusto",    website: "gusto.com" },
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

const NEWS_FACTS = [
  "Scanning TechCrunch, Bloomberg, Reuters and 10 more sources",
  "Fetching the last 30 days of startup activity",
  "2,000+ YC companies are in your local database",
  "Results sorted newest → oldest by publish date",
  "Weekly cache — news refreshes automatically every 7 days",
  "YC has funded 5,690+ companies since 2005",
  "AI + Fintech account for 50%+ of recent YC batches",
  "Once loaded, news is cached in Supabase — instant next time",
  "Click any headline to trigger deep research on that startup",
];

function NewsLoader() {
  const [factIdx, setFactIdx] = useState(0);
  // Only show full animation on first-ever load
  const [firstTime] = useState(() => {
    try { return !localStorage.getItem("miru_news_seen"); }
    catch { return true; }
  });

  useEffect(() => {
    if (!firstTime) return;
    const t = setInterval(() => setFactIdx(i => (i + 1) % NEWS_FACTS.length), 2500);
    return () => clearInterval(t);
  }, [firstTime]);

  // Returning users — just show a tiny inline loading bar
  if (!firstTime) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center" }}>
        <div className="spinner" style={{ display: "inline-block", marginBottom: 8 }} />
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Refreshing news…</div>
      </div>
    );
  }

  return (
    <div className="news-loader-wrap">
      {/* Animated Miru favicon — pulsing eye SVG */}
      <div className="news-loader-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="miru-eye-svg">
          {/* Outer scanning ring */}
          <circle cx="24" cy="24" r="22" stroke="var(--orange)" strokeWidth="1.5" strokeDasharray="4 4" className="eye-ring-spin" />
          {/* Eye whites */}
          <ellipse cx="24" cy="24" rx="16" ry="11" fill="#fff" stroke="var(--border)" strokeWidth="1" />
          {/* Iris */}
          <circle cx="24" cy="24" r="7" fill="var(--orange)" className="eye-iris-pulse" />
          {/* Pupil */}
          <circle cx="24" cy="24" r="3.5" fill="#fff" />
          {/* Scan line */}
          <line x1="8" y1="24" x2="40" y2="24" stroke="var(--orange)" strokeWidth="0.8" strokeOpacity="0.3" className="eye-scan-line" />
        </svg>
      </div>

      <div className="news-loader-status">Fetching startup news…</div>

      {/* Rotating facts */}
      <div className="news-loader-fact" key={factIdx}>
        {NEWS_FACTS[factIdx]}
      </div>

      {/* Source dots */}
      <div className="news-loader-sources">
        {["TC", "BBG", "REU", "AXS", "FT", "VB"].map((s, i) => (
          <span key={s} className="news-source-dot" style={{ animationDelay: `${i * 0.2}s` }}>{s}</span>
        ))}
      </div>
    </div>
  );
}



function CompanyLogo({ name, logoUrl, website }) {
  // Derive a real domain only when we actually have a website
  const domain = website
    ? website.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0]
    : null;

  // Decide starting src: logoUrl → icon.horse (only with a real domain) → null (go straight to initial)
  const initialSrc = logoUrl
    ? logoUrl
    : domain
      ? `https://icon.horse/icon/${domain}`
      : null;

  const [src, setSrc]       = useState(initialSrc);
  const [failed, setFailed] = useState(!initialSrc); // no src → show initial immediately

  // Colored avatar for the initial fallback
  const COLORS = ["#e8522a","#2a7ae8","#2ae87a","#e8a02a","#7a2ae8","#e82a7a","#0ea5e9","#f59e0b"];
  const avatarBg = (() => {
    let h = 0;
    for (const c of (name || "")) h = c.charCodeAt(0) + ((h << 5) - h);
    return COLORS[Math.abs(h) % COLORS.length];
  })();

  const handleError = () => {
    if (src?.includes("icon.horse") && domain) {
      // icon.horse failed → try Google favicon
      setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className="startup-logo-letter" style={{ background: avatarBg }}>
        {(name || "?")[0].toUpperCase()}
      </div>
    );
  }
  return (
    <img
      className="startup-logo-img"
      src={src}
      alt={`${name} logo`}
      onError={handleError}
      loading="lazy"
    />
  );
}

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Company type badge + hint
const TYPE_META = {
  product: { label: "Product", hint: "DSA-heavy · High salary · Stock options" },
  service: { label: "Service", hint: "Project-based · Moderate DSA · Variable pay" },
  hybrid:  { label: "Hybrid",  hint: "Mix of product and services" },
};

function StartupCard({ s, onResearch }) {
  const sector = s.sectors?.[0] || "";
  const slug = s.slug || toSlug(s.name || "");
  const typeMeta = TYPE_META[s.company_type] || null;

  return (
    <div
      className="discover-card"
      onClick={() => { window.location.href = `/startup/${slug}`; }}
      style={{ cursor: "pointer" }}
    >
      <div className="discover-card-top">
        <CompanyLogo name={s.name} logoUrl={s.logo_url} website={s.website} />
        <div style={{ minWidth: 0 }}>
          <div className="startup-name">{s.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
            {s.batch && <span className="startup-batch">{s.batch}{sector ? ` · ${sector}` : ""}</span>}
            {typeMeta && (
              <span className={`ctype-badge ctype-${s.company_type}`}>{typeMeta.label}</span>
            )}
          </div>
          {typeMeta && (
            <span className="ctype-hint">{typeMeta.hint}</span>
          )}
        </div>
      </div>
      <div className="startup-desc">{s.tagline || s.description}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div className="startup-tags" style={{ margin: 0 }}>
          {(s.sectors || []).slice(0, 2).map((t, i) => (
            <span key={i} className="startup-tag">{t}</span>
          ))}
          {s.status && s.status !== "Active" && (
            <span className="startup-tag" style={{ color: s.status === "Acquired" ? "var(--red)" : "var(--green)" }}>{s.status}</span>
          )}
        </div>
        <button
          className="btn-research"
          onClick={(e) => { e.stopPropagation(); onResearch(s.name); }}
          style={{ flexShrink: 0 }}
        >
          Research →
        </button>
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
  const [discoverTab, setDiscoverTab] = useState("yc"); // yc | unicorn | fortune500 | tech | all
  const [typeFilter, setTypeFilter] = useState("all");   // all | product | service
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
    let localExa = "";
    let localGemini = "";
    try {
      localExa    = localStorage.getItem("user_exa_key")    || "";
      localGemini = localStorage.getItem("user_gemini_key") || "";
      setUserKeys({ exa: localExa, gemini: localGemini });
    } catch {}

    fetch("/api/settings")
      .then(r => r.json())
      .then(status => {
        setServerStatus(status);
        const exa    = localExa    || status.exaKey    || "";
        const gemini = localGemini || status.geminiKey || "";
        loadNews(exa, gemini);
      })
      .catch(() => {
        if (localExa) loadNews(localExa, localGemini);
      });
  }, []);

  /* ── Load DB companies when Discover tab opens ── */
  useEffect(() => {
    if (tab === "discover") loadCompanies(1, sectorFilter, batchFilter, discoverSearch, discoverTab);
  }, [tab]);

  // Reload when discoverTab changes
  useEffect(() => {
    if (tab === "discover") {
      setDiscoverPage(1);
      setCompanies([]);
      loadCompanies(1, sectorFilter, batchFilter, discoverSearch, discoverTab);
    }
  }, [discoverTab]);

  /* ── News ── */
  const loadNews = async (ek = exaKey, gk = geminiKey) => {
    setNewsLoading(true);
    try {
      // 1. Check Supabase cache first
      const res = await fetch("/api/news").then(r => r.json());
      if (res.news?.length) {
        setNews(sortNewsByDate(res.news));
        setNewsCacheInfo(res);
        setNewsLoading(false);
        // Mark as seen so animation won't show again this session
        try { localStorage.setItem("miru_news_seen", "1"); } catch {}
        // Silently refresh in background if stale
        if (!res.fresh && ek) fetchFreshNews(ek, gk, true).catch(() => {});
        return;
      }
      // 2. No cache — fetch fresh Exa results
      if (ek) await fetchFreshNews(ek, gk, false);
      else console.warn("[News] No Exa key — add one in Settings.");
    } catch (e) { console.warn("News load error:", e.message); }
    setNewsLoading(false);
  };

  // silent=true → background refresh, don't set loading state
  const fetchFreshNews = async (ek = exaKey, gk = geminiKey, silent = false) => {
    if (!ek) return;
    if (!silent) setNewsLoading(true);
    try {
      const raw = await exaDailyStartupNews(ek);
      if (!raw.length) { if (!silent) setNewsLoading(false); return; }

      // ── Step 1: Show raw Exa results IMMEDIATELY (no Gemini needed) ──
      const rawItems = raw.map(r => ({
        id:        r.id || r.url,
        headline:  r.title,             // UI reads .headline || .title
        title:     r.title,
        url:       r.url,
        source:    (() => { try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return "unknown"; } })(),
        summary:   r.highlights?.[0] || r.summary || r.text?.slice(0, 200) || "",
        stage:     null,
        amount:    null,
        date:      r.publishedDate || new Date().toISOString(),
        publishedDate: r.publishedDate,
        researchQuery: r.title?.split(" ").slice(0, 3).join(" "),
      }));

      const rawSorted = sortNewsByDate(rawItems);
      if (!silent) {
        setNews(rawSorted);      // ← Show immediately while Gemini enriches
        setNewsLoading(false);
        try { localStorage.setItem("miru_news_seen", "1"); } catch {}
      }

      // ── Step 2: Enrich with Gemini in background (if key available) ──
      if (gk) {
        const enriched = await analyseNewsItems(gk, raw);
        if (enriched?.length) {
          const enrichedSorted = sortNewsByDate(enriched);
          setNews(enrichedSorted);   // upgrade displayed news silently
          // Save enriched version to cache
          fetch("/api/news", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: enrichedSorted }),
          }).catch(() => {});
          return;
        }
      }

      // No Gemini / enrichment failed — save raw version to cache
      fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: rawSorted }),
      }).catch(() => {});

    } catch (e) { console.warn("fetchFreshNews error:", e.message); }
    if (!silent) setNewsLoading(false);
  };

  // Sort news newest-first, then group by week for display
  const sortNewsByDate = (items) =>
    [...items].sort((a, b) => {
      const da = a.date || a.publishedDate || "";
      const db = b.date || b.publishedDate || "";
      return new Date(db) - new Date(da);
    });

  const refreshNewsBackground = () => { fetchFreshNews().catch(() => {}); };

  /* ── Load companies from unified DB ── */
  const loadCompanies = useCallback(async (page = 1, sector = "All", batch = "All", search = "", dtab = "yc", dtype = "all") => {
    setDiscoverLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 60, tab: dtab });
      if (sector !== "All") params.set("sector", sector);
      if (batch  !== "All" && dtab === "yc") params.set("batch", batch);
      if (search.trim()) params.set("q", search.trim());
      if (dtype !== "all") params.set("type", dtype);

      const res = await fetch(`/api/yc-companies?${params}`).then(r => r.json());
      if (res.companies?.length) {
        setCompanies(page === 1 ? res.companies : prev => [...prev, ...res.companies]);
        setDiscoverTotal(res.total || 0);
        if (page === 1) {
          const sectorSet = new Set();
          for (const c of res.companies)
            for (const s of (c.sector || c.sectors || [])) sectorSet.add(s);
          setAllSectors(Array.from(sectorSet).filter(Boolean).sort());
        }
      } else if (page === 1) {
        setCompanies(STATIC_STARTUPS);
      }
    } catch (e) {
      console.warn("Discover load error:", e.message);
      setCompanies(STATIC_STARTUPS);
    }
    setDiscoverLoading(false);
  }, []);

  const handleDiscoverFilter = (sector, batch, search, dtype = typeFilter) => {
    setSectorFilter(sector);
    setBatchFilter(batch);
    setDiscoverSearch(search);
    setDiscoverPage(1);
    loadCompanies(1, sector, batch, search, discoverTab, dtype);
  };

  const handleTypeFilter = (dtype) => {
    setTypeFilter(dtype);
    setDiscoverPage(1);
    setCompanies([]);
    loadCompanies(1, sectorFilter, batchFilter, discoverSearch, discoverTab, dtype);
  };

  /* ── Research (with 7-day cache) ── */
  const research = useCallback(async (startupName) => {
    const name = (startupName || query).trim();
    if (!name) return setError("Enter a startup name.");
    if (!exaKey) return setError("No Exa API key — add one in Settings.");
    if (!geminiKey) return setError("No Gemini key — add one in Settings.");

    setError(""); setLoading(true); setReport(null); setCompetitors([]);
    setRlProgress({ message: `Checking cache for "${name}"...`, score: 0, strategy: null });
    setQuery(name);
    setTab("research");

    try {
      // ── 1. Check Supabase cache first ──────────────────────────────
      const cached = await fetch(`/api/reports?name=${encodeURIComponent(name)}`).then(r => r.json()).catch(() => ({ report: null }));
      if (cached.report) {
        setRlProgress({ message: `Loaded from cache (${cached.ageHours}h old)`, score: 1, strategy: "CACHE" });
        await new Promise(r => setTimeout(r, 600)); // brief flash so user sees it
        setReport(cached.report);
        setLoading(false);
        if (cached.report.competitorNames?.length) loadCompetitorProfiles(cached.report.competitorNames, cached.report.domain);
        return;
      }

      // ── 2. No cache — run full RL research engine ──────────────────
      setRlProgress({ message: `Starting adaptive research for "${name}"...`, score: 0, strategy: null });
      const engine = new SearchEngine(exaKey, geminiKey, { maxRounds: 4, stopThreshold: 0.75 });
      const { report: result } = await engine.research(name, setRlProgress);

      if (!result) {
        setError("No data found. Try a more specific company name.");
      } else {
        setReport(result);
        // ── 3. Save to cache for next time ────────────────────────────
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
            {/* News loading — animated Miru eye (full animation first time only) */}
            {newsLoading && <NewsLoader />}



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
                  {exaKey && <button className="btn btn-sm" onClick={() => fetchFreshNews(exaKey, geminiKey)} style={{ whiteSpace: "nowrap" }}>↻ Refresh</button>}
                </div>
              </div>

                {filteredNews.length > 0 && (() => {
                  // Group news by week
                  const now = new Date();
                  const oneWeekAgo = new Date(now - 7 * 86400000);
                  const thisWeek = filteredNews.filter(n => new Date(n.date || n.publishedDate || 0) >= oneWeekAgo);
                  const earlier  = filteredNews.filter(n => new Date(n.date || n.publishedDate || 0) <  oneWeekAgo);

                  const formatDate = (d) => {
                    if (!d) return "";
                    const dt = new Date(d);
                    if (isNaN(dt)) return d;
                    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  };

                  const renderItems = (items, offset = 0) => items.map((item, i) => {
                    const companyName = item.startup || item.researchQuery || item.title || "";
                    const companySlug = toSlug(companyName);
                    return (
                      <div className="news-item" key={`${offset}-${i}`}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span className="news-rank">{offset + i + 1}.</span>
                          <div className="news-main">
                            {/* Company name chip → /startup/[slug] */}
                            {companyName && (
                              <span
                                className="news-company-chip"
                                onClick={(e) => { e.stopPropagation(); window.location.href = `/startup/${companySlug}`; }}
                                title={`Open ${companyName} intelligence page`}
                                role="link"
                                style={{ cursor: "pointer" }}
                              >
                                {companyName} ↗
                              </span>
                            )}
                            {/* Headline → inline research */}
                            <div
                              className="news-headline"
                              onClick={() => research(item.researchQuery || item.startup)}
                            >
                              {item.headline || item.title}
                            </div>
                            <div className="news-meta">
                              {item.stage && <span className={`news-stage ${item.stage?.toLowerCase().includes("seed") ? "stage-seed" : item.stage?.toLowerCase().includes("series") ? "stage-series" : item.stage?.toLowerCase().includes("acquired") ? "stage-acquired" : "stage-ipo"}`}>{item.stage}</span>}
                              {item.amount && <span style={{ color: "var(--green)", fontWeight: 600 }}>{item.amount}</span>}
                              {item.source && <span>{item.source}</span>}
                              {(item.date || item.publishedDate) && <span style={{ color: "var(--muted2)" }}>{formatDate(item.date || item.publishedDate)}</span>}
                            </div>
                            {item.summary && <div className="news-summary">{item.summary}</div>}

                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                          <button className="btn-research" onClick={() => research(item.researchQuery || item.startup || item.title)}>Research →</button>
                          <span
                            className="btn-view-page"
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/startup/${companySlug}`; }}
                            role="link"
                            style={{ cursor: "pointer" }}
                          >View page ↗</span>

                        </div>
                      </div>
                    );
                  });


                  return (
                    <div className="news-list">
                      {thisWeek.length > 0 && (
                        <>
                          <div className="news-group-label">This Week</div>
                          {renderItems(thisWeek, 0)}
                        </>
                      )}
                      {earlier.length > 0 && (
                        <>
                          <div className="news-group-label">Earlier This Month</div>
                          {renderItems(earlier, thisWeek.length)}
                        </>
                      )}
                    </div>
                  );
                })()}

                {!filteredNews.length && (
                  <div className="empty-wrap">
                    <div className="empty-title">No news loaded</div>
                    <div className="empty-desc">
                      {!exaKey
                        ? "Add an Exa API key in Settings to load startup news."
                        : <button className="btn btn-primary" onClick={() => fetchFreshNews(exaKey, geminiKey)}>Load News</button>}
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

        {tab === "discover" && (
          <div>
            {/* Discover header */}
            <div className="feed-header" style={{ flexWrap: "wrap", gap: 8 }}>
              <div>
                <div className="feed-title">
                  {discoverTab === "yc"         && "YC Company Database"}
                  {discoverTab === "unicorn"     && "Unicorn Companies ($1B+)"}
                  {discoverTab === "fortune500"  && "Fortune 500 & Forbes Global"}
                  {discoverTab === "tech"        && "Big Tech & MNCs"}
                  {discoverTab === "all"         && "All Companies"}
                </div>
                {discoverTotal > 0 && <div style={{ fontSize: 11, color: "var(--muted)" }}>{discoverTotal.toLocaleString()} companies</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  ref={discoverSearchRef}
                  style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font)", fontSize: 12, width: 150 }}
                  placeholder="Filter companies..."
                  defaultValue={discoverSearch}
                  onKeyDown={e => { if (e.key === "Enter") handleDiscoverFilter(sectorFilter, batchFilter, e.target.value); }}
                />
                {discoverTab === "yc" && (
                  <select
                    style={{ padding: "4px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font)", fontSize: 12 }}
                    value={batchFilter}
                    onChange={e => handleDiscoverFilter(sectorFilter, e.target.value, discoverSearch)}
                  >
                    {BATCH_OPTIONS.map(b => <option key={b}>{b}</option>)}
                  </select>
                )}
                <select
                  style={{ padding: "4px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font)", fontSize: 12 }}
                  value={sectorFilter}
                  onChange={e => handleDiscoverFilter(e.target.value, batchFilter, discoverSearch)}
                >
                  {["All", ...allSectors.slice(0, 30)].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Category tab switcher — no emojis */}
              <div style={{ width: "100%", display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                {[
                  { id: "yc",         label: "YC Startups"    },
                  { id: "unicorn",    label: "Unicorns"        },
                  { id: "fortune500", label: "Fortune 500"     },
                  { id: "tech",       label: "Big Tech & MNCs" },
                  { id: "all",        label: "All"             },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDiscoverTab(t.id)}
                    style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: discoverTab === t.id ? "none" : "1px solid var(--border)",
                      background: discoverTab === t.id ? "var(--orange)" : "transparent",
                      color: discoverTab === t.id ? "#fff" : "var(--muted)",
                      transition: "all 0.15s",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Product vs Service type filter */}
              <div style={{ width: "100%", display: "flex", gap: 6, marginTop: 6 }}>
                {[
                  { id: "all",     label: "All Types" },
                  { id: "product", label: "Product" },
                  { id: "service", label: "Service" },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleTypeFilter(t.id)}
                    className={`ctype-filter-btn ${typeFilter === t.id ? `active-${t.id}` : ""}`}
                  >
                    {t.id !== "all" && <span className={`ctype-dot ctype-dot-${t.id}`} />}
                    {t.label}
                  </button>
                ))}
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
                <div className="empty-desc">Try a different tab or clear the search filter.</div>
              </div>
            )}

            {companies.length > 0 && companies.length < discoverTotal && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button className="btn" disabled={discoverLoading} onClick={() => {
                  const next = discoverPage + 1;
                  setDiscoverPage(next);
                  loadCompanies(next, sectorFilter, batchFilter, discoverSearch, discoverTab);
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
                        {/* ── Main content ── */}
                        <div className="comp-main">
                          <div className="comp-name">{c.name}</div>
                          <div className="comp-founded">
                            {c.founded ? `Founded ${c.founded}` : ""}
                            {c.headquarters ? ` · ${c.headquarters}` : ""}
                          </div>
                          <div className="comp-desc">{c.whatTheyDo}</div>
                          {c.differentiation && (
                            <div className="comp-diff">{c.differentiation}</div>
                          )}
                          {c.founders?.length > 0 && (
                            <div className="comp-founders">
                              Founders: {c.founders.map((f) => f.name).join(", ")}
                            </div>
                          )}
                        </div>

                        {/* ── Side panel ── */}
                        <div className="comp-side">
                          {c.totalFunding && (
                            <div className="comp-funding">Raised {c.totalFunding}</div>
                          )}
                          {c.keyStrengths?.length > 0 && (
                            <div>
                              <div className="comp-strengths-title">Strengths</div>
                              <div className="comp-strengths">
                                {c.keyStrengths.map((s, j) => (
                                  <div key={j} className="comp-strength-item">{s}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {c.threatLevel && (
                            <div>
                              <span className={`comp-threat ${
                                c.threatLevel === "High" ? "threat-high"
                                : c.threatLevel === "Medium" ? "threat-med"
                                : "threat-low"
                              }`}>
                                {c.threatLevel} threat
                              </span>
                              {c.threatReason && (
                                <div className="comp-threat-reason" style={{ marginTop: 5 }}>
                                  {c.threatReason}
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            className="btn-research"
                            style={{ marginTop: 4 }}
                            onClick={() => research(c.name)}
                          >
                            Deep research →
                          </button>
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

      {/* ── Mobile bottom navigation (thumb zone, ≤430px only) ── */}
      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        {[
          { id: "feed",        label: "Feed",       icon: "◉" },
          { id: "discover",    label: "Discover",   icon: "⊞" },
          { id: "research",    label: "Research",   icon: "⌕" },
          { id: "competitors", label: "Rivals",     icon: "⇄" },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            className={`mbn-tab ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
            aria-label={label}
          >
            <span className="mbn-icon">{icon}</span>
            <span className="mbn-label">{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
