"use client";
import { useState, useEffect, useRef } from "react";
import "./waitlist.css";

const TICKERS = ["Campus Placement Data","Interview Intelligence","AI Salary Predictor","Culture Reality Tracker","Auto-Pilot Applications","Recruiter Merit Portal","YC Startup Research","Funding Intelligence"];

const FEATURES = [
  {
    title: "Campus Placement Time-Machine",
    desc: "5-year placement history by college — PPOs, placed, and unplaced ratios on verified timelines.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
  },
  {
    title: "Inside Reality Tracker",
    desc: "Anonymous, area-wise employee reviews and a secure bias-reporting system. Know what it's actually like.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
  },
  {
    title: "Verified Interview Intel",
    desc: "Crowdsourced, recently asked questions — structure and depth — so you walk in knowing exactly what to expect.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
  },
  {
    title: "AI Salary Predictor",
    desc: "Upload your resume. Our AI maps your skills against live market data to project your salary trajectory.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
  },
  {
    title: "Auto-Pilot Applications",
    desc: "Curated job feeds matched to your profile. One-click AI-generated answers for descriptive form fields.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  },
  {
    title: "Recruiter Merit Showcase",
    desc: "Top job seekers spotlighted directly to recruiters with verified skillsets, insider guidelines, and meritocracy scores.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
  },
];

const STATS = [
  { val: "5,600+", lbl: "Companies Tracked" },
  { val: "200+",   lbl: "YC Startups" },
  { val: "12K+",   lbl: "Research Queries" },
  { val: "Free",   lbl: "Forever" },
];

const BULLETS = [
  "5-year campus placement data by college",
  "Real interview questions from recent candidates",
  "AI salary predictions from your resume",
];

export default function WaitlistPage() {
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState("Student / Professional");
  const [status, setStatus] = useState("idle");
  const [msg, setMsg]       = useState("");
  const formRef   = useRef(null);
  const heroRef   = useRef(null);
  const featRef   = useRef(null);
  const aboutRef  = useRef(null);
  const ctaRef    = useRef(null);

  /* ── GSAP on mount ── */
  useEffect(() => {
    let ctx;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        /* Hero entrance */
        gsap.from(".gsap-hero-line", {
          y: 80, opacity: 0, stagger: 0.12, duration: 1,
          ease: "power4.out", delay: 0.2
        });
        gsap.from(".wl-form-glass", {
          x: 60, opacity: 0, duration: 1.1, ease: "power4.out", delay: 0.4
        });

        /* Feature cards on scroll */
        gsap.from(".wl-feat-card", {
          scrollTrigger: { trigger: featRef.current, start: "top 75%" },
          y: 50, opacity: 0, stagger: 0.07, duration: 0.7, ease: "power3.out"
        });

        /* Stats */
        gsap.from(".wl-stat", {
          scrollTrigger: { trigger: ".wl-stats", start: "top 80%" },
          scale: 0.85, opacity: 0, stagger: 0.1, duration: 0.6, ease: "back.out(1.5)"
        });

        /* About text */
        gsap.from([".wl-about-lead", ".wl-about-body", ".wl-mission-card"], {
          scrollTrigger: { trigger: aboutRef.current, start: "top 80%" },
          y: 40, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out"
        });

        /* CTA */
        gsap.from([".wl-cta-h2", ".wl-cta-sub", ".wl-cta-btn"], {
          scrollTrigger: { trigger: ctaRef.current, start: "top 80%" },
          y: 30, opacity: 0, stagger: 0.12, duration: 0.7, ease: "power3.out"
        });
      });

      /* Feature card radial follow */
      document.querySelectorAll(".wl-feat-card").forEach(card => {
        card.addEventListener("mousemove", (e) => {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
          card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
        });
      });
    })();
    return () => ctx?.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res  = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) { setStatus("success"); setEmail(""); }
      else { setStatus("error"); setMsg(data.error || "Something went wrong."); }
    } catch { setStatus("error"); setMsg("Network error — please try again."); }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div className="wl-root">
      {/* ── HEADER ── */}
      <header className="wl-header">
        <a href="/" className="wl-logo">
          <span className="wl-logo-box">M</span>
          <span className="wl-logo-text">Miru</span>
          <span className="wl-logo-badge">V2</span>
        </a>
        <nav className="wl-nav-links">
          <a href="/#discover" className="wl-nav-link">Explore V1</a>
          <a href="#features" className="wl-nav-link">Features</a>
          <button className="wl-nav-link primary" onClick={scrollToForm} style={{border:"none",cursor:"pointer",fontFamily:"inherit"}}>
            Join Waitlist
          </button>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="wl-hero" ref={heroRef}>
        <div className="wl-hero-bg" />
        <div className="wl-hero-grid" />

        {/* Left */}
        <div className="wl-hero-left">
          <div className="wl-eyebrow gsap-hero-line">
            <span className="wl-eyebrow-dot" />
            Early Access — Limited Spots
          </div>
          <h1 className="wl-h1 gsap-hero-line">
            Career Intelligence,<br />
            <em>Finally Honest.</em>
          </h1>
          <p className="wl-hero-sub gsap-hero-line">
            Miru V2 decodes campus placements, company culture, and interview realities with human-verified data and AI precision.
          </p>
          <div className="wl-hero-bullets gsap-hero-line">
            {BULLETS.map(b => (
              <div key={b} className="wl-bullet">
                <span className="wl-bullet-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="wl-hero-right" ref={formRef}>
          <div className="wl-form-glass">
            {status === "success" ? (
              <div className="wl-success-state">
                <div className="wl-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="wl-success-title">You're on the list.</div>
                <div className="wl-success-body">
                  We've sent a confirmation to your inbox. You'll be among the first to access Miru V2.
                </div>
              </div>
            ) : (
              <>
                <div className="wl-form-title">Reserve Early Access</div>
                <div className="wl-form-sub">Be the first to unlock every V2 feature — free of charge.</div>
                <form onSubmit={handleSubmit}>
                  <label className="wl-field-label">I am a</label>
                  <select className="wl-select" value={role} onChange={e => setRole(e.target.value)}>
                    <option>Student / Professional</option>
                    <option>Recruiter / Talent Acq.</option>
                  </select>
                  <label className="wl-field-label">Email address</label>
                  <input
                    className="wl-input"
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className={`wl-submit${status === "success" ? " success" : ""}`}
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "Joining…" : "Claim My Spot →"}
                  </button>
                  {status === "error" && <div className="wl-form-msg-err">{msg}</div>}
                </form>
                <div className="wl-privacy-note">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  No spam. Unsubscribe anytime.
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="wl-ticker" aria-hidden="true">
        <div className="wl-ticker-track">
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <span key={i} className="wl-ticker-item">
              <span className="wl-ticker-sep">✦</span>{t}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="wl-section" style={{paddingBottom:0}}>
        <div className="wl-stats">
          {STATS.map(s => (
            <div key={s.lbl} className="wl-stat">
              <div className="wl-stat-val">{s.val}</div>
              <div className="wl-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="wl-divider" style={{margin:"80px 0 0"}} />

      {/* ── ABOUT ── */}
      <section className="wl-section" ref={aboutRef}>
        <div className="wl-about-grid">
          <div>
            <div className="wl-section-tag">About Miru V2</div>
            <div className="wl-about-lead">
              Built for the student who asks<br />the uncomfortable questions.
            </div>
            <p className="wl-about-body">
              Miru started as an AI research terminal for funded startups. V2 goes deeper — we're embedding human-collected campus placement data, verified interview structures, and an AI layer that maps your exact skill trajectory to real salary outcomes.
            </p>
            <p className="wl-about-body">
              No filtered LinkedIn posts. No vague Glassdoor ratings. Just raw, verified intelligence for students who want the truth before they sign the offer letter.
            </p>
            <a href="/" className="wl-about-cta">
              Explore Miru V1 →
            </a>
          </div>
          <div>
            <div className="wl-mission-card">
              <h3>Our Mission</h3>
              <p>Campus recruitment in India is opaque by design. We believe every student deserves access to the same insider information that the well-connected already have — placement timelines, real interview questions, salary benchmarks, and honest company culture data.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="wl-divider" />

      {/* ── FEATURES ── */}
      <section className="wl-section" id="features" ref={featRef}>
        <div className="wl-section-tag">What's Coming in V2</div>
        <h2 className="wl-section-h2">Six tools. One terminal.<br />Zero compromises.</h2>
        <p className="wl-section-p">Joining the waitlist locks you into early access the moment any feature ships.</p>
        <div className="wl-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="wl-feat-card">
              <div className="wl-feat-icon">{f.icon}</div>
              <div className="wl-feat-title">{f.title}</div>
              <div className="wl-feat-desc">{f.desc}</div>
              <span className="wl-feat-badge">V2 Feature</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="wl-cta-section" ref={ctaRef}>
        <div className="wl-cta-bg" />
        <div className="wl-section-tag">Don't Wait</div>
        <h2 className="wl-cta-h2">Your next offer letter<br />starts here.</h2>
        <p className="wl-cta-sub">Early access is free, always. Get in before the queue closes.</p>
        <button className="wl-cta-btn" onClick={scrollToForm}>
          Join the Waitlist
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="wl-footer">
        <div className="wl-footer-marquee-wrap" aria-hidden="true">
          <div className="wl-footer-marquee-track">
            {[...TICKERS, ...TICKERS, ...TICKERS].map((t, i) => (
              <span key={i} className="wl-footer-marquee-item">{t}</span>
            ))}
          </div>
        </div>

        <div className="wl-footer-body">
          <div>
            <div className="wl-footer-brand-logo">
              <span className="wl-logo-box" style={{fontSize:14,padding:"3px 8px"}}>M</span>
              <span className="wl-footer-brand-name">Miru</span>
            </div>
            <p className="wl-footer-brand-tag">
              The intelligence terminal for the next generation of career-focused students and job seekers.
            </p>
          </div>
          <div>
            <div className="wl-footer-col-title">Product</div>
            <div className="wl-footer-links">
              <a href="/" className="wl-footer-link">Miru V1</a>
              <a href="/waitlist" className="wl-footer-link">V2 Waitlist</a>
              <a href="/#discover" className="wl-footer-link">Discover Startups</a>
            </div>
          </div>
          <div>
            <div className="wl-footer-col-title">Legal</div>
            <div className="wl-footer-links">
              <a href="#" className="wl-footer-link">Privacy Policy</a>
              <a href="#" className="wl-footer-link">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="wl-footer-bottom">
          <span className="wl-footer-copy">© 2026 Miru Intelligence. All rights reserved.</span>
          <span className="wl-footer-made">
            Made with <span className="wl-footer-heart">♥</span> in India
          </span>
          <button className="wl-back-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 15l7-7 7 7"/>
            </svg>
            Back to top
          </button>
        </div>
      </footer>
    </div>
  );
}
