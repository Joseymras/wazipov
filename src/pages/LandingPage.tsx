import { motion } from "framer-motion";
import { Camera, Sparkles, Clock, Users, QrCode, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const features = [
  { icon: QrCode, title: "Scan & Snap", desc: "Guests scan a QR code — camera opens instantly. No downloads, no sign-ups." },
  { icon: Camera, title: "Limited Snaps", desc: "Just like a real disposable — each guest gets a set number of shots. Every photo counts." },
  { icon: Clock, title: "Reveal the Magic", desc: "Photos stay hidden until you choose to reveal them. The anticipation is everything." },
  { icon: Users, title: "Shared Album", desc: "Every guest's perspective in one stunning gallery — your event through every eye." },
  { icon: Sparkles, title: "AI Enhancement", desc: "Auto-fix lighting, remove blur, and generate highlight reels from your photos." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden film-grain">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-border/30">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">POV Moments</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/pricing">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              The modern disposable camera for events
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1}
              className="font-heading text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-foreground"
            >
              Capture every POV.{" "}
              <span className="text-gradient-warm">Reveal the magic later.</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Guests scan a QR code, snap photos with a beautiful disposable-style camera, 
              and the album reveals after your event. Pure magic, zero friction.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/pricing">
                  Create Your First Event <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/camera/demo">Try the Camera</Link>
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} custom={4} className="text-sm text-muted-foreground">
              Starting at <span className="font-semibold text-foreground">Ksh 100/month</span> · 1-day free trial
            </motion.p>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
            className="mt-16 relative mx-auto max-w-sm"
          >
            <div className="relative bg-card rounded-[2.5rem] p-3 shadow-2xl border border-border/50">
              <div className="rounded-[2rem] overflow-hidden bg-foreground/5 aspect-[9/16] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-foreground/10 to-foreground/30" />
                <div className="relative z-10 text-center space-y-4 p-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-warm mx-auto flex items-center justify-center shadow-xl">
                    <Camera className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="font-heading text-lg font-semibold text-foreground">Sarah's Wedding</p>
                  <p className="text-sm text-muted-foreground">8 snaps remaining</p>
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary/60" />
                    ))}
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-muted" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-20 px-4">
        <div className="container max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl md:text-5xl font-bold text-foreground">
              Simple as 1-2-3
            </motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Event", desc: "Set up your event in seconds. Choose snaps, reveal time, and theme." },
              { step: "02", title: "Share QR Code", desc: "Print or share your unique QR code. Guests scan and start snapping." },
              { step: "03", title: "Reveal & Relive", desc: "Photos reveal on your schedule. Download, share, or create a video." },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i} className="text-center space-y-4"
              >
                <div className="text-6xl font-heading font-bold text-gradient-warm">{item.step}</div>
                <h3 className="font-heading text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-card/50">
        <div className="container max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl md:text-5xl font-bold text-foreground">
              Everything you need
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mt-4 text-lg">
              From camera to gallery, we've got every moment covered.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="glass-card rounded-2xl p-6 space-y-3 hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container max-w-3xl mx-auto text-center space-y-6">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-heading text-3xl md:text-5xl font-bold text-foreground"
          >
            Ready to capture every moment?
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-muted-foreground text-lg"
          >
            Start your free trial today. No credit card required.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/pricing">Get Started Free <ArrowRight className="w-5 h-5" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-warm flex items-center justify-center">
              <Camera className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground">POV Moments</span>
          </div>
          <p>© {new Date().getFullYear()} POV Moments. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
