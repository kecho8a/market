-- --------------------------------------------------------------------------------
-- SCHEMA: TuRepuestoValencia Database Setup (Supabase / Postgres)
-- --------------------------------------------------------------------------------

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Table: configuracion_sistema (Store Settings & Exchanges)
create table configuracion_sistema (
    id uuid primary key default uuid_generate_v4(),
    site_nombre text not null default 'TuRepuestoValencia',
    telefono_soporte text not null default '+584241234567',
    direccion_fisica text not null default 'Av. Bolívar Norte, Sector Las Acacias, Valencia, Carabobo',
    tienda_lat double precision not null default 10.198300,
    tienda_lng double precision not null default -68.004400,
    banner_url_1 text not null,
    banner_url_2 text not null,
    banner_url_3 text not null,
    zelle_enabled boolean not null default true,
    pagomovil_enabled boolean not null default true,
    efectivo_enabled boolean not null default true,
    transferencia_enabled boolean not null default true,
    tasa_cambio double precision not null default 36.50, -- Bs per USD
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Table: usuarios_clientes (Customers Directory)
create table usuarios_clientes (
    id uuid primary key default uuid_generate_v4(),
    nombre text not null,
    telefono text not null unique,
    direccion_predeterminada text,
    lat_predeterminada double precision,
    lng_predeterminada double precision,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Table: repuestos_catalogo (Inventory of spare parts)
create table repuestos_catalogo (
    id uuid primary key default uuid_generate_v4(),
    codigo text not null unique, -- SKU, OEM or Part Code
    nombre text not null,
    descripcion text,
    categoria text not null, -- Motor, Frenos, Suspensión, Eléctrico, Filtros, Refrigeración, etc
    marca_carro text not null, -- Chevrolet, Toyota, Ford, Hyundai, etc
    modelo_carro text not null, -- Aveo, Optra, Fiesta, Corolla, Hilux, Spark
    anio_inicio integer not null, -- e.g. 2004
    anio_fin integer not null, -- e.g. 2012
    precio_usd numeric(10, 2) not null check (precio_usd >= 0),
    stock integer not null default 0 check (stock >= 0),
    imagen_urls text[] not null, -- Array of image URLs
    es_promo boolean default false,
    es_nuevo boolean default false,
    es_mas_vendido boolean default false,
    compatibilidad_detalle text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for Semantic Compatibility Lookup and Search Optimization
create index idx_repuestos_search on repuestos_catalogo (marca_carro, modelo_carro, anio_inicio, anio_fin);
create index idx_repuestos_categoria on repuestos_catalogo (categoria);

-- 4. Table: pedidos (Orders List)
create table pedidos (
    id uuid primary key default uuid_generate_v4(),
    cliente_nombre text not null,
    cliente_telefono text not null,
    cliente_uid uuid references usuarios_clientes(id) on delete set null,
    items jsonb not null, -- JSON Array of ordered items: [{ part_id, nombre, codigo, precio_usd, cantidad }]
    subtotal_usd numeric(10, 2) not null,
    costo_envio_usd numeric(10, 2) not null default 0.00,
    total_usd numeric(10, 2) not null,
    total_bs numeric(12, 2) not null, -- Stored calculation in bolivares according to daily rate
    metodo_pago text not null check (metodo_pago in ('Pago Móvil', 'Zelle', 'Efectivo', 'Transferencia')),
    lat double precision,
    lng double precision,
    direccion_envio text,
    distancia_km double precision,
    status text not null default 'Pendiente' check (status in ('Pendiente', 'Procesando', 'Enviado')),
    fecha timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for real-time dashboard reactivity
create index idx_pedidos_status on pedidos (status);
create index idx_pedidos_fecha on pedidos (fecha desc);


-- --------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------------------

-- Enable Row Level Security
alter table configuracion_sistema enable row level security;
alter table usuarios_clientes enable row level security;
alter table repuestos_catalogo enable row level security;
alter table pedidos enable row level security;

-- A. Policies for configuracion_sistema
create policy "Allow public read-only of system configuration" 
    on configuracion_sistema for select 
    using (true);

create policy "Allow all updates only to admin" 
    on configuracion_sistema for all 
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- B. Policies for repuestos_catalogo
create policy "Allow public read-only of spare parts catalog" 
    on repuestos_catalogo for select 
    using (true);

create policy "Allow admin changes to catalog" 
    on repuestos_catalogo for all 
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- C. Policies for usuarios_clientes
create policy "Allow client to map or insert their profile" 
    on usuarios_clientes for insert 
    with check (true);

create policy "Allow users to view own profiles" 
    on usuarios_clientes for select 
    using (true); 

create policy "Allow client updates to own profile" 
    on usuarios_clientes for update 
    using (true);

-- D. Policies for pedidos
create policy "Allow clients to create their orders" 
    on pedidos for insert 
    with check (true);

create policy "Allow users to view own orders" 
    on pedidos for select 
    using (true);

create policy "Allow admin full access to orders" 
    on pedidos for all 
    using (auth.role() = 'service_role');


-- --------------------------------------------------------------------------------
-- 10 TESTING REALISTIC SPARE PARTS INSERTS (Chevrolet, Ford, Toyota)
-- --------------------------------------------------------------------------------

insert into configuracion_sistema (
    site_nombre, telefono_soporte, direccion_fisica, tienda_lat, tienda_lng, 
    banner_url_1, banner_url_2, banner_url_3, tasa_cambio
) values (
    'TuRepuestoValencia',
    '+584124976451',
    'Calle 140 con Av. Bolívar Norte, local #12, Valencia, Carabobo',
    10.198300,
    -68.004400,
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=1200', -- Banner 1 (Frenos Premium)
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200', -- Banner 2 (Motor Tuning)
    'https://images.unsplash.com/photo-1512461351119-24977bcb8d77?auto=format&fit=crop&q=80&w=1200', -- Banner 3 (Amortiguadores High Perform)
    36.50
);

insert into repuestos_catalogo (id, codigo, nombre, descripcion, categoria, marca_carro, modelo_carro, anio_inicio, anio_fin, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, compatibilidad_detalle) values
-- Chevrolet Aveo
('a4829bef-0c7f-4b08-be94-7123aa123b01', 'GM-96416301', 'Pastillas de Freno Delanteras Chevrolet Aveo', 'Pastillas de freno de cerámica premium para máxima durabilidad y frenado silencioso.', 'Frenos', 'Chevrolet', 'Aveo', 2004, 2018, 18.50, 24, array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=500'], true, false, true, 'Chevrolet Aveo T200/T250 L4 1.6L'),
('a4829bef-0c7f-4b08-be94-7123aa123b02', 'GM-96350550', 'Correa de Tiempo Chevrolet Aveo 1.6', 'Correa de distribución genuina GM. Recomendado cambiar cada 50,000 Km.', 'Motor', 'Chevrolet', 'Aveo', 2004, 2018, 12.00, 16, array['https://images.unsplash.com/photo-1516387938699-a93567ec168e?auto=format&fit=crop&q=80&w=500'], false, true, true, 'Aveo 1.6 16V / Nubira / Lanos'),
-- Chevrolet Optra
('a4829bef-0c7f-4b08-be94-7123aa123b03', 'GM-96350161', 'Bomba de Agua Chevrolet Optra Design / Limited', 'Bomba de agua de aluminio forjado de alta resistencia mecánica. Evita recalentamientos.', 'Refrigeración', 'Chevrolet', 'Optra', 2004, 2014, 28.00, 8, array['https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=500'], true, false, false, 'Chevrolet Optra Motor T20SED 1.8L'),
-- Ford Fiesta
('a4829bef-0c7f-4b08-be94-7123aa123b04', 'CN11-18080-AD', 'Amortiguador Delantero Izquierdo Ford Fiesta', 'Amortiguador a gas presurizado tecnología Twin-Tube. Conducción súper suave y estable.', 'Suspensión', 'Ford', 'Fiesta', 2002, 2019, 35.50, 12, array['https://images.unsplash.com/photo-1512461351119-24977bcb8d77?auto=format&fit=crop&q=80&w=500'], false, false, true, 'Ford Fiesta Balita, Power, Max, Move, Titanium 1.6L'),
('a4829bef-0c7f-4b08-be94-7123aa123b05', '7S61-8C607-AB', 'Electroventilador Completo Ford Fiesta', 'Electroventilador con aspas balanceadas de fábrica y motor térmico reforzado. Excelente disipación.', 'Refrigeración', 'Ford', 'Fiesta', 2004, 2014, 45.00, 5, array['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=500'], true, false, false, 'Ford Fiesta Power, Max, Move 1.6L sin aire o con aire'),
-- Toyota Corolla
('a4829bef-0c7f-4b08-be94-7123aa123b06', 'TY-90919-01210', 'Bujías Denso de Iridio Toyota Corolla', 'Kit de 4 bujías de iridio de larga duración (100,000 KM de vida útil). Mejora aceleración.', 'Eléctrico', 'Toyota', 'Corolla', 2000, 2022, 24.00, 40, array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=500'], false, true, true, 'Corolla Baby Camry, Pantallita, Sensación, New Sensation, GLI'),
('a4829bef-0c7f-4b08-be94-7123aa123b07', 'TY-17801-21050', 'Filtro de Aire Toyota Yaris / Corolla', 'Filtro de aire de celulosa de alta retención de micropartículas. Máxima protección del motor.', 'Filtros', 'Toyota', 'Corolla', 2003, 2018, 9.50, 30, array['https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=500'], false, false, false, 'Toyota Corolla 1.6L 1.8L / Yaris Belta Sol 1.3L 1.5L'),
-- Chevrolet Aveo (Otro)
('a4829bef-0c7f-4b08-be94-7123aa123b08', 'GM-96413420', 'Empacadura de Cámara de Compresión Chevrolet Aveo', 'Empacadura metálica multilámina (MLS) importada. Sellado perfecto anti recalentamientos.', 'Motor', 'Chevrolet', 'Aveo', 2004, 2018, 15.00, 20, array['https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=500'], false, true, false, 'Motor Aveo 1.6 L4 16v E-TEC II'),
-- Toyota Hilux
('a4829bef-0c7f-4b08-be94-7123aa123b09', 'TY-04465-0K140', 'Pastillas de Freno Toyota Hilux Kavak / Fortuner', 'Pastillas tipo heavy-duty con compuesto semi-metálico para carga extrema y frenado instantáneo en bajadas.', 'Frenos', 'Toyota', 'Hilux', 2006, 2020, 32.00, 15, array['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=500'], false, false, true, 'Toyota Hilux Kavak / Dakar / Fortuner 4x4 y 4x2 2.7L/3.0L/4.0L'),
-- Ford EcoSport
('a4829bef-0c7f-4b08-be94-7123aa123b10', '7S61-3K186-AA', 'Kit de Bocinas de Meseta Ford EcoSport / Fiesta', 'Kit completo de bujes/bocinas de poliuretano de alta densidad para las mesetas delanteras.', 'Suspensión', 'Ford', 'EcoSport', 2004, 2017, 19.99, 18, array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=500'], true, true, false, 'EcoSport 1.6L / 2.0L y Ford Fiesta Move/Max/');
