import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

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

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 film-grain">
      <motion.div initial="hidden" animate="visible" className="w-full max-w-md space-y-8">
        {/* Logo */}
        <motion.div variants={fadeUp} custom={0} className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-warm flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? "Start capturing moments" : "Continue where you left off"}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div variants={fadeUp} custom={1} className="glass-card rounded-3xl p-8 space-y-5">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input placeholder="Your name" className="h-12 rounded-xl bg-background/50" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="hello@example.com" className="h-12 rounded-xl pl-10 bg-background/50" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-12 rounded-xl pl-10 pr-10 bg-background/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button variant="hero" size="lg" className="w-full" asChild>
            <Link to="/dashboard">
              {isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        <motion.p variants={fadeUp} custom={2} className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
