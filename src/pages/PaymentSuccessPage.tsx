import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [plan, setPlan] = useState<string>("");

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    const sessionId = params.get("session_id");
    const provider = params.get("provider");

    const verify = async () => {
      try {
        if (sessionId || provider === "stripe") {
          const { data } = await supabase.functions.invoke("stripe-verify", { body: { session_id: sessionId } });
          if (data?.success) { setStatus("success"); setPlan(data.plan || ""); } else setStatus("failed");
        } else if (reference) {
          const { data } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
          if (data?.success) { setStatus("success"); setPlan(data.plan || ""); } else setStatus("failed");
        } else {
          setStatus("failed");
        }
      } catch { setStatus("failed"); }
    };
    verify();
  }, [params]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl p-10 max-w-md w-full text-center space-y-5"
      >
        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Verifying payment…</h1>
            <p className="text-muted-foreground text-sm">Hang tight, this takes just a sec.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Welcome to {plan || "POV Moments"}! 🎉</h1>
            <p className="text-muted-foreground">Your subscription is active. Time to create your first event.</p>
            <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
        {status === "failed" && (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground">Payment couldn't be verified</h1>
            <p className="text-muted-foreground text-sm">If you were charged, please contact support with your reference.</p>
            <Button variant="hero" onClick={() => navigate("/pricing")}>Try again</Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
