-- ============================================================================
-- SCHEMA: Marketo Supermercado — Supabase / PostgreSQL
-- Proyecto: Marketo - Plataforma de Supermercado Express Premium
-- Repositorio: github.com/kecho8a/market
-- Última revisión: 2026-05-21
-- ============================================================================

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. TABLA: store_config — Configuración global de la tienda
-- ============================================================================
create table if not exists store_config (
    id                          serial primary key,
    site_nombre                 text not null default 'Marketo',
    telefono_soporte            text not null default '+584124058904',
    direccion_fisica            text not null default 'Av. Bolívar Norte con Calle 140, Sector Las Acacias, Valencia, Carabobo',
    coordenadas_tienda          jsonb not null default '{"lat": 10.198300, "lng": -68.004400}',
    banners                     text[] not null default array[
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1200'
    ],
    banner_texts                text[] not null default array[
        'Frescura garantizada directo a tu hogar',
        'Pasillos llenos de productos nacionales e importados',
        'Panadería, charcutería y cortes selectos'
    ],
    categories                  text[] not null default array[
        'Lácteos y Quesos', 'Carnes y Aves', 'Charcutería',
        'Frutas y Verduras', 'Víveres y Despensa',
        'Panadería y Pastelería', 'Bebidas y Jugos', 'Snacks y Dulces'
    ],
    -- Métodos de pago
    zelle_enabled               boolean not null default true,
    zelle_data                  text not null default 'pagos@marketo.com.ve',
    zelle_discount_percent      numeric(5,2) not null default 0.00,
    pagomovil_enabled           boolean not null default true,
    pagomovil_data              text not null default 'Banesco (0134) - RIF J-50123456-7 - Tel: 0412-4976451',
    pagomovil_discount_percent  numeric(5,2) not null default 0.00,
    efectivo_enabled            boolean not null default true,
    efectivo_data               text not null default 'Paga al motorizado en efectivo (USD/Bs) al recibir tu delivery',
    efectivo_discount_percent   numeric(5,2) not null default 0.00,
    transferencia_enabled       boolean not null default true,
    transferencia_data          text not null default 'Banesco Cuenta Corriente - 0134-1122-33-4455667788 - Marketo C.A. - RIF J-50123456-7',
    transferencia_discount_percent numeric(5,2) not null default 0.00,
    -- Configuración de tasa y delivery
    tasa_cambio                 numeric(10,2) not null default 36.50,
    logo_url                    text default '',
    favicon_url                 text default '',
    theme_color                 varchar(10) not null default '#7c3aed',
    delivery_gratis             boolean not null default false,
    costo_delivery_km           numeric(5,2) not null default 1.50,
    envio_nacional              boolean not null default true,
    costo_envio_nacional        numeric(5,2) not null default 5.00,
    updated_at                  timestamp with time zone default current_timestamp
);

-- Registro inicial garantizado en id=1
insert into store_config (id) values (1) on conflict (id) do nothing;

-- Trigger: actualizar updated_at automáticamente
create or replace function update_store_config_timestamp()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger store_config_updated_at
    before update on store_config
    for each row execute procedure update_store_config_timestamp();


-- ============================================================================
-- 2. TABLA: usuarios_clientes — Directorio de clientes registrados
-- ============================================================================
create table if not exists usuarios_clientes (
    id              uuid primary key default gen_random_uuid(),
    nombre          text not null,
    telefono        varchar(20) unique not null,
    contrasena      text not null,              -- Almacenada cifrada o como hash
    created_at      timestamp with time zone default current_timestamp
);

create index if not exists idx_usuarios_telefono on usuarios_clientes(telefono);


-- ============================================================================
-- 3. TABLA: products — Inventario del supermercado
-- Nota: Las columnas mantienen los nombres originales de la BD para compatibilidad
-- con el frontend (sin migración de datos). Los aliases están en el código TypeScript.
-- ============================================================================
create table if not exists products (
    id                      uuid primary key default gen_random_uuid(),
    codigo                  varchar(50) unique not null,            -- SKU / código de barras
    nombre                  text not null,
    marca_repuesto          text not null default 'Genérica',       -- → Marca del producto
    condicion               varchar(20) not null default 'Nacional' -- → Origen: Nacional | Importado
                            check (condicion in ('Nacional', 'Importado')),
    descripcion             text,
    categoria               text not null,
    marca_carro             text default '',                        -- → Sección / Pasillo
    modelo_carro            text default '',                        -- → Subsección / Estante
    anio_inicio             integer default 15,                     -- → Vida útil en días
    anio_fin                integer default 4,                      -- → Temperatura de conservación °C
    precio_usd              numeric(10,2) not null default 0.00 check (precio_usd >= 0),
    stock                   integer not null default 0 check (stock >= 0),
    imagen_urls             text[] default array[]::text[],
    es_promo                boolean not null default false,
    es_nuevo                boolean not null default true,          -- → Producto recién ingresado
    es_mas_vendido          boolean not null default false,
    delivery_gratis         boolean not null default false,
    compatibilidad_detalle  text,                                   -- → Detalle adicional / Nutrición
    activo                  boolean not null default true,
    created_at              timestamp with time zone default current_timestamp
);

-- Índices de búsqueda optimizados para supermercado
create index if not exists idx_products_codigo    on products(codigo);
create index if not exists idx_products_categoria on products(categoria);
create index if not exists idx_products_activo    on products(activo);
create index if not exists idx_products_marca     on products(marca_repuesto);
create index if not exists idx_products_condicion on products(condicion);
create index if not exists idx_products_fts       on products
    using gin(to_tsvector('spanish',
        nombre || ' ' || coalesce(descripcion, '') || ' ' || categoria
        || ' ' || coalesce(compatibilidad_detalle, '')
    ));


-- ============================================================================
-- 4. TABLA: orders — Pedidos de clientes
-- ============================================================================
create table if not exists orders (
    id                  varchar(50) primary key,            -- Formato MKT-XXXXXX
    cliente_id          uuid references usuarios_clientes(id) on delete set null,
    cliente_nombre      text not null,
    cliente_telefono    text not null,
    metodo_pago         varchar(50) not null
                        check (metodo_pago in ('Pago Móvil','Pago Movil','Zelle','Efectivo','Transferencia')),
    datos_pago_ref      text,
    tipo_entrega        varchar(20) not null default 'delivery',
    direccion_despacho  text,
    lat                 double precision,
    lng                 double precision,
    distancia_km        double precision default 0,
    subtotal_usd        numeric(10,2) not null default 0.00,
    costo_envio_usd     numeric(10,2) not null default 0.00,
    total_usd           numeric(10,2) not null default 0.00,
    total_bs            numeric(15,2) not null default 0.00,
    tasa_bcv            numeric(10,2) not null default 36.50,
    items               jsonb,                              -- Snapshot de productos al momento del pedido
    status              varchar(30) not null default 'recibido'
                        check (status in ('recibido','aprobado','empaquetado','en_camino','entregado','cancelado')),
    tiempo_estimado     text default '',
    fecha               timestamp with time zone default current_timestamp,
    created_at          timestamp with time zone default current_timestamp
);

create index if not exists idx_orders_telefono on orders(cliente_telefono);
create index if not exists idx_orders_status   on orders(status);
create index if not exists idx_orders_fecha    on orders(fecha desc);


-- ============================================================================
-- 5. TABLA: order_items — Detalle de líneas de pedido
-- ============================================================================
create table if not exists order_items (
    id                    serial primary key,
    pedido_id             varchar(50) references orders(id) on delete cascade,
    producto_id           uuid references products(id) on delete set null,
    producto_nombre       text not null,
    producto_codigo       varchar(50) not null,
    cantidad              integer not null default 1 check (cantidad > 0),
    precio_unitario_usd   numeric(10,2) not null default 0.00,
    created_at            timestamp with time zone default current_timestamp
);

create index if not exists idx_order_items_pedido on order_items(pedido_id);


-- ============================================================================
-- 6. TABLA: notifications — Alertas del sistema y mensajes a clientes
-- ============================================================================
create table if not exists notifications (
    id                      varchar(50) primary key,
    titulo                  text not null,
    mensaje                 text not null,
    fecha                   text not null,
    tipo                    varchar(20) not null default 'todos'
                            check (tipo in ('todos','personal','admin','request')),
    destinatario_telefono   varchar(20) default '',
    leida                   boolean not null default false,
    created_at              timestamp with time zone default current_timestamp
);

create index if not exists idx_notifications_dest on notifications(destinatario_telefono, leida);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — Políticas de seguridad por tabla
-- ============================================================================

alter table store_config        enable row level security;
alter table usuarios_clientes   enable row level security;
alter table products            enable row level security;
alter table orders              enable row level security;
alter table order_items         enable row level security;
alter table notifications       enable row level security;

-- ── store_config ─────────────────────────────────────────────────────────────
-- Lectura pública; escritura solo para el administrador autenticado
create policy "Lectura publica de configuracion"
    on store_config for select using (true);

create policy "Escritura de configuracion solo admin"
    on store_config for all
    using (auth.role() = 'authenticated' and auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
    with check (auth.role() = 'authenticated' and auth.jwt() ->> 'email' = 'kecho8a@gmail.com');

-- ── products ─────────────────────────────────────────────────────────────────
-- Lectura pública de productos activos; gestión solo admin
create policy "Lectura publica de productos activos"
    on products for select using (activo = true);

create policy "Lectura admin de todos los productos"
    on products for select
    using (auth.role() = 'authenticated' and auth.jwt() ->> 'email' = 'kecho8a@gmail.com');

create policy "Gestion de catalogo solo admin"
    on products for all
    using (auth.role() = 'authenticated' and auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
    with check (auth.role() = 'authenticated' and auth.jwt() ->> 'email' = 'kecho8a@gmail.com');

-- ── usuarios_clientes ─────────────────────────────────────────────────────────
-- Registro e inicio de sesión: insertable y consultable por todos (anon)
-- (La autenticación real se valida por teléfono + contraseña en el frontend)
create policy "Registro de nuevos clientes"
    on usuarios_clientes for insert with check (true);

create policy "Lectura de directorio de clientes"
    on usuarios_clientes for select using (true);

create policy "Actualizacion de perfil de cliente"
    on usuarios_clientes for update using (true);

-- ── orders ────────────────────────────────────────────────────────────────────
-- Clientes anónimos pueden crear pedidos; lectura pública para seguimiento
create policy "Crear pedido como anonimo"
    on orders for insert with check (true);

create policy "Ver pedidos propios"
    on orders for select using (true);

create policy "Admin puede gestionar todos los pedidos"
    on orders for all
    using (auth.role() = 'service_role' or
          (auth.role() = 'authenticated' and auth.jwt() ->> 'email' = 'kecho8a@gmail.com'));

-- ── order_items ───────────────────────────────────────────────────────────────
create policy "Insertar items de pedido"
    on order_items for insert with check (true);

create policy "Leer items de pedido"
    on order_items for select using (true);

-- ── notifications ─────────────────────────────────────────────────────────────
create policy "Leer notificaciones publicas"
    on notifications for select using (true);

create policy "Admin gestiona notificaciones"
    on notifications for all
    using (auth.role() = 'service_role' or
          (auth.role() = 'authenticated' and auth.jwt() ->> 'email' = 'kecho8a@gmail.com'));

create policy "Cualquiera puede insertar notificaciones de pedido"
    on notifications for insert with check (tipo = 'todos' or tipo = 'request');


-- ============================================================================
-- DATOS DE MUESTRA — Semillero de productos del supermercado venezolano
-- (Solo corren si no existe el producto, usando ON CONFLICT)
-- ============================================================================
insert into products (
    codigo, nombre, marca_repuesto, condicion, descripcion, categoria,
    marca_carro, modelo_carro, anio_inicio, anio_fin,
    precio_usd, stock, imagen_urls,
    es_promo, es_nuevo, es_mas_vendido, delivery_gratis, compatibilidad_detalle, activo
) values
(
    'MKT-QUESO-001', 'Queso Telita Venezolano Extra Fresco', 'Campestre', 'Nacional',
    'Queso telita tradicional llanero, extra suave y jugoso, ideal para arepas y cachapas.',
    'Lácteos y Quesos', 'Pasillo 1 - Lácteos', 'Refrigerador A', 10, 4,
    4.50, 20, array['https://images.unsplash.com/photo-1523371683773-affcb4a2e39e?auto=format&fit=crop&q=80&w=500'],
    true, true, true, false, 'Elaborado artesanalmente en el estado Guárico, 100% leche de vaca.', true
),
(
    'MKT-CARNE-001', 'Punta Trasera de Res Premium (1kg)', 'Angus Gold', 'Nacional',
    'Corte premium de punta trasera de res, tierna y jugosa, ideal para la parrilla del domingo.',
    'Carnes y Aves', 'Pasillo 2 - Carnes', 'Nevera 3', 8, -2,
    9.50, 12, array['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=500'],
    false, true, true, true, 'Cadena de frío garantizada durante el despacho.', true
),
(
    'MKT-JAMON-001', 'Jamón Cocido Superior Ahumado (1kg)', 'Campestre', 'Nacional',
    'Jamón de pierna de cerdo premium cocido y ahumado suavemente, rebanado al gusto.',
    'Charcutería', 'Pasillo 3 - Charcutería', 'Nevera Mostrador', 15, 2,
    7.20, 18, array['https://images.unsplash.com/photo-1524438425983-a7c5c2d82995?auto=format&fit=crop&q=80&w=500'],
    false, false, true, false, 'Rebanado diario en tienda bajo estrictas normas de higiene.', true
),
(
    'MKT-AGUAC-001', 'Aguacate Criollo Tipo Choice (1kg)', 'ValleFresco', 'Nacional',
    'Aguacates criollos frescos, textura cremosa perfecta para reina pepiada o ensaladas.',
    'Frutas y Verduras', 'Pasillo 4 - Verdulería', 'Cesta Estante 1', 5, 12,
    1.80, 50, array['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=500'],
    false, true, true, false, 'Grado óptimo de maduración listo para consumir.', true
),
(
    'MKT-HARIN-001', 'Harina Pan de Maíz Blanco Precocida (1kg)', 'EcoGranja', 'Nacional',
    'La harina preferida por los venezolanos para hacer las arepas más crujientes y suaves.',
    'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Estante A3', 365, 25,
    1.40, 120, array['https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=500'],
    false, false, true, false, 'Harina de maíz blanco refinada 100% precocida.', true
),
(
    'MKT-ACEIT-001', 'Aceite de Oliva Extra Virgen Carbonell (500ml)', 'Carbonell', 'Importado',
    'Aceite de oliva de primera presión en frío, ideal para aderezar y cocinar saludablemente.',
    'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Estante B1', 540, 25,
    6.50, 40, array['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500'],
    false, false, false, false, 'Importado de España, envasado en botella de vidrio oscuro.', true
),
(
    'MKT-CAFEE-001', 'Café Molido Gourmet Calidad Selecta (500g)', 'Royal', 'Nacional',
    'Café arábico de altura, aroma intenso y tueste medio, molido perfecto para greca.',
    'Víveres y Despensa', 'Pasillo 5 - Víveres', 'Estante D4', 180, 20,
    3.80, 80, array['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=500'],
    true, false, true, false, 'Café cosechado en los Andes venezolanos, molido fresco.', true
),
(
    'MKT-CHOCO-001', 'Tableta de Chocolate Oscuro El Rey 70% (80g)', 'El Rey', 'Nacional',
    'Chocolate oscuro fino de aroma, elaborado con cacao venezolano Carenero Superior.',
    'Snacks y Dulces', 'Pasillo 6 - Dulces', 'Estante C1', 365, 20,
    2.50, 95, array['https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=500'],
    false, true, true, false, 'Cacao venezolano de origen único, libre de aditivos artificiales.', true
)
on conflict (codigo) do update
    set precio_usd = excluded.precio_usd,
        stock      = excluded.stock,
        activo     = excluded.activo;
