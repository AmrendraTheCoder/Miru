import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Miru",
  description:
    "Deep research on funded startups from YC, Harvard & Techstars. Founder profiles, funding timelines, competitor landscapes, and market analysis. Powered by Exa + Gemini.",
  keywords: "Y Combinator, startup research, founder profiles, venture capital, competitor analysis, startup funding, miru",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Miru — Startup Intelligence",
    description: "Research funded startups like a senior analyst. 見る · To see · To examine.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
