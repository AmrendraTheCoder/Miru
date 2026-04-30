import { DM_Sans } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";


const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://miru-1.vercel.app"),
  title: {
    default: "Miru",
    template: "%s | Miru",
  },
  icons: {
    icon: "/icon.svg",
  },
  description:
    "Deep research on funded startups from YC, Harvard & Techstars. Founder profiles, funding timelines, competitor landscapes, and market analysis. Powered by Exa + Gemini.",
  keywords:
    "Y Combinator, startup research, founder profiles, venture capital, competitor analysis, startup funding, LeetCode interview prep, startup jobs",
  authors: [{ name: "Miru", url: "https://miru-1.vercel.app" }],
  creator: "Miru Intelligence",
  verification: {
    google: "Wx-xYzI1Rkr_z2OmDweNyGWTC2IX8si2ugVoTn-PIew",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://miru-1.vercel.app",
    siteName: "Miru",
    title: "Miru — Startup Intelligence",
    description: "Research funded startups like a senior analyst. 見る · To see · To examine.",
  },
  twitter: {
    card: "summary",
    title: "Miru — Startup Intelligence",
    description: "Research funded startups like a senior analyst.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};


export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}

