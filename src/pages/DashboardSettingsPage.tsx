import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export default function DashboardSettingsPage() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.display_name || "");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: name }).eq("user_id", user.id);
    toast({ title: "Saved" });
    setSaving(false);
  }

  return (
    <DashboardLayout title="Settings">
      <div className="p-6 max-w-3xl mx-auto space-y-8">
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Profile</h2>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Display name</label>
              <Input value={name} onChange={e => setName(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email || ""} disabled className="h-11" />
            </div>
            <Button onClick={save} disabled={saving} className="rounded-full">{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Notifications</h2>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            {[
              { label: "Event activity emails", desc: "Get notified when guests join or photos are uploaded.", v: emailNotifs, set: setEmailNotifs },
              { label: "Marketing & tips", desc: "Occasional product updates and growth tips.", v: marketing, set: setMarketing },
            ].map(row => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.desc}</p>
                </div>
                <Switch checked={row.v} onCheckedChange={row.set} />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Integrations</h2>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm">
            {[
              { name: "Stripe", status: "Connected", desc: "International card checkouts" },
              { name: "Paystack / M-Pesa", status: "Connected", desc: "Kenya payments" },
              { name: "Lovable AI", status: "Active", desc: "AI assistant + marketing copy" },
              { name: "Google AdSense", status: "Configurable in Admin", desc: "Monetization" },
            ].map(i => (
              <div key={i.name} className="flex items-center justify-between border-b border-border last:border-0 py-2">
                <div>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.desc}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary">{i.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Subscription</h2>
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium capitalize">{profile?.subscription_tier || "free"} plan</p>
              <p className="text-xs text-muted-foreground">Manage your billing on the pricing page.</p>
            </div>
            <Button variant="outline" asChild className="rounded-full"><a href="/pricing">Upgrade</a></Button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
