ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS shots_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS event_guests_event_ident_key ON public.event_guests (event_id, guest_identifier);

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS client_capture_id text,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS photos_event_capture_key ON public.photos (event_id, client_capture_id) WHERE client_capture_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS photos_guest_idx ON public.photos (guest_id);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS gateway_response text,
  ADD COLUMN IF NOT EXISTS raw_response jsonb;
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status, created_at DESC);

-- Remove direct guest writes
DROP POLICY IF EXISTS "Guests can update snaps on active events" ON public.event_guests;
DROP POLICY IF EXISTS "Guests can update own snaps" ON public.event_guests;
DROP POLICY IF EXISTS "Anyone can join active event" ON public.event_guests;
DROP POLICY IF EXISTS "Anyone can insert photos to active events" ON public.photos;
REVOKE UPDATE (snaps_remaining, shots_used, session_token) ON public.event_guests FROM anon, authenticated;

-- Reveal visibility
CREATE OR REPLACE FUNCTION public.event_is_revealed(_event_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.events e WHERE e.id = _event_id AND (
    e.reveal_timing = 'immediate'
    OR (e.reveal_timing = 'after_event' AND e.ends_at IS NOT NULL AND e.ends_at <= now())
    OR (e.reveal_timing = 'custom' AND e.reveal_date IS NOT NULL AND e.reveal_date <= now())
    OR (e.reveal_timing = '24h_delay' AND COALESCE(e.reveal_date, e.ends_at + interval '24 hours') <= now())
  ));
$$;

DROP POLICY IF EXISTS "Revealed photos are viewable" ON public.photos;
CREATE POLICY "Revealed photos are viewable" ON public.photos FOR SELECT
  USING (
    (status = 'approved' AND (is_revealed = true OR public.event_is_revealed(event_id)))
    OR EXISTS (SELECT 1 FROM public.events WHERE events.id = photos.event_id AND events.host_id = auth.uid())
    OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
  );

-- Join / resume
CREATE OR REPLACE FUNCTION public.join_event(_event_id uuid, _guest_identifier text, _nickname text DEFAULT NULL)
RETURNS TABLE (guest_id uuid, session_token uuid, snaps_remaining integer, shots_used integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ev public.events; g public.event_guests; cnt int;
BEGIN
  IF length(coalesce(_guest_identifier,'')) < 16 THEN RAISE EXCEPTION 'invalid_session'; END IF;
  SELECT * INTO ev FROM public.events WHERE id = _event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'event_not_found'; END IF;
  SELECT * INTO g FROM public.event_guests eg WHERE eg.event_id = _event_id AND eg.guest_identifier = _guest_identifier;
  IF FOUND THEN
    UPDATE public.event_guests SET last_active_at = now(),
      guest_name = COALESCE(NULLIF(left(trim(_nickname),40),''), guest_name)
      WHERE id = g.id RETURNING * INTO g;
  ELSE
    IF NOT ev.is_active OR ev.status IN ('ended','expired','cancelled') OR (ev.ends_at IS NOT NULL AND ev.ends_at < now()) THEN
      RAISE EXCEPTION 'event_closed';
    END IF;
    SELECT count(*) INTO cnt FROM public.event_guests WHERE event_id = _event_id;
    IF cnt >= ev.guest_limit THEN RAISE EXCEPTION 'event_full'; END IF;
    INSERT INTO public.event_guests (event_id, guest_identifier, guest_name, snaps_remaining)
      VALUES (_event_id, _guest_identifier, NULLIF(left(trim(_nickname),40),''), ev.snaps_per_guest)
      RETURNING * INTO g;
  END IF;
  RETURN QUERY SELECT g.id, g.session_token, g.snaps_remaining, g.shots_used;
END; $$;

-- Atomic shot registration
CREATE OR REPLACE FUNCTION public.register_shot(_guest_id uuid, _session_token uuid, _storage_path text,
  _media_type text DEFAULT 'photo', _client_capture_id text DEFAULT NULL, _width int DEFAULT NULL, _height int DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.event_guests; ev public.events;
BEGIN
  SELECT * INTO g FROM public.event_guests WHERE id = _guest_id FOR UPDATE;
  IF NOT FOUND OR g.session_token <> _session_token THEN RAISE EXCEPTION 'invalid_session'; END IF;
  IF _client_capture_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.photos WHERE event_id = g.event_id AND client_capture_id = _client_capture_id) THEN
    RETURN g.snaps_remaining;
  END IF;
  SELECT * INTO ev FROM public.events WHERE id = g.event_id;
  IF NOT ev.is_active OR ev.status IN ('ended','expired','cancelled') OR (ev.ends_at IS NOT NULL AND ev.ends_at < now()) THEN
    RAISE EXCEPTION 'event_closed';
  END IF;
  IF g.snaps_remaining <= 0 THEN RAISE EXCEPTION 'camera_empty'; END IF;
  IF _storage_path NOT LIKE (g.event_id::text || '/' || g.id::text || '/%') THEN RAISE EXCEPTION 'invalid_path'; END IF;
  INSERT INTO public.photos (event_id, guest_id, storage_path, media_type, nickname, client_capture_id, width, height, status, is_revealed)
  VALUES (g.event_id, g.id, _storage_path, COALESCE(_media_type,'photo'), g.guest_name, _client_capture_id, _width, _height,
    CASE WHEN ev.moderation_enabled THEN 'pending'::photo_status ELSE 'approved'::photo_status END,
    ev.reveal_timing = 'immediate');
  UPDATE public.event_guests SET snaps_remaining = snaps_remaining - 1, shots_used = shots_used + 1, last_active_at = now()
    WHERE id = g.id RETURNING snaps_remaining INTO g.snaps_remaining;
  RETURN g.snaps_remaining;
END; $$;

REVOKE ALL ON FUNCTION public.join_event(uuid, text, text) FROM public;
REVOKE ALL ON FUNCTION public.register_shot(uuid, uuid, text, text, text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.join_event(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_shot(uuid, uuid, text, text, text, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.event_is_revealed(uuid) TO anon, authenticated;

-- Storage: guests can only upload into their own folder while shots remain
DROP POLICY IF EXISTS "Anyone can upload event photos" ON storage.objects;
CREATE POLICY "Guests upload to own event folder" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'event-photos' AND EXISTS (
      SELECT 1 FROM public.event_guests g JOIN public.events e ON e.id = g.event_id
      WHERE g.event_id::text = (storage.foldername(name))[1]
        AND g.id::text = (storage.foldername(name))[2]
        AND g.snaps_remaining > 0 AND e.is_active
    )
  );
DROP POLICY IF EXISTS "Hosts can delete photos" ON storage.objects;
CREATE POLICY "Hosts delete own event photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-photos' AND EXISTS (
    SELECT 1 FROM public.events e WHERE e.id::text = (storage.foldername(name))[1]
      AND (e.host_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))));