/**
 * Gemini AI Analyzer — Startup Intelligence Prompts
 * Multi-model cascade. Called directly from browser (no server proxy).
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const MODELS = [
  { id: "gemini-2.5-flash", json: true },
  { id: "gemini-2.0-flash", json: true },
  { id: "gemini-2.0-flash-lite", json: true },
  { id: "gemini-2.5-pro", json: true },
  { id: "gemma-3-27b-it", json: false },
  { id: "gemma-3-12b-it", json: false },
  { id: "gemma-3-4b-it", json: false },
];

function parseJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); }
  catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("JSON parse failed");
  }
}

async function tryModel(apiKey, modelId, jsonMode, prompt) {
  const cfg = { temperature: 0.15, maxOutputTokens: 4000 };
  if (jsonMode) cfg.responseMimeType = "application/json";
  const res = await fetch(`${GEMINI_BASE}/${modelId}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: cfg }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw Object.assign(new Error(e.error?.message || `${modelId} failed`), { retryable: res.status === 429 || res.status === 503 });
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return { result: parseJson(text), model: modelId };
}

async function cascade(apiKey, prompt) {
  for (const m of MODELS) {
    try {
      const r = await tryModel(apiKey, m.id, m.json, prompt);
      return { ...r.result, _model: r.model };
    } catch (e) {
      console.warn(`${m.id}: ${e.message}`);
    }
  }
  throw new Error("All models exhausted");
}

function buildContext(pages) {
  return pages.slice(0, 12).map((p, i) => {
    const parts = [`[Source ${i + 1}] ${p.url}`];
    if (p.title) parts.push(`Title: ${p.title}`);
    if (p.summary) parts.push(`Summary: ${p.summary}`);
    if (p.highlights?.length) parts.push(`Highlights:\n${p.highlights.map(h => `  • ${h}`).join("\n")}`);
    if (p.text) parts.push(`Text:\n${p.text.slice(0, 2500)}`);
    return parts.join("\n");
  }).join("\n\n---\n\n").slice(0, 30000);
}

/* ── 1. Full startup research report ── */
export async function analyseStartup(apiKey, startupName, pages) {
  const ctx = buildContext(pages);
  const prompt = `You are a senior market research analyst with 50 years of experience advising top VC firms and PE funds. 
Analyse the following research data about "${startupName}" and produce a comprehensive startup intelligence report.

RESEARCH DATA:
${ctx}

Return ONLY valid JSON. No markdown fences, no commentary:

{
  "name": "official company name",
  "tagline": "one-line description",
  "overview": "4-5 sentence executive overview — what they do, who they serve, why they matter",
  "founded": "year founded or null",
  "headquarters": "city, country or null",
  "stage": "Pre-seed / Seed / Series A / Series B / Series C / Public or null",
  "totalFunding": "total funding raised (e.g. $12M) or null",
  "domain": "primary domain/website",
  "problem": {
    "statement": "2-3 sentences on the core problem they are solving",
    "urgency": "why this problem needs solving now",
    "marketSize": "TAM estimate if available"
  },
  "solution": "2-3 sentences on their specific approach/solution",
  "whyFunded": "2-3 sentences on the key reasons investors backed them — timing, team, traction, market",
  "fundingTimeline": [
    { "date": "Month Year or Year", "event": "event name", "amount": "$Xm or null", "investors": "investor names or null", "detail": "short description" }
  ],
  "founders": [
    {
      "name": "full name",
      "role": "CEO / CTO / etc",
      "background": "2-3 sentence bio — education, previous companies, relevant experience",
      "previousCompanies": ["company1", "company2"],
      "education": "school + degree or null",
      "notableAchievements": ["achievement1"],
      "personalitySignals": ["trait from interviews/talks"],
      "linkedinKeywords": ["keyword1", "keyword2"],
      "linkedinUrl": "https://www.linkedin.com/in/their-profile or null"
    }
  ],
  "pressArticles": [
    { "title": "article title", "source": "publication name", "date": "date", "url": "url", "summary": "1 sentence summary" }
  ],
  "competitorNames": ["competitor1", "competitor2", "competitor3"],
  "competitiveAdvantage": "what makes them hard to replicate",
  "risks": ["risk1", "risk2"],
  "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "sector": "primary sector (e.g. FinTech, HealthTech, AI, SaaS, etc.)",
  "analystVerdict": {
    "summary": "3-4 sentences — senior analyst opinion on this company's position and prospects",
    "marketPosition": "Leader / Challenger / Niche / Emerging",
    "fundingLikelihood": "High / Medium / Low",
    "moatStrength": "Strong / Moderate / Weak",
    "watchScore": "1-10 — how closely should investors watch this"
  }
}

CRITICAL: Extract REAL data only. If unknown, use null. Be thorough.`;

  return cascade(apiKey, prompt);
}

/* ── 2. Competitor deep profile ── */
export async function analyseCompetitor(apiKey, compName, pages) {
  const ctx = buildContext(pages);
  const prompt = `You are a senior competitive intelligence analyst. 
Analyse this data about "${compName}" as a competitor to a startup we are researching.

DATA:
${ctx}

Return ONLY valid JSON:

{
  "name": "company name",
  "tagline": "one-liner",
  "founded": "year or null",
  "headquarters": "city, country or null",
  "totalFunding": "total raised or null",
  "stage": "funding stage",
  "founders": [{ "name": "name", "role": "role", "background": "brief bio" }],
  "whatTheyDo": "2-3 sentence description",
  "differentiation": "what makes them unique vs the market",
  "targetCustomer": "who they serve",
  "businessModel": "how they make money",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "keyWeaknesses": ["weakness1", "weakness2"],
  "threatLevel": "High / Medium / Low",
  "threatReason": "why they are a high/medium/low threat",
  "domain": "website domain"
}`;

  return cascade(apiKey, prompt);
}

/* ── 3. News item parsing ── */
export async function analyseNewsItems(apiKey, rawItems) {
  // ✅ Use ALL items — was slice(0,15) which silently dropped results
  const ctx = rawItems.map((r, i) =>
    `[${i + 1}] Title: ${r.title}\nURL: ${r.url}\nDate: ${r.publishedDate || "unknown"}\nText: ${r.highlights?.[0] || r.summary || r.text?.slice(0, 500) || ""}`
  ).join("\n\n---\n\n");

  const prompt = `You are a startup news curator. Parse these raw search results into clean startup news items.

RAW DATA:
${ctx}

Return ONLY valid JSON array (no wrapping object, no markdown):
[
  {
    "headline": "clean concise headline (max 12 words)",
    "startup": "startup/company name",
    "summary": "2-3 sentence summary of what happened and why it matters",
    "amount": "$Xm or null",
    "stage": "Seed / Series A / Series B / Series C / Acquired / IPO / Launch / Other",
    "source": "publication name",
    "date": "date string from the article",
    "url": "article url",
    "researchQuery": "startup name to use for researching this company"
  }
]

Include ALL items about startups receiving funding, launching, being acquired, or going public. Do NOT cap the count — return every qualifying item.`;

  try {
    const r = await cascade(apiKey, prompt);
    return Array.isArray(r) ? r : (r.items || []);
  } catch { return []; }
}


/* ── 4. YC batch parsing ── */
export async function analyseYCBatch(apiKey, pages, batch) {
  const ctx = buildContext(pages);
  const prompt = `Extract a list of Y Combinator ${batch} batch startups from this content.

CONTENT:
${ctx}

Return ONLY valid JSON array:
[
  {
    "name": "startup name",
    "tagline": "one-line description",
    "sector": "sector",
    "domain": "domain or null",
    "batch": "${batch}",
    "description": "2-3 sentence description of what they do and why it matters"
  }
]

Extract as many real startups as you can identify. Max 20.`;

  try {
    const r = await cascade(apiKey, prompt);
    return Array.isArray(r) ? r : (r.startups || []);
  } catch { return []; }
}

/* ── 5. LinkedIn message generation ── */
export async function generateOutreachDraft(apiKey, founderData, userContext, tone, hook) {
  const toneGuide = {
    Peer: "Write as an equal — fellow builder/founder. Casual but substantive. No flattery.",
    Admirer: "Genuine admiration for specific work. Not sycophantic. Reference something real.",
    Investor: "Sharp, direct. Signal you understand the space. 1-2 smart observations.",
    Collaborator: "Looking for a specific kind of collaboration. Be clear about what you bring.",
  };

  const hookGuide = {
    "their problem": `Reference the problem ${founderData.name} is solving and why you find it compelling`,
    "their funding": `Reference their recent funding round and what it signals`,
    "their background": `Reference something specific from ${founderData.name}'s background that resonates`,
    "recent news": `Reference something recent about ${founderData.startup || "their company"}`,
  };

  const prompt = `Write a LinkedIn message from ${userContext.name} to ${founderData.name}, the ${founderData.role} of ${founderData.startup || "their startup"}.

SENDER CONTEXT: ${userContext.bio}
RECIPIENT: ${founderData.name}, ${founderData.role}${founderData.background ? ` — ${founderData.background}` : ""}
TONE: ${toneGuide[tone] || toneGuide["Peer"]}
HOOK: ${hookGuide[hook] || hookGuide["their problem"]}

RULES (strictly follow):
- 3-5 sentences MAX
- No "I came across your profile"
- No "I'd love to connect"  
- No "synergies", "leverage", "reach out", "touch base"
- No "I hope this message finds you well"
- No generic compliments ("amazing work", "crushing it")
- Sound like a real person texting, not a marketing email
- End with ONE specific question or ask — not "would love to chat"
- Do NOT use bullet points

Return ONLY the message text. Nothing else.`;

  try {
    // For outreach, we want plain text not JSON
    const res = await fetch(`${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      }),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text.trim();
  } catch { return ""; }
}
