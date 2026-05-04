"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/* ── Topic fallbacks ── */
const TOPIC_IMAGES = {
  ai:         "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=400&fit=crop&auto=format",
  robot:      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop&auto=format",
  fintech:    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop&auto=format",
  crypto:     "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=400&fit=crop&auto=format",
  health:     "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop&auto=format",
  saas:       "https://images.unsplash.com/photo-1607706189992-eae578626c86?w=800&h=400&fit=crop&auto=format",
  software:   "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop&auto=format",
  cloud:      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop&auto=format",
  security:   "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=400&fit=crop&auto=format",
  climate:    "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=400&fit=crop&auto=format",
  energy:     "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=400&fit=crop&auto=format",
  space:      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=400&fit=crop&auto=format",
  food:       "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop&auto=format",
  startup:    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop&auto=format",
};

const KEYWORD_MAP = [
  [["artificial intelligence","openai","chatgpt","llm","gpt","gemini","claude","anthropic","genai"], "ai"],
  [["robot","robotics","automation","autonomous","humanoid","drone"], "robot"],
  [["fintech","payment","payroll","neobank","lending","insurtech"], "fintech"],
  [["crypto","bitcoin","ethereum","blockchain","web3","defi"], "crypto"],
  [["health","healthcare","clinical","patient","hospital","medtech"], "health"],
  [["saas","b2b","enterprise","workflow","crm"], "saas"],
  [["software","developer","open source","devtools"], "software"],
  [["cloud","aws","azure","infrastructure"], "cloud"],
  [["cybersecurity","security","privacy","encryption"], "security"],
  [["climate","carbon","emission","cleantech","esg"], "climate"],
  [["solar","wind","battery","renewable","energy","nuclear"], "energy"],
  [["space","satellite","rocket","launch","orbit","nasa"], "space"],
  [["food","restaurant","agriculture","farm"], "food"],
];

function detectTopicImage(text) {
  const lower = (text || "").toLowerCase();
  for (const [kws, topic] of KEYWORD_MAP) {
    if (kws.some(k => lower.includes(k))) return TOPIC_IMAGES[topic];
  }
  return TOPIC_IMAGES.startup;
}

function clean(raw = "") {
  return raw.replace(/\[…\]|\[\.\.\.\]/g, "").replace(/\s{2,}/g, " ").trim();
}

function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

function deriveStage(item) {
  const t = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
  if (t.includes("series c") || t.includes("series d")) return { label: "Late Stage", color: "#7c3aed" };
  if (t.includes("series b")) return { label: "Series B",   color: "#0369a1" };
  if (t.includes("series a")) return { label: "Series A",   color: "#0891b2" };
  if (t.includes("seed") || t.includes("pre-seed")) return { label: "Seed",     color: "#059669" };
  if (t.includes("acqui") || t.includes("buys"))    return { label: "Acquired", color: "#dc2626" };
  if (t.includes("ipo") || t.includes("public"))    return { label: "IPO",      color: "#d97706" };
  if (t.includes("launch"))                          return { label: "Launch",   color: "#e8522a" };
  return null;
}

function extractAmount(text = "") {
  const m = text.match(/\$[\d.,]+\s*[BMmKk](?:illion|B|M|K)?/);
  return m ? m[0] : null;
}

function deriveSlides(item) {
  const title   = clean(item.title || item.headline || "");
  const rawText = clean(`${item.summary || ""} ${item.text || ""}`);
  const stage   = deriveStage(item);
  const amount  = extractAmount(`${title} ${rawText}`);

  const sentences = rawText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && !s.toLowerCase().includes("cookie") && !s.includes("©"));

  const slides = [];
  slides.push({
    icon: "📰", label: "What happened", text: title,
    sub: [stage?.label, amount].filter(Boolean).join(" · ") || null,
    color: stage?.color || "#e8522a",
  });
  const labels = ["Key detail", "Context"];
  const icons  = ["💡", "🔍"];
  sentences.slice(0, 2).forEach((s, i) => {
    slides.push({ icon: icons[i], label: labels[i], text: s, sub: null, color: "#374151" });
  });
  return slides.slice(0, 3);
}

/* ═══════════════════════════════════════════════════════
   NEWS DRAWER — Production-grade bottom sheet
   Uses React portal → renders at document.body level
   so stacking context issues are impossible.
═══════════════════════════════════════════════════════ */
function NewsDrawer({ item, onClose, onResearch }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef(null);

  /* Mount → next tick → add visible class for animation */
  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  /* Lock body scroll while open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Keyboard: Escape closes */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 320);
  }, [onClose]);

  if (!mounted || typeof document === "undefined") return null;

  const title   = item.title || item.headline || "";
  const summary = clean(item.summary || item.text || "No summary available for this article.");
  const source  = item.source || "";
  const dateStr = fmtDate(item.date || item.publishedDate);
  const amount  = extractAmount(`${title} ${summary}`);
  const stage   = deriveStage(item);
  const imgUrl  = item.image || detectTopicImage(`${title} ${summary}`);

  const sheet = (
    <div
      className={`ndr-backdrop ${visible ? "ndr-backdrop-in" : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Article detail"
    >
      <div
        ref={sheetRef}
        className={`ndr-sheet ${visible ? "ndr-sheet-in" : ""}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Drag handle ── */}
        <div className="ndr-handle-wrap" onClick={handleClose}>
          <div className="ndr-handle" />
        </div>

        {/* ── Hero image ── */}
        <div className="ndr-hero">
          <img
            src={imgUrl}
            alt={title}
            className="ndr-hero-img"
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
          <div className="ndr-hero-gradient" />

          {/* Close button on image */}
          <button className="ndr-close" onClick={handleClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Stage + Amount chips on image */}
          <div className="ndr-hero-chips">
            {stage && (
              <span className="ndr-chip" style={{ background: stage.color }}>
                {stage.label}
              </span>
            )}
            {amount && (
              <span className="ndr-chip ndr-chip-amount">{amount}</span>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="ndr-body">
          {/* Source + Date */}
          <div className="ndr-byline">
            {source && <span className="ndr-source">{source}</span>}
            {dateStr && (
              <>
                <span className="ndr-dot-sep">·</span>
                <span className="ndr-date">{dateStr}</span>
              </>
            )}
          </div>

          {/* Headline */}
          <h2 className="ndr-title">{title}</h2>

          {/* Divider */}
          <div className="ndr-divider" />

          {/* Summary */}
          <p className="ndr-summary">{summary}</p>

          {/* CTA buttons */}
          <div className="ndr-actions">
            {item.url && (
              <a
                className="ndr-btn ndr-btn-primary"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
              >
                Read full article
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M7 17L17 7M7 7h10v10"/>
                </svg>
              </a>
            )}
            {onResearch && (
              <button
                className="ndr-btn ndr-btn-secondary"
                onClick={() => {
                  handleClose();
                  onResearch(item.researchQuery || title.split(" ")[0]);
                }}
              >
                Research company
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

/* ═══════════════════════════════════════════════════════
   NEWS CARD — Instagram POST style
═══════════════════════════════════════════════════════ */
export default function NewsCard({ item, rank, onResearch }) {
  const slides     = deriveSlides(item);
  const [active, setActive] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touchX = useRef(null);

  const imgUrl  = item.image || detectTopicImage(`${item.title || ""} ${item.summary || ""}`);
  const stage   = deriveStage(item);
  const source  = item.source || "";
  const dateStr = fmtDate(item.date || item.publishedDate);

  const goTo = (i) => setActive(Math.max(0, Math.min(slides.length - 1, i)));

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) goTo(active + (dx < 0 ? 1 : -1));
    touchX.current = null;
  };

  return (
    <>
      <div className="np-card">

        {/* ── IMAGE HEADER ── */}
        <div
          className="np-img-wrap"
          onClick={() => setDrawerOpen(true)}
          role="button"
          tabIndex={0}
          aria-label={`Read more: ${item.title}`}
          onKeyDown={e => e.key === "Enter" && setDrawerOpen(true)}
        >
          <img
            src={imgUrl}
            alt={item.title}
            className="np-img"
            loading="lazy"
            onError={e => { e.target.src = TOPIC_IMAGES.startup; }}
          />
          <div className="np-img-gradient" />

          <div className="np-img-top">
            <span className="np-rank">#{rank}</span>
            <div className="np-img-meta">
              {source && <span className="np-source-badge">{source}</span>}
              {stage && (
                <span className="np-stage-badge" style={{ background: stage.color }}>
                  {stage.label}
                </span>
              )}
            </div>
          </div>
          {dateStr && <span className="np-date-badge">{dateStr}</span>}
        </div>

        {/* ── SWIPEABLE INSIGHT SLIDES ── */}
        <div
          className="np-slides-wrap"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="np-slides-strip"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {slides.map((slide, i) => (
              <div key={i} className="np-slide">
                <div className="np-slide-label">
                  <span className="np-slide-icon">{slide.icon}</span>
                  {slide.label}
                </div>
                <div className="np-slide-text">{slide.text}</div>
                {slide.sub && (
                  <div className="np-slide-sub" style={{ color: slide.color }}>
                    {slide.sub}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── DOTS + NAV ── */}
        <div className="np-footer">
          <div className="np-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`np-dot${i === active ? " np-dot-on" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="np-nav-btns">
            {active > 0 && (
              <button className="np-nav-arrow" onClick={() => goTo(active - 1)} aria-label="Previous">‹</button>
            )}
            {active < slides.length - 1 ? (
              <button className="np-nav-arrow np-nav-next" onClick={() => goTo(active + 1)} aria-label="Next">›</button>
            ) : (
              <button className="np-read-btn" onClick={() => setDrawerOpen(true)}>
                Read full ↗
              </button>
            )}
          </div>
        </div>

      </div>

      {drawerOpen && (
        <NewsDrawer
          item={item}
          onClose={() => setDrawerOpen(false)}
          onResearch={onResearch}
        />
      )}
    </>
  );
}
