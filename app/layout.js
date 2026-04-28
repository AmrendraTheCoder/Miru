import "./globals.css";

export const metadata = {
  title: "Startup Intelligence | YC & Incubator Research Platform",
  description: "Deep research on funded startups — founders, funding, competitors, and market intelligence powered by an adaptive RL search engine.",
  keywords: ["startup research", "Y Combinator", "venture capital", "founder intelligence"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
