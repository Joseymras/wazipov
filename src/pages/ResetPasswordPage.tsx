import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast({ title: "Use at least 8 characters" });
    if (pw !== pw2) return toast({ title: "Passwords don't match" });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast({ title: "Couldn't update password", description: "Your link may have expired. Request a new one from the sign-in page.", variant: "destructive" });
    toast({ title: "Password updated" });
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={save} className="w-full max-w-md bg-card border border-border rounded-2xl p-8 space-y-4">
        <p className="font-display text-3xl font-bold text-center">WAZI<span className="text-primary">.</span></p>
        <h1 className="font-heading text-xl font-bold text-center">Set a new password</h1>
        <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-12 rounded-xl" />
        <Input type="password" placeholder="Repeat new password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="h-12 rounded-xl" />
        <Button type="submit" size="lg" className="w-full rounded-xl" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
      </form>
    </div>
  );
}
