"use client";
import { useState, useCallback } from "react";
import NewsCard from "./NewsCard";
import BlogStories from "./BlogStories";
import FeedAllView from "./FeedAllView";


const FILTERS = ["All", "News", "Blogs", "Seed", "Series A", "Acquired", "IPO"];

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function NewsLoader() {
  return (
    <div className="news-loader-wrap">
      <div className="news-loader-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="miru-eye-svg">
          <circle cx="24" cy="24" r="22" stroke="var(--orange)" strokeWidth="1.5" strokeDasharray="4 4" className="eye-ring-spin" />
          <ellipse cx="24" cy="24" rx="16" ry="11" fill="#fff" stroke="var(--border)" strokeWidth="1" />
          <circle cx="24" cy="24" r="7" fill="var(--orange)" className="eye-iris-pulse" />
          <circle cx="24" cy="24" r="3.5" fill="#fff" />
          <line x1="8" y1="24" x2="40" y2="24" stroke="var(--orange)" strokeWidth="0.8" strokeOpacity="0.3" className="eye-scan-line" />
        </svg>
      </div>
      <div className="news-loader-status">Fetching startup news…</div>
      <div className="news-loader-sources">
        {["TC", "BBG", "REU", "AXS", "FT", "VB"].map((s, i) => (
          <span key={s} className="news-source-dot" style={{ animationDelay: `${i * 0.2}s` }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export default function FeedTab({
  news = [],
  newsLoading = false,
  newsCacheInfo = null,
  companies = [],
  geminiKey = "",
  onResearch,
}) {
  const [filter, setFilter]           = useState("All");
  const [showAllView, setShowAllView] = useState(false);

  const handleSelectFolder = (folderId) => {
    if (folderId === "Blogs") setFilter("Blogs");
    else setFilter(folderId);
  };


  // Filter logic
  const filteredNews = useCallback(() => {
    if (filter === "All" || filter === "News") return news;
    if (filter === "Blogs") return [];
    const q = filter.toLowerCase();
    return news.filter(n => {
      const t = `${n.title || ""} ${n.headline || ""} ${n.summary || ""} ${n.stage || ""}`.toLowerCase();
      if (q === "seed") return t.includes("seed") || t.includes("pre-seed");
      if (q === "series a") return t.includes("series a") || t.includes("series-a");
      if (q === "acquired") return t.includes("acqui") || t.includes("buys");
      if (q === "ipo") return t.includes("ipo") || t.includes("public");
      return t.includes(q);
    });
  }, [news, filter])();

  const now = new Date();
  const oneWeekAgo = new Date(now - 7 * 86400000);
  const thisWeek = filteredNews.filter(n => new Date(n.date || n.publishedDate || 0) >= oneWeekAgo);
  const earlier  = filteredNews.filter(n => new Date(n.date || n.publishedDate || 0) <  oneWeekAgo);

  const renderNewsCards = (items, offset = 0) =>
    items.map((item, i) => {
      const companySlug = toSlug(item.startup || item.researchQuery || item.title || "startup");
      return (
        <NewsCard
          key={`${offset}-${i}`}
          item={item}
          rank={offset + i + 1}
          accentIdx={offset + i}
          geminiKey={geminiKey}
          onResearch={q => onResearch?.(q)}
          onViewPage={() => { window.location.href = `/startup/${companySlug}`; }}
        />
      );
    });

  return (
    <div className="feed-tab-wrap">

      {/* ── Blog Stories Row ── */}
      {(filter === "All" || filter === "Blogs") && (
        <BlogStories />
      )}


      {/* ── Feed Header ── */}
      <div className="feed-tab-header">
        <div className="feed-tab-title-row">
          <div className="feed-title">
            Startup Intelligence Feed
            {newsCacheInfo && !newsCacheInfo.fresh && (
              <span className="stale-badge" style={{ marginLeft: 8 }}>
                ● {newsCacheInfo.ageHours}h old
              </span>
            )}
          </div>
          {/* ALL button — opens iOS folder view */}
          <button
            className="feed-all-btn"
            onClick={() => setShowAllView(true)}
            title="Browse all categories"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            All
          </button>
        </div>

        {/* Filter tabs */}
        <div className="feed-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading State ── */}
      {newsLoading && <NewsLoader />}

      {/* ── News Cards ── */}
      {!newsLoading && filter !== "Blogs" && (
        <>
          {filteredNews.length > 0 ? (
            <div className="news-list">
              {thisWeek.length > 0 && (
                <>
                  <div className="news-group-label">This Week</div>
                  {renderNewsCards(thisWeek, 0)}
                </>
              )}
              {earlier.length > 0 && (
                <>
                  <div className="news-group-label">Earlier</div>
                  {renderNewsCards(earlier, thisWeek.length)}
                </>
              )}
            </div>
          ) : (
            <div className="empty-wrap">
              <div className="empty-title">
                {filter === "All" ? "No news yet" : `No "${filter}" stories`}
              </div>
              <div className="empty-desc">
                {filter === "All"
                  ? "News is being fetched. Try again in a moment."
                  : "No matching stories found. Try a different filter."}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── iOS All View Overlay ── */}
      {showAllView && (
        <FeedAllView
          news={news}
          onSelectFolder={handleSelectFolder}
          onClose={() => setShowAllView(false)}
        />
      )}

    </div>
  );
}
