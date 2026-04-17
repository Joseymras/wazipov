import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reference } = await req.json();
    if (!reference) return json({ error: "Missing reference" }, 400);

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await res.json();

    if (!data.status || data.data.status !== "success") {
      return json({ success: false, message: data.message || "Payment not successful" });
    }

    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { user_id, plan } = data.data.metadata || {};

    if (user_id && plan) {
      // Update subscription
      await supa
        .from("subscriptions")
        .update({
          status: "active",
          paystack_customer_id: data.data.customer?.customer_code,
          current_period_end: plan === "platinum" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("reference", reference);

      // Update user profile tier
      await supa.from("profiles").update({ subscription_tier: plan }).eq("user_id", user_id);
    }

    return json({ success: true, plan });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
