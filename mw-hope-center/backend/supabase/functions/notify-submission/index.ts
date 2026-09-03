// supabase/functions/notify-submission/index.ts
//
// Deploy with: supabase functions deploy notify-submission
// Set secret with: supabase secrets set RESEND_API_KEY=your_key_here
//
// Wire this up in Supabase -> Database -> Webhooks: create a webhook on
// each table (get_help_submissions, volunteer_applications,
// contact_messages, newsletter_signups) that fires on INSERT and calls
// this function's URL. The webhook payload includes which table changed
// (payload.table) and the new row (payload.record) automatically.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_TO = "don@mwhopecenter.org"; // CHANGE if notifications should go elsewhere
const FROM_ADDRESS = "notifications@mwhopecenter.org"; // must be a verified sender/domain in Resend

const TABLE_LABELS: Record<string, string> = {
  get_help_submissions: "New Get Help Request",
  volunteer_applications: "New Volunteer Application",
  contact_messages: "New Contact Message",
  newsletter_signups: "New Newsletter Signup",
};

function formatRow(record: Record<string, unknown>): string {
  return Object.entries(record)
    .filter(([key]) => !["id", "created_at"].includes(key))
    .map(([key, value]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#16283F;">${key}</td><td style="padding:4px 0;color:#3F4854;">${value ?? ""}</td></tr>`)
    .join("");
}

serve(async (req) => {
  try {
    const payload = await req.json();
    const table = payload.table as string;
    const record = payload.record as Record<string, unknown>;

    const subject = TABLE_LABELS[table] || `New submission: ${table}`;
    const html = `
      <div style="font-family:sans-serif;max-width:560px;">
        <h2 style="color:#16283F;">${subject}</h2>
        <table>${formatRow(record)}</table>
        <p style="color:#8791A0;font-size:12px;margin-top:20px;">
          Submitted via mwhopecenter.org
        </p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: NOTIFY_TO,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ ok: false, error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
