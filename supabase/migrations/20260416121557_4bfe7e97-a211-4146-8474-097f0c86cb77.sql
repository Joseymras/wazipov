
-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'starter', 'pro', 'platinum');

-- Create reveal timing enum
CREATE TYPE public.reveal_timing AS ENUM ('immediate', 'after_event', '24h_delay', 'custom');

-- Create gallery type enum
CREATE TYPE public.gallery_type AS ENUM ('shared', 'private');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view any profile" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, referral_code)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 'pov_' || substr(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  cover_photo_url TEXT,
  theme_color TEXT DEFAULT '#e85d3a',
  snaps_per_guest INT NOT NULL DEFAULT 10,
  reveal_timing reveal_timing NOT NULL DEFAULT 'after_event',
  reveal_date TIMESTAMPTZ,
  gallery_type gallery_type NOT NULL DEFAULT 'shared',
  scavenger_prompts TEXT[],
  qr_code_url TEXT,
  short_link TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts can manage own events" ON public.events FOR ALL USING (auth.uid() = host_id);
CREATE POLICY "Anyone can view active events by short_link" ON public.events FOR SELECT USING (is_active = true);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event guests table
CREATE TABLE public.event_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT,
  guest_identifier TEXT NOT NULL,
  snaps_remaining INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts can view guests" ON public.event_guests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_guests.event_id AND events.host_id = auth.uid()));
CREATE POLICY "Anyone can join as guest" ON public.event_guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Guests can update own record" ON public.event_guests FOR UPDATE USING (true);

-- Photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.event_guests(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  ai_caption TEXT,
  mood_tag TEXT,
  is_revealed BOOLEAN NOT NULL DEFAULT false,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts can manage photos" ON public.photos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = photos.event_id AND events.host_id = auth.uid()));
CREATE POLICY "Anyone can insert photos" ON public.photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Revealed photos are viewable" ON public.photos FOR SELECT USING (is_revealed = true OR
  EXISTS (SELECT 1 FROM public.events WHERE events.id = photos.event_id AND events.host_id = auth.uid()));

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier subscription_tier NOT NULL DEFAULT 'starter',
  paystack_customer_id TEXT,
  paystack_subscription_code TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  commission_ksh NUMERIC DEFAULT 0,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);

-- Storage bucket for event photos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

CREATE POLICY "Anyone can upload event photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-photos');
CREATE POLICY "Anyone can view event photos" ON storage.objects FOR SELECT USING (bucket_id = 'event-photos');
CREATE POLICY "Hosts can delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'event-photos');
