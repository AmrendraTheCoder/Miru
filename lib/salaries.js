/**
 * Miru Salary Intelligence Dataset
 * Curated salary data for Indian tech companies — product, startup, MAANG, and service.
 * Data sourced from AmbitionBox, Glassdoor, Levels.fyi and community reports.
 * Values in INR (Lakhs Per Annum - LPA).
 */

export const POPULAR_ROLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "SDE I",
  "SDE II",
  "Data Scientist",
  "Product Manager",
  "DevOps Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "ML Engineer",
  "System Design Architect",
  "Engineering Manager",
];

export const EXPERIENCE_BANDS = [
  { id: "fresher",  label: "0–1 Yrs (Fresher)", min: 0, max: 1 },
  { id: "junior",   label: "1–3 Yrs",            min: 1, max: 3 },
  { id: "mid",      label: "3–6 Yrs",             min: 3, max: 6 },
  { id: "senior",   label: "6–10 Yrs",            min: 6, max: 10 },
  { id: "staff",    label: "10+ Yrs",             min: 10, max: 30 },
];

export const DEPARTMENTS = [
  "Engineering", "Data & Analytics", "Product", "Design",
  "DevOps & Infra", "QA & Testing", "Finance & Accounting", "Operations",
];

/**
 * Salary data structure:
 * ctc_min, ctc_max — Total Cost to Company in LPA
 * base_pct         — Approximate base salary as % of CTC
 * variable_pct     — Variable / bonus component
 * esop_pct         — ESOP / RSU component (startups)
 * sample_count     — Approx number of data points we are estimating from
 * type             — "product" | "service" | "startup"
 */
export const SALARY_DATA = [
  // ── MAANG & Big Tech ─────────────────────────────────────────
  {
    company: "Google",
    website: "google.com",
    type: "product",
    roles: [
      { role: "Software Engineer (L3)", experience: "0–2 Yrs", ctc_min: 20, ctc_max: 30, base_pct: 55, variable_pct: 15, esop_pct: 30, sample_count: 1200 },
      { role: "Software Engineer (L4)", experience: "3–6 Yrs", ctc_min: 40, ctc_max: 70, base_pct: 45, variable_pct: 15, esop_pct: 40, sample_count: 980 },
      { role: "Software Engineer (L5)", experience: "6–10 Yrs", ctc_min: 70, ctc_max: 130, base_pct: 35, variable_pct: 15, esop_pct: 50, sample_count: 560 },
      { role: "Engineering Manager", experience: "10+ Yrs", ctc_min: 120, ctc_max: 250, base_pct: 30, variable_pct: 20, esop_pct: 50, sample_count: 220 },
    ],
  },
  {
    company: "Microsoft",
    website: "microsoft.com",
    type: "product",
    roles: [
      { role: "SDE I", experience: "0–2 Yrs", ctc_min: 20, ctc_max: 30, base_pct: 60, variable_pct: 10, esop_pct: 30, sample_count: 1400 },
      { role: "SDE II", experience: "3–6 Yrs", ctc_min: 35, ctc_max: 55, base_pct: 50, variable_pct: 15, esop_pct: 35, sample_count: 1100 },
      { role: "Senior SDE", experience: "6–10 Yrs", ctc_min: 60, ctc_max: 100, base_pct: 40, variable_pct: 15, esop_pct: 45, sample_count: 640 },
      { role: "Principal SDE", experience: "10+ Yrs", ctc_min: 100, ctc_max: 180, base_pct: 35, variable_pct: 15, esop_pct: 50, sample_count: 180 },
    ],
  },
  {
    company: "Amazon",
    website: "amazon.com",
    type: "product",
    roles: [
      { role: "SDE I", experience: "0–2 Yrs", ctc_min: 20, ctc_max: 25, base_pct: 65, variable_pct: 10, esop_pct: 25, sample_count: 2100 },
      { role: "SDE II", experience: "3–6 Yrs", ctc_min: 30, ctc_max: 50, base_pct: 55, variable_pct: 10, esop_pct: 35, sample_count: 1600 },
      { role: "Senior SDE", experience: "6–10 Yrs", ctc_min: 55, ctc_max: 90, base_pct: 45, variable_pct: 10, esop_pct: 45, sample_count: 820 },
    ],
  },
  {
    company: "Meta",
    website: "meta.com",
    type: "product",
    roles: [
      { role: "Software Engineer (E3)", experience: "0–2 Yrs", ctc_min: 22, ctc_max: 32, base_pct: 50, variable_pct: 10, esop_pct: 40, sample_count: 580 },
      { role: "Software Engineer (E4)", experience: "3–6 Yrs", ctc_min: 45, ctc_max: 80, base_pct: 40, variable_pct: 15, esop_pct: 45, sample_count: 460 },
      { role: "Software Engineer (E5)", experience: "6–10 Yrs", ctc_min: 90, ctc_max: 160, base_pct: 30, variable_pct: 20, esop_pct: 50, sample_count: 220 },
    ],
  },
  // ── Top Indian Unicorns & Product Startups ───────────────────
  {
    company: "Razorpay",
    website: "razorpay.com",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 15, ctc_max: 22, base_pct: 65, variable_pct: 10, esop_pct: 25, sample_count: 320 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 28, ctc_max: 45, base_pct: 55, variable_pct: 10, esop_pct: 35, sample_count: 240 },
      { role: "Engineering Manager", experience: "6–10 Yrs", ctc_min: 50, ctc_max: 90, base_pct: 45, variable_pct: 15, esop_pct: 40, sample_count: 80 },
    ],
  },
  {
    company: "Zepto",
    website: "zeptonow.com",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 20, ctc_max: 28, base_pct: 60, variable_pct: 10, esop_pct: 30, sample_count: 180 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 35, ctc_max: 55, base_pct: 55, variable_pct: 10, esop_pct: 35, sample_count: 140 },
    ],
  },
  {
    company: "CRED",
    website: "cred.club",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 18, ctc_max: 25, base_pct: 62, variable_pct: 8, esop_pct: 30, sample_count: 160 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 30, ctc_max: 50, base_pct: 55, variable_pct: 10, esop_pct: 35, sample_count: 120 },
      { role: "Staff Engineer", experience: "6–10 Yrs", ctc_min: 60, ctc_max: 100, base_pct: 45, variable_pct: 10, esop_pct: 45, sample_count: 40 },
    ],
  },
  {
    company: "Meesho",
    website: "meesho.com",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 16, ctc_max: 22, base_pct: 65, variable_pct: 10, esop_pct: 25, sample_count: 200 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 28, ctc_max: 42, base_pct: 58, variable_pct: 10, esop_pct: 32, sample_count: 160 },
    ],
  },
  {
    company: "PhonePe",
    website: "phonepe.com",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 15, ctc_max: 20, base_pct: 70, variable_pct: 10, esop_pct: 20, sample_count: 280 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 25, ctc_max: 40, base_pct: 60, variable_pct: 12, esop_pct: 28, sample_count: 210 },
    ],
  },
  {
    company: "Zomato",
    website: "zomato.com",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 14, ctc_max: 20, base_pct: 68, variable_pct: 10, esop_pct: 22, sample_count: 360 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 25, ctc_max: 42, base_pct: 60, variable_pct: 10, esop_pct: 30, sample_count: 280 },
      { role: "Product Manager", experience: "3–6 Yrs", ctc_min: 30, ctc_max: 55, base_pct: 60, variable_pct: 15, esop_pct: 25, sample_count: 120 },
    ],
  },
  {
    company: "Swiggy",
    website: "swiggy.com",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 13, ctc_max: 20, base_pct: 68, variable_pct: 12, esop_pct: 20, sample_count: 380 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 24, ctc_max: 40, base_pct: 60, variable_pct: 12, esop_pct: 28, sample_count: 300 },
    ],
  },
  // ── WITCH & Service Companies ─────────────────────────────────
  {
    company: "TCS",
    website: "tcs.com",
    type: "service",
    roles: [
      { role: "Software Engineer (Assistant System Engineer)", experience: "0–1 Yrs", ctc_min: 3.2, ctc_max: 4.5, base_pct: 75, variable_pct: 15, esop_pct: 0, sample_count: 28000 },
      { role: "System Engineer", experience: "1–3 Yrs", ctc_min: 5.5, ctc_max: 7.5, base_pct: 75, variable_pct: 15, esop_pct: 0, sample_count: 22000 },
      { role: "IT Analyst", experience: "3–6 Yrs", ctc_min: 7.5, ctc_max: 11, base_pct: 72, variable_pct: 18, esop_pct: 0, sample_count: 12000 },
      { role: "Senior Consultant", experience: "6–10 Yrs", ctc_min: 12, ctc_max: 18, base_pct: 68, variable_pct: 22, esop_pct: 0, sample_count: 5000 },
    ],
  },
  {
    company: "Infosys",
    website: "infosys.com",
    type: "service",
    roles: [
      { role: "Systems Engineer", experience: "0–1 Yrs", ctc_min: 3.5, ctc_max: 5, base_pct: 75, variable_pct: 15, esop_pct: 0, sample_count: 24000 },
      { role: "Senior Systems Engineer", experience: "1–3 Yrs", ctc_min: 5.5, ctc_max: 7.5, base_pct: 72, variable_pct: 18, esop_pct: 0, sample_count: 18000 },
      { role: "Technology Analyst", experience: "3–6 Yrs", ctc_min: 8, ctc_max: 13, base_pct: 70, variable_pct: 20, esop_pct: 0, sample_count: 8000 },
    ],
  },
  {
    company: "Wipro",
    website: "wipro.com",
    type: "service",
    roles: [
      { role: "Project Engineer", experience: "0–1 Yrs", ctc_min: 3.5, ctc_max: 5, base_pct: 76, variable_pct: 14, esop_pct: 0, sample_count: 20000 },
      { role: "Senior Project Engineer", experience: "1–3 Yrs", ctc_min: 5, ctc_max: 7, base_pct: 73, variable_pct: 17, esop_pct: 0, sample_count: 15000 },
      { role: "Technical Lead", experience: "3–6 Yrs", ctc_min: 8, ctc_max: 13, base_pct: 68, variable_pct: 22, esop_pct: 0, sample_count: 7000 },
    ],
  },
  {
    company: "HCLTech",
    website: "hcltech.com",
    type: "service",
    roles: [
      { role: "Graduate Engineer Trainee", experience: "0–1 Yrs", ctc_min: 3.5, ctc_max: 4.5, base_pct: 76, variable_pct: 14, esop_pct: 0, sample_count: 26000 },
      { role: "Software Engineer", experience: "1–3 Yrs", ctc_min: 5, ctc_max: 7, base_pct: 73, variable_pct: 17, esop_pct: 0, sample_count: 19000 },
      { role: "Senior Technical Lead", experience: "6–10 Yrs", ctc_min: 12, ctc_max: 20, base_pct: 65, variable_pct: 25, esop_pct: 0, sample_count: 4000 },
    ],
  },
  {
    company: "Accenture",
    website: "accenture.com",
    type: "service",
    roles: [
      { role: "Associate Software Engineer", experience: "0–1 Yrs", ctc_min: 4, ctc_max: 5.5, base_pct: 75, variable_pct: 15, esop_pct: 0, sample_count: 22000 },
      { role: "Software Engineer", experience: "1–3 Yrs", ctc_min: 6, ctc_max: 9, base_pct: 72, variable_pct: 18, esop_pct: 0, sample_count: 16000 },
      { role: "Application Development Lead", experience: "3–6 Yrs", ctc_min: 10, ctc_max: 17, base_pct: 68, variable_pct: 22, esop_pct: 0, sample_count: 7000 },
    ],
  },
  {
    company: "Cognizant",
    website: "cognizant.com",
    type: "service",
    roles: [
      { role: "Programmer Analyst Trainee", experience: "0–1 Yrs", ctc_min: 3.5, ctc_max: 4.8, base_pct: 76, variable_pct: 14, esop_pct: 0, sample_count: 21000 },
      { role: "Programmer Analyst", experience: "1–3 Yrs", ctc_min: 5.5, ctc_max: 8, base_pct: 72, variable_pct: 18, esop_pct: 0, sample_count: 16000 },
      { role: "Senior Analyst", experience: "3–6 Yrs", ctc_min: 9, ctc_max: 14, base_pct: 68, variable_pct: 22, esop_pct: 0, sample_count: 6000 },
    ],
  },
  // ── Global YC Startups (India-hired roles) ───────────────────
  {
    company: "Stripe",
    website: "stripe.com",
    type: "startup",
    roles: [
      { role: "Software Engineer (L2)", experience: "0–2 Yrs", ctc_min: 25, ctc_max: 40, base_pct: 55, variable_pct: 10, esop_pct: 35, sample_count: 280 },
      { role: "Software Engineer (L3)", experience: "3–6 Yrs", ctc_min: 50, ctc_max: 90, base_pct: 45, variable_pct: 10, esop_pct: 45, sample_count: 210 },
    ],
  },
  {
    company: "Coinbase",
    website: "coinbase.com",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 22, ctc_max: 35, base_pct: 55, variable_pct: 10, esop_pct: 35, sample_count: 180 },
    ],
  },
  {
    company: "Airbnb",
    website: "airbnb.com",
    type: "product",
    roles: [
      { role: "Software Engineer (L4)", experience: "0–2 Yrs", ctc_min: 22, ctc_max: 34, base_pct: 52, variable_pct: 13, esop_pct: 35, sample_count: 320 },
      { role: "Software Engineer (L5)", experience: "3–6 Yrs", ctc_min: 40, ctc_max: 75, base_pct: 42, variable_pct: 13, esop_pct: 45, sample_count: 240 },
    ],
  },
  // ── Mid-tier Startups ─────────────────────────────────────────
  {
    company: "Groww",
    website: "groww.in",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 15, ctc_max: 22, base_pct: 65, variable_pct: 10, esop_pct: 25, sample_count: 200 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 28, ctc_max: 45, base_pct: 58, variable_pct: 10, esop_pct: 32, sample_count: 150 },
    ],
  },
  {
    company: "BrowserStack",
    website: "browserstack.com",
    type: "startup",
    roles: [
      { role: "Software Engineer", experience: "0–2 Yrs", ctc_min: 14, ctc_max: 22, base_pct: 68, variable_pct: 10, esop_pct: 22, sample_count: 140 },
      { role: "Senior Software Engineer", experience: "3–6 Yrs", ctc_min: 26, ctc_max: 42, base_pct: 60, variable_pct: 10, esop_pct: 30, sample_count: 110 },
    ],
  },
  {
    company: "Atlassian",
    website: "atlassian.com",
    type: "product",
    roles: [
      { role: "Software Engineer (P3)", experience: "0–2 Yrs", ctc_min: 20, ctc_max: 32, base_pct: 58, variable_pct: 10, esop_pct: 32, sample_count: 310 },
      { role: "Software Engineer (P4)", experience: "3–6 Yrs", ctc_min: 35, ctc_max: 60, base_pct: 48, variable_pct: 12, esop_pct: 40, sample_count: 240 },
    ],
  },
];

/** Flatten all roles to a searchable flat array */
export const ALL_SALARY_RECORDS = SALARY_DATA.flatMap(company =>
  company.roles.map(role => ({
    company: company.company,
    website: company.website,
    type: company.type,
    ...role,
  }))
);

/** Get unique companies for the browse view */
export function getCompaniesList() {
  return SALARY_DATA.map(c => ({
    company: c.company,
    website: c.website,
    type: c.type,
    roleCount: c.roles.length,
    minCTC: Math.min(...c.roles.map(r => r.ctc_min)),
    maxCTC: Math.max(...c.roles.map(r => r.ctc_max)),
  }));
}

/** Search salary records by company or role name */
export function searchSalaries(query = "", experience = "all") {
  const q = query.toLowerCase().trim();
  return ALL_SALARY_RECORDS.filter(r => {
    const matchesQuery = !q || r.company.toLowerCase().includes(q) || r.role.toLowerCase().includes(q);
    const matchesExp = experience === "all" || r.experience === experience;
    return matchesQuery && matchesExp;
  });
}
