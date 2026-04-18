import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Entry {
  id: string; guest_name: string | null; storage_path: string;
  duration_seconds: number; created_at: string; url: string;
}

export default function AudioGuestbook({ eventId, isHost }: { eventId: string; isHost: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { load(); }, [eventId]);
  useEffect(() => {
    if (!recording) return;
    const start = Date.now();
    const id = setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(id);
  }, [recording]);

  async function load() {
    const { data } = await supabase.from("audio_guestbook").select("*")
      .eq("event_id", eventId).order("created_at", { ascending: false });
    if (data) {
      setEntries(data.map(e => ({
        ...e,
        url: supabase.storage.from("event-audio").getPublicUrl(e.storage_path).data.publicUrl,
      })));
    }
    setLoading(false);
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        await upload(blob, secs);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true); setSecs(0);
      // Auto-stop at 60s
      setTimeout(() => { if (recorderRef.current?.state === "recording") stopRec(); }, 60_000);
    } catch {
      toast({ title: "Mic access denied", variant: "destructive" });
    }
  }

  function stopRec() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function upload(blob: Blob, duration: number) {
    setUploading(true);
    const path = `${eventId}/${Date.now()}.webm`;
    const { error } = await supabase.storage.from("event-audio").upload(path, blob, { contentType: "audio/webm" });
    if (!error) {
      await supabase.from("audio_guestbook").insert({
        event_id: eventId, guest_name: name || null,
        storage_path: path, duration_seconds: duration,
      });
      toast({ title: "Voicemail saved 💌" });
      setName(""); setSecs(0);
      await load();
    } else {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  }

  function togglePlay(e: Entry) {
    if (playing === e.id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      audioRef.current?.pause();
      const a = new Audio(e.url);
      audioRef.current = a;
      a.onended = () => setPlaying(null);
      a.play();
      setPlaying(e.id);
    }
  }

  async function del(e: Entry) {
    if (!confirm("Delete this voicemail?")) return;
    await supabase.from("audio_guestbook").delete().eq("id", e.id);
    await supabase.storage.from("event-audio").remove([e.storage_path]);
    setEntries(prev => prev.filter(x => x.id !== e.id));
  }

  return (
    <div className="glass-card rounded-3xl p-5 space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground">🎙 Audio Guestbook</h3>
        <p className="text-xs text-muted-foreground">Leave a voicemail. Plays back alongside the album.</p>
      </div>

      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
          className="flex-1 bg-background/50 rounded-full px-4 py-2 text-sm border border-border/50 focus:outline-none focus:border-primary" />
        {recording ? (
          <button onClick={stopRec}
            className="bg-destructive text-destructive-foreground rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2 animate-pulse">
            <Square className="w-3 h-3" /> {secs}s
          </button>
        ) : (
          <button onClick={startRec} disabled={uploading}
            className="bg-gradient-warm text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2">
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
            Record
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No voicemails yet — be the first 💖</p>
        ) : entries.map(e => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/30">
            <button onClick={() => togglePlay(e)}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              {playing === e.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{e.guest_name || "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">{e.duration_seconds || 0}s · {new Date(e.created_at).toLocaleString()}</p>
            </div>
            {isHost && (
              <button onClick={() => del(e)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
