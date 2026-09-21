-- EVENTS: lifecycle + guest photo controls
DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('draft','pending_payment','scheduled','active','ended','gallery_revealed','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.photo_status AS ENUM ('pending','approved','rejected','deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS status public.event_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS moderation_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_gallery_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_downloads boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_nickname boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS event_pin text,
  ADD COLUMN IF NOT EXISTS guest_limit integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS public_code text,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS host_name text,
  ADD COLUMN IF NOT EXISTS location text;

UPDATE public.events SET public_code = upper(substr(replace(id::text,'-',''),1,6)) WHERE public_code IS NULL;
ALTER TABLE public.events ALTER COLUMN public_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_public_code_key ON public.events (public_code);

-- PHOTOS: moderation
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS status public.photo_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS nickname text;
CREATE INDEX IF NOT EXISTS photos_event_status_idx ON public.photos (event_id, status, created_at DESC);

-- PHOTO REPORTS
CREATE TABLE IF NOT EXISTS public.photo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reason text,
  reporter_session text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.photo_reports TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.photo_reports TO authenticated;
GRANT ALL ON public.photo_reports TO service_role;
ALTER TABLE public.photo_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can report a photo" ON public.photo_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Hosts and admins read reports" ON public.photo_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = photo_reports.event_id AND e.host_id = auth.uid()));
CREATE POLICY "Hosts and admins resolve reports" ON public.photo_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = photo_reports.event_id AND e.host_id = auth.uid()))
  WITH CHECK (true);

-- ANALYTICS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  guest_session_id text,
  name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_event_idx ON public.analytics_events (event_id, name, created_at DESC);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log analytics" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Hosts and admins read analytics" ON public.analytics_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = analytics_events.event_id AND e.host_id = auth.uid()));

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  plan_id text,
  provider text NOT NULL DEFAULT 'paystack',
  provider_reference text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending',
  customer_email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_provider_ref_key UNIQUE (provider, provider_reference)
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();