import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = auth.replace("Bearer ", "");
    const { data: { user } } = await supa.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { plan, callback_url, guests = 50 } = await req.json();
    if (!["starter", "pro", "platinum"].includes(plan)) return json({ error: "Invalid plan" }, 400);

    // Read authoritative price from DB (never trust client amount)
    const { data: setting } = await supa.from("platform_settings").select("value").eq("key", `pricing_${plan}`).maybeSingle();
    const cfg = (setting?.value as any) || {};
    const base = Number(cfg.base_kes ?? 0);
    const perGuest = Number(cfg.per_guest_kes ?? 0);
    const guestN = Math.max(1, Math.min(2000, Number(guests) || 50));
    const totalKes = base + perGuest * guestN;
    if (totalKes <= 0) return json({ error: "Pricing not configured" }, 400);

    const amountKobo = Math.round(totalKes * 100);
    const reference = `pov_${plan}_${Date.now()}_${user.id.slice(0, 8)}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: amountKobo,
        currency: "KES",
        reference,
        callback_url,
        metadata: { user_id: user.id, plan, guests: guestN },
      }),
    });

    const data = await res.json();
    if (!data.status) return json({ error: data.message || "Paystack error" }, 400);

    await supa.from("subscriptions").insert({
      user_id: user.id, tier: plan, provider: "paystack",
      reference, amount_kes: totalKes, status: "pending",
    });

    return json({ authorization_url: data.data.authorization_url, reference, amount_kes: totalKes });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
