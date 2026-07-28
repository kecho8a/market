-- ============================================================================
-- FIX: Crear cuentas club para usuarios existentes que no las tienen
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 0. Funcion auxiliar para auto-crear cuenta club desde el frontend
CREATE OR REPLACE FUNCTION public.ensure_club_account(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE v_code TEXT; v_bonus INTEGER;
BEGIN
  -- Si ya existe, retornar success sin hacer nada
  IF EXISTS (SELECT 1 FROM club_accounts WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Ya existe');
  END IF;

  SELECT welcome_bonus_points INTO v_bonus FROM club_settings WHERE id = 1;
  IF v_bonus IS NULL THEN v_bonus := 100; END IF;

  v_code := upper(substr(md5(random()::text || p_user_id), 1, 8));

  INSERT INTO club_accounts (user_id, current_balance, total_earned, referral_code, welcome_bonus_given)
  VALUES (p_user_id, v_bonus, v_bonus, v_code, true);

  INSERT INTO club_transactions (user_id, points, type, reference_id, description, balance_after)
  VALUES (p_user_id, v_bonus, 'welcome_bonus', 'welcome-auto-' || p_user_id, 'Bonificacion de bienvenida', v_bonus);

  RETURN jsonb_build_object('success', true, 'points_awarded', v_bonus);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Crear cuentas club para usuarios que no tienen una
DO $$
DECLARE
  v_user RECORD;
  v_code TEXT;
  v_bonus INTEGER;
  v_count INTEGER := 0;
BEGIN
  SELECT welcome_bonus_points INTO v_bonus FROM club_settings WHERE id = 1;
  IF v_bonus IS NULL THEN v_bonus := 100; END IF;

  FOR v_user IN
    SELECT uc.id FROM usuarios_clientes uc
    LEFT JOIN club_accounts ca ON ca.user_id = uc.id
    WHERE ca.id IS NULL
  LOOP
    -- Generar codigo unico
    v_code := upper(substr(md5(random()::text || v_user.id), 1, 8));

    -- Crear cuenta con bono de bienvenida
    INSERT INTO club_accounts (user_id, current_balance, total_earned, referral_code, welcome_bonus_given)
    VALUES (v_user.id, v_bonus, v_bonus, v_code, true)
    ON CONFLICT (user_id) DO NOTHING;

    -- Registrar transaccion del bono
    INSERT INTO club_transactions (user_id, points, type, reference_id, description, balance_after)
    SELECT v_user.id, v_bonus, 'welcome_bonus', 'welcome-fix-'||v_user.id,
      'Bonificacion de bienvenida (migracion)', la.current_balance
    FROM club_accounts la WHERE la.user_id = v_user.id
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Cuentas club creadas: %', v_count;
END $$;

-- 2. Verificar resultado
SELECT
  uc.nombre,
  uc.telefono,
  ca.current_balance,
  ca.total_earned,
  ca.referral_code,
  ca.welcome_bonus_given,
  ca.pwa_install_bonus_given
FROM usuarios_clientes uc
LEFT JOIN club_accounts ca ON ca.user_id = uc.id
ORDER BY ca.current_balance DESC;
