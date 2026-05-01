import MiruApp from "../components/MiruApp";

export const metadata = {
  title: "Startup News Feed — Daily Funding & Founder Updates",
  description:
    "Your daily curated startup news: YC funding rounds, founder moves, product launches and market shifts. Powered by real-time intelligence from Miru.",
  keywords:
    "startup news, YC funding, founder updates, venture capital news, startup funding rounds, daily startup intelligence",
  alternates: {
    canonical: "https://miru-1.vercel.app/feed",
  },
  openGraph: {
    type: "website",
    url: "https://miru-1.vercel.app/feed",
    title: "Startup News Feed | Miru",
    description:
      "Daily curated startup news: YC funding rounds, founder moves, and market shifts. Real-time intelligence.",
    siteName: "Miru",
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup News Feed | Miru",
    description:
      "Daily curated startup news: YC funding, founder moves, market shifts.",
  },
};

export default function FeedPage() {
  return <MiruApp initialTab="feed" />;
}
