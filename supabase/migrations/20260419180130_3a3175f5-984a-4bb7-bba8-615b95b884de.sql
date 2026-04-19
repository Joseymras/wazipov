-- 1. Add discovery + customization fields to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_case text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS soundtrack_id text,
  ADD COLUMN IF NOT EXISTS allow_greenscreen boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_music boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_events_use_case ON public.events(use_case);
CREATE INDEX IF NOT EXISTS idx_events_public ON public.events(is_public) WHERE is_public = true;

-- 2. Public discovery policy (anyone can browse public, active events)
DROP POLICY IF EXISTS "Public events are discoverable" ON public.events;
CREATE POLICY "Public events are discoverable" ON public.events
  FOR SELECT USING (is_public = true AND is_active = true);

-- 3. Photobooks
CREATE TABLE IF NOT EXISTS public.photobooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  host_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'My Photobook',
  template text NOT NULL DEFAULT 'classic',
  page_size text NOT NULL DEFAULT 'a4',
  spreads jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.photobooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage own photobooks" ON public.photobooks
  FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

CREATE TRIGGER trg_photobooks_updated
  BEFORE UPDATE ON public.photobooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Soundtracks library (curated, read-only public)
CREATE TABLE IF NOT EXISTS public.soundtracks (
  id text PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'POV Library',
  mood text NOT NULL,
  duration_seconds int NOT NULL DEFAULT 30,
  url text NOT NULL,
  license text NOT NULL DEFAULT 'CC0',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.soundtracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads soundtracks" ON public.soundtracks FOR SELECT USING (true);

-- 5. Trial enabled for all subscription tiers - update handle_new_user already grants 1 day,
-- so nothing else needed here. Add a column to track which tier the trial is for:
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_tier text NOT NULL DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

-- 6. Storage bucket for featured images (cover photos already exist, add 'event-covers')
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read covers" ON storage.objects;
CREATE POLICY "Public read covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "Auth upload covers" ON storage.objects;
CREATE POLICY "Auth upload covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-covers' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owner update covers" ON storage.objects;
CREATE POLICY "Owner update covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-covers' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owner delete covers" ON storage.objects;
CREATE POLICY "Owner delete covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-covers' AND auth.uid() IS NOT NULL);

-- 7. Seed soundtracks with royalty-free Pixabay CDN tracks (CC0)
INSERT INTO public.soundtracks (id, title, mood, duration_seconds, url) VALUES
  ('upbeat-1','Sunny Days','upbeat',30,'https://cdn.pixabay.com/audio/2022/10/25/audio_864e1f5cdd.mp3'),
  ('chill-1','Lofi Sunset','chill',30,'https://cdn.pixabay.com/audio/2024/02/12/audio_a8c2c2f0fe.mp3'),
  ('cinematic-1','Golden Hour','cinematic',30,'https://cdn.pixabay.com/audio/2023/09/12/audio_dab9c2cb01.mp3'),
  ('party-1','Dance Floor','party',30,'https://cdn.pixabay.com/audio/2023/06/14/audio_cb1c8ba9bc.mp3'),
  ('romantic-1','Forever Love','romantic',30,'https://cdn.pixabay.com/audio/2023/01/19/audio_5fe98a2eb4.mp3'),
  ('corporate-1','Innovation','corporate',30,'https://cdn.pixabay.com/audio/2022/11/22/audio_d0a456ca4d.mp3'),
  ('birthday-1','Celebrate','party',30,'https://cdn.pixabay.com/audio/2023/02/28/audio_550d815fde.mp3'),
  ('wedding-1','Vows','romantic',30,'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3'),
  ('travel-1','Wanderlust','cinematic',30,'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3'),
  ('fun-1','Playground','upbeat',30,'https://cdn.pixabay.com/audio/2022/03/15/audio_ac0a3306df.mp3'),
  ('vibe-1','Midnight Vibe','chill',30,'https://cdn.pixabay.com/audio/2023/11/15/audio_22b0a05ee1.mp3'),
  ('hype-1','Hype Drop','party',30,'https://cdn.pixabay.com/audio/2023/04/12/audio_4f5f4e4fba.mp3')
ON CONFLICT (id) DO NOTHING;