-- ==========================================================================
-- SCRIPT DE ESQUEMA DEFINITIVO PARA MARKETO PWA
-- ESTE ES EL SCRIPT CORRECTO Y ACTUALIZADO
-- ==========================================================================

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    categories TEXT[] DEFAULT ARRAY['Lácteos y Quesos', 'Carnes y Aves', 'Charcutería', 'Frutas y Verduras', 'Víveres y Despensa', 'Panadería y Pastelería', 'Bebidas y Jugos', 'Snacks y Dulces']::TEXT[]
);

-- Asegurarse de que las columnas existan por si la tabla ya estaba creada con la otra versión
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS tienda_lat NUMERIC(10, 6) NOT NULL DEFAULT 10.198300;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS tienda_lng NUMERIC(10, 6) NOT NULL DEFAULT -68.004400;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_1 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_2 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_3 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT ARRAY['Lácteos y Quesos', 'Carnes y Aves', 'Charcutería', 'Frutas y Verduras', 'Víveres y Despensa', 'Panadería y Pastelería', 'Bebidas y Jugos', 'Snacks y Dulces']::TEXT[];

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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_config' AND policyname='Lectura config publica') THEN
    CREATE POLICY "Lectura config publica" ON store_config FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_config' AND policyname='Escritura config admin') THEN
    CREATE POLICY "Escritura config admin" ON store_config FOR ALL TO anon, authenticated USING (id = 1) WITH CHECK (id = 1);
  END IF;

  -- ============================
  -- products (RLS para Stock y CRUD)
  -- ============================
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Lectura productos activos') THEN
    CREATE POLICY "Lectura productos activos" ON products FOR SELECT TO anon, authenticated USING (activo = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Gestion productos admin') THEN
    CREATE POLICY "Gestion productos admin" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ============================
  -- orders (IMPORTANTE)
  -- ============================
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_insert_allow_anon') THEN
    CREATE POLICY "orders_insert_allow_anon" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_select_allow_all') THEN
    CREATE POLICY "orders_select_allow_all" ON orders FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_update_allow_all') THEN
    CREATE POLICY "orders_update_allow_all" ON orders FOR UPDATE TO anon, authenticated USING (true);
  END IF;

  -- ============================
  -- usuarios_clientes
  -- ============================

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios_clientes' AND policyname='Lectura de usuarios') THEN
    CREATE POLICY "Lectura de usuarios" ON usuarios_clientes FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios_clientes' AND policyname='Actualizar usuarios') THEN
    CREATE POLICY "Actualizar usuarios" ON usuarios_clientes FOR UPDATE TO anon, authenticated USING (true);
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

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_select_allow_all') THEN
    CREATE POLICY "notifications_select_allow_all" ON notifications
      FOR SELECT
      TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_update_allow_all') THEN
    CREATE POLICY "notifications_update_allow_all" ON notifications
      FOR UPDATE
      TO anon, authenticated USING (true);
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
