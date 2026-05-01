"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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

  const blocks = [
    { label: "Exa API",    active: serverStatus.hasExaKey    || !!keys.exa },
    { label: "Gemini API", active: serverStatus.hasGeminiKey || !!keys.gemini },
    { label: "Supabase",   active: serverStatus.hasSupabase },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">API Keys &amp; Settings</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">

          {/* Status blocks */}
          <div className="settings-label" style={{ marginBottom: 7 }}>Connection Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 18 }}>
            {blocks.map(b => (
              <div key={b.label} style={{
                background: b.active ? "rgba(5,150,105,0.07)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${b.active ? "rgba(5,150,105,0.2)" : "#e4e4e4"}`,
                borderRadius: 6, padding: "8px 10px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: b.active ? "#059669" : "#d1d5db" }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: b.active ? "#059669" : "#bbb", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {b.active ? "Active" : "Not Set"}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{b.label}</div>
              </div>
            ))}
          </div>

          {/* Keys */}
          <div className="settings-label" style={{ marginBottom: 7 }}>
            Override Keys
            <span style={{ fontWeight: 400, color: "var(--muted)", textTransform: "none", letterSpacing: 0, marginLeft: 4 }}>— saved in your browser</span>
          </div>
          <div className="input-group">
            <label className="settings-label" style={{ textTransform: "none", fontSize: 11 }}>Exa API Key</label>
            <input className="settings-input" type="password" value={keys.exa} onChange={e => setKeys(p => ({ ...p, exa: e.target.value }))} placeholder="exa-xxxx" autoComplete="off" />
            <div className="input-help">Free at <a href="https://dashboard.exa.ai" target="_blank" rel="noopener noreferrer">dashboard.exa.ai</a></div>
          </div>
          <div className="input-group" style={{ marginTop: 10 }}>
            <label className="settings-label" style={{ textTransform: "none", fontSize: 11 }}>Gemini API Key</label>
            <input className="settings-input" type="password" value={keys.gemini} onChange={e => setKeys(p => ({ ...p, gemini: e.target.value }))} placeholder="AIzaSy..." autoComplete="off" />
            <div className="input-help">Free at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com</a></div>
          </div>

          {/* Security note */}
          {/* <div style={{
            marginTop: 12,
            background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)",
            borderRadius: 6, padding: "9px 12px", display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div style={{ fontSize: 10, color: "#92400e", lineHeight: 1.55 }}>
              <strong>Keys stay in your browser only</strong> — never sent to our servers. Server-side keys (shown Active above) are never exposed to the client. Clear keys on shared machines.
            </div>
          </div> */}

          {/* Waitlist promo */}
          <div style={{
            marginTop: 12,
            background: "linear-gradient(135deg, rgba(232,82,42,0.07) 0%, rgba(232,82,42,0.02) 100%)",
            border: "1px solid rgba(232,82,42,0.2)", borderRadius: 8, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <span style={{ background: "var(--orange)", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "2px 7px", borderRadius: 3 }}>Coming Soon</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>Miru V1 — Early Access</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 10px" }}>
              Placement data, interview intel &amp; AI salary insights — all in one terminal.
            </p>
            <a href="/waitlist" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "var(--orange)", color: "#fff", fontSize: 11, fontWeight: 700,
              padding: "5px 13px", borderRadius: 4, textDecoration: "none",
            }}>Join the Waitlist →</a>
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

  // Returning users — skeleton news cards
  if (!firstTime) {
    return (
      <div style={{ padding: "12px 0" }}>
        {[...Array(4)].map((_,i) => (
          <div key={i} className="news-skeleton-card">
            <div className="skeleton news-skel-tag" />
            <div className="skeleton news-skel-title" />
            <div className="skeleton news-skel-title news-skel-title-short" />
            <div className="skeleton news-skel-meta" />
          </div>
        ))}
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

  // Decide starting src: logoUrl → Google Favicon (only with a real domain) → null (go straight to initial)
  const initialSrc = logoUrl
    ? logoUrl
    : domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
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
    // If the Google favicon or initial logoUrl fails, just show the letter initial.
    // We no longer fallback from icon.horse to avoid 404s in the network tab.
    setFailed(true);
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
        <div className="startup-tags" style={{ margin: 0, flex: 1, minWidth: 0, overflow: "hidden" }}>
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
          style={{ flexShrink: 0, marginRight: 2 }}
        >
          Research
        </button>
      </div>
    </div>
  );
}


export default function MiruApp({ initialTab = "feed" }) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
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
  const [discoverTab, setDiscoverTab] = useState("all"); // yc | unicorn | fortune500 | tech | all
  const [typeFilter, setTypeFilter] = useState("all");   // all | product | service
  const [allSectors, setAllSectors] = useState([]);
  const discoverSearchRef = useRef(null);
  const discoverDebounceRef = useRef(null); // Task 7 — debounce timer

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState("all");   // all | job | internship | freelance
  const [jobSourceFilter, setJobSourceFilter] = useState("all");
  const [jobSearch, setJobSearch] = useState("");
  const [jobPage, setJobPage] = useState(1);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const [jobsScraping, setJobsScraping] = useState(false);
  const [jobsScrapeMsg, setJobsScrapeMsg] = useState("");


  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userKeys, setUserKeys] = useState({ exa: "", gemini: "" });
  const [serverStatus, setServerStatus] = useState({ hasExaKey: false, hasGeminiKey: false, hasSupabase: false });

  const exaKey    = userKeys.exa    || "";
  const geminiKey = userKeys.gemini || "";

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

        // ── Read ?q= from URL (from profile page "Run AI research" CTA) ──
        const urlQ = new URLSearchParams(window.location.search).get("q");
        if (urlQ && urlQ.trim()) {
          setQuery(urlQ.trim());
          setTab("research");
          // Clean URL immediately so search bar clears after dismiss
          window.history.replaceState({}, "", window.location.pathname);
          // Auto-trigger research with a brief delay for state to settle
          setTimeout(() => research(urlQ.trim(), exa, gemini), 300);
        }
      })
      .catch(() => {
        if (localExa) loadNews(localExa, localGemini);
      });
  }, []);

  /* ── Load DB companies when Discover tab opens ── */
  useEffect(() => {
    if (tab === "discover") loadCompanies(1, sectorFilter, batchFilter, discoverSearch, discoverTab);
    if (tab !== "research") setQuery("");
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
            {[["/feed","feed","Feed"],["/discover","discover","Discover"],["/research","research","Research"],["/competitors","competitors","Competitors"],["/jobs","jobs","Jobs 🆕"]].map(([href, id, label]) => (
              <button key={id} className={`nav-tab ${tab === id ? "active" : ""}`} onClick={() => { setTab(id); router.push(href); }}>
                {label}{id === "discover" && discoverTotal > 0 && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>({discoverTotal})</span>}
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

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} keys={userKeys} setKeys={setUserKeys} serverStatus={serverStatus} />


      {/* ── Glassmorphism ticker bar — blog teaser ── */}
      <div className="ticker-wrap" aria-label="Coming soon" role="marquee">
        <div className="ticker-track">
          {[
            "Blog coming soon — founder deep-dives, funding breakdowns, and campus prep guides",
            "Miru Insights: Breaking down the 2025 startup funding landscape",
            "How to crack product interviews at Stripe and Airbnb — guides dropping soon",
            "Product vs Service companies: what students need to know before placement season",
            "YC W25 batch analysis — which companies are hiring interns?",
          ].concat([
            "Blog coming soon — founder deep-dives, funding breakdowns, and campus prep guides",
            "Miru Insights: Breaking down the 2025 startup funding landscape",
            "How to crack product interviews at Stripe and Airbnb — guides dropping soon",
          ]).map((text, i) => (
            <span key={i} className="ticker-item">{text}</span>
          ))}
        </div>
      </div>

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
          <div className="discover-tab-wrap">
            {/* Discover header — Category tabs first, then controls */}
            <div className="feed-header" style={{ flexWrap: "wrap", gap: 6 }}>

              {/* Title + count */}
              <div style={{ width: "100%", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div className="feed-title">
                  {discoverTab === "yc"         && "YC Company Database"}
                  {discoverTab === "unicorn"     && "Unicorn Companies ($1B+)"}
                  {discoverTab === "fortune500"  && "Fortune 500 & Forbes Global"}
                  {discoverTab === "tech"        && "Big Tech & MNCs"}
                  {discoverTab === "all"         && "All Companies"}
                </div>
                {discoverTotal > 0 && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>{discoverTotal.toLocaleString()}</span>}
              </div>

              {/* Category tabs */}
              <div style={{ width: "100%", display: "flex", gap: 5, flexWrap: "wrap" }}>
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
                      padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      border: discoverTab === t.id ? "1.5px solid var(--orange)" : "1px solid var(--border)",
                      background: discoverTab === t.id ? "var(--orange)" : "#fff",
                      color: discoverTab === t.id ? "#fff" : "var(--muted)",
                      transition: "all 0.15s",
                      fontFamily: "var(--font)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Type + search row */}
              <div style={{ width: "100%", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}>
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

              {/* Search + dropdowns */}
              <div style={{ width: "100%", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
                <input
                  ref={discoverSearchRef}
                  style={{ flex: 1, minWidth: 100, padding: "5px 10px", border: "1px solid var(--border)", borderRadius: 20, fontFamily: "var(--font)", fontSize: 12, background: "#fff", outline: "none" }}
                  placeholder="Search companies..."
                  defaultValue={discoverSearch}
                  onKeyDown={e => { if (e.key === "Enter") handleDiscoverFilter(sectorFilter, batchFilter, e.target.value); }}
                  onChange={e => {
                    const val = e.target.value;
                    clearTimeout(discoverDebounceRef.current);
                    discoverDebounceRef.current = setTimeout(() => {
                      handleDiscoverFilter(sectorFilter, batchFilter, val);
                    }, 300);
                  }}
                />
                {discoverTab === "yc" && (
                  <select
                    style={{ padding: "5px 8px", border: "1px solid var(--border)", borderRadius: 20, fontFamily: "var(--font)", fontSize: 12, background: "#fff", color: "var(--text)" }}
                    value={batchFilter}
                    onChange={e => handleDiscoverFilter(sectorFilter, e.target.value, discoverSearch)}
                  >
                    {BATCH_OPTIONS.map(b => <option key={b}>{b}</option>)}
                  </select>
                )}
                <select
                  style={{ padding: "5px 8px", border: "1px solid var(--border)", borderRadius: 20, fontFamily: "var(--font)", fontSize: 12, background: "#fff", color: "var(--text)" }}
                  value={sectorFilter}
                  onChange={e => handleDiscoverFilter(e.target.value, batchFilter, discoverSearch)}
                >
                  {["All", ...allSectors.slice(0, 30)].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {discoverLoading && companies.length === 0 && (
              <div className="discover-grid">
                {[...Array(6)].map((_,i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton skel-logo" />
                    <div className="skeleton skel-name" />
                    <div className="skeleton skel-tag" />
                    <div className="skeleton skel-line" />
                    <div className="skeleton skel-line skel-line-short" />
                  </div>
                ))}
              </div>
            )}

            {/* Subtle divider above company list */}
            {companies.length > 0 && (
              <div className="card-list-label">
                {discoverTotal > 0
                  ? <><strong style={{ color: "var(--text)", fontWeight: 500 }}>{companies.length}</strong> <span style={{ color: "var(--muted2)" }}>of</span> <strong style={{ color: "var(--text)", fontWeight: 500 }}>{discoverTotal.toLocaleString()}</strong> companies</>
                  : "Companies"}
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

        {/* ── JOBS TAB ── */}
        {tab === "jobs" && (
          <div className="jobs-wrap">

            {/* Header row */}
            <div className="jobs-header">
              <div>
                <div className="jobs-title">Job &amp; Freelance Board</div>
                <div className="jobs-sub">Live listings · global remote · verified freshness</div>
              </div>
              <button
                className="jobs-scrape-btn"
                disabled={jobsScraping}
                onClick={async () => {
                  setJobsScraping(true);
                  setJobsScrapeMsg("Fetching from Remotive, RemoteOK, Wellfound…");
                  try {
                    const r = await fetch("/api/scrape/jobs", { method: "POST" });
                    const d = await r.json();
                    if (d.success) {
                      setJobsScrapeMsg(`✓ ${d.scraped} listings synced`);
                      // reload jobs
                      const res = await fetch(`/api/jobs?type=${jobTypeFilter}&source=${jobSourceFilter}&q=${jobSearch}&page=1`);
                      const jd = await res.json();
                      setJobs(jd.jobs || []);
                      setJobPage(1);
                      setJobsHasMore(jd.hasMore);
                    } else {
                      setJobsScrapeMsg("Sync failed — check console");
                    }
                  } catch { setJobsScrapeMsg("Network error"); }
                  finally { setJobsScraping(false); }
                }}
              >
                {jobsScraping ? "Syncing…" : "↻ Sync Jobs"}
              </button>
            </div>
            {jobsScrapeMsg && <div className="jobs-scrape-msg">{jobsScrapeMsg}</div>}

            {/* Type filter — underline tab style, single line */}
            <div className="jobs-filters-row">
              {[["all","All"],["job","Jobs"],["internship","Internships"],["freelance","Freelance"]].map(([v,l]) => (
                <button key={v}
                  className={`jobs-filter-btn ${jobTypeFilter === v ? "active" : ""}`}
                  onClick={() => {
                    setJobTypeFilter(v); setJobPage(1); setJobs([]); setJobsLoading(true);
                    fetch(`/api/jobs?type=${v}&source=${jobSourceFilter}&q=${jobSearch}&page=1`)
                      .then(r => r.json()).then(d => { setJobs(d.jobs||[]); setJobsHasMore(d.hasMore); })
                      .finally(() => setJobsLoading(false));
                  }}
                >{l}</button>
              ))}
            </div>

            {/* Source chips — pill style, single scrolling line */}
            <div className="jobs-sources-row">
              {[["all","All Sources"],["remotive","Remotive"],["remoteok","RemoteOK"],["wellfound","Wellfound"],["internshala","Internshala"]].map(([v,l]) => (
                <button key={v}
                  className={`jobs-source-chip ${jobSourceFilter === v ? "active" : ""}`}
                  onClick={() => {
                    setJobSourceFilter(v); setJobPage(1); setJobs([]); setJobsLoading(true);
                    fetch(`/api/jobs?type=${jobTypeFilter}&source=${v}&q=${jobSearch}&page=1`)
                      .then(r => r.json()).then(d => { setJobs(d.jobs||[]); setJobsHasMore(d.hasMore); })
                      .finally(() => setJobsLoading(false));
                  }}
                >{l}</button>
              ))}
            </div>

            {/* Search */}
            <div className="jobs-search-row">
              <input
                className="jobs-search-input"
                type="text"
                placeholder="Search by role, company, skill…"
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    setJobPage(1); setJobs([]); setJobsLoading(true);
                    fetch(`/api/jobs?type=${jobTypeFilter}&source=${jobSourceFilter}&q=${e.target.value}&page=1`)
                      .then(r => r.json()).then(d => { setJobs(d.jobs||[]); setJobsHasMore(d.hasMore); })
                      .finally(() => setJobsLoading(false));
                  }
                }}
              />
            </div>

            {/* Skeleton loading — 5 shimmer cards */}
            {jobsLoading && (
              <div className="jobs-list">
                {[...Array(5)].map((_,i) => (
                  <div key={i} className="job-skeleton-card">
                    <div className="job-skel-top">
                      <div className="skeleton job-skel-dot" />
                      <div className="skeleton job-skel-badge" />
                      <div className="skeleton job-skel-source" />
                    </div>
                    <div className="skeleton job-skel-title" />
                    <div className="skeleton job-skel-co" />
                    <div className="job-skel-chips">
                      {[...Array(3)].map((_,j) => <div key={j} className="skeleton job-skel-chip" />)}
                    </div>
                    <div className="job-skel-foot">
                      <div className="skeleton job-skel-date" />
                      <div className="skeleton job-skel-btn" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state — only when not loading */}
            {jobs.length === 0 && !jobsLoading && (
              <div className="jobs-empty">
                <div className="jobs-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    <line x1="12" y1="12" x2="12" y2="16"/>
                    <line x1="10" y1="14" x2="14" y2="14"/>
                  </svg>
                </div>
                <div className="jobs-empty-t">No listings yet</div>
                <div className="jobs-empty-s">Click <strong>↻ Sync Jobs</strong> to pull live listings from Remotive, RemoteOK and Wellfound.</div>
              </div>
            )}


            {/* Job cards */}
            <div className="jobs-list">
              {jobs.map(j => (
                <div key={j.id} className="job-card">
                  <div className="job-card-top">
                    {/* Status dot */}
                    <span className={`job-status-dot ${j.status}`} title={j.status} />

                    {/* Type badge */}
                    <span className={`job-type-badge ${j.type}`}>
                      {j.type === "job" ? "Job" : j.type === "internship" ? "Intern" : "Freelance"}
                    </span>

                    {/* Source pill */}
                    <span className="job-source-pill">{j.source}</span>

                    {/* Closing date */}
                    {j.closes_at && (
                      <span className="job-closes">
                        Closes {new Date(j.closes_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="job-card-body">
                    <div className="job-company-row">
                      {j.logo_url && (
                        <img src={j.logo_url} alt={j.company} className="job-logo"
                          onError={e => e.target.style.display = "none"} />
                      )}
                      <div>
                        <div className="job-title">{j.title}</div>
                        <div className="job-company">{j.company} · {j.location}</div>
                      </div>
                    </div>

                    {j.salary && <div className="job-salary">{j.salary}</div>}

                    {/* Skills */}
                    {j.skills && j.skills.length > 0 && (
                      <div className="job-skills">
                        {j.skills.slice(0, 6).map(s => (
                          <span key={s} className="job-skill-chip">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="job-card-footer">
                    <span className="job-posted">
                      {new Date(j.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <a
                      href={j.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="job-apply-btn"
                    >
                      Apply →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {jobsHasMore && (
              <button className="jobs-load-more"
                onClick={() => {
                  const next = jobPage + 1;
                  setJobsLoading(true);
                  fetch(`/api/jobs?type=${jobTypeFilter}&source=${jobSourceFilter}&q=${jobSearch}&page=${next}`)
                    .then(r => r.json())
                    .then(d => { setJobs(prev => [...prev, ...(d.jobs||[])]); setJobPage(next); setJobsHasMore(d.hasMore); })
                    .finally(() => setJobsLoading(false));
                }}
              >Load more listings</button>
            )}

            {/* Waitlist CTA */}
            <div className="jobs-waitlist-cta">
              <div className="jobs-wl-text">
                <strong>Want campus placement intel too?</strong>
                <span>Miru V1 brings verified interview Qs, salary data &amp; company culture reviews.</span>
              </div>
              <a href="/waitlist" className="jobs-wl-btn">Join Waitlist →</a>
            </div>

          </div>
        )}

      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        <button
          className={`mbn-tab ${tab === "feed" ? "active" : ""}`}
          onClick={() => { setTab("feed"); router.push("/feed"); }}
          aria-label="Feed"
        >
          <svg className="mbn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 10h16M4 14h10"/>
          </svg>
          <span className="mbn-label">Feed</span>
        </button>
        <button
          className={`mbn-tab ${tab === "discover" ? "active" : ""}`}
          onClick={() => { setTab("discover"); router.push("/discover"); }}
          aria-label="Discover"
        >
          <svg className="mbn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span className="mbn-label">Discover</span>
        </button>
        <button
          className={`mbn-tab ${tab === "jobs" ? "active" : ""}`}
          onClick={() => { setTab("jobs"); router.push("/jobs"); }}
          aria-label="Jobs"
        >
          <svg className="mbn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          <span className="mbn-label">Jobs</span>
        </button>
      </nav>
    </>
  );
}
