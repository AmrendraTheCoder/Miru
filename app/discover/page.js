import Home from "../page";

export const metadata = {
  title: "Discover — Miru | Explore Startups & Companies",
  description: "Explore YC-backed startups, unicorns, and emerging companies. Filter by sector, stage, and batch.",
};

export default function DiscoverPage() {
  return <Home initialTab="discover" />;
}
