-- ============================================================
-- MIGRACIÓN: ROL SUPERADMIN + PERMISOS SERVICE_ROLE
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- PASO 1: Permisos para service_role (permite acceso bypass RLS)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- PASO 2: Agregar columna role a usuarios_clientes
ALTER TABLE usuarios_clientes ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'cliente';

-- PASO 3: Función para verificar superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt()->'app_metadata'->>'role' = 'superadmin')
      OR (auth.jwt()->>'email' = 'sugolo28@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASO 4: Función para verificar admin o superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_superadmin()
      OR (auth.jwt()->'app_metadata'->>'role' = 'admin')
      OR (auth.jwt()->>'email' = 'kecho8a@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASO 5: Actualizar RLS policies

-- store_config
DROP POLICY IF EXISTS "Allow all updates only to admin" ON store_config;
CREATE POLICY "Allow all updates only to admin" ON store_config 
  FOR ALL TO authenticated 
  USING (public.is_admin_or_superadmin());

-- products
DROP POLICY IF EXISTS "Lectura productos activos" ON products;
CREATE POLICY "Lectura productos activos" ON products
  FOR SELECT
  USING (activo = true OR public.is_admin_or_superadmin());

DROP POLICY IF EXISTS "Allow admin changes to catalog" ON products;
CREATE POLICY "Allow admin changes to catalog" ON products 
  FOR ALL TO authenticated 
  USING (public.is_admin_or_superadmin())
  WITH CHECK (public.is_admin_or_superadmin());

-- orders
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
CREATE POLICY "orders_select_own_or_admin" ON orders 
  FOR SELECT 
  USING (auth.uid()::text = cliente_uid OR public.is_admin_or_superadmin());

DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin" ON orders 
  FOR ALL TO authenticated 
  USING (public.is_admin_or_superadmin())
  WITH CHECK (public.is_admin_or_superadmin());

-- usuarios_clientes
DROP POLICY IF EXISTS "Admin lee todos los clientes" ON usuarios_clientes;
CREATE POLICY "Admin lee todos los clientes" ON usuarios_clientes 
  FOR SELECT TO authenticated 
  USING (public.is_admin_or_superadmin());

DROP POLICY IF EXISTS "Admin gestiona todos los clientes" ON usuarios_clientes;
CREATE POLICY "Admin gestiona todos los clientes" ON usuarios_clientes
  FOR ALL TO authenticated
  USING (public.is_admin_or_superadmin())
  WITH CHECK (public.is_admin_or_superadmin());

-- notifications
DROP POLICY IF EXISTS "Lectura de notificaciones" ON notifications;
CREATE POLICY "Lectura de notificaciones" ON notifications
  FOR SELECT TO anon, authenticated USING (
    tipo = 'todos'
    OR (tipo = 'admin' AND public.is_admin_or_superadmin())
    OR (tipo = 'personal' AND destinatario_telefono IS NOT NULL AND destinatario_telefono != '')
    OR (tipo = 'request' AND public.is_admin_or_superadmin())
  );

-- coupons
DROP POLICY IF EXISTS "Gestion cupones admin" ON coupons;
CREATE POLICY "Gestion cupones admin" ON coupons 
  FOR ALL TO authenticated 
  USING (public.is_admin_or_superadmin())
  WITH CHECK (public.is_admin_or_superadmin());

-- PASO 6: Limpiar webhook secret hardcodeado
UPDATE store_config SET push_webhook_secret = '' WHERE push_webhook_secret = '5fca5a4d8825d4de66811590f47af870b01d45e80f391920f4ea76a59ae3c8bf';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
