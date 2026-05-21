-- ============================================================================
-- SCRIPT DE MIGRACIÓN Y ESQUEMA DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- Proyecto: Marketo - Plataforma de Supermercado Express Premium
-- Versión: 2.0 - Actualizado con columnas correctas para sincronización con AppContext
-- ============================================================================

-- Habilitar extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLA: CONFIGURACIÓN DE LA TIENDA (store_config)
--    Nota: usa columnas planas tienda_lat/tienda_lng y banner_url_1/2/3
--    en lugar de JSONB/arrays para compatibilidad con el código AppContext.tsx
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_config (
    id SERIAL PRIMARY KEY,
    site_nombre TEXT NOT NULL DEFAULT 'Marketo',
    telefono_soporte TEXT NOT NULL DEFAULT '+584124976451',
    direccion_fisica TEXT NOT NULL DEFAULT 'Av. Bolívar Norte con Calle 140, Sector Las Acacias, Valencia, Carabobo',
    -- Coordenadas como columnas separadas (AppContext lee tienda_lat / tienda_lng)
    tienda_lat NUMERIC(10, 6) NOT NULL DEFAULT 10.198300,
    tienda_lng NUMERIC(10, 6) NOT NULL DEFAULT -68.004400,
    -- Banners como URLs separadas (AppContext lee banner_url_1/2/3)
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

-- Insertar configuración inicial si no existe
INSERT INTO store_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Migración: agregar columnas faltantes si ya existe la tabla
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS tienda_lat NUMERIC(10, 6) NOT NULL DEFAULT 10.198300;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS tienda_lng NUMERIC(10, 6) NOT NULL DEFAULT -68.004400;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_1 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_2 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS banner_url_3 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1200';


-- ----------------------------------------------------------------------------
-- 2. TABLA: USUARIOS / CLIENTES (usuarios_clientes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_clientes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre TEXT NOT NULL,
    telefono VARCHAR(20) UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ----------------------------------------------------------------------------
-- 3. TABLA: INVENTARIO / PRODUCTOS (products)
--    Contiene todas las columnas que AppContext.tsx sincroniza
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    categoria TEXT NOT NULL DEFAULT 'Víveres y Despensa',
    -- Columnas para supermercado (AppContext usa: seccion, subseccion, marca)
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

-- Migración: agregar columnas faltantes si la tabla ya existe
ALTER TABLE products ADD COLUMN IF NOT EXISTS seccion TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS subseccion TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS marca TEXT DEFAULT 'Genérica';
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_gratis BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS detalle_adicional TEXT DEFAULT '';

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_products_codigo ON products(codigo);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_activo ON products(activo);
CREATE INDEX IF NOT EXISTS idx_products_search ON products
    USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '') || ' ' || categoria));


-- ----------------------------------------------------------------------------
-- 4. TABLA: PEDIDOS / ORDENES (orders)
--    Contiene todas las columnas que AppContext.tsx envía en createOrder
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,                        -- Ej: PED-1234-VAL-2026
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    cliente_uid TEXT,                                  -- ID del usuario registrado (puede ser temporal)
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    direccion_envio TEXT DEFAULT '',                   -- Zona/dirección de entrega
    lat NUMERIC(10, 6),                                -- Latitud del punto de entrega
    lng NUMERIC(10, 6),                                -- Longitud del punto de entrega
    distancia_km NUMERIC(8, 2) DEFAULT 0,              -- Distancia calculada en KM
    items JSONB DEFAULT '[]',                          -- Detalle de productos del pedido
    subtotal_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_envio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_bs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendiente',   -- Pendiente, Procesando, En preparación, En camino, Entregado
    tiempo_estimado_entrega TEXT DEFAULT '',
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migración: agregar columnas faltantes si la tabla ya existe
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cliente_uid TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS costo_envio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS direccion_envio TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distancia_km NUMERIC(8, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tiempo_estimado_entrega TEXT DEFAULT '';

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_orders_cliente_telefono ON orders(cliente_telefono);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_fecha ON orders(fecha DESC);


-- ----------------------------------------------------------------------------
-- 5. TABLA: ALERTAS Y NOTIFICACIONES (notifications)
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

CREATE INDEX IF NOT EXISTS idx_notifications_destinatario ON notifications(destinatario_telefono, leida);


-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS RLS (Row Level Security)
-- ----------------------------------------------------------------------------
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permisivas para desarrollo; restringir con auth.uid() en producción)
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
    CREATE POLICY "Leer pedidos" ON orders FOR SELECT USING (true);
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
END $$;


-- ----------------------------------------------------------------------------
-- 7. TRIGGER: auto-actualizar updated_at en store_config
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_store_config_modtime ON store_config;
CREATE TRIGGER update_store_config_modtime
    BEFORE UPDATE ON store_config
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();


-- ----------------------------------------------------------------------------
-- 8. DATOS DE MUESTRA (Semillero de productos del supermercado venezolano)
-- ----------------------------------------------------------------------------
INSERT INTO products (codigo, nombre, marca, condicion, descripcion, categoria, seccion, subseccion, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, detalle_adicional, activo)
VALUES
('MKT-QUESO-001', 'Queso Telita Venezolano Extra Fresco', 'Campestre', 'Nacional', 'Queso telita tradicional llanero, extra suave y jugoso, ideal para arepas y cachapas.', 'Lácteos y Quesos', 'Pasillo 1 - Lácteos', 'Quesos Frescos', 10, 4, 4.50, 20, ARRAY['https://images.unsplash.com/photo-1523371683773-affcb4a2e39e?auto=format&fit=crop&q=80&w=500'], TRUE, TRUE, TRUE, FALSE, 'Elaborado artesanalmente en el estado Guárico, 100% leche de vaca.', TRUE),
('MKT-CARNE-001', 'Punta Trasera de Res Premium (1kg)', 'Angus Gold', 'Nacional', 'Corte premium de punta trasera de res, tierna y jugosa, ideal para la parrilla.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Cortes Vacunos', 8, -2, 9.50, 12, ARRAY['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=500'], FALSE, TRUE, TRUE, TRUE, 'Cadena de frío garantizada durante el despacho.', TRUE),
('MKT-POLLO-001', 'Pollo Entero Limpio con Menudillo (1.8kg)', 'GranjaSol', 'Nacional', 'Pollo fresco entero, limpio de plumas, listo para hornear o guisar.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Aves y Pollo', 7, -18, 5.80, 25, ARRAY['https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=500'], TRUE, FALSE, FALSE, FALSE, 'Empacado al vacío para máxima frescura.', TRUE),
('MKT-AGUAC-001', 'Aguacate Criollo Tipo Choice (1kg)', 'ValleFresco', 'Nacional', 'Aguacates criollos frescos, textura cremosa perfecta para reina pepiada o ensaladas.', 'Frutas y Verduras', 'Pasillo 4 - Verdulería', 'Frutas y Vegetales', 5, 12, 1.80, 50, ARRAY['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=500'], FALSE, TRUE, TRUE, FALSE, 'Grado óptimo de maduración listo para consumir.', TRUE),
('MKT-HARIN-001', 'Harina Pan de Maíz Blanco Precocida (1kg)', 'P.A.N.', 'Nacional', 'La harina preferida por los venezolanos para hacer las arepas más crujientes y suaves.', 'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Arroces y Granos', 365, 25, 1.40, 120, ARRAY['https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=500'], FALSE, FALSE, TRUE, FALSE, 'Harina de maíz blanco refinada 100% precocida.', TRUE),
('MKT-CAFEE-001', 'Café Molido Gourmet Calidad Selecta (500g)', 'El Rey', 'Nacional', 'Café arábico de altura, aroma intenso y tueste medio, molido perfecto para greca.', 'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Aceites y Abarrotes', 180, 20, 3.80, 80, ARRAY['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=500'], TRUE, FALSE, TRUE, FALSE, 'Café cosechado en los Andes venezolanos, molido fresco.', TRUE),
('MKT-CHOCO-001', 'Tableta de Chocolate Oscuro El Rey 70% (80g)', 'El Rey', 'Nacional', 'Chocolate oscuro fino de aroma, elaborado con cacao venezolano Carenero Superior.', 'Snacks y Dulces', 'Pasillo 6 - Dulces', 'Confitería y Snacks', 365, 20, 2.50, 95, ARRAY['https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=500'], FALSE, TRUE, TRUE, FALSE, 'Cacao venezolano de origen único, libre de aditivos artificiales.', TRUE),
('MKT-ACEIT-001', 'Aceite de Oliva Extra Virgen Carbonell (500ml)', 'Carbonell', 'Importado', 'Aceite de oliva de primera presión en frío, ideal para aderezar y cocinar saludablemente.', 'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Aceites y Abarrotes', 540, 25, 6.50, 40, ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500'], FALSE, FALSE, FALSE, FALSE, 'Importado de España, envasado en botella de vidrio oscuro.', TRUE)
ON CONFLICT (codigo) DO UPDATE
    SET precio_usd = EXCLUDED.precio_usd,
        stock = EXCLUDED.stock,
        activo = EXCLUDED.activo,
        seccion = EXCLUDED.seccion,
        subseccion = EXCLUDED.subseccion,
        marca = EXCLUDED.marca;
