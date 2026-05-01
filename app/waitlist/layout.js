export const metadata = {
  title: "V1.0",
  description: "Join the exclusive waitlist for Miru V2. Access 5-year campus placement trends, anonymous reality trackers, verified interview intel, and AI salary predictors.",
  openGraph: {
    title: "Miru V2 Early Access",
    description: "Decoding campus placements, company culture, and interview realities.",
    url: "https://businesssearch.com/waitlist",
    siteName: "Miru Intelligence",
    images: [
      {
        url: "/icon.svg",
        width: 800,
        height: 600,
        alt: "Miru Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miru V2 Early Access",
    description: "The ultimate intelligence terminal for job seekers.",
  },
};

export default function WaitlistLayout({ children }) {
  return children;
}
