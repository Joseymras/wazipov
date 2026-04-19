import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Camera, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

export default function DiscoverPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("events").select("*")
      .eq("is_public", true).eq("is_active", true)
      .order("created_at", { ascending: false }).limit(60)
      .then(({ data }) => { setEvents(data || []); setLoading(false); });
  }, []);

  const filtered = events.filter(e =>
    !q || e.name?.toLowerCase().includes(q.toLowerCase()) || e.city?.toLowerCase().includes(q.toLowerCase())
  );
  const cities = Array.from(new Set(events.map(e => e.city).filter(Boolean))).slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-background" />
            </div>
            <span className="font-heading font-bold">POV Moments</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <header className="px-4 py-12 text-center max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl font-bold">Discover events</h1>
        <p className="text-muted-foreground mt-3">Browse public galleries from around the world. Join, view, download.</p>
        <div className="relative mt-6 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search events or cities…" className="pl-10 h-12 rounded-full" />
        </div>
      </header>

      {cities.length > 0 && (
        <section className="px-4 mb-8">
          <div className="container max-w-6xl mx-auto">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cities</h2>
            <div className="flex flex-wrap gap-2">
              {cities.map(c => (
                <Link key={c} to={`/city/${encodeURIComponent(c.toLowerCase())}`}
                  className="text-sm px-4 py-2 rounded-full border border-border bg-card hover:border-foreground transition-colors inline-flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> {c}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="px-4 pb-16 container max-w-6xl mx-auto">
        {loading ? <p className="text-muted-foreground">Loading…</p> :
          filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No public events yet. Be the first!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(e => (
                <Link key={e.id} to={`/events/${e.id}/gallery`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-foreground transition-colors">
                  <div className="aspect-video bg-secondary relative overflow-hidden">
                    {e.featured_image_url ? (
                      <img src={e.featured_image_url} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Camera className="w-8 h-8" /></div>
                    )}
                    <span className="absolute bottom-2 left-2 text-xs bg-foreground/80 text-background rounded-full px-2 py-0.5 capitalize">{e.use_case}</span>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-2 mt-1">
                      {e.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{e.city}</span>}
                      {e.event_date && <span>{new Date(e.event_date).toLocaleDateString()}</span>}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )
        }
      </main>
    </div>
  );
}
