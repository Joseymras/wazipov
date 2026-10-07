import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { activateFromCharge } from "../_shared/activate.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { reference } = await req.json();
    if (typeof reference !== "string" || !/^[\w-]{6,100}$/.test(reference)) return json({ error: "Missing reference" }, 400);
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await res.json();
    const tx = data?.data;
    if (!data.status || tx?.status !== "success") {
      return json({ success: false, pending: ["ongoing", "pending", "processing", "queued"].includes(tx?.status), message: tx?.gateway_response || data.message || "Payment not completed" });
    }
    const r = await activateFromCharge(supa, reference, tx);
    return json({ success: r.ok, plan: r.plan, event_id: r.event_id, message: r.message });
  } catch (err) {
    console.error(err);
    return json({ error: "Verification failed" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
