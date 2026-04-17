-- Extend subscriptions for multi-provider support
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'paystack',
  ADD COLUMN IF NOT EXISTS plan_code TEXT,
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS amount_kes NUMERIC;

-- Allow updates to subscriptions (for webhook updates)
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Extend events for camera customization
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS welcome_message TEXT,
  ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS filter_preset TEXT NOT NULL DEFAULT 'disposable',
  ADD COLUMN IF NOT EXISTS countdown_seconds INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS allow_video BOOLEAN NOT NULL DEFAULT false;

-- Photo likes table
CREATE TABLE IF NOT EXISTS public.photo_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL,
  liker_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(photo_id, liker_identifier)
);

ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can like revealed photos"
  ON public.photo_likes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.photos WHERE photos.id = photo_likes.photo_id AND photos.is_revealed = true)
  );

CREATE POLICY "Anyone can view likes"
  ON public.photo_likes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can unlike own"
  ON public.photo_likes FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON public.photo_likes(photo_id);