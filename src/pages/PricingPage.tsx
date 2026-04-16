import { motion } from "framer-motion";
import { Check, Camera, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const tiers = [
  {
    name: "Starter",
    price: "100",
    period: "/month",
    badge: null,
    desc: "Perfect for testing one event",
    trial: "1-day free trial",
    features: [
      "1 active event",
      "50 guests per event",
      "10 snaps per guest",
      "Basic film filters",
      "Shared album link",
      "QR code generator",
    ],
  },
  {
    name: "Pro",
    price: "999",
    period: "/month",
    badge: "Most Popular",
    desc: "For event enthusiasts & planners",
    trial: null,
    features: [
      "Unlimited events",
      "200 guests per event",
      "35 snaps per guest",
      "AI photo enhancement",
      "Custom QR designs",
      "Scavenger hunt prompts",
      "Video recap generation",
      "Priority support",
    ],
  },
  {
    name: "Platinum",
    price: "6,999",
    period: " one-time",
    badge: "Best Value",
    desc: "Lifetime access, unlimited everything",
    trial: null,
    features: [
      "Everything in Pro",
      "Unlimited guests",
      "Unlimited snaps",
      "All AI features",
      "Custom branding & watermark",
      "White-label QR cards",
      "Photobook export",
      "4K photo downloads",
      "Face recognition grouping",
      "10% referral commission",
      "Priority support forever",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-hero relative film-grain">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-border/30">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">POV Moments</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" className="text-center mb-16 space-y-4">
            <motion.h1 variants={fadeUp} custom={0}
              className="font-heading text-4xl md:text-6xl font-bold text-foreground"
            >
              Simple, honest pricing
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free. Upgrade when you're hooked. All prices in Kenyan Shillings (Ksh).
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier, i) => (
              <motion.div key={tier.name} initial="hidden" animate="visible" variants={fadeUp} custom={i + 2}
                className={`relative rounded-3xl p-8 flex flex-col ${
                  tier.badge === "Most Popular"
                    ? "bg-gradient-warm text-primary-foreground shadow-2xl scale-[1.02] ring-2 ring-primary/20"
                    : "glass-card"
                }`}
              >
                {tier.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold ${
                    tier.badge === "Most Popular"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}>
                    <Star className="w-3 h-3 inline mr-1" />
                    {tier.badge}
                  </div>
                )}
                <div className="space-y-2 mb-6">
                  <h3 className="font-heading text-xl font-semibold">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm">Ksh</span>
                    <span className="font-heading text-4xl font-bold">{tier.price}</span>
                    <span className="text-sm opacity-80">{tier.period}</span>
                  </div>
                  <p className="text-sm opacity-80">{tier.desc}</p>
                  {tier.trial && (
                    <p className="text-xs font-medium opacity-70">{tier.trial}</p>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.badge === "Most Popular" ? "glass" : "hero"}
                  size="lg"
                  className="w-full"
                >
                  {tier.trial ? "Start Free Trial" : "Get Started"} <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
