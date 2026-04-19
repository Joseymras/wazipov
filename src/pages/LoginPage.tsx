import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Mail, Lock, ArrowRight, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const claimEventId = searchParams.get("claim");

  // Claim guest captures + redirect after auth
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (claimEventId) {
        const guestIdent = localStorage.getItem(`pov_guest_${claimEventId}`);
        if (guestIdent) {
          await supabase.from("event_guests")
            .update({ claimed_by_user_id: user.id })
            .eq("event_id", claimEventId)
            .eq("guest_identifier", guestIdent);
        }
      }
      navigate(next);
    })();
  }, [user, claimEventId, next, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast({ title: "Account created!", description: "Check your email to confirm your account." });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Navigation handled by useEffect
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial="hidden" animate="visible" className="w-full max-w-md space-y-8">
        <motion.div variants={fadeUp} custom={0} className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center">
              <Camera className="w-6 h-6 text-background" />
            </div>
          </Link>
          <h1 className="font-heading text-2xl font-bold">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? "Start capturing moments" : "Continue where you left off"}
          </p>
        </motion.div>

        <motion.form onSubmit={handleSubmit} variants={fadeUp} custom={1} className="glass-card rounded-3xl p-8 space-y-5">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" className="h-12 rounded-xl pl-10 bg-background/50" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="hello@example.com" className="h-12 rounded-xl pl-10 bg-background/50" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={password} onChange={e => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-12 rounded-xl pl-10 pr-10 bg-background/50"
                required minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button size="lg" className="w-full rounded-full" type="submit" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.form>

        <motion.p variants={fadeUp} custom={2} className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
