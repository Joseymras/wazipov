
-- Wallet (one row per owner_key — either user_id text or device hash)
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_key text NOT NULL UNIQUE,
  balance_tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read own wallet by owner_key" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert wallet" ON public.wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own wallet" ON public.wallets FOR UPDATE USING (true);

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  delta_tokens integer NOT NULL,
  amount_kes numeric,
  kind text NOT NULL,
  reference text,
  event_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read transactions" ON public.wallet_transactions FOR SELECT USING (true);
CREATE POLICY "Public insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

CREATE TABLE public.gallery_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  owner_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, owner_key)
);
ALTER TABLE public.gallery_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read unlocks" ON public.gallery_unlocks FOR SELECT USING (true);
CREATE POLICY "Public insert unlocks" ON public.gallery_unlocks FOR INSERT WITH CHECK (true);
