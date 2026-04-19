import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Eye, QrCode, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "@/hooks/use-toast";

export default function DashboardEventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    const { data } = await supabase.from("events").select("*").eq("host_id", user!.id).order("created_at", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  }

  async function del(id: string) {
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast({ title: "Event deleted" });
  }

  return (
    <DashboardLayout title="Events">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Your events</h1>
            <p className="text-sm text-muted-foreground">Edit and customize anytime.</p>
          </div>
          <Button onClick={() => navigate("/events/new")} className="rounded-full"><Plus className="w-4 h-4" /> New</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading…</p> : events.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
            <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No events yet</p>
            <Button onClick={() => navigate("/events/new")} className="rounded-full"><Plus className="w-4 h-4" /> Create event</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(e => (
              <div key={e.id} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="aspect-video bg-secondary relative">
                  {e.featured_image_url ? (
                    <img src={e.featured_image_url} alt={e.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Camera className="w-8 h-8" /></div>
                  )}
                  <span className="absolute top-2 left-2 text-xs bg-foreground text-background rounded-full px-2 py-0.5 capitalize">{e.use_case}</span>
                  {e.is_public && <span className="absolute top-2 right-2 text-xs bg-accent text-accent-foreground rounded-full px-2 py-0.5">Public</span>}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-semibold truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.event_date ? new Date(e.event_date).toLocaleDateString() : "No date"}
                    {e.city && ` · ${e.city}`}
                  </p>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                    <Button variant="ghost" size="icon" asChild><Link to={`/events/${e.id}/qr`}><QrCode className="w-4 h-4" /></Link></Button>
                    <Button variant="ghost" size="icon" asChild><Link to={`/events/${e.id}/gallery`}><Eye className="w-4 h-4" /></Link></Button>
                    <Button variant="ghost" size="icon" asChild><Link to={`/events/${e.id}/edit`}><Edit className="w-4 h-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => del(e.id)} className="ml-auto"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
