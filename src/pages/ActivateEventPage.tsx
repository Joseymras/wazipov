import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useTierPrices } from "@/hooks/useTierPrices";
import { toast } from "@/hooks/use-toast";

const SHOT_OPTIONS = [10, 15, 20, 25, 30];

export default function ActivateEventPage() {
  const { eventId } = useParams();
  const { tiers } = useTierPrices();
  const [event, setEvent] = useState<{ name: string; status: string; guest_limit: number; snaps_per_guest: number } | null>(null);
  const [guests, setGuests] = useState(100);
  const [shots, setShots] = useState(25);
  const [plan, setPlan] = useState<string>("starter");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("events").select("name,status,guest_limit,snaps_per_guest").eq("id", eventId!).maybeSingle()
      .then(({ data }) => { if (data) { setEvent(data as any); setShots(data.snaps_per_guest || 25); } });
  }, [eventId]);

  const tier = tiers.find((t) => t.id === plan) || tiers[0];
  const total = tier ? tier.base_kes + tier.per_guest_kes * guests : 0;

  async function pay() {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("paystack-init", {
      body: { plan, guests, shots, event_id: eventId, callback_url: `${window.location.origin}/payment-success` },
    });
    if (error || !data?.authorization_url) {
      toast({ title: "We couldn't start checkout", description: data?.error || "Please try again in a moment.", variant: "destructive" });
      setBusy(false);
      return;
    }
    window.location.href = data.authorization_url;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <Button variant="ghost" size="sm" asChild><Link to="/dashboard/events"><ArrowLeft className="w-4 h-4" /> Events</Link></Button>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Activate your camera</p>
          <h1 className="font-display text-4xl md:text-5xl uppercase mt-2">{event?.name || "Your event"}</h1>
          <p className="text-muted-foreground mt-2">
            {event?.status === "active" && event.guest_limit > 10
              ? `Active · up to ${event.guest_limit} guests · ${event.snaps_per_guest} shots each.`
              : "Free cameras allow 10 guests. Pick your guest count and shots to unlock the full event."}
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-baseline"><span className="text-sm font-medium">Guests</span><span className="font-display text-3xl">{guests}</span></div>
          <Slider value={[guests]} min={10} max={1000} step={10} onValueChange={(v) => setGuests(v[0])} />
          <div>
            <p className="text-sm font-medium mb-2">Shots per guest</p>
            <div className="flex flex-wrap gap-2">
              {SHOT_OPTIONS.map((s) => (
                <button key={s} onClick={() => setShots(s)} aria-pressed={shots === s}
                  className={`px-4 h-10 rounded-full border text-sm ${shots === s ? "bg-foreground text-background border-foreground" : "border-border"}`}>{s}</button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{shots} shots. Make them count.</p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {tiers.map((t) => (
            <button key={t.id} onClick={() => setPlan(t.id)} aria-pressed={plan === t.id}
              className={`text-left rounded-2xl border-2 p-4 ${plan === t.id ? "border-foreground" : "border-border"}`}>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted-foreground">Ksh {(t.base_kes + t.per_guest_kes * guests).toLocaleString()}</p>
              {plan === t.id && <Check className="w-4 h-4 mt-2 text-accent" />}
            </button>
          ))}
        </section>

        <Button size="lg" className="w-full rounded-full h-14" onClick={pay} disabled={busy || total <= 0}>
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…</> : `Pay Ksh ${total.toLocaleString()} · M-PESA or card`}
        </Button>
        <p className="text-xs text-center text-muted-foreground">Your event activates automatically once Paystack confirms the payment.</p>
      </div>
    </div>
  );
}
