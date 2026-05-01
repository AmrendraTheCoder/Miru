"use client";
import { useState, useEffect, useRef } from "react";
import "./waitlist.css";

const TICKERS = ["Campus Placement Data","Interview Intelligence","AI Salary Predictor","Culture Tracker","Auto-Pilot Applications","Recruiter Merit Portal","YC Research","Funding Intel"];

const FEATURES = [
  { t: "Campus Placement Time-Machine", d: "5-year placement history by college — PPOs, placed, and unplaced ratios on verified timelines.", icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
  { t: "Inside Reality Tracker", d: "Anonymous, area-wise employee reviews and a secure bias-reporting system. Know what it's actually like.", icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> },
  { t: "Verified Interview Intel", d: "Crowdsourced, recently asked questions with structure and depth so you walk in knowing exactly what to expect.", icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg> },
  { t: "AI Salary Predictor", d: "Upload your resume. AI maps your skills against live market data to project your salary trajectory.", icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
  { t: "Auto-Pilot Applications", d: "Curated job feeds matched to your profile. One-click AI-generated answers for descriptive form fields.", icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
  { t: "Recruiter Merit Showcase", d: "Top job seekers spotlighted directly to recruiters with verified skillsets and meritocracy scores.", icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg> },
];

const STATS = [
  { v: "5,600+", l: "Companies" },
  { v: "200+",   l: "YC Startups" },
  { v: "12K+",   l: "Research Queries" },
  { v: "Free",   l: "Forever" },
];

const BULLETS = [
  "5-year campus placement data by college",
  "Real interview questions from recent candidates",
  "AI salary projections from your resume",
];

export default function WaitlistPage() {
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState("Student / Professional");
  const [status, setStatus] = useState("idle");
  const [msg, setMsg]       = useState("");
  const formRef  = useRef(null);
  const featRef  = useRef(null);
  const aboutRef = useRef(null);
  const ctaRef   = useRef(null);

  useEffect(() => {
    let ctx;
    (async () => {
      const { gsap }         = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Hero entrance
        gsap.from([".wl-hero-tag",".wl-h1",".wl-hero-sub",".wl-bullets"], {
          y: 30, opacity: 0, stagger: 0.1, duration: 0.85, ease: "power3.out", delay: 0.1
        });
        gsap.from(".wl-form-wrap", {
          y: 30, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.3
        });
        // Stats
        gsap.from(".wl-stat", {
          scrollTrigger: { trigger: ".wl-stats-inner", start: "top 85%" },
          y: 20, opacity: 0, stagger: 0.08, duration: 0.55, ease: "power2.out"
        });
        // Features
        gsap.from(".wl-feat", {
          scrollTrigger: { trigger: featRef.current, start: "top 75%" },
          y: 30, opacity: 0, stagger: 0.05, duration: 0.6, ease: "power2.out"
        });
        // About
        gsap.from([".wl-about-h",".wl-about-p",".wl-mission"], {
          scrollTrigger: { trigger: aboutRef.current, start: "top 80%" },
          y: 24, opacity: 0, stagger: 0.1, duration: 0.7, ease: "power2.out"
        });
        // CTA
        gsap.from([".wl-cta-h",".wl-cta-p",".wl-cta-action"], {
          scrollTrigger: { trigger: ctaRef.current, start: "top 80%" },
          y: 24, opacity: 0, stagger: 0.1, duration: 0.6, ease: "power2.out"
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
      const res  = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) { setStatus("success"); setEmail(""); }
      else { setStatus("error"); setMsg(data.error || "Something went wrong."); }
    } catch { setStatus("error"); setMsg("Network error. Please try again."); }
  };

  const scrollForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
  const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );

  return (
    <div className="wl-root">

      {/* HEADER */}
      <header className="wl-header">
        <a href="/" className="wl-logo">
          <span className="wl-logo-box">M</span>
          <span className="wl-logo-text">Miru</span>
          <span className="wl-logo-v2">V2</span>
        </a>
        <nav className="wl-nav">
          <a href="/#discover" className="wl-nav-a">Explore V1</a>
          <a href="#features" className="wl-nav-a">Features</a>
          <button className="wl-nav-btn" onClick={scrollForm}>Join Waitlist</button>
        </nav>
      </header>

      {/* TICKER */}
      <div className="wl-ticker" style={{marginTop:56}} aria-hidden="true">
        <div className="wl-ticker-track">
          {[...TICKERS,...TICKERS].map((t,i)=>(
            <span key={i} className="wl-ti"><span className="wl-ti-sep">✦</span>{t}</span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="wl-hero">
        <div>
          <div className="wl-hero-tag">
            <span className="wl-hero-dot"/>
            Early Access — Limited Spots
          </div>
          <h1 className="wl-h1">Career Intelligence,<br/><em>Finally Honest.</em></h1>
          <p className="wl-hero-sub">Miru V2 decodes campus placements, company culture, and interview realities — with human-verified data and AI precision.</p>
          <div className="wl-bullets">
            {BULLETS.map(b=>(
              <div key={b} className="wl-bullet">
                <span className="wl-bullet-check"><CheckIcon/></span>
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div ref={formRef}>
          <div className="wl-form-wrap">
            {status==="success" ? (
              <div className="wl-success">
                <div className="wl-success-ico"><CheckIcon/></div>
                <div className="wl-success-t">You're on the list.</div>
                <div className="wl-success-b">We sent a confirmation to your inbox. You'll be first to access Miru V2.</div>
              </div>
            ) : (
              <>
                <div className="wl-form-title">Reserve Early Access</div>
                <div className="wl-form-sub">Be the first to unlock every V2 feature — free.</div>
                <form onSubmit={submit}>
                  <label className="wl-label">I am a</label>
                  <select className="wl-select" value={role} onChange={e=>setRole(e.target.value)}>
                    <option>Student / Professional</option>
                    <option>Recruiter / Talent Acq.</option>
                  </select>
                  <label className="wl-label">Email address</label>
                  <input className="wl-input" type="email" placeholder="you@college.edu" value={email} onChange={e=>setEmail(e.target.value)} required/>
                  <button type="submit" className="wl-submit" disabled={status==="loading"}>
                    {status==="loading" ? "Joining…" : <><span>Claim My Spot</span><ArrowIcon/></>}
                  </button>
                  {status==="error" && <div className="wl-msg-err">{msg}</div>}
                </form>
                <div className="wl-privacy">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  No spam. Unsubscribe anytime.
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="wl-stats-wrap">
        <div className="wl-stats-inner">
          {STATS.map(s=>(
            <div key={s.l} className="wl-stat">
              <div className="wl-stat-v">{s.v}</div>
              <div className="wl-stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="wl-hr"/>

      {/* ABOUT */}
      <section className="wl-about" ref={aboutRef}>
        <div>
          <div className="wl-section-tag">About Miru</div>
          <div className="wl-about-h">Built for students who ask the uncomfortable questions.</div>
          <p className="wl-about-p">Miru started as an AI research terminal for funded startups. V2 goes deeper — human-collected campus placement data, verified interview structures, and an AI layer that maps your exact skill trajectory to real salary outcomes.</p>
          <p className="wl-about-p">No filtered LinkedIn posts. No vague Glassdoor ratings. Just raw, verified intelligence for students who want the truth before they sign the offer letter.</p>
          <a href="/" className="wl-about-link">Explore Miru V1 →</a>
        </div>
        <div className="wl-mission">
          <div className="wl-mission-accent"/>
          <h3>Our Mission</h3>
          <p>Campus recruitment in India is opaque by design. Every student deserves the same insider information the well-connected already have — placement timelines, real interview questions, salary benchmarks, and honest company culture data.</p>
        </div>
      </section>

      <div className="wl-hr"/>

      {/* FEATURES */}
      <section className="wl-features" id="features" ref={featRef}>
        <div className="wl-features-head">
          <div className="wl-section-tag">What's Coming in V2</div>
          <div className="wl-features-h2">Six tools. One terminal.<br/>Zero compromises.</div>
          <p className="wl-features-sub">Joining the waitlist locks in early access the moment any feature ships.</p>
        </div>
        <div className="wl-feat-grid">
          {FEATURES.map(f=>(
            <div key={f.t} className="wl-feat">
              <div className="wl-feat-ico">{f.icon}</div>
              <div className="wl-feat-t">{f.t}</div>
              <div className="wl-feat-d">{f.d}</div>
              <span className="wl-feat-pill">V2 Feature</span>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="wl-cta" ref={ctaRef}>
        <div className="wl-cta-inner">
          <div className="wl-section-tag" style={{textAlign:"center",marginBottom:14}}>Don't Wait</div>
          <div className="wl-cta-h">Your next offer letter<br/>starts here.</div>
          <p className="wl-cta-p">Early access is free, always. Get in before the queue closes.</p>
          <button className="wl-cta-action" onClick={scrollForm}>
            Join the Waitlist <ArrowIcon/>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="wl-footer">
        <div className="wl-fticker" aria-hidden="true">
          <div className="wl-fticker-track">
            {[...TICKERS,...TICKERS,...TICKERS].map((t,i)=>(
              <span key={i} className="wl-fticker-item">{t}</span>
            ))}
          </div>
        </div>
        <div className="wl-footer-body">
          <div>
            <div className="wl-fbrand-logo">
              <span className="wl-logo-box">M</span>
              <span className="wl-fbrand-name">Miru</span>
            </div>
            <p className="wl-fbrand-tag">The intelligence terminal for the next generation of career-focused students and job seekers.</p>
          </div>
          <div>
            <div className="wl-fcol-t">Product</div>
            <div className="wl-flinks">
              <a href="/" className="wl-flink">Miru V1</a>
              <a href="/waitlist" className="wl-flink">V2 Waitlist</a>
              <a href="/#discover" className="wl-flink">Discover Startups</a>
            </div>
          </div>
          <div>
            <div className="wl-fcol-t">Legal</div>
            <div className="wl-flinks">
              <a href="#" className="wl-flink">Privacy Policy</a>
              <a href="#" className="wl-flink">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="wl-footer-bottom">
          <span className="wl-fcopy">© 2026 Miru Intelligence. All rights reserved.</span>
          <span className="wl-fmade">Made with <span className="wl-fheart">♥</span> in India</span>
          <button className="wl-backtop" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l7-7 7 7"/></svg>
            Back to top
          </button>
        </div>
      </footer>
    </div>
  );
}
