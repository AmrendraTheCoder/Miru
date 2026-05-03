"use client";
import { useState, useRef } from "react";

/* ─────────────────────────────────────────────
   ACCENT PALETTE  (cycling by card index)
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
   TOPIC → CURATED IMAGE MAP
   All Unsplash permanent URLs (no API key needed).
   w=320&h=200&fit=crop&auto=format keeps them small & fast.
───────────────────────────────────────────── */
const TOPIC_IMAGES = {
  ai:         "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=320&h=200&fit=crop&auto=format",
  ml:         "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=320&h=200&fit=crop&auto=format",
  robot:      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=320&h=200&fit=crop&auto=format",
  fintech:    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=320&h=200&fit=crop&auto=format",
  crypto:     "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=320&h=200&fit=crop&auto=format",
  banking:    "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=320&h=200&fit=crop&auto=format",
  health:     "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=320&h=200&fit=crop&auto=format",
  biotech:    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=320&h=200&fit=crop&auto=format",
  pharma:     "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=320&h=200&fit=crop&auto=format",
  saas:       "https://images.unsplash.com/photo-1607706189992-eae578626c86?w=320&h=200&fit=crop&auto=format",
  software:   "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=320&h=200&fit=crop&auto=format",
  cloud:      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=320&h=200&fit=crop&auto=format",
  security:   "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=320&h=200&fit=crop&auto=format",
  climate:    "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=320&h=200&fit=crop&auto=format",
  energy:     "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=320&h=200&fit=crop&auto=format",
  ev:         "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=320&h=200&fit=crop&auto=format",
  space:      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=320&h=200&fit=crop&auto=format",
  logistics:  "https://images.unsplash.com/photo-1553413077-190dd305871c?w=320&h=200&fit=crop&auto=format",
  delivery:   "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=320&h=200&fit=crop&auto=format",
  ecommerce:  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=320&h=200&fit=crop&auto=format",
  retail:     "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=320&h=200&fit=crop&auto=format",
  edtech:     "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=320&h=200&fit=crop&auto=format",
  gaming:     "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=320&h=200&fit=crop&auto=format",
  media:      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=320&h=200&fit=crop&auto=format",
  realestate: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=320&h=200&fit=crop&auto=format",
  food:       "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=320&h=200&fit=crop&auto=format",
  agri:       "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=320&h=200&fit=crop&auto=format",
  defence:    "https://images.unsplash.com/photo-1547104442-9f0af903a55b?w=320&h=200&fit=crop&auto=format",
  startup:    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=320&h=200&fit=crop&auto=format",
};

/* keyword → topic key */
const KEYWORD_MAP = [
  [["artificial intelligence","openai","chatgpt","llm","large language","gpt","gemini","claude","mistral","anthropic","generative","genai"], "ai"],
  [["machine learning","neural","deep learning","model training","diffusion","stable diffusion"], "ml"],
  [["robot","robotics","automation","autonomous","humanoid","drone"], "robot"],
  [["fintech","payment","payroll","neobank","lending","credit","insurance","insurtech","wealthtech"], "fintech"],
  [["crypto","bitcoin","ethereum","blockchain","web3","defi","nft","token","solana"], "crypto"],
  [["bank","banking","financial services","wealth management"], "banking"],
  [["health","healthcare","clinical","patient","hospital","telemedicine","mental health","therapy","medtech"], "health"],
  [["biotech","biology","gene","dna","crispr","drug discovery","life science"], "biotech"],
  [["pharma","pharmaceutical","medicine","drug","fda","trials"], "pharma"],
  [["saas","b2b","enterprise software","workflow","crm","erp","api","dashboard"], "saas"],
  [["software","developer","coding","open source","platform","devtools"], "software"],
  [["cloud","aws","azure","infrastructure","data center","storage"], "cloud"],
  [["cybersecurity","security","privacy","encryption","zero trust","hack","breach"], "security"],
  [["climate","carbon","emission","sustainability","clean tech","esg"], "climate"],
  [["solar","wind","battery","renewable","energy storage","grid","nuclear"], "energy"],
  [["electric vehicle","ev","tesla","charging","battery","automobile","car"], "ev"],
  [["space","satellite","rocket","launch","orbit","nasa","esa"], "space"],
  [["logistics","supply chain","warehouse","freight","shipping","fulfilment"], "logistics"],
  [["delivery","last mile","courier","food delivery","quick commerce"], "delivery"],
  [["ecommerce","e-commerce","marketplace","shopping","d2c","direct to consumer"], "ecommerce"],
  [["retail","store","pos","consumer","brand"], "retail"],
  [["edtech","education","learning","school","university","upskill","mooc"], "edtech"],
  [["gaming","game","esports","vr","ar","metaverse","xr"], "gaming"],
  [["media","content","streaming","podcast","creator","journalism","news"], "media"],
  [["real estate","proptech","property","housing","mortgage","reit"], "realestate"],
  [["food","restaurant","agri","agriculture","farm","crop","nutrition"], "food"],
  [["defence","defense","military","government","geopolitical"], "defence"],
];

function detectTopicImage(text) {
  const lower = (text || "").toLowerCase();
  for (const [keywords, topic] of KEYWORD_MAP) {
    if (keywords.some(k => lower.includes(k))) return TOPIC_IMAGES[topic];
  }
  return TOPIC_IMAGES.startup; // default
}


/* ── Tappable dot indicator ── */
function Dots({ total, active, goto }) {
  return (
    <div className="nc-dots">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          className={`nc-dot${i === active ? " nc-dot-on" : ""}`}
          onClick={(e) => { e.stopPropagation(); goto(i); }}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

/* ── Split headline: first half = bright, second = dim ── */
function Headline({ text }) {
  if (!text) return null;
  const words = text.trim().split(" ");
  const cut = Math.min(Math.ceil(words.length * 0.55), 8);
  return (
    <h2 className="nc-h2">
      <span className="nc-h2-bright">{words.slice(0, cut).join(" ")}</span>
      {words.length > cut && (
        <span className="nc-h2-dim"> {words.slice(cut).join(" ")}</span>
      )}
    </h2>
  );
}

export default function NewsCard({ item, rank, onResearch, onViewPage, accentIdx = 0 }) {
  const [slide, setSlide] = useState(0);
  const TOTAL = 3;
  const [c1, c2] = ACCENTS[accentIdx % ACCENTS.length];

  /* ── touch ── */
  const tx = useRef(null);
  const ty = useRef(null);
  const swiping = useRef(false);

  const onTS = (e) => { tx.current = e.touches[0].clientX; ty.current = e.touches[0].clientY; swiping.current = false; };
  const onTM = (e) => {
    if (tx.current === null) return;
    if (Math.abs(e.touches[0].clientX - tx.current) > Math.abs(e.touches[0].clientY - ty.current) + 5) swiping.current = true;
  };
  const onTE = (e) => {
    if (!swiping.current) return;
    const d = e.changedTouches[0].clientX - tx.current;
    if (d < -40 && slide < TOTAL - 1) setSlide(s => s + 1);
    if (d >  40 && slide > 0)         setSlide(s => s - 1);
    tx.current = null;
  };

  /* ── mouse drag ── */
  const mx = useRef(null);
  const onMD = (e) => { mx.current = e.clientX; };
  const onMU = (e) => {
    if (mx.current === null) return;
    const d = e.clientX - mx.current;
    if (Math.abs(d) > 50) {
      if (d < 0 && slide < TOTAL - 1) setSlide(s => s + 1);
      if (d > 0 && slide > 0)         setSlide(s => s - 1);
    }
    mx.current = null;
  };

  /* ── data ── */
  const summary = item.summary || item.text || "";
  const half = summary.lastIndexOf(" ", Math.floor(summary.length / 2));
  const sumA = summary.slice(0, half > 0 ? half : summary.length).trim();
  const sumB = half > 0 ? summary.slice(half).trim() : "";

  // Image priority: 1) Exa article image  2) topic-detected curated image  3) CSS fallback
  const searchText = `${item.headline || item.title || ""} ${item.summary || ""} ${item.source || ""}`;
  const imageUrl = item.image || item.imageUrl || detectTopicImage(searchText);
  const companyInitial = ((item.startup || item.researchQuery || item.title || "S")[0]).toUpperCase();
  const meta = [item.stage, item.amount, item.source].filter(Boolean).join("  ·  ");

  return (
    <div
      className="nc-card"
      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
      onMouseDown={onMD} onMouseUp={onMU}
      style={{ userSelect: "none" }}
    >
      {/* ─── SLIDING STRIP ─── */}
      <div className="nc-clip">
        <div className="nc-strip" style={{ transform: `translateX(${-slide * 100}%)` }}>

          {/* ══ SLIDE 1 — HOOK ══ */}
          <div
            className="nc-slide nc-s1"
            style={{ background: `linear-gradient(145deg, ${c1}, ${c2})` }}
          >
            {/* rank */}
            <span className="nc-rank">{rank}</span>

            {/* LEFT 70% — headline */}
            <div className="nc-s1-left">
              <Headline text={item.headline || item.title} />
              {meta && <p className="nc-meta">{meta}</p>}
            </div>

            {/* RIGHT 30% — image or abstract fallback */}
            <div className="nc-s1-right">
              {imageUrl ? (
                <img
                  className="nc-img"
                  src={imageUrl}
                  alt=""
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.setAttribute("data-fallback", "1");
                  }}
                />
              ) : null}
              {/* Fallback shown when no image URL or image fails */}
              <div className="nc-img-fallback" style={{ background: `linear-gradient(160deg, ${c1}99, ${c2}99)` }}>
                <span className="nc-img-letter">{companyInitial}</span>
                {/* crosshatch lines */}
                <svg className="nc-hatch" viewBox="0 0 60 150" preserveAspectRatio="none">
                  <line x1="0" y1="0"  x2="60" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                  <line x1="15" y1="0" x2="60" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  <line x1="-15" y1="50" x2="60" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  <line x1="30" y1="0" x2="60" y2="50"  stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                  <line x1="60" y1="0" x2="0" y2="150"  stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  <line x1="60" y1="30" x2="10" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                </svg>
              </div>
            </div>
          </div>

          {/* ══ SLIDE 2 — SUMMARY A ══ */}
          <div className="nc-slide nc-s2">
            <p className="nc-slide-tag" style={{ color: c1 }}>Summary  <span className="nc-slide-counter">1 of 2</span></p>
            <p className="nc-body">{sumA || summary || "No summary available."}</p>
          </div>

          {/* ══ SLIDE 3 — SUMMARY B + ACTIONS ══ */}
          <div className="nc-slide nc-s3">
            <p className="nc-slide-tag" style={{ color: c1 }}>Summary  <span className="nc-slide-counter">2 of 2</span></p>
            <p className="nc-body">{sumB || "Read the full article for more details."}</p>
            <div className="nc-actions">
              <button
                className="nc-cta"
                style={{ background: c1 }}
                onClick={(e) => { e.stopPropagation(); onResearch(item.researchQuery || item.startup || item.title); }}
              >Research →</button>
              <button
                className="nc-ghost"
                onClick={(e) => { e.stopPropagation(); onViewPage(); }}
              >View page ↗</button>
            </div>
          </div>

        </div>
      </div>

      {/* ─── DOTS ─── */}
      <Dots total={TOTAL} active={slide} goto={setSlide} />
    </div>
  );
}
