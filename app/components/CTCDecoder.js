"use client";
import { useState, useEffect, useCallback } from "react";

/* ──────────────────────────────────────────────────────────────
   INDIAN INCOME TAX CALCULATION ENGINE — FY 2025-26
   ────────────────────────────────────────────────────────────── */

/** NEW REGIME slabs (default, FY 2025-26)
 *  Standard deduction: ₹75,000
 *  Rebate u/s 87A: Zero tax if net taxable income ≤ ₹12,00,000
 */
function calcNewRegimeTax(grossAnnual) {
  const stdDeduction = 75000;
  const taxableIncome = Math.max(0, grossAnnual - stdDeduction);

  // Rebate u/s 87A — no tax if taxable ≤ 12L
  if (taxableIncome <= 1200000) return 0;

  const slabs = [
    { upto: 400000,  rate: 0 },
    { upto: 800000,  rate: 0.05 },
    { upto: 1200000, rate: 0.10 },
    { upto: 1600000, rate: 0.15 },
    { upto: 2000000, rate: 0.20 },
    { upto: 2400000, rate: 0.25 },
    { upto: Infinity, rate: 0.30 },
  ];

  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const chunk = Math.min(taxableIncome, slab.upto) - prev;
    tax += chunk * slab.rate;
    prev = slab.upto;
  }
  return Math.round(tax * 1.04); // +4% cess
}

/** OLD REGIME slabs with deductions (FY 2025-26)
 *  Standard deduction: ₹50,000
 *  User inputs 80C, HRA
 */
function calcOldRegimeTax(grossAnnual, deductions80C, hraExemption, professionalTax) {
  const stdDeduction = 50000;
  const total80C = Math.min(deductions80C, 150000); // 80C capped at 1.5L
  const totalDeductions = stdDeduction + total80C + hraExemption + professionalTax;
  const taxableIncome = Math.max(0, grossAnnual - totalDeductions);

  // Rebate u/s 87A — no tax if taxable ≤ 5L
  if (taxableIncome <= 500000) return 0;

  const slabs = [
    { upto: 250000,  rate: 0 },
    { upto: 500000,  rate: 0.05 },
    { upto: 1000000, rate: 0.20 },
    { upto: Infinity, rate: 0.30 },
  ];

  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const chunk = Math.min(taxableIncome, slab.upto) - prev;
    tax += chunk * slab.rate;
    prev = slab.upto;
  }
  return Math.round(tax * 1.04); // +4% cess
}

/* ── PF Calculation (Employee contribution 12% of Basic) ── */
function calcPF(basicAnnual) {
  // PF calculated on Basic + DA, capped at ₹15,000/month
  const monthlyBasic = basicAnnual / 12;
  const pfBase = Math.min(monthlyBasic, 15000);
  return Math.round(pfBase * 0.12 * 12);
}

/* ── Number formatting ── */
const fmt = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
};
const fmtMonth = (annual) => `₹${Math.round(annual / 12).toLocaleString("en-IN")}`;

/* ── Slider Component ── */
function Slider({ label, value, min, max, step = 1, onChange, format = (v) => `${v}%`, hint }) {
  return (
    <div className="ctc-slider-group">
      <div className="ctc-slider-header">
        <span className="ctc-slider-label">{label}</span>
        <span className="ctc-slider-value">{format(value)}</span>
      </div>
      <input
        type="range"
        className="ctc-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      {hint && <div className="ctc-slider-hint">{hint}</div>}
    </div>
  );
}

/* ── Breakdown Bar ── */
function BreakdownBar({ items }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="ctc-bar-wrap">
      <div className="ctc-bar-track">
        {items.map((item, i) => (
          <div
            key={i}
            className="ctc-bar-seg"
            style={{ width: `${(item.value / total) * 100}%`, background: item.color }}
            title={`${item.label}: ${fmt(item.value)}`}
          />
        ))}
      </div>
      <div className="ctc-bar-legend">
        {items.map((item, i) => (
          <div key={i} className="ctc-bar-legend-item">
            <span className="ctc-bar-dot" style={{ background: item.color }} />
            <span className="ctc-bar-legend-label">{item.label}</span>
            <span className="ctc-bar-legend-val">{fmt(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main CTC Decoder ── */
export default function CTCDecoder({ prefillCTC = null, prefillMeta = null }) {
  // ── Inputs ──
  const [ctcLPA, setCtcLPA]           = useState(prefillCTC || "15");
  const [basePct, setBasePct]         = useState(55);      // % of CTC that is base
  const [variablePct, setVariablePct] = useState(10);      // % of CTC that is variable
  const [esopPct, setEsopPct]         = useState(35);      // % of CTC that is ESOP
  const [regime, setRegime]           = useState("new");   // new | old
  const [deductions80C, setDeductions80C] = useState(150000);
  const [hraExemption, setHraExemption]   = useState(60000);
  const [professionalTax, setProfTax]     = useState(2400);
  const [pfOpted, setPfOpted]         = useState(true);

  // Sync prefill from parent (when user clicks "Decode →" from a salary row)
  useEffect(() => {
    if (prefillCTC) {
      setCtcLPA(String(prefillCTC));
      if (prefillMeta?.base_pct)     setBasePct(prefillMeta.base_pct);
      if (prefillMeta?.variable_pct) setVariablePct(prefillMeta.variable_pct);
      if (prefillMeta?.esop_pct)     setEsopPct(prefillMeta.esop_pct);
    }
  }, [prefillCTC, prefillMeta]);

  // ── Calculations ──
  const calculate = useCallback(() => {
    const ctcAnnual   = parseFloat(ctcLPA) * 100000;
    if (!ctcAnnual || isNaN(ctcAnnual)) return null;

    const baseAnnual      = ctcAnnual * (basePct / 100);
    const variableAnnual  = ctcAnnual * (variablePct / 100);
    const esopAnnual      = ctcAnnual * (esopPct / 100);
    const pfAnnual        = pfOpted ? calcPF(baseAnnual) : 0;

    const cashCTC = ctcAnnual - esopAnnual; // Liquid CTC (base + variable)
    const grossAnnual = cashCTC - pfAnnual; // After PF employee contribution

    const taxNew = calcNewRegimeTax(grossAnnual);
    const taxOld = calcOldRegimeTax(grossAnnual, deductions80C, hraExemption, professionalTax);
    const tax    = regime === "new" ? taxNew : taxOld;

    const inHandAnnual = grossAnnual - tax;
    const inHandMonthly = inHandAnnual / 12;

    return {
      ctcAnnual,
      baseAnnual,
      variableAnnual,
      esopAnnual,
      cashCTC,
      pfAnnual,
      grossAnnual,
      taxNew,
      taxOld,
      tax,
      inHandAnnual,
      inHandMonthly,
      regime,
    };
  }, [ctcLPA, basePct, variablePct, esopPct, regime, deductions80C, hraExemption, professionalTax, pfOpted]);

  const result = calculate();

  const isValidCTC = result !== null;

  return (
    <div className="ctc-decoder-wrap">

      {/* ── Header ── */}
      <div className="ctc-decoder-header">
        <div>
          <div className="ctc-decoder-title">
            <span className="ctc-decoder-icon">₹</span>
            Real CTC Decoder
          </div>
          <div className="ctc-decoder-sub">
            Break down any CTC into your actual monthly in-hand salary
          </div>
        </div>
        {prefillMeta && (
          <div className="ctc-prefill-badge">
            Pre-filled: {prefillMeta.company} · {prefillMeta.role}
          </div>
        )}
      </div>

      <div className="ctc-decoder-body">

        {/* ── LEFT PANEL: Inputs ── */}
        <div className="ctc-panel ctc-panel-inputs">

          {/* CTC Input */}
          <div className="ctc-input-group">
            <label className="ctc-label">Total CTC (LPA)</label>
            <div className="ctc-rupee-input">
              <span className="ctc-rupee-sym">₹</span>
              <input
                className="ctc-input"
                type="number"
                min="1"
                max="500"
                step="0.5"
                value={ctcLPA}
                onChange={e => setCtcLPA(e.target.value)}
                placeholder="e.g. 15"
              />
              <span className="ctc-lpa-label">LPA</span>
            </div>
            {isValidCTC && (
              <div className="ctc-input-hint">
                = {fmt(result.ctcAnnual)} per year
              </div>
            )}
          </div>

          {/* Sliders */}
          <div className="ctc-sliders">
            <Slider
              label="Base Salary"
              value={basePct}
              min={30} max={90}
              onChange={setBasePct}
              hint="Most startups keep base at 50–65% of CTC"
            />
            <Slider
              label="Variable / Bonus"
              value={variablePct}
              min={0} max={40}
              onChange={setVariablePct}
              hint="Performance-linked; often not fully paid to freshers"
            />
            <Slider
              label="ESOP / RSU Component"
              value={esopPct}
              min={0} max={60}
              onChange={setEsopPct}
              hint="Vests over 4 years — NOT liquid in year 1"
            />
          </div>

          {/* PF Toggle */}
          <div className="ctc-toggle-row">
            <div>
              <div className="ctc-toggle-label">EPF Contribution</div>
              <div className="ctc-toggle-sub">12% of Basic (both you & employer)</div>
            </div>
            <button
              className={`ctc-toggle-btn ${pfOpted ? "active" : ""}`}
              onClick={() => setPfOpted(p => !p)}
            >
              {pfOpted ? "Opted In" : "Opted Out"}
            </button>
          </div>

          {/* Tax Regime Toggle */}
          <div className="ctc-regime-wrap">
            <div className="ctc-label" style={{ marginBottom: 8 }}>Tax Regime</div>
            <div className="ctc-regime-tabs">
              <button
                className={`ctc-regime-tab ${regime === "new" ? "active" : ""}`}
                onClick={() => setRegime("new")}
              >
                <div className="ctc-regime-name">New Regime</div>
                <div className="ctc-regime-desc">Zero deductions · Simpler · Default</div>
              </button>
              <button
                className={`ctc-regime-tab ${regime === "old" ? "active" : ""}`}
                onClick={() => setRegime("old")}
              >
                <div className="ctc-regime-name">Old Regime</div>
                <div className="ctc-regime-desc">80C + HRA deductions</div>
              </button>
            </div>

            {regime === "old" && (
              <div className="ctc-old-inputs">
                <div className="ctc-old-input-row">
                  <label className="ctc-old-label">80C Investments (max ₹1.5L)</label>
                  <input
                    className="ctc-old-input"
                    type="number"
                    min={0}
                    max={150000}
                    step={5000}
                    value={deductions80C}
                    onChange={e => setDeductions80C(Number(e.target.value))}
                  />
                </div>
                <div className="ctc-old-input-row">
                  <label className="ctc-old-label">HRA Exemption</label>
                  <input
                    className="ctc-old-input"
                    type="number"
                    min={0}
                    step={1000}
                    value={hraExemption}
                    onChange={e => setHraExemption(Number(e.target.value))}
                  />
                </div>
                <div className="ctc-old-input-row">
                  <label className="ctc-old-label">Professional Tax</label>
                  <input
                    className="ctc-old-input"
                    type="number"
                    min={0}
                    max={3600}
                    step={100}
                    value={professionalTax}
                    onChange={e => setProfTax(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT PANEL: Results ── */}
        {isValidCTC && (
          <div className="ctc-panel ctc-panel-result">

            {/* Big Number — In-Hand */}
            <div className="ctc-result-hero">
              <div className="ctc-result-label">Monthly In-Hand Salary</div>
              <div className="ctc-result-amount">{fmtMonth(result.inHandAnnual)}</div>
              <div className="ctc-result-sub">/ month · estimated take-home</div>

              {/* Regime comparison */}
              <div className="ctc-regime-compare">
                <div className={`ctc-rc-item ${regime === "new" ? "active" : ""}`} onClick={() => setRegime("new")}>
                  <div className="ctc-rc-regime">New Regime</div>
                  <div className="ctc-rc-val">{fmtMonth(result.ctcAnnual - result.esopAnnual - result.pfAnnual - result.taxNew)}/mo</div>
                </div>
                <div className={`ctc-rc-item ${regime === "old" ? "active" : ""}`} onClick={() => setRegime("old")}>
                  <div className="ctc-rc-regime">Old Regime</div>
                  <div className="ctc-rc-val">{fmtMonth(result.ctcAnnual - result.esopAnnual - result.pfAnnual - result.taxOld)}/mo</div>
                </div>
              </div>
            </div>

            {/* Breakdown Bar */}
            <BreakdownBar items={[
              { label: "In-Hand",  value: Math.max(0, result.inHandAnnual), color: "#059669" },
              { label: "Income Tax", value: result.tax,   color: "#e8522a" },
              { label: "PF (Employee)", value: result.pfAnnual, color: "#0ea5e9" },
              ...(result.esopAnnual > 0 ? [{ label: "ESOP/RSU", value: result.esopAnnual, color: "#a855f7" }] : []),
            ]} />

            {/* Line-by-line table */}
            <div className="ctc-breakdown-table">
              <div className="ctc-bt-title">Detailed Breakdown (Annual)</div>
              <div className="ctc-bt-row ctc-bt-row-header">
                <span>Component</span><span>Amount</span>
              </div>
              <div className="ctc-bt-row">
                <span>Total CTC</span><span>{fmt(result.ctcAnnual)}</span>
              </div>
              <div className="ctc-bt-row ctc-bt-sub">
                <span>Base Salary ({basePct}%)</span><span>{fmt(result.baseAnnual)}</span>
              </div>
              <div className="ctc-bt-row ctc-bt-sub">
                <span>Variable / Bonus ({variablePct}%)</span><span>{fmt(result.variableAnnual)}</span>
              </div>
              {result.esopAnnual > 0 && (
                <div className="ctc-bt-row ctc-bt-sub ctc-bt-esop">
                  <span>ESOP / RSU ({esopPct}%) <span className="ctc-bt-warn">not liquid yr 1</span></span>
                  <span className="ctc-bt-purple">{fmt(result.esopAnnual)}</span>
                </div>
              )}
              <div className="ctc-bt-row ctc-bt-divider">
                <span>Liquid CTC (excl. ESOPs)</span><span className="ctc-bt-green">{fmt(result.cashCTC)}</span>
              </div>
              <div className="ctc-bt-row ctc-bt-deduction">
                <span>– EPF Employee Contribution</span><span>{pfOpted ? `– ${fmt(result.pfAnnual)}` : "Opted out"}</span>
              </div>
              <div className="ctc-bt-row ctc-bt-deduction">
                <span>– Income Tax ({regime === "new" ? "New" : "Old"} Regime)</span>
                <span className="ctc-bt-red">– {fmt(result.tax)}</span>
              </div>
              <div className="ctc-bt-row ctc-bt-total">
                <span>✦ Annual In-Hand</span><span>{fmt(result.inHandAnnual)}</span>
              </div>
              <div className="ctc-bt-row ctc-bt-total ctc-bt-monthly">
                <span>✦ Monthly In-Hand</span><span>{fmtMonth(result.inHandAnnual)}</span>
              </div>
            </div>

            {/* CTC Inflation Warning */}
            {result.esopAnnual > 0 && (
              <div className="ctc-esop-warning">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <strong>₹{(result.esopAnnual / 100000).toFixed(1)}L of your CTC is in ESOPs/RSUs.</strong>
                  {" "}These vest over 3–4 years, may lose value, and are taxed when exercised. Your real Day-1 cash value is{" "}
                  <strong>{fmt(result.cashCTC)}</strong> per year.
                </div>
              </div>
            )}

            <div className="ctc-disclaimer">
              * Calculations are estimates based on standard Indian tax slabs for FY 2025-26.
              Individual tax liability may vary based on exact deductions, surcharges and employer PF structure.
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
