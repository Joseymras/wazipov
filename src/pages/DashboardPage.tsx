import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Plus, CalendarDays, Users, Image, Trash2, Edit, Eye, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface Event {
  id: string;
  name: string;
  event_date: string | null;
  snaps_per_guest: number;
  is_active: boolean;
  theme_color: string | null;
  short_link: string | null;
  reveal_timing: string;
  gallery_type: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ events: 0, guests: 0, photos: 0 });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    const { data: evts } = await supabase
      .from("events")
      .select("*")
      .eq("host_id", user!.id)
      .order("created_at", { ascending: false });

    if (evts) {
      setEvents(evts);
      setStats(s => ({ ...s, events: evts.length }));

      const eventIds = evts.map(e => e.id);
      if (eventIds.length > 0) {
        const { count: guestCount } = await supabase
          .from("event_guests")
          .select("*", { count: "exact", head: true })
          .in("event_id", eventIds);

        const { count: photoCount } = await supabase
          .from("photos")
          .select("*", { count: "exact", head: true })
          .in("event_id", eventIds);

        setStats({ events: evts.length, guests: guestCount || 0, photos: photoCount || 0 });
      }
    }
    setLoading(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    await supabase.from("events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast({ title: "Event deleted" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <motion.div initial="hidden" animate="visible" className="flex items-center justify-between mb-8">
            <motion.div variants={fadeUp} custom={0}>
              <h1 className="font-heading text-3xl font-bold text-foreground">Your Events</h1>
              <p className="text-muted-foreground mt-1">Manage your POV moments</p>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <Button variant="hero" size="lg" onClick={() => navigate("/events/new")}>
                <Plus className="w-5 h-5" /> New Event
              </Button>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Events", value: stats.events.toString(), icon: CalendarDays },
              { label: "Total Guests", value: stats.guests.toLocaleString(), icon: Users },
              { label: "Photos Captured", value: stats.photos.toLocaleString(), icon: Image },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i + 2} className="glass-card rounded-2xl p-5 text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-lg text-muted-foreground">No events yet</p>
              <Button variant="hero" onClick={() => navigate("/events/new")}>
                <Plus className="w-5 h-5" /> Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, i) => (
                <motion.div key={event.id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 5}
                  className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4 p-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(135deg, ${event.theme_color || '#e85d3a'}, hsl(340 65% 55%))` }}>
                      <Camera className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-foreground truncate">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString() : "No date set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/events/${event.id}/qr`}><QrCode className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/events/${event.id}/gallery`}><Eye className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/events/${event.id}/edit`}><Edit className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteEvent(event.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
