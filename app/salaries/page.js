import MiruApp from "../components/MiruApp";

export const metadata = {
  title: "Salary Intelligence — Real CTC Decoder & In-Hand Calculator",
  description:
    "Find real salary data for Indian tech companies. Decode any CTC into actual monthly in-hand pay. Old vs New Tax Regime calculator for FY 2025-26. No paywalls.",
  keywords:
    "real CTC calculator, in-hand salary India, tax regime comparison, startup salary, SDE salary India, new tax regime 2025, monthly take home calculator",
  alternates: {
    canonical: "https://miru-1.vercel.app/salaries",
  },
  openGraph: {
    type: "website",
    url: "https://miru-1.vercel.app/salaries",
    title: "Real CTC Decoder & Salary Intelligence | Miru",
    description:
      "Decode any CTC into your real monthly in-hand salary. Old vs New Tax Regime. ESOP inflation warnings. No signup required.",
    siteName: "Miru",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real CTC Decoder | Miru",
    description:
      "Break down any CTC into your actual take-home. New vs Old Tax Regime for FY 2025-26.",
  },
};

export default function SalariesPage() {
  return <MiruApp initialTab="salaries" />;
}
