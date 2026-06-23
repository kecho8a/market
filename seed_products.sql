-- ============================================================
-- MARKETO: 60 Productos de supermercado venezolano
-- Basado en categorias de Kromi Online (kromionline.com)
-- Tasa BCV: ~612 Bs/USD (Junio 2026)
-- ============================================================
-- DIVIDIDO EN 8 LOTES PARA EVITAR ERROR "Failed to fetch"
-- Ejecutar cada bloque por separado en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- BLOQUE 1: LACTEOS Y QUESOS (10 productos)
-- ============================================================
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

-- ============================================================
-- BLOQUE 2: CARNES Y AVES (8 productos)
-- ============================================================
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

-- ============================================================
-- BLOQUE 3: CHARCUTERIA (8 productos)
-- ============================================================
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

-- ============================================================
-- BLOQUE 4: FRUTAS Y VERDURAS (8 productos)
-- ============================================================
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

-- ============================================================
-- BLOQUE 5: VIVERES Y DESPENSA (10 productos)
-- ============================================================
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

-- ============================================================
-- BLOQUE 6: PANADERIA Y PASTELERIA (8 productos)
-- ============================================================
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

-- ============================================================
-- BLOQUE 7: BEBIDAS Y JUGOS (8 productos)
-- ============================================================
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

-- ============================================================
-- BLOQUE 8: SNACKS Y DULCES (8 productos)
-- ============================================================
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
