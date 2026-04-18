import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global { interface Window { adsbygoogle?: any[]; } }

interface Props { slotKey?: string; className?: string; }

// Renders a Google AdSense slot only if admin has enabled AdSense in platform_settings.
// Loads the AdSense script once on demand.
export default function AdSlot({ slotKey, className = "" }: Props) {
  const [conf, setConf] = useState<{ enabled: boolean; client_id: string; slot_id: string } | null>(null);

  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "adsense").maybeSingle()
      .then(({ data }) => setConf((data?.value as any) || null));
  }, []);

  useEffect(() => {
    if (!conf?.enabled || !conf.client_id) return;
    const id = "adsbygoogle-js";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id; s.async = true; s.crossOrigin = "anonymous";
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${conf.client_id}`;
      document.head.appendChild(s);
    }
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* noop */ }
  }, [conf]);

  if (!conf?.enabled || !conf.client_id) return null;
  return (
    <div className={`my-6 text-center text-xs text-muted-foreground ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={conf.client_id}
        data-ad-slot={slotKey || conf.slot_id}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
