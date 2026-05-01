import MiruApp from "../components/MiruApp";

export const metadata = {
  title: "Remote Jobs, Internships & Freelance — Global Listings",
  description:
    "Verified remote job listings, internships, and freelance gigs from Remotive, RemoteOK, and Wellfound. Freshness-checked daily. Built for students targeting startup careers.",
  keywords:
    "remote jobs, startup jobs, remote internships, freelance gigs, work from home, YC startup jobs, startup internships India, remote work 2025",
  alternates: {
    canonical: "https://miru-1.vercel.app/jobs",
  },
  openGraph: {
    type: "website",
    url: "https://miru-1.vercel.app/jobs",
    title: "Remote Jobs & Startup Internships | Miru",
    description:
      "Verified remote job listings, internships and freelance gigs. Sourced from Remotive, RemoteOK & Wellfound. Freshness-checked daily.",
    siteName: "Miru",
  },
  twitter: {
    card: "summary_large_image",
    title: "Remote Jobs & Startup Internships | Miru",
    description:
      "Verified remote jobs, internships and freelance gigs. Sourced globally, checked daily.",
  },
};

export default function JobsPage() {
  return <MiruApp initialTab="jobs" />;
}
