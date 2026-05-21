-- ============================================================================
-- SCRIPT DE MIGRACIÓN Y ESQUEMA DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- Proyecto: Marketo - Plataforma de Supermercado Express Premium
-- Ubicación: e:\market1\database_schema.sql
-- ============================================================================

-- Habilitar extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLA: CONFIGURACIÓN DE LA TIENDA (store_config)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_config (
    id SERIAL PRIMARY KEY,
    site_nombre TEXT NOT NULL DEFAULT 'Marketo',
    telefono_soporte TEXT NOT NULL DEFAULT '+584124058904',
    direccion_fisica TEXT NOT NULL DEFAULT 'Av. Bolívar Norte con Calle 140, Sector Las Acacias, Valencia, Carabobo',
    coordenadas_tienda JSONB NOT NULL DEFAULT '{"lat": 10.198300, "lng": -68.004400}',
    banners TEXT[] NOT NULL DEFAULT ARRAY[
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1200'
    ],
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
    delivery_gratis BOOLEAN NOT NULL DEFAULT FALSE,
    costo_delivery_km NUMERIC(5,2) NOT NULL DEFAULT 1.50,
    envio_nacional BOOLEAN NOT NULL DEFAULT TRUE,
    costo_envio_nacional NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    favicon_url TEXT DEFAULT '',
    banner_texts TEXT[] NOT NULL DEFAULT ARRAY[
        'Frescura garantizada directo a tu hogar',
        'Pasillos llenos de productos nacionales e importados',
        'Panaderia, charcuteria y cortes selectos'
    ],
    categories TEXT[] NOT NULL DEFAULT ARRAY[
        'Lácteos y Quesos',
        'Carnes y Aves',
        'Charcutería',
        'Frutas y Verduras',
        'Víveres y Despensa',
        'Panadería y Pastelería',
        'Bebidas y Jugos',
        'Snacks y Dulces'
    ],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto inicial
INSERT INTO store_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 2. TABLA: USUARIOS / CLIENTES (usuarios_clientes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    telefono VARCHAR(20) UNIQUE NOT NULL,
    contrasena TEXT NOT NULL, -- Almacenada como hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ----------------------------------------------------------------------------
-- 3. TABLA: INVENTARIO / PRODUCTOS (products)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    marca_repuesto TEXT NOT NULL DEFAULT 'Genérica', -- Corresponde a Marca / Fabricante
    condicion VARCHAR(20) NOT NULL DEFAULT 'Nacional', -- Nacional o Importado
    descripcion TEXT,
    categoria TEXT NOT NULL,
    marca_carro TEXT DEFAULT '', -- Corresponde a Pasillo de Ubicación
    modelo_carro TEXT DEFAULT '', -- Corresponde a Estante / Ubicación
    anio_inicio INTEGER DEFAULT 2026, -- Corresponde a Vida Útil en Días
    anio_fin INTEGER DEFAULT 2026, -- Corresponde a Temp Conservación °C
    precio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    imagen_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    es_promo BOOLEAN NOT NULL DEFAULT FALSE,
    es_nuevo BOOLEAN NOT NULL DEFAULT TRUE,
    es_mas_vendido BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_gratis BOOLEAN NOT NULL DEFAULT FALSE,
    compatibilidad_detalle TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de búsqueda para productos
CREATE INDEX IF NOT EXISTS idx_products_codigo ON products(codigo);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_activo ON products(activo);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '') || ' ' || categoria));


-- ----------------------------------------------------------------------------
-- 4. TABLA: PEDIDOS / ORDENES (orders)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY, -- Formato MKT-123456
    cliente_id UUID REFERENCES usuarios_clientes(id) ON DELETE SET NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL, -- Pago Móvil, Zelle, Efectivo, Transferencia
    datos_pago_ref TEXT, -- Referencia de transacción
    tipo_entrega VARCHAR(20) NOT NULL, -- delivery o pick_up
    direccion_despacho TEXT,
    subtotal_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_bs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    tasa_bcv NUMERIC(10,2) NOT NULL DEFAULT 36.50,
    costo_delivery NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'recibido', -- recibido, aprobado, empaquetado, en_camino, entregado, cancelado
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tiempo_estimado TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_orders_cliente_telefono ON orders(cliente_telefono);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);


-- ----------------------------------------------------------------------------
-- 5. TABLA: DETALLE DE PEDIDOS (order_items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    pedido_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES products(id) ON DELETE SET NULL,
    producto_nombre TEXT NOT NULL,
    producto_codigo VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ----------------------------------------------------------------------------
-- 6. TABLA: ALERTAS Y NOTIFICACIONES (notifications)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'todos', -- todos, personal, admin, request
    destinatario_telefono VARCHAR(20) DEFAULT '',
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_destinatario ON notifications(destinatario_telefono, leida);


-- ----------------------------------------------------------------------------
-- 7. TRIGGERS / DISPARADORES PARA ACTUALIZACIONES AUTOMÁTICAS DE TIEMPOS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_config_modtime
    BEFORE UPDATE ON store_config
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();


-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS RLS (Row Level Security) - RECOMENDACIONES SUPABASE
-- ----------------------------------------------------------------------------
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para configuración
CREATE POLICY "Permitir lectura de la configuración a todos" ON store_config FOR SELECT USING (true);
CREATE POLICY "Permitir escritura solo a administradores" ON store_config FOR ALL USING (true); -- En producción, restringir por auth.uid()

-- Políticas para productos
CREATE POLICY "Permitir lectura de productos activos" ON products FOR SELECT USING (activo = true);
CREATE POLICY "Permitir gestión de productos solo a administradores" ON products FOR ALL USING (true); -- En producción, restringir por admin user

-- Políticas para pedidos
CREATE POLICY "Permitir crear pedidos a todos" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura de pedidos propios" ON orders FOR SELECT USING (true); -- En producción, vincular con auth.uid() o número telefónico verificado


-- ----------------------------------------------------------------------------
-- 9. DATOS DE MUESTRA (SEMILLERO DE PRODUCTOS DEL SUPERMERCADO VENEZOLANO)
-- ----------------------------------------------------------------------------
INSERT INTO products (codigo, nombre, marca_repuesto, condicion, descripcion, categoria, marca_carro, modelo_carro, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, compatibilidad_detalle, activo) 
VALUES
('MKT-QUESO-001', 'Queso Telita Venezolano Extra Fresco', 'Campestre', 'Nacional', 'Queso telita tradicional llanero, extra suave y jugoso, ideal para arepas y cachapas.', 'Lácteos y Quesos', 'Pasillo 1 - Lácteos', 'Refrigerador A', 10, 4, 4.50, 20, ARRAY['https://images.unsplash.com/photo-1523371683773-affcb4a2e39e?auto=format&fit=crop&q=80&w=500'], TRUE, TRUE, TRUE, FALSE, 'Elaborado artesanalmente en el estado Guárico, 100% leche de vaca.', TRUE),
('MKT-QUESO-002', 'Queso de Año Madurado Torondoy', 'Torondoy', 'Nacional', 'Queso madurado de sabor fuerte y consistencia firme, perfecto para rallar sobre tus comidas.', 'Lácteos y Quesos', 'Pasillo 1 - Lácteos', 'Estante C2', 90, 8, 8.90, 15, ARRAY['https://images.unsplash.com/photo-1486887396153-fa416525c108?auto=format&fit=crop&q=80&w=500'], FALSE, FALSE, TRUE, FALSE, 'Tradición y calidad para el paladar venezolano.', TRUE),
('MKT-MANTE-001', 'Mantequilla con Sal ValleFresco 250g', 'ValleFresco', 'Nacional', 'Crema de leche batida con sal, perfecta textura untable para tus arepas recién hechas.', 'Lácteos y Quesos', 'Pasillo 1 - Lácteos', 'Refrigerador A', 60, 4, 2.20, 45, ARRAY['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=500'], FALSE, TRUE, FALSE, FALSE, 'Mantener refrigerado entre 2°C y 4°C.', TRUE),
('MKT-CARNE-001', 'Punta Trasera de Res Premium (1kg)', 'Angus Gold', 'Nacional', 'Corte premium de punta trasera de res, tierna y jugosa, ideal para la parrilla del domingo.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Nevera 3', 8, -2, 9.50, 12, ARRAY['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=500'], FALSE, TRUE, TRUE, TRUE, 'Cadena de frío garantizada durante el despacho.', TRUE),
('MKT-POLLO-001', 'Pollo Entero Limpio con Menudillo (1.8kg)', 'GranjaSol', 'Nacional', 'Pollo fresco entero, limpio de plumas, listo para hornear o guisar.', 'Carnes y Aves', 'Pasillo 2 - Carnes', 'Nevera 4', 7, -18, 5.80, 25, ARRAY['https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=500'], TRUE, FALSE, FALSE, FALSE, 'Empacado al vacío para máxima frescura.', TRUE),
('MKT-JAMON-001', 'Jamón Cocido Superior Ahumado (1kg)', 'Campestre', 'Nacional', 'Jamón de pierna de cerdo premium cocido y ahumado suavemente, rebanado al gusto.', 'Charcutería', 'Pasillo 3 - Charcutería', 'Nevera Mostrador', 15, 2, 7.20, 18, ARRAY['https://images.unsplash.com/photo-1524438425983-a7c5c2d82995?auto=format&fit=crop&q=80&w=500'], FALSE, FALSE, TRUE, FALSE, 'Rebanado diario en tienda bajo estrictas normas de higiene.', TRUE),
('MKT-TOCIN-001', 'Tocineta Ahumada Premium en Rebanadas (500g)', 'Torondoy', 'Nacional', 'Tocineta ahumada crujiente de cerdo, corte seleccionado ideal para desayunos o hamburguesas.', 'Charcutería', 'Pasillo 3 - Charcutería', 'Nevera Mostrador', 30, 2, 4.90, 22, ARRAY['https://images.unsplash.com/photo-1606851282511-b0db43d4c3f5?auto=format&fit=crop&q=80&w=500'], TRUE, TRUE, FALSE, FALSE, 'Sabor ahumado natural con leña de roble.', TRUE),
('MKT-AGUAC-001', 'Aguacate Criollo Tipo Choice (1kg)', 'ValleFresco', 'Nacional', 'Aguacates criollos frescos, textura cremosa perfecta para reina pepiada o ensaladas.', 'Frutas y Verduras', 'Pasillo 4 - Verdulería', 'Cesta Estante 1', 5, 12, 1.80, 50, ARRAY['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=500'], FALSE, TRUE, TRUE, FALSE, 'Grado óptimo de maduración listo para consumir.', TRUE),
('MKT-HARIN-001', 'Harina Pan de Maíz Blanco Precocida (1kg)', 'EcoGranja', 'Nacional', 'La harina preferida por los venezolanos para hacer las arepas más crujientes y suaves.', 'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Estante A3', 365, 25, 1.40, 120, ARRAY['https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=500'], FALSE, FALSE, TRUE, FALSE, 'Harina de maíz blanco refinada 100% precocida.', TRUE),
('MKT-ACEIT-001', 'Aceite de Oliva Extra Virgen Carbonell (500ml)', 'Carbonell', 'Importado', 'Aceite de oliva de primera presión en frío, ideal para aderezar y cocinar saludablemente.', 'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Estante B1', 540, 25, 6.50, 40, ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500'], FALSE, FALSE, FALSE, FALSE, 'Importado de España, envasado en botella de vidrio oscuro.', TRUE),
('MKT-CAFEE-001', 'Café Molido Gourmet Calidad Selecta (500g)', 'Royal', 'Nacional', 'Café arábico de altura, aroma intenso y tueste medio, molido perfecto para greca.', 'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Estante D4', 180, 20, 3.80, 80, ARRAY['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=500'], TRUE, FALSE, TRUE, FALSE, 'Café cosechado en los Andes venezolanos, molido fresco.', TRUE),
('MKT-CHOCO-001', 'Tableta de Chocolate Oscuro El Rey 70% (80g)', 'El Rey', 'Nacional', 'Chocolate oscuro fino de aroma, elaborado con cacao venezolano Carenero Superior.', 'Snacks y Dulces', 'Pasillo 6 - Dulces', 'Estante C1', 365, 20, 2.50, 95, ARRAY['https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=500'], FALSE, TRUE, TRUE, FALSE, 'Cacao venezolano de origen único, libre de aditivos artificiales.', TRUE)
ON CONFLICT (codigo) DO UPDATE 
SET precio_usd = EXCLUDED.precio_usd, stock = EXCLUDED.stock, activo = EXCLUDED.activo;
