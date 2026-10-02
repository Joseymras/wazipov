import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

type Payment = { id: string; provider: string; provider_reference: string; amount: number; currency: string; status: string; paid_at: string | null; created_at: string; plan_id: string | null; channel: string | null };
type Sub = { tier: string; status: string; current_period_end: string | null; provider: string };

function fmt(n: number, c: string) {
  try { return new Intl.NumberFormat("en-KE", { style: "currency", currency: c || "KES" }).format(n); } catch { return `${c} ${n}`; }
}

export default function DashboardBillingPage() {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [usage, setUsage] = useState({ events: 0, photos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s, e] = await Promise.all([
        supabase.from("payments").select("id,provider,provider_reference,amount,currency,status,paid_at,created_at,plan_id,channel").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("subscriptions").select("tier,status,current_period_end,provider").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("events").select("id").eq("host_id", user.id),
      ]);
      setPayments((p.data as Payment[]) || []);
      setSub((s.data as Sub) || null);
      const ids = (e.data || []).map((x) => x.id);
      let photos = 0;
      if (ids.length) {
        const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).in("event_id", ids);
        photos = count || 0;
      }
      setUsage({ events: ids.length, photos });
      setLoading(false);
    })();
  }, [user]);

  const tier = sub?.status === "active" ? sub.tier : profile?.subscription_tier || "free";
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const inTrial = trialEnds && trialEnds > new Date();

  return (
    <DashboardLayout title="Billing">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Current plan</p>
            <p className="font-display text-3xl uppercase mt-2">{tier}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {sub?.current_period_end && sub.status === "active" ? `Renews ${new Date(sub.current_period_end).toLocaleDateString()}` : inTrial ? `Trial ends ${trialEnds!.toLocaleString()}` : "No active subscription"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Events</p>
            <p className="font-display text-3xl mt-2">{loading ? "…" : usage.events}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Photos captured</p>
            <p className="font-display text-3xl mt-2">{loading ? "…" : usage.photos}</p>
          </div>
        </section>

        <div className="flex gap-3">
          <Button asChild className="rounded-full"><Link to="/pricing">{tier === "free" ? "Upgrade" : "Change or renew plan"}</Link></Button>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Payment history</h2>
          <div className="rounded-2xl border border-border bg-card overflow-x-auto">
            {loading ? <p className="p-5 text-sm text-muted-foreground">Loading…</p> : payments.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No payments yet. When you buy a plan, your receipts appear here.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="p-3">Date</th><th className="p-3">Plan</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Reference</th></tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-3 whitespace-nowrap">{new Date(p.paid_at || p.created_at).toLocaleDateString()}</td>
                      <td className="p-3 capitalize">{p.plan_id || "—"}</td>
                      <td className="p-3 whitespace-nowrap">{fmt(Number(p.amount), p.currency)}</td>
                      <td className="p-3 capitalize">{p.channel?.replace("_", " ") || p.provider}</td>
                      <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "success" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{p.status}</span></td>
                      <td className="p-3 font-mono text-xs">{p.provider_reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
