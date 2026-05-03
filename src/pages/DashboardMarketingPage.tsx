// AI marketing copy generator — uses ai-chat edge function in marketing mode.
import { useState } from "react";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardMarketingPage() {
  const [topic, setTopic] = useState("Launch my wedding camera event");
  const [audience, setAudience] = useState("brides on Instagram");
  const [tone, setTone] = useState<"fun" | "elegant" | "bold" | "casual">("fun");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  async function generate() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { mode: "marketing", topic, audience, tone },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      const parts = String(data.reply || "").split(/---+/).map(s => s.trim()).filter(Boolean);
      setResults(parts);
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }

  function copy(s: string) {
    navigator.clipboard.writeText(s);
    toast({ title: "Copied" });
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Marketing AI</h1>
          <p className="text-sm text-muted-foreground">Generate punchy promo copy for hosts &amp; influencers in seconds.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Topic</label>
              <Textarea value={topic} onChange={e => setTopic(e.target.value)} rows={2} />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Audience</label>
                <Input value={audience} onChange={e => setAudience(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium">Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value as any)} className="w-full bg-background border border-input rounded-md h-9 px-2 text-sm">
                  {["fun", "elegant", "bold", "casual"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate 3 messages
          </Button>
        </div>

        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 flex justify-between gap-3">
              <p className="text-sm whitespace-pre-wrap flex-1">{r}</p>
              <Button variant="ghost" size="icon" onClick={() => copy(r)}><Copy className="w-4 h-4" /></Button>
            </div>
          ))}
          {!results.length && !loading && (
            <p className="text-sm text-muted-foreground text-center py-8">Generated messages appear here.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
