"use client";

import { useState } from "react";
import Head from "next/head";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student / Professional");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list! Check your inbox for confirmation.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please try again later.");
    }
  };

  return (
    <>
      {/* Basic manual SEO for client component, though layout.js or metadata export is better for server components. 
          We use title tag directly in Head for Next.js App Router client components, 
          but usually Next.js 13+ prefers a layout.js metadata export. We'll add one. */}
      <div style={{
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "var(--font)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column"
      }}>
        
        {/* Header */}
        <header className="sp-header" style={{ padding: "16px 20px", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid var(--border)" }}>
          <div className="sp-header-inner" style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="/" style={{ textDecoration: "none", color: "var(--text)", fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="sp-logo-box">M</span> Miru
            </a>
            <a href="/" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
              Back to Home
            </a>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          {/* Hero Section */}
          <section style={{ 
            padding: "80px 20px 60px", 
            textAlign: "center",
            background: "radial-gradient(circle at 50% 0%, rgba(232, 82, 42, 0.08) 0%, transparent 70%)"
          }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <div style={{ 
                display: "inline-block", 
                padding: "4px 12px", 
                borderRadius: 20, 
                background: "rgba(232, 82, 42, 0.1)", 
                color: "var(--orange)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 20
              }}>
                Miru V2 Early Access
              </div>
              
              <h1 style={{ 
                fontSize: "clamp(32px, 6vw, 48px)", 
                fontWeight: 800, 
                lineHeight: 1.1, 
                letterSpacing: "-1px",
                marginBottom: 20 
              }}>
                The Future of Career Intelligence.
              </h1>
              
              <p style={{ 
                fontSize: "clamp(16px, 3vw, 18px)", 
                color: "var(--muted)", 
                lineHeight: 1.5,
                marginBottom: 40,
                maxWidth: 550,
                margin: "0 auto 40px"
              }}>
                Stop guessing. Start knowing. We're building the ultimate intelligence terminal to decode campus placements, company culture, and interview realities.
              </p>

              {/* Waitlist Form - Top */}
              <form onSubmit={handleSubmit} style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 12, 
                maxWidth: 400, 
                margin: "0 auto",
                background: "var(--surface)",
                padding: 24,
                borderRadius: 16,
                border: "1px solid var(--border)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.05)"
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, textAlign: "left" }}>Reserve your spot</h3>
                
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    fontSize: 14,
                    fontFamily: "var(--font)",
                    color: "var(--text)",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option>Student / Professional</option>
                  <option>Recruiter / Talent Acq.</option>
                </select>

                <input 
                  type="email" 
                  placeholder="name@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    fontSize: 14,
                    fontFamily: "var(--font)",
                    outline: "none"
                  }}
                />
                
                <button 
                  type="submit" 
                  disabled={status === "loading" || status === "success"}
                  style={{
                    background: status === "success" ? "#10b981" : "var(--orange)",
                    color: "#fff",
                    padding: "12px 20px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: (status === "loading" || status === "success") ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {status === "loading" ? "Joining..." : status === "success" ? "✓ You're on the list" : "Join Waitlist"}
                </button>
                
                {message && (
                  <div style={{ 
                    fontSize: 12, 
                    marginTop: 8, 
                    color: status === "success" ? "#10b981" : "var(--red)",
                    textAlign: "center"
                  }}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </section>

          {/* Features Section */}
          <section style={{ padding: "60px 20px 80px", maxWidth: 1000, margin: "0 auto" }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: 40 }}>What's coming in V2</h2>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
              gap: 24 
            }}>
              {/* Feature 1 */}
              <FeatureCard 
                icon="📊" 
                title="Campus Placement Time-Machine" 
                desc="Access 5 years of historical college-wise placement data. See exact timelines of which companies visited, PPO trends, and placed vs. unplaced ratios." 
              />
              {/* Feature 2 */}
              <FeatureCard 
                icon="🕵️‍♂️" 
                title="The 'Inside Reality' Tracker" 
                desc="A secure, area-wise shitposting and bias complaint system. Read anonymous, unfiltered employee reviews about what it's really like after joining." 
              />
              {/* Feature 3 */}
              <FeatureCard 
                icon="🎤" 
                title="Verified Interview Intel" 
                desc="Don't go in blind. Access crowdsourced, recently asked interview questions and tentative interview structures for top companies." 
              />
              {/* Feature 4 */}
              <FeatureCard 
                icon="💰" 
                title="AI Career & Salary Predictor" 
                desc="Our AI analyzes your resume, evaluates current job trends, and projects your starting salary and maximum earning potential." 
              />
              {/* Feature 5 */}
              <FeatureCard 
                icon="⚡" 
                title="Auto-Pilot Applications" 
                desc="Highly curated job feeds matched to your resume. Plus, one-click AI generation for those tedious descriptive application answers." 
              />
              {/* Feature 6 */}
              <FeatureCard 
                icon="🏆" 
                title="Recruiter 'Merit' Showcase" 
                desc="Top-tier job seekers are spotlighted directly to recruiters with verified skillsets and insider guidelines." 
              />
            </div>
          </section>
        </main>

        <footer style={{ padding: "40px 20px", textAlign: "center", borderTop: "1px solid var(--border)", color: "var(--muted)", fontSize: 13 }}>
          © 2026 Miru Intelligence. All rights reserved.
        </footer>
      </div>
    </>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.06)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
    >
      <div style={{ fontSize: 24 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0, lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}
