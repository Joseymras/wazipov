import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Camera, Sparkles, Clock, QrCode, ArrowRight, Star, BookOpen, Mic, Wand2, Lock, Globe, Heart, Cake, Briefcase, PartyPopper, GraduationCap, Music, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AdSlot from "@/components/AdSlot";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const ugc = [
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

function PhoneMock({ src, rotate = 0, delay = 0 }: { src: string; rotate?: number; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: rotate - 6 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-[180px] sm:w-[220px] md:w-[260px] aspect-[9/19] rounded-[2.5rem] bg-foreground p-2.5 shadow-2xl shrink-0"
    >
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground rounded-b-2xl z-10" />
      <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-background">
        <img src={src} alt="POV moment" loading="lazy" className="w-full h-full object-cover" />
        {/* Shutter UI overlay */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-foreground/70 to-transparent flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-[3px] border-background/80 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-background/90" />
          </div>
        </div>
        <div className="absolute top-3 left-3 text-[10px] font-semibold text-background/90 bg-foreground/40 backdrop-blur rounded-full px-2 py-0.5">
          25 SHOTS
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground relative film-grain overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-border/30">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">POV Moments</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground transition-colors">{t("nav_pricing")}</Link>
            <a href="#features" className="hover:text-foreground transition-colors">{t("nav_features")}</a>
            <a href="#how" className="hover:text-foreground transition-colors">{t("nav_how")}</a>
            <a href="#wall" className="hover:text-foreground transition-colors">Gallery</a>
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login">{t("nav_login")}</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/pricing">{t("nav_get_started")}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <HeroSection />

      {/* UGC photo wall */}
      <section id="wall" className="py-12 px-4 relative">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
            {ugc.map((src, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: (i % 6) * 0.04, duration: 0.5 }}
                className={`relative rounded-2xl overflow-hidden shadow-lg ${i % 5 === 0 ? "aspect-[3/4] row-span-2" : "aspect-square"}`}>
                <img src={src} alt="Event" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-10 max-w-2xl mx-auto bg-card/90 backdrop-blur rounded-2xl p-6 text-center shadow-xl border border-border/50">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">40 Million+ moments captured 🎉</p>
            <p className="font-heading text-2xl md:text-3xl font-bold mt-2">Making events awesome since day one.</p>
          </motion.div>
        </div>
      </section>

      <AdSlot slotKey="landing-mid" className="container max-w-3xl mx-auto" />

      {/* 6 Reasons (Lense-inspired with phone in middle) */}
      <section id="features" className="py-20 px-4 bg-card/40">
        <div className="container max-w-6xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-heading text-3xl md:text-5xl font-bold text-center mb-16">
            {t("why_title")}
          </motion.h2>
          <div className="grid lg:grid-cols-3 gap-10 items-center">
            <ul className="space-y-8 lg:text-right">
              {[
                { icon: Camera, title: "Capture every moment", desc: "Each guest gets a disposable-style camera in their browser. No app, no signup." },
                { icon: Clock, title: "Delayed reveal", desc: "Photos stay hidden until you choose. The anticipation is everything." },
                { icon: Sparkles, title: "One shared album", desc: "Every guest's perspective in one stunning gallery." },
              ].map((r, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }} className="space-y-1">
                  <div className="font-heading font-semibold flex items-center gap-2 lg:flex-row-reverse">
                    <r.icon className="w-4 h-4 text-primary" /> {i + 1}. {r.title}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                </motion.li>
              ))}
            </ul>
            <div className="flex justify-center order-first lg:order-none">
              <PhoneMock src={hero1} rotate={0} delay={0} />
            </div>
            <ul className="space-y-8">
              {[
                { icon: QrCode, title: "Easy QR sharing", desc: "Scan to launch — no downloads required." },
                { icon: Wand2, title: "Pro filters & effects", desc: "Disposable, B&W, glam, vintage. Plus video, GIF & boomerang." },
                { icon: Lock, title: "Safe cloud storage", desc: "Private until reveal. Hosts always own a downloadable copy." },
              ].map((r, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }} className="space-y-1">
                  <div className="font-heading font-semibold flex items-center gap-2">
                    <r.icon className="w-4 h-4 text-primary" /> {i + 4}. {r.title}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Beyond just a photobooth */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-heading text-3xl md:text-5xl font-bold text-center mb-4">
            More than just a photobooth
          </motion.h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Photo, Video, Boomerang, GIF, Green Screen, Audio Guestbook & Photobook export — all in one PWA.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Camera, title: "Photo Booth", desc: "Classic snaps with filters & overlays." },
              { icon: Sparkles, title: "GIF Booth", desc: "4-photo bursts that loop forever." },
              { icon: Wand2, title: "Boomerang", desc: "Forward-and-reverse magic clips." },
              { icon: BookOpen, title: "Photobook PDF", desc: "Auto-generated layouts. One-click export." },
              { icon: Mic, title: "Audio Guestbook", desc: "Voicemails alongside the album." },
              { icon: Globe, title: "Multilingual + global pay", desc: "5 languages. M-Pesa, Stripe, more." },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 space-y-2 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-hero">
        <div className="container max-w-3xl mx-auto text-center space-y-6">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-heading text-3xl md:text-5xl font-bold">
            Ready to capture every POV?
          </motion.h2>
          <p className="text-muted-foreground text-lg">Start free. Upgrade when you're hooked.</p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/pricing">Get Started <ArrowRight className="w-5 h-5" /></Link>
          </Button>
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
