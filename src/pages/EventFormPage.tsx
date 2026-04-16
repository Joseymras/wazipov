import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";

type RevealTiming = "immediate" | "after_event" | "24h_delay" | "custom";
type GalleryType = "shared" | "private";

export default function EventFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const isEditing = !!eventId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [themeColor, setThemeColor] = useState("#e85d3a");
  const [snapsPerGuest, setSnapsPerGuest] = useState(10);
  const [revealTiming, setRevealTiming] = useState<RevealTiming>("after_event");
  const [revealDate, setRevealDate] = useState("");
  const [galleryType, setGalleryType] = useState<GalleryType>("shared");
  const [scavengerPrompts, setScavengerPrompts] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) loadEvent();
  }, [eventId]);

  async function loadEvent() {
    const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (data) {
      setName(data.name);
      setDescription(data.description || "");
      setEventDate(data.event_date ? data.event_date.split("T")[0] : "");
      setThemeColor(data.theme_color || "#e85d3a");
      setSnapsPerGuest(data.snaps_per_guest);
      setRevealTiming(data.reveal_timing);
      setRevealDate(data.reveal_date ? data.reveal_date.split("T")[0] : "");
      setGalleryType(data.gallery_type);
      setScavengerPrompts(data.scavenger_prompts?.join("\n") || "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const shortLink = isEditing ? undefined : `pov_${Date.now().toString(36)}`;
    const eventData = {
      host_id: user.id,
      name,
      description: description || null,
      event_date: eventDate ? new Date(eventDate).toISOString() : null,
      theme_color: themeColor,
      snaps_per_guest: snapsPerGuest,
      reveal_timing: revealTiming,
      reveal_date: revealTiming === "custom" && revealDate ? new Date(revealDate).toISOString() : null,
      gallery_type: galleryType,
      scavenger_prompts: scavengerPrompts.split("\n").filter(Boolean),
      ...(shortLink ? { short_link: shortLink } : {}),
    };

    try {
      if (isEditing) {
        const { error } = await supabase.from("events").update(eventData).eq("id", eventId);
        if (error) throw error;
        toast({ title: "Event updated!" });
      } else {
        const { data, error } = await supabase.from("events").insert(eventData).select().single();
        if (error) throw error;
        toast({ title: "Event created!" });
        navigate(`/events/${data.id}/qr`);
        return;
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const colors = ["#e85d3a", "#c44569", "#d4a84c", "#2dd4a8", "#4f46e5", "#e84393"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl font-bold text-foreground mb-8">
            {isEditing ? "Edit Event" : "Create New Event"}
          </motion.h1>

          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Event Name *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Sarah & James Wedding" className="h-12 rounded-xl bg-background/50" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell your guests about the event..." className="rounded-xl bg-background/50 min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Event Date</label>
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-12 rounded-xl bg-background/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Snaps Per Guest</label>
                <Input type="number" min={1} max={50} value={snapsPerGuest} onChange={e => setSnapsPerGuest(+e.target.value)} className="h-12 rounded-xl bg-background/50" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Theme Color</label>
              <div className="flex gap-3">
                {colors.map(c => (
                  <button key={c} type="button" onClick={() => setThemeColor(c)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${themeColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reveal Timing</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "immediate", label: "Immediate" },
                  { value: "after_event", label: "After Event" },
                  { value: "24h_delay", label: "24h Delay" },
                  { value: "custom", label: "Custom Date" },
                ] as const).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setRevealTiming(opt.value)}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all ${revealTiming === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background/50 text-muted-foreground hover:border-primary/50"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {revealTiming === "custom" && (
                <Input type="datetime-local" value={revealDate} onChange={e => setRevealDate(e.target.value)} className="h-12 rounded-xl bg-background/50 mt-2" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Gallery Type</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "shared", label: "Shared (everyone sees)" },
                  { value: "private", label: "Private (host only)" },
                ] as const).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setGalleryType(opt.value)}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all ${galleryType === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background/50 text-muted-foreground hover:border-primary/50"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Scavenger Hunt Prompts (one per line)</label>
              <Textarea value={scavengerPrompts} onChange={e => setScavengerPrompts(e.target.value)}
                placeholder={"Best dance move\nCake cutting POV\nFunniest face"} className="rounded-xl bg-background/50 min-h-[80px]" />
            </div>

            <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Event"} <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
