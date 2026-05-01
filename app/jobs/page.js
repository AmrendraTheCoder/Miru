import Home from "../page";

const BASE_URL = "https://miru-1.vercel.app";

export const metadata = {
  title: "Jobs & Internships — Miru | Remote Jobs, Freelance & Campus Roles",
  description:
    "Verified job listings, remote internships, and freelance gigs from Remotive, RemoteOK, Wellfound, and Internshala. Freshness-checked daily for students and builders.",
  keywords:
    "remote jobs, internships, freelance gigs, startup jobs, campus placement, Remotive, RemoteOK, Wellfound, Internshala, tech jobs 2025",
  openGraph: {
    title: "Jobs & Internships — Miru",
    description:
      "Daily-updated remote jobs, internships and freelance gigs. Global listings verified and freshness-checked.",
    url: `${BASE_URL}/jobs`,
    type: "website",
    siteName: "Miru",
  },
  twitter: { card: "summary", title: "Jobs & Internships — Miru" },
  alternates: { canonical: `${BASE_URL}/jobs` },
};

export default function JobsPage() {
  return <Home initialTab="jobs" />;
}
