DROP POLICY IF EXISTS "Anyone can unlike own" ON public.photo_likes;

CREATE POLICY "Hosts can delete likes on own event photos"
  ON public.photo_likes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.photos p
      JOIN public.events e ON e.id = p.event_id
      WHERE p.id = photo_likes.photo_id AND e.host_id = auth.uid()
    )
  );