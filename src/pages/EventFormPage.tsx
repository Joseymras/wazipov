import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { USE_CASES } from "@/lib/usecases";

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
  const [snapsPerGuest, setSnapsPerGuest] = useState(10);
  const [revealTiming, setRevealTiming] = useState<RevealTiming>("after_event");
  const [revealDate, setRevealDate] = useState("");
  const [galleryType, setGalleryType] = useState<GalleryType>("shared");
  const [scavengerPrompts, setScavengerPrompts] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [useCase, setUseCase] = useState("general");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [allowVideo, setAllowVideo] = useState(true);
  const [allowMusic, setAllowMusic] = useState(true);
  const [allowGreenscreen, setAllowGreenscreen] = useState(true);
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredUrl, setFeaturedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isEditing) loadEvent(); /* eslint-disable-next-line */ }, [eventId]);

  async function loadEvent() {
    const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (data) {
      setName(data.name);
      setDescription(data.description || "");
      setEventDate(data.event_date ? data.event_date.split("T")[0] : "");
      setSnapsPerGuest(data.snaps_per_guest);
      setRevealTiming(data.reveal_timing);
      setRevealDate(data.reveal_date ? data.reveal_date.split("T")[0] : "");
      setGalleryType(data.gallery_type);
      setScavengerPrompts(data.scavenger_prompts?.join("\n") || "");
      setCity(data.city || "");
      setCountry(data.country || "");
      setIsPublic(data.is_public);
      setUseCase(data.use_case || "general");
      setWelcomeMessage(data.welcome_message || "");
      setAllowVideo(data.allow_video);
      setAllowMusic(data.allow_music);
      setAllowGreenscreen(data.allow_greenscreen);
      setFeaturedUrl(data.featured_image_url);
    }
  }

  async function uploadFeatured(): Promise<string | null> {
    if (!featuredFile || !user) return featuredUrl;
    const path = `${user.id}/${Date.now()}_${featuredFile.name}`;
    const { error } = await supabase.storage.from("event-covers").upload(path, featuredFile, { upsert: true });
    if (error) { console.error(error); return featuredUrl; }
    const { data } = supabase.storage.from("event-covers").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const finalFeatured = featuredFile ? await uploadFeatured() : featuredUrl;
      const shortLink = isEditing ? undefined : `pov_${Date.now().toString(36)}`;
      const eventData: any = {
        host_id: user.id,
        name,
        description: description || null,
        event_date: eventDate ? new Date(eventDate).toISOString() : null,
        snaps_per_guest: snapsPerGuest,
        reveal_timing: revealTiming,
        reveal_date: revealTiming === "custom" && revealDate ? new Date(revealDate).toISOString() : null,
        gallery_type: galleryType,
        scavenger_prompts: scavengerPrompts.split("\n").filter(Boolean),
        city: city || null,
        country: country || null,
        is_public: isPublic,
        use_case: useCase,
        welcome_message: welcomeMessage || null,
        allow_video: allowVideo,
        allow_music: allowMusic,
        allow_greenscreen: allowGreenscreen,
        featured_image_url: finalFeatured,
        ...(shortLink ? { short_link: shortLink } : {}),
      };

      if (isEditing) {
        const { error } = await supabase.from("events").update(eventData).eq("id", eventId);
        if (error) throw error;
        toast({ title: "Event updated" });
        navigate("/dashboard/events");
      } else {
        const { data, error } = await supabase.from("events").insert(eventData).select().single();
        if (error) throw error;
        toast({ title: "Event created" });
        navigate(`/events/${data.id}/qr`);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl font-bold mb-8">
            {isEditing ? "Edit Event" : "Create New Event"}
          </motion.h1>

          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
            {/* Featured image */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Featured image</label>
              <label className="flex flex-col items-center justify-center w-full aspect-[16/9] rounded-xl border-2 border-dashed border-border hover:border-foreground/40 cursor-pointer overflow-hidden bg-muted/30 transition-all">
                {featuredFile ? (
                  <img src={URL.createObjectURL(featuredFile)} alt="" className="w-full h-full object-cover" />
                ) : featuredUrl ? (
                  <img src={featuredUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Upload a cover image</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => setFeaturedFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event name *</label>
              <Input value={name} onChange={e => setName(e.target.value)}
                placeholder="Sarah & James Wedding" className="h-12 rounded-xl" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Tell your guests about the event..." className="rounded-xl min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Welcome message (shown in camera)</label>
              <Input value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)}
                placeholder="Welcome! Take 10 fun shots." className="h-12 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Snaps per guest</label>
                <Input type="number" min={1} max={50} value={snapsPerGuest} onChange={e => setSnapsPerGuest(+e.target.value)} className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Nairobi" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Kenya" className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Use case template</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {USE_CASES.map(uc => (
                  <button key={uc.id} type="button" onClick={() => setUseCase(uc.id)}
                    className={`p-2 rounded-lg text-xs border transition-all flex flex-col items-center gap-1 ${
                      useCase === uc.id ? "border-foreground bg-secondary" : "border-border hover:border-foreground/40"
                    }`}>
                    <uc.icon className="w-4 h-4" />
                    {uc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 bg-muted/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <div>
                    <p className="text-sm font-medium">Public event</p>
                    <p className="text-xs text-muted-foreground">Show in city directory & discovery</p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Allow video recording</p>
                <Switch checked={allowVideo} onCheckedChange={setAllowVideo} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Allow soundtrack</p>
                <Switch checked={allowMusic} onCheckedChange={setAllowMusic} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Allow green-screen</p>
                <Switch checked={allowGreenscreen} onCheckedChange={setAllowGreenscreen} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reveal timing</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { value: "immediate", label: "Immediate" },
                  { value: "after_event", label: "After event" },
                  { value: "24h_delay", label: "24h delay" },
                  { value: "custom", label: "Custom" },
                ] as const).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setRevealTiming(opt.value)}
                    className={`p-2.5 rounded-lg text-sm border transition-all ${
                      revealTiming === opt.value ? "border-foreground bg-secondary" : "border-border hover:border-foreground/40"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {revealTiming === "custom" && (
                <Input type="datetime-local" value={revealDate} onChange={e => setRevealDate(e.target.value)} className="h-12 rounded-xl mt-2" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gallery type</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "shared", label: "Shared (everyone sees)" },
                  { value: "private", label: "Private (host only)" },
                ] as const).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setGalleryType(opt.value)}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                      galleryType === opt.value ? "border-foreground bg-secondary" : "border-border hover:border-foreground/40"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scavenger hunt prompts (one per line)</label>
              <Textarea value={scavengerPrompts} onChange={e => setScavengerPrompts(e.target.value)}
                placeholder={"Best dance move\nCake cutting POV\nFunniest face"}
                className="rounded-xl min-h-[80px]" />
            </div>

            <Button size="lg" className="w-full rounded-full" type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save changes" : "Create event"} <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
