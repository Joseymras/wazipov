// Initialize a Paystack top-up for the token wallet (10 KES per token).
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KES_PER_TOKEN = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { owner_key, email, tokens, callback_url } = await req.json();
    const tokensN = Math.max(1, Math.min(500, Number(tokens) || 5));
    if (!owner_key || !email) return j({ error: "owner_key + email required" }, 400);

    const supa = createClient(SUPABASE_URL, SRK);
    // Ensure wallet exists
    let { data: wallet } = await supa.from("wallets").select("*").eq("owner_key", owner_key).maybeSingle();
    if (!wallet) {
      const { data: created } = await supa.from("wallets").insert({ owner_key, balance_tokens: 0 }).select().single();
      wallet = created!;
    }

    const amountKes = tokensN * KES_PER_TOKEN;
    const reference = `wal_${Date.now()}_${owner_key.slice(0, 6)}`;

    const r = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email, amount: amountKes * 100, currency: "KES", reference, callback_url,
        metadata: { kind: "wallet_topup", owner_key, tokens: tokensN, wallet_id: wallet.id },
      }),
    });
    const d = await r.json();
    if (!d.status) return j({ error: d.message || "Paystack error" }, 400);
    return j({ authorization_url: d.data.authorization_url, reference, tokens: tokensN, amount_kes: amountKes });
  } catch (e) { return j({ error: String(e) }, 500); }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
