import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Aperture, SwitchCamera, Sparkles, Zap, ZapOff, Video, Square, Smile, Image as ImageIcon, Loader2, Wand2, Music } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTrial } from "@/hooks/useTrial";
import UpgradeModal from "@/components/UpgradeModal";
import { encodeGIF } from "@/lib/gif";
import { getSegmenter, compositeWithBackground } from "@/lib/segmenter";
import { buildMixedStream } from "@/lib/audioMix";

type Filter = "disposable" | "bw" | "sepia" | "vintage" | "glam" | "none";
type Mode = "photo" | "video" | "boomerang" | "gif";

const FILTERS: { id: Filter; label: string; css: string }[] = [
  { id: "disposable", label: "Disposable", css: "saturate(1.3) contrast(1.1) sepia(0.15) brightness(1.05)" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.15)" },
  { id: "sepia", label: "Sepia", css: "sepia(0.85) saturate(1.4) contrast(1.05)" },
  { id: "vintage", label: "Vintage", css: "saturate(0.85) contrast(0.95) sepia(0.3) hue-rotate(-10deg)" },
  { id: "glam", label: "Glam", css: "saturate(1.15) contrast(1.05) brightness(1.08) blur(0.3px)" },
  { id: "none", label: "None", css: "none" },
];

const EMOJI_LIB = ["✨", "🎉", "❤️", "🔥", "😎", "🥳", "💖", "🌟", "🎂", "💍", "🎊", "🌹", "🦋", "💫", "🍾", "🎵"];

const BACKDROPS: { id: string; label: string; src: string | null }[] = [
  { id: "off", label: "Off", src: null },
  { id: "beach", label: "Beach", src: "https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&w=800" },
  { id: "stage", label: "Stage", src: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&w=800" },
  { id: "neon", label: "Neon", src: "https://images.pexels.com/photos/2447042/pexels-photo-2447042.jpeg?auto=compress&w=800" },
  { id: "city", label: "City", src: "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&w=800" },
  { id: "studio", label: "Studio", src: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&w=800" },
];

interface Sticker { id: string; emoji: string; x: number; y: number; size: number; }

// Play a soft shutter sound via WebAudio (no external file needed)
function playShutter() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.13);
    setTimeout(() => ctx.close(), 200);
  } catch { /* silent */ }
}

export default function CameraPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trial = useTrial();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const [mode, setMode] = useState<Mode>("photo");
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null);
  const [backdropId, setBackdropId] = useState("off");
  const [showBackdrops, setShowBackdrops] = useState(false);
  const [soundtracks, setSoundtracks] = useState<{ id: string; title: string; mood: string; url: string }[]>([]);
  const [soundtrackId, setSoundtrackId] = useState<string | null>(null);
  const [showMusic, setShowMusic] = useState(false);
  const [allowMusic, setAllowMusic] = useState(true);
  const [allowGreenscreen, setAllowGreenscreen] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showDevices, setShowDevices] = useState(false);
  const backdropImgRef = useRef<HTMLImageElement | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);

  // Restrict advanced modes for expired-trial guests who are owners
  const advancedLocked = user && trial.isExpired;

  useEffect(() => {
    loadEvent();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => { startCamera(); }, [facingMode, mode, deviceId]);

  // Recording timer
  useEffect(() => {
    if (!recording) return;
    const start = Date.now();
    const id = setInterval(() => setRecordTime(Math.floor((Date.now() - start) / 1000)), 200);
    return () => clearInterval(id);
  }, [recording]);

  // Load soundtracks library once
  useEffect(() => {
    supabase.from("soundtracks").select("id,title,mood,url").then(({ data }) => {
      if (data) setSoundtracks(data);
    });
  }, []);

  // Preload backdrop image
  useEffect(() => {
    const b = BACKDROPS.find(x => x.id === backdropId);
    if (!b?.src) { backdropImgRef.current = null; return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = b.src;
    img.onload = () => { backdropImgRef.current = img; };
  }, [backdropId]);

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
    setAllowMusic(event.allow_music ?? true);
    setAllowGreenscreen(event.allow_greenscreen ?? true);
    if (event.soundtrack_id) setSoundtrackId(event.soundtrack_id);
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
      const needsAudio = mode === "video";
      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } };
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: needsAudio });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraReady(true); }
      // Enumerate devices once permission is granted
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter(d => d.kind === "videoinput"));
      } catch { /* ignore */ }
    } catch {
      toast({ title: "Camera access denied", description: "Please allow camera access.", variant: "destructive" });
    }
  }

  async function drawFrame(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, withStickers = true) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const filterCss = FILTERS.find(f => f.id === filter)?.css || "none";
    const useBackdrop = backdropId !== "off" && backdropImgRef.current && allowGreenscreen;

    if (useBackdrop) {
      // Run segmentation on a downscaled copy for performance
      const seg = await getSegmenter();
      let mask: Uint8Array | null = null;
      if (seg) {
        try {
          const result = seg.segmentForVideo(video, performance.now());
          const cat = result.categoryMask;
          const arr = cat.getAsUint8Array();
          // The segmenter's mask resolution may differ; resample by drawing
          const maskCanvas = document.createElement("canvas");
          maskCanvas.width = cat.width; maskCanvas.height = cat.height;
          const mctx = maskCanvas.getContext("2d")!;
          const id = mctx.createImageData(cat.width, cat.height);
          for (let i = 0, p = 0; i < arr.length; i++, p += 4) {
            const v = arr[i] !== 0 ? 255 : 0;
            id.data[p] = v; id.data[p + 1] = v; id.data[p + 2] = v; id.data[p + 3] = 255;
          }
          mctx.putImageData(id, 0, 0);
          // Resample to target resolution
          const big = document.createElement("canvas");
          big.width = w; big.height = h;
          const bctx = big.getContext("2d")!;
          bctx.drawImage(maskCanvas, 0, 0, w, h);
          const data = bctx.getImageData(0, 0, w, h).data;
          mask = new Uint8Array(w * h);
          for (let i = 0, p = 0; i < mask.length; i++, p += 4) mask[i] = data[p] > 127 ? 255 : 0;
          cat.close?.();
        } catch (e) { console.warn("seg err", e); }
      }
      ctx.filter = filterCss;
      compositeWithBackground(ctx, video, mask, w, h, backdropImgRef.current!, facingMode === "user");
      ctx.filter = "none";
    } else {
      ctx.filter = filterCss;
      if (facingMode === "user") { ctx.translate(w, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, w, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
    }

    if (withStickers) {
      stickers.forEach(s => {
        ctx.font = `${s.size}px serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(s.emoji, (s.x / 100) * w, (s.y / 100) * h);
      });
    }
  }

  async function uploadBlob(blob: Blob, ext: string, mediaType: string) {
    if (!eventId || eventId === "demo" || !guestId) return;
    setUploading(true);
    try {
      const fileName = `${eventId}/${guestId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("event-photos").upload(fileName, blob, { contentType: blob.type });
      if (!error) {
        await supabase.from("photos").insert({ event_id: eventId, guest_id: guestId, storage_path: fileName, media_type: mediaType });
        const newSnaps = Math.max(0, snapsLeft - 1);
        await supabase.from("event_guests").update({ snaps_remaining: newSnaps }).eq("id", guestId);
        setSnapsLeft(newSnaps);
        if (newSnaps === 0) {
          setTimeout(() => setShowConfetti(true), 500);
          setTimeout(() => setShowConfetti(false), 3500);
        }
      }
    } catch (err) { console.error("Upload failed:", err); }
    setUploading(false);
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    setShutterPress(true); setShowFlash(true);
    playShutter();
    setTimeout(() => setShutterPress(false), 300);
    setTimeout(() => setShowFlash(false), 600);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    await drawFrame(ctx, video);
    const blob = await new Promise<Blob>((r) => canvas.toBlob(b => r(b!), "image/jpeg", 0.88));
    setLastCaptureUrl(URL.createObjectURL(blob));
    setTimeout(() => setLastCaptureUrl(null), 2000);
    await uploadBlob(blob, "jpg", "photo");
  }

  async function captureGIF() {
    if (!videoRef.current || !canvasRef.current) return;
    if (advancedLocked) { setShowUpgrade(true); return; }
    setShutterPress(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const W = 320, H = Math.round(320 * (video.videoHeight / video.videoWidth));
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const frames: ImageData[] = [];
    toast({ title: "Capturing GIF...", description: "Hold still for 1 second" });
    for (let i = 0; i < 6; i++) {
      playShutter();
      await drawFrame(ctx, video);
      frames.push(ctx.getImageData(0, 0, W, H));
      await new Promise(r => setTimeout(r, 180));
    }
    setShutterPress(false);
    const blob = encodeGIF(frames, 150);
    setLastCaptureUrl(URL.createObjectURL(blob));
    setTimeout(() => setLastCaptureUrl(null), 2500);
    await uploadBlob(blob, "gif", "gif");
  }

  async function captureBoomerang() {
    if (!videoRef.current || !canvasRef.current) return;
    if (advancedLocked) { setShowUpgrade(true); return; }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const W = 360, H = Math.round(360 * (video.videoHeight / video.videoWidth));
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const frames: ImageData[] = [];
    toast({ title: "Recording boomerang..." });
    for (let i = 0; i < 12; i++) {
      await drawFrame(ctx, video);
      frames.push(ctx.getImageData(0, 0, W, H));
      await new Promise(r => setTimeout(r, 70));
    }
    // Forward + reverse
    const allFrames = [...frames, ...frames.slice().reverse()];
    const blob = encodeGIF(allFrames, 70);
    setLastCaptureUrl(URL.createObjectURL(blob));
    setTimeout(() => setLastCaptureUrl(null), 2500);
    await uploadBlob(blob, "gif", "boomerang");
  }

  async function startVideoRecording() {
    if (!streamRef.current) return;
    if (advancedLocked) { setShowUpgrade(true); return; }
    recordedChunks.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus" : "video/webm";

    // Mix in soundtrack if selected
    const track = soundtracks.find(s => s.id === soundtrackId);
    let recordStream: MediaStream = streamRef.current;
    if (track && allowMusic) {
      try {
        const mixed = await buildMixedStream(streamRef.current, track.url, true);
        recordStream = mixed.stream;
        audioCleanupRef.current = mixed.cleanup;
      } catch (e) { console.warn("Mix failed", e); }
    }

    const recorder = new MediaRecorder(recordStream, { mimeType: mime });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(recordedChunks.current, { type: mime });
      setLastCaptureUrl(URL.createObjectURL(blob));
      setTimeout(() => setLastCaptureUrl(null), 2500);
      audioCleanupRef.current?.();
      audioCleanupRef.current = null;
      await uploadBlob(blob, "webm", "video");
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true); setRecordTime(0);

    // Auto-stop after 30s
    setTimeout(() => {
      if (recorderRef.current?.state === "recording") stopVideoRecording();
    }, 30_000);
  }

  function stopVideoRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  const handleShutter = useCallback(async () => {
    if (snapsLeft <= 0 || !cameraReady || uploading || countdown !== null) return;
    if (countdownEnabled && mode !== "video") {
      for (let n = 3; n > 0; n--) { setCountdown(n); await new Promise(r => setTimeout(r, 800)); }
      setCountdown(null);
    }
    if (mode === "photo") await capturePhoto();
    else if (mode === "gif") await captureGIF();
    else if (mode === "boomerang") await captureBoomerang();
    else if (mode === "video") {
      if (recording) stopVideoRecording(); else startVideoRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapsLeft, cameraReady, uploading, countdown, countdownEnabled, filter, facingMode, mode, recording, stickers, advancedLocked]);

  function addSticker(emoji: string) {
    setStickers(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      emoji, x: 50, y: 50,
      size: 80,
    }]);
    setShowEmojis(false);
  }

  function moveSticker(id: string, e: React.PointerEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const onMove = (ev: PointerEvent) => {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      setStickers(prev => prev.map(s => s.id === id ? { ...s, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : s));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const filterCss = FILTERS.find(f => f.id === filter)?.css || "none";

  return (
    <div className="fixed inset-0 bg-foreground/95 flex flex-col items-center justify-between select-none overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature="video, GIF & boomerang modes" />

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
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card rounded-3xl p-8 text-center space-y-3 pointer-events-auto max-w-sm">
              <div className="text-4xl">🎉</div>
              <p className="font-heading text-xl font-bold text-foreground">Roll complete!</p>
              <p className="text-sm text-muted-foreground">Sign in to claim your captures and view the album when revealed.</p>
              <button onClick={() => navigate(`/login?next=/events/${eventId}/gallery&claim=${eventId}`)}
                className="bg-gradient-warm text-primary-foreground rounded-full px-6 py-2.5 font-semibold text-sm">
                View My Captures →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last capture preview thumbnail */}
      <AnimatePresence>
        {lastCaptureUrl && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            className="absolute bottom-32 right-4 z-40 w-16 h-16 rounded-xl overflow-hidden border-2 border-background/80 shadow-lg pointer-events-none">
            <img src={lastCaptureUrl} alt="" className="w-full h-full object-cover" />
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
        <div className="flex items-center gap-3">
          {devices.length > 1 && (
            <button onClick={() => setShowDevices(s => !s)} aria-label="Pick camera"
              className="text-xs text-background/70 hover:text-background underline underline-offset-2">
              {devices.length} cams
            </button>
          )}
          <button onClick={() => { setDeviceId(null); setFacingMode(f => f === "user" ? "environment" : "user"); }} aria-label="Switch camera">
            <SwitchCamera className="w-6 h-6 text-background/70 hover:text-background transition-colors" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showDevices && (
          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
            className="absolute top-16 right-4 z-30 bg-background rounded-xl shadow-xl p-2 max-w-xs">
            {devices.map((d, i) => (
              <button key={d.deviceId} onClick={() => { setDeviceId(d.deviceId); setShowDevices(false); }}
                className={`block w-full text-left text-xs px-3 py-2 rounded ${deviceId === d.deviceId ? "bg-secondary" : "hover:bg-muted"}`}>
                {d.label || `Camera ${i + 1}`}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      {recording && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-destructive text-destructive-foreground rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-background" /> REC {recordTime}s
        </div>
      )}

      {/* Viewfinder */}
      <div className="flex-1 w-full max-w-lg px-4 flex items-center justify-center">
        <div ref={containerRef} className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-foreground/20 border border-background/10">
          {/* Background plate when green-screen active */}
          {backdropId !== "off" && allowGreenscreen && (
            <img src={BACKDROPS.find(b => b.id === backdropId)?.src || ""} alt=""
              className="absolute inset-0 w-full h-full object-cover" />
          )}
          <video ref={videoRef} autoPlay playsInline muted
            className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""} ${backdropId !== "off" && allowGreenscreen ? "mix-blend-screen opacity-90" : ""}`}
            style={{ filter: filterCss }} />

          {/* Sticker overlays */}
          {stickers.map(s => (
            <div key={s.id}
              onPointerDown={(e) => moveSticker(s.id, e)}
              onDoubleClick={() => setStickers(prev => prev.filter(x => x.id !== s.id))}
              style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, transform: "translate(-50%, -50%)", touchAction: "none", cursor: "move" }}
              className="select-none drop-shadow-lg">
              {s.emoji}
            </div>
          ))}

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
          {uploading && (
            <div className="absolute top-4 right-4 bg-background/80 rounded-full px-3 py-1 text-xs font-medium text-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </div>
          )}
        </div>
      </div>

      {/* Mode + Filter strip */}
      <div className="w-full px-4 z-10 space-y-2">
        {/* Modes */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-lg mx-auto scrollbar-none justify-center">
          {([
            { id: "photo", label: "Photo", icon: Camera, locked: false },
            { id: "video", label: "Video", icon: Video, locked: !!advancedLocked },
            { id: "boomerang", label: "Boomerang", icon: Sparkles, locked: !!advancedLocked },
            { id: "gif", label: "GIF", icon: ImageIcon, locked: !!advancedLocked },
          ] as const).map(m => (
            <button key={m.id} onClick={() => {
              if (m.locked) { setShowUpgrade(true); return; }
              setMode(m.id as Mode);
            }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                mode === m.id ? "bg-primary text-primary-foreground" : "bg-background/10 text-background/70 hover:bg-background/20"
              }`}>
              <m.icon className="w-3 h-3" /> {m.label}{m.locked && " 🔒"}
            </button>
          ))}
        </div>

        {/* Filters */}
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
          <button onClick={() => setShowEmojis(s => !s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
              showEmojis ? "bg-secondary text-secondary-foreground" : "bg-background/10 text-background/70"
            }`}>
            <Smile className="w-3 h-3" /> Emoji
          </button>
          {allowGreenscreen && (
            <button onClick={() => setShowBackdrops(s => !s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                showBackdrops || backdropId !== "off" ? "bg-secondary text-secondary-foreground" : "bg-background/10 text-background/70"
              }`}>
              <Wand2 className="w-3 h-3" /> Backdrop
            </button>
          )}
          {allowMusic && (mode === "video" || mode === "boomerang") && soundtracks.length > 0 && (
            <button onClick={() => setShowMusic(s => !s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                showMusic || soundtrackId ? "bg-secondary text-secondary-foreground" : "bg-background/10 text-background/70"
              }`}>
              <Music className="w-3 h-3" /> {soundtrackId ? "♪ On" : "Music"}
            </button>
          )}
        </div>

        {/* Backdrop picker */}
        <AnimatePresence>
          {showBackdrops && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="max-w-lg mx-auto bg-background/95 backdrop-blur rounded-2xl p-3 flex gap-2 overflow-x-auto">
              {BACKDROPS.map(b => (
                <button key={b.id} onClick={() => { setBackdropId(b.id); setShowBackdrops(false); }}
                  className={`shrink-0 rounded-xl overflow-hidden border-2 ${backdropId === b.id ? "border-primary" : "border-transparent"}`}>
                  {b.src ? (
                    <img src={b.src} alt={b.label} className="w-16 h-16 object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-muted flex items-center justify-center text-xs">Off</div>
                  )}
                  <p className="text-[10px] text-center py-0.5">{b.label}</p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Music picker */}
        <AnimatePresence>
          {showMusic && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="max-w-lg mx-auto bg-background/95 backdrop-blur rounded-2xl p-3 max-h-48 overflow-y-auto">
              <button onClick={() => { setSoundtrackId(null); setShowMusic(false); }}
                className={`w-full text-left p-2 rounded-lg text-xs ${!soundtrackId ? "bg-secondary" : ""}`}>
                ✕ No music
              </button>
              {soundtracks.map(s => (
                <button key={s.id} onClick={() => { setSoundtrackId(s.id); setShowMusic(false); }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex justify-between ${soundtrackId === s.id ? "bg-secondary" : ""}`}>
                  <span>♪ {s.title}</span>
                  <span className="text-muted-foreground">{s.mood}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji picker */}
        <AnimatePresence>
          {showEmojis && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="max-w-lg mx-auto bg-background/95 backdrop-blur rounded-2xl p-3 grid grid-cols-8 gap-1">
              {EMOJI_LIB.map(e => (
                <button key={e} onClick={() => addSticker(e)}
                  className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
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

        <div className="flex items-center justify-center gap-6">
          <Link to={eventId && eventId !== "demo" ? `/events/${eventId}/gallery` : "/"}
            className="text-xs text-background/60 hover:text-background underline underline-offset-2">
            View album
          </Link>
          <motion.button onClick={handleShutter} disabled={snapsLeft <= 0 || uploading || countdown !== null}
            animate={shutterPress ? { scale: 0.9 } : { scale: 1 }} whileTap={{ scale: 0.9 }}
            aria-label="Take photo"
            className="relative w-20 h-20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed">
            <div className={`absolute inset-0 rounded-full border-4 ${recording ? "border-destructive" : "border-background/40"}`} />
            <div className={`absolute inset-2 rounded-full shadow-lg ${recording ? "bg-destructive" : "bg-gradient-warm"}`} />
            {mode === "video" && recording ? (
              <Square className="absolute inset-0 m-auto w-6 h-6 text-background z-10" />
            ) : (
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary-foreground z-10" />
            )}
          </motion.button>
          <button onClick={() => setStickers([])}
            className="text-xs text-background/60 hover:text-background underline underline-offset-2">
            Clear stickers
          </button>
        </div>
      </div>
    </div>
  );
}
