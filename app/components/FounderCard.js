"use client";
import { useState } from "react";
import LinkedInComposer from "./LinkedInComposer";

function color(name) {
  const colors = ["#e8522a","#2a7ae8","#2ae87a","#e8a02a","#7a2ae8","#e82a7a","#2ae8e8"];
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

/* Build the best LinkedIn URL we can from available data */
function resolveLinkedIn(founder) {
  // 1. AI extracted a real URL from research sources
  if (founder.linkedinUrl && founder.linkedinUrl.includes("linkedin.com/in/")) {
    return founder.linkedinUrl;
  }
  // 2. Exa background search found a profile URL (attached as pages.linkedinUrl)
  if (founder._linkedinUrl && founder._linkedinUrl.includes("linkedin.com/in/")) {
    return founder._linkedinUrl;
  }
  // 3. Construct a search URL from name — reliable fallback
  const query = encodeURIComponent(`${founder.name} ${founder.role || ""}`);
  return `https://www.linkedin.com/search/results/people/?keywords=${query}`;
}

export default function FounderCard({ founder, startup, apiKey }) {
  const [expanded, setExpanded] = useState(false);
  const linkedinHref = resolveLinkedIn(founder);
  // True profile link vs search fallback
  const isDirectProfile = linkedinHref.includes("linkedin.com/in/");

  return (
    <div className="founder-card">
      <div className="founder-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="founder-avatar" style={{ background: color(founder.name || "?") }}>
          {(founder.name || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="founder-name">{founder.name}</div>
            {/* LinkedIn link — always visible in header */}
            <a
              href={linkedinHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="founder-li-btn"
              title={isDirectProfile ? "Open LinkedIn profile" : "Search on LinkedIn"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              {isDirectProfile ? "Profile" : "Search"}
            </a>
          </div>
          <div className="founder-role">{founder.role}</div>
          {founder.education && <div className="founder-prev">{founder.education}</div>}
        </div>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="founder-body">
          {founder.background && <div className="founder-bio">{founder.background}</div>}

          {/* LinkedIn profile CTA — larger button in expanded view */}
          <a
            href={linkedinHref}
            target="_blank"
            rel="noopener noreferrer"
            className="founder-li-full-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            {isDirectProfile ? `View ${founder.name.split(" ")[0]}'s LinkedIn Profile ↗` : `Search ${founder.name.split(" ")[0]} on LinkedIn ↗`}
          </a>

          {founder.previousCompanies?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="signal-title">Previous companies</div>
              <div className="startup-tags" style={{ marginTop: 4 }}>
                {founder.previousCompanies.map((c, i) => (
                  <span key={i} className="startup-tag">{c}</span>
                ))}
              </div>
            </div>
          )}

          {founder.notableAchievements?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="signal-title">Notable</div>
              <ul style={{ paddingLeft: 14, marginTop: 4 }}>
                {founder.notableAchievements.map((a, i) => (
                  <li key={i} style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {founder.personalitySignals?.length > 0 && (
            <div className="founder-signals" style={{ marginTop: 10 }}>
              <div className="signal-title">Signals from interviews / talks</div>
              <div className="signal-tags">
                {founder.personalitySignals.map((s, i) => (
                  <span key={i} className="signal-tag">{s}</span>
                ))}
              </div>
            </div>
          )}

          <LinkedInComposer founder={founder} startup={startup} apiKey={apiKey} />
        </div>
      )}
    </div>
  );
}
