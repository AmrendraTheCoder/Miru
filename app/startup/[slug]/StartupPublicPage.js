"use client";
import { useState } from "react";

const BASE_URL = "https://miru-1.vercel.app";

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ── Employee Finder ─────────────────────────────────────────── */
function EmployeeFinder({ companyName, domain }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const findEmployees = async () => {
    setLoading(true);
    try {
      // Search for public LinkedIn profiles of people at this company
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, domain }),
      });
      const { employees: found } = await res.json();
      setEmployees(found || []);
    } catch {
      setEmployees([]);
    }
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
        Publicly available profiles of people currently working at {companyName}.
        Reach out directly to ask about culture, interviews, or open roles.
      </p>

      {!loaded && (
        <button
          className="sp-find-btn"
          onClick={findEmployees}
          disabled={loading}
        >
          {loading ? (
            <span className="sp-loading-dots">
              <span />
              <span />
              <span />
            </span>
          ) : (
            "Find people at " + companyName + " →"
          )}
        </button>
      )}

      {loaded && employees.length === 0 && (
        <p className="sp-muted" style={{ marginTop: 12 }}>
          No public profiles found. Try searching on{" "}
          <a
            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}&origin=GLOBAL_SEARCH_HEADER`}
            target="_blank"
            rel="noopener noreferrer"
            className="sp-link"
          >
            LinkedIn directly ↗
          </a>
        </p>
      )}

      {employees.length > 0 && (
        <div className="sp-employee-grid">
          {employees.map((emp, i) => (
            <a
              key={i}
              href={emp.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sp-employee-card"
            >
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
      )}

      {employees.length > 0 && (
        <a
          href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}&origin=GLOBAL_SEARCH_HEADER`}
          target="_blank"
          rel="noopener noreferrer"
          className="sp-more-link"
        >
          See all {companyName} employees on LinkedIn ↗
        </a>
      )}
    </section>
  );
}

function avatarColor(name = "") {
  const colors = ["#e8522a", "#2a7ae8", "#2ae87a", "#e8a02a", "#7a2ae8", "#e82a7a"];
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

/* ── Main Public Page ────────────────────────────────────────── */
export default function StartupPublicPage({ data, slug }) {
  const name = data.name || slug;
  const domain = data.domain;

  return (
    <div className="sp-root">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sp-header">
        <div className="sp-header-inner">
          <a href={BASE_URL} className="sp-logo">
            <span className="sp-logo-box">M</span> Miru
          </a>
          <a href={`${BASE_URL}/?q=${encodeURIComponent(name)}`} className="sp-research-cta">
            Research {name} deeper →
          </a>
        </div>
      </header>

      <main className="sp-main">
        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="sp-hero">
          {data.logo_url && (
            <img
              src={data.logo_url}
              alt={`${name} logo`}
              className="sp-hero-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <div>
            <h1 className="sp-hero-name">{name}</h1>
            {data.tagline && <p className="sp-hero-tagline">{data.tagline}</p>}
            <div className="sp-hero-meta">
              {data.batch && <span className="sp-tag">YC {data.batch}</span>}
              {data.stage && <span className="sp-tag">{data.stage}</span>}
              {data.sector && <span className="sp-tag">{data.sector}</span>}
              {data.founded && <span className="sp-tag">Founded {data.founded}</span>}
              {data.totalFunding && (
                <span className="sp-tag sp-tag-green">Raised {data.totalFunding}</span>
              )}
              {domain && (
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="sp-tag sp-tag-link">
                  {domain} ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Overview ─────────────────────────────────────── */}
        {data.overview && (
          <section className="sp-section">
            <h2 className="sp-section-title">Overview</h2>
            <p className="sp-body">{data.overview}</p>
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
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sp-li-btn"
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
                <a key={i} href={`/startup/${toSlug(c)}`} className="sp-tag sp-tag-link">
                  {c}
                </a>
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

        {/* ── Interview Prep CTA ───────────────────────────── */}
        <section className="sp-cta-box">
          <div className="sp-cta-title">Preparing to interview at {name}?</div>
          <p className="sp-cta-desc">
            Get the full intelligence brief — funding story, founder backgrounds,
            competitive positioning, and recent news — in 10 seconds.
          </p>
          <a href={`${BASE_URL}/?q=${encodeURIComponent(name)}`} className="sp-cta-btn">
            Research {name} on Miru →
          </a>
        </section>

        {/* ── Press Articles ───────────────────────────────── */}
        {data.pressArticles?.length > 0 && (
          <section className="sp-section">
            <h2 className="sp-section-title">Press & Coverage</h2>
            <div className="sp-press-list">
              {data.pressArticles.slice(0, 6).map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="sp-press-item">
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
