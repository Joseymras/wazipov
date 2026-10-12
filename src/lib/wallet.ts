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
  const { data } = await supabase.rpc("wallet_balance", { _owner_key: ownerKey });
  return { owner_key: ownerKey, balance_tokens: (data as number) ?? 0 };
}

export async function isUnlocked(eventId: string, ownerKey: string) {
  const { data } = await supabase.rpc("gallery_is_unlocked", { _event_id: eventId, _owner_key: ownerKey });
  return !!data;
}

export async function spendTokensToUnlock(eventId: string, ownerKey: string) {
  const { data, error } = await supabase.rpc("wallet_unlock", { _event_id: eventId, _owner_key: ownerKey, _cost: UNLOCK_COST });
  if (error || !data) return { ok: false, reason: "insufficient" };
  return { ok: true };
}
