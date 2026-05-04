"use client";

/**
 * SettingsModal — System status only.
 * API keys are now fully server-controlled (team managed via .env).
 * Users no longer need to supply any keys.
 */
export default function SettingsModal({ open, onClose, serverStatus = {} }) {
  if (!open) return null;

  const blocks = [
    {
      label: "News Feed (Exa)",
      active: serverStatus.hasExaKey,
      desc: serverStatus.hasExaKey ? "Live startup news · auto-refreshed" : "Not configured",
    },
    {
      label: "AI Analysis (Gemini)",
      active: serverStatus.hasGeminiKey,
      desc: serverStatus.hasGeminiKey ? "Research · CTC decoder · enrichment" : "Not configured",
    },
    {
      label: "Database (Supabase)",
      active: serverStatus.hasSupabase,
      desc: serverStatus.hasSupabase ? "Cache · salaries · company profiles" : "Not configured",
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">System Status</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">

          {/* Status cards */}
          <div className="settings-label" style={{ marginBottom: 10 }}>
            Infrastructure
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {blocks.map(b => (
              <div key={b.label} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: b.active ? "rgba(5,150,105,0.05)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${b.active ? "rgba(5,150,105,0.18)" : "#e4e4e4"}`,
                borderRadius: 8, padding: "10px 14px",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: b.active ? "#059669" : "#d1d5db",
                  boxShadow: b.active ? "0 0 0 3px rgba(5,150,105,0.15)" : "none",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{b.desc}</div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                  color: b.active ? "#059669" : "#999",
                  background: b.active ? "rgba(5,150,105,0.1)" : "rgba(0,0,0,0.05)",
                  padding: "2px 7px", borderRadius: 20,
                }}>
                  {b.active ? "Live" : "Offline"}
                </span>
              </div>
            ))}
          </div>

          {/* V1 Waitlist */}
          <div style={{
            background: "linear-gradient(135deg, rgba(232,82,42,0.07) 0%, rgba(232,82,42,0.02) 100%)",
            border: "1px solid rgba(232,82,42,0.2)", borderRadius: 8, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <span style={{
                background: "var(--orange)", color: "#fff",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
                textTransform: "uppercase", padding: "2px 7px", borderRadius: 3,
              }}>Coming Soon</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Miru V1 — Early Access</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 10px" }}>
              Placement data, verified interview intel & AI salary insights — all in one terminal.
            </p>
            <a href="/waitlist" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "var(--orange)", color: "#fff",
              fontSize: 11, fontWeight: 700,
              padding: "6px 14px", borderRadius: 4, textDecoration: "none",
            }}>Join the Waitlist →</a>
          </div>

        </div>

        <div className="modal-footer">
          <div style={{ fontSize: 10, color: "var(--muted2)", flex: 1 }}>
            Miru is managed by the dev team. No user keys needed.
          </div>
          <button className="btn btn-sm btn-primary" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}
