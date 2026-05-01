"use client";
import { useState, useEffect, useRef } from "react";
import "./waitlist.css";

const TICKERS = [
  "Campus Placement Time-Machine",
  "Verified Interview Intel",
  "AI Salary Predictor",
  "Inside Reality Tracker",
  "Auto-Pilot Applications",
  "Recruiter Merit Portal",
  "5-Year Placement Data",
  "Get In Before Placement Season",
];

  {
    span: "wlp-span-5",
    tag: "Reality Check",
    orange: true,
    title: "Know what it's really like before you sign.",
    desc: "Anonymous bias reports and area-wise culture reviews from real employees — not filtered LinkedIn posts.",
  },
  {
    span: "wlp-span-4",
    tag: "Interview Prep",
    title: "Verified Interview Intel",
    desc: "Crowdsourced questions from recent candidates — real structure, real depth.",
    img: "https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=600&q=80&auto=format&fit=crop",
    imgAlt: "Interview in progress",
  },
  {
    span: "wlp-span-8",
    tag: "AI Salary Predictor",
    title: "Your resume → Your salary projection",
    desc: "Upload your resume. AI maps your skills to live market data and projects your starting salary and growth curve.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80&auto=format&fit=crop",
    imgAlt: "Salary analytics dashboard",
  },
  {
    span: "wlp-span-6",
    tag: "Auto-Pilot",
    title: "Applications on auto-pilot",
    desc: "Curated job feeds matched to your resume. AI-generated descriptive answers, one click.",
    img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80&auto=format&fit=crop",
    imgAlt: "Person filling job application",
  },
  {
    span: "wlp-span-6",
    tag: "Recruiter Portal",
    title: "Meritocracy, not connections.",
    desc: "Top job seekers showcased directly to recruiters with verified skillsets and honest performance scores.",
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80&auto=format&fit=crop",
    imgAlt: "Team collaboration",
  },
];

const STATS = [
  { v: "5,600+", l: "Companies Tracked" },
  { v: "200+", l: "YC Startups" },
  { v: "12K+", l: "Research Queries" },
  { v: "Free", l: "Always" },
];

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student / Professional");
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");
  const formRef = useRef(null);
  const bentoRef = useRef(null);

  useEffect(() => {
    let ctx;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.from(
          [".wlp-season-badge", ".wlp-h1", ".wlp-hero-sub", ".wlp-urgency"],
          {
            y: 24,
            opacity: 0,
            stagger: 0.09,
            duration: 0.7,
            ease: "power3.out",
            delay: 0.1,
          },
        );
        gsap.from(".wlp-form-card", {
          y: 28,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          delay: 0.25,
        });
        gsap.from(".wlp-hero-img-wrap", {
          scale: 0.97,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          delay: 0.3,
        });
        gsap.from(".wlp-bento-card", {
          scrollTrigger: { trigger: bentoRef.current, start: "top 78%" },
          y: 32,
          opacity: 0,
          stagger: 0.06,
          duration: 0.6,
          ease: "power2.out",
        });
        gsap.from(".wlp-stat", {
          scrollTrigger: { trigger: ".wlp-stats-row", start: "top 85%" },
          scale: 0.88,
          opacity: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: "back.out(1.4)",
        });
      });
    })();
    return () => ctx?.revert();
  }, []);

  const submit = async (e) => {
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

  const scrollForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div className="wlp-root">
      {/* ── HEADER (exact Miru style) ── */}
      <header className="header">
        <div className="header-inner">
          <a href="/" className="header-logo">
            <span className="header-logo-box">M</span>
            Miru
          </a>
          <div style={{ flex: 1 }} />
          <div className="header-actions">
            <button className="wlp-join-btn" onClick={scrollForm}>
              Join Waitlist
            </button>
          </div>
        </div>
      </header>

      {/* ── TICKER (exact Miru style) ── */}
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track">
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <span key={i} className="ticker-item">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="wlp-section">
        <div className="wlp-hero" style={{ padding: 0 }}>
          {/* Left: text + form */}
          <div>
            <span className="wlp-season-badge">
              Get in before placement season begins
            </span>
            <h1 className="wlp-h1">
              Your next offer letter
              <br />
              <span>starts here.</span>
            </h1>
            <p className="wlp-hero-sub">
              Miru decodes campus placements, company culture, and interview
              realities — with human-verified data and AI precision. Built for
              students who want the truth.
            </p>
            <div className="wlp-urgency">
              <span className="wlp-urgency-dot" />
              Limited early access — Placement season is close.
            </div>

            {/* Form */}
            <div className="wlp-form-card" ref={formRef}>
              {status === "success" ? (
                <div className="wlp-success">
                  <div className="wlp-success-ico">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="wlp-success-t">You're on the list.</div>
                  <div className="wlp-success-b">
                    Check your inbox for confirmation. You'll be first when Miru
                    V1 ships.
                  </div>
                </div>
              ) : (
                <>
                  <div className="wlp-form-t">Reserve Your Spot</div>
                  <div className="wlp-form-s">
                    Free, always. Be first when features drop before placement
                    season.
                  </div>
                  <form onSubmit={submit}>
                    <label className="wlp-label">I am a</label>
                    <select
                      className="wlp-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option>Student / Professional</option>
                      <option>Recruiter / Talent Acq.</option>
                    </select>
                    <label className="wlp-label">Email address</label>
                    <input
                      className="wlp-input"
                      type="email"
                      placeholder="you@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button
                      className="wlp-submit"
                      type="submit"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? "Joining…" : "Claim My Spot →"}
                    </button>
                    {status === "error" && (
                      <div className="wlp-msg-err">{msg}</div>
                    )}
                  </form>
                  <div className="wlp-privacy">
                    No spam. Unsubscribe anytime.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: image */}
          <div className="wlp-hero-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=85&auto=format&fit=crop"
              alt="Students collaborating on campus"
            />
            <span className="wlp-hero-img-label">
              Campus · Placement · Career
            </span>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ background: "var(--orange)", padding: "14px 16px" }}>
        <div
          className="wlp-stats-row"
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 1,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.l}
              className="wlp-stat"
              style={{ textAlign: "center", color: "#fff" }}
            >
              <div
                style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-1px" }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontWeight: 600,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wlp-hr" />

      {/* ── BENTO GRID ── */}
      <div className="wlp-section" ref={bentoRef}>
        <div className="wlp-section-label">What's coming in V1</div>
        <h2 className="wlp-section-h">Six tools. One terminal.</h2>
        <p className="wlp-section-sub">
          Everything a student needs before, during, and after placement season.
        </p>

        <div className="wlp-bento">

          {/* Card 1: Campus placement — dark bg with mini data rows */}
          <div className="wlp-bento-card wlp-span-7">
            <div className="wlp-bento-visual wlp-bento-visual-xl wlp-visual-dark">
              <div className="wlp-mini-data">
                {[["IIT Bombay", "94%", 92], ["NIT Trichy", "88%", 82], ["BITS Pilani", "91%", 88], ["DTU Delhi", "79%", 72]].map(([col, pct, w]) => (
                  <div key={col} className="wlp-mini-row">
                    <span className="wlp-mini-label">{col}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="wlp-mini-bar-wrap"><div className="wlp-mini-bar" style={{ width: `${w}%` }} /></div>
                      <span className="wlp-mini-val">{pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="wlp-bento-body">
              <span className="wlp-bento-tag">Campus Intel</span>
              <div className="wlp-bento-t">5-Year Placement Time-Machine</div>
              <div className="wlp-bento-d">Placement history by college — PPOs, placed, unplaced ratios, and which companies actually showed up.</div>
            </div>
          </div>

          {/* Card 2: Reality check — solid orange */}
          <div className="wlp-bento-card wlp-span-5 wlp-bento-orange">
            <div className="wlp-bento-body">
              <span className="wlp-bento-tag">Reality Check</span>
              <div className="wlp-bento-t">Know what it's really like before you sign the offer.</div>
              <div className="wlp-bento-d">Anonymous bias reports and area-wise culture reviews from real employees — not filtered LinkedIn posts.</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {["Micro-management issues", "Gender bias in promotions", "Unrealistic appraisal targets"].map(r => (
                  <div key={r} style={{ background: "rgba(255,255,255,0.12)", padding: "6px 10px", borderRadius: 5, fontSize: 11, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", flexShrink: 0 }} />{r}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Interview intel — cream with big number */}
          <div className="wlp-bento-card wlp-span-4">
            <div className="wlp-bento-visual wlp-bento-visual-h wlp-visual-cream">
              <div className="wlp-visual-stat">
                <div className="wlp-visual-stat-num" style={{ color: "var(--orange)" }}>847</div>
                <div className="wlp-visual-stat-lbl" style={{ color: "#a05a40" }}>Interview Questions</div>
              </div>
            </div>
            <div className="wlp-bento-body">
              <span className="wlp-bento-tag">Interview Prep</span>
              <div className="wlp-bento-t">Verified Interview Intel</div>
              <div className="wlp-bento-d">Crowdsourced questions from recent candidates — real structure, real depth.</div>
            </div>
          </div>

          {/* Card 4: AI Salary — dark with big stat */}
          <div className="wlp-bento-card wlp-span-8">
            <div className="wlp-bento-visual wlp-bento-visual-h wlp-visual-dark">
              <div className="wlp-mini-data" style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: "#fff" }}>
                  <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Starting Salary</div>
                  <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-2px", color: "#fff" }}>₹12.4L</div>
                </div>
                <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.1)" }} />
                <div style={{ textAlign: "center", color: "#fff" }}>
                  <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>3-Year Peak</div>
                  <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-2px", color: "var(--orange)" }}>₹28L</div>
                </div>
              </div>
            </div>
            <div className="wlp-bento-body">
              <span className="wlp-bento-tag">AI Salary Predictor</span>
              <div className="wlp-bento-t">Your resume → Your salary projection</div>
              <div className="wlp-bento-d">Upload your resume. AI maps your skills to live market data and projects your starting salary and growth curve.</div>
            </div>
          </div>

          {/* Card 5: Auto-pilot — light with pill tags */}
          <div className="wlp-bento-card wlp-span-6">
            <div className="wlp-bento-visual wlp-bento-visual-h wlp-visual-cream">
              <div style={{ padding: 18, display: "flex", flexWrap: "wrap", gap: 7, alignContent: "flex-start", position: "relative", zIndex: 1, width: "100%" }}>
                {["SDE-I @ Razorpay", "Backend Eng @ CRED", "Full Stack @ Groww", "Product @ Zepto", "Data Eng @ PhonePe", "SWE @ Meesho"].map(j => (
                  <span key={j} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 5, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#333", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{j}</span>
                ))}
              </div>
            </div>
            <div className="wlp-bento-body">
              <span className="wlp-bento-tag">Auto-Pilot</span>
              <div className="wlp-bento-t">Applications on auto-pilot</div>
              <div className="wlp-bento-d">Curated job feeds matched to your resume. AI-generated descriptive answers, one click.</div>
            </div>
          </div>

          {/* Card 6: Recruiter Merit — orange stat */}
          <div className="wlp-bento-card wlp-span-6">
            <div className="wlp-bento-visual wlp-bento-visual-h wlp-visual-orange">
              <div className="wlp-visual-stat" style={{ color: "#fff" }}>
                <div className="wlp-visual-stat-num" style={{ color: "#fff" }}>Top 5%</div>
                <div className="wlp-visual-stat-lbl" style={{ opacity: 0.75 }}>Merit Score Badge</div>
              </div>
            </div>
            <div className="wlp-bento-body">
              <span className="wlp-bento-tag">Recruiter Portal</span>
              <div className="wlp-bento-t">Meritocracy, not connections.</div>
              <div className="wlp-bento-d">Top job seekers showcased directly to recruiters with verified skillsets and honest performance scores.</div>
            </div>
          </div>

        </div>
      </div>

      <div className="wlp-hr" />

      {/* ── BOTTOM CTA BAND ── */}
      <div className="wlp-cta-band">
        <h2>Don't miss the season.</h2>
        <p>
          Placement season comes once a year. Get in now — it's free, always.
        </p>
        <button className="wlp-cta-band-btn" onClick={scrollForm}>
          Join the Waitlist →
        </button>
      </div>

      {/* ── FOOTER ── */}
      <footer className="wlp-footer">
        <div className="wlp-footer-inner">
          <div className="wlp-fmarquee-wrap" aria-hidden="true">
            <div className="wlp-fmarquee-track">
              {[...TICKERS, ...TICKERS, ...TICKERS].map((t, i) => (
                <span key={i} className="wlp-fmarquee-item">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="wlp-fgrid">
            <div>
              <div className="wlp-flogo">
                <span className="wlp-flogo-box">M</span>
                <span className="wlp-flogo-text">Miru</span>
              </div>
              <p className="wlp-ftagline">
                The intelligence terminal for India's next generation of job
                seekers.
              </p>
            </div>
            <div>
              <div className="wlp-fcol-t">Product</div>
              <div className="wlp-flinks">
                <a href="/" className="wlp-flink">
                  Miru Home
                </a>
                <a href="/#discover" className="wlp-flink">
                  Discover Startups
                </a>
                <a href="/waitlist" className="wlp-flink">
                  Join Waitlist
                </a>
              </div>
            </div>
            <div>
              <div className="wlp-fcol-t">Legal</div>
              <div className="wlp-flinks">
                <a href="#" className="wlp-flink">
                  Privacy Policy
                </a>
                <a href="#" className="wlp-flink">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
          <div className="wlp-fbot">
            <span className="wlp-fcopy">
              © 2026 Miru Intelligence. All rights reserved.
            </span>

            <button
              className="wlp-backtop"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              ↑ Back to top
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
