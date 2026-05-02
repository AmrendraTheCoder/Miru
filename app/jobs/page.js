// ── Jobs page — Reserved for V1 ──
// The entire Jobs feature (scraping, filters, job cards, API) is preserved in:
//   - app/components/MiruApp.js (tab === "jobs" block, all job state hooks)
//   - app/api/jobs/ and app/api/scrape/
// To reactivate: remove this redirect, swap the nav tab back to "jobs", and re-expose the MiruApp "jobs" tab.

import { redirect } from "next/navigation";

export default function JobsPage() {
  redirect("/salaries");
}

