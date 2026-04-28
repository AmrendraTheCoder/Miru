import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Startup Intel — YC, Harvard & Techstars Research Platform",
  description:
    "Deep research on funded startups — why they got funding, founder backgrounds, competitor landscapes, and market analysis. Powered by Exa + Gemini.",
  keywords: "Y Combinator, startup research, founder profiles, venture capital, competitor analysis, startup funding",
  openGraph: {
    title: "Startup Intel",
    description: "Research funded startups like a senior analyst",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
