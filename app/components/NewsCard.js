"use client";
import { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────
   ACCENT PALETTE
───────────────────────────────────────────── */
const ACCENTS = [
  ["#FF6B00", "#FF9A3C"],
  ["#7C3AED", "#A78BFA"],
  ["#0369A1", "#38BDF8"],
  ["#065F46", "#34D399"],
  ["#9D174D", "#FB7185"],
  ["#92400E", "#FCD34D"],
];

/* ─────────────────────────────────────────────
   TOPIC → CURATED IMAGE
───────────────────────────────────────────── */
const TOPIC_IMAGES = {
  ai:         "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=320&h=220&fit=crop&auto=format",
  ml:         "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=320&h=220&fit=crop&auto=format",
  robot:      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=320&h=220&fit=crop&auto=format",
  fintech:    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=320&h=220&fit=crop&auto=format",
  crypto:     "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=320&h=220&fit=crop&auto=format",
  banking:    "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=320&h=220&fit=crop&auto=format",
  health:     "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=320&h=220&fit=crop&auto=format",
  biotech:    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=320&h=220&fit=crop&auto=format",
  pharma:     "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=320&h=220&fit=crop&auto=format",
  saas:       "https://images.unsplash.com/photo-1607706189992-eae578626c86?w=320&h=220&fit=crop&auto=format",
  software:   "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=320&h=220&fit=crop&auto=format",
  cloud:      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=320&h=220&fit=crop&auto=format",
  security:   "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=320&h=220&fit=crop&auto=format",
  climate:    "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=320&h=220&fit=crop&auto=format",
  energy:     "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=320&h=220&fit=crop&auto=format",
  ev:         "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=320&h=220&fit=crop&auto=format",
  space:      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=320&h=220&fit=crop&auto=format",
  logistics:  "https://images.unsplash.com/photo-1553413077-190dd305871c?w=320&h=220&fit=crop&auto=format",
  delivery:   "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=320&h=220&fit=crop&auto=format",
  ecommerce:  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=320&h=220&fit=crop&auto=format",
  retail:     "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=320&h=220&fit=crop&auto=format",
  edtech:     "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=320&h=220&fit=crop&auto=format",
  gaming:     "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=320&h=220&fit=crop&auto=format",
  media:      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=320&h=220&fit=crop&auto=format",
  realestate: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=320&h=220&fit=crop&auto=format",
  food:       "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=320&h=220&fit=crop&auto=format",
  defence:    "https://images.unsplash.com/photo-1547104442-9f0af903a55b?w=320&h=220&fit=crop&auto=format",
  startup:    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=320&h=220&fit=crop&auto=format",
};

const KEYWORD_MAP = [
  [["artificial intelligence","openai","chatgpt","llm","large language","gpt","gemini","claude","mistral","anthropic","generative","genai"], "ai"],
  [["machine learning","neural","deep learning","model training","diffusion"], "ml"],
  [["robot","robotics","automation","autonomous","humanoid","drone"], "robot"],
  [["fintech","payment","payroll","neobank","lending","credit","insurtech"], "fintech"],
  [["crypto","bitcoin","ethereum","blockchain","web3","defi","nft","token"], "crypto"],
  [["bank","banking","financial services","wealth management"], "banking"],
  [["health","healthcare","clinical","patient","hospital","telemedicine","medtech"], "health"],
  [["biotech","biology","gene","dna","crispr","drug discovery"], "biotech"],
  [["pharma","pharmaceutical","medicine","drug","fda","trials"], "pharma"],
  [["saas","b2b","enterprise software","workflow","crm","erp","api","dashboard"], "saas"],
  [["software","developer","coding","open source","devtools"], "software"],
  [["cloud","aws","azure","infrastructure","data center","storage"], "cloud"],
  [["cybersecurity","security","privacy","encryption","zero trust","hack"], "security"],
  [["climate","carbon","emission","sustainability","clean tech","esg"], "climate"],
  [["solar","wind","battery","renewable","energy storage","grid","nuclear"], "energy"],
  [["electric vehicle","ev","tesla","charging","automobile","car"], "ev"],
  [["space","satellite","rocket","launch","orbit","nasa","esa"], "space"],
  [["logistics","supply chain","warehouse","freight","shipping"], "logistics"],
  [["delivery","last mile","courier","food delivery","quick commerce"], "delivery"],
  [["ecommerce","e-commerce","marketplace","shopping","d2c"], "ecommerce"],
  [["retail","store","pos","consumer brand"], "retail"],
  [["edtech","education","learning","school","university","upskill","mooc"], "edtech"],
  [["gaming","game","esports","vr","ar","metaverse","xr"], "gaming"],
  [["media","content","streaming","podcast","creator","journalism"], "media"],
  [["real estate","proptech","property","housing","mortgage"], "realestate"],
  [["food","restaurant","agri","agriculture","farm","crop","nutrition"], "food"],
  [["defence","defense","military","government"], "defence"],
];

function detectTopicImage(text) {
  const lower = (text || "").toLowerCase();
  for (const [keywords, topic] of KEYWORD_MAP) {
    if (keywords.some(k => lower.includes(k))) return TOPIC_IMAGES[topic];
  }
  return TOPIC_IMAGES.startup;
}

/* ─────────────────────────────────────────────
   GEMINI — enrich a single news item
   Returns: { hook, segments, author, readTime }
   segments: [{ text, type }]  
   types: normal | key | stat | company | warning
───────────────────────────────────────────── */
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function enrichWithGemini(apiKey, item) {
  const headline = item.headline || item.title || "";
  const summary  = item.summary || item.text || "";
  const author   = item.author || null;
  const source   = item.source || "";

  const prompt = `You are a financial news editor. Given this startup news article, return a JSON object.

HEADLINE: ${headline}
SUMMARY: ${summary}
SOURCE: ${source}
AUTHOR: ${author || "unknown"}

Return ONLY valid JSON:
{
  "hook": "A single punchy sentence (max 15 words) — the most shocking/interesting fact. No fluff.",
  "author": "author full name or '${source} Editorial' if unknown",
  "readTime": estimated read time in seconds as a number (e.g. 45),
  "slide2": [
    { "text": "segment of text", "type": "normal|key|stat|company|warning" }
  ],
  "slide3": [
    { "text": "segment of text", "type": "normal|key|stat|company|warning" }
  ]
}

Rules for segments:
- Split the summary into logical phrase segments (3-10 words each)  
- "stat": numbers, amounts, percentages (e.g. "$10M", "40%", "Series B")
- "key": the single most important insight or action word
- "company": startup/investor/person names
- "warning": risks, challenges, competition
- "normal": everything else
- Together slide2 and slide3 segments should cover the full summary
- Keep original meaning, don't paraphrase`;

  try {
    const res = await fetch(`${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 800, responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) throw new Error("Gemini error");
    const data = await res.json();
    const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch { return null; }
}

/* ─────────────────────────────────────────────
   COLORED TEXT RENDERER
   Renders an array of { text, type } segments
   with typography matching slide 1's boldness
───────────────────────────────────────────── */
const SEGMENT_STYLES = {
  stat:    { color: "#fff",   fontWeight: 800, opacity: 1 },
  key:     { color: "#fff",   fontWeight: 800, opacity: 1, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" },
  company: { color: "#fff",   fontWeight: 700, opacity: 0.95, fontStyle: "italic" },
  warning: { color: "#FBBF24", fontWeight: 700, opacity: 0.95 },
  normal:  { color: "#fff",   fontWeight: 500, opacity: 0.72 },
};

function ColoredSegments({ segments = [] }) {
  if (!segments.length) return null;
  return (
    <p className="nc-seg-para">
      {segments.map((seg, i) => (
        <span key={i} style={SEGMENT_STYLES[seg.type] || SEGMENT_STYLES.normal}>
          {seg.text}{" "}
        </span>
      ))}
    </p>
  );
}

/* ─────────────────────────────────────────────
   SPLIT HEADLINE (slide 1)
───────────────────────────────────────────── */
function Headline({ text }) {
  if (!text) return null;
  const words = text.trim().split(" ");
  const cut = Math.min(Math.ceil(words.length * 0.55), 8);
  return (
    <h2 className="nc-h2">
      <span className="nc-h2-bright">{words.slice(0, cut).join(" ")}</span>
      {words.length > cut && <span className="nc-h2-dim"> {words.slice(cut).join(" ")}</span>}
    </h2>
  );
}

/* ─────────────────────────────────────────────
   SLIDE NAV ARROW (right edge)
───────────────────────────────────────────── */
function NavArrow({ slide, total, onNext, onPrev, accent }) {
  const isLast  = slide === total - 1;
  const isFirst = slide === 0;
  return (
    <div className="nc-nav-arrow-wrap">
      {!isFirst && (
        <button
          className="nc-nav-btn nc-nav-prev"
          style={{ borderColor: `${accent}60`, color: accent }}
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous slide"
        >‹</button>
      )}
      {!isLast && (
        <button
          className="nc-nav-btn nc-nav-next"
          style={{ background: accent, color: "#fff" }}
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next slide"
        >›</button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BYLINE — author · read time
───────────────────────────────────────────── */
function Byline({ author, readTime, date, accent }) {
  const mins = readTime ? Math.ceil(readTime / 60) : null;
  const dateStr = date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null;
  return (
    <div className="nc-byline" style={{ borderColor: `${accent}55` }}>
      {author && <span className="nc-byline-author">{author}</span>}
      {dateStr && <span className="nc-byline-sep">·</span>}
      {dateStr && <span className="nc-byline-date">{dateStr}</span>}
      {mins && <span className="nc-byline-sep">·</span>}
      {mins && <span className="nc-byline-read">{mins} min read</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN CARD
═══════════════════════════════════════════ */
export default function NewsCard({ item, rank, onResearch, onViewPage, accentIdx = 0, geminiKey }) {
  const [slide, setSlide]       = useState(0);
  const [enriched, setEnriched] = useState(null);
  const [loading, setLoading]   = useState(false);
  const TOTAL = 3;
  const [c1, c2] = ACCENTS[accentIdx % ACCENTS.length];

  /* ── Fetch Gemini enrichment once on mount ── */
  useEffect(() => {
    if (!geminiKey || enriched || loading) return;
    setLoading(true);
    enrichWithGemini(geminiKey, item)
      .then(data => setEnriched(data))
      .finally(() => setLoading(false));
  }, [geminiKey]); // eslint-disable-line

  /* ── touch swipe ── */
  const tx = useRef(null); const ty = useRef(null); const swiping = useRef(false);
  const onTS = (e) => { tx.current = e.touches[0].clientX; ty.current = e.touches[0].clientY; swiping.current = false; };
  const onTM = (e) => { if (tx.current === null) return; if (Math.abs(e.touches[0].clientX - tx.current) > Math.abs(e.touches[0].clientY - ty.current) + 5) swiping.current = true; };
  const onTE = (e) => { if (!swiping.current) return; const d = e.changedTouches[0].clientX - tx.current; if (d < -40 && slide < TOTAL - 1) setSlide(s => s + 1); if (d > 40 && slide > 0) setSlide(s => s - 1); tx.current = null; };
  const mx = useRef(null);
  const onMD = (e) => { mx.current = e.clientX; };
  const onMU = (e) => { if (mx.current === null) return; const d = e.clientX - mx.current; if (Math.abs(d) > 50) { if (d < 0 && slide < TOTAL - 1) setSlide(s => s + 1); if (d > 0 && slide > 0) setSlide(s => s - 1); } mx.current = null; };

  /* ── data ── */
  const searchText = `${item.headline || item.title || ""} ${item.summary || ""} ${item.source || ""}`;
  const imageUrl   = item.image || item.imageUrl || detectTopicImage(searchText);
  const initial    = ((item.startup || item.researchQuery || item.title || "S")[0]).toUpperCase();
  const meta       = [item.stage, item.amount, item.source].filter(Boolean).join("  ·  ");
  const date       = item.date || item.publishedDate;

  /* ── enriched data with raw fallbacks ── */
  const hook    = enriched?.hook || item.headline || item.title || "";
  const author  = enriched?.author || item.author || item.source || null;
  const readTime= enriched?.readTime || null;
  const slide2segs = enriched?.slide2 || null;
  const slide3segs = enriched?.slide3 || null;

  // Fallback: split raw summary for unenriched state
  const rawSummary = item.summary || item.text || "";
  const half = rawSummary.lastIndexOf(" ", Math.floor(rawSummary.length / 2));
  const rawA = rawSummary.slice(0, half > 0 ? half : rawSummary.length).trim();
  const rawB = half > 0 ? rawSummary.slice(half).trim() : "";

  const nextSlide = () => { if (slide < TOTAL - 1) setSlide(s => s + 1); };
  const prevSlide = () => { if (slide > 0) setSlide(s => s - 1); };

  return (
    <div
      className="nc-card"
      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
      onMouseDown={onMD} onMouseUp={onMU}
      style={{ userSelect: "none" }}
    >
      <div className="nc-clip">
        <div className="nc-strip" style={{ transform: `translateX(${-slide * 100}%)` }}>

          {/* ══ SLIDE 1 — HOOK ══ */}
          <div className="nc-slide nc-s1" style={{ background: `linear-gradient(145deg, ${c1}, ${c2})` }}>
            <span className="nc-rank">{rank}</span>

            <div className="nc-s1-left">
              <Headline text={hook} />
              {meta && <p className="nc-meta">{meta}</p>}
              <Byline author={author} readTime={readTime} date={date} accent={c1} />
            </div>

            <div className="nc-s1-right">
              {imageUrl && (
                <img className="nc-img" src={imageUrl} alt="" loading="lazy"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
              <div className="nc-img-fallback" style={{ background: `linear-gradient(160deg, ${c1}99, ${c2}99)` }}>
                <span className="nc-img-letter">{initial}</span>
                <svg className="nc-hatch" viewBox="0 0 60 220" preserveAspectRatio="none">
                  <line x1="0" y1="0"  x2="60" y2="220" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                  <line x1="20" y1="0" x2="60" y2="120" stroke="rgba(255,255,255,0.1)"  strokeWidth="1"/>
                  <line x1="60" y1="0" x2="0"  y2="220" stroke="rgba(255,255,255,0.1)"  strokeWidth="1"/>
                  <line x1="40" y1="0" x2="60" y2="60"  stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                </svg>
              </div>
            </div>

            <NavArrow slide={slide} total={TOTAL} onNext={nextSlide} onPrev={prevSlide} accent="#fff" />
          </div>

          {/* ══ SLIDE 2 — SUMMARY A (styled) ══ */}
          <div className="nc-slide nc-s2" style={{ background: `linear-gradient(160deg, ${c1}dd, ${c2}cc)` }}>
            <span className="nc-rank">{rank}</span>

            <div className="nc-s2-inner">
              <p className="nc-slide-chip" style={{ background: `${c1}50`, borderColor: `${c1}80` }}>Summary · 1 of 2</p>

              {loading ? (
                <div className="nc-loading">
                  <span className="nc-pulse" /><span className="nc-pulse" /><span className="nc-pulse" />
                </div>
              ) : slide2segs ? (
                <ColoredSegments segments={slide2segs} />
              ) : (
                <p className="nc-seg-para"><span style={SEGMENT_STYLES.normal}>{rawA || rawSummary}</span></p>
              )}

              <Byline author={author} readTime={readTime} date={date} accent="#fff" />
            </div>

            <NavArrow slide={slide} total={TOTAL} onNext={nextSlide} onPrev={prevSlide} accent="#fff" />
          </div>

          {/* ══ SLIDE 3 — SUMMARY B + ACTIONS ══ */}
          <div className="nc-slide nc-s3" style={{ background: `linear-gradient(160deg, ${c2}dd, ${c1}bb)` }}>
            <span className="nc-rank">{rank}</span>

            <div className="nc-s2-inner">
              <p className="nc-slide-chip" style={{ background: `${c2}50`, borderColor: `${c2}80` }}>Summary · 2 of 2</p>

              {loading ? (
                <div className="nc-loading">
                  <span className="nc-pulse" /><span className="nc-pulse" /><span className="nc-pulse" />
                </div>
              ) : slide3segs ? (
                <ColoredSegments segments={slide3segs} />
              ) : (
                <p className="nc-seg-para"><span style={SEGMENT_STYLES.normal}>{rawB || "Read more on source."}</span></p>
              )}
            </div>

            <div className="nc-s3-actions">
              <button className="nc-cta" style={{ background: "rgba(255,255,255,0.22)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
                onClick={(e) => { e.stopPropagation(); onResearch(item.researchQuery || item.startup || item.title); }}>
                Research →
              </button>
              <button className="nc-ghost-light"
                onClick={(e) => { e.stopPropagation(); onViewPage(); }}>
                View article ↗
              </button>
            </div>

            <NavArrow slide={slide} total={TOTAL} onNext={nextSlide} onPrev={prevSlide} accent="#fff" />
          </div>

        </div>
      </div>

      {/* ── Dots ── */}
      <div className="nc-dots">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button key={i}
            className={`nc-dot${i === slide ? " nc-dot-on" : ""}`}
            style={i === slide ? { background: c1, width: "18px" } : {}}
            onClick={(e) => { e.stopPropagation(); setSlide(i); }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
