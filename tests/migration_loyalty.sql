-- ============================================================================
-- MARKETO PWA - CLUB DE FIDELIZACION
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. TABLAS ==================================================================

CREATE TABLE IF NOT EXISTS club_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    club_enabled BOOLEAN NOT NULL DEFAULT true,
    welcome_bonus_points INTEGER NOT NULL DEFAULT 100,
    points_per_dollar NUMERIC(8,2) NOT NULL DEFAULT 1.00,
    referral_referrer_points INTEGER NOT NULL DEFAULT 150,
    referral_referred_points INTEGER NOT NULL DEFAULT 100,
    pwa_install_points INTEGER NOT NULL DEFAULT 50,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO club_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS club_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE REFERENCES usuarios_clientes(id) ON DELETE CASCADE,
    current_balance INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_redeemed INTEGER NOT NULL DEFAULT 0,
    referral_code VARCHAR(12) NOT NULL UNIQUE,
    referred_by TEXT,
    welcome_bonus_given BOOLEAN NOT NULL DEFAULT false,
    pwa_install_bonus_given BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_club_accounts_referral ON club_accounts(referral_code);
CREATE INDEX IF NOT EXISTS idx_club_accounts_user ON club_accounts(user_id);

CREATE TABLE IF NOT EXISTS club_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES usuarios_clientes(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'welcome_bonus','purchase','referral_referrer','referral_referred',
        'pwa_install','reward_redemption','admin_adjustment'
    )),
    reference_id TEXT,
    description TEXT,
    balance_after INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_club_tx_user ON club_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_club_tx_created ON club_transactions(created_at DESC);

CREATE TABLE IF NOT EXISTS club_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    stock INTEGER NOT NULL DEFAULT -1,
    active BOOLEAN NOT NULL DEFAULT true,
    max_per_user INTEGER DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_club_rewards_active ON club_rewards(active);

CREATE TABLE IF NOT EXISTS club_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES usuarios_clientes(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES club_rewards(id),
    points_spent INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','cancelled')),
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_club_red_user ON club_redemptions(user_id);

CREATE TABLE IF NOT EXISTS club_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id TEXT NOT NULL REFERENCES usuarios_clientes(id) ON DELETE CASCADE,
    referred_user_id TEXT NOT NULL REFERENCES usuarios_clientes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referred_user_id)
);
CREATE INDEX IF NOT EXISTS idx_club_ref_referrer ON club_referrals(referrer_user_id);

-- 2. RLS ====================================================================

ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_referrals ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON club_settings TO anon, authenticated;
GRANT SELECT ON club_accounts TO anon, authenticated;
GRANT SELECT ON club_rewards TO anon, authenticated;
GRANT SELECT ON club_transactions TO anon, authenticated;
GRANT SELECT ON club_redemptions TO anon, authenticated;
GRANT SELECT ON club_referrals TO anon, authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS "club_settings_read" ON club_settings;
  CREATE POLICY "club_settings_read" ON club_settings FOR SELECT USING (true);
  DROP POLICY IF EXISTS "club_settings_admin" ON club_settings;
  CREATE POLICY "club_settings_admin" ON club_settings FOR ALL TO authenticated
    USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());

  DROP POLICY IF EXISTS "club_accounts_user" ON club_accounts;
  CREATE POLICY "club_accounts_user" ON club_accounts FOR SELECT TO authenticated
    USING (auth.uid()::text = user_id);
  DROP POLICY IF EXISTS "club_accounts_admin" ON club_accounts;
  CREATE POLICY "club_accounts_admin" ON club_accounts FOR ALL TO authenticated
    USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());

  DROP POLICY IF EXISTS "club_tx_user" ON club_transactions;
  CREATE POLICY "club_tx_user" ON club_transactions FOR SELECT TO authenticated
    USING (auth.uid()::text = user_id);
  DROP POLICY IF EXISTS "club_tx_admin" ON club_transactions;
  CREATE POLICY "club_tx_admin" ON club_transactions FOR ALL TO authenticated
    USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());

  DROP POLICY IF EXISTS "club_rewards_read" ON club_rewards;
  CREATE POLICY "club_rewards_read" ON club_rewards FOR SELECT USING (active = true OR public.is_admin_or_superadmin());
  DROP POLICY IF EXISTS "club_rewards_admin" ON club_rewards;
  CREATE POLICY "club_rewards_admin" ON club_rewards FOR ALL TO authenticated
    USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());

  DROP POLICY IF EXISTS "club_red_user" ON club_redemptions;
  CREATE POLICY "club_red_user" ON club_redemptions FOR SELECT TO authenticated
    USING (auth.uid()::text = user_id);
  DROP POLICY IF EXISTS "club_red_admin" ON club_redemptions;
  CREATE POLICY "club_red_admin" ON club_redemptions FOR ALL TO authenticated
    USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());

  DROP POLICY IF EXISTS "club_ref_user" ON club_referrals;
  CREATE POLICY "club_ref_user" ON club_referrals FOR SELECT TO authenticated
    USING (auth.uid()::text = referrer_user_id OR auth.uid()::text = referred_user_id);
  DROP POLICY IF EXISTS "club_ref_admin" ON club_referrals;
  CREATE POLICY "club_ref_admin" ON club_referrals FOR ALL TO authenticated
    USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());
END $$;

-- 3. FUNCIONES ===============================================================

CREATE OR REPLACE FUNCTION public.generate_club_referral_code()
RETURNS VARCHAR(12) AS $$
DECLARE new_code TEXT; attempts INT := 0;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 4) || substr(md5(random()::text), 1, 4));
    new_code := left(new_code, 8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.club_accounts WHERE referral_code = new_code);
    attempts := attempts + 1;
    IF attempts > 20 THEN RAISE EXCEPTION 'No se pudo generar codigo unico'; END IF;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user_club_account()
RETURNS TRIGGER AS $$
DECLARE v_code TEXT; v_bonus INTEGER;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.id IS NOT NULL THEN
    v_code := public.generate_club_referral_code();
    SELECT welcome_bonus_points INTO v_bonus FROM public.club_settings WHERE id = 1;
    INSERT INTO public.club_accounts (user_id, current_balance, total_earned, referral_code, welcome_bonus_given)
    VALUES (NEW.id, COALESCE(v_bonus,100), COALESCE(v_bonus,100), v_code, true);
    INSERT INTO public.club_transactions (user_id, points, type, reference_id, description, balance_after)
    VALUES (NEW.id, COALESCE(v_bonus,100), 'welcome_bonus', 'welcome-'||NEW.id, 'Bonificacion de bienvenida', COALESCE(v_bonus,100));
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creando cuenta club: %', SQLERRM; RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_user_club ON public.usuarios_clientes;
CREATE TRIGGER trigger_new_user_club
  AFTER INSERT ON public.usuarios_clientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_club_account();

CREATE OR REPLACE FUNCTION public.club_award_purchase(
  p_user_id TEXT, p_order_id TEXT, p_total_usd NUMERIC
) RETURNS JSONB AS $$
DECLARE v_s RECORD; v_a RECORD; v_pts INT; v_bal INT; v_tot INT;
BEGIN
  SELECT * INTO v_s FROM public.club_settings WHERE id = 1;
  IF NOT v_s.club_enabled THEN RETURN jsonb_build_object('success',false,'message','Club desactivado'); END IF;
  SELECT * INTO v_a FROM public.club_accounts WHERE user_id = p_user_id;
  IF v_a IS NULL THEN RETURN jsonb_build_object('success',false,'message','Sin cuenta'); END IF;
  v_pts := FLOOR(p_total_usd * v_s.points_per_dollar)::INTEGER;
  IF v_pts <= 0 THEN RETURN jsonb_build_object('success',false,'message','Sin puntos'); END IF;
  v_bal := v_a.current_balance + v_pts;
  v_tot := v_a.total_earned + v_pts;
  UPDATE public.club_accounts SET current_balance = v_bal, total_earned = v_tot, updated_at = NOW() WHERE user_id = p_user_id;
  INSERT INTO public.club_transactions (user_id, points, type, reference_id, description, balance_after)
  VALUES (p_user_id, v_pts, 'purchase', p_order_id, 'Compra #'||p_order_id||' - $'||p_total_usd, v_bal);
  RETURN jsonb_build_object('success',true,'points_awarded',v_pts,'new_balance',v_bal);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.club_award_referral(
  p_referral_code TEXT, p_new_user_id TEXT
) RETURNS JSONB AS $$
DECLARE v_s RECORD; v_ref RECORD;
BEGIN
  SELECT * INTO v_s FROM public.club_settings WHERE id = 1;
  IF NOT v_s.club_enabled THEN RETURN jsonb_build_object('success',false,'message','Club desactivado'); END IF;
  SELECT * INTO v_ref FROM public.club_accounts WHERE referral_code = p_referral_code;
  IF v_ref IS NULL THEN RETURN jsonb_build_object('success',false,'message','Codigo invalido'); END IF;
  IF v_ref.user_id = p_new_user_id THEN RETURN jsonb_build_object('success',false,'message','Auto-referido'); END IF;

  INSERT INTO public.club_referrals (referrer_user_id, referred_user_id)
  VALUES (v_ref.user_id, p_new_user_id) ON CONFLICT (referred_user_id) DO NOTHING;

  UPDATE public.club_accounts SET current_balance = current_balance + v_s.referral_referrer_points,
    total_earned = total_earned + v_s.referral_referrer_points, updated_at = NOW()
  WHERE user_id = v_ref.user_id;
  INSERT INTO public.club_transactions (user_id, points, type, reference_id, description, balance_after)
  SELECT v_ref.user_id, v_s.referral_referrer_points, 'referral_referrer', p_new_user_id,
    'Referido nuevo usuario', la.current_balance FROM public.club_accounts la WHERE la.user_id = v_ref.user_id;

  UPDATE public.club_accounts SET current_balance = current_balance + v_s.referral_referred_points,
    total_earned = total_earned + v_s.referral_referred_points, referred_by = p_referral_code, updated_at = NOW()
  WHERE user_id = p_new_user_id;
  INSERT INTO public.club_transactions (user_id, points, type, reference_id, description, balance_after)
  SELECT p_new_user_id, v_s.referral_referred_points, 'referral_referred', v_ref.user_id,
    'Registrado via codigo de referido', la.current_balance FROM public.club_accounts la WHERE la.user_id = p_new_user_id;

  RETURN jsonb_build_object('success',true,'referrer_points',v_s.referral_referrer_points,'referred_points',v_s.referral_referred_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.club_redeem_reward(
  p_user_id TEXT, p_reward_id UUID
) RETURNS JSONB AS $$
DECLARE v_a RECORD; v_r RECORD; v_red_id UUID;
BEGIN
  SELECT * INTO v_a FROM public.club_accounts WHERE user_id = p_user_id;
  IF v_a IS NULL THEN RETURN jsonb_build_object('success',false,'message','Sin cuenta'); END IF;
  SELECT * INTO v_r FROM public.club_rewards WHERE id = p_reward_id AND active = true;
  IF v_r IS NULL THEN RETURN jsonb_build_object('success',false,'message','Recompensa no encontrada'); END IF;
  IF v_r.stock = 0 THEN RETURN jsonb_build_object('success',false,'message','Sin stock'); END IF;
  IF v_a.current_balance < v_r.points_cost THEN RETURN jsonb_build_object('success',false,'message','Puntos insuficientes'); END IF;
  IF v_r.max_per_user > 0 THEN
    IF (SELECT COUNT(*) FROM public.club_redemptions WHERE user_id = p_user_id AND reward_id = p_reward_id) >= v_r.max_per_user THEN
      RETURN jsonb_build_object('success',false,'message','Limite alcanzado');
    END IF;
  END IF;

  UPDATE public.club_accounts SET current_balance = current_balance - v_r.points_cost,
    total_redeemed = total_redeemed + v_r.points_cost, updated_at = NOW() WHERE user_id = p_user_id;

  INSERT INTO public.club_transactions (user_id, points, type, reference_id, description, balance_after)
  SELECT p_user_id, -v_r.points_cost, 'reward_redemption', p_reward_id::TEXT,
    'Canje: '||v_r.name, la.current_balance FROM public.club_accounts la WHERE la.user_id = p_user_id;

  INSERT INTO public.club_redemptions (user_id, reward_id, points_spent, status)
  VALUES (p_user_id, p_reward_id, v_r.points_cost, 'pending') RETURNING id INTO v_red_id;

  IF v_r.stock > 0 THEN UPDATE public.club_rewards SET stock = stock - 1, updated_at = NOW() WHERE id = p_reward_id; END IF;

  RETURN jsonb_build_object('success',true,'redemption_id',v_red_id,'points_spent',v_r.points_cost,
    'new_balance',(SELECT current_balance FROM public.club_accounts WHERE user_id = p_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.club_admin_adjust(
  p_user_id TEXT, p_points INTEGER, p_description TEXT DEFAULT 'Ajuste manual'
) RETURNS JSONB AS $$
DECLARE v_bal INTEGER;
BEGIN
  UPDATE public.club_accounts SET current_balance = current_balance + p_points,
    total_earned = CASE WHEN p_points > 0 THEN total_earned + p_points ELSE total_earned END,
    total_redeemed = CASE WHEN p_points < 0 THEN total_redeemed + ABS(p_points) ELSE total_redeemed END,
    updated_at = NOW() WHERE user_id = p_user_id RETURNING current_balance INTO v_bal;
  IF v_bal IS NULL THEN RETURN jsonb_build_object('success',false,'message','Cuenta no encontrada'); END IF;
  IF v_bal < 0 THEN
    UPDATE public.club_accounts SET current_balance = current_balance - p_points,
      total_earned = CASE WHEN p_points > 0 THEN total_earned - p_points ELSE total_earned END,
      total_redeemed = CASE WHEN p_points < 0 THEN total_redeemed - ABS(p_points) ELSE total_redeemed END
    WHERE user_id = p_user_id;
    RETURN jsonb_build_object('success',false,'message','Saldo insuficiente');
  END IF;
  INSERT INTO public.club_transactions (user_id, points, type, reference_id, description, balance_after)
  VALUES (p_user_id, p_points, 'admin_adjustment', 'adj-'||encode(gen_random_bytes(4),'hex'), p_description, v_bal);
  RETURN jsonb_build_object('success',true,'new_balance',v_bal);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.club_pwa_bonus(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE v_s RECORD; v_a RECORD;
BEGIN
  SELECT * INTO v_s FROM public.club_settings WHERE id = 1;
  SELECT * INTO v_a FROM public.club_accounts WHERE user_id = p_user_id;
  IF v_a IS NULL THEN RETURN jsonb_build_object('success',false,'message','Sin cuenta'); END IF;
  IF v_a.pwa_install_bonus_given THEN RETURN jsonb_build_object('success',false,'message','Ya otorgado'); END IF;
  UPDATE public.club_accounts SET current_balance = current_balance + v_s.pwa_install_points,
    total_earned = total_earned + v_s.pwa_install_points, pwa_install_bonus_given = true, updated_at = NOW()
  WHERE user_id = p_user_id;
  INSERT INTO public.club_transactions (user_id, points, type, reference_id, description, balance_after)
  SELECT p_user_id, v_s.pwa_install_points, 'pwa_install', 'pwa-'||p_user_id,
    'Bonus por instalacion de la app', la.current_balance FROM public.club_accounts la WHERE la.user_id = p_user_id;
  RETURN jsonb_build_object('success',true,'points_awarded',v_s.pwa_install_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_all_club_accounts()
RETURNS TABLE (
    user_id TEXT, nombre TEXT, email TEXT, telefono TEXT,
    current_balance INTEGER, total_earned INTEGER, total_redeemed INTEGER,
    referral_code VARCHAR(12), created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT la.user_id, uc.nombre, uc.email, uc.telefono, la.current_balance, la.total_earned,
    la.total_redeemed, la.referral_code, la.created_at
  FROM public.club_accounts la JOIN public.usuarios_clientes uc ON la.user_id = uc.id
  ORDER BY la.current_balance DESC;
END;
$$;

-- 4. RECOMPENSAS POR DEFECTO =================================================

INSERT INTO club_rewards (name, description, image_url, points_cost, stock, active, display_order)
VALUES
  ('Delivery Gratis', 'Delivery gratis en tu proximo pedido', 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&q=80&w=400', 500, -1, true, 1),
  ('$5 en Productos', 'Tarjeta de $5 para productos del mercado', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=400', 1000, -1, true, 2),
  ('$10 en Productos', 'Tarjeta de $10 para productos del mercado', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400', 1500, -1, true, 3),
  ('1kg de Carne', '1 kilogramo de carne premium a elegir', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=400', 2000, -1, true, 4),
  ('20% Descuento Global', '20% de descuento en tu proxima compra completa', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=400', 2500, -1, true, 5)
ON CONFLICT DO NOTHING;
