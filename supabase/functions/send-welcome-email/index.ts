import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = "re_hoNsTPLF_JzdNN4pxu32JmUJ1Tq6amGf6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userName, userEmail } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Eternity Echoes <info@eternityechoes.org>",
        to: [userEmail],
        subject: "✨ Welcome to All Believers Conference 2026!",
        html: `
          <div style="background-color:#050505;padding:60px 20px;text-align:center;color:#ffffff;font-family:Inter,sans-serif;">
            <table width="600" style="margin:0 auto;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:32px;padding:40px;">
              <tr><td>
                <div style="margin-bottom:30px;">
                  <img src="https://fztctnfuxbtmqgqcmvyq.supabase.co/storage/v1/object/public/ministry-assets/logo.png" style="height:50px;">
                </div>
                <h1 style="font-family:'Playfair Display',serif;color:#d4af37;font-size:2rem;margin-bottom:10px;">Welcome, ${userName}!</h1>
                <p style="font-size:1.1rem;opacity:0.8;margin-bottom:30px;">Your registration for the <strong>All Believers Conference</strong> is confirmed.</p>
                <div style="background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.1);border-radius:20px;padding:30px;margin-bottom:30px;text-align:left;">
                  <h3 style="color:#d4af37;margin-top:0;">What to Expect:</h3>
                  <p style="font-size:0.95rem;opacity:0.7;line-height:1.8;">
                    • Life-changing encounters with the Word.<br>
                    • Spirit-filled worship and prophetic ministry.<br>
                    • A community of believers on fire for God.
                  </p>
                </div>
                <p style="font-size:1rem;opacity:0.7;line-height:1.6;margin-bottom:40px;">
                  Stay tuned to this email for exclusive event updates, schedules, and prayer guides. We cannot wait to see you there!
                </p>
                <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:30px;">
                  <p style="font-weight:700;color:#d4af37;margin:0;">Eternity Echoes Global Ministry</p>
                  <p style="font-size:0.8rem;opacity:0.4;">"Sounding the Call of Eternity"</p>
                </div>
              </td></tr>
            </table>
          </div>
        `,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.ok ? 200 : 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
