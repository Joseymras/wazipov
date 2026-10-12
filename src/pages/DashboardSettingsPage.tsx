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
  const p: any = profile || {};
  const [name, setName] = useState(p.display_name || "");
  const [phone, setPhone] = useState(p.phone || "");
  const [company, setCompany] = useState(p.company || "");
  const [bio, setBio] = useState(p.bio || "");
  const [avatar, setAvatar] = useState(p.avatar_url || "");
  const [currency, setCurrency] = useState(p.preferred_currency || "KES");
  const [newPw, setNewPw] = useState("");
  const [curPw, setCurPw] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: name.slice(0, 80), phone: phone.slice(0, 30) || null, company: company.slice(0, 100) || null,
      bio: bio.slice(0, 500) || null, avatar_url: avatar || null, preferred_currency: currency,
    } as any).eq("user_id", user.id);
    toast(error ? { title: "Couldn't save", variant: "destructive" } : { title: "Profile saved" });
    setSaving(false);
  }

  async function uploadAvatar(f?: File) {
    if (!f || !user) return;
    if (!f.type.startsWith("image/") || f.size > 3e6) return toast({ title: "Use an image under 3 MB" });
    const path = `avatars/${user.id}-${Date.now()}.${f.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("event-covers").upload(path, f, { upsert: true });
    if (error) return toast({ title: "Upload failed", variant: "destructive" });
    setAvatar(supabase.storage.from("event-covers").getPublicUrl(path).data.publicUrl);
  }

  async function changePassword() {
    if (newPw.length < 8) return toast({ title: "Use at least 8 characters" });
    const { error } = await supabase.auth.updateUser({ password: newPw, current_password: curPw } as any);
    toast(error ? { title: "Couldn't change password", description: "Check your current password.", variant: "destructive" } : { title: "Password changed" });
    if (!error) { setNewPw(""); setCurPw(""); }
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
            <div className="flex items-center gap-4">
              {avatar ? <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-muted" />}
              <label className="text-sm text-primary cursor-pointer font-medium">Change photo<input type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0])} /></label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">Phone</label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" className="h-11" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">Company or brand</label><Input value={company} onChange={e => setCompany(e.target.value)} className="h-11" /></div>
            </div>
            <div className="space-y-1.5"><label className="text-sm font-medium">About you</label><Input value={bio} onChange={e => setBio(e.target.value)} className="h-11" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Currency for prices</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3">
                <option value="KES">Kenyan shilling (KES)</option><option value="USD">US dollar (USD)</option>
              </select></div>
            <Button onClick={save} disabled={saving} className="rounded-full">{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Password</h2>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <Input type="password" placeholder="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} className="h-11" />
            <Input type="password" placeholder="New password (8+ characters)" value={newPw} onChange={e => setNewPw(e.target.value)} className="h-11" />
            <Button variant="outline" className="rounded-full" onClick={changePassword}>Change password</Button>
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
