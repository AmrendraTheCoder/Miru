import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Source fetchers ─────────────────────────────────────────────────────────

async function fetchRemotive() {
  // Free public API — no auth needed, global remote jobs
  const res  = await fetch("https://remotive.com/api/remote-jobs?limit=100", {
    headers: { "User-Agent": "Miru/1.0" },
  });
  const data = await res.json();
  return (data.jobs || []).map(j => ({
    title:      j.title,
    company:    j.company_name,
    location:   j.candidate_required_location || "Remote",
    type:       mapType(j.job_type),
    source:     "remotive",
    source_url: j.url,
    salary:     j.salary || null,
    skills:     extractTags(j.tags || []),
    full_description: j.description || null,   // they allow this
    closes_at:  null,
    status:     "active",
    logo_url:   j.company_logo || null,
  }));
}

async function fetchRemoteOK() {
  // Free public JSON API — no auth needed, global remote jobs
  const res  = await fetch("https://remoteok.com/api", {
    headers: { "User-Agent": "Miru/1.0" },
  });
  const raw  = await res.json();
  // first item is metadata, skip it
  return (raw || []).slice(1).map(j => ({
    title:      j.position || j.company,
    company:    j.company,
    location:   "Remote",
    type:       mapRemoteOKType(j.tags || []),
    source:     "remoteok",
    source_url: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
    salary:     j.salary ? `$${j.salary_min}–$${j.salary_max}` : null,
    skills:     (j.tags || []).slice(0, 8),
    full_description: null,   // remoteok ToS restricts full text
    closes_at:  null,
    status:     "active",
    logo_url:   j.logo || null,
  }));
}

async function fetchWellfound() {
  // Wellfound (AngelList) — public job listing page, startup-focused
  // Using their public API endpoint that powers the jobs page
  try {
    const res = await fetch(
      "https://wellfound.com/company_stories/jobs_for_home_feed?page=1",
      { headers: { "User-Agent": "Miru/1.0", "Accept": "application/json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || data.job_listings || [];
    return jobs.map(j => ({
      title:      j.title || j.role,
      company:    j.startup_name || j.company,
      location:   j.location || "Remote",
      type:       "job",
      source:     "wellfound",
      source_url: j.url || `https://wellfound.com/jobs/${j.id}`,
      salary:     j.compensation || null,
      skills:     [],
      full_description: null,
      closes_at:  null,
      status:     "active",
      logo_url:   j.logo_url || null,
    }));
  } catch {
    return [];
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapType(t = "") {
  const lower = t.toLowerCase();
  if (lower.includes("intern"))   return "internship";
  if (lower.includes("freelan") || lower.includes("contract")) return "freelance";
  return "job";
}

function mapRemoteOKType(tags = []) {
  const t = tags.map(x => x.toLowerCase()).join(" ");
  if (t.includes("intern"))           return "internship";
  if (t.includes("freelan") || t.includes("contract")) return "freelance";
  return "job";
}

function extractTags(tags) {
  if (!tags || !tags.length) return [];
  if (typeof tags[0] === "string") return tags.slice(0, 8);
  return tags.map(t => t.name || t).slice(0, 8);
}

// ── Upsert into Supabase ─────────────────────────────────────────────────────

async function upsertJobs(jobs) {
  if (!jobs.length) return 0;
  const { error } = await supabase
    .from("job_listings")
    .upsert(jobs, { onConflict: "source_url", ignoreDuplicates: false });
  if (error) console.error("Upsert error:", error.message);
  return jobs.length;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const [remotive, remoteok, wellfound] = await Promise.allSettled([
      fetchRemotive(),
      fetchRemoteOK(),
      fetchWellfound(),
    ]);

    const all = [
      ...(remotive.status  === "fulfilled" ? remotive.value  : []),
      ...(remoteok.status  === "fulfilled" ? remoteok.value  : []),
      ...(wellfound.status === "fulfilled" ? wellfound.value : []),
    ];

    const count = await upsertJobs(all);

    return NextResponse.json({
      success: true,
      scraped: all.length,
      sources: {
        remotive:  remotive.status  === "fulfilled" ? remotive.value.length  : 0,
        remoteok:  remoteok.status  === "fulfilled" ? remoteok.value.length  : 0,
        wellfound: wellfound.status === "fulfilled" ? wellfound.value.length : 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
