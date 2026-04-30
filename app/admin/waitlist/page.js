"use client";

import { useState } from "react";

export default function AdminWaitlistPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok) {
        setEntries(data.entries || []);
        setIsAuthenticated(true);
        setStatus("idle");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Invalid password");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Network error");
    }
  };

  const handleDownloadCSV = () => {
    if (entries.length === 0) return;
    
    // Create CSV content
    const headers = "Email,Role,Date Signed Up\n";
    const rows = entries.map(e => `${e.email},${e.role},${new Date(e.created_at).toLocaleString()}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    
    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `miru_waitlist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font)" }}>
        <form onSubmit={handleLogin} style={{ 
          background: "var(--surface)", 
          padding: 30, 
          borderRadius: 12, 
          border: "1px solid var(--border)",
          width: "100%",
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--text)", textAlign: "center" }}>Miru Admin</h2>
          
          <input 
            type="password" 
            placeholder="Admin Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 14 }}
          />
          
          <button 
            type="submit" 
            disabled={status === "loading"}
            style={{ 
              background: "var(--text)", 
              color: "var(--bg)", 
              padding: "10px 14px", 
              borderRadius: 6, 
              border: "none", 
              fontWeight: 600, 
              cursor: "pointer" 
            }}
          >
            {status === "loading" ? "Authenticating..." : "Login"}
          </button>
          
          {errorMsg && <div style={{ color: "var(--red)", fontSize: 13, textAlign: "center" }}>{errorMsg}</div>}
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)", color: "var(--text)" }}>
      <header style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>V2 Waitlist Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>
            Total Signups: <strong style={{ color: "var(--text)" }}>{entries.length}</strong>
          </span>
          <button 
            onClick={handleDownloadCSV}
            style={{ 
              background: "var(--orange)", 
              color: "#fff", 
              padding: "6px 12px", 
              borderRadius: 6, 
              border: "none", 
              fontSize: 13, 
              fontWeight: 600, 
              cursor: "pointer" 
            }}
          >
            Export CSV
          </button>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>No signups yet.</div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.02)" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--muted2)" }}>Email</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--muted2)" }}>Role</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--muted2)" }}>Date Joined</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{entry.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        background: entry.role.includes("Recruiter") ? "#eef4ff" : "#fff3ee", 
                        color: entry.role.includes("Recruiter") ? "#2a7ae8" : "#d95b2a", 
                        padding: "4px 8px", 
                        borderRadius: 12, 
                        fontSize: 12, 
                        fontWeight: 600 
                      }}>
                        {entry.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                      {new Date(entry.created_at).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
