import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const RESEND_API_KEY = "re_cLTCPVC5_KWXsDRnkAA5R56UfCbfgoSjT";

export async function POST(req) {
  try {
    const { email, role = "Student / Professional" } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // 1. Insert into Supabase waitlist table
    // (Ensure you create this table: CREATE TABLE waitlist (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, email text UNIQUE, role text, created_at timestamptz DEFAULT now());)
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert([{ email, role }]);

    // Ignore unique constraint error if they already signed up
    if (dbError && dbError.code !== "23505") {
      console.error("[Waitlist] DB Error:", dbError);
      return NextResponse.json({ error: "Failed to join waitlist. Please try again." }, { status: 500 });
    }

    // 2. Send professional welcome email via Resend
    // Note: If you add a custom domain to Resend later, change the "from" address below.
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Miru V2 <onboarding@resend.dev>",
        to: email,
        subject: "You're on the list for Miru V2 🚀",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #e8522a; margin-bottom: 0;">M</h1>
              <h2 style="color: #1a1a1a; margin-top: 10px;">Miru V2 Early Access</h2>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi there,</p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              You're officially on the waitlist for Miru V2. We're building the most powerful intelligence terminal for job seekers and recruiters, and you'll be among the first to get access.
            </p>
            
            <div style="background-color: #fffaf5; border: 1px solid #f0e6db; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #e8522a; margin-top: 0;">What to expect in V2:</h3>
              <ul style="color: #444; line-height: 1.6; padding-left: 20px; margin-bottom: 0;">
                <li><strong>Campus Placement Time-Machine:</strong> 5-year historical data of companies, PPOs, and placement ratios.</li>
                <li><strong>Inside Reality Tracker:</strong> Anonymous employee reviews and bias tracking.</li>
                <li><strong>Verified Interview Intel:</strong> Real, recent interview questions.</li>
                <li><strong>AI Career Predictor:</strong> Salary projections based on your resume.</li>
                <li><strong>Auto-Pilot Applications:</strong> Curated feeds with AI-generated application answers.</li>
              </ul>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              We'll email you as soon as your spot opens up. Prepare for a massive upgrade to your career trajectory.
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Best,<br>
              <strong>The Miru Team</strong>
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
              © 2026 Miru Intelligence. All rights reserved.
            </div>
          </div>
        `
      })
    });

    const resendData = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error("[Waitlist] Resend Error:", resendData);
      // We still return success if the DB insert worked, but log the email error
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Waitlist] Catch Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
