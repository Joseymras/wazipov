import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

export type TrialStatus = {
  isOnTrial: boolean;
  isExpired: boolean;
  isPaid: boolean;
  hoursLeft: number;
  trialEndsAt: Date | null;
};

export function useTrial(): TrialStatus {
  const { profile } = useAuth() as any;

  return useMemo(() => {
    if (!profile) {
      return { isOnTrial: false, isExpired: false, isPaid: false, hoursLeft: 0, trialEndsAt: null };
    }
    const isPaid = profile.subscription_tier && profile.subscription_tier !== "free";
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    if (isPaid) {
      return { isOnTrial: false, isExpired: false, isPaid: true, hoursLeft: 0, trialEndsAt };
    }
    if (!trialEndsAt) {
      return { isOnTrial: false, isExpired: true, isPaid: false, hoursLeft: 0, trialEndsAt: null };
    }
    const msLeft = trialEndsAt.getTime() - Date.now();
    const hoursLeft = Math.max(0, Math.ceil(msLeft / 3_600_000));
    return {
      isOnTrial: msLeft > 0,
      isExpired: msLeft <= 0,
      isPaid: false,
      hoursLeft,
      trialEndsAt,
    };
  }, [profile]);
}
