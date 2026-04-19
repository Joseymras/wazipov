import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Camera, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

export default function CityPage() {
  const { citySlug } = useParams();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const cityName = decodeURIComponent(citySlug || "");

  useEffect(() => {
    if (!cityName) return;
    supabase.from("events").select("*")
      .ilike("city", cityName)
      .eq("is_public", true).eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setEvents(data || []); setLoading(false); });
  }, [cityName]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> All cities
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <header className="px-4 py-12 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 inline-flex items-center gap-1.5"><MapPin className="w-3 h-3" /> City directory</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold capitalize">{cityName}</h1>
        <p className="text-muted-foreground mt-3">Public galleries happening in {cityName}.</p>
      </header>

      <main className="px-4 pb-16 container max-w-6xl mx-auto">
        {loading ? <p className="text-muted-foreground">Loading…</p> :
          events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No public events in {cityName} yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(e => (
                <Link key={e.id} to={`/events/${e.id}/gallery`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-foreground transition-colors">
                  <div className="aspect-video bg-secondary relative overflow-hidden">
                    {e.featured_image_url ? (
                      <img src={e.featured_image_url} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Camera className="w-8 h-8" /></div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">{e.use_case}</p>
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
