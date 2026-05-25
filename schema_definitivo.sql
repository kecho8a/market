-- ==========================================================================
-- SCRIPT DE ESQUEMA DEFINITIVO PARA MARKETO PWA
-- ESTADO: CONSOLIDADO, SEGURO Y AUTOMATIZADO (FIDELIZACIÓN + STOCK)
-- ==========================================================================

-- Habilitar extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. store_config
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_config (
    id SERIAL PRIMARY KEY,
    site_nombre TEXT NOT NULL DEFAULT 'Marketo',
    telefono_soporte TEXT NOT NULL DEFAULT '+584124058904',
    direccion_fisica TEXT NOT NULL DEFAULT 'Av. Bolívar Norte con Calle 140, Sector Las Acacias, Valencia, Carabobo',
    tienda_lat NUMERIC(10, 6) NOT NULL DEFAULT 10.198300,
    tienda_lng NUMERIC(10, 6) NOT NULL DEFAULT -68.004400,
    banner_url_1 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
    banner_url_2 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=1200',
    banner_url_3 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1200',
    zelle_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    zelle_data TEXT NOT NULL DEFAULT 'pagos@marketo.com.ve',
    zelle_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    pagomovil_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    pagomovil_data TEXT NOT NULL DEFAULT 'Banesco (0134) - RIF J-50123456-7 - Tel: 0412-4976451',
    pagomovil_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    efectivo_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    efectivo_data TEXT NOT NULL DEFAULT 'Paga al motorizado en efectivo (USD/Bs) al recibir tu delivery',
    efectivo_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    transferencia_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    transferencia_data TEXT NOT NULL DEFAULT 'Banesco Cuenta Corriente - 0134-1122-33-4455667788 - Marketo C.A. - RIF J-50123456-7',
    transferencia_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    tasa_cambio NUMERIC(10,2) NOT NULL DEFAULT 36.50,
    logo_url TEXT DEFAULT '',
    theme_color VARCHAR(10) NOT NULL DEFAULT '#f8f7fa',
    favicon_url TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    categories TEXT[] DEFAULT ARRAY['Lácteos y Quesos', 'Carnes y Aves', 'Charcutería', 'Frutas y Verduras', 'Víveres y Despensa', 'Panadería y Pastelería', 'Bebidas y Jugos', 'Snacks y Dulces']::TEXT[],
    esta_abierta BOOLEAN NOT NULL DEFAULT TRUE,
    mensaje_cierre TEXT DEFAULT 'Hoy no trabajamos. Volveremos pronto.'
);

-- Asegurarse de que las columnas existan por si la tabla ya estaba creada con la otra versión
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS tienda_lat NUMERIC(10, 6) NOT NULL DEFAULT 10.198300;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS tienda_lng NUMERIC(10, 6) NOT NULL DEFAULT -68.004400;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_1 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_2 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_3 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT ARRAY['Lácteos y Quesos', 'Carnes y Aves', 'Charcutería', 'Frutas y Verduras', 'Víveres y Despensa', 'Panadería y Pastelería', 'Bebidas y Jugos', 'Snacks y Dulces']::TEXT[];
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS delivery_gratis BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS esta_abierta BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO store_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. usuarios_clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_clientes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    telefono VARCHAR(20) UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios_clientes ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
-- ----------------------------------------------------------------------------
-- 3. products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    categoria TEXT NOT NULL DEFAULT 'Víveres y Despensa',
    seccion TEXT DEFAULT '',
    subseccion TEXT DEFAULT '',
    marca TEXT DEFAULT 'Genérica',
    condicion VARCHAR(20) NOT NULL DEFAULT 'Nacional',
    anio_inicio INTEGER DEFAULT 2026,
    anio_fin INTEGER DEFAULT 2026,
    precio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    imagen_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    es_promo BOOLEAN NOT NULL DEFAULT FALSE,
    es_nuevo BOOLEAN NOT NULL DEFAULT TRUE,
    es_mas_vendido BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_gratis BOOLEAN NOT NULL DEFAULT FALSE,
    detalle_adicional TEXT DEFAULT '',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    disponibilidad TEXT DEFAULT 'Disponible', -- 'Disponible', 'Agotado', 'En Reposición'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS disponibilidad TEXT DEFAULT 'Disponible';
-- ----------------------------------------------------------------------------
-- 4. orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    cliente_email TEXT,
    cliente_uid TEXT,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    direccion_envio TEXT DEFAULT '',
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    distancia_km NUMERIC(8, 2) DEFAULT 0,
    items JSONB DEFAULT '[]',
    subtotal_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_envio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    descuento_cupon_usd NUMERIC(10,2) DEFAULT 0.00,
    cupon_codigo TEXT,
    total_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_bs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    tiempo_estimado_entrega TEXT DEFAULT '',
    notas_admin TEXT DEFAULT '',
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cliente_uid TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS descuento_cupon_usd NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cupon_codigo TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notas_admin TEXT DEFAULT '';

-- ----------------------------------------------------------------------------
-- 4.6 push_subscriptions (SISTEMA DE NOTIFICACIONES PUSH)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth_secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- ----------------------------------------------------------------------------
-- 4.5 coupons (SISTEMA DE FIDELIZACIÓN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'todos',
    destinatario_telefono VARCHAR(20) DEFAULT '',
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5.5 FUNCIONES Y TRIGGERS (AUTOMATIZACIÓN)
-- ----------------------------------------------------------------------------

-- Función para sincronizar perfiles automáticamente desde Auth
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios_clientes (id, nombre, email, telefono, contrasena)
    VALUES (
        NEW.id::text,
        COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario Nuevo'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
        'auth_managed' -- La contraseña real vive en auth.users
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de Sincronización (Ejecuta como superuser)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Política de inserción para usuarios_clientes (Respaldo para inserción manual si se requiere)
DROP POLICY IF EXISTS "Permitir inserción anonima" ON usuarios_clientes;
CREATE POLICY "Permitir inserción anonima" ON usuarios_clientes 
FOR INSERT WITH CHECK (true);


-- Función robusta para acciones post-pedido (Stock, Cupones y Notificaciones Automáticas)
CREATE OR REPLACE FUNCTION public.handle_new_order_actions()
RETURNS TRIGGER AS $$
DECLARE
    item_json jsonb;
    v_part_id uuid;
    v_cantidad int;
    v_notif_id text;
BEGIN
    -- 1. Procesar Stock con resiliencia de mapeo
    FOR item_json IN SELECT jsonb_array_elements(NEW.items)
    LOOP
        BEGIN
            -- Intentar mapear múltiples posibles nombres de campos del frontend
            v_part_id := (COALESCE(item_json->>'part_id', item_json->>'id', item_json->>'producto_id'))::uuid;
            v_cantidad := (COALESCE(item_json->>'cantidad', item_json->>'quantity', item_json->>'qty'))::int;

            IF v_part_id IS NOT NULL THEN
                UPDATE public.products
                SET stock = GREATEST(0, stock - v_cantidad)
                WHERE id = v_part_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Logear error pero no romper la transacción del pedido
            RAISE WARNING 'Error actualizando stock para item %: %', v_part_id, SQLERRM;
        END;
    END LOOP;

    -- 2. Gestión de Cupones
    IF NEW.cupon_codigo IS NOT NULL THEN
        UPDATE public.coupons
        SET usage_count = usage_count + 1
        WHERE code = NEW.cupon_codigo;
    END IF;

    -- 3. Inserción Automática de Notificación (Atomicidad asegurada)
    v_notif_id := 'notif-' || encode(gen_random_bytes(6), 'hex');
    
    INSERT INTO public.notifications (
        id, 
        titulo, 
        mensaje, 
        fecha, 
        tipo, 
        destinatario_telefono, 
        leida
    ) VALUES (
        v_notif_id,
        'Nuevo Pedido: ' || NEW.id,
        'El cliente ' || NEW.cliente_nombre || ' ha realizado una compra por $' || NEW.total_usd,
        to_char(NOW(), 'DD/MM/YYYY HH24:MI'),
        'admin',
        '', -- Vacío para que no se filtre hacia el panel del cliente
        FALSE
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- En caso de error fatal, permitimos que el pedido se cree pero notificamos el fallo
    RAISE WARNING 'Fallo crítico en trigger handle_new_order_actions: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reiniciar el trigger
DROP TRIGGER IF EXISTS trigger_order_completion ON public.orders;
CREATE TRIGGER trigger_order_completion
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_order_actions();

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS RLS Y SEGURIDAD
-- ----------------------------------------------------------------------------
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Permisos base (evitan 401 por privilegios)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

DO $$
DECLARE
  p_record RECORD;
BEGIN

  -- ============================
  -- store_config
  -- ============================
  DROP POLICY IF EXISTS "Lectura config publica" ON store_config;
  CREATE POLICY "Lectura config publica" ON store_config FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Escritura config admin" ON store_config;
  DROP POLICY IF EXISTS "Allow all updates only to admin" ON store_config;
  CREATE POLICY "Allow all updates only to admin" ON store_config 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com');

  -- ============================
  -- products (RLS para Stock y CRUD)
  -- ============================
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Lectura productos activos') THEN
    CREATE POLICY "Lectura productos activos" ON products FOR SELECT USING (activo = true);
  END IF;

  DROP POLICY IF EXISTS "Gestion productos admin" ON products;
  DROP POLICY IF EXISTS "Allow admin changes to catalog" ON products;
  CREATE POLICY "Allow admin changes to catalog" ON products 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com');

  -- ============================
  -- orders (IMPORTANTE)
  -- ============================
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_insert_allow_anon') THEN
    CREATE POLICY "orders_insert_allow_anon" ON orders FOR INSERT WITH CHECK (true);
  END IF;

  -- Política de lectura optimizada para Admin y Clientes
  DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
  CREATE POLICY "orders_select_own_or_admin" ON orders 
    FOR SELECT 
    USING (
      auth.uid()::text = cliente_uid 
      OR 
      (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR
      (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    );

  -- Política de actualización para Admin (necesaria para cambiar status)
  DROP POLICY IF EXISTS "orders_update_admin" ON orders;
  CREATE POLICY "orders_update_admin" ON orders 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com');

  -- ============================
  -- usuarios_clientes
  -- ============================
  DROP POLICY IF EXISTS "Lectura propia" ON usuarios_clientes;
  CREATE POLICY "Admin lee todos los clientes" ON usuarios_clientes 
    FOR SELECT TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  CREATE POLICY "Cliente lee su propio perfil" ON usuarios_clientes 
    FOR SELECT TO authenticated 
    USING (auth.uid()::text = id);

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios_clientes' AND policyname='Update propio') THEN
    CREATE POLICY "Update propio" ON usuarios_clientes FOR UPDATE TO authenticated USING (auth.uid()::text = id);
  END IF;

  -- ============================
  -- notifications (IMPORTANTE)
  -- ============================
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_insert_allow_anon') THEN
    CREATE POLICY "notifications_insert_allow_anon" ON notifications
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  DROP POLICY IF EXISTS "notifications_select_allow_all" ON notifications;
  DROP POLICY IF EXISTS "Lectura de notificaciones" ON notifications;
  CREATE POLICY "Lectura de notificaciones" ON notifications
    FOR SELECT TO anon, authenticated 
    USING (
      tipo = 'todos' 
      OR (tipo = 'personal' AND destinatario_telefono = (SELECT telefono FROM usuarios_clientes WHERE id = auth.uid()::text))
      OR (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    );

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_update_allow_all') THEN
    CREATE POLICY "notifications_update_allow_all" ON notifications
      FOR UPDATE
      TO anon, authenticated USING (true);
  END IF;

  -- ============================
  -- coupons
  -- ============================
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='Lectura cupones publica') THEN
    CREATE POLICY "Lectura cupones publica" ON coupons FOR SELECT TO anon, authenticated USING (active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='Gestion cupones admin') THEN
    CREATE POLICY "Gestion cupones admin" ON coupons FOR ALL TO authenticated USING (true);
  END IF;

  -- ============================
  -- push_subscriptions
  -- ============================
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='manage_own_push_subscriptions') THEN
    ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "manage_own_push_subscriptions" ON public.push_subscriptions
      FOR ALL 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;

END $$;

-- ----------------------------------------------------------------------------
-- 7. DATOS INICIALES (PRODUCTOS DE EJEMPLO)
-- ----------------------------------------------------------------------------
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional)
VALUES 
('LCT-LECH-964', 'Leche Liquida Entera Campestre 1L', 'Leche entera de vaca pasteurizada premium.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Leches y Cremas', 'Campestre', 'Nacional', 2000, 2026, 1.80, 50, ARRAY['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=500'], true, false, true, true, '100% Leche fresca.'),
('LCT-QUES-GOU', 'Queso Amarillo Tipo Gouda 500g', 'Queso amarillo gouda premium madurado.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Quesos y Embutidos', 'Torondoy', 'Nacional', 2000, 2026, 6.50, 15, ARRAY['https://images.unsplash.com/photo-1486299267070-8382e21b471a?auto=format&fit=crop&q=80&w=500'], true, false, false, true, 'Maduracion de 45 dias.'),
('LCT-YOGU-GRI', 'Yogur Griego Natural 500g', 'Yogur griego cremoso alto en proteinas.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Yogures y Postres', 'ValleFresco', 'Nacional', 2000, 2026, 3.90, 25, ARRAY['https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=500'], false, true, true, false, 'Sin azucar añadida.'),
('CRN-RIBE-ANG', 'Ribeye de Carne Premium Angus 400g', 'Corte selecto Ribeye de res Angus.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Cortes Vacunos', 'Angus Gold', 'Nacional', 2000, 2026, 14.90, 12, ARRAY['https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=500'], false, false, true, false, 'Empacado al vacio.'),
('CRN-PECH-POL', 'Pechuga de Pollo 1kg', 'Pechuga de pollo fresca, deshuesada.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Aves y Pollo', 'GranjaSol', 'Nacional', 2000, 2026, 5.80, 25, ARRAY['https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=500'], true, false, false, true, 'Libre de hormonas.'),
('CHRC-SERR-JAM', 'Jamon Serrano Reserva 150g', 'Jamon serrano curado artesanalmente.', 'Charcutería', 'Pasillo 1 - Lacteos', 'Quesos y Embutidos', 'Campestre', 'Nacional', 2000, 2026, 8.20, 20, ARRAY['https://images.unsplash.com/photo-1524438418049-b04be11b576d?auto=format&fit=crop&q=80&w=500'], false, true, true, false, 'Listo para consumir.'),
('FRV-FRES-MER', 'Fresas Organicas 500g', 'Fresas organicas cosechadas en Merida.', 'Frutas y Verduras', 'Pasillo 2 - Frescos', 'Frutas y Vegetales', 'ValleFresco', 'Nacional', 2000, 2026, 4.20, 18, ARRAY['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=500'], true, true, false, false, 'Lavar bien antes de consumir.'),
('DSP-OLIV-ESP', 'Aceite de Oliva Extra Virgen 500ml', 'Aceite de oliva prensado en frio.', 'Víveres y Despensa', 'Pasillo 3 - Despensa', 'Aceites y Abarrotes', 'Carbonell', 'Importado', 2000, 2026, 9.50, 40, ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500'], false, true, true, false, 'Importado de España.'),
('PAN-BAGU-ART', 'Pan Baguette Masa Madre 250g', 'Pan tipo baguette artesanal.', 'Panadería y Pastelería', 'Pasillo 4 - Panaderia', 'Panes Frescos', 'El Rey', 'Nacional', 2000, 2026, 1.20, 40, ARRAY['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=500'], true, true, false, false, 'Corteza crujiente.'),
('SNC-CHOC-DAR', 'Chocolate Oscuro 70% Cacao 80g', 'Chocolate gourmet 70% cacao Carenero.', 'Snacks y Dulces', 'Pasillo 3 - Despensa', 'Confiteria y Snacks', 'El Rey', 'Nacional', 2000, 2026, 3.50, 50, ARRAY['https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=500'], true, true, true, false, 'Cacao venezolano.')
ON CONFLICT (codigo) DO NOTHING;
-- ==========================================================================
-- CONFIGURACIÓN DE REALTIME (COMPATIBLE CON PLAN GRATUITO)
-- ==========================================================================

-- 1. Asegurar que la publicación exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Agregar tablas a la publicación para escuchar cambios (CDC)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==========================================================================
-- MANTENIMIENTO AUTOMÁTICO (LIMPIEZA DE NOTIFICACIONES ANTIGUAS)
-- ==========================================================================

-- 1. Crear la función de limpieza
CREATE OR REPLACE FUNCTION public.delete_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con privilegios de creador para evitar problemas de RLS
AS $$
BEGIN
  -- Eliminamos notificaciones de más de 15 días para ahorrar espacio en el plan gratuito
  -- Puedes ajustar el intervalo a '30 days' si prefieres conservar más historial
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '15 days';

  -- Eliminamos pedidos cancelados de más de 3 meses
  -- Esto ayuda a mantener la tabla de orders ligera y eficiente
  DELETE FROM public.orders
  WHERE status = 'Cancelado'
  AND created_at < NOW() - INTERVAL '3 months';
END;
$$;

-- 2. Programación de la tarea (Requiere extensión pg_cron)
-- Nota: Para que esto funcione, debes habilitar 'pg_cron' en el dashboard de Supabase:
-- Database -> Extensions -> Buscar 'pg_cron' y activarlo.

-- Una vez activado, ejecuta manualmente esta línea en el SQL Editor:
-- SELECT cron.schedule('limpiar-notificaciones-diario', '0 0 * * *', 'SELECT public.delete_old_notifications()');
