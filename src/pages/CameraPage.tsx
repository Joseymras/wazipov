import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Aperture, SwitchCamera, Sparkles, Zap, ZapOff } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Filter = "disposable" | "bw" | "sepia" | "vintage" | "glam" | "none";

const FILTERS: { id: Filter; label: string; css: string }[] = [
  { id: "disposable", label: "Disposable", css: "saturate(1.3) contrast(1.1) sepia(0.15) brightness(1.05)" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.15)" },
  { id: "sepia", label: "Sepia", css: "sepia(0.85) saturate(1.4) contrast(1.05)" },
  { id: "vintage", label: "Vintage", css: "saturate(0.85) contrast(0.95) sepia(0.3) hue-rotate(-10deg)" },
  { id: "glam", label: "Glam", css: "saturate(1.15) contrast(1.05) brightness(1.08) blur(0.3px)" },
  { id: "none", label: "None", css: "none" },
];

export default function CameraPage() {
  const { eventId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [eventName, setEventName] = useState("Loading...");
  const [snapsLeft, setSnapsLeft] = useState(10);
  const [maxSnaps, setMaxSnaps] = useState(10);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shutterPress, setShutterPress] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<Filter>("disposable");
  const [countdownEnabled, setCountdownEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [eventId]);

  useEffect(() => { startCamera(); }, [facingMode]);

  async function loadEvent() {
    if (!eventId || eventId === "demo") {
      setEventName("Demo Camera"); setSnapsLeft(10); setMaxSnaps(10);
      setWelcomeMsg("Try the camera! Demo shots aren't saved.");
      setTimeout(() => setWelcomeMsg(null), 3500);
      return;
    }
    const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (!event) return;
    setEventName(event.name);
    setMaxSnaps(event.snaps_per_guest);
    setFilter((event.filter_preset as Filter) || "disposable");
    if (event.welcome_message) {
      setWelcomeMsg(event.welcome_message);
      setTimeout(() => setWelcomeMsg(null), 4000);
    }

    let guestIdent = localStorage.getItem(`pov_guest_${eventId}`);
    if (!guestIdent) {
      guestIdent = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      localStorage.setItem(`pov_guest_${eventId}`, guestIdent);
    }
    const { data: existing } = await supabase
      .from("event_guests").select("*").eq("event_id", eventId).eq("guest_identifier", guestIdent).maybeSingle();
    if (existing) { setGuestId(existing.id); setSnapsLeft(existing.snaps_remaining); }
    else {
      const { data: newGuest } = await supabase.from("event_guests")
        .insert({ event_id: eventId, guest_identifier: guestIdent, snaps_remaining: event.snaps_per_guest })
        .select().single();
      if (newGuest) { setGuestId(newGuest.id); setSnapsLeft(newGuest.snaps_remaining); }
    }
  }

  async function startCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraReady(true); }
    } catch {
      toast({ title: "Camera access denied", description: "Please allow camera access.", variant: "destructive" });
    }
  }

  async function captureNow() {
    if (!videoRef.current || !canvasRef.current) return;
    setShutterPress(true);
    setShowFlash(true);
    setTimeout(() => setShutterPress(false), 300);
    setTimeout(() => setShowFlash(false), 600);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    const filterCss = FILTERS.find(f => f.id === filter)?.css || "none";
    ctx.filter = filterCss;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = "none";

    const newSnaps = snapsLeft - 1;
    setSnapsLeft(newSnaps);
    if (newSnaps === 0) {
      setTimeout(() => setShowConfetti(true), 700);
      setTimeout(() => setShowConfetti(false), 3500);
    }

    if (eventId && eventId !== "demo" && guestId) {
      setUploading(true);
      try {
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), "image/jpeg", 0.88));
        const fileName = `${eventId}/${guestId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("event-photos").upload(fileName, blob, { contentType: "image/jpeg" });
        if (!uploadError) {
          await supabase.from("photos").insert({ event_id: eventId, guest_id: guestId, storage_path: fileName });
          await supabase.from("event_guests").update({ snaps_remaining: newSnaps }).eq("id", guestId);
        }
      } catch (err) { console.error("Upload failed:", err); }
      setUploading(false);
    }
  }

  const takePhoto = useCallback(async () => {
    if (snapsLeft <= 0 || !cameraReady || uploading || countdown !== null) return;
    if (countdownEnabled) {
      for (let n = 3; n > 0; n--) {
        setCountdown(n);
        await new Promise(r => setTimeout(r, 800));
      }
      setCountdown(null);
    }
    await captureNow();
  }, [snapsLeft, cameraReady, uploading, countdown, countdownEnabled, filter, facingMode]);

  const filterCss = FILTERS.find(f => f.id === filter)?.css || "none";

  return (
    <div className="fixed inset-0 bg-foreground/95 flex flex-col items-center justify-between select-none overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence>
        {showFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-background z-50 pointer-events-none" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {welcomeMsg && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-background/95 backdrop-blur rounded-full px-4 py-2 text-sm font-medium text-foreground shadow-lg max-w-xs text-center">
            {welcomeMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {countdown !== null && (
          <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="font-heading text-9xl font-bold text-primary drop-shadow-2xl">{countdown}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfetti && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card rounded-3xl p-8 text-center space-y-3">
              <div className="text-4xl">🎉</div>
              <p className="font-heading text-xl font-bold text-foreground">Roll complete!</p>
              <p className="text-sm text-muted-foreground">All snaps saved. The magic reveals soon!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between p-4 z-10">
        <Link to="/" aria-label="Close camera"><X className="w-6 h-6 text-background/70 hover:text-background transition-colors" /></Link>
        <div className="flex items-center gap-2">
          <Aperture className="w-4 h-4 text-primary" />
          <span className="font-heading text-sm font-semibold text-background/90 truncate max-w-[180px]">{eventName}</span>
        </div>
        <button onClick={() => setFacingMode(f => f === "user" ? "environment" : "user")} aria-label="Switch camera">
          <SwitchCamera className="w-6 h-6 text-background/70 hover:text-background transition-colors" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 w-full max-w-lg px-4 flex items-center justify-center">
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-foreground/20 border border-background/10">
          <video ref={videoRef} autoPlay playsInline muted
            className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            style={{ filter: filterCss }} />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="w-10 h-10 text-background/30 mx-auto" />
                <p className="text-sm text-background/40">Starting camera...</p>
              </div>
            </div>
          )}
          {["-top-px -left-px", "-top-px -right-px", "-bottom-px -left-px", "-bottom-px -right-px"].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8 border-background/30 ${i < 2 ? "border-t-2" : "border-b-2"} ${i % 2 === 0 ? "border-l-2" : "border-r-2"}`} />
          ))}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "var(--film-grain)" }} />
          {uploading && (
            <div className="absolute top-4 right-4 bg-background/80 rounded-full px-3 py-1 text-xs font-medium text-foreground">Saving...</div>
          )}
        </div>
      </div>

      {/* Filter strip */}
      <div className="w-full px-4 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 max-w-lg mx-auto scrollbar-none">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.id ? "bg-primary text-primary-foreground" : "bg-background/10 text-background/70 hover:bg-background/20"
              }`}>
              {f.label}
            </button>
          ))}
          <button onClick={() => setCountdownEnabled(c => !c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
              countdownEnabled ? "bg-secondary text-secondary-foreground" : "bg-background/10 text-background/70"
            }`}>
            {countdownEnabled ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />} 3s
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full p-6 pb-10 space-y-4">
        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-md mx-auto">
          {Array.from({ length: Math.min(maxSnaps, 35) }).map((_, i) => (
            <motion.div key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${i < snapsLeft ? "bg-primary" : "bg-background/20"}`}
              animate={i === snapsLeft ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <p className="text-center text-sm text-background/60 font-medium">
          {snapsLeft > 0 ? `${snapsLeft} snap${snapsLeft === 1 ? "" : "s"} remaining` : "No snaps left!"}
        </p>

        <div className="flex items-center justify-center">
          <motion.button onClick={takePhoto} disabled={snapsLeft <= 0 || uploading || countdown !== null}
            animate={shutterPress ? { scale: 0.9 } : { scale: 1 }} whileTap={{ scale: 0.9 }}
            aria-label="Take photo"
            className="relative w-20 h-20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed">
            <div className="absolute inset-0 rounded-full border-4 border-background/40" />
            <div className="absolute inset-2 rounded-full bg-gradient-warm shadow-lg" />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary-foreground z-10" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
