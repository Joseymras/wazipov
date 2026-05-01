import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { detectGeo, type GeoInfo } from "@/lib/geo";
import { toast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import { useTierPrices } from "@/hooks/useTierPrices";


const FX_RATES: Record<string, number> = { KES: 1, USD: 0.0078, EUR: 0.0072, GBP: 0.0061, NGN: 12.5, ZAR: 0.14 };
const SYMBOLS: Record<string, string> = { KES: "Ksh", USD: "$", EUR: "€", GBP: "£", NGN: "₦", ZAR: "R" };

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { tiers: TIERS } = useTierPrices();
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [guests, setGuests] = useState(50);
  const [loading, setLoading] = useState<string | null>(null);
  const [override, setOverride] = useState<"auto" | "paystack" | "stripe">("auto");

  useEffect(() => { detectGeo().then(setGeo); }, []);
  useEffect(() => {
    const plan = params.get("plan");
    if (user && plan && TIERS.find(t => t.id === plan)) checkout(plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, TIERS]);

  function format(kes: number) {
    if (!geo || geo.currency === "KES" || !FX_RATES[geo.currency]) return { sym: "Ksh", val: kes.toLocaleString() };
    const v = kes * FX_RATES[geo.currency];
    return { sym: SYMBOLS[geo.currency] || geo.currency, val: v < 10 ? v.toFixed(2) : Math.round(v).toLocaleString() };
  }
  function provider(): "paystack" | "stripe" { return override !== "auto" ? override : (geo?.provider || "paystack"); }

  async function checkout(planId: string) {
    if (!user) { navigate(`/login?next=/pricing?plan=${planId}`); return; }
    setLoading(planId);
    try {
      const tier = TIERS.find(t => t.id === planId);
      const total = tier ? tier.base_kes + (tier.per_guest_kes * guests) : 0;
      const fn = provider() === "stripe" ? "stripe-init" : "paystack-init";
      const body = provider() === "stripe"
        ? { plan: planId, amount_kes: total, success_url: `${window.location.origin}/payment-success`, cancel_url: `${window.location.origin}/pricing` }
        : { plan: planId, amount_kes: total, callback_url: `${window.location.origin}/payment-success` };
      const { data, error } = await supabase.functions.invoke(fn, { body });
      const url = data?.url || data?.authorization_url;
      if (error || !url) throw new Error(data?.error || "Checkout failed");
      window.location.href = url;
    } catch (e: any) {
      toast({ title: "Checkout error", description: e.message, variant: "destructive" });
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="font-heading font-bold">POV Moments</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild><Link to="/login">Log in</Link></Button>
          </div>
        </div>
      </nav>

      <div className="px-4 pt-12 pb-20 container max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 mb-10">
          <p className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-border"><Sparkles className="w-3 h-3" /> 1-day free trial on every plan</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Pricing that scales with your event</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Slide to your guest count. We do the math.</p>
        </motion.div>

        {/* Guest count slider */}
        <div className="rounded-2xl border border-border bg-card p-5 max-w-xl mx-auto mb-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Guest count</span>
            <span className="font-heading text-2xl font-bold">{guests}</span>
          </div>
          <Slider value={[guests]} min={10} max={500} step={10} onValueChange={v => setGuests(v[0])} />
          <p className="text-xs text-muted-foreground text-center">Drag to estimate your total</p>
        </div>

        {/* Provider toggle */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {(["auto","paystack","stripe"] as const).map(p => (
            <button key={p} onClick={() => setOverride(p)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${override === p ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
              {p === "auto" ? `Auto (${geo?.provider || "paystack"})` : p === "paystack" ? "M-Pesa · Paystack" : "Card · Stripe"}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {TIERS.map((tier, i) => {
            const total = tier.base_kes + (tier.per_guest_kes * guests);
            const { sym, val } = format(total);
            const desc = tier.id === "starter" ? "1 event, basic features" : tier.id === "pro" ? "Unlimited events + all camera modes" : "Lifetime access, unlimited everything";
            return (
              <motion.div key={tier.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl p-6 flex flex-col border-2 ${tier.popular ? "border-foreground bg-card" : "border-border bg-card"}`}>
                {tier.popular && <span className="self-start text-xs px-2 py-0.5 rounded-full bg-foreground text-background mb-3">Most popular</span>}
                <h3 className="font-heading text-xl font-semibold">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{desc}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm">{sym}</span>
                  <span className="font-heading text-4xl font-bold">{val}</span>
                  <span className="text-sm text-muted-foreground">{tier.lifetime ? " once" : "/mo"}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-5">For {guests} guests · {tier.trial_days}-day free trial</p>
                <ul className="space-y-2 text-sm flex-1 mb-5">
                  {[
                    tier.lifetime ? "Lifetime access" : "Cancel anytime",
                    "All camera modes (video, GIF, boomerang, green-screen)",
                    "Music library + audio guestbook",
                    "Custom photobooks & PDF export",
                    "Public gallery + city directory",
                    tier.id === "platinum" ? "Custom branding" : tier.id === "pro" ? "Priority support" : "Email support",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-accent" /><span>{f}</span></li>
                  ))}
                </ul>
                <Button onClick={() => checkout(tier.id)} disabled={loading === tier.id}
                  className={`w-full rounded-full ${tier.popular ? "" : "bg-secondary text-foreground hover:bg-muted"}`}>
                  {loading === tier.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <>Start free trial <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Secure checkout · {provider() === "stripe" ? "International cards via Stripe" : "M-Pesa, cards & bank via Paystack"}
        </p>
      </div>
    </div>
  );
}
