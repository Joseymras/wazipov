import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function hmac512(body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature") || "";
  if (!sig || !safeEq(await hmac512(raw), sig)) return new Response("Invalid signature", { status: 401 });

  let evt: any; try { evt = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  const reference: string | undefined = evt?.data?.reference;
  if (!reference) return new Response("ok");

  if (evt.event !== "charge.success") {
    await supa.from("subscriptions").update({ status: "failed" }).eq("reference", reference).eq("status", "pending");
    return new Response("ok");
  }

  // Re-verify with Paystack — never trust the webhook body alone
  const vr = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${SECRET}` } });
  const v = await vr.json();
  const tx = v?.data;
  if (!v?.status || tx?.status !== "success") return new Response("ok");

  const { data: sub } = await supa.from("subscriptions").select("*").eq("reference", reference).maybeSingle();
  if (!sub) return new Response("ok");
  if (sub.status === "active") return new Response("ok"); // idempotent
  const expected = Math.round(Number(sub.amount_kes) * 100);
  if (tx.currency !== "KES" || Number(tx.amount) !== expected) {
    await supa.from("subscriptions").update({ status: "amount_mismatch" }).eq("id", sub.id);
    return new Response("ok");
  }

  // Conditional update guards against concurrent duplicate webhooks
  const { data: claimed } = await supa.from("subscriptions")
    .update({ status: "active", paystack_customer_id: tx.customer?.customer_code,
      current_period_end: sub.tier === "platinum" ? null : new Date(Date.now() + 30 * 864e5).toISOString() })
    .eq("id", sub.id).neq("status", "active").select("id");
  if (!claimed?.length) return new Response("ok");

  await supa.from("profiles").update({ subscription_tier: sub.tier }).eq("user_id", sub.user_id);
  await supa.from("payments").upsert({
    user_id: sub.user_id, plan_id: sub.tier, provider: "paystack", provider_reference: reference,
    amount: Number(tx.amount) / 100, currency: tx.currency, status: "success", channel: tx.channel,
    customer_email: tx.customer?.email, customer_phone: tx.authorization?.mobile_money_number ?? null,
    gateway_response: tx.gateway_response, paid_at: tx.paid_at, raw_response: tx,
  }, { onConflict: "provider,provider_reference" });
  return new Response("ok");
});
