import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Download, ArrowLeft, Lock, Eye, X, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";

interface Photo {
  id: string;
  storage_path: string;
  is_revealed: boolean;
  is_flagged: boolean;
  created_at: string;
  guest_id: string | null;
  ai_caption: string | null;
  mood_tag: string | null;
  url?: string;
}

export default function GalleryPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [filter, setFilter] = useState<"all" | "my_pov">("all");
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    loadGallery();
  }, [eventId, user]);

  async function loadGallery() {
    const { data: evt } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (!evt) { setLoading(false); return; }
    setEvent(evt);
    setIsHost(user?.id === evt.host_id);

    // Check if photos should be revealed
    const shouldReveal = checkRevealStatus(evt);

    // Get guest ID for "My POV" filter
    const guestIdent = localStorage.getItem(`pov_guest_${eventId}`);
    if (guestIdent) {
      const { data: guest } = await supabase
        .from("event_guests")
        .select("id")
        .eq("event_id", eventId!)
        .eq("guest_identifier", guestIdent)
        .maybeSingle();
      if (guest) setGuestId(guest.id);
    }

    let query = supabase.from("photos").select("*").eq("event_id", eventId!).eq("is_flagged", false).order("created_at", { ascending: false });

    // Non-hosts can only see revealed photos
    if (user?.id !== evt.host_id) {
      query = query.eq("is_revealed", true);
    }

    const { data: photoData } = await query;

    if (photoData) {
      const photosWithUrls = photoData.map(p => ({
        ...p,
        url: supabase.storage.from("event-photos").getPublicUrl(p.storage_path).data.publicUrl,
      }));
      setPhotos(photosWithUrls);
    }
    setLoading(false);
  }

  function checkRevealStatus(evt: any): boolean {
    if (evt.reveal_timing === "immediate") return true;
    if (evt.reveal_timing === "custom" && evt.reveal_date) {
      return new Date() >= new Date(evt.reveal_date);
    }
    if (evt.reveal_timing === "24h_delay" && evt.event_date) {
      const revealTime = new Date(evt.event_date);
      revealTime.setHours(revealTime.getHours() + 24);
      return new Date() >= revealTime;
    }
    return false;
  }

  async function revealAllPhotos() {
    await supabase.from("photos").update({ is_revealed: true }).eq("event_id", eventId!);
    toast({ title: "Photos revealed!" });
    loadGallery();
  }

  async function deletePhoto(photoId: string) {
    await supabase.from("photos").delete().eq("id", photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setSelectedPhoto(null);
    toast({ title: "Photo deleted" });
  }

  async function downloadAll() {
    for (const photo of photos) {
      if (photo.url) {
        const a = document.createElement("a");
        a.href = photo.url;
        a.download = `pov-${photo.id}.jpg`;
        a.target = "_blank";
        a.click();
      }
    }
  }

  const filteredPhotos = filter === "my_pov" && guestId
    ? photos.filter(p => p.guest_id === guestId)
    : photos;

  const unrevealedCount = isHost ? photos.filter(p => !p.is_revealed).length : 0;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Navbar /><p className="text-muted-foreground">Loading gallery...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(isHost ? "/dashboard" : "/")} className="mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  {event?.event_date ? new Date(event.event_date).toLocaleDateString() : ""}
                </p>
                <h1 className="font-heading text-3xl font-bold text-foreground">{event?.name}</h1>
                <p className="text-muted-foreground">{photos.length} Photos</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {isHost && unrevealedCount > 0 && (
                  <Button variant="hero" size="sm" onClick={revealAllPhotos}>
                    <Eye className="w-4 h-4" /> Reveal All ({unrevealedCount})
                  </Button>
                )}
                <Button variant="glass" size="sm" onClick={downloadAll}>
                  <Download className="w-4 h-4" /> Download All
                </Button>
                <Button variant="glass" size="sm" onClick={() => {
                  if (navigator.share) navigator.share({ title: event?.name, url: window.location.href });
                  else { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); }
                }}>
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-4 mt-6 border-b border-border/50">
              {(["all", "my_pov"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${filter === f ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {f === "all" ? "All" : "My POV"}
                </button>
              ))}
            </div>
          </motion.div>

          {filteredPhotos.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-lg text-muted-foreground">
                {photos.length === 0 ? "No photos yet" : "Photos haven't been revealed yet"}
              </p>
              <p className="text-sm text-muted-foreground">The magic happens when the host reveals the album!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredPhotos.map((photo, i) => (
                <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedPhoto(photo)}>
                  {photo.is_revealed || isHost ? (
                    <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {!photo.is_revealed && isHost && (
                    <div className="absolute top-2 right-2 bg-accent/80 text-accent-foreground rounded-full px-2 py-0.5 text-xs">
                      Hidden
                    </div>
                  )}
                  {photo.ai_caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 p-2">
                      <p className="text-xs text-background truncate">{photo.ai_caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-3xl max-h-[80vh] w-full" onClick={e => e.stopPropagation()}>
              <img src={selectedPhoto.url} alt="" className="w-full h-full object-contain rounded-2xl" />
              <div className="absolute top-4 right-4 flex gap-2">
                {isHost && (
                  <button onClick={() => deletePhoto(selectedPhoto.id)}
                    className="w-10 h-10 rounded-full bg-destructive/80 flex items-center justify-center hover:bg-destructive transition-colors">
                    <Trash2 className="w-5 h-5 text-background" />
                  </button>
                )}
                <button onClick={() => setSelectedPhoto(null)}
                  className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center hover:bg-background/40 transition-colors">
                  <X className="w-5 h-5 text-background" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-xs text-background/60">
                  {new Date(selectedPhoto.created_at).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
