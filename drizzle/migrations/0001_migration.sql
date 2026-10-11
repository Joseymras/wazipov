CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text, phone text, topic text NOT NULL DEFAULT 'Support', message text NOT NULL,
  status text NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a contact message" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) BETWEEN 1 AND 100 AND length(message) BETWEEN 5 AND 3000
    AND topic IN ('Support','Sales','Sponsorship','Partnership','Press')
    AND (email IS NOT NULL OR phone IS NOT NULL) AND status = 'new');
CREATE POLICY "Admins manage contact messages" ON public.contact_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin'));

-- profiles: own or admin
DROP POLICY "Users can view any profile" ON public.profiles;
CREATE POLICY "Users view own profile or admin" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.referrer_for_code(_code text) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT user_id FROM public.profiles WHERE referral_code = _code LIMIT 1 $$;
GRANT EXECUTE ON FUNCTION public.referrer_for_code(text) TO authenticated;

-- wallet transactions: only written by backend; readable by wallet owner or admin
DROP POLICY "Public insert transactions" ON public.wallet_transactions;
DROP POLICY "Public read transactions" ON public.wallet_transactions;
CREATE POLICY "Owners and admins read transactions" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid()));

-- photo reports
DROP POLICY "Anyone can report a photo" ON public.photo_reports;
CREATE POLICY "Anyone can report a visible photo" ON public.photo_reports FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'open' AND coalesce(length(reason),0) <= 500
    AND EXISTS (SELECT 1 FROM public.photos p WHERE p.id = photo_id AND p.event_id = photo_reports.event_id));
DROP POLICY "Hosts and admins resolve reports" ON public.photo_reports;
CREATE POLICY "Hosts and admins resolve reports" ON public.photo_reports FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid()))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid()));