"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

let ReactMarkdown;
try { ReactMarkdown = require("react-markdown").default; } catch {}

/* Section icon map */
const SECTION_ICONS = {
  "intro":       "👋",  "overview":    "📋",  "funding":     "💰",
  "team":        "👥",  "product":     "⚡",  "market":      "📊",
  "competition": "🥊",  "strategy":    "🎯",  "growth":      "📈",
  "conclusion":  "🏁",  "interview":   "🎤",  "salary":      "💸",
  "placement":   "🎓",  "tips":        "💡",  "analysis":    "🔍",
};
function sectionIcon(label = "") {
  const lower = label.toLowerCase();
  for (const [k, v] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(k)) return v;
  }
  return "📌";
}

/* Reading progress bar */
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const handler = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return (
    <div className="bp-progress-track">
      <div className="bp-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* Single timeline section */
function TimelineSection({ section, index, isActive, onToggle }) {
  const icon = sectionIcon(section.label);
  const contentRef = useRef(null);

  return (
    <div className={`bp-timeline-item ${isActive ? "bp-tl-active" : ""}`}>
      {/* Timeline spine */}
      <div className="bp-tl-spine">
        <div className="bp-tl-node">{icon}</div>
        {/* Line below node (except last) */}
        <div className="bp-tl-line" />
      </div>

      {/* Content */}
      <div className="bp-tl-content">
        {/* Section header — tap to collapse/expand */}
        <button className="bp-tl-header" onClick={onToggle}>
          <div className="bp-tl-meta">
            <span className="bp-tl-label">{section.label}</span>
            <span className="bp-tl-read-time">{section.readTime} min</span>
          </div>
          <div className={`bp-tl-chevron ${isActive ? "bp-tl-chevron-open" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </button>

        {/* Section body */}
        {isActive && (
          <div className="bp-tl-body" ref={contentRef}>
            {ReactMarkdown ? (
              <ReactMarkdown>{section.content}</ReactMarkdown>
            ) : (
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{section.content}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogPostClient({ blog, sectionsParam }) {
  const router = useRouter();
  const [openIds, setOpenIds] = useState(new Set());

  useEffect(() => {
    // Open first section by default
    if (blog.sections.length > 0) {
      setOpenIds(new Set([blog.sections[0].id]));
    }
  }, [blog.id]);

  const totalReadTime = blog.sections.reduce((a, c) => a + c.readTime, 0);
  const openCount = openIds.size;
  const openReadTime = blog.sections
    .filter(s => openIds.has(s.id))
    .reduce((a, c) => a + c.readTime, 0);

  const toggleSection = (id) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll   = () => setOpenIds(new Set(blog.sections.map(s => s.id)));
  const collapseAll = () => setOpenIds(new Set());

  const imgUrl = blog.image ||
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=900&h=450&fit=crop&auto=format";

  return (
    <div className="bp-root">
      {/* ── Reading progress bar (sticky, very top) ── */}
      <ReadingProgress />

      {/* ── Sticky header bar ── */}
      <header className="bp-header">
        <button className="bp-back" onClick={() => router.back()} aria-label="Go back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="bp-header-brand">
          <span className="bp-header-logo">M</span>
          <span className="bp-header-miru">Miru Reads</span>
        </div>
        <div className="bp-header-right">
          {blog.readTime && (
            <span className="bp-header-time">{totalReadTime} min</span>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="bp-hero">
        <img src={imgUrl} alt={blog.headline} className="bp-hero-img"
          onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=900&h=450&fit=crop&auto=format"; }} />
        <div className="bp-hero-gradient" />
        <div className="bp-hero-content">
          {blog.category && (
            <span className="bp-category">{blog.category}</span>
          )}
          <h1 className="bp-headline">{blog.headline}</h1>
          {blog.description && (
            <p className="bp-description">{blog.description}</p>
          )}
        </div>
      </div>

      {/* ── Meta strip ── */}
      <div className="bp-meta-strip">
        <div className="bp-meta-item">
          <span className="bp-meta-icon">📖</span>
          <span>{totalReadTime} min full read</span>
        </div>
        <div className="bp-meta-dot" />
        <div className="bp-meta-item">
          <span className="bp-meta-icon">📌</span>
          <span>{blog.sections.length} sections</span>
        </div>
        <div className="bp-meta-dot" />
        <div className="bp-meta-item">
          <span className="bp-meta-icon">🔖</span>
          <span>Miru Reads</span>
        </div>
      </div>

      {/* ── Reading controls ── */}
      <div className="bp-controls">
        <div className="bp-controls-left">
          <span className="bp-controls-label">
            {openCount === 0 ? "No sections open"
              : `${openCount} open · ${openReadTime} min`}
          </span>
        </div>
        <div className="bp-controls-right">
          <button className="bp-ctrl-btn" onClick={expandAll}>Expand all</button>
          <button className="bp-ctrl-btn" onClick={collapseAll}>Collapse</button>
        </div>
      </div>

      {/* ── Timeline sections ── */}
      <div className="bp-timeline">
        {blog.sections.map((section, i) => (
          <TimelineSection
            key={section.id}
            section={section}
            index={i}
            isActive={openIds.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>

      {/* ── Footer CTA ── */}
      <div className="bp-footer">
        <button className="bp-footer-btn" onClick={() => router.back()}>
          ← Back to Feed
        </button>
        <button className="bp-footer-btn bp-footer-btn-orange" onClick={expandAll}>
          Read everything
        </button>
      </div>

    </div>
  );
}
