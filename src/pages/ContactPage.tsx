import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const CONTACT_EMAIL = "joseymras88@gmail.com";
const TOPICS = ["Support", "Sales", "Sponsorship", "Partnership", "Press"] as const;

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "Support", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.website) return; // spam trap
    if (!form.email && !form.phone) { setErr("Add an email or phone number so we can reply."); return; }
    if (form.message.trim().length < 5) { setErr("Tell us a little more in your message."); return; }
    setErr(""); setState("sending");
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim().slice(0, 100), email: form.email.trim() || null, phone: form.phone.trim() || null,
      topic: form.topic, message: form.message.trim().slice(0, 3000),
    });
    setState(error ? "error" : "sent");
  }

  const field = "w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring";
  const wa = `https://wa.me/?text=${encodeURIComponent("Habari Wazi, I'd like to ask about ")}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-bold">WAZI</Link>
          <Link to="/login?next=/events/new" className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold">Create your event</Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-5 gap-10">
        <section className="md:col-span-2 space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Contact</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">Karibu. How can we help?</h1>
          <p className="text-muted-foreground">Questions about your event, payments, sponsorship or partnering with us. We reply within one working day.</p>
          <div className="space-y-3">
            <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground p-4 font-semibold">
              <MessageCircle className="w-5 h-5" /> Chat with us on WhatsApp
            </a>
            <div className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm">
              <Clock className="w-5 h-5 text-primary" /> Mon to Sat, 8:00 to 20:00 EAT · Nairobi, Kenya
            </div>
          </div>
        </section>

        <section className="md:col-span-3 rounded-2xl bg-card border border-border p-6 md:p-8">
          {state === "sent" ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <h2 className="font-display text-3xl font-bold">Asante. Message received.</h2>
              <p className="text-muted-foreground">We'll get back to you within one working day.</p>
              <Button variant="outline" onClick={() => { setForm({ name: "", email: "", phone: "", topic: "Support", message: "", website: "" }); setState("idle"); }}>Send another</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm font-medium">Name<input required maxLength={100} className={field} value={form.name} onChange={set("name")} /></label>
                <label className="space-y-1 text-sm font-medium">Topic
                  <select className={field} value={form.topic} onChange={set("topic")}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
                </label>
                <label className="space-y-1 text-sm font-medium">Email<input type="email" className={field} value={form.email} onChange={set("email")} /></label>
                <label className="space-y-1 text-sm font-medium">Phone<input type="tel" placeholder="+254 7XX XXX XXX" className={field} value={form.phone} onChange={set("phone")} /></label>
              </div>
              <label className="block space-y-1 text-sm font-medium">Message<textarea required rows={6} maxLength={3000} className={field} value={form.message} onChange={set("message")} /></label>
              <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={set("website")} />
              {err && <p className="text-sm text-destructive">{err}</p>}
              {state === "error" && <p className="text-sm text-destructive">We couldn't send that. Please try again in a moment.</p>}
              <Button type="submit" size="lg" className="w-full rounded-xl" disabled={state === "sending" || !form.name}>
                {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send message"}
              </Button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
