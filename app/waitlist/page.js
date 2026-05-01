"use client";

import { useState, useEffect, useRef } from "react";

const FEATURES = [
  { icon: "📊", label: "Campus Time-Machine", desc: "5-year placement history broken down by college — PPOs, placed, and unplaced ratios on a timeline." },
  { icon: "🕵️", label: "Inside Reality Tracker", desc: "Anonymous, area-wise employee reviews and a secure bias-reporting system. Know what it's really like after day one." },
  { icon: "🎤", label: "Verified Interview Intel", desc: "Crowdsourced, recently asked interview questions — so you walk in knowing what to actually expect." },
  { icon: "💰", label: "AI Salary Predictor", desc: "Upload your resume; our AI projects your starting salary and peak earning potential with real market data." },
  { icon: "⚡", label: "Auto-Pilot Applications", desc: "Curated job feeds matched to your profile, plus one-click AI-generated answers for descriptive questions." },
  { icon: "🏆", label: "Recruiter Merit Showcase", desc: "Top job seekers spotlighted directly to recruiters with verified skillsets and insider guidelines." },
];

const STATS = [
  { value: "5,600+", label: "Companies Tracked" },
  { value: "200+", label: "YC Startups" },
  { value: "12K+", label: "Research Queries" },
  { value: "Free", label: "Always" },
];

const TICKER_ITEMS = [
  "Campus Placement Time-Machine",
  "Verified Interview Intel",
  "AI Salary Predictor",
  "Inside Reality Tracker",
  "Auto-Pilot Applications",
  "Recruiter Merit Showcase",
  "YC Startup Research",
  "Funding Intelligence",
];

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student / Professional");
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMsg("You're on the list! Check your inbox.");
        setEmail("");
      } else {
        setStatus("error");
        setMsg(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)", color: "var(--text)", overflowX: "hidden" }}>
      <style>{`
        .wl-header { position: sticky; top: 0; z-index: 100; background: var(--orange); padding: 8px 20px; }
        .wl-header-inner { max-width: 960px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .wl-logo { color: #fff; font-weight: 800; font-size: 15px; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .wl-logo-box { background: #fff; color: var(--orange); font-weight: 900; font-size: 12px; padding: 2px 6px; border-radius: 3px; }
        .wl-back { font-size: 12px; color: rgba(255,255,255,0.85); text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 4px; transition: color 0.15s; }
        .wl-back:hover { color: #fff; }

        /* Ticker */
        .wl-ticker { background: linear-gradient(90deg,#a03412,#82280c); padding: 9px 0; overflow: hidden; }
        .wl-ticker-track { display: flex; width: max-content; animation: wl-scroll 30s linear infinite; }
        .wl-ticker-track:hover { animation-play-state: paused; }
        .wl-ticker-item { font-size: 9px; font-weight: 500; color: rgba(255,255,255,0.82); padding: 0 28px; letter-spacing: 0.6px; text-transform: uppercase; white-space: nowrap; }
        .wl-ticker-item::before { content: "✦"; margin-right: 28px; color: rgba(255,255,255,0.3); font-size: 8px; }
        @keyframes wl-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* Hero */
        .wl-hero { padding: 60px 20px 40px; text-align: center; background: radial-gradient(circle at 50% 0%, rgba(255,102,0,0.07) 0%, transparent 65%); }
        .wl-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,102,0,0.1); color: var(--orange); font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; margin-bottom: 24px; border: 1px solid rgba(255,102,0,0.2); }
        .wl-badge-dot { width: 6px; height: 6px; background: var(--orange); border-radius: 50%; animation: wl-pulse 2s infinite; }
        @keyframes wl-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .wl-h1 { font-size: clamp(30px, 7vw, 54px); font-weight: 800; line-height: 1.08; letter-spacing: -1.5px; margin-bottom: 16px; }
        .wl-h1 span { color: var(--orange); }
        .wl-sub { font-size: clamp(14px, 3vw, 16px); color: var(--muted); line-height: 1.55; max-width: 500px; margin: 0 auto 36px; }

        /* Form card */
        .wl-form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; max-width: 420px; margin: 0 auto; box-shadow: 0 8px 40px rgba(0,0,0,0.06); }
        .wl-form-label { font-size: 11px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; text-align: left; display: block; }
        .wl-select, .wl-input { width: 100%; padding: 11px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); font-family: var(--font); font-size: 13px; color: var(--text); outline: none; transition: border-color 0.15s; margin-bottom: 10px; }
        .wl-select:focus, .wl-input:focus { border-color: var(--orange); }
        .wl-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 4px; }
        .wl-btn-primary { background: var(--orange); color: #fff; }
        .wl-btn-primary:hover { background: var(--orange-hover); transform: translateY(-1px); }
        .wl-btn-success { background: #10b981; color: #fff; cursor: default; }
        .wl-btn-loading { background: var(--muted2); color: #fff; cursor: not-allowed; }
        .wl-form-msg { font-size: 12px; text-align: center; margin-top: 10px; padding: 8px 12px; border-radius: 6px; }
        .wl-form-msg.success { background: rgba(16,185,129,0.1); color: #10b981; }
        .wl-form-msg.error { background: rgba(192,57,43,0.1); color: var(--red); }
        .wl-privacy { font-size: 11px; color: var(--muted2); text-align: center; margin-top: 14px; }

        /* CTA scroll hint */
        .wl-cta-row { display: flex; justify-content: center; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
        .wl-cta-btn { background: none; border: 1px solid var(--border); color: var(--muted); padding: 8px 18px; border-radius: 20px; font-family: var(--font); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .wl-cta-btn:hover { border-color: var(--orange); color: var(--orange); background: rgba(255,102,0,0.04); }

        /* About / Stats */
        .wl-about { padding: 60px 20px; max-width: 960px; margin: 0 auto; }
        .wl-section-label { font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: var(--orange); margin-bottom: 12px; }
        .wl-about-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 700px) { .wl-about-grid { grid-template-columns: 1fr 1fr; align-items: center; } }
        .wl-about-h2 { font-size: clamp(22px, 4vw, 34px); font-weight: 800; letter-spacing: -0.8px; line-height: 1.15; margin-bottom: 16px; }
        .wl-about-p { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 20px; }
        .wl-about-link { color: var(--orange); text-decoration: none; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 4px; }
        .wl-about-link:hover { text-decoration: underline; }
        .wl-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--border); }
        .wl-stat { background: var(--surface); padding: 24px 20px; text-align: center; }
        .wl-stat-val { font-size: 28px; font-weight: 800; color: var(--orange); letter-spacing: -1px; margin-bottom: 4px; }
        .wl-stat-lbl { font-size: 11px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.4px; }

        /* Features */
        .wl-features { padding: 20px 20px 60px; max-width: 960px; margin: 0 auto; }
        .wl-features-h2 { font-size: clamp(20px, 4vw, 28px); font-weight: 800; letter-spacing: -0.6px; margin-bottom: 8px; }
        .wl-features-sub { font-size: 14px; color: var(--muted); margin-bottom: 32px; }
        .wl-cards { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 560px) { .wl-cards { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 900px) { .wl-cards { grid-template-columns: 1fr 1fr 1fr; } }
        .wl-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px 20px; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .wl-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.07); border-color: rgba(255,102,0,0.2); }
        .wl-card-icon { font-size: 22px; margin-bottom: 12px; }
        .wl-card-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
        .wl-card-desc { font-size: 12px; color: var(--muted); line-height: 1.55; }
        .wl-card-soon { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--orange); background: rgba(255,102,0,0.08); padding: 2px 7px; border-radius: 4px; margin-top: 10px; }

        /* Bottom CTA */
        .wl-bottom-cta { background: var(--orange); padding: 50px 24px; text-align: center; }
        .wl-bottom-h { font-size: clamp(22px, 5vw, 36px); font-weight: 800; color: #fff; letter-spacing: -0.8px; margin-bottom: 10px; }
        .wl-bottom-p { font-size: 14px; color: rgba(255,255,255,0.78); margin-bottom: 28px; }
        .wl-bottom-btn { background: #fff; color: var(--orange); padding: 12px 32px; border: none; border-radius: 8px; font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .wl-bottom-btn:hover { background: #fff3ee; transform: translateY(-1px); }

        /* Footer */
        .wl-footer { background: #111; padding: 40px 20px 24px; }
        .wl-footer-inner { max-width: 960px; margin: 0 auto; }
        .wl-footer-marquee-wrap { overflow: hidden; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 10px 0; margin-bottom: 36px; }
        .wl-footer-marquee-track { display: flex; width: max-content; animation: wl-scroll 40s linear infinite; }
        .wl-footer-marquee-item { font-size: 10px; color: rgba(255,255,255,0.35); padding: 0 24px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; white-space: nowrap; }
        .wl-footer-marquee-item::before { content: "✦"; margin-right: 24px; color: rgba(255,102,0,0.4); }
        .wl-footer-top { display: flex; flex-direction: column; gap: 28px; margin-bottom: 36px; }
        @media (min-width: 640px) { .wl-footer-top { flex-direction: row; justify-content: space-between; align-items: flex-start; } }
        .wl-footer-brand { color: #fff; }
        .wl-footer-logo { font-size: 18px; font-weight: 900; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .wl-footer-logo-box { background: var(--orange); color: #fff; font-weight: 900; font-size: 12px; padding: 2px 6px; border-radius: 3px; }
        .wl-footer-tagline { font-size: 12px; color: rgba(255,255,255,0.4); max-width: 240px; line-height: 1.5; }
        .wl-footer-links { display: flex; flex-direction: column; gap: 8px; }
        .wl-footer-link-group-title { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 6px; }
        .wl-footer-link { color: rgba(255,255,255,0.55); text-decoration: none; font-size: 13px; transition: color 0.15s; }
        .wl-footer-link:hover { color: #fff; }
        .wl-footer-bottom { display: flex; flex-direction: column; gap: 12px; align-items: center; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 20px; }
        @media (min-width: 640px) { .wl-footer-bottom { flex-direction: row; justify-content: space-between; } }
        .wl-footer-copy { font-size: 11px; color: rgba(255,255,255,0.25); }
        .wl-back-top { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); padding: 7px 16px; border-radius: 20px; font-family: var(--font); font-size: 11px; cursor: pointer; transition: all 0.2s; }
        .wl-back-top:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .wl-made-with { font-size: 11px; color: rgba(255,255,255,0.25); display: flex; align-items: center; gap: 4px; }
        .wl-heart { color: #e53e3e; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="wl-header">
        <div className="wl-header-inner">
          <a href="/" className="wl-logo">
            <span className="wl-logo-box">M</span>
            Miru
            <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", color: "#fff", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>V2</span>
          </a>
          <a href="/" className="wl-back">
            ← Back to Miru
          </a>
        </div>
      </header>

      {/* ── TICKER ── */}
      <div className="wl-ticker" aria-hidden="true">
        <div className="wl-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="wl-ticker-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="wl-hero">
        <div className="wl-badge">
          <span className="wl-badge-dot" />
          Early Access — Limited Spots
        </div>
        <h1 className="wl-h1">
          Career Intelligence,<br />
          <span>Finally Honest.</span>
        </h1>
        <p className="wl-sub">
          Miru V2 decodes campus placements, company culture, interview realities, and salary trajectories — all in one terminal. Built for students who don't want surprises.
        </p>

        {/* ── FORM CARD ── */}
        <div className="wl-form-card" ref={formRef}>
          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>You're on the list!</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>We sent a confirmation to your inbox. Hang tight — V2 is coming.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <span className="wl-form-label">Reserve your early access spot</span>
              <select
                className="wl-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Student / Professional</option>
                <option>Recruiter / Talent Acq.</option>
              </select>
              <input
                className="wl-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className={`wl-btn ${status === "loading" ? "wl-btn-loading" : "wl-btn-primary"}`}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Joining…" : "Join Waitlist →"}
              </button>
              {msg && (
                <div className={`wl-form-msg ${status}`}>{msg}</div>
              )}
              <p className="wl-privacy">🔒 No spam. Unsubscribe any time.</p>
            </form>
          )}
        </div>

        <div className="wl-cta-row">
          <button className="wl-cta-btn" onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}>
            See what's coming ↓
          </button>
          <a href="/" className="wl-cta-btn" style={{ textDecoration: "none" }}>
            Explore Miru V1
          </a>
        </div>
      </section>

      {/* ── ABOUT / STATS ── */}
      <section className="wl-about">
        <div className="wl-about-grid">
          <div>
            <div className="wl-section-label">About Miru</div>
            <h2 className="wl-about-h2">Built for the student who asks the hard questions.</h2>
            <p className="wl-about-p">
              Miru started as a research terminal for YC and funded startups. V2 goes further — we're embedding human-collected campus placement data, verified interview intel, and an AI layer that maps your exact skill trajectory to salary potential.
            </p>
            <p className="wl-about-p">
              No fluff. No generic advice. Just raw, honest intelligence for the student who wants to know what's actually happening inside companies before they join.
            </p>
            <a href="/" className="wl-about-link">Explore V1 now →</a>
          </div>
          <div className="wl-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="wl-stat">
                <div className="wl-stat-val">{s.value}</div>
                <div className="wl-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="wl-features" id="features">
        <div className="wl-section-label">V2 Features</div>
        <h2 className="wl-features-h2">Everything we're shipping in V2.</h2>
        <p className="wl-features-sub">Joining the waitlist locks in your early access to all of these when they drop.</p>
        <div className="wl-cards">
          {FEATURES.map((f) => (
            <div key={f.label} className="wl-card">
              <div className="wl-card-icon">{f.icon}</div>
              <div className="wl-card-title">{f.label}</div>
              <div className="wl-card-desc">{f.desc}</div>
              <span className="wl-card-soon">Coming in V2</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="wl-bottom-cta">
        <h2 className="wl-bottom-h">Secure your spot now.</h2>
        <p className="wl-bottom-p">Early access users will be the first to unlock every V2 feature — for free.</p>
        <button className="wl-bottom-btn" onClick={scrollToForm}>
          Join the Waitlist
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="wl-footer">
        <div className="wl-footer-inner">
          {/* Marquee */}
          <div className="wl-footer-marquee-wrap" aria-hidden="true">
            <div className="wl-footer-marquee-track">
              {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="wl-footer-marquee-item">{item}</span>
              ))}
            </div>
          </div>

          {/* Top links row */}
          <div className="wl-footer-top">
            <div className="wl-footer-brand">
              <div className="wl-footer-logo">
                <span className="wl-footer-logo-box">M</span>
                Miru
              </div>
              <p className="wl-footer-tagline">
                The intelligence terminal for the next generation of job seekers.
              </p>
            </div>

            <div>
              <div className="wl-footer-link-group-title">Product</div>
              <div className="wl-footer-links">
                <a href="/" className="wl-footer-link">Miru V1</a>
                <a href="/waitlist" className="wl-footer-link">V2 Waitlist</a>
                <a href="/#discover" className="wl-footer-link">Discover Startups</a>
              </div>
            </div>

            <div>
              <div className="wl-footer-link-group-title">Legal</div>
              <div className="wl-footer-links">
                <a href="#" className="wl-footer-link">Privacy Policy</a>
                <a href="#" className="wl-footer-link">Terms of Service</a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="wl-footer-bottom">
            <span className="wl-footer-copy">© 2026 Miru Intelligence. All rights reserved.</span>
            <span className="wl-made-with">Made with <span className="wl-heart">♥</span> in India</span>
            <button className="wl-back-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              ↑ Back to top
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
