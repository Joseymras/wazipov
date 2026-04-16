import { motion } from "framer-motion";
import { Camera, Plus, CalendarDays, Users, Image, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const demoEvents = [
  { name: "Sarah & James Wedding", date: "Dec 28, 2026", guests: 124, photos: 847, color: "from-primary to-accent" },
  { name: "Office Year-End Party", date: "Dec 20, 2026", guests: 45, photos: 312, color: "from-secondary to-primary" },
  { name: "Maya's Graduation", date: "Jan 15, 2027", guests: 30, photos: 0, color: "from-accent to-secondary" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar-style nav for desktop */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-border/30">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">POV Moments</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/pricing">Upgrade</Link>
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial="hidden" animate="visible" className="flex items-center justify-between mb-8">
            <motion.div variants={fadeUp} custom={0}>
              <h1 className="font-heading text-3xl font-bold text-foreground">Your Events</h1>
              <p className="text-muted-foreground mt-1">Manage your POV moments</p>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <Button variant="hero" size="lg">
                <Plus className="w-5 h-5" /> New Event
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div initial="hidden" animate="visible" className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Events", value: "3", icon: CalendarDays },
              { label: "Total Guests", value: "199", icon: Users },
              { label: "Photos Captured", value: "1,159", icon: Image },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i + 2}
                className="glass-card rounded-2xl p-5 text-center"
              >
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Event Cards */}
          <div className="space-y-4">
            {demoEvents.map((event, i) => (
              <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp} custom={i + 5}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4 p-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${event.color} flex items-center justify-center shrink-0`}>
                    <Camera className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-foreground truncate">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{event.guests}</p>
                      <p className="text-xs">guests</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{event.photos}</p>
                      <p className="text-xs">photos</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
