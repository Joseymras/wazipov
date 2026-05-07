import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ArrowLeft, Lock, Eye, X, Trash2, Share2, BookOpen, Loader2, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";
import jsPDF from "jspdf";
import AudioGuestbook from "@/components/AudioGuestbook";
import AdSlot from "@/components/AdSlot";
import { getOwnerKey, getOrCreateWallet, isUnlocked, spendTokensToUnlock, KES_PER_TOKEN, UNLOCK_COST } from "@/lib/wallet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type PdfTemplate = "classic" | "polaroid" | "magazine" | "minimal";
const PDF_TEMPLATES: { id: PdfTemplate; name: string; desc: string }[] = [
  { id: "classic", name: "Classic", desc: "Bold cover, 2×2 grid spreads" },
  { id: "polaroid", name: "Polaroid", desc: "Tilted instant-photo collage" },
  { id: "magazine", name: "Magazine", desc: "Editorial hero + caption" },
  { id: "minimal", name: "Minimal", desc: "Clean white, one photo per page" },
];

interface Photo {
  id: string;
  storage_path: string;
  is_revealed: boolean;
  is_flagged: boolean;
  created_at: string;
  guest_id: string | null;
  ai_caption: string | null;
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
  const [busy, setBusy] = useState<"zip" | "pdf" | "unlock" | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => { loadGallery(); checkUnlock(); }, [eventId, user]);

  async function checkUnlock() {
    if (!eventId) return;
    const key = getOwnerKey(user?.id);
    const [u, w] = await Promise.all([isUnlocked(eventId, key), getOrCreateWallet(key)]);
    setUnlocked(u);
    setBalance(w?.balance_tokens ?? 0);
  }

  async function topUp() {
    try {
      const { data, error } = await supabase.functions.invoke("wallet-topup", {
        body: { tokens: 5, owner_key: getOwnerKey(user?.id), callback_url: window.location.href },
      });
      const url = data?.authorization_url || data?.url;
      if (error || !url) throw new Error(data?.error || "Top-up failed");
      window.location.href = url;
    } catch (e: any) {
      toast({ title: "Top-up error", description: e.message, variant: "destructive" });
    }
  }

  async function unlockGallery() {
    if (!eventId) return;
    setBusy("unlock");
    const key = getOwnerKey(user?.id);
    const res = await spendTokensToUnlock(eventId, key);
    setBusy(null);
    if (!res.ok) { toast({ title: "Not enough tokens", description: `Top up to unlock for ${UNLOCK_COST} token (Ksh ${UNLOCK_COST * KES_PER_TOKEN})` }); return; }
    setUnlocked(true);
    setShowUnlock(false);
    toast({ title: "Gallery unlocked!" });
    checkUnlock();
  }

  async function loadGallery() {
    const { data: evt } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (!evt) { setLoading(false); return; }
    setEvent(evt);
    setIsHost(user?.id === evt.host_id);

    const guestIdent = localStorage.getItem(`pov_guest_${eventId}`);
    if (guestIdent) {
      const { data: guest } = await supabase.from("event_guests").select("id")
        .eq("event_id", eventId!).eq("guest_identifier", guestIdent).maybeSingle();
      if (guest) setGuestId(guest.id);
    }

    let query = supabase.from("photos").select("*").eq("event_id", eventId!).eq("is_flagged", false).order("created_at", { ascending: false });
    if (user?.id !== evt.host_id) query = query.eq("is_revealed", true);
    const { data: photoData } = await query;
    if (photoData) {
      setPhotos(photoData.map(p => ({
        ...p,
        url: supabase.storage.from("event-photos").getPublicUrl(p.storage_path).data.publicUrl,
      })));
    }
    setLoading(false);
  }

  async function revealAllPhotos() {
    await supabase.from("photos").update({ is_revealed: true }).eq("event_id", eventId!);
    toast({ title: "Photos revealed! 🎉" });
    loadGallery();
  }

  async function deletePhoto(photoId: string) {
    await supabase.from("photos").delete().eq("id", photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setSelectedPhoto(null);
    toast({ title: "Photo deleted" });
  }

  async function downloadAllZip() {
    if (!photos.length) return;
    if (!isHost && !unlocked) { setShowUnlock(true); return; }
    setBusy("zip");
    try {
      const zip = new JSZip();
      const folder = zip.folder(event?.name || "pov-album")!;
      await Promise.all(photos.map(async (p, i) => {
        if (!p.url) return;
        try {
          const res = await fetch(p.url);
          const blob = await res.blob();
          folder.file(`pov-${String(i + 1).padStart(3, "0")}.jpg`, blob);
        } catch { /* skip */ }
      }));
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${event?.name || "pov-album"}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "ZIP downloaded!" });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
    setBusy(null);
  }

  async function exportPhotobook(template: PdfTemplate = "classic") {
    if (!photos.length) return;
    setShowTemplates(false);
    setBusy("pdf");
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297, M = 15;
      const dateStr = event?.event_date ? new Date(event.event_date).toLocaleDateString() : "";

      // ---------- COVER ----------
      if (template === "minimal") {
        pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, "F");
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(48);
        pdf.text(event?.name || "Album", M, H / 2, { maxWidth: W - 2 * M });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
        pdf.text(dateStr, M, H / 2 + 14);
      } else if (template === "magazine") {
        pdf.setFillColor(20, 20, 20); pdf.rect(0, 0, W, H, "F");
        if (photos[0]?.url) {
          try { pdf.addImage(await fetchAsDataUrl(photos[0].url), "JPEG", 0, 0, W, H * 0.65, undefined, "MEDIUM"); } catch {}
        }
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(40);
        pdf.text(event?.name || "Album", M, H * 0.78, { maxWidth: W - 2 * M });
        pdf.setFontSize(11); pdf.setFont("helvetica", "normal");
        pdf.text(`${dateStr} · ${photos.length} moments`, M, H * 0.86);
      } else if (template === "polaroid") {
        pdf.setFillColor(245, 240, 230); pdf.rect(0, 0, W, H, "F");
        pdf.setTextColor(40, 30, 20);
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(32);
        pdf.text(event?.name || "Memories", W / 2, 40, { align: "center" });
        pdf.setFont("helvetica", "italic"); pdf.setFontSize(12);
        pdf.text(dateStr, W / 2, 50, { align: "center" });
      } else {
        pdf.setFillColor(0, 0, 0); pdf.rect(0, 0, W, H, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(36);
        pdf.text(event?.name || "POV Album", W / 2, H / 2 - 10, { align: "center" });
        pdf.setFontSize(14); pdf.setFont("helvetica", "normal");
        pdf.text(dateStr, W / 2, H / 2 + 5, { align: "center" });
        pdf.setFontSize(10);
        pdf.text(`${photos.length} moments captured`, W / 2, H - 25, { align: "center" });
      }

      // ---------- PAGES ----------
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (!p.url) continue;
        let dataUrl: string;
        try { dataUrl = await fetchAsDataUrl(p.url); } catch { continue; }

        if (template === "minimal") {
          pdf.addPage();
          pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, "F");
          pdf.addImage(dataUrl, "JPEG", M, M, W - 2 * M, H - 2 * M - 12, undefined, "MEDIUM");
          if (p.ai_caption) {
            pdf.setTextColor(80, 80, 80); pdf.setFont("helvetica", "italic"); pdf.setFontSize(9);
            pdf.text(p.ai_caption.slice(0, 90), W / 2, H - 8, { align: "center" });
          }
        } else if (template === "magazine") {
          pdf.addPage();
          pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, "F");
          pdf.addImage(dataUrl, "JPEG", 0, 0, W, H * 0.6, undefined, "MEDIUM");
          pdf.setTextColor(20, 20, 20);
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(18);
          pdf.text(`Moment ${String(i + 1).padStart(2, "0")}`, M, H * 0.6 + 18);
          pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
          pdf.text(p.ai_caption || "Captured by a guest's POV.", M, H * 0.6 + 28, { maxWidth: W - 2 * M });
        } else if (template === "polaroid") {
          if (i % 2 === 0) {
            pdf.addPage();
            pdf.setFillColor(245, 240, 230); pdf.rect(0, 0, W, H, "F");
          }
          const slot = i % 2;
          const cx = W / 2, cy = slot === 0 ? H * 0.3 : H * 0.72;
          const size = 90;
          pdf.setFillColor(255, 255, 255);
          pdf.rect(cx - size / 2 - 5, cy - size / 2 - 5, size + 10, size + 25, "F");
          pdf.addImage(dataUrl, "JPEG", cx - size / 2, cy - size / 2, size, size, undefined, "MEDIUM");
          pdf.setTextColor(40, 30, 20); pdf.setFont("helvetica", "italic"); pdf.setFontSize(10);
          pdf.text(p.ai_caption?.slice(0, 40) || "memory", cx, cy + size / 2 + 12, { align: "center" });
        } else {
          // classic 2x2 grid
          const cols = 2, rows = 2;
          const cellW = (W - M * 3) / cols;
          const cellH = (H - M * 3) / rows;
          if (i % (cols * rows) === 0) pdf.addPage();
          const idx = i % (cols * rows);
          const col = idx % cols, row = Math.floor(idx / cols);
          const x = M + col * (cellW + M);
          const y = M + row * (cellH + M);
          pdf.addImage(dataUrl, "JPEG", x, y, cellW, cellH, undefined, "MEDIUM");
        }
      }
      pdf.save(`${event?.name || "pov-album"}-${template}.pdf`);
      toast({ title: `${template} photobook ready!` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
    setBusy(null);
  }

  async function shareGallery() {
    const url = window.location.href;
    const text = `Check out the POV album from ${event?.name}! 📸`;
    if (navigator.share) {
      try { await navigator.share({ title: event?.name, text, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it anywhere — WhatsApp, IG, X, Messenger." });
    }
  }

  const filteredPhotos = filter === "my_pov" && guestId ? photos.filter(p => p.guest_id === guestId) : photos;
  const unrevealedCount = isHost ? photos.filter(p => !p.is_revealed).length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar /><Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
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
                <Button variant="glass" size="sm" onClick={downloadAllZip} disabled={busy !== null || !photos.length}>
                  {busy === "zip" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download ZIP
                </Button>
                {isHost && (
                  <Button variant="glass" size="sm" onClick={exportPhotobook} disabled={busy !== null || !photos.length}>
                    {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                    Photobook PDF
                  </Button>
                )}
                <Button variant="glass" size="sm" onClick={shareGallery}>
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </div>

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
            // Masonry via CSS columns
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
              {filteredPhotos.map((photo, i) => (
                <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i, 12) * 0.025 }}
                  className="relative mb-3 rounded-2xl overflow-hidden cursor-pointer group break-inside-avoid"
                  onClick={() => setSelectedPhoto(photo)}>
                  {photo.is_revealed || isHost ? (
                    <img src={photo.url} alt="POV moment" className="w-full h-auto object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {!photo.is_revealed && isHost && (
                    <div className="absolute top-2 right-2 bg-accent/80 text-accent-foreground rounded-full px-2 py-0.5 text-xs">Hidden</div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {eventId && (
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <AudioGuestbook eventId={eventId} isHost={isHost} />
              <AdSlot slotKey="gallery-side" />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-3xl max-h-[80vh] w-full" onClick={e => e.stopPropagation()}>
              <img src={selectedPhoto.url} alt="" className="w-full h-full object-contain rounded-2xl" />
              <div className="absolute top-4 right-4 flex gap-2">
                <a href={selectedPhoto.url} download={`pov-${selectedPhoto.id}.jpg`} target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center hover:bg-background/40 transition-colors">
                  <Download className="w-5 h-5 text-background" />
                </a>
                {isHost && (
                  <button onClick={() => deletePhoto(selectedPhoto.id)} aria-label="Delete photo"
                    className="w-10 h-10 rounded-full bg-destructive/80 flex items-center justify-center hover:bg-destructive transition-colors">
                    <Trash2 className="w-5 h-5 text-background" />
                  </button>
                )}
                <button onClick={() => setSelectedPhoto(null)} aria-label="Close"
                  className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center hover:bg-background/40 transition-colors">
                  <X className="w-5 h-5 text-background" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-xs text-background/60">{new Date(selectedPhoto.created_at).toLocaleString()}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
