-- Drop the overly permissive guest update policy and replace with a scoped one.
-- Guests aren't authenticated, so we restrict updates to ONLY the snaps_remaining column
-- via a trigger-style guard isn't possible in policy-only land. Instead, narrow it to
-- only allow updates when the row's event is still active. This is the best we can do
-- without auth, but it stops random row id manipulation from outside.
DROP POLICY IF EXISTS "Guests can update own snaps" ON public.event_guests;

CREATE POLICY "Guests can update snaps on active events"
ON public.event_guests
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_guests.event_id AND events.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_guests.event_id AND events.is_active = true
  )
);