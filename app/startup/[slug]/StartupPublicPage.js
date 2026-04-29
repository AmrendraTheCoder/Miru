"use client";
import { useState, useEffect, useCallback } from "react";
import { sendGAEvent } from "@next/third-parties/google";

const BASE_URL = "https://miru-1.vercel.app";

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function avatarColor(name = "") {
  const colors = ["#e8522a", "#2a7ae8", "#2ae87a", "#e8a02a", "#7a2ae8", "#e82a7a"];
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function readTime(data) {
  const words = [data.overview, data.whyFunded, data.solution]
    .filter(Boolean).join(" ").split(/\s+/).length;
  return Math.max(2, Math.round(words / 200)) + " min read";
}

/* ── Share Bar ──────────────────────────────────────────────── */
function ShareBar({ name, slug }) {
  const [copied, setCopied] = useState(false);
  const url = `${BASE_URL}/startup/${slug}`;
  const text = `${name} — startup intelligence brief on Miru`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      sendGAEvent("event", "share_clicked", { method: "copy", company: name });
    });
  };

  return (
    <div className="sp-share-bar">
      <span className="sp-share-label">Share</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="sp-share-btn sp-share-x"
        onClick={() => sendGAEvent("event", "share_clicked", { method: "twitter", company: name })}
        title="Share on X"
      >𝕏</a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="sp-share-btn sp-share-li"
        onClick={() => sendGAEvent("event", "share_clicked", { method: "linkedin", company: name })}
        title="Share on LinkedIn"
      >in</a>
      <button className="sp-share-btn sp-share-copy" onClick={copy} title="Copy link">
        {copied ? "✓ Copied" : "Copy link"}
      </button>
    </div>
  );
}

/* ── LeetCode Section ───────────────────────────────────────── */
const DIFFICULTY_COLOR = { Easy: "#008000", Medium: "#e8a02a", Hard: "#c0392b" };

function LeetCodeSection({ companyName, slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const lcSlug = toSlug(companyName);

  const load = useCallback(async () => {
    setLoading(true);
    sendGAEvent("event", "leetcode_opened", { company: companyName });
    try {
      const res = await fetch(`/api/leetcode?company=${encodeURIComponent(companyName)}`);
      setData(await res.json());
    } catch { setData(null); }
    setLoaded(true);
    setLoading(false);
  }, [companyName]);

  return (
    <section className="sp-section sp-lc-section">
      <div className="sp-section-head">
        <h2 className="sp-section-title">Interview Questions</h2>
        <span className="sp-badge sp-lc-badge">LeetCode</span>
      </div>
      <p className="sp-muted">
        Most frequently asked LeetCode problems in {companyName} interviews, plus curated resources to prepare.
      </p>

      {!loaded && (
        <button className="sp-find-btn" onClick={load} disabled={loading}>
          {loading ? (
            <span className="sp-loading-dots"><span /><span /><span /></span>
          ) : `Load ${companyName} interview questions →`}
        </button>
      )}

      {/* Direct LeetCode link — always visible once loaded */}
      {loaded && data?.directUrl && (
        <a
          href={data.directUrl}
          target="_blank" rel="noopener noreferrer"
          className="sp-lc-direct-link"
          onClick={() => sendGAEvent("event", "leetcode_company_clicked", { company: companyName })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFA116"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/></svg>
          View all {companyName} questions on LeetCode →
        </a>
      )}

      {/* Question list */}
      {loaded && data?.questions?.length > 0 && (
        <div className="sp-lc-list">
          <div className="sp-lc-list-head">
            <span>Problem</span><span>Difficulty</span>
          </div>
          {data.questions.map((q, i) => (
            <a
              key={i} href={q.url} target="_blank" rel="noopener noreferrer"
              className="sp-lc-row"
              onClick={() => sendGAEvent("event", "leetcode_problem_clicked", { company: companyName, problem: q.title })}
            >
              <span className="sp-lc-num">{i + 1}</span>
              <span className="sp-lc-title">{q.title}</span>
              <span className="sp-lc-diff" style={{ color: DIFFICULTY_COLOR[q.difficulty] || "#828282" }}>
                {q.difficulty}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Curated resource links */}
      {loaded && data?.resources?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="sp-lc-res-head">Curated resources</div>
          {data.resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="sp-lc-resource">
              {r.title}
            </a>
          ))}
        </div>
      )}

      {loaded && !data?.questions?.length && !data?.resources?.length && (
        <p className="sp-muted" style={{ marginTop: 10 }}>
          No question list found. Try searching on{" "}
          <a href={`https://leetcode.com/company/${lcSlug}/`} target="_blank" rel="noopener noreferrer" className="sp-link">
            LeetCode directly ↗
          </a>{" "}or{" "}
          <a href={`https://www.google.com/search?q=${encodeURIComponent(companyName + " leetcode questions github")}`}
            target="_blank" rel="noopener noreferrer" className="sp-link">
            GitHub ↗
          </a>
        </p>
      )}
    </section>
  );
}

/* ── Employee Finder ─────────────────────────────────────────── */
function EmployeeFinder({ companyName, domain }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const findEmployees = async () => {
    setLoading(true);
    sendGAEvent("event", "employee_finder_opened", { company: companyName });
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, domain }),
      });
      const { employees: found } = await res.json();
      setEmployees(found || []);
    } catch { setEmployees([]); }
    setLoaded(true);
    setLoading(false);
  };

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2 className="sp-section-title">People at {companyName}</h2>
        <span className="sp-badge">LinkedIn</span>
      </div>
      <p className="sp-muted">
        Publicly available profiles. Reach out directly to ask about culture, interviews, or referrals.
      </p>

      {!loaded && (
        <button className="sp-find-btn" onClick={findEmployees} disabled={loading}>
          {loading ? <span className="sp-loading-dots"><span /><span /><span /></span>
            : `Find people at ${companyName} →`}
        </button>
      )}

      {loaded && employees.length === 0 && (
        <p className="sp-muted" style={{ marginTop: 12 }}>
          No public profiles found.{" "}
          <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}`}
            target="_blank" rel="noopener noreferrer" className="sp-link">
            Search on LinkedIn ↗
          </a>
        </p>
      )}

      {employees.length > 0 && (
        <>
          <div className="sp-employee-grid">
            {employees.map((emp, i) => (
              <a key={i} href={emp.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="sp-employee-card"
                onClick={() => sendGAEvent("event", "employee_profile_clicked", { company: companyName })}>
                <div className="sp-emp-avatar" style={{ background: avatarColor(emp.name) }}>
                  {(emp.name || "?")[0].toUpperCase()}
                </div>
                <div className="sp-emp-info">
                  <div className="sp-emp-name">{emp.name}</div>
                  <div className="sp-emp-role">{emp.role}</div>
                </div>
                <svg className="sp-li-icon" width="14" height="14" viewBox="0 0 24 24" fill="#0077b5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            ))}
          </div>
          <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}`}
            target="_blank" rel="noopener noreferrer" className="sp-more-link">
            See all {companyName} employees on LinkedIn ↗
          </a>
        </>
      )}
    </section>
  );
}

/* ── Main Public Page ────────────────────────────────────────── */
export default function StartupPublicPage({ data, slug }) {
  const name = data.name || slug;
  const domain = data.domain;
  const isStub = data._source === "stub" || (!data.overview && !data.tagline && !data.founders?.length);
  const publishDate = data._updatedAt
    ? new Date(data._updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const [researchState, setResearchState] = useState(
    isStub ? "pending" : "done"
  );
  const [researchMsg, setResearchMsg] = useState("Fetching intelligence brief…");

  // Auto-trigger research for stub pages
  useEffect(() => {
    if (!isStub) return;
    let cancelled = false;

    const runResearch = async () => {
      setResearchState("loading");
      try {
        const msgs = [
          "Scanning funding databases…",
          "Profiling founders…",
          "Mapping competitor landscape…",
          "Generating intelligence brief…",
        ];
        let idx = 0;
        const ticker = setInterval(() => {
          if (!cancelled) setResearchMsg(msgs[Math.min(++idx, msgs.length - 1)]);
        }, 3000);

        const res = await fetch("/api/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: name }),
        });

        clearInterval(ticker);
        if (cancelled) return;

        if (res.ok) {
          setResearchState("done");
          // Reload the page so the server re-fetches the cached report
          window.location.reload();
        } else {
          setResearchState("error");
        }
      } catch {
        if (!cancelled) setResearchState("error");
      }
    };

    runResearch();
    return () => { cancelled = true; };
  }, [isStub, name]);

  // Track page view with company context
  useEffect(() => {
    sendGAEvent("event", "company_page_viewed", { company: name, source: data._source });
  }, [name, data._source]);

  return (
    <div className="sp-root">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sp-header">
        <div className="sp-header-inner">
          <a href={BASE_URL} className="sp-logo">
            <span className="sp-logo-box">M</span> Miru
          </a>
          <a
            href={`${BASE_URL}/?q=${encodeURIComponent(name)}`}
            className="sp-research-cta"
            onClick={() => sendGAEvent("event", "research_deeper_clicked", { company: name })}
          >
            Research {name} deeper →
          </a>
        </div>
      </header>

      {/* ── Auto-research loading banner ───────────────────── */}
      {researchState === "loading" && (
        <div style={{
          background: "var(--orange)", color: "#fff", textAlign: "center",
          padding: "10px 16px", fontSize: 13, fontWeight: 500,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10
        }}>
          <span style={{ display: "inline-flex", gap: 4 }}>
            <span style={{ animation: "sp-dot-pulse 1.2s infinite", animationDelay: "0s", width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
            <span style={{ animation: "sp-dot-pulse 1.2s infinite", animationDelay: "0.4s", width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
            <span style={{ animation: "sp-dot-pulse 1.2s infinite", animationDelay: "0.8s", width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
          </span>
          {researchMsg}
        </div>
      )}
      {researchState === "error" && (
        <div style={{
          background: "#fce4ec", color: "#c62828", textAlign: "center",
          padding: "8px 16px", fontSize: 12
        }}>
          Could not auto-load intelligence brief.{" "}
          <a href={`${BASE_URL}/?q=${encodeURIComponent(name)}`} style={{ color: "#c62828", fontWeight: 700 }}>
            Research {name} manually →
          </a>
        </div>
      )}

      {/* ── Article wrapper for semantic SEO ──────────────── */}
      <main className="sp-main">
        <article itemScope itemType="https://schema.org/Article">

          {/* ── Blog-style breadcrumb ──────────────────────── */}
          <nav className="sp-breadcrumb" aria-label="Breadcrumb">
            <a href={BASE_URL} className="sp-bc-link">Miru</a>
            <span className="sp-bc-sep">›</span>
            <a href={`${BASE_URL}/#discover`} className="sp-bc-link">Startups</a>
            <span className="sp-bc-sep">›</span>
            <span>{name}</span>
          </nav>

          {/* ── Hero ─────────────────────────────────────────── */}
          <div className="sp-hero">
            {data.logo_url && (
              <img src={data.logo_url} alt={`${name} logo`} className="sp-hero-logo"
                onError={(e) => { e.target.style.display = "none"; }} />
            )}
            <div style={{ flex: 1 }}>
              <h1 className="sp-hero-name" itemProp="headline">{name}</h1>
              {data.tagline && <p className="sp-hero-tagline" itemProp="description">{data.tagline}</p>}

              {/* Blog-style meta row */}
              <div className="sp-blog-meta">
                <span>By <strong>Miru Intelligence</strong></span>
                {publishDate && <span>· Updated {publishDate}</span>}
                {data.overview && <span>· {readTime(data)}</span>}
              </div>

              <div className="sp-hero-meta">
                {data.batch && <span className="sp-tag">YC {data.batch}</span>}
                {data.stage && <span className="sp-tag">{data.stage}</span>}
                {data.sector && <span className="sp-tag">{data.sector}</span>}
                {data.founded && <span className="sp-tag">Founded {data.founded}</span>}
                {data.totalFunding && <span className="sp-tag sp-tag-green">Raised {data.totalFunding}</span>}
                {domain && (
                  <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="sp-tag sp-tag-link">
                    {domain} ↗
                  </a>
                )}
              </div>

              {/* Share bar */}
              <ShareBar name={name} slug={slug} />
            </div>
          </div>

          {/* ── Overview ─────────────────────────────────────── */}
          {data.overview && (
            <section className="sp-section">
              <h2 className="sp-section-title">Overview</h2>
              <p className="sp-body" itemProp="articleBody">{data.overview}</p>
            </section>
          )}

          {/* ── Why Funded ───────────────────────────────────── */}
          {data.whyFunded && (
            <section className="sp-section">
              <h2 className="sp-section-title">Why They Got Funded</h2>
              <p className="sp-body">{data.whyFunded}</p>
            </section>
          )}

          {/* ── Funding Timeline ─────────────────────────────── */}
          {data.fundingTimeline?.length > 0 && (
            <section className="sp-section">
              <h2 className="sp-section-title">Funding History</h2>
              <div className="sp-timeline">
                {data.fundingTimeline.map((f, i) => (
                  <div key={i} className="sp-tl-row">
                    <div className="sp-tl-date">{f.date}</div>
                    <div className="sp-tl-dot" />
                    <div className="sp-tl-content">
                      <span className="sp-tl-event">{f.event}</span>
                      {f.amount && <span className="sp-tl-amount">{f.amount}</span>}
                      {f.investors && <span className="sp-tl-investors">{f.investors}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Interview Prep CTA ───────────────────────────── */}
          <section className="sp-cta-box">
            <div className="sp-cta-title">Preparing to interview at {name}?</div>
            <p className="sp-cta-desc">
              Get the full intelligence brief — funding story, founder backgrounds,
              competitive positioning, and recent news — in 10 seconds on Miru.
            </p>
            <a
              href={`${BASE_URL}/?q=${encodeURIComponent(name)}`}
              className="sp-cta-btn"
              onClick={() => sendGAEvent("event", "interview_cta_clicked", { company: name })}
            >
              Research {name} on Miru →
            </a>
          </section>

          {/* ── LeetCode Interview Questions ─────────────────── */}
          <LeetCodeSection companyName={name} slug={slug} />

          {/* ── Founders ─────────────────────────────────────── */}
          {data.founders?.length > 0 && (
            <section className="sp-section">
              <h2 className="sp-section-title">Founders</h2>
              <div className="sp-founder-grid">
                {data.founders.map((f, i) => (
                  <div key={i} className="sp-founder-card">
                    <div className="sp-founder-avatar" style={{ background: avatarColor(f.name || "") }}>
                      {(f.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="sp-founder-info">
                      <div className="sp-founder-name">{f.name}</div>
                      <div className="sp-founder-role">{f.role}</div>
                      {f.education && <div className="sp-founder-edu">{f.education}</div>}
                      {f.background && <p className="sp-founder-bio">{f.background}</p>}
                      {f.previousCompanies?.length > 0 && (
                        <div className="sp-tags">
                          {f.previousCompanies.map((c, j) => (
                            <span key={j} className="sp-tag sp-tag-sm">{c}</span>
                          ))}
                        </div>
                      )}
                      {(f.linkedinUrl || f.name) && (
                        <a
                          href={f.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(f.name)}`}
                          target="_blank" rel="noopener noreferrer" className="sp-li-btn"
                          onClick={() => sendGAEvent("event", "founder_linkedin_clicked", { company: name, founder: f.name })}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Employee Finder ──────────────────────────────── */}
          <EmployeeFinder companyName={name} domain={domain} />

          {/* ── Competitors ──────────────────────────────────── */}
          {data.competitorNames?.length > 0 && (
            <section className="sp-section">
              <h2 className="sp-section-title">Competitors</h2>
              <div className="sp-tags">
                {data.competitorNames.map((c, i) => (
                  <a key={i} href={`/startup/${toSlug(c)}`} className="sp-tag sp-tag-link">{c}</a>
                ))}
              </div>
            </section>
          )}

          {/* ── Analyst Verdict ──────────────────────────────── */}
          {data.analystVerdict?.summary && (
            <section className="sp-section">
              <h2 className="sp-section-title">Analyst Verdict</h2>
              <p className="sp-body">{data.analystVerdict.summary}</p>
              <div className="sp-verdict-grid">
                {data.analystVerdict.marketPosition && (
                  <div className="sp-verdict-item">
                    <div className="sp-verdict-label">Market Position</div>
                    <div className="sp-verdict-value">{data.analystVerdict.marketPosition}</div>
                  </div>
                )}
                {data.analystVerdict.moatStrength && (
                  <div className="sp-verdict-item">
                    <div className="sp-verdict-label">Moat Strength</div>
                    <div className="sp-verdict-value">{data.analystVerdict.moatStrength}</div>
                  </div>
                )}
                {data.analystVerdict.watchScore && (
                  <div className="sp-verdict-item">
                    <div className="sp-verdict-label">Watch Score</div>
                    <div className="sp-verdict-value">{data.analystVerdict.watchScore}/10</div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Press Articles ───────────────────────────────── */}
          {data.pressArticles?.length > 0 && (
            <section className="sp-section">
              <h2 className="sp-section-title">Press & Coverage</h2>
              <div className="sp-press-list">
                {data.pressArticles.slice(0, 6).map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="sp-press-item"
                    onClick={() => sendGAEvent("event", "press_article_clicked", { company: name })}>
                    <div className="sp-press-title">{a.title}</div>
                    <div className="sp-press-meta">
                      {a.source && <span>{a.source}</span>}
                      {a.date && <span>{a.date}</span>}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Bottom share bar */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <p className="sp-muted" style={{ marginBottom: 8 }}>Found this useful? Share it.</p>
            <ShareBar name={name} slug={slug} />
          </div>
        </article>
      </main>

      <footer className="sp-footer">
        <a href={BASE_URL} className="sp-footer-logo">
          <span className="sp-logo-box">M</span> Miru
        </a>
        <span className="sp-footer-tagline">Startup Intelligence Platform</span>
        <a href={`${BASE_URL}/sitemap.xml`} className="sp-footer-link">Sitemap</a>
      </footer>
    </div>
  );
}
