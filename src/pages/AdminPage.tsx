import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Image, CalendarDays, TrendingUp, Camera, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";

export default function AdminPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalEvents: 0, totalGuests: 0, totalPhotos: 0, totalUsers: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { count: eventCount } = await supabase.from("events").select("*", { count: "exact", head: true });
    const { count: guestCount } = await supabase.from("event_guests").select("*", { count: "exact", head: true });
    const { count: photoCount } = await supabase.from("photos").select("*", { count: "exact", head: true });
    const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

    setStats({
      totalEvents: eventCount || 0,
      totalGuests: guestCount || 0,
      totalPhotos: photoCount || 0,
      totalUsers: userCount || 0,
    });

    const { data: events } = await supabase.from("events").select("*").order("created_at", { ascending: false }).limit(10);
    if (events) setRecentEvents(events);
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Events", value: stats.totalEvents, icon: CalendarDays, color: "text-secondary" },
    { label: "Total Guests", value: stats.totalGuests, icon: TrendingUp, color: "text-accent" },
    { label: "Total Photos", value: stats.totalPhotos, icon: Image, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Platform overview and management</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-5 text-center">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <p className="font-heading text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Recent Events</h2>
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No events yet</p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${event.theme_color || '#e85d3a'}, hsl(340 65% 55%))` }}>
                        <Camera className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.event_date ? new Date(event.event_date).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.is_active ? (
                        <span className="text-primary font-medium">Active</span>
                      ) : (
                        <span>Inactive</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
