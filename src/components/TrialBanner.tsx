import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTrial } from "@/hooks/useTrial";

export default function TrialBanner() {
  const trial = useTrial();
  const [dismissed, setDismissed] = useState(false);

  if (trial.isPaid || dismissed) return null;
  if (!trial.isOnTrial && !trial.isExpired) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className={`relative w-full text-sm ${
          trial.isExpired ? "bg-destructive text-destructive-foreground" : "bg-gradient-warm text-primary-foreground"
        }`}
      >
        <div className="container flex items-center justify-center gap-2 py-2 px-4 text-center flex-wrap">
          {trial.isExpired ? (
            <>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="font-medium">Your free trial has ended.</span>
              <Link to="/pricing" className="font-bold underline underline-offset-2 hover:opacity-90">
                Upgrade now to keep capturing →
              </Link>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                <strong>{trial.hoursLeft}h</strong> left in your free trial.
              </span>
              <Link to="/pricing" className="font-bold underline underline-offset-2 hover:opacity-90">
                Upgrade →
              </Link>
            </>
          )}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
