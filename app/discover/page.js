import Home from "../page";

const BASE_URL = "https://miru-1.vercel.app";

export const metadata = {
  title: "Discover Startups — Miru | YC Companies, Unicorns & Big Tech",
  description:
    "Explore 2000+ YC-backed startups, unicorns, Fortune 500 and Big Tech companies. Filter by sector, batch, and funding stage. Research any company with AI.",
  keywords:
    "YC startups, YC companies database, unicorn companies, Y Combinator W25, startup discovery, company research, Miru discover",
  openGraph: {
    title: "Discover Startups — Miru",
    description:
      "Browse 2000+ YC startups, unicorns, and tech giants. Research any company with AI in seconds.",
    url: `${BASE_URL}/discover`,
    type: "website",
    siteName: "Miru",
  },
  twitter: { card: "summary", title: "Discover Startups — Miru" },
  alternates: { canonical: `${BASE_URL}/discover` },
};

export default function DiscoverPage() {
  return <Home initialTab="discover" />;
}
