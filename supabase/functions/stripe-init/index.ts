import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import Stripe from "npm:stripe@17.5.0";

const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// USD prices roughly equivalent to KES tiers (KES→USD ~0.0078)
const PLAN_PRICING_USD: Record<string, { name: string; amount: number; mode: "subscription" | "payment"; interval?: "month" }> = {
  starter: { name: "POV Moments Starter", amount: 99, mode: "subscription", interval: "month" },     // $0.99/mo
  pro: { name: "POV Moments Pro", amount: 799, mode: "subscription", interval: "month" },             // $7.99/mo
  platinum: { name: "POV Moments Platinum (Lifetime)", amount: 5499, mode: "payment" },               // $54.99 one-time
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = auth.replace("Bearer ", "");
    const { data: { user } } = await supa.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { plan, success_url, cancel_url } = await req.json();
    const config = PLAN_PRICING_USD[plan];
    if (!config) return json({ error: "Invalid plan" }, 400);

    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2024-12-18.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      payment_method_types: ["card"],
      customer_email: user.email!,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: config.name },
            unit_amount: config.amount,
            ...(config.interval ? { recurring: { interval: config.interval } } : {}),
          },
          quantity: 1,
        },
      ],
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url,
      metadata: { user_id: user.id, plan },
    });

    await supa.from("subscriptions").insert({
      user_id: user.id,
      tier: plan,
      provider: "stripe",
      stripe_session_id: session.id,
      amount_kes: Math.round(config.amount / 0.78), // approx KES equivalent
      status: "pending",
    });

    return json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error("stripe-init error:", err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
