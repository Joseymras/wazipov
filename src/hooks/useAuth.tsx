import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  profile: Profile | null;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  subscription_tier: "free" | "starter" | "pro" | "platinum";
  trial_ends_at: string | null;
  preferred_currency: string | null;
  country_code: string | null;
  onboarded?: boolean;
  trial_tier?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfile(data as Profile);
      // Auto-redirect new users to onboarding wizard
      const path = window.location.pathname;
      const onAppRoute = path === "/" || path.startsWith("/dashboard");
      if (data.onboarded === false && onAppRoute) {
        setTimeout(() => {
          window.history.pushState({}, "", "/onboarding");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }, 50);
      }
    }
  }

  async function signUp(email: string, password: string, displayName?: string) {
    const ref = localStorage.getItem("pov_ref");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, ref_code: ref || null },
        emailRedirectTo: window.location.origin,
      },
    });
    // Best-effort referral row (uses referral_code → user_id lookup)
    if (!error && data.user && ref) {
      try {
        const { data: refProfile } = await supabase.from("profiles").select("user_id").eq("referral_code", ref).maybeSingle();
        if (refProfile) {
          await supabase.from("referrals").insert({ referrer_id: refProfile.user_id, referred_id: data.user.id });
        }
      } catch { /* ignore */ }
      localStorage.removeItem("pov_ref");
    }
    return { error: error as Error | null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
