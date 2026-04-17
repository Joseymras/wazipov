import { motion } from "framer-motion";
import { Camera, Sparkles, Clock, Users, QrCode, ArrowRight, Star, Heart, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// Curated event photos from Pexels (free, no-attribution-required hotlinking)
const ugcPhotos = [
  "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/3585047/pexels-photo-3585047.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/2306277/pexels-photo-2306277.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/1654498/pexels-photo-1654498.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/1043902/pexels-photo-1043902.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/2253879/pexels-photo-2253879.jpeg?auto=compress&w=400",
  "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&w=400",
];

const features = [
  { icon: QrCode, title: "Scan & Snap", desc: "Guests scan a QR code — camera opens instantly. No downloads, no sign-ups." },
  { icon: Camera, title: "Limited Snaps", desc: "Just like a real disposable — each guest gets a set number of shots. Every photo counts." },
  { icon: Clock, title: "Reveal the Magic", desc: "Photos stay hidden until you choose to reveal them. The anticipation is everything." },
  { icon: Users, title: "Shared Album", desc: "Every guest's perspective in one stunning gallery — your event through every eye." },
  { icon: Sparkles, title: "Pro Filters", desc: "Disposable, B&W, sepia, glam — every photo gets that perfect aesthetic." },
  { icon: Heart, title: "Photobook Export", desc: "Turn your album into a beautiful PDF photobook with one click." },
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
            <a href="#wall" className="hover:text-foreground transition-colors">Gallery</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login">Log in</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/pricing">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
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

            <motion.div variants={fadeUp} custom={4} className="flex items-center justify-center gap-1 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
              ))}
              <span className="text-sm text-muted-foreground ml-2">4.9 · 25,000+ events captured</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* UGC Photo Wall (simplebooth-inspired) */}
      <section id="wall" className="py-12 px-4 relative overflow-hidden">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
            {ugcPhotos.map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: (i % 6) * 0.05, duration: 0.5 }}
                className={`relative rounded-2xl overflow-hidden shadow-lg ${i % 5 === 0 ? "aspect-[3/4] row-span-2" : "aspect-square"}`}
              >
                <img src={src} alt="Event moment" loading="lazy" className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-10 max-w-2xl mx-auto bg-card/90 backdrop-blur rounded-2xl p-6 text-center shadow-xl border border-border/50">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">40 Million+ moments captured 🎉</p>
            <p className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-2">Making events awesome since day one.</p>
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
              { step: "03", title: "Reveal & Relive", desc: "Photos reveal on your schedule. Download, share, or export as a photobook." },
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
            Start free. Upgrade when you're hooked.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/pricing">Get Started <ArrowRight className="w-5 h-5" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

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
