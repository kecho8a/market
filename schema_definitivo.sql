-- ============================================================================
-- SCRIPT DE ESQUEMA DEFINITIVO PARA MARKETO PWA
-- ESTE ES EL SCRIPT CORRECTO Y ACTUALIZADO
-- ============================================================================

-- Habilitar extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. store_config
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_config (
    id SERIAL PRIMARY KEY,
    site_nombre TEXT NOT NULL DEFAULT 'Marketo',
    telefono_soporte TEXT NOT NULL DEFAULT '+584124976451',
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
    theme_color VARCHAR(10) NOT NULL DEFAULT '#7c3aed',
    favicon_url TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asegurarse de que las columnas existan por si la tabla ya estaba creada con la otra versión
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS tienda_lat NUMERIC(10, 6) NOT NULL DEFAULT 10.198300;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS tienda_lng NUMERIC(10, 6) NOT NULL DEFAULT -68.004400;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_1 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_2 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_3 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1200';

INSERT INTO store_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. usuarios_clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_clientes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre TEXT NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS seccion TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS subseccion TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS marca TEXT DEFAULT 'Genérica';
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_gratis BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS detalle_adicional TEXT DEFAULT '';

-- ----------------------------------------------------------------------------
-- 4. orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    cliente_uid TEXT,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    direccion_envio TEXT DEFAULT '',
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    distancia_km NUMERIC(8, 2) DEFAULT 0,
    items JSONB DEFAULT '[]',
    subtotal_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_envio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_bs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    tiempo_estimado_entrega TEXT DEFAULT '',
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS cliente_uid TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS costo_envio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS direccion_envio TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distancia_km NUMERIC(8, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tiempo_estimado_entrega TEXT DEFAULT '';

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
-- 6. POLÍTICAS RLS Y SEGURIDAD
-- ----------------------------------------------------------------------------
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_config' AND policyname='Lectura config publica') THEN
    CREATE POLICY "Lectura config publica" ON store_config FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_config' AND policyname='Escritura config admin') THEN
    CREATE POLICY "Escritura config admin" ON store_config FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Lectura productos activos') THEN
    CREATE POLICY "Lectura productos activos" ON products FOR SELECT USING (activo = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Gestion productos admin') THEN
    CREATE POLICY "Gestion productos admin" ON products FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Crear pedidos publico') THEN
    CREATE POLICY "Crear pedidos publico" ON orders FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Leer pedidos') THEN
    CREATE POLICY "Leer pedidos" ON orders FOR SELECT USING (true); -- Permitir lectura para filtrado local por tlf
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Actualizar pedidos admin') THEN
    CREATE POLICY "Actualizar pedidos admin" ON orders FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios_clientes' AND policyname='Registro de usuarios') THEN
    CREATE POLICY "Registro de usuarios" ON usuarios_clientes FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios_clientes' AND policyname='Lectura de usuarios') THEN
    CREATE POLICY "Lectura de usuarios" ON usuarios_clientes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios_clientes' AND policyname='Actualizar usuarios') THEN
    CREATE POLICY "Actualizar usuarios" ON usuarios_clientes FOR UPDATE USING (true);
  END IF;
  
  -- Políticas para la tabla de notificaciones
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Insercion publica notificaciones') THEN
    CREATE POLICY "Insercion publica notificaciones" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Lectura publica notificaciones') THEN
    CREATE POLICY "Lectura publica notificaciones" ON notifications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Gestion notificaciones admin') THEN
    CREATE POLICY "Gestion notificaciones admin" ON notifications FOR ALL USING (true);
  END IF;
END $$;
