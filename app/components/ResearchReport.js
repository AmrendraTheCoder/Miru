"use client";
import FounderCard from "./FounderCard";

function toSlug(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stageClass(stage) {
  if (!stage) return "";
  const s = stage.toLowerCase();
  if (s.includes("seed") || s.includes("pre")) return "stage-seed";
  if (s.includes("series") || s.includes("growth")) return "stage-series";
  if (s.includes("acquired")) return "stage-acquired";
  if (s.includes("ipo") || s.includes("public")) return "stage-ipo";
  return "";
}

export default function ResearchReport({ report, apiKey }) {
  const d = report;
  if (!d) return null;

  return (
    <div className="report-wrap">
      {/* Hero */}
      <div className="report-hero">
        <div className="report-hero-top">
          <div className="report-logo">{(d.name || "?")[0].toUpperCase()}</div>
          <div>
            <div
              className="report-name report-name-link"
              onClick={() => window.location.href = `/startup/${toSlug(d.name || "")}`}
              title={`Open full intelligence page for ${d.name}`}
              role="link"
              style={{ cursor: "pointer" }}
            >
              {d.name}
              <span className="report-name-arrow">↗</span>
            </div>
            <div className="report-tagline">{d.tagline}</div>
            {d.stage && (
              <span className={`news-stage ${stageClass(d.stage)}`} style={{ marginTop: 6, display: "inline-block" }}>
                {d.stage}
              </span>
            )}
          </div>
        </div>

        <div className="report-meta-row">
          {d.founded && <div className="report-meta-item"><strong>Founded</strong> {d.founded}</div>}
          {d.headquarters && <div className="report-meta-item"><strong>HQ</strong> {d.headquarters}</div>}
          {d.totalFunding && <div className="report-meta-item"><strong>Raised</strong> {d.totalFunding}</div>}
          {d.sector && <div className="report-meta-item"><strong>Sector</strong> {d.sector}</div>}
        </div>

        <div className="report-overview">{d.overview}</div>
      </div>

      {/* Problem + Solution */}
      {d.problem && (
        <div className="report-section">
          <div className="report-section-title">Problem & Solution</div>
          <div className="problem-box">
            <div className="problem-label">The Problem</div>
            <div className="problem-text">{d.problem.statement}</div>
            {d.problem.urgency && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                <strong>Why now:</strong> {d.problem.urgency}
              </div>
            )}
            {d.problem.marketSize && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                <strong>Market:</strong> {d.problem.marketSize}
              </div>
            )}
          </div>
          {d.solution && (
            <div className="problem-box" style={{ borderLeftColor: "#2a7ae8", background: "#f0f4ff", marginTop: 8 }}>
              <div className="problem-label" style={{ color: "#2a7ae8" }}>Their Solution</div>
              <div className="problem-text">{d.solution}</div>
            </div>
          )}
        </div>
      )}

      {/* Why funded */}
      {d.whyFunded && (
        <div className="report-section">
          <div className="report-section-title">Why Investors Funded This</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>{d.whyFunded}</div>
          {d.competitiveAdvantage && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <strong>Moat:</strong> {d.competitiveAdvantage}
            </div>
          )}
        </div>
      )}

      {/* Funding timeline */}
      {d.fundingTimeline?.length > 0 && (
        <div className="report-section">
          <div className="report-section-title">Funding Timeline</div>
          <div className="timeline">
            {d.fundingTimeline.map((t, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-date">{t.date}</div>
                <div className="timeline-content">
                  <div className="timeline-event">
                    {t.event}
                    {t.amount && <span className="timeline-amount">{t.amount}</span>}
                  </div>
                  {t.investors && <div className="timeline-detail">Investors: {t.investors}</div>}
                  {t.detail && <div className="timeline-detail">{t.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Founders */}
      {d.founders?.length > 0 && (
        <div className="report-section">
          <div className="report-section-title">Founders</div>
          <div className="founder-grid">
            {d.founders.map((f, i) => (
              <FounderCard key={i} founder={f} startup={d.name} apiKey={apiKey} />
            ))}
          </div>
        </div>
      )}

      {/* Press articles */}
      {d.pressArticles?.length > 0 && (
        <div className="report-section">
          <div className="report-section-title">Press & Coverage</div>
          <div className="article-list">
            {d.pressArticles.map((a, i) => (
              <div className="article-item" key={i}>
                <div>
                  <div className="article-title">
                    {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a> : a.title}
                  </div>
                  <div className="article-source">{a.source}{a.summary ? ` — ${a.summary}` : ""}</div>
                </div>
                {a.date && <div className="article-date">{a.date}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key insights */}
      {d.insights?.length > 0 && (
        <div className="report-section">
          <div className="report-section-title">Key Intelligence</div>
          <div className="insight-list">
            {d.insights.map((s, i) => (
              <div key={i} className="insight-chip">→ {s}</div>
            ))}
          </div>
          {d.risks?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--red)", marginBottom: 6 }}>
                Risks
              </div>
              <div className="insight-list">
                {d.risks.map((r, i) => (
                  <div key={i} className="insight-chip" style={{ borderColor: "#f8bbd0", color: "var(--red)", background: "#fff5f5" }}>⚠ {r}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analyst verdict */}
      {d.analystVerdict && (
        <div className="report-section">
          <div className="report-section-title">Analyst Verdict</div>
          <div className="analyst-box">
            <div className="analyst-label">Senior Market Research Assessment</div>
            <div className="analyst-text">{d.analystVerdict.summary}</div>
            <div className="analyst-verdict">
              {d.analystVerdict.marketPosition && (
                <div className="verdict-item">
                  <div className="verdict-label">Position</div>
                  <div className="verdict-value">{d.analystVerdict.marketPosition}</div>
                </div>
              )}
              {d.analystVerdict.moatStrength && (
                <div className="verdict-item">
                  <div className="verdict-label">Moat</div>
                  <div className={`verdict-value ${d.analystVerdict.moatStrength === "Strong" ? "verdict-green" : d.analystVerdict.moatStrength === "Weak" ? "verdict-red" : "verdict-orange"}`}>
                    {d.analystVerdict.moatStrength}
                  </div>
                </div>
              )}
              {d.analystVerdict.fundingLikelihood && (
                <div className="verdict-item">
                  <div className="verdict-label">Next Funding</div>
                  <div className={`verdict-value ${d.analystVerdict.fundingLikelihood === "High" ? "verdict-green" : d.analystVerdict.fundingLikelihood === "Low" ? "verdict-red" : "verdict-orange"}`}>
                    {d.analystVerdict.fundingLikelihood}
                  </div>
                </div>
              )}
              {d.analystVerdict.watchScore && (
                <div className="verdict-item">
                  <div className="verdict-label">Watch Score</div>
                  <div className="verdict-value verdict-orange">{d.analystVerdict.watchScore}/10</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Competitors named */}
      {d.competitorNames?.length > 0 && (
        <div className="report-section">
          <div className="report-section-title">Known Competitors</div>
          <div className="startup-tags">
            {d.competitorNames.map((c, i) => (
              <span
                key={i}
                className="startup-tag startup-tag-link"
                style={{ fontSize: 12, padding: "3px 10px", cursor: "pointer" }}
                onClick={() => window.location.href = `/startup/${toSlug(c)}`}
                role="link"
              >
                {c} ↗
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
