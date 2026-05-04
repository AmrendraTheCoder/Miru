"use client";
import { useState, useCallback, useEffect, useRef } from "react";

const STATIC_STARTUPS = [
  { name: "Airbnb",    batch: "W09", sectors: ["Travel"],    tagline: "Marketplace for short-term home rentals.",      slug: "airbnb",   website: "airbnb.com" },
  { name: "Stripe",    batch: "S09", sectors: ["FinTech"],   tagline: "Payment infrastructure for the internet.",       slug: "stripe",   website: "stripe.com" },
  { name: "Dropbox",   batch: "S07", sectors: ["SaaS"],      tagline: "Cloud file storage and collaboration.",          slug: "dropbox",  website: "dropbox.com" },
  { name: "DoorDash",  batch: "S13", sectors: ["Logistics"], tagline: "On-demand food delivery platform.",              slug: "doordash", website: "doordash.com" },
  { name: "Coinbase",  batch: "S12", sectors: ["Crypto"],    tagline: "Cryptocurrency exchange. First major crypto IPO.", slug: "coinbase", website: "coinbase.com" },
];

const TYPE_META = {
  product: { label: "Product", hint: "DSA-heavy · High salary · Stock options" },
  service: { label: "Service", hint: "Project-based · Moderate DSA · Variable pay" },
  hybrid:  { label: "Hybrid",  hint: "Mix of product and services" },
};

const BATCH_OPTIONS = ["All","P26","W25","S24","W24","S23","W23","S22","W22"];

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CompanyLogo({ name, logoUrl, website }) {
  const domain = website ? website.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0] : null;
  const initialSrc = logoUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null);
  const [src, setSrc] = useState(initialSrc);
  const [failed, setFailed] = useState(!initialSrc);
  const COLORS = ["#e8522a","#2a7ae8","#2ae87a","#e8a02a","#7a2ae8","#e82a7a","#0ea5e9","#f59e0b"];
  let h = 0;
  for (const c of (name || "")) h = c.charCodeAt(0) + ((h << 5) - h);
  const avatarBg = COLORS[Math.abs(h) % COLORS.length];
  if (failed) return <div className="startup-logo-letter" style={{ background: avatarBg }}>{(name || "?")[0].toUpperCase()}</div>;
  return <img className="startup-logo-img" src={src} alt={`${name} logo`} onError={() => setFailed(true)} loading="lazy" />;
}

function StartupCard({ s, onResearch }) {
  const sector = s.sectors?.[0] || "";
  const slug = s.slug || toSlug(s.name || "");
  const typeMeta = TYPE_META[s.company_type] || null;
  return (
    <div className="discover-card" onClick={() => { window.location.href = `/startup/${slug}`; }} style={{ cursor: "pointer" }}>
      <div className="discover-card-top">
        <CompanyLogo name={s.name} logoUrl={s.logo_url} website={s.website} />
        <div style={{ minWidth: 0 }}>
          <div className="startup-name">{s.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
            {s.batch && <span className="startup-batch">{s.batch}{sector ? ` · ${sector}` : ""}</span>}
            {typeMeta && <span className={`ctype-badge ctype-${s.company_type}`}>{typeMeta.label}</span>}
          </div>
          {typeMeta && <span className="ctype-hint">{typeMeta.hint}</span>}
        </div>
      </div>
      <div className="startup-desc">{s.tagline || s.description}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
        <div className="startup-tags" style={{ margin: 0, flex: 1, minWidth: 0, overflow: "hidden" }}>
          {(s.sectors || []).slice(0, 2).map((t, i) => <span key={i} className="startup-tag">{t}</span>)}
          {s.status && s.status !== "Active" && (
            <span className="startup-tag" style={{ color: s.status === "Acquired" ? "var(--red)" : "var(--green)" }}>{s.status}</span>
          )}
        </div>
        <button className="btn-research" onClick={(e) => { e.stopPropagation(); onResearch(s.name); }} style={{ flexShrink: 0, marginRight: 2 }}>
          Research
        </button>
      </div>
    </div>
  );
}

export default function DiscoverTab({ onResearch }) {
  const [companies, setCompanies]       = useState(STATIC_STARTUPS);
  const [loading, setLoading]           = useState(false);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [sectorFilter, setSector]       = useState("All");
  const [batchFilter, setBatch]         = useState("All");
  const [search, setSearch]             = useState("");
  const [discoverTab, setDiscoverTab]   = useState("yc");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [allSectors, setAllSectors]     = useState([]);
  const searchRef   = useRef(null);
  const debounceRef = useRef(null);

  const load = useCallback(async (pg = 1, sector = "All", batch = "All", q = "", dtab = "yc", dtype = "all") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 60, tab: dtab });
      if (sector !== "All") params.set("sector", sector);
      if (batch !== "All" && dtab === "yc") params.set("batch", batch);
      if (q.trim()) params.set("q", q.trim());
      if (dtype !== "all") params.set("type", dtype);
      const res = await fetch(`/api/yc-companies?${params}`).then(r => r.json());
      if (res.companies?.length) {
        setCompanies(pg === 1 ? res.companies : prev => [...prev, ...res.companies]);
        setTotal(res.total || 0);
        if (pg === 1) {
          const sectors = new Set();
          for (const c of res.companies) for (const s of (c.sector || c.sectors || [])) sectors.add(s);
          setAllSectors(Array.from(sectors).filter(Boolean).sort());
        }
      } else if (pg === 1) setCompanies(STATIC_STARTUPS);
    } catch { setCompanies(STATIC_STARTUPS); }
    setLoading(false);
  }, []);

  useEffect(() => { load(1, sectorFilter, batchFilter, search, discoverTab, typeFilter); }, [discoverTab]);

  const applyFilter = (sector, batch, q, dtype = typeFilter) => {
    setSector(sector); setBatch(batch); setSearch(q); setPage(1);
    load(1, sector, batch, q, discoverTab, dtype);
  };

  const applyType = (dtype) => {
    setTypeFilter(dtype); setPage(1); setCompanies([]);
    load(1, sectorFilter, batchFilter, search, discoverTab, dtype);
  };

  return (
    <div className="discover-tab-wrap">
      {/* Header */}
      <div className="feed-header" style={{ flexWrap: "wrap", gap: 6 }}>
        <div style={{ width: "100%", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div className="feed-title">
            {discoverTab === "yc" && "YC Company Database"}
            {discoverTab === "unicorn" && "Unicorn Companies ($1B+)"}
            {discoverTab === "fortune500" && "Fortune 500 & Forbes Global"}
            {discoverTab === "tech" && "Big Tech & MNCs"}
            {discoverTab === "all" && "All Companies"}
          </div>
          {total > 0 && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>{total.toLocaleString()}</span>}
        </div>

        {/* Category tabs */}
        <div style={{ width: "100%", display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[
            { id: "yc", label: "YC Startups" }, { id: "unicorn", label: "Unicorns" },
            { id: "fortune500", label: "Fortune 500" }, { id: "tech", label: "Big Tech & MNCs" }, { id: "all", label: "All" },
          ].map(t => (
            <button key={t.id} onClick={() => setDiscoverTab(t.id)} style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
              border: discoverTab === t.id ? "1.5px solid var(--orange)" : "1px solid var(--border)",
              background: discoverTab === t.id ? "var(--orange)" : "#fff",
              color: discoverTab === t.id ? "#fff" : "var(--muted)",
              transition: "all 0.15s", fontFamily: "var(--font)",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Type filter */}
        <div style={{ width: "100%", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}>
          {[{ id: "all", label: "All Types" }, { id: "product", label: "Product" }, { id: "service", label: "Service" }].map(t => (
            <button key={t.id} onClick={() => applyType(t.id)} className={`ctype-filter-btn ${typeFilter === t.id ? `active-${t.id}` : ""}`}>
              {t.id !== "all" && <span className={`ctype-dot ctype-dot-${t.id}`} />}
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + dropdowns */}
        <div style={{ width: "100%", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
          <input
            ref={searchRef}
            style={{ flex: 1, minWidth: 100, padding: "5px 10px", border: "1px solid var(--border)", borderRadius: 20, fontFamily: "var(--font)", fontSize: 12, background: "#fff", outline: "none" }}
            placeholder="Search companies..."
            defaultValue={search}
            onKeyDown={e => { if (e.key === "Enter") applyFilter(sectorFilter, batchFilter, e.target.value); }}
            onChange={e => {
              const val = e.target.value;
              clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => applyFilter(sectorFilter, batchFilter, val), 300);
            }}
          />
          {discoverTab === "yc" && (
            <select style={{ padding: "5px 8px", border: "1px solid var(--border)", borderRadius: 20, fontFamily: "var(--font)", fontSize: 12, background: "#fff", color: "var(--text)" }}
              value={batchFilter} onChange={e => applyFilter(sectorFilter, e.target.value, search)}>
              {BATCH_OPTIONS.map(b => <option key={b}>{b}</option>)}
            </select>
          )}
          <select style={{ padding: "5px 8px", border: "1px solid var(--border)", borderRadius: 20, fontFamily: "var(--font)", fontSize: 12, background: "#fff", color: "var(--text)" }}
            value={sectorFilter} onChange={e => applyFilter(e.target.value, batchFilter, search)}>
            {["All", ...allSectors.slice(0, 30)].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Skeleton */}
      {loading && companies.length === 0 && (
        <div className="discover-grid">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skel-logo" /><div className="skeleton skel-name" />
              <div className="skeleton skel-tag" /><div className="skeleton skel-line" />
              <div className="skeleton skel-line skel-line-short" />
            </div>
          ))}
        </div>
      )}

      {companies.length > 0 && (
        <div className="card-list-label">
          {total > 0 ? <><strong style={{ color:"var(--text)",fontWeight:500 }}>{companies.length}</strong> <span style={{ color:"var(--muted2)" }}>of</span> <strong style={{ color:"var(--text)",fontWeight:500 }}>{total.toLocaleString()}</strong> companies</> : "Companies"}
        </div>
      )}

      <div className="discover-grid">
        {companies.map((s, i) => <StartupCard key={s.slug || i} s={s} onResearch={onResearch} />)}
      </div>

      {!loading && companies.length === 0 && (
        <div className="empty-wrap">
          <div className="empty-title">No companies found</div>
          <div className="empty-desc">Try a different tab or clear the search filter.</div>
        </div>
      )}

      {companies.length > 0 && companies.length < total && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button className="btn" disabled={loading} onClick={() => {
            const next = page + 1; setPage(next);
            load(next, sectorFilter, batchFilter, search, discoverTab);
          }}>
            {loading ? "Loading..." : `Load more (${total - companies.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
