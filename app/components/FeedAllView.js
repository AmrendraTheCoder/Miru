"use client";
import { useEffect } from "react";

/**
 * FeedAllView — iOS Files app-style folder overlay for the Feed.
 * Shows categorised "folders" of news items with count badges.
 * Clicking a folder closes the overlay and applies a filter.
 */

const FOLDER_DEFS = [
  { id: "All",      label: "All Stories",  icon: "📰", color: "#e8522a", desc: "Everything in the feed" },
  { id: "Seed",     label: "Seed Rounds",  icon: "🌱", color: "#059669", desc: "Pre-seed & seed stage" },
  { id: "Series A", label: "Series A",     icon: "🚀", color: "#0369a1", desc: "Growth-stage raises" },
  { id: "Acquired", label: "Acquisitions", icon: "🤝", color: "#7c3aed", desc: "M&A activity" },
  { id: "IPO",      label: "Going Public", icon: "📈", color: "#b45309", desc: "IPO & SPAC news" },
  { id: "AI",       label: "AI & ML",      icon: "🤖", color: "#ec4899", desc: "Artificial intelligence" },
  { id: "Blogs",    label: "Miru Reads",   icon: "✍️", color: "#6d28d9", desc: "Analysis & playbooks" },
];

function getCount(id, news) {
  if (id === "All") return news.length;
  if (id === "Blogs") return 4; // static for now — dummyBlogs.length
  const q = id.toLowerCase();
  return news.filter(n => {
    const t = `${n.title || ""} ${n.summary || ""} ${n.stage || ""}`.toLowerCase();
    if (q === "seed") return t.includes("seed") || t.includes("pre-seed");
    if (q === "series a") return t.includes("series a");
    if (q === "acquired") return t.includes("acqui") || t.includes("buys");
    if (q === "ipo") return t.includes("ipo") || t.includes("public");
    if (q === "ai") return t.includes("ai") || t.includes("artificial") || t.includes("machine learning") || t.includes("llm");
    return t.includes(q);
  }).length;
}

// Mini thumbnail grid from news items
function FolderThumb({ news, color }) {
  const items = news.slice(0, 4);
  if (items.length < 2) {
    return (
      <div className="fav-thumb-single" style={{ background: `${color}22`, borderRadius: 6 }}>
        <span style={{ fontSize: 28 }}>📰</span>
      </div>
    );
  }
  return (
    <div className="fav-thumb-grid">
      {items.map((item, i) => {
        const img = item.image;
        const bg = `linear-gradient(145deg, ${color}cc, ${color}88)`;
        return (
          <div key={i} className="fav-thumb-cell" style={{ background: bg }}>
            {img && (
              <img src={img} alt="" loading="lazy" className="fav-thumb-img"
                onError={e => { e.target.style.display = "none"; }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FeedAllView({ news = [], onSelectFolder, onClose }) {
  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fav-overlay" onClick={onClose}>
      <div className="fav-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="fav-header">
          <div>
            <div className="fav-title">Browse All</div>
            <div className="fav-subtitle">Select a category to filter the feed</div>
          </div>
          <button className="fav-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Folder grid */}
        <div className="fav-grid">
          {FOLDER_DEFS.map(folder => {
            const count = getCount(folder.id, news);
            const filteredNews = folder.id === "Blogs" ? [] :
              folder.id === "All" ? news :
              news.filter(n => {
                const t = `${n.title || ""} ${n.summary || ""} ${n.stage || ""}`.toLowerCase();
                const q = folder.id.toLowerCase();
                if (q === "seed") return t.includes("seed") || t.includes("pre-seed");
                if (q === "series a") return t.includes("series a");
                if (q === "acquired") return t.includes("acqui") || t.includes("buys");
                if (q === "ipo") return t.includes("ipo") || t.includes("public");
                if (q === "ai") return t.includes("ai") || t.includes("artificial") || t.includes("llm");
                return t.includes(q);
              });

            return (
              <div
                key={folder.id}
                className="fav-folder"
                onClick={() => { onSelectFolder(folder.id); onClose(); }}
              >
                {/* Thumbnail */}
                <div className="fav-folder-thumb" style={{ borderColor: `${folder.color}33` }}>
                  {folder.id === "Blogs" ? (
                    <div className="fav-thumb-single" style={{ background: `${folder.color}22` }}>
                      <span style={{ fontSize: 28 }}>{folder.icon}</span>
                    </div>
                  ) : (
                    <FolderThumb news={filteredNews} color={folder.color} />
                  )}
                </div>

                {/* Labels */}
                <div className="fav-folder-label">{folder.label}</div>
                <div className="fav-folder-count" style={{ color: folder.color }}>
                  {count} {count === 1 ? "item" : "items"}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
