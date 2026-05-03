// Token wallet helpers (Ksh 10 per token). owner_key = user id or device hash.
import { supabase } from "@/integrations/supabase/client";

export const KES_PER_TOKEN = 10;
export const UNLOCK_COST = 1; // 1 token = Ksh 10 to unlock a gallery for download

export function getOwnerKey(userId?: string | null): string {
  if (userId) return `u:${userId}`;
  let k = localStorage.getItem("pov_owner_key");
  if (!k) {
    k = `d:${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem("pov_owner_key", k);
  }
  return k;
}

export async function getOrCreateWallet(ownerKey: string) {
  let { data } = await supabase.from("wallets").select("*").eq("owner_key", ownerKey).maybeSingle();
  if (!data) {
    const { data: created } = await supabase.from("wallets").insert({ owner_key: ownerKey, balance_tokens: 0 }).select().single();
    data = created!;
  }
  return data;
}

export async function isUnlocked(eventId: string, ownerKey: string) {
  const { data } = await supabase.from("gallery_unlocks").select("id").eq("event_id", eventId).eq("owner_key", ownerKey).maybeSingle();
  return !!data;
}

export async function spendTokensToUnlock(eventId: string, ownerKey: string) {
  const wallet = await getOrCreateWallet(ownerKey);
  if (wallet.balance_tokens < UNLOCK_COST) return { ok: false, reason: "insufficient" };
  await supabase.from("wallets").update({ balance_tokens: wallet.balance_tokens - UNLOCK_COST }).eq("id", wallet.id);
  await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id, delta_tokens: -UNLOCK_COST, kind: "unlock", event_id: eventId,
  });
  await supabase.from("gallery_unlocks").insert({ event_id: eventId, owner_key: ownerKey });
  return { ok: true };
}
