"use client";
import { useState } from "react";
import { generateOutreachDraft } from "@/lib/analyzer";

export default function LinkedInComposer({ founder, startup, apiKey }) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState("Peer");
  const [hook, setHook] = useState("their problem");
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myContext, setMyContext] = useState(() => {
    try { return JSON.parse(localStorage.getItem("my_context") || "{}"); } catch { return {}; }
  });

  const save = (v) => {
    setMyContext(v);
    try { localStorage.setItem("my_context", JSON.stringify(v)); } catch {}
  };

  const generate = async () => {
    if (!apiKey) return;
    setGenerating(true);
    const d = await generateOutreachDraft(
      apiKey,
      { name: founder.name, role: founder.role, background: founder.background, startup: startup },
      { name: myContext.name || "a founder", bio: myContext.bio || "building in tech" },
      tone,
      hook
    );
    setDraft(d);
    setGenerating(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openLinkedIn = () => {
    window.open("https://www.linkedin.com/messaging/", "_blank");
  };

  return (
    <div>
      <button className="linkedin-btn" onClick={() => setOpen(o => !o)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.59 0 4.25 2.36 4.25 5.43l.02 6.31zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.57V9h3.55v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.23 0z"/>
        </svg>
        Message {founder.name.split(" ")[0]}
      </button>

      {open && (
        <div className="composer-panel">
          <div className="composer-label">Craft your message</div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Your context (saved locally)</div>
            <input
              className="settings-input"
              style={{ marginBottom: 4 }}
              placeholder="Your name"
              value={myContext.name || ""}
              onChange={e => save({ ...myContext, name: e.target.value })}
            />
            <textarea
              className="context-input"
              rows={2}
              placeholder="Who you are in 1-2 lines (e.g. Building a dev tools startup, prev eng at Stripe)"
              value={myContext.bio || ""}
              onChange={e => save({ ...myContext, bio: e.target.value })}
            />
          </div>

          <div className="composer-row">
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Tone</div>
              <select className="composer-select" value={tone} onChange={e => setTone(e.target.value)}>
                {["Peer", "Admirer", "Investor", "Collaborator"].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Hook</div>
              <select className="composer-select" value={hook} onChange={e => setHook(e.target.value)}>
                {["their problem", "their funding", "their background", "recent news"].map(h => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {draft && (
            <textarea
              className="draft-box"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              spellCheck={false}
            />
          )}

          <div className="composer-actions">
            <button className="btn-gen" onClick={generate} disabled={generating}>
              {generating ? "Writing..." : draft ? "Regenerate" : "Generate Draft"}
            </button>
            {draft && (
              <>
                <button className="btn-copy" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
                <button className="btn-copy" onClick={openLinkedIn}>Open LinkedIn ↗</button>
              </>
            )}
            <span className="composer-hint">Editable before sending • Never auto-sends</span>
          </div>
        </div>
      )}
    </div>
  );
}
