// Verifies a wallet top-up reference and credits tokens.
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { reference } = await req.json();
    if (!reference) return j({ error: "reference required" }, 400);
    const r = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const d = await r.json();
    if (!d.status || d.data.status !== "success") return j({ success: false });
    const meta = d.data.metadata || {};
    if (meta.kind !== "wallet_topup") return j({ success: false });
    const supa = createClient(SUPABASE_URL, SRK);

    // Idempotency
    const { data: existing } = await supa.from("wallet_transactions").select("id").eq("reference", reference).maybeSingle();
    if (existing) return j({ success: true, already: true });

    const { data: wallet } = await supa.from("wallets").select("*").eq("id", meta.wallet_id).single();
    if (!wallet) return j({ success: false });
    const tokens = Number(meta.tokens) || 0;
    await supa.from("wallets").update({ balance_tokens: wallet.balance_tokens + tokens, updated_at: new Date().toISOString() }).eq("id", wallet.id);
    await supa.from("wallet_transactions").insert({
      wallet_id: wallet.id, delta_tokens: tokens, amount_kes: d.data.amount / 100, kind: "topup", reference,
    });
    return j({ success: true, tokens });
  } catch (e) { return j({ error: String(e) }, 500); }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
