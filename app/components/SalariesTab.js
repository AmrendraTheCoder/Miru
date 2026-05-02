"use client";
import { useState, useMemo, useRef } from "react";
import {
  POPULAR_ROLES,
  SALARY_DATA,
  ALL_SALARY_RECORDS,
  searchSalaries,
} from "@/lib/salaries";
import CTCDecoder from "./CTCDecoder";

/* ── Company Logo ── */
function SalaryLogo({ name, website }) {
  const domain = website?.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];
  const [failed, setFailed] = useState(false);

  const COLORS = ["#e8522a","#2a7ae8","#0ea5e9","#e8a02a","#7a2ae8","#059669","#e82a7a","#f59e0b"];
  let h = 0;
  for (const c of (name || "")) h = c.charCodeAt(0) + ((h << 5) - h);
  const avatarBg = COLORS[Math.abs(h) % COLORS.length];

  if (!domain || failed) {
    return (
      <div className="sal-logo-letter" style={{ background: avatarBg }}>
        {(name || "?")[0].toUpperCase()}
      </div>
    );
  }
  return (
    <img
      className="sal-logo-img"
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={`${name} logo`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

/* ── Type Badge ── */
const TYPE_LABELS = { product: "Product", service: "Service", startup: "Startup" };
const TYPE_COLORS = {
  product: { bg: "rgba(14,165,233,0.08)", color: "#0369a1", border: "rgba(14,165,233,0.2)" },
  service: { bg: "rgba(100,116,139,0.08)", color: "#475569", border: "rgba(100,116,139,0.2)" },
  startup: { bg: "rgba(232,82,42,0.08)", color: "#e8522a", border: "rgba(232,82,42,0.2)" },
};

function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.startup;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      textTransform: "uppercase", letterSpacing: "0.4px",
    }}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

/* ── Individual Salary Row ── */
function SalaryRow({ record, onDecodeClick }) {
  const midCTC = ((record.ctc_min + record.ctc_max) / 2).toFixed(1);
  return (
    <div className="sal-row">
      <div className="sal-row-left">
        <SalaryLogo name={record.company} website={record.website} />
        <div className="sal-row-info">
          <div className="sal-row-company">{record.company}</div>
          <div className="sal-row-role">{record.role}</div>
          <div className="sal-row-exp">
            {record.experience} exp &nbsp;·&nbsp; ~{record.sample_count?.toLocaleString()} salaries
          </div>
        </div>
      </div>
      <div className="sal-row-right">
        <TypeBadge type={record.type} />
        <div className="sal-row-range">
          ₹{record.ctc_min}L – ₹{record.ctc_max}L
        </div>
        <div className="sal-row-label">per year (CTC)</div>
        <button
          className="sal-decode-btn"
          onClick={() => onDecodeClick(midCTC, record)}
        >
          Decode →
        </button>
      </div>
    </div>
  );
}

/* ── Company Summary Card (browse view) ── */
function CompanyCard({ companyData, onExpand, expanded }) {
  const topRoles = companyData.roles.slice(0, 3);
  return (
    <div className={`sal-company-card ${expanded ? "expanded" : ""}`}>
      <div className="sal-cc-header" onClick={onExpand}>
        <SalaryLogo name={companyData.company} website={companyData.website} />
        <div className="sal-cc-info">
          <div className="sal-cc-name">{companyData.company}</div>
          <div className="sal-cc-meta">
            <TypeBadge type={companyData.type} />
            <span className="sal-cc-count">{companyData.roles.length} roles tracked</span>
          </div>
        </div>
        <div className="sal-cc-range">
          <div className="sal-cc-range-val">
            ₹{Math.min(...companyData.roles.map(r => r.ctc_min))}L –{" "}
            ₹{Math.max(...companyData.roles.map(r => r.ctc_max))}L
          </div>
          <div className="sal-cc-range-label">CTC range</div>
        </div>
        <span className="sal-cc-chevron">{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div className="sal-cc-roles">
          {companyData.roles.map((role, i) => (
            <div key={i} className="sal-cc-role-row">
              <div>
                <div className="sal-cc-role-title">{role.role}</div>
                <div className="sal-cc-role-exp">{role.experience} · {role.sample_count?.toLocaleString()} salaries</div>
              </div>
              <div className="sal-cc-role-ctc">₹{role.ctc_min}L – ₹{role.ctc_max}L</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main SalariesTab Component ── */
export default function SalariesTab() {
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [activeView, setActiveView]     = useState("browse"); // browse | search | calculator
  const [expandedCo, setExpandedCo]     = useState(null);
  const [decoderCTC, setDecoderCTC]     = useState(null);
  const [decoderMeta, setDecoderMeta]   = useState(null);
  const debounceRef = useRef(null);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery && !selectedRole) return [];
    const q = selectedRole || searchQuery;
    return searchSalaries(q);
  }, [searchQuery, selectedRole]);

  const handleRoleChip = (role) => {
    setSelectedRole(prev => prev === role ? "" : role);
    setActiveView("search");
  };

  const handleDecodeClick = (ctc, meta) => {
    setDecoderCTC(ctc);
    setDecoderMeta(meta);
    setActiveView("calculator");
    // Scroll to calculator
    setTimeout(() => {
      document.getElementById("ctc-decoder")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="sal-wrap">

      {/* ── Page Header ── */}
      <div className="sal-page-header">
        <div className="sal-header-left">
          <div className="sal-page-title">Salary Intelligence</div>
          <div className="sal-page-sub">
            Real CTC data · Tax decoder · In-hand calculator
          </div>
        </div>
        <div className="sal-header-tabs">
          {[
            { id: "browse",     label: "Browse" },
            { id: "search",     label: "Compare" },
            { id: "calculator", label: "CTC Decoder" },
          ].map(t => (
            <button
              key={t.id}
              className={`sal-view-btn ${activeView === t.id ? "active" : ""}`}
              onClick={() => setActiveView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="sal-search-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="sal-search-input"
          type="text"
          placeholder="Search company or role... (e.g. Zepto, SDE II)"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              if (e.target.value.trim()) setActiveView("search");
            }, 200);
          }}
          onFocus={() => { if (searchQuery) setActiveView("search"); }}
        />
        {searchQuery && (
          <button className="sal-search-clear" onClick={() => { setSearchQuery(""); setSelectedRole(""); setActiveView("browse"); }}>×</button>
        )}
      </div>

      {/* ── Popular Role Chips ── */}
      <div className="sal-chips-wrap">
        <span className="sal-chips-label">Popular roles:</span>
        <div className="sal-chips">
          {POPULAR_ROLES.slice(0, 10).map(role => (
            <button
              key={role}
              className={`sal-chip ${selectedRole === role ? "active" : ""}`}
              onClick={() => handleRoleChip(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Views ── */}

      {/* BROWSE VIEW */}
      {activeView === "browse" && (
        <div className="sal-browse-wrap">
          <div className="sal-section-label">
            Salaries by Company
            <span className="sal-section-count">{SALARY_DATA.length} companies</span>
          </div>
          <div className="sal-company-list">
            {SALARY_DATA.map((co, i) => (
              <CompanyCard
                key={co.company}
                companyData={co}
                expanded={expandedCo === co.company}
                onExpand={() => setExpandedCo(prev => prev === co.company ? null : co.company)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SEARCH / COMPARE VIEW */}
      {activeView === "search" && (
        <div className="sal-results-wrap">
          {searchResults.length > 0 ? (
            <>
              <div className="sal-section-label">
                {selectedRole ? `Salaries for "${selectedRole}"` : `Results for "${searchQuery}"`}
                <span className="sal-section-count">{searchResults.length} records</span>
              </div>
              <div className="sal-results-list">
                {searchResults.map((r, i) => (
                  <SalaryRow key={i} record={r} onDecodeClick={handleDecodeClick} />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-wrap">
              <div className="empty-title">No results</div>
              <div className="empty-desc">Try searching for a company name like "TCS" or a role like "SDE".</div>
            </div>
          )}
        </div>
      )}

      {/* ── Real CTC Decoder ── */}
      <div id="ctc-decoder" style={{ marginTop: activeView === "calculator" ? 0 : 28 }}>
        <CTCDecoder prefillCTC={activeView === "calculator" ? decoderCTC : null} prefillMeta={decoderMeta} />
      </div>

      {/* ── V1 Waitlist CTA ── */}
      <div className="sal-waitlist-cta">
        <div className="sal-wl-left">
          <span className="sal-wl-badge">V1 Incoming</span>
          <div className="sal-wl-heading">Unlock Exact Breakdowns & Interview Intel</div>
          <div className="sal-wl-sub">
            Real in-hand data verified by employees, company culture reviews, interview question banks
            and "Are you paid fairly?" market checks — all in one place.
          </div>
        </div>
        <a href="/waitlist" className="sal-wl-btn">Join the Waitlist →</a>
      </div>

    </div>
  );
}
