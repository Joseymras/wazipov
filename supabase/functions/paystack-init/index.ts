import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLAN_AMOUNTS_KOBO: Record<string, number> = {
  starter: 100 * 100,    // Ksh 100
  pro: 999 * 100,        // Ksh 999
  platinum: 6999 * 100,  // Ksh 6,999
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

    const { plan, callback_url } = await req.json();
    if (!plan || !PLAN_AMOUNTS_KOBO[plan]) return json({ error: "Invalid plan" }, 400);

    const amount = PLAN_AMOUNTS_KOBO[plan];
    const reference = `pov_${plan}_${Date.now()}_${user.id.slice(0, 8)}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        currency: "KES",
        reference,
        callback_url,
        metadata: { user_id: user.id, plan },
      }),
    });

    const data = await res.json();
    if (!data.status) return json({ error: data.message || "Paystack error" }, 400);

    // Store pending subscription
    await supa.from("subscriptions").insert({
      user_id: user.id,
      tier: plan,
      provider: "paystack",
      reference,
      amount_kes: amount / 100,
      status: "pending",
    });

    return json({ authorization_url: data.data.authorization_url, reference });
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
