CREATE OR REPLACE FUNCTION public.admin_activate_event(_event_id uuid, _guests int, _shots int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.events SET status='active', is_active=true, guest_limit=greatest(10,least(_guests,100000)), snaps_per_guest=greatest(1,least(_shots,100)) WHERE id=_event_id;
  UPDATE public.event_guests SET snaps_remaining = greatest(snaps_remaining, greatest(1,least(_shots,100)) - shots_used) WHERE event_id=_event_id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_activate_event(uuid,int,int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_activate_event(uuid,int,int) TO authenticated;
UPDATE public.profiles SET subscription_tier='platinum', trial_ends_at = now() + interval '100 years' WHERE user_id='e87d5567-fc13-4ded-a269-cf0c9bae7444';