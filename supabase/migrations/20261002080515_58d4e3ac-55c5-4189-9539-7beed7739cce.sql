CREATE OR REPLACE FUNCTION public.guest_can_upload(_event text, _guest text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.event_guests g JOIN public.events e ON e.id = g.event_id
    WHERE g.event_id::text = _event AND g.id::text = _guest AND g.snaps_remaining > 0 AND e.is_active);
$$;
GRANT EXECUTE ON FUNCTION public.guest_can_upload(text, text) TO anon, authenticated;
DROP POLICY IF EXISTS "Guests upload to own event folder" ON storage.objects;
CREATE POLICY "Guests upload to own event folder" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'event-photos' AND public.guest_can_upload((storage.foldername(name))[1], (storage.foldername(name))[2]));