import MiruApp from "../components/MiruApp";

export const metadata = {
  title: "Discover Startups — YC, Unicorns & Emerging Companies",
  description:
    "Explore 2,000+ YC-backed startups, unicorns, and emerging companies. Filter by sector, batch, and funding stage. Deep-dive into founder profiles and market data.",
  keywords:
    "YC startups, Y Combinator companies, startup discovery, unicorn companies, startup database, funded startups, startup directory India",
  alternates: {
    canonical: "https://miru-1.vercel.app/discover",
  },
  openGraph: {
    type: "website",
    url: "https://miru-1.vercel.app/discover",
    title: "Discover Startups — YC, Unicorns & Emerging Companies | Miru",
    description:
      "Explore 2,000+ funded startups. Filter by sector, batch, stage. Founder profiles and market analysis.",
    siteName: "Miru",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Startups | Miru",
    description:
      "Explore 2,000+ YC-backed startups, unicorns, and emerging companies.",
  },
};

export default function DiscoverPage() {
  return <MiruApp initialTab="discover" />;
}
