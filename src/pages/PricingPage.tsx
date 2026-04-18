import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Camera, ArrowRight, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { detectGeo, type GeoInfo } from "@/lib/geo";
import { toast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const tiers = [
  {
    id: "starter",
    name: "Starter",
    price: 100,
    period: "/month",
    badge: null,
    desc: "Perfect for testing one event",
    trial: "1-day free trial",
    features: ["1 active event", "50 guests per event", "10 snaps per guest", "Basic film filters", "Shared album link", "QR code generator"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    period: "/month",
    badge: "Most Popular",
    desc: "For event enthusiasts & planners",
    trial: null,
    features: ["Unlimited events", "200 guests per event", "35 snaps per guest", "Video, GIF & Boomerang", "All pro filters", "Custom QR designs", "Photobook export", "Priority support"],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 6999,
    period: " one-time",
    badge: "Best Value",
    desc: "Lifetime access, unlimited everything",
    trial: null,
    features: ["Everything in Pro", "Unlimited guests", "Unlimited snaps", "Custom branding & watermark", "White-label QR cards", "4K downloads", "10% referral commission", "Lifetime support"],
  },
];

const FX_RATES: Record<string, number> = { KES: 1, USD: 0.0078, EUR: 0.0072, GBP: 0.0061, NGN: 12.5, ZAR: 0.14 };
const SYMBOLS: Record<string, string> = { KES: "Ksh", USD: "$", EUR: "€", GBP: "£", NGN: "₦", ZAR: "R" };

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  // Manual override: user can pick provider on checkout
  const [providerOverride, setProviderOverride] = useState<"auto" | "paystack" | "stripe">("auto");

  useEffect(() => { detectGeo().then(setGeo); }, []);

  // Auto-trigger checkout if redirected back from login with a plan param
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (user && planParam && tiers.find(t => t.id === planParam)) {
      handleCheckout(planParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function formatPrice(kes: number) {
    if (!geo || geo.currency === "KES" || !FX_RATES[geo.currency]) {
      return { symbol: "Ksh", amount: kes.toLocaleString() };
    }
    const converted = kes * FX_RATES[geo.currency];
    const amount = converted < 10 ? converted.toFixed(2) : Math.round(converted).toLocaleString();
    return { symbol: SYMBOLS[geo.currency] || geo.currency, amount };
  }

  function resolveProvider(): "paystack" | "stripe" {
    if (providerOverride !== "auto") return providerOverride;
    return geo?.provider || "paystack";
  }

  async function handleCheckout(planId: string) {
    if (!user) {
      navigate(`/login?next=/pricing?plan=${planId}`);
      return;
    }
    const provider = resolveProvider();
    setLoadingPlan(planId);
    try {
      if (provider === "stripe") {
        const { data, error } = await supabase.functions.invoke("stripe-init", {
          body: {
            plan: planId,
            success_url: `${window.location.origin}/payment-success`,
            cancel_url: `${window.location.origin}/pricing`,
          },
        });
        if (error || !data?.url) throw new Error(data?.error || "Stripe checkout failed");
        window.location.href = data.url;
      } else {
        const { data, error } = await supabase.functions.invoke("paystack-init", {
          body: { plan: planId, callback_url: `${window.location.origin}/payment-success` },
        });
        if (error || !data?.authorization_url) throw new Error(data?.error || "Paystack checkout failed");
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      toast({ title: "Checkout error", description: err.message, variant: "destructive" });
      setLoadingPlan(null);
    }
  }

  const activeProvider = resolveProvider();

  return (
    <div className="min-h-screen bg-gradient-hero relative film-grain">
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-border/30">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">POV Moments</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild><Link to="/login">Log in</Link></Button>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" className="text-center mb-12 space-y-4">
            <motion.h1 variants={fadeUp} custom={0} className="font-heading text-4xl md:text-6xl font-bold text-foreground">
              Simple, honest pricing
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free. Upgrade when you're hooked.
              {geo && geo.country !== "KE" && (
                <span className="block text-sm mt-2 text-primary">
                  Showing prices in {geo.currency}
                </span>
              )}
            </motion.p>

            {/* Provider selector */}
            <motion.div variants={fadeUp} custom={2} className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Pay with:</span>
              {([
                { id: "auto", label: `Auto (${geo?.provider || "paystack"})` },
                { id: "paystack", label: "Paystack · M-Pesa" },
                { id: "stripe", label: "Stripe · Card" },
              ] as const).map(opt => (
                <button key={opt.id} onClick={() => setProviderOverride(opt.id)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    providerOverride === opt.id ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier, i) => {
              const { symbol, amount } = formatPrice(tier.price);
              const isPopular = tier.badge === "Most Popular";
              return (
                <motion.div key={tier.id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 3}
                  className={`relative rounded-3xl p-8 flex flex-col ${
                    isPopular ? "bg-gradient-warm text-primary-foreground shadow-2xl scale-[1.02] ring-2 ring-primary/20" : "glass-card"
                  }`}
                >
                  {tier.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold ${
                      isPopular ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
                    }`}>
                      <Star className="w-3 h-3 inline mr-1" />
                      {tier.badge}
                    </div>
                  )}
                  <div className="space-y-2 mb-6">
                    <h3 className="font-heading text-xl font-semibold">{tier.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm">{symbol}</span>
                      <span className="font-heading text-4xl font-bold">{amount}</span>
                      <span className="text-sm opacity-80">{tier.period}</span>
                    </div>
                    <p className="text-sm opacity-80">{tier.desc}</p>
                    {tier.trial && <p className="text-xs font-medium opacity-70">{tier.trial}</p>}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 shrink-0" /><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={isPopular ? "glass" : "hero"} size="lg" className="w-full"
                    onClick={() => handleCheckout(tier.id)} disabled={loadingPlan === tier.id}
                  >
                    {loadingPlan === tier.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                    ) : (
                      <>{tier.trial ? "Start Free Trial" : "Get Started"} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            {activeProvider === "stripe"
              ? "Secure card checkout via Stripe · International cards accepted"
              : "Secure checkout via Paystack · M-Pesa, Cards, Bank Transfer accepted"}
          </p>
        </div>
      </div>
    </div>
  );
}
