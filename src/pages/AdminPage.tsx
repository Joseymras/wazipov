import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Image, CalendarDays, TrendingUp, Camera, Shield, Sparkles, Settings, Loader2, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";

interface AdsenseConf { enabled: boolean; client_id: string; slot_id: string; }

export default function AdminPage() {
  const [stats, setStats] = useState({ totalEvents: 0, totalGuests: 0, totalPhotos: 0, totalUsers: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [adsense, setAdsense] = useState<AdsenseConf>({ enabled: false, client_id: "", slot_id: "" });
  const [savingAds, setSavingAds] = useState(false);

  // Marketing AI
  const [topic, setTopic] = useState("Wedding album reveal day");
  const [audience, setAudience] = useState("brides-to-be on Instagram");
  const [tone, setTone] = useState("fun");
  const [genLoading, setGenLoading] = useState(false);
  const [generated, setGenerated] = useState<string[]>([]);

  useEffect(() => { loadStats(); loadAds(); }, []);

  async function loadStats() {
    const [{ count: e }, { count: g }, { count: p }, { count: u }] = await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("event_guests").select("*", { count: "exact", head: true }),
      supabase.from("photos").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    setStats({ totalEvents: e || 0, totalGuests: g || 0, totalPhotos: p || 0, totalUsers: u || 0 });
    const { data: events } = await supabase.from("events").select("*").order("created_at", { ascending: false }).limit(10);
    if (events) setRecentEvents(events);
  }

  async function loadAds() {
    const { data } = await supabase.from("platform_settings").select("value").eq("key", "adsense").maybeSingle();
    if (data?.value) setAdsense(data.value as AdsenseConf);
  }

  async function saveAds() {
    setSavingAds(true);
    const { error } = await supabase.from("platform_settings").upsert({
      key: "adsense", value: adsense as any, updated_at: new Date().toISOString(),
    });
    setSavingAds(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "AdSense settings saved" });
  }

  async function generateMarketing() {
    setGenLoading(true); setGenerated([]);
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: { mode: "marketing", topic, audience, tone },
    });
    if (error || !data?.reply) {
      toast({ title: "Generation failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      setGenerated(String(data.reply).split("---").map(s => s.trim()).filter(Boolean));
    }
    setGenLoading(false);
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
        <div className="container max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Platform overview, AdSense, AI marketing.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 text-center">
                <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                <p className="font-heading text-3xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* AdSense Settings */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold text-foreground">AdSense Settings</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Enable ads across the app</p>
                <p className="text-xs text-muted-foreground">Adds Google AdSense slots in landing/gallery.</p>
              </div>
              <Switch checked={adsense.enabled} onCheckedChange={v => setAdsense(a => ({ ...a, enabled: v }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Client ID (ca-pub-…)</label>
                <Input value={adsense.client_id} onChange={e => setAdsense(a => ({ ...a, client_id: e.target.value }))} placeholder="ca-pub-1234567890" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Default Slot ID</label>
                <Input value={adsense.slot_id} onChange={e => setAdsense(a => ({ ...a, slot_id: e.target.value }))} placeholder="0123456789" />
              </div>
            </div>
            <Button variant="hero" size="sm" onClick={saveAds} disabled={savingAds}>
              {savingAds ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
          </div>

          {/* AI Marketing Studio */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold text-foreground">AI Marketing Studio</h2>
            </div>
            <p className="text-sm text-muted-foreground">Generate ready-to-post promo blurbs for hosts & influencers.</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic" />
              <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Audience" />
              <select value={tone} onChange={e => setTone(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
                <option value="fun">Fun</option>
                <option value="elegant">Elegant</option>
                <option value="bold">Bold</option>
                <option value="nostalgic">Nostalgic</option>
                <option value="playful">Playful</option>
              </select>
            </div>
            <Button variant="hero" size="sm" onClick={generateMarketing} disabled={genLoading}>
              {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate 3 messages
            </Button>
            {generated.length > 0 && (
              <div className="grid md:grid-cols-3 gap-3">
                {generated.map((m, i) => (
                  <div key={i} className="rounded-2xl bg-background/50 border border-border/30 p-3 text-sm space-y-2">
                    <p className="leading-relaxed whitespace-pre-line">{m}</p>
                    <button onClick={() => { navigator.clipboard.writeText(m); toast({ title: "Copied!" }); }}
                      className="text-xs text-primary hover:underline">Copy</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Events */}
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
                      {event.is_active ? <span className="text-primary font-medium">Active</span> : <span>Inactive</span>}
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
