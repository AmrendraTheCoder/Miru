"use client";
import { useState } from "react";
import LinkedInComposer from "./LinkedInComposer";

function color(name) {
  const colors = ["#e8522a","#2a7ae8","#2ae87a","#e8a02a","#7a2ae8","#e82a7a","#2ae8e8"];
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function FounderCard({ founder, startup, apiKey }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="founder-card">
      <div className="founder-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="founder-avatar" style={{ background: color(founder.name || "?") }}>
          {(founder.name || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div className="founder-name">{founder.name}</div>
          <div className="founder-role">{founder.role}</div>
          {founder.education && <div className="founder-prev">{founder.education}</div>}
        </div>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="founder-body">
          {founder.background && <div className="founder-bio">{founder.background}</div>}

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
