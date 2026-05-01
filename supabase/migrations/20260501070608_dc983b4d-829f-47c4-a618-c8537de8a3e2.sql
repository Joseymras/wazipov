-- Roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed super_admin for joseymras88@gmail.com if user exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role FROM auth.users WHERE email = 'joseymras88@gmail.com'
ON CONFLICT DO NOTHING;

-- Auto-grant super_admin to that email on signup
CREATE OR REPLACE FUNCTION public.grant_super_admin_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'joseymras88@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_super_admin_on_signup();

-- Allow super_admin to edit platform_settings (already has public SELECT)
CREATE POLICY "Super admins manage settings" ON public.platform_settings
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed pricing tiers (admin-editable source of truth, KES)
INSERT INTO public.platform_settings (key, value) VALUES
  ('pricing_starter',   '{"name":"Starter","base_kes":100,"per_guest_kes":5,"trial_days":1,"lifetime":false}'::jsonb),
  ('pricing_pro',       '{"name":"Pro","base_kes":999,"per_guest_kes":8,"trial_days":1,"lifetime":false,"popular":true}'::jsonb),
  ('pricing_platinum',  '{"name":"Platinum","base_kes":6999,"per_guest_kes":0,"trial_days":1,"lifetime":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
