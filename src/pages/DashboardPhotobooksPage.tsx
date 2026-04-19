import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "@/hooks/use-toast";

export default function DashboardPhotobooksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    const [b, e] = await Promise.all([
      supabase.from("photobooks").select("*").eq("host_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("events").select("id,name").eq("host_id", user!.id),
    ]);
    setBooks(b.data || []); setEvents(e.data || []);
  }

  async function createBook() {
    if (!events.length) { toast({ title: "Create an event first", variant: "destructive" }); return; }
    setCreating(true);
    const { data, error } = await supabase.from("photobooks").insert({
      host_id: user!.id, event_id: events[0].id, title: "Untitled book", template: "classic", page_size: "a4", spreads: [],
    }).select().single();
    setCreating(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    navigate(`/photobooks/${data.id}`);
  }

  async function del(id: string) {
    if (!confirm("Delete this photobook?")) return;
    await supabase.from("photobooks").delete().eq("id", id);
    setBooks(prev => prev.filter(b => b.id !== id));
  }

  return (
    <DashboardLayout title="Photobooks">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Photobooks</h1>
            <p className="text-sm text-muted-foreground">Custom layouts. A4, square, landscape. Drag to rearrange.</p>
          </div>
          <Button onClick={createBook} disabled={creating} className="rounded-full"><Plus className="w-4 h-4" /> New book</Button>
        </div>
        {books.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No photobooks yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(b => (
              <div key={b.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <Link to={`/photobooks/${b.id}`} className="block aspect-[3/4] bg-secondary flex items-center justify-center">
                  {b.cover_url ? <img src={b.cover_url} className="w-full h-full object-cover" alt={b.title} /> : <BookOpen className="w-10 h-10 text-muted-foreground" />}
                </Link>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm truncate">{b.title}</p>
                    <p className="text-xs text-muted-foreground uppercase">{b.page_size} · {b.template}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
