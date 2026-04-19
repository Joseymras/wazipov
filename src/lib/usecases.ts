// Use-case templates that pre-fill event creation defaults.
// Each maps to filter preset, theme, snaps, and welcome copy.

import { Heart, Cake, Briefcase, PartyPopper, GraduationCap, Sparkles, Music, Plane } from "lucide-react";

export type UseCase = {
  id: string;
  label: string;
  description: string;
  icon: typeof Heart;
  filter_preset: string;
  snaps_per_guest: number;
  reveal_timing: "immediate" | "after_event" | "24h_delay" | "custom";
  welcome_message: string;
  scavenger_prompts: string[];
  soundtrack_id?: string;
  cover_query: string; // for unsplash search
};

export const USE_CASES: UseCase[] = [
  {
    id: "wedding",
    label: "Wedding",
    description: "Capture every angle of the big day",
    icon: Heart,
    filter_preset: "glam",
    snaps_per_guest: 25,
    reveal_timing: "after_event",
    welcome_message: "Welcome! Capture the love from your perspective ❤️",
    scavenger_prompts: ["First dance POV", "Cake cutting", "Funniest face", "Best toast moment", "Squad photo"],
    soundtrack_id: "wedding-1",
    cover_query: "wedding",
  },
  {
    id: "birthday",
    label: "Birthday",
    description: "Make their day unforgettable",
    icon: Cake,
    filter_preset: "vintage",
    snaps_per_guest: 15,
    reveal_timing: "immediate",
    welcome_message: "Let's make memories! Snap your favourite moments 🎂",
    scavenger_prompts: ["Candle blow", "Surprise face", "Group hug", "Dance move"],
    soundtrack_id: "birthday-1",
    cover_query: "birthday-party",
  },
  {
    id: "corporate",
    label: "Corporate",
    description: "Conferences, launches, team offsites",
    icon: Briefcase,
    filter_preset: "none",
    snaps_per_guest: 10,
    reveal_timing: "after_event",
    welcome_message: "Thanks for joining us. Capture key moments below.",
    scavenger_prompts: ["Speaker shot", "Team photo", "Workshop in action"],
    soundtrack_id: "corporate-1",
    cover_query: "corporate-event-conference",
  },
  {
    id: "party",
    label: "Party",
    description: "House parties, club nights, festivals",
    icon: PartyPopper,
    filter_preset: "disposable",
    snaps_per_guest: 30,
    reveal_timing: "after_event",
    welcome_message: "Let's gooo 🔥 Capture the vibe.",
    scavenger_prompts: ["Wildest dance", "Cocktail of the night", "Crew shot"],
    soundtrack_id: "party-1",
    cover_query: "house-party-night",
  },
  {
    id: "graduation",
    label: "Graduation",
    description: "Celebrate the milestone",
    icon: GraduationCap,
    filter_preset: "vintage",
    snaps_per_guest: 20,
    reveal_timing: "immediate",
    welcome_message: "Congrats grad! Capture this moment forever 🎓",
    scavenger_prompts: ["Cap toss", "Family photo", "Diploma shot"],
    soundtrack_id: "cinematic-1",
    cover_query: "graduation-ceremony",
  },
  {
    id: "concert",
    label: "Concert",
    description: "Music, festivals, live shows",
    icon: Music,
    filter_preset: "disposable",
    snaps_per_guest: 25,
    reveal_timing: "immediate",
    welcome_message: "Capture the energy 🎵",
    scavenger_prompts: ["Stage shot", "Crowd POV", "Encore moment"],
    soundtrack_id: "hype-1",
    cover_query: "concert-festival-stage",
  },
  {
    id: "travel",
    label: "Trip",
    description: "Group trips, bachelorette, vacation",
    icon: Plane,
    filter_preset: "vintage",
    snaps_per_guest: 50,
    reveal_timing: "after_event",
    welcome_message: "Adventure awaits ✈️ Document every stop.",
    scavenger_prompts: ["Sunrise/sunset", "Local food", "Best view", "Squad jump"],
    soundtrack_id: "travel-1",
    cover_query: "group-travel-friends",
  },
  {
    id: "general",
    label: "Custom Event",
    description: "Build from scratch",
    icon: Sparkles,
    filter_preset: "disposable",
    snaps_per_guest: 15,
    reveal_timing: "after_event",
    welcome_message: "Capture every POV.",
    scavenger_prompts: [],
    cover_query: "people-celebrating",
  },
];

export function getUseCase(id?: string | null) {
  return USE_CASES.find(u => u.id === id) || USE_CASES[USE_CASES.length - 1];
}
