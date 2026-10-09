import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera, QrCode, Lock, Download, Heart, Cake, Briefcase, PartyPopper, GraduationCap, Music, Church, School, Tent, Baby, Plane, Trophy, ArrowRight, Check } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTierPrices } from "@/hooks/useTierPrices";

const img = (id: number, w = 900) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=${w}`;

const NICHES = [
  { id: "weddings", label: "Weddings", icon: Heart, photo: 1043902, title: "Every angle of I do.", sub: "Aunties, bridesmaids and the back row — all their moments in one album." },
  { id: "birthdays", label: "Birthdays", icon: Cake, photo: 1729797, title: "Make their day last.", sub: "A surprise reveal of the night, the morning after." },
  { id: "corporate", label: "Corporate", icon: Briefcase, photo: 2774556, title: "Content from every seat.", sub: "Launches, conferences and team retreats, captured by your people." },
  { id: "parties", label: "Parties", icon: PartyPopper, photo: 1684187, title: "Bottle the vibe.", sub: "The real moments nobody posed for." },
  { id: "concerts", label: "Concerts & festivals", icon: Music, photo: 2306281, title: "A thousand front rows.", sub: "Crowdsource the show from every corner of the venue." },
  { id: "graduations", label: "Graduations", icon: GraduationCap, photo: 3585047, title: "Cap, gown, captured.", sub: "Family, friends and that cap toss — from every phone." },
  { id: "church", label: "Church & faith", icon: Church, photo: 2253879, title: "Fellowship, remembered.", sub: "Services, crusades, baptisms and choir days." },
  { id: "schools", label: "Schools", icon: School, photo: 1205651, title: "Sports day to prize day.", sub: "Parents and teachers share one safe, private album." },
  { id: "baby", label: "Baby showers", icon: Baby, photo: 3662667, title: "Little one, big love.", sub: "Gentle, private, and shared only with family." },
  { id: "sports", label: "Sports & runs", icon: Trophy, photo: 2526878, title: "Every finish line.", sub: "Marathons, tournaments and fun days from the sidelines." },
  { id: "camps", label: "Retreats & camps", icon: Tent, photo: 1687845, title: "Stories by the fire.", sub: "Youth camps, retreats and team getaways." },
  { id: "travel", label: "Group trips", icon: Plane, photo: 1007657, title: "One trip. Every POV.", sub: "Safaris, road trips and holidays in a single shared roll." },
];

const STEPS = [
  { icon: Camera, t: "Create your Wazi", d: "Name your event, pick shots per guest and when photos reveal." },
  { icon: QrCode, t: "Share one QR", d: "Print it on tables or drop the link on WhatsApp. No app needed." },
  { icon: Lock, t: "Guests shoot", d: "Their phone becomes a disposable camera with limited shots." },
  { icon: Download, t: "The roll develops", d: "Photos reveal when you choose. Download everything in one go." },
];

const FAQ = [
  ["Do guests need an app or an account?", "No. They scan the QR or tap the link, add a nickname and start shooting in their browser."],
  ["Does it work on cheap Android phones?", "Yes. Wazi is built for everyday phones and Kenyan mobile data, and saves photos on the phone if the network drops."],
  ["How do I pay?", "M-PESA or card through Paystack. Your event goes live the moment payment is confirmed."],
  ["Who can see the photos?", "Only you, until you choose to reveal them to guests. Galleries are private by default."],
  ["Can I approve photos first?", "Yes. Turn on moderation and nothing appears until you approve it."],
];

export default function LandingPage() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const { tiers } = useTierPrices();
  if (typeof window !== "undefined") {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) localStorage.setItem("pov_ref", r);
  }
  const n = NICHES[active];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-display text-2xl uppercase tracking-wide">Wazi<span className="text-accent">.</span></Link>
          <div className="hidden md:flex gap-8 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#niches" className="hover:text-foreground">Use cases</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:inline text-sm px-3 py-2">Log in</Link>
            <Link to="/login?next=/events/new" className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-bold">Create your Wazi</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-foreground text-background">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-6">Everyone has a perspective</p>
            <h1 className="font-display uppercase text-[14vw] sm:text-7xl lg:text-8xl leading-[0.88]">Capture everyone's perspective.</h1>
            <p className="mt-6 text-lg text-background/75 max-w-lg">Turn every guest's phone into a disposable camera. One QR code. No app download. Hundreds of moments you would have missed.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/login?next=/events/new" className="bg-accent text-accent-foreground rounded-full px-8 py-4 font-bold uppercase tracking-wide text-center inline-flex items-center justify-center gap-2">Create your Wazi <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/join" className="border-2 border-background/40 hover:border-background rounded-full px-8 py-4 font-bold uppercase tracking-wide text-center">Join an event</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-background/60">
              {["No app", "Pay with M-PESA", "Private by default"].map((x) => <span key={x} className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-accent" />{x}</span>)}
            </div>
          </div>
          <div className="relative h-[420px] sm:h-[520px]">
            {[1684187, 1043902, 2306281, 1729797].map((p, i) => (
              <motion.img key={p} src={img(p, 600)} alt="Guest photo from an event" loading={i < 2 ? "eager" : "lazy"}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 * i, duration: 0.6 }}
                className={`absolute w-44 sm:w-60 aspect-[3/4] object-cover rounded-2xl border-[6px] border-background shadow-2xl ${[
                  "left-0 top-6 -rotate-6", "left-1/2 -translate-x-1/2 top-0 z-10", "right-0 top-16 rotate-6", "left-1/4 bottom-0 rotate-3 z-20"][i]}`} />
            ))}
            <div className="absolute right-2 bottom-4 z-30 bg-background text-foreground rounded-2xl p-4 shadow-2xl rotate-[-4deg] w-40 text-center">
              <QrCode className="w-20 h-20 mx-auto" />
              <p className="font-display uppercase text-sm mt-2">Scan to capture</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-4 py-20 max-w-5xl mx-auto text-center">
        <h2 className="font-display uppercase text-4xl sm:text-6xl leading-none">Your photographer can't be everywhere.</h2>
        <p className="mt-6 text-xl text-muted-foreground">That's why everyone gets a camera. Scan. Shoot. Share.</p>
      </section>

      {/* How */}
      <section id="how" className="px-4 pb-20 max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-3xl border border-border bg-card p-6">
              <span className="font-display text-5xl text-accent">0{i + 1}</span>
              <s.icon className="w-6 h-6 mt-4" />
              <h3 className="font-bold text-lg mt-3">{s.t}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Niches */}
      <section id="niches" className="px-4 py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Made for every gathering</p>
          <h2 className="font-display uppercase text-4xl sm:text-6xl mt-3 leading-none">If people gather, Wazi fits.</h2>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {NICHES.map((x, i) => (
              <button key={x.id} onClick={() => setActive(i)} aria-pressed={i === active}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${i === active ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}>
                <x.icon className="w-4 h-4" />{x.label}
              </button>
            ))}
          </div>
          <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 grid md:grid-cols-2 rounded-3xl overflow-hidden bg-card border border-border">
            <img src={img(n.photo, 1200)} alt={n.label} className="w-full h-72 md:h-[420px] object-cover" />
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <n.icon className="w-8 h-8 text-accent" />
              <h3 className="font-display uppercase text-4xl md:text-5xl mt-4 leading-none">{n.title}</h3>
              <p className="text-muted-foreground mt-4 text-lg">{n.sub}</p>
              <Link to="/login?next=/events/new" className="mt-8 self-start bg-accent text-accent-foreground rounded-full px-6 py-3 font-bold inline-flex items-center gap-2">Start for {n.label.toLowerCase()} <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </motion.div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {NICHES.map((x, i) => (
              <button key={x.id} onClick={() => setActive(i)} className="group relative aspect-square rounded-2xl overflow-hidden text-left">
                <img src={img(x.photo, 400)} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <span className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                <span className="absolute bottom-3 left-3 text-background font-bold text-sm">{x.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Reveal */}
      <section className="px-4 py-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">The reveal</p>
          <h2 className="font-display uppercase text-4xl sm:text-7xl mt-3 leading-none">The memories are developing…</h2>
          <p className="mt-6 text-lg text-background/70">Show photos instantly, after the event, or on a date you choose. Like waiting for film — but the next morning.</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-20 max-w-7xl mx-auto">
        <h2 className="font-display uppercase text-4xl sm:text-6xl text-center leading-none">Simple pricing in Ksh.</h2>
        <p className="text-center text-muted-foreground mt-4">Pay once per event with M-PESA or card.</p>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {tiers.map((t, i) => (
            <div key={t.id} className={`rounded-3xl p-8 border ${i === 1 ? "bg-foreground text-background border-foreground" : "bg-card border-border"}`}>
              <p className="font-bold uppercase tracking-widest text-sm">{t.name || t.id}</p>
              <p className="font-display text-5xl mt-4">Ksh {Number(t.base_kes).toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-1">+ Ksh {t.per_guest_kes} per guest</p>
              <Link to="/login?next=/events/new" className={`mt-8 block text-center rounded-full py-3 font-bold ${i === 1 ? "bg-accent text-accent-foreground" : "border-2 border-foreground"}`}>Create your Wazi</Link>
            </div>
          ))}
        </div>
        <p className="text-center mt-6"><Link to="/pricing" className="underline">See full pricing</Link></p>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 py-20 max-w-3xl mx-auto">
        <h2 className="font-display uppercase text-4xl sm:text-5xl text-center">Questions</h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button className="w-full flex justify-between items-center py-5 text-left font-medium" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                {q}<span className="text-2xl text-accent">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="pb-5 text-muted-foreground">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 bg-accent text-accent-foreground text-center">
        <h2 className="font-display uppercase text-5xl sm:text-7xl leading-none">No app. No setup.<br />Just the moment.</h2>
        <Link to="/login?next=/events/new" className="mt-10 inline-flex items-center gap-2 bg-foreground text-background rounded-full px-10 py-4 font-bold uppercase">Create your Wazi <ArrowRight className="w-4 h-4" /></Link>
      </section>

      <footer className="px-4 py-10 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-display text-xl uppercase text-foreground">Wazi<span className="text-accent">.</span></span>
          <div className="flex gap-6"><Link to="/pricing">Pricing</Link><Link to="/join">Join an event</Link><Link to="/login">Log in</Link></div>
          <span>© {new Date().getFullYear()} Wazi Events · wazievents.co.ke</span>
        </div>
      </footer>
    </div>
  );
}
