"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { dummyBlogs } from "@/lib/blogs";

/* ─────────────────────────────────────────────────────────
   STORY VIEWER — Full-screen viewer (portal-rendered)
───────────────────────────────────────────────────────── */
const STORY_DURATION = 6000;

const CATEGORY_COLORS = [
  "#e8522a","#7c3aed","#0369a1","#059669","#d97706","#dc2626"
];

function StoryViewer({ blogs, startIndex, onClose }) {
  const [idx, setIdx]       = useState(startIndex);
  const [progress, setProg] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const progRef = useRef(null);

  const blog  = blogs[idx];
  const total = blogs.length;

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  const advance = useCallback((dir) => {
    clearInterval(progRef.current);
    const next = idx + dir;
    if (next < 0 || next >= total) { handleClose(); return; }
    setIdx(next);
  }, [idx, total, handleClose]);

  useEffect(() => {
    setProg(0);
    const step  = 50;
    const ticks = STORY_DURATION / step;
    let   tick  = 0;
    progRef.current = setInterval(() => {
      tick++;
      setProg(tick / ticks);
      if (tick >= ticks) advance(1);
    }, step);
    return () => clearInterval(progRef.current);
  }, [idx]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") advance(1);
      if (e.key === "ArrowLeft")  advance(-1);
      if (e.key === "Escape")     handleClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [advance, handleClose]);

  if (!mounted || !blog) return null;

  const imgUrl = blog.image ||
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=1200&fit=crop&auto=format";

  const frame = (
    <div
      className={`sv-overlay ${visible ? "sv-overlay-in" : ""}`}
      onClick={handleClose}
    >
      <div className="sv-frame" onClick={e => e.stopPropagation()}>

        {/* Progress bars */}
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

        {/* Header */}
        <div className="sv-header">
          <div className="sv-author">
            <div className="sv-avatar">M</div>
            <div>
              <div className="sv-author-name">Miru Reads</div>
              <div className="sv-author-sub">{blog.readTime || 8} min read</div>
            </div>
          </div>
          <button className="sv-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {/* Background */}
        <img src={imgUrl} alt={blog.headline} className="sv-bg-img"
          onError={e => { e.currentTarget.style.display = "none"; }} />
        <div className="sv-bg-gradient" />

        {/* Tap zones */}
        <div className="sv-tap sv-tap-left"  onClick={() => advance(-1)} />
        <div className="sv-tap sv-tap-right" onClick={() => advance(1)}  />

        {/* Content */}
        <div className="sv-content">
          {blog.category && (
            <span className="sv-category">{blog.category}</span>
          )}
          <h2 className="sv-title">{blog.headline}</h2>
          {blog.description && (
            <p className="sv-desc">{blog.description}</p>
          )}
          {blog.id && (
            <a className="sv-read-btn" href={`/blogs/${blog.id}`}
              onClick={e => e.stopPropagation()}>
              Read full article →
            </a>
          )}
        </div>

        {/* Navigation dots */}
        <div className="sv-dots">
          {blogs.map((_, i) => (
            <div key={i}
              className={`sv-dot ${i === idx ? "sv-dot-active" : ""}`}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
            />
          ))}
        </div>

      </div>
    </div>
  );

  return createPortal(frame, document.body);
}

/* ─────────────────────────────────────────────────────────
   BLOG CARD — Magazine cover tile (replaces circles)
   Rectangular card with image + gradient + title overlay
   80px × 118px — thumb-sized, horizontal scroll
───────────────────────────────────────────────────────── */
function BlogCard({ blog, index, hasRead, onClick }) {
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const imgUrl = blog.image ||
    `https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=400&fit=crop&auto=format`;

  const shortTitle = (blog.headline || "")
    .split(" ")
    .slice(0, 5)
    .join(" ");

  return (
    <div
      className={`bk-card ${hasRead ? "bk-read" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
      style={{ "--bk-color": color }}
    >
      {/* Unread top bar */}
      {!hasRead && <div className="bk-unread-bar" />}

      {/* Image */}
      <img
        src={imgUrl}
        alt={blog.headline}
        className="bk-img"
        loading="lazy"
        onError={e => { e.currentTarget.style.display = "none"; }}
      />

      {/* Gradient + text overlay */}
      <div className="bk-gradient" />
      <div className="bk-content">
        <span className="bk-badge">BLOG</span>
        <div className="bk-title">{shortTitle}</div>
        <div className="bk-meta">{blog.readTime || 8} min</div>
      </div>

      {/* Read time badge — bottom right */}
      {!hasRead && <div className="bk-new-dot" />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BLOG STORIES — Main export
   Header + horizontal card scroll + StoryViewer
───────────────────────────────────────────────────────── */
export default function BlogStories({ blogs = dummyBlogs }) {
  const [viewingIdx, setViewingIdx] = useState(null);
  // ⚠️ Always start empty — populate from localStorage in useEffect only (client-side)
  // This prevents SSR/client hydration mismatch
  const [readSet, setReadSet] = useState(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("miru_read_blogs");
      if (raw) setReadSet(new Set(JSON.parse(raw)));
    } catch {}
  }, []);



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
        {/* Horizontal blog card scroll — no header, edge padding via CSS */}
        <div className="bs-cards-row">
          {blogs.map((blog, i) => (
            <BlogCard
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
