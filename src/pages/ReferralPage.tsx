import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Gift, Users, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function ReferralPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const referralUrl = `${window.location.origin}/?ref=${profile?.referral_code || ""}`;

  useEffect(() => {
    if (user) loadReferrals();
  }, [user]);

  async function loadReferrals() {
    const { data } = await supabase.from("referrals").select("*").eq("referrer_id", user!.id);
    if (data) {
      setReferrals(data);
      setTotalEarnings(data.reduce((sum, r) => sum + (Number(r.commission_ksh) || 0), 0));
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(referralUrl);
    toast({ title: "Referral link copied!" });
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: "POV Moments - Capture every perspective!",
        text: "Create a disposable camera for your next event. Try POV Moments!",
        url: referralUrl,
      });
    } else {
      copyLink();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-3xl font-bold text-foreground">Share the Magic</h1>
            <p className="text-muted-foreground mt-2">Earn rewards when friends sign up and subscribe</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Referrals", value: referrals.length, icon: Users },
              { label: "Converted", value: referrals.filter(r => r.converted).length, icon: TrendingUp },
              { label: "Earned (Ksh)", value: totalEarnings.toLocaleString(), icon: Gift },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-5 text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-8 space-y-4 mb-8">
            <h2 className="font-heading text-lg font-semibold text-foreground">Your Referral Link</h2>
            <div className="flex gap-2">
              <Input value={referralUrl} readOnly className="bg-background/50" />
              <Button variant="outline" size="icon" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
            </div>
            <Button variant="hero" size="lg" className="w-full" onClick={shareLink}>
              <Share2 className="w-5 h-5" /> Share with Friends
            </Button>
          </motion.div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold text-foreground">How it works</h3>
            <div className="space-y-3 text-sm">
              {[
                "Share your unique referral link with friends",
                "When they sign up and subscribe, you earn Ksh 200 credit",
                "Platinum users earn 10% lifetime commission on referrals",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
