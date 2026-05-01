import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import Stripe from "npm:stripe@17.5.0";

const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const KES_TO_USD = 0.0078;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = auth.replace("Bearer ", "");
    const { data: { user } } = await supa.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { plan, success_url, cancel_url, guests = 50 } = await req.json();
    if (!["starter", "pro", "platinum"].includes(plan)) return json({ error: "Invalid plan" }, 400);

    // Authoritative price from DB
    const { data: setting } = await supa.from("platform_settings").select("value").eq("key", `pricing_${plan}`).maybeSingle();
    const cfg = (setting?.value as any) || {};
    const base = Number(cfg.base_kes ?? 0);
    const perGuest = Number(cfg.per_guest_kes ?? 0);
    const lifetime = !!cfg.lifetime;
    const guestN = Math.max(1, Math.min(2000, Number(guests) || 50));
    const totalKes = base + perGuest * guestN;
    if (totalKes <= 0) return json({ error: "Pricing not configured" }, 400);

    const amountUsdCents = Math.max(50, Math.round(totalKes * KES_TO_USD * 100));

    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2024-12-18.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: lifetime ? "payment" : "subscription",
      payment_method_types: ["card"],
      customer_email: user.email!,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `POV Moments ${cfg.name || plan}` },
          unit_amount: amountUsdCents,
          ...(lifetime ? {} : { recurring: { interval: "month" as const } }),
        },
        quantity: 1,
      }],
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url,
      metadata: { user_id: user.id, plan, guests: String(guestN), kes_amount: String(totalKes) },
    });

    await supa.from("subscriptions").insert({
      user_id: user.id, tier: plan, provider: "stripe",
      stripe_session_id: session.id, amount_kes: totalKes, status: "pending",
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
