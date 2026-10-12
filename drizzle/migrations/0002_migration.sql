ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text, ADD COLUMN IF NOT EXISTS company text, ADD COLUMN IF NOT EXISTS bio text, ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin')) WITH CHECK (has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(user_id uuid, email text, display_name text, phone text, company text, subscription_tier subscription_tier, suspended boolean, roles text[], events bigint, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT u.id, u.email::text, p.display_name, p.phone, p.company, p.subscription_tier, p.suspended,
    ARRAY(SELECT r.role::text FROM user_roles r WHERE r.user_id = u.id),
    (SELECT count(*) FROM events e WHERE e.host_id = u.id), u.created_at
  FROM auth.users u LEFT JOIN profiles p ON p.user_id = u.id ORDER BY u.created_at DESC;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_role(_user uuid, _role app_role, _on boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _user = auth.uid() AND _role = 'super_admin' AND NOT _on THEN RAISE EXCEPTION 'cannot_remove_self'; END IF;
  IF _on THEN INSERT INTO user_roles(user_id, role) VALUES (_user,_role) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM user_roles WHERE user_id=_user AND role=_role; END IF;
  INSERT INTO audit_logs(admin_id, action, resource_type, resource_id, metadata) VALUES (auth.uid(), CASE WHEN _on THEN 'grant_role' ELSE 'revoke_role' END, 'user', _user::text, jsonb_build_object('role',_role));
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid,app_role,boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid,app_role,boolean) TO authenticated;

-- Wallets: owner_key acts as a bearer secret; all access goes through these functions
CREATE OR REPLACE FUNCTION public.wallet_balance(_owner_key text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE b int;
BEGIN
  IF length(coalesce(_owner_key,'')) < 10 THEN RAISE EXCEPTION 'invalid_key'; END IF;
  IF _owner_key LIKE 'u:%' AND (auth.uid() IS NULL OR _owner_key <> 'u:' || auth.uid()::text) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT balance_tokens INTO b FROM wallets WHERE owner_key=_owner_key;
  IF NOT FOUND THEN INSERT INTO wallets(owner_key, user_id, balance_tokens) VALUES (_owner_key, auth.uid(), 0); b := 0; END IF;
  RETURN b;
END; $$;
CREATE OR REPLACE FUNCTION public.wallet_unlock(_event_id uuid, _owner_key text, _cost int DEFAULT 1) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE w wallets;
BEGIN
  IF _owner_key LIKE 'u:%' AND (auth.uid() IS NULL OR _owner_key <> 'u:' || auth.uid()::text) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF EXISTS (SELECT 1 FROM gallery_unlocks WHERE event_id=_event_id AND owner_key=_owner_key) THEN RETURN true; END IF;
  SELECT * INTO w FROM wallets WHERE owner_key=_owner_key FOR UPDATE;
  IF NOT FOUND OR w.balance_tokens < greatest(_cost,1) THEN RETURN false; END IF;
  UPDATE wallets SET balance_tokens = balance_tokens - greatest(_cost,1) WHERE id=w.id;
  INSERT INTO wallet_transactions(wallet_id, delta_tokens, kind, event_id) VALUES (w.id, -greatest(_cost,1), 'unlock', _event_id);
  INSERT INTO gallery_unlocks(event_id, owner_key) VALUES (_event_id, _owner_key);
  RETURN true;
END; $$;
CREATE OR REPLACE FUNCTION public.gallery_is_unlocked(_event_id uuid, _owner_key text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM gallery_unlocks WHERE event_id=_event_id AND owner_key=_owner_key) $$;
GRANT EXECUTE ON FUNCTION public.wallet_balance(text), public.wallet_unlock(uuid,text,int), public.gallery_is_unlocked(uuid,text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Anyone can insert wallet" ON public.wallets;
DROP POLICY IF EXISTS "Anyone can read own wallet by owner_key" ON public.wallets;
CREATE POLICY "Owners and admins read wallets" ON public.wallets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "Public insert unlocks" ON public.gallery_unlocks;
DROP POLICY IF EXISTS "Public read unlocks" ON public.gallery_unlocks;
CREATE POLICY "Admins read unlocks" ON public.gallery_unlocks FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin'));