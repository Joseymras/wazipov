import { useEffect, useState } from "react";
import { Play, Pause, Music2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

interface Track { id: string; title: string; mood: string; url: string; duration_seconds: number; }

export default function DashboardMusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio] = useState<HTMLAudioElement>(() => new Audio());

  useEffect(() => {
    supabase.from("soundtracks").select("*").order("mood").then(({ data }) => setTracks((data || []) as Track[]));
    return () => { audio.pause(); };
  }, [audio]);

  function toggle(t: Track) {
    if (playingId === t.id) { audio.pause(); setPlayingId(null); return; }
    audio.src = t.url; audio.play().catch(() => {});
    setPlayingId(t.id);
    audio.onended = () => setPlayingId(null);
  }

  const moods = Array.from(new Set(tracks.map(t => t.mood)));

  return (
    <DashboardLayout title="Music Library">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Royalty-free music</h1>
          <p className="text-sm text-muted-foreground">Pick a soundtrack to auto-attach to your video & boomerang captures. All tracks are CC0.</p>
        </div>

        {moods.map(mood => (
          <section key={mood} className="space-y-2">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">{mood}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tracks.filter(t => t.mood === mood).map(t => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <button onClick={() => toggle(t)}
                    className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shrink-0">
                    {playingId === t.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.duration_seconds}s · CC0</p>
                  </div>
                  <Music2 className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardLayout>
  );
}
