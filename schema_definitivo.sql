-- ==========================================================================
-- SCRIPT DE ESQUEMA DEFINITIVO PARA MARKETO PWA
-- ESTADO: OPTIMIZADO PARA PRODUCCIÓN (VAPID + PUSH WEBHOOK)
-- ==========================================================================

-- Habilitar extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Habilitar extensión para peticiones HTTP (Motor Push)
CREATE EXTENSION IF NOT EXISTS pg_net;

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
    tasa_cambio NUMERIC(10,2) NOT NULL DEFAULT 612.43,
    logo_url TEXT DEFAULT '',
    theme_color VARCHAR(10) NOT NULL DEFAULT '#ffffff',
    favicon_url TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    categories TEXT[] DEFAULT ARRAY['Lácteos y Quesos', 'Carnes y Aves', 'Charcutería', 'Frutas y Verduras', 'Víveres y Despensa', 'Panadería y Pastelería', 'Bebidas y Jugos', 'Snacks y Dulces']::TEXT[],
    esta_abierta BOOLEAN NOT NULL DEFAULT TRUE,
    mensaje_cierre TEXT DEFAULT 'Hoy no trabajamos. Volveremos pronto.',
    mensaje_bienvenida TEXT DEFAULT 'Encuentra los mejores cortes de carne, quesos madurados y viveres frescos con delivery express en Valencia.',
    push_webhook_url TEXT DEFAULT 'https://market-cbh.pages.dev/api/push-notify',
    push_webhook_secret TEXT DEFAULT '5fca5a4d8825d4de66811590f47af870b01d45e80f391920f4ea76a59ae3c8bf'
);

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
    disponibilidad TEXT DEFAULT 'Disponible',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- ----------------------------------------------------------------------------
-- 4.6 push_subscriptions (SISTEMA DE NOTIFICACIONES PUSH)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth_secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endpoint)
);

-- Agregar columna telefono para filtrar por destinatario (si no existe)
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS destinatario_telefono TEXT DEFAULT '';

-- Agregar columna anonymous_id para identificar dispositivos sin login
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS anonymous_id TEXT DEFAULT '';

-- Función RPC para que el admin pueda leer TODAS las suscripciones push
-- (necesario porque RLS filtra por auth.uid = user_id, aislando cada usuario)
CREATE OR REPLACE FUNCTION public.get_all_push_subscriptions()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    endpoint TEXT,
    p256dh TEXT,
    auth_secret TEXT,
    destinatario_telefono TEXT,
    anonymous_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- SECURITY DEFINER ejecuta con privilegios del creador (superusuario/service_role)
    -- que puede ver todas las filas sin filtro RLS.
    RETURN QUERY
    SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth_secret, ps.destinatario_telefono, ps.anonymous_id, ps.created_at
    FROM public.push_subscriptions ps;
END;
$$;

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
    imagen_url TEXT DEFAULT '',
    link_url TEXT DEFAULT '',
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Función para incrementar el contador de clics de una notificación de forma segura
CREATE OR REPLACE FUNCTION public.increment_notification_click(notif_id TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.notifications
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = notif_id;
END;
$$;


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
        'auth_managed'
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
    v_admin_phone text;
BEGIN
    FOR item_json IN SELECT jsonb_array_elements(NEW.items)
    LOOP
        BEGIN
            v_part_id := (COALESCE(item_json->>'part_id', item_json->>'id', item_json->>'producto_id'))::uuid;
            v_cantidad := (COALESCE(item_json->>'cantidad', item_json->>'quantity', item_json->>'qty'))::int;

            IF v_part_id IS NOT NULL THEN
                UPDATE public.products
                SET stock = GREATEST(0, stock - v_cantidad)
                WHERE id = v_part_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error actualizando stock para item %: %', v_part_id, SQLERRM;
        END;
    END LOOP;

    IF NEW.cupon_codigo IS NOT NULL THEN
        UPDATE public.coupons
        SET usage_count = usage_count + 1
        WHERE code = NEW.cupon_codigo;
    END IF;

    v_notif_id := 'notif-' || encode(gen_random_bytes(6), 'hex');
    
    SELECT telefono_soporte INTO v_admin_phone FROM public.store_config WHERE id = 1;

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
        COALESCE(v_admin_phone, ''), 
        FALSE
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
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

-- Función para notificar automáticamente cambios de estado de pedidos
CREATE OR REPLACE FUNCTION public.handle_order_status_push_update()
RETURNS TRIGGER AS $$
DECLARE
    v_notif_id text;
    v_mensaje text;
    v_admin_phone text;
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'En camino' THEN
        
        v_notif_id := 'notif-status-' || encode(gen_random_bytes(6), 'hex');
        v_mensaje := '¡Buenas noticias, ' || NEW.cliente_nombre || '! Tu pedido ' || NEW.id || ' ya ha sido despachado y se dirige a tu ubicación.';

        INSERT INTO public.notifications (
            id, 
            titulo, 
            mensaje, 
            fecha, 
            tipo, 
            destinatario_telefono, 
            link_url,
            leida
        ) VALUES (
            v_notif_id,
            '¡Pedido en camino!',
            v_mensaje,
            to_char(NOW(), 'DD/MM/YYYY HH24:MI'),
            'personal',
            NEW.cliente_telefono,
            '/?tab=profile',
            FALSE
        );
    
    ELSIF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'Cancelado' THEN
        
        SELECT telefono_soporte INTO v_admin_phone FROM public.store_config WHERE id = 1;
        v_notif_id := 'notif-cancel-' || encode(gen_random_bytes(6), 'hex');
        v_mensaje := 'El pedido ' || NEW.id || ' de ' || NEW.cliente_nombre || ' ha sido cancelado.';

        INSERT INTO public.notifications (
            id, 
            titulo, 
            mensaje, 
            fecha, 
            tipo, 
            destinatario_telefono, 
            link_url,
            leida
        ) VALUES (
            v_notif_id,
            'Pedido Cancelado',
            v_mensaje,
            to_char(NOW(), 'DD/MM/YYYY HH24:MI'),
            'admin',
            COALESCE(v_admin_phone, ''),
            '/admin',
            FALSE
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador para cambios de estado en pedidos
DROP TRIGGER IF EXISTS trigger_order_status_update_push ON public.orders;
CREATE TRIGGER trigger_order_status_update_push
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_push_update();

-- ----------------------------------------------------------------------------
-- 5.6 FUNCIONES Y TRIGGERS DE NOTIFICACIONES PUSH (WEBHOOK A CLOUDFLARE)
-- ----------------------------------------------------------------------------

-- Asegurar que el bucket de configuración exista para evitar el error 400
INSERT INTO storage.buckets (id, name, public) 
VALUES ('settings', 'settings', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir subidas públicas al bucket settings (necesario para el logo/favicon)
DROP POLICY IF EXISTS "Permitir subida de logos al admin" ON storage.objects;
CREATE POLICY "Permitir subida de logos al admin" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'settings');

DROP POLICY IF EXISTS "Permitir lectura publica de logos" ON storage.objects;
CREATE POLICY "Permitir lectura publica de logos" ON storage.objects
FOR SELECT USING (bucket_id = 'settings');

-- Función para invocar el webhook de Cloudflare Functions con la notificación
CREATE OR REPLACE FUNCTION public.handle_new_notification_push()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_webhook_secret TEXT;
BEGIN
  SELECT push_webhook_url, push_webhook_secret 
  INTO v_webhook_url, v_webhook_secret 
  FROM public.store_config 
  WHERE id = 1;

  IF v_webhook_url IS NOT NULL AND v_webhook_url <> '' AND NEW.tipo IN ('todos', 'personal', 'admin', 'request') THEN
    PERFORM net.http_post(
      url := v_webhook_url,
      body := jsonb_build_object(
        'title', NEW.titulo,
        'body', NEW.mensaje,
        'icon', COALESCE(NEW.imagen_url, '/icon.png'),
        'badge', '/icon.png',
        'sound', 'default',
        'vibrate', ARRAY[200, 100, 200],
        'tag', 'marketo-' || NEW.id,
        'url', COALESCE(NEW.link_url, '/'),
        'record', jsonb_build_object(
          'id', NEW.id,
          'title', NEW.titulo,
          'body', NEW.mensaje,
          'icon', COALESCE(NEW.imagen_url, '/icon.png'),
          'tag', 'marketo-' || NEW.id,
          'renotify', true,
          'vibrate', ARRAY[200, 100, 200],
          'sound', 'default',
          'badge', '/icon.png',
          'titulo', NEW.titulo,
          'mensaje', NEW.mensaje,
          'imagen_url', COALESCE(NEW.imagen_url, ''),
          'link_url', COALESCE(NEW.link_url, '/'),
          'tipo', NEW.tipo,
          'destinatario_telefono', COALESCE(NEW.destinatario_telefono, '')
        )
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-webhook-secret', COALESCE(v_webhook_secret, '')
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'No se pudo invocar webhook de push: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para invocar webhook al insertar notificación (después del insert)
DROP TRIGGER IF EXISTS trigger_notify_push ON public.notifications;
CREATE TRIGGER trigger_notify_push
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_notification_push();

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS RLS Y SEGURIDAD
-- ----------------------------------------------------------------------------
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Permisos base
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON store_config, products, notifications, coupons, usuarios_clientes TO anon;
GRANT SELECT, INSERT, UPDATE ON orders TO anon;
GRANT SELECT, INSERT, UPDATE ON push_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

DO $$
DECLARE
  p_record RECORD;
BEGIN

  -- store_config
  DROP POLICY IF EXISTS "Lectura config publica" ON store_config;
  CREATE POLICY "Lectura config publica" ON store_config FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Escritura config admin" ON store_config;
  DROP POLICY IF EXISTS "Allow all updates only to admin" ON store_config;
  CREATE POLICY "Allow all updates only to admin" ON store_config 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- products
  DROP POLICY IF EXISTS "Lectura productos activos" ON products;
  CREATE POLICY "Lectura productos activos" ON products
    FOR SELECT
    USING (
      activo = true
      OR (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    );

  DROP POLICY IF EXISTS "Gestion productos admin" ON products;
  DROP POLICY IF EXISTS "Allow admin changes to catalog" ON products;
  CREATE POLICY "Allow admin changes to catalog" ON products 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_insert_allow_anon') THEN
    DROP POLICY IF EXISTS "orders_insert_allow_anon" ON orders;
    CREATE POLICY "orders_insert_allow_anon" ON orders FOR INSERT WITH CHECK (true);
  END IF;

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

  DROP POLICY IF EXISTS "orders_update_admin" ON orders;
  CREATE POLICY "orders_update_admin" ON orders 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- usuarios_clientes
  DROP POLICY IF EXISTS "Lectura propia" ON usuarios_clientes;
  DROP POLICY IF EXISTS "Admin lee todos los clientes" ON usuarios_clientes;
  CREATE POLICY "Admin lee todos los clientes" ON usuarios_clientes 
    FOR SELECT TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  DROP POLICY IF EXISTS "Cliente lee su propio perfil" ON usuarios_clientes;
  CREATE POLICY "Cliente lee su propio perfil" ON usuarios_clientes 
    FOR SELECT TO authenticated 
    USING (auth.uid()::text = id);

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios_clientes' AND policyname='Update propio') THEN
    CREATE POLICY "Update propio" ON usuarios_clientes FOR UPDATE TO authenticated USING (auth.uid()::text = id);
  END IF;

  DROP POLICY IF EXISTS "Admin gestiona todos los clientes" ON usuarios_clientes;
  CREATE POLICY "Admin gestiona todos los clientes" ON usuarios_clientes
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_insert_allow_anon') THEN
    CREATE POLICY "notifications_insert_allow_anon" ON notifications
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  DROP POLICY IF EXISTS "notifications_select_allow_all" ON notifications;
  DROP POLICY IF EXISTS "Lectura de notificaciones" ON notifications;
  CREATE POLICY "Lectura de notificaciones" ON notifications
    FOR SELECT TO anon, authenticated USING (
      tipo = 'todos'
      OR tipo = 'admin'
      OR (tipo = 'personal' AND destinatario_telefono IS NOT NULL AND destinatario_telefono != '')
      OR (tipo = 'request' AND destinatario_telefono IS NOT NULL AND destinatario_telefono != '')
    );

  DROP POLICY IF EXISTS "notifications_update_allow_all" ON notifications;
  CREATE POLICY "notifications_update_allow_all" ON notifications
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

  -- coupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='Lectura cupones publica') THEN
    CREATE POLICY "Lectura cupones publica" ON coupons FOR SELECT TO anon, authenticated USING (active = true);
  END IF;

  DROP POLICY IF EXISTS "Gestion cupones admin" ON coupons;
  CREATE POLICY "Gestion cupones admin" ON coupons 
    FOR ALL TO authenticated 
    USING (
      (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    )
    WITH CHECK (
      (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    );

  -- push_subscriptions
  ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "manage_own_push_subscriptions" ON public.push_subscriptions;
  CREATE POLICY "manage_own_push_subscriptions" ON public.push_subscriptions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

  DROP POLICY IF EXISTS "allow_anonymous_push_subscriptions" ON public.push_subscriptions;
  CREATE POLICY "allow_anonymous_push_subscriptions" ON public.push_subscriptions
    FOR INSERT TO anon WITH CHECK (user_id IS NULL);

  DROP POLICY IF EXISTS "allow_anonymous_push_update" ON public.push_subscriptions;
  CREATE POLICY "allow_anonymous_push_update" ON public.push_subscriptions
    FOR UPDATE TO anon USING (user_id IS NULL);

END $$;

-- ----------------------------------------------------------------------------
-- 7. PRODUCTOS (60 productos de supermercado venezolano)
-- Ejecutar cada bloque por separado si da error de tamaño
-- ----------------------------------------------------------------------------

-- BLOQUE 1: LACTEOS Y QUESOS (10 productos)
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo, disponibilidad) VALUES
('LAC-001', 'Leche Entera Tropical 1L', 'Leche entera pasteurizada de vaca, ideal para el desayuno y preparar cafés. Rica en calcio y proteínas.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Leches', 'Tropical', 'Nacional', 7, 4, 1.85, 120, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000005174/ImgThumb.jpg'], false, false, true, false, 'Pasteurizada. Mantener refrigerada.', true, 'Disponible'),
('LAC-002', 'Queso Blanco Rallado Mavesa 500g', 'Queso blanco rallado ideal para arepas, pastas y ensaladas. Sabor suave y textura perfecta para cocinar.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Quesos', 'Mavesa', 'Nacional', 30, 4, 3.20, 85, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000005769/ImgThumb.jpg'], false, false, true, false, 'Pasteurizado. Refrigerar entre 0-4°C.', true, 'Disponible'),
('LAC-003', 'Yogurt Natural Yoka 170g', 'Yogurt natural con cultivos vivos activos. Fuente de probióticos para tu sistema digestivo.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Yogurt', 'Yoka', 'Nacional', 21, 4, 0.85, 200, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000030091/ImgThumb.jpg'], true, false, false, false, 'Conservar refrigerado. Producto natural sin conservantes.', true, 'Disponible'),
('LAC-004', 'Mantequilla Mavesa 500g', 'Mantequilla cremosa perfecta para untar, repostería y cocinar. Sabor irresistible.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Mantequilla', 'Mavesa', 'Nacional', 90, 4, 4.50, 60, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000005772/ImgThumb.jpg'], false, true, false, false, 'Mantener refrigerada. Ideal para repostería.', true, 'Disponible'),
('LAC-005', 'Crema de Leche Nestlé 200ml', 'Crema de leche espesa para preparar postres, salsas y adornar café. Textura suave y cremosa.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Cremas', 'Nestlé', 'Importado', 180, 4, 2.10, 75, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000101745/ImgThumb.jpg'], false, false, false, false, 'UHT. Abierto conservar refrigerado y consumir en 3 días.', true, 'Disponible'),
('LAC-006', 'Queso Amarillo en Lonchas Kraft 200g', 'Queso amarillo en lonchas individuales, perfecto para sándwiches, hamburguesas y crackers.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Quesos', 'Kraft', 'Importado', 120, 4, 3.80, 50, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000145724/ImgThumb.jpg'], false, false, false, false, 'Pasteurizado. Producto importado.', true, 'Disponible'),
('LAC-007', 'Leche Deslactosada Parmalat 1L', 'Leche deslactosada para personas con intolerancia a la lactosa. Mismo sabor y nutrientes.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Leches', 'Parmalat', 'Nacional', 7, 4, 2.10, 90, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000166553/ImgThumb.jpg'], false, true, false, false, 'UHT. No requiere refrigeración hasta abrir.', true, 'Disponible'),
('LAC-008', 'Queso Crema Philadelphia 340g', 'Queso crema Philly suave y cremoso para untar, repostería y preparar salsas de queso.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Quesos', 'Philadelphia', 'Importado', 90, 4, 5.20, 40, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000027335/ImgThumb.jpg'], false, false, true, false, 'Producto importado. Mantener refrigerado.', true, 'Disponible'),
('LAC-009', 'Yogurt Batido Fresa Yukery 170g', 'Yogurt batido con sabor a fresa, textura cremosa y sabor dulce natural. Ideal para snacks.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Yogurt', 'Yukery', 'Nacional', 21, 4, 0.90, 150, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000030092/ImgThumb.jpg'], false, false, false, false, 'Conservar refrigerado. Agitar antes de consumir.', true, 'Disponible'),
('LAC-010', 'Requesón Santa Bárbara 250g', 'Requeso fresco y suave ideal para preparar hallaquitas, pasteles y postres tradicionales.', 'Lácteos y Quesos', 'Pasillo 1 - Lacteos', 'Quesos', 'Santa Bárbara', 'Nacional', 14, 4, 1.75, 65, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000147299/ImgThumb.jpg'], false, false, false, false, 'Fresco. Refrigerar y consumir rápido.', true, 'Disponible')
ON CONFLICT (codigo) DO NOTHING;

-- BLOQUE 2: CARNES Y AVES (8 productos)
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo, disponibilidad) VALUES
('CAR-001', 'Pechuga de Pollo Congelada 1kg', 'Pechuga de pollo entera sin hueso ni piel. Ideal para asar, freír, hervir o preparar ensaladas.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Pollo', 'Presa Fresca', 'Nacional', 180, -18, 4.50, 80, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000163389/ImgThumb.jpg'], false, false, true, false, 'Congelado. Descongelar en refrigerador antes de usar.', true, 'Disponible'),
('CAR-002', 'Carne Molida de Res 500g', 'Carne molida de res magra, ideal para preparar boloñesa, hamburguesas, albondigas y rellenos.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Res', 'Presa Fresca', 'Nacional', 3, -18, 5.80, 55, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000157684/ImgThumb.jpg'], true, false, true, false, 'Congelado. Caducidad: 6 meses desde producción.', true, 'Disponible'),
('CAR-003', 'Muslos de Pollo Congelados 1kg', 'Muslos de pollo con hueso y piel, perfectos para asar al horno, guisar o preparar fritos.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Pollo', 'Presa Fresca', 'Nacional', 180, -18, 3.20, 95, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000163390/ImgThumb.jpg'], false, false, false, false, 'Congelado. Productos 100% nacionales.', true, 'Disponible'),
('CAR-004', 'Costillas de Cerdo 1kg', 'Costillas de cerdo frescas para BBQ, horno o parrilla. Carnosa y jugosa.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Cerdo', 'Presa Fresca', 'Nacional', 5, -18, 7.50, 40, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000144097/ImgThumb.jpg'], false, true, false, false, 'Refrigerado. Consumir antes de 3 días.', true, 'Disponible'),
('CAR-005', 'Albóndigas de Pollo Congeladas 400g', 'Albóndigas precocidas de pollo con especias. Listas para caldos, salsas y pastas.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Pollo', 'Presa Fresca', 'Nacional', 120, -18, 3.90, 70, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000027049/ImgThumb.jpg'], false, true, false, false, 'Congelado. Precocidas - solo recalentar.', true, 'Disponible'),
('CAR-006', 'Punta de Anca 1kg', 'Corte premium de res para asar a la plancha o al horno. Tierna y jugosa, ideal para occasions especiales.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Res', 'Presa Fresca', 'Nacional', 3, -18, 9.80, 30, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000163390/ImgThumb.jpg'], false, false, true, false, 'Corte premium. Recomendado punto a punto.', true, 'Disponible'),
('CAR-007', 'Pechuga de Pollo Empanizada 500g', 'Pechuga de pollo empanizada y precocida, lista para freír u hornear en minutos.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Pollo', 'Presa Fresca', 'Nacional', 90, -18, 5.20, 45, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000027049/ImgThumb.jpg'], false, true, false, false, 'Congelado. Freír con aceite caliente o horno a 200°C.', true, 'Disponible'),
('CAR-008', 'Chuletas de Cerdo 1kg', 'Chuletas de cerdo frescas con hueso, perfectas para la parrilla, plancha u horno.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Cerdo', 'Presa Fresca', 'Nacional', 5, -18, 6.30, 50, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000144097/ImgThumb.jpg'], false, false, false, false, 'Refrigerado. Aromatizar con ajo y limón.', true, 'Disponible')
ON CONFLICT (codigo) DO NOTHING;

-- BLOQUE 3: CHARCUTERIA (8 productos)
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo, disponibilidad) VALUES
('CHA-001', 'Jamón de Pavo Cooked 200g', 'Lonchas de jamón de pavo bajo en grasa, ideal para sándwiches y ensaladas saludables.', 'Charcutería', 'Pasillo 3 - Charcuteria', 'Jamones', 'Armador', 'Nacional', 45, 4, 3.50, 60, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000003161/ImgThumb.jpg'], false, false, false, false, 'Refrigerar después de abierto. Consumir en 5 días.', true, 'Disponible'),
('CHA-002', 'Salchichón de Pollo Margarita 250g', 'Salchichón ahumado de pollo con especias naturales. Snack perfecto con galletas o pan.', 'Charcutería', 'Pasillo 3 - Charcuteria', 'Embutidos', 'Margarita', 'Nacional', 60, 4, 2.80, 80, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000010254/ImgThumb.jpg'], true, false, true, false, 'Ahumado. Refrigerar después de abierto.', true, 'Disponible'),
('CHA-003', 'Queso de Mano Llanero 300g', 'Queso tradicional llanero, semiduro y ligeramente salado. Perfecto para arepas y golfeados.', 'Charcutería', 'Pasillo 3 - Charcuteria', 'Quesos', 'Artesanal', 'Nacional', 45, 4, 4.20, 35, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000152906/ImgThumb.jpg'], false, false, false, false, 'Artesanal. Producto típico venezolano.', true, 'Disponible'),
('CHA-004', 'Mortadela de Pollo Margarita 300g', 'Mortadela de pollo con trozos de zanahoria y guisantes. Sándwich clásico venezolano.', 'Charcutería', 'Pasillo 3 - Charcuteria', 'Embutidos', 'Margarita', 'Nacional', 45, 4, 2.40, 70, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000010254/ImgThumb.jpg'], false, false, false, false, 'Refrigerar. Producto cocido listo para consumir.', true, 'Disponible'),
('CHA-005', 'Chorizo Español Fresco 250g', 'Chorizo artesanal español, picante y aromático. Ideal para paella, tortilla o a la parrilla.', 'Charcutería', 'Pasillo 3 - Charcuteria', 'Chorizos', 'Artesanal', 'Importado', 30, 4, 5.50, 30, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000027049/ImgThumb.jpg'], false, true, false, false, 'Importado de España. Producto artesanal.', true, 'Disponible'),
('CHA-006', 'Tocineta Ahumada 200g', 'Tocineta ahumada crujiente, sabor intenso para desayunos, pastas y ensaladas.', 'Charcutería', 'Pasillo 3 - Charcuteria', 'Tocinetas', 'Margarita', 'Nacional', 60, 4, 4.80, 55, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000010254/ImgThumb.jpg'], false, false, true, false, 'Ahumada. Freír a fuego medio hasta dorar.', true, 'Disponible'),
('CHA-007', 'Salame Italiano Rodaja 150g', 'Salame italiano importado, sabor robusto y textura fina. Ideal para tablas de quesos y charcutería.', 'Charcutería', 'Pasillo 3 - Charcuteria', 'Embutidos', 'Armador', 'Importado', 90, 4, 6.20, 25, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000003161/ImgThumb.jpg'], false, false, false, false, 'Importado. Envasado al vacío.', true, 'Disponible'),
('CHA-008', 'Queso Guayanés 400g', 'Queso guayanés fresco y suave, ideal para cachapas, arepas y ensaladas tropicales.', 'Charcutería', 'Pasillo 3 - Charcuteria', 'Quesos', 'Artesanal', 'Nacional', 14, 8, 3.80, 40, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000026638/ImgThumb.jpg'], false, false, false, false, 'Fresco. Tradición gastronómica del oriente venezolano.', true, 'Disponible')
ON CONFLICT (codigo) DO NOTHING;

-- BLOQUE 4: FRUTAS Y VERDURAS (8 productos)
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo, disponibilidad) VALUES
('FRU-001', 'Plátano Maduro por Kilo', 'Plátano maduro para freír, hervir o preparar mangú. Dulce y tierno, punto ideal de cocción.', 'Frutas y Verduras', 'Pasillo 4 - Frutas', 'Frutas Frescas', 'Local', 'Nacional', 3, 25, 0.80, 200, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000020833/ImgThumb.jpg'], false, false, true, false, 'Fruta fresca del día. Origen: Valencia, Carabobo.', true, 'Disponible'),
('FRU-002', 'Tomate Italiano por Kilo', 'Tomate italiano maduro para salsas, ensaladas y guisos. Sabor intenso y textura firme.', 'Frutas y Verduras', 'Pasillo 4 - Frutas', 'Verduras', 'Local', 'Nacional', 5, 20, 1.20, 150, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000003179/ImgThumb.jpg'], false, false, false, false, 'Fresco. Lavar antes de consumir.', true, 'Disponible'),
('FRU-003', 'Cebolla Blanca por Kilo', 'Cebolla blanca fresca, base fundamental de la cocina venezolana. Sabor aromático.', 'Frutas y Verduras', 'Pasillo 4 - Frutas', 'Verduras', 'Local', 'Nacional', 30, 20, 0.90, 180, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000020833/ImgThumb.jpg'], false, false, false, false, 'Fresco. Guardar en lugar fresco y seco.', true, 'Disponible'),
('FRU-004', 'Papa Pastusa por Kilo', 'Papa pastusa fresca para hervir, freír o preparar puré. Variedad preferida en Venezuela.', 'Frutas y Verduras', 'Pasillo 4 - Frutas', 'Verduras', 'Local', 'Nacional', 45, 15, 1.50, 160, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000000871/ImgThumb.jpg'], false, false, false, false, 'Fresco. Origen: Estado Táchira.', true, 'Disponible'),
('FRU-005', 'Lechuga Crespa 1/2 Kilo', 'Lechuga crespa fresca y crujiente para ensaladas, sándwiches y garnish.', 'Frutas y Verduras', 'Pasillo 4 - Frutas', 'Verduras', 'Local', 'Nacional', 5, 10, 0.75, 100, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000020845/ImgThumb.jpg'], false, false, false, false, 'Fresca. Lavar y secar antes de preparar.', true, 'Disponible'),
('FRU-006', 'Aguacate Hass por Unidad', 'Aguacate Hass maduro, cremoso y lleno de grasas saludables. Ideal para guacamole y tostadas.', 'Frutas y Verduras', 'Pasillo 4 - Frutas', 'Frutas Frescas', 'Local', 'Nacional', 5, 20, 1.30, 90, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000020819/ImgThumb.jpg'], false, false, true, false, 'Maduración natural. Listo para consumir.', true, 'Disponible'),
('FRU-007', 'Zanahoria por Kilo', 'Zanahoria fresca y dulce, rica en vitamina A. Para jugos, ensaladas, guisos y snacks.', 'Frutas y Verduras', 'Pasillo 4 - Frutas', 'Verduras', 'Local', 'Nacional', 21, 15, 0.70, 140, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000020861/ImgThumb.jpg'], false, false, false, false, 'Fresca. Lavar bien antes de consumir.', true, 'Disponible'),
('FRU-008', 'Limón Tahití por Kilo', 'Limón tahití fresco y jugoso, indispensable en la cocina venezolana para aderezos y bebidas.', 'Frutas y Verduras', 'Pasillo 4 - Frutas', 'Frutas Frescas', 'Local', 'Nacional', 21, 20, 1.10, 130, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000005253/ImgThumb.jpg'], false, false, false, false, 'Fresco. Alto contenido de vitamina C.', true, 'Disponible')
ON CONFLICT (codigo) DO NOTHING;

-- BLOQUE 5: VIVERES Y DESPENSA (10 productos)
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo, disponibilidad) VALUES
('VIV-001', 'Arroz Mary 1kg', 'Arroz blanco largo grano, ideal para acompañar cualquier plato de la comida diaria.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Arroces', 'Mary', 'Nacional', 365, 25, 1.40, 200, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000147733/ImgThumb.jpg'], false, false, true, false, 'Envasado al vacío. Producto 100% nacional.', true, 'Disponible'),
('VIV-002', 'Pasta Spaghetti Mavesa 500g', 'Pasta italiana de trigo durum, cocción perfecta en 8 minutos. Acompaña con tu salsa favorita.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Pastas', 'Mavesa', 'Importado', 365, 25, 1.20, 180, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000006322/ImgThumb.jpg'], false, false, false, false, 'Importada de Italia. Trigo durum de calidad.', true, 'Disponible'),
('VIV-003', 'Aceite Vegetal Mavesa 1L', 'Aceite vegetal refinado multiuso para freír, cocinar y aderezar. Sabor neutro.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Aceites', 'Mavesa', 'Nacional', 365, 25, 3.50, 120, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000009674/ImgThumb.jpg'], false, false, true, false, 'Refinado. Rico en ácidos grasos esenciales.', true, 'Disponible'),
('VIV-004', 'Azúcar Refinada Montalbán 1kg', 'Azúcar blanca refinada para endulzar bebidas, postres y repostería.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Azúcares', 'Montalbán', 'Nacional', 365, 25, 1.60, 200, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000011633/ImgThumb.jpg'], false, false, false, false, 'Envasada. Origen: Guayana, Bolívar.', true, 'Disponible'),
('VIV-005', 'Salsa de Tomate Pampero 400g', 'Salsa de tomate natural para pastas, pizza y guisos. Sabor casero sin conservantes.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Salsas', 'Pampero', 'Nacional', 180, 25, 1.80, 90, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000027887/ImgThumb.jpg'], false, true, false, false, 'Sin conservantes artificiales. Productos naturales.', true, 'Disponible'),
('VIV-006', 'Café Madrid Molido 250g', 'Café molido tostado y seleccionado, aroma intenso y sabor robusto para el café venezolano.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Café', 'Madrid', 'Nacional', 365, 25, 3.20, 100, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000141094/ImgThumb.jpg'], false, false, true, false, 'Tostado artesanal. Origen: El alto, Mérida.', true, 'Disponible'),
('VIV-007', 'Atún Margarita 170g', 'Atún en agua, bajo en grasa y alto en proteína. Ideal para ensaladas, pastas y sándwiches.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Enlatados', 'Margarita', 'Nacional', 1095, 25, 2.50, 110, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000016396/ImgThumb.jpg'], true, false, false, false, 'Enlatado. Rico en omega-3 y proteínas.', true, 'Disponible'),
('VIV-008', 'Mayonesa Mavesa 500g', 'Mayonesa cremosa y suave para ensaladas, sándwiches y acompañamientos. Sabor inigualable.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Aderezos', 'Mavesa', 'Nacional', 180, 25, 2.80, 85, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000010254/ImgThumb.jpg'], false, false, false, false, 'Envasada. Sin colorantes artificiales.', true, 'Disponible'),
('VIV-009', 'Sardina Margarita 170g', 'Sardinas en aceite vegetal, ricas en calcio y ácidos grasos omega-3. Snack nutritivo.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Enlatados', 'Margarita', 'Nacional', 1095, 25, 1.90, 95, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000016396/ImgThumb.jpg'], false, false, false, false, 'Enlatado. Productos del mar venezolanos.', true, 'Disponible'),
('VIV-010', 'Sal Fina Pomar 1kg', 'Sal fina yodatada para cocinar y sazonar. Esencial en toda cocina.', 'Víveres y Despensa', 'Pasillo 5 - Despensa', 'Condimentos', 'Pomar', 'Nacional', 365, 25, 0.60, 250, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000134179/ImgThumb.jpg'], false, false, false, false, 'Yodatada. Productos esenciales.', true, 'Disponible')
ON CONFLICT (codigo) DO NOTHING;

-- BLOQUE 6: PANADERIA Y PASTELERIA (8 productos)
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo, disponibilidad) VALUES
('PAN-001', 'Pan Blanco Sandwich Bimbo 680g', 'Pan blanco tierno y esponjoso para sándwiches, tostadas y desayunos. Favorito de la familia.', 'Panadería y Pastelería', 'Pasillo 6 - Panaderia', 'Panes', 'Bimbo', 'Nacional', 7, 25, 2.50, 150, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000024108/ImgThumb.jpg'], false, false, true, false, 'Envasado. Consumir antes de la fecha indicada.', true, 'Disponible'),
('PAN-002', 'Galletas Oreo Original 154g', 'Galletas de chocolate rellenas de crema vainilla. Snack icónico para toda la familia.', 'Panadería y Pastelería', 'Pasillo 6 - Panaderia', 'Galletas', 'Oreo', 'Importado', 180, 25, 1.80, 200, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000163886/ImgThumb.jpg'], false, false, true, false, 'Importado. Producto premium.', true, 'Disponible'),
('PAN-003', 'Pan integral Multi Cereal 400g', 'Pan integral con múltiples cereales, fibra natural y sabor tostado. Opción saludable.', 'Panadería y Pastelería', 'Pasillo 6 - Panaderia', 'Panes', 'Bimbo', 'Nacional', 5, 25, 3.20, 60, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000024108/ImgThumb.jpg'], false, true, false, false, 'Envasado. Rico en fibra.', true, 'Disponible'),
('PAN-004', 'Torta de Chocolate Margarita 300g', 'Torta de chocolate húmeda y esponjosa, cobertura de ganache. Postre perfecto.', 'Panadería y Pastelería', 'Pasillo 6 - Panaderia', 'Reposteria', 'Margarita', 'Nacional', 7, 25, 4.50, 40, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000002746/ImgThumb.jpg'], false, true, false, false, 'Horneada artesanalmente. Sin conservantes.', true, 'Disponible'),
('PAN-005', 'Cachitos de Jamón x6 unidades', 'Cachitos frescos de hojaldre rellenos de jamón y queso. Desayuno venezolano por excelencia.', 'Panadería y Pastelería', 'Pasillo 6 - Panaderia', 'Panaderia Fresca', 'Artesanal', 'Nacional', 2, 5, 3.80, 30, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000140970/ImgThumb.jpg'], false, false, false, false, 'Horneados frescos cada mañana. Sin conservantes.', true, 'Disponible'),
('PAN-006', 'Galletas Maria Sol 400g', 'Galletas maría tradicionales, crujientes y perfectas para el café o té de la tarde.', 'Panadería y Pastelería', 'Pasillo 6 - Panaderia', 'Galletas', 'Sol', 'Nacional', 180, 25, 1.50, 120, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000163886/ImgThumb.jpg'], false, false, false, false, 'Envasadas. Tradición en cada galleta.', true, 'Disponible'),
('PAN-007', 'Pan para Hot Dog Bimbo 8u', 'Pan suave y alargado para hot dogs y salchichas al estilo americano.', 'Panadería y Pastelería', 'Pasillo 6 - Panaderia', 'Panes', 'Bimbo', 'Nacional', 7, 25, 2.20, 80, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000024108/ImgThumb.jpg'], false, false, false, false, 'Envasado. 8 unidades por paquete.', true, 'Disponible'),
('PAN-008', 'Donut Glaseado x3 unidades', 'Donuts glaseados recién horneados, esponjosos y cubiertos con glaseado dulce colorido.', 'Panadería y Pastelería', 'Pasillo 6 - Panaderia', 'Reposteria', 'Artesanal', 'Nacional', 3, 25, 2.80, 25, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000165396/ImgThumb.jpg'], false, true, false, false, 'Horneados frescos. Consumir el mismo día.', true, 'Disponible')
ON CONFLICT (codigo) DO NOTHING;

-- BLOQUE 7: BEBIDAS Y JUGOS (8 productos)
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo, disponibilidad) VALUES
('BEB-001', 'Agua Minalba 600ml', 'Agua mineral natural sin gas, pura y fresca para hidratarte todo el día.', 'Bebidas y Jugos', 'Pasillo 7 - Bebidas', 'Aguas', 'Minalba', 'Nacional', 365, 25, 0.60, 300, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000000824/ImgThumb.jpg'], false, false, true, false, 'Envase returnable. Hidratación pura.', true, 'Disponible'),
('BEB-002', 'Jugo Yukery Naranja 1L', 'Jugo de naranja 100% natural, sin conservantes. Fuente natural de vitamina C.', 'Bebidas y Jugos', 'Pasillo 7 - Bebidas', 'Jugos', 'Yukery', 'Nacional', 30, 8, 1.80, 150, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000127630/ImgThumb.jpg'], false, false, false, false, 'Pasteurizado. Sin conservantes artificiales.', true, 'Disponible'),
('BEB-003', 'Coca-Cola Original 2L', 'La bebida gasificada más popular del mundo. Sabor original que refresca.', 'Bebidas y Jugos', 'Pasillo 7 - Bebidas', 'Refrescos', 'Coca-Cola', 'Nacional', 180, 25, 1.90, 250, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000026897/ImgThumb.jpg'], false, false, true, false, 'Envase PET. Refrescante y familiar.', true, 'Disponible'),
('BEB-004', 'Pepsi 2L', 'Pepsi Original, sabor audaz y refrescante para compartir en familia.', 'Bebidas y Jugos', 'Pasillo 7 - Bebidas', 'Refrescos', 'PepsiCo', 'Nacional', 180, 25, 1.85, 200, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000007238/ImgThumb.jpg'], true, false, false, false, 'Envase PET. Promoción temporal.', true, 'Disponible'),
('BEB-005', 'Cerveza Polar Pilsen 355ml', 'Cerveza venezolana premium, refrescante y ligera. Ideal para acompañar comidas.', 'Bebidas y Jugos', 'Pasillo 7 - Bebidas', 'Cervezas', 'Empresas Polar', 'Nacional', 180, 25, 0.85, 300, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000002528/ImgThumb.jpg'], false, false, true, false, 'Envase returnable. Beber con moderación.', true, 'Disponible'),
('BEB-006', 'Malta India 355ml', 'Malta sin alcohol, sabor dulce y refrescante. Bebida tradicional venezolana.', 'Bebidas y Jugos', 'Pasillo 7 - Bebidas', 'Malta', 'Empresas Polar', 'Nacional', 180, 25, 0.75, 180, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000002528/ImgThumb.jpg'], false, false, false, false, 'Envase returnable. Bebida sin alcohol.', true, 'Disponible'),
('BEB-007', 'Jugo Wrapsito Frutas Tropicales 1L', 'Néctar de frutas tropicales, mezcla de mango, papaya y guayaba. Sabor tropical.', 'Bebidas y Jugos', 'Pasillo 7 - Bebidas', 'Jugos', 'Yukery', 'Nacional', 30, 8, 1.50, 120, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000127630/ImgThumb.jpg'], false, false, false, false, 'Pasteurizado. Sabor tropical venezolano.', true, 'Disponible'),
('BEB-008', 'Red Bull 250ml', 'Bebida energética para mantener energía y concentración. Ideal para momentos activos.', 'Bebidas y Jugos', 'Pasillo 7 - Bebidas', 'Energizantes', 'Red Bull', 'Importado', 365, 25, 2.80, 80, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000012002/ImgThumb.jpg'], false, false, false, false, 'Importado. No recomendado para menores de 12 años.', true, 'Disponible')
ON CONFLICT (codigo) DO NOTHING;

-- BLOQUE 8: SNACKS Y DULCES (8 productos)
INSERT INTO products (codigo, nombre, descripcion, categoria, seccion, subseccion, marca, condicion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo, disponibilidad) VALUES
('SNK-001', 'Cotufas Margarita 100g', 'Palomitas de maíz mantequilladas, crujientes y adictivas para ver películas o merendar.', 'Snacks y Dulces', 'Pasillo 8 - Snacks', 'Cotufas', 'Margarita', 'Nacional', 90, 25, 0.80, 200, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000004157/ImgThumb.jpg'], false, false, true, false, 'Envasadas al vacío. Sabor mantequilla clásico.', true, 'Disponible'),
('SNK-002', 'Papitas Sabritas Original 45g', 'Papas fritas clásicas con sal, crujientes y deliciosas. Snack número uno de Venezuela.', 'Snacks y Dulces', 'Pasillo 8 - Snacks', 'Snacks', 'Sabritas', 'Nacional', 90, 25, 0.75, 250, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000127782/ImgThumb.jpg'], false, false, true, false, 'Envasadas. Sabor original clásico.', true, 'Disponible'),
('SNK-003', 'Chocolate Savoy Trotta 100g', 'Chocolate con leche relleno de turrón crocante. Dulce placer para los amantes del chocolate.', 'Snacks y Dulces', 'Pasillo 8 - Snacks', 'Chocolates', 'Savoy', 'Nacional', 180, 25, 2.20, 90, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000013437/ImgThumb.jpg'], false, false, false, false, 'Chocolate premium venezolano. Relleno de turrón.', true, 'Disponible'),
('SNK-004', 'Gomitas Mogul 180g', 'Gomitas de frutas con sabores ácidos y dulces. Formas divertidas para los más pequeños.', 'Snacks y Dulces', 'Pasillo 8 - Snacks', 'Golosinas', 'Arcor', 'Importado', 365, 25, 1.50, 150, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000015358/ImgThumb.jpg'], false, false, false, false, 'Importado. Sin gluten.', true, 'Disponible'),
('SNK-005', 'Maní Japoneses 150g', 'Maní crocante con cáscara, sal y saborizantes. Snack tradicional para compartir.', 'Snacks y Dulces', 'Pasillo 8 - Snacks', 'Frutos Secos', 'La Abuela', 'Nacional', 180, 25, 1.20, 110, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000006884/ImgThumb.jpg'], false, false, false, false, 'Tostados. Producto artesanal.', true, 'Disponible'),
('SNK-006', 'Tortrix Chile 45g', 'Tortillas de maíz con sabor chile picante, crujientes y adictivas.', 'Snacks y Dulces', 'Pasillo 8 - Snacks', 'Snacks', 'Barcel', 'Nacional', 90, 25, 0.85, 180, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000004157/ImgThumb.jpg'], false, false, false, false, 'Sabor chile. Envase práctica.', true, 'Disponible'),
('SNK-007', 'Caramelo Frutilla 1kg', 'Caramelos duros de frutilla, sabor intenso y duradero. Clásico de la infancia.', 'Snacks y Dulces', 'Pasillo 8 - Snacks', 'Caramelos', 'Bonafina', 'Nacional', 365, 25, 3.50, 80, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000015358/ImgThumb.jpg'], false, false, false, false, 'Sabor frutilla. Paquete grande para compartir.', true, 'Disponible'),
('SNK-008', 'Chupeta Chiky x12 unidades', 'Chupetas de fresa con palito, dulces y coloridas para los más pequeños de la casa.', 'Snacks y Dulces', 'Pasillo 8 - Snacks', 'Golosinas', 'Arcor', 'Importado', 365, 25, 2.00, 100, ARRAY['https://www.kromionline.com/DB-IMG-PRODUCT/0000015358/ImgThumb.jpg'], false, false, false, false, 'Importado. Productos para niños.', true, 'Disponible')
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
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '15 days';

  DELETE FROM public.orders
  WHERE status = 'Cancelado'
  AND created_at < NOW() - INTERVAL '3 months';
END;
$$;

-- 2. Programación de la tarea (Requiere extensión pg_cron)
-- Para que esto funcione, debes habilitar 'pg_cron' en el dashboard de Supabase:
-- Database -> Extensions -> Buscar 'pg_cron' y activarlo.
-- Una vez activado, ejecuta manualmente esta línea en el SQL Editor:
-- SELECT cron.schedule('limpiar-notificaciones-diario', '0 0 * * *', 'SELECT public.delete_old_notifications()');

-- ==========================================================================
-- CONFIGURACIÓN DE VARIABLES PARA WEBHOOK PUSH (PRODUCCIÓN)
-- ==========================================================================

-- 1. Habilitar extensión para peticiones HTTP asíncronas
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Actualizar configuración en la tabla
UPDATE public.store_config 
SET 
  push_webhook_url = 'https://market-cbh.pages.dev/api/push-notify',
  push_webhook_secret = '5fca5a4d8825d4de66811590f47af870b01d45e80f391920f4ea76a59ae3c8bf'
WHERE id = 1;
