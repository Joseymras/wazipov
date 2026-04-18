import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import Stripe from "npm:stripe@17.5.0";

const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id } = await req.json();
    if (!session_id) return json({ error: "Missing session_id" }, 400);

    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2024-12-18.acacia" });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return json({ success: false, message: "Payment not completed" });
    }

    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { user_id, plan } = (session.metadata || {}) as { user_id?: string; plan?: string };

    if (user_id && plan) {
      await supa.from("subscriptions").update({
        status: "active",
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        current_period_end: plan === "platinum" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("stripe_session_id", session_id);

      await supa.from("profiles").update({ subscription_tier: plan }).eq("user_id", user_id);
    }

    return json({ success: true, plan });
  } catch (err) {
    console.error("stripe-verify error:", err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
