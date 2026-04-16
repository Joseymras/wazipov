import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Aperture } from "lucide-react";
import { Link } from "react-router-dom";

export default function CameraPage() {
  const [snapsLeft, setSnapsLeft] = useState(10);
  const [showFlash, setShowFlash] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shutterPress, setShutterPress] = useState(false);

  const takePhoto = useCallback(() => {
    if (snapsLeft <= 0) return;
    setShutterPress(true);
    setShowFlash(true);
    setTimeout(() => setShutterPress(false), 300);
    setTimeout(() => setShowFlash(false), 600);
    setSnapsLeft((p) => {
      const next = p - 1;
      if (next === 0) {
        setTimeout(() => setShowConfetti(true), 700);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      return next;
    });
  }, [snapsLeft]);

  return (
    <div className="fixed inset-0 bg-foreground/95 flex flex-col items-center justify-between select-none overflow-hidden">
      {/* Flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-background z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card rounded-3xl p-8 text-center space-y-3"
            >
              <div className="text-4xl">🎉</div>
              <p className="font-heading text-xl font-bold text-primary-foreground">Roll complete!</p>
              <p className="text-sm text-primary-foreground/70">All snaps saved. The magic reveals soon!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between p-4 z-10">
        <Link to="/">
          <X className="w-6 h-6 text-background/70 hover:text-background transition-colors" />
        </Link>
        <div className="flex items-center gap-2">
          <Aperture className="w-4 h-4 text-primary" />
          <span className="font-heading text-sm font-semibold text-background/90">Sarah's Wedding</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Viewfinder */}
      <div className="flex-1 w-full max-w-lg px-4 flex items-center justify-center">
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-foreground/20 border border-background/10">
          {/* Simulated camera view */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 to-foreground/20" />
          {/* Corners */}
          {["-top-px -left-px", "-top-px -right-px", "-bottom-px -left-px", "-bottom-px -right-px"].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8 border-background/30 ${
              i < 2 ? "border-t-2" : "border-b-2"
            } ${i % 2 === 0 ? "border-l-2" : "border-r-2"}`} />
          ))}
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-background/20" />
          </div>
          {/* Film grain overlay */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "var(--film-grain)" }} />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full p-6 pb-10 space-y-4">
        {/* Snap counter */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                i < snapsLeft ? "bg-primary" : "bg-background/20"
              }`}
              animate={i === snapsLeft ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <p className="text-center text-sm text-background/50 font-medium">
          {snapsLeft > 0 ? `${snapsLeft} snaps remaining` : "No snaps left!"}
        </p>

        {/* Shutter */}
        <div className="flex items-center justify-center">
          <motion.button
            onClick={takePhoto}
            disabled={snapsLeft <= 0}
            animate={shutterPress ? { scale: 0.9 } : { scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="relative w-20 h-20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 rounded-full border-4 border-background/40" />
            <div className="absolute inset-2 rounded-full bg-gradient-warm shadow-lg" />
            <Camera className="absolute inset-0 m-auto w-6 h-6 text-primary-foreground z-10" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
