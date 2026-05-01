import Home from "../page";

export const metadata = {
  title: "Feed — Miru | Startup News & Intelligence",
  description: "Daily curated startup news, funding rounds, and founder insights. Stay ahead of the ecosystem.",
};

export default function FeedPage() {
  return <Home initialTab="feed" />;
}
