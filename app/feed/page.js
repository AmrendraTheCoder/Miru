import Home from "../page";

const BASE_URL = "https://miru-1.vercel.app";

export const metadata = {
  title: "Startup News Feed — Miru | Daily Funding Rounds & Launch News",
  description:
    "Daily curated startup news — funding rounds, acquisitions, IPOs, and product launches from TechCrunch, Bloomberg, Reuters and more. Powered by Exa AI.",
  keywords:
    "startup news, daily funding news, series A series B, startup acquisitions, tech news feed, Miru feed",
  openGraph: {
    title: "Startup News Feed — Miru",
    description:
      "Daily startup intelligence — funding, acquisitions, IPOs and launches curated in real time.",
    url: `${BASE_URL}/feed`,
    type: "website",
    siteName: "Miru",
  },
  twitter: { card: "summary", title: "Startup News Feed — Miru" },
  alternates: { canonical: `${BASE_URL}/feed` },
};

export default function FeedPage() {
  return <Home initialTab="feed" />;
}
