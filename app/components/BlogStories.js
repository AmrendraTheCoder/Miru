"use client";
import { useState, useEffect, useRef } from "react";
import { dummyBlogs } from "@/lib/blogs";

/* ─────────────────────────────────────────────────────────
   STORY VIEWER — full-screen Instagram Stories overlay
───────────────────────────────────────────────────────── */
const STORY_DURATION = 5000; // ms per auto-advance

function StoryViewer({ blogs, startIndex, onClose }) {
  const [idx, setIdx]       = useState(startIndex);
  const [progress, setProg] = useState(0);
  const timerRef            = useRef(null);
  const progRef             = useRef(null);

  const blog = blogs[idx];
  const total = blogs.length;

  // Auto-advance with progress
  useEffect(() => {
    setProg(0);
    const step  = 50;          // update every 50ms
    const ticks = STORY_DURATION / step;
    let   tick  = 0;

    progRef.current = setInterval(() => {
      tick++;
      setProg(tick / ticks);
      if (tick >= ticks) advance(1);
    }, step);

    return () => clearInterval(progRef.current);
  }, [idx]);

  const advance = (dir) => {
    clearInterval(progRef.current);
    const next = idx + dir;
    if (next < 0 || next >= total) { onClose(); return; }
    setIdx(next);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") advance(1);
      if (e.key === "ArrowLeft")  advance(-1);
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [idx]);

  if (!blog) return null;

  const imgUrl = blog.image ||
    `https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=1200&fit=crop&auto=format`;

  return (
    <div className="sv-overlay" onClick={onClose}>
      <div className="sv-frame" onClick={e => e.stopPropagation()}>

        {/* ── Progress bars ── */}
        <div className="sv-progress-row">
          {blogs.map((_, i) => (
            <div key={i} className="sv-prog-track">
              <div
                className="sv-prog-fill"
                style={{
                  width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Top header ── */}
        <div className="sv-header">
          <div className="sv-author">
            <div className="sv-avatar">M</div>
            <div>
              <div className="sv-author-name">Miru Reads</div>
              <div className="sv-author-sub">{blog.readTime || 10} min read</div>
            </div>
          </div>
          <button className="sv-close" onClick={onClose} aria-label="Close story">✕</button>
        </div>

        {/* ── Background image ── */}
        <img src={imgUrl} alt={blog.headline} className="sv-bg-img"
          onError={e => { e.target.style.display = "none"; }} />
        <div className="sv-bg-gradient" />

        {/* ── Tap zones ── */}
        <div className="sv-tap sv-tap-left"  onClick={() => advance(-1)} />
        <div className="sv-tap sv-tap-right" onClick={() => advance(1)}  />

        {/* ── Content ── */}
        <div className="sv-content">
          {blog.category && (
            <span className="sv-category">{blog.category}</span>
          )}
          <h2 className="sv-title">{blog.headline}</h2>
          {blog.description && (
            <p className="sv-desc">{blog.description}</p>
          )}
          {blog.id && (
            <a
              className="sv-read-btn"
              href={`/blogs/${blog.id}`}
              onClick={e => e.stopPropagation()}
            >
              Read full article →
            </a>
          )}
        </div>

        {/* ── Story dot indicators ── */}
        <div className="sv-dots">
          {blogs.map((_, i) => (
            <div
              key={i}
              className={`sv-dot ${i === idx ? "sv-dot-active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STORY BUBBLE — circle avatar like Instagram
───────────────────────────────────────────────────────── */
function StoryBubble({ blog, index, hasRead, onClick }) {
  const GRADIENTS = [
    "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    "linear-gradient(45deg,#4158d0,#c850c0,#ffcc70)",
    "linear-gradient(45deg,#0093e9,#80d0c7)",
    "linear-gradient(45deg,#8ec5fc,#e0c3fc)",
    "linear-gradient(45deg,#f5af19,#f12711)",
    "linear-gradient(45deg,#43e97b,#38f9d7)",
  ];
  const grad = GRADIENTS[index % GRADIENTS.length];

  return (
    <div className="sb-wrap" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}>

      <div className={`sb-ring ${hasRead ? "sb-ring-read" : ""}`}
        style={hasRead ? undefined : { background: grad }}>
        <div className="sb-inner">
          {blog.image ? (
            <img src={blog.image} alt={blog.headline} className="sb-img"
              onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div className="sb-initial" style={{ background: grad }}>
              {(blog.headline || "B")[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="sb-label">{(blog.headline || "").split(" ").slice(0, 3).join(" ")}…</div>

      {!hasRead && <div className="sb-unread-dot" />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BLOG STORIES — main export
───────────────────────────────────────────────────────── */
export default function BlogStories({ blogs = dummyBlogs }) {
  const [viewingIdx, setViewingIdx] = useState(null);
  const [readSet,    setReadSet]    = useState(() => {
    try {
      const raw = localStorage.getItem("miru_read_blogs");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  const markRead = (id) => {
    setReadSet(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("miru_read_blogs", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const openStory = (i) => {
    markRead(blogs[i]?.id);
    setViewingIdx(i);
  };

  return (
    <>
      <div className="bs-wrap">
        {/* Header */}
        <div className="bs-header-center">
          <span className="bs-title">Miru Reads</span>
          <span className="bs-subtitle"> · Analysis, playbooks &amp; placement intel</span>
        </div>

        {/* Horizontal story bubbles */}
        <div className="bs-bubbles-row">
          {blogs.map((blog, i) => (
            <StoryBubble
              key={blog.id || i}
              blog={blog}
              index={i}
              hasRead={readSet.has(blog.id)}
              onClick={() => openStory(i)}
            />
          ))}
        </div>
      </div>

      {viewingIdx !== null && (
        <StoryViewer
          blogs={blogs}
          startIndex={viewingIdx}
          onClose={() => setViewingIdx(null)}
        />
      )}
    </>
  );
}
