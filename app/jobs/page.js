import Home from "../page";

export const metadata = {
  title: "Jobs — Miru | Remote Jobs, Internships & Freelance",
  description: "Verified job listings, remote internships and freelance gigs from global platforms. Freshness-checked daily.",
};

export default function JobsPage() {
  return <Home initialTab="jobs" />;
}
