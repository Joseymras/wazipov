-- Add trial tracking + Stripe support to subscriptions and add trial_ends_at to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'KES',
  ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Set trial_ends_at = created_at + 24h for new free signups via trigger update
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, referral_code, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'pov_' || substr(NEW.id::text, 1, 8),
    now() + interval '1 day'
  );
  RETURN NEW;
END;
$$;

-- Backfill trial for existing free users without one
UPDATE public.profiles
SET trial_ends_at = COALESCE(trial_ends_at, created_at + interval '1 day')
WHERE subscription_tier = 'free' AND trial_ends_at IS NULL;

-- Add media_type to photos so we can store videos/gifs/boomerangs
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'photo';

-- Add stripe_session_id support to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Link guest captures back to a logged-in user (for "view my captures" after login)
ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_event_guests_claimed_by ON public.event_guests(claimed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_event_guests_identifier ON public.event_guests(guest_identifier);

-- Allow logged-in users to claim their guest record
CREATE POLICY "Users can claim own guest records"
ON public.event_guests
FOR UPDATE
TO authenticated
USING (claimed_by_user_id IS NULL OR claimed_by_user_id = auth.uid())
WITH CHECK (claimed_by_user_id = auth.uid());