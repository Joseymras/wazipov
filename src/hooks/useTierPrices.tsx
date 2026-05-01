import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TierPrice {
  id: "starter" | "pro" | "platinum";
  name: string;
  base_kes: number;
  per_guest_kes: number;
  trial_days: number;
  lifetime?: boolean;
  popular?: boolean;
}

const FALLBACK: TierPrice[] = [
  { id: "starter", name: "Starter", base_kes: 100, per_guest_kes: 5, trial_days: 1 },
  { id: "pro", name: "Pro", base_kes: 999, per_guest_kes: 8, trial_days: 1, popular: true },
  { id: "platinum", name: "Platinum", base_kes: 6999, per_guest_kes: 0, trial_days: 1, lifetime: true },
];

export function useTierPrices() {
  const [tiers, setTiers] = useState<TierPrice[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase
      .from("platform_settings")
      .select("key,value")
      .in("key", ["pricing_starter", "pricing_pro", "pricing_platinum"]);
    if (data && data.length) {
      const map: Record<string, any> = {};
      data.forEach(r => { map[r.key] = r.value; });
      setTiers(["starter", "pro", "platinum"].map(id => ({
        id: id as any,
        ...(map[`pricing_${id}`] || FALLBACK.find(f => f.id === id)),
      })));
    }
    setLoading(false);
  }

  return { tiers, loading, reload: load };
}
