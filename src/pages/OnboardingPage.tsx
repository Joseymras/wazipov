import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { USE_CASES, getUseCase } from "@/lib/usecases";
import { toast } from "@/hooks/use-toast";

type Step = "welcome" | "usecase" | "details" | "done";

export default function OnboardingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [usecaseId, setUsecaseId] = useState("general");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login?next=/onboarding");
    if (profile?.onboarded) navigate("/dashboard");
  }, [user, profile, navigate]);

  async function finishOnboarding() {
    if (!user) return;
    setCreating(true);
    try {
      const uc = getUseCase(usecaseId);
      const shortLink = `pov_${Date.now().toString(36)}`;
      const { data: event, error } = await supabase.from("events").insert({
        host_id: user.id,
        name: eventName || `My ${uc.label}`,
        event_date: eventDate ? new Date(eventDate).toISOString() : null,
        city: city || null,
        use_case: usecaseId,
        filter_preset: uc.filter_preset,
        snaps_per_guest: uc.snaps_per_guest,
        reveal_timing: uc.reveal_timing,
        welcome_message: uc.welcome_message,
        scavenger_prompts: uc.scavenger_prompts,
        soundtrack_id: uc.soundtrack_id,
        short_link: shortLink,
        is_active: true,
      }).select().single();
      if (error) throw error;
      await supabase.from("profiles").update({ onboarded: true }).eq("user_id", user.id);
      toast({ title: "You're all set!", description: "Your first event is ready." });
      navigate(`/events/${event.id}/qr`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-6">

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {(["welcome","usecase","details"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-medium border ${
                step === s ? "bg-foreground text-background border-foreground" :
                ["welcome","usecase","details"].indexOf(step) > i ? "bg-foreground text-background border-foreground" :
                "border-border bg-card"
              }`}>{i + 1}</div>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === "welcome" && (
          <div className="text-center space-y-6 py-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-foreground flex items-center justify-center">
              <Camera className="w-8 h-8 text-background" />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold">Welcome to POV Moments</h1>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                The disposable camera for any event. Let's set up your first one in under a minute.
              </p>
            </div>
            <Button size="lg" onClick={() => setStep("usecase")} className="rounded-full">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === "usecase" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-heading text-2xl md:text-3xl font-bold">What kind of event?</h2>
              <p className="text-muted-foreground text-sm">We'll set up sensible defaults you can edit anytime.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {USE_CASES.map(uc => (
                <button key={uc.id} onClick={() => setUsecaseId(uc.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    usecaseId === uc.id ? "border-foreground bg-secondary" : "border-border hover:border-foreground/40"
                  }`}>
                  <uc.icon className="w-5 h-5 mb-2" />
                  <p className="font-semibold text-sm">{uc.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{uc.description}</p>
                  {usecaseId === uc.id && <Check className="w-4 h-4 mt-2 text-accent" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep("welcome")}>Back</Button>
              <Button onClick={() => setStep("details")} className="flex-1 rounded-full">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-heading text-2xl md:text-3xl font-bold">Tell us about it</h2>
              <p className="text-muted-foreground text-sm">All of this is editable later.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Event name</label>
                <Input value={eventName} onChange={e => setEventName(e.target.value)} placeholder={`My ${getUseCase(usecaseId).label}`} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date (optional)</label>
                  <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">City (optional)</label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Nairobi" className="h-11" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep("usecase")}>Back</Button>
              <Button onClick={finishOnboarding} disabled={creating} className="flex-1 rounded-full">
                {creating ? "Creating..." : "Create my event"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
