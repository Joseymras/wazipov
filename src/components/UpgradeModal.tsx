import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export default function UpgradeModal({ open, onClose, feature = "this feature" }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-5"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center">
              <Lock className="w-7 h-7 text-background" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold text-foreground">Trial expired</h2>
              <p className="text-muted-foreground">
                Your free trial is over. Upgrade to unlock {feature} and keep capturing every POV.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-foreground">
              {[
                "Unlimited photo modes (video, GIF, boomerang)",
                "Custom QR codes & branded events",
                "Photobook PDF & ZIP exports",
                "Priority support",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full rounded-full" asChild>
              <Link to="/pricing">
                See plans <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
