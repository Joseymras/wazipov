import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Camera, Calendar, Users, Image as ImageIcon, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ events: 0, guests: 0, photos: 0, photobooks: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    if (!user) return;
    const { data: evts } = await supabase.from("events").select("*").eq("host_id", user.id).order("created_at", { ascending: false }).limit(4);
    const ids = (evts || []).map(e => e.id);
    const [g, p, b] = await Promise.all([
      ids.length ? supabase.from("event_guests").select("*", { count: "exact", head: true }).in("event_id", ids) : Promise.resolve({ count: 0 }),
      ids.length ? supabase.from("photos").select("*", { count: "exact", head: true }).in("event_id", ids) : Promise.resolve({ count: 0 }),
      supabase.from("photobooks").select("*", { count: "exact", head: true }).eq("host_id", user.id),
    ]);
    setStats({ events: evts?.length || 0, guests: (g as any).count || 0, photos: (p as any).count || 0, photobooks: (b as any).count || 0 });
    setRecent(evts || []);
  }

  return (
    <DashboardLayout title="Overview">
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""} 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Here's what's happening across your events.</p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/events/new"><Plus className="w-4 h-4" /> New event</Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Events", value: stats.events, icon: Calendar },
            { label: "Guests", value: stats.guests, icon: Users },
            { label: "Captures", value: stats.photos, icon: ImageIcon },
            { label: "Photobooks", value: stats.photobooks, icon: BookOpen },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
              <p className="font-heading text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent events</h2>
            <Link to="/dashboard/events" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
              <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No events yet.</p>
              <Button asChild variant="outline" className="rounded-full"><Link to="/events/new">Create your first event</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recent.map(e => (
                <Link key={e.id} to={`/events/${e.id}/edit`}
                  className="group border border-border rounded-2xl overflow-hidden bg-card hover:border-foreground transition-colors">
                  <div className="aspect-video bg-secondary relative overflow-hidden">
                    {e.featured_image_url ? (
                      <img src={e.featured_image_url} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.event_date ? new Date(e.event_date).toLocaleDateString() : "No date"} · {e.use_case}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
