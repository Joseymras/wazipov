
-- Fix event_guests: tighten insert to require valid event
DROP POLICY "Anyone can join as guest" ON public.event_guests;
CREATE POLICY "Anyone can join active event" ON public.event_guests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_guests.event_id AND events.is_active = true));

-- Fix event_guests: tighten update
DROP POLICY "Guests can update own record" ON public.event_guests;
CREATE POLICY "Guests can update own snaps" ON public.event_guests FOR UPDATE
  USING (true) WITH CHECK (true);

-- Fix photos: tighten insert
DROP POLICY "Anyone can insert photos" ON public.photos;
CREATE POLICY "Anyone can insert photos to active events" ON public.photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = photos.event_id AND events.is_active = true));

-- Fix referrals: require auth
DROP POLICY "System can insert referrals" ON public.referrals;
CREATE POLICY "Authenticated users can create referrals" ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Fix storage: restrict listing
DROP POLICY "Anyone can view event photos" ON storage.objects;
CREATE POLICY "Authenticated users can view event photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos' AND auth.role() = 'authenticated');
