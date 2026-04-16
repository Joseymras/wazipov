import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Aperture, SwitchCamera } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

  useEffect(() => {
    loadEvent();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [eventId]);

  useEffect(() => {
    startCamera();
  }, [facingMode]);

  async function loadEvent() {
    if (!eventId || eventId === "demo") {
      setEventName("Demo Camera");
      setSnapsLeft(10);
      setMaxSnaps(10);
      return;
    }

    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (event) {
      setEventName(event.name);
      setMaxSnaps(event.snaps_per_guest);

      // Create or get guest session
      let guestIdent = localStorage.getItem(`pov_guest_${eventId}`);
      if (!guestIdent) {
        guestIdent = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        localStorage.setItem(`pov_guest_${eventId}`, guestIdent);
      }

      const { data: existing } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .eq("guest_identifier", guestIdent)
        .maybeSingle();

      if (existing) {
        setGuestId(existing.id);
        setSnapsLeft(existing.snaps_remaining);
      } else {
        const { data: newGuest } = await supabase
          .from("event_guests")
          .insert({ event_id: eventId, guest_identifier: guestIdent, snaps_remaining: event.snaps_per_guest })
          .select()
          .single();
        if (newGuest) {
          setGuestId(newGuest.id);
          setSnapsLeft(newGuest.snaps_remaining);
        }
      }
    }
  }

  async function startCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch {
      toast({ title: "Camera access denied", description: "Please allow camera access to take photos.", variant: "destructive" });
    }
  }

  const takePhoto = useCallback(async () => {
    if (snapsLeft <= 0 || !videoRef.current || !canvasRef.current || uploading) return;

    setShutterPress(true);
    setShowFlash(true);
    setTimeout(() => setShutterPress(false), 300);
    setTimeout(() => setShowFlash(false), 600);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const newSnaps = snapsLeft - 1;
    setSnapsLeft(newSnaps);

    if (newSnaps === 0) {
      setTimeout(() => setShowConfetti(true), 700);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Upload photo
    if (eventId && eventId !== "demo" && guestId) {
      setUploading(true);
      try {
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), "image/jpeg", 0.85));
        const fileName = `${eventId}/${guestId}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("event-photos")
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (!uploadError) {
          await supabase.from("photos").insert({
            event_id: eventId,
            guest_id: guestId,
            storage_path: fileName,
          });

          await supabase.from("event_guests").update({ snaps_remaining: newSnaps }).eq("id", guestId);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
      setUploading(false);
    }
  }, [snapsLeft, eventId, guestId, uploading]);

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
        {showConfetti && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card rounded-3xl p-8 text-center space-y-3">
              <div className="text-4xl">🎉</div>
              <p className="font-heading text-xl font-bold text-primary-foreground">Roll complete!</p>
              <p className="text-sm text-primary-foreground/70">All snaps saved. The magic reveals soon!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between p-4 z-10">
        <Link to="/">
          <X className="w-6 h-6 text-background/70 hover:text-background transition-colors" />
        </Link>
        <div className="flex items-center gap-2">
          <Aperture className="w-4 h-4 text-primary" />
          <span className="font-heading text-sm font-semibold text-background/90">{eventName}</span>
        </div>
        <button onClick={() => setFacingMode(f => f === "user" ? "environment" : "user")}>
          <SwitchCamera className="w-6 h-6 text-background/70 hover:text-background transition-colors" />
        </button>
      </div>

      {/* Viewfinder with real camera */}
      <div className="flex-1 w-full max-w-lg px-4 flex items-center justify-center">
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-foreground/20 border border-background/10">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="w-10 h-10 text-background/30 mx-auto" />
                <p className="text-sm text-background/40">Starting camera...</p>
              </div>
            </div>
          )}
          {/* Corners */}
          {["-top-px -left-px", "-top-px -right-px", "-bottom-px -left-px", "-bottom-px -right-px"].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8 border-background/30 ${i < 2 ? "border-t-2" : "border-b-2"} ${i % 2 === 0 ? "border-l-2" : "border-r-2"}`} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full border border-background/20" />
          </div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "var(--film-grain)" }} />
          {uploading && (
            <div className="absolute top-4 right-4 bg-background/80 rounded-full px-3 py-1 text-xs font-medium text-foreground">
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full p-6 pb-10 space-y-4">
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: maxSnaps }).map((_, i) => (
            <motion.div key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${i < snapsLeft ? "bg-primary" : "bg-background/20"}`}
              animate={i === snapsLeft ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <p className="text-center text-sm text-background/50 font-medium">
          {snapsLeft > 0 ? `${snapsLeft} snaps remaining` : "No snaps left!"}
        </p>

        <div className="flex items-center justify-center">
          <motion.button onClick={takePhoto} disabled={snapsLeft <= 0 || uploading}
            animate={shutterPress ? { scale: 0.9 } : { scale: 1 }} whileTap={{ scale: 0.9 }}
            className="relative w-20 h-20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed">
            <div className="absolute inset-0 rounded-full border-4 border-background/40" />
            <div className="absolute inset-2 rounded-full bg-gradient-warm shadow-lg" />
            <Camera className="absolute inset-0 m-auto w-6 h-6 text-primary-foreground z-10" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
