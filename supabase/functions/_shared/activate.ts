// Shared, idempotent activation after a verified Paystack charge.
// deno-lint-ignore no-explicit-any
export async function activateFromCharge(supa: any, reference: string, tx: any): Promise<{ ok: boolean; plan?: string; event_id?: string; message?: string }> {
  const { data: sub } = await supa.from("subscriptions").select("*").eq("reference", reference).maybeSingle();
  if (!sub) return { ok: false, message: "Unknown reference" };
  const meta = tx?.metadata || {};
  const eventId: string | undefined = meta.event_id || undefined;
  if (sub.status === "active") return { ok: true, plan: sub.tier, event_id: eventId };

  const expected = Math.round(Number(sub.amount_kes) * 100);
  if (tx.currency !== "KES" || Number(tx.amount) !== expected) {
    await supa.from("subscriptions").update({ status: "amount_mismatch" }).eq("id", sub.id);
    return { ok: false, message: "Amount mismatch" };
  }

  const { data: claimed } = await supa.from("subscriptions")
    .update({ status: "active", paystack_customer_id: tx.customer?.customer_code,
      current_period_end: sub.tier === "platinum" ? null : new Date(Date.now() + 30 * 864e5).toISOString() })
    .eq("id", sub.id).neq("status", "active").select("id");
  if (!claimed?.length) return { ok: true, plan: sub.tier, event_id: eventId };

  await supa.from("profiles").update({ subscription_tier: sub.tier }).eq("user_id", sub.user_id);

  if (eventId) {
    const guests = Math.max(10, Number(meta.guests) || 50);
    const shots = Math.max(1, Math.min(100, Number(meta.shots) || 25));
    await supa.from("events").update({
      status: "active", is_active: true, guest_limit: guests, snaps_per_guest: shots,
    }).eq("id", eventId).eq("host_id", sub.user_id);
    // top up existing guests to the new shot allowance
    const { data: gs } = await supa.from("event_guests").select("id, shots_used").eq("event_id", eventId);
    for (const g of gs || []) {
      await supa.from("event_guests").update({ snaps_remaining: Math.max(0, shots - g.shots_used) }).eq("id", g.id);
    }
  }

  await supa.from("payments").upsert({
    user_id: sub.user_id, event_id: eventId ?? null, plan_id: sub.tier, provider: "paystack", provider_reference: reference,
    amount: Number(tx.amount) / 100, currency: tx.currency, status: "success", channel: tx.channel,
    customer_email: tx.customer?.email, customer_phone: tx.authorization?.mobile_money_number ?? null,
    gateway_response: tx.gateway_response, paid_at: tx.paid_at, raw_response: tx, metadata: meta,
  }, { onConflict: "provider,provider_reference" });
  await supa.from("analytics_events").insert({ event_id: eventId ?? null, name: "payment_success", metadata: { reference, plan: sub.tier } });
  return { ok: true, plan: sub.tier, event_id: eventId };
}
