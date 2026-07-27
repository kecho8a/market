-- ============================================================================
-- MIGRACIÓN: Tabla club_user_coupons para asignar cupones a miembros del club
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 0. Limpiar tabla vieja si tiene user_id UUID (incompatible)
DROP POLICY IF EXISTS "club_user_coupons_select" ON club_user_coupons;
DROP POLICY IF EXISTS "club_user_coupons_insert" ON club_user_coupons;
DROP POLICY IF EXISTS "club_user_coupons_update" ON club_user_coupons;
DROP POLICY IF EXISTS "club_user_coupons_delete" ON club_user_coupons;
DROP INDEX IF EXISTS idx_club_user_coupons_user;
DROP INDEX IF EXISTS idx_club_user_coupons_coupon;
DROP TABLE IF EXISTS club_user_coupons;

-- 1. Tabla de cupones asignados a usuarios del club
-- NOTA: user_id es TEXT para ser consistente con club_accounts.user_id y usuarios_clientes(id)
CREATE TABLE club_user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES usuarios_clientes(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ,
  UNIQUE(user_id, coupon_id)
);

-- 2. Índices para búsquedas frecuentes
CREATE INDEX idx_club_user_coupons_user ON club_user_coupons(user_id);
CREATE INDEX idx_club_user_coupons_coupon ON club_user_coupons(coupon_id);

-- 3. RLS
ALTER TABLE club_user_coupons ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propios cupones asignados (y admin ve todos)
CREATE POLICY "club_user_coupons_select" ON club_user_coupons
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin_or_superadmin());

-- Solo admin puede insertar (asignar cupones)
CREATE POLICY "club_user_coupons_insert" ON club_user_coupons
  FOR INSERT WITH CHECK (public.is_admin_or_superadmin());

-- Solo admin puede actualizar (marcar usado)
CREATE POLICY "club_user_coupons_update" ON club_user_coupons
  FOR UPDATE USING (public.is_admin_or_superadmin());

-- Solo admin puede eliminar (desasignar)
CREATE POLICY "club_user_coupons_delete" ON club_user_coupons
  FOR DELETE USING (public.is_admin_or_superadmin());
