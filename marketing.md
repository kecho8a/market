# MARKETING.md — Guia Estrategica de Marketing y Ventas

## Vision del Producto

Marketo es una plataforma e-Commerce integral disenada especificamente para supermercados, bodegones y tiendas de conveniencia en Latinoamerica. No es una plataforma generica reutilizada: fue construida desde cero con el dialecto, la logistica y los hábitos de compra del mercado venezolano (y expandible a toda LATAM).

---

## 1. Funcionalidades del Sistema

### 1.1 Tienda Virtual (Cliente)
- **Catalogo inteligente** con busqueda por pasillo, estante, subseccion, marca y origen (Nacional/Importado)
- **Carrusel de banners** promocionales configurables desde el admin
- **Coleccion automatica**: Promociones, Mas Vendidos, Novedades
- **Carrito de compras** con cantidades editables y aplicacion de cupones de descuento
- **Checkout en 3 pasos**: Carrito → Metodo de Envio → Contacto y Pago
- **3 metodos de envio**: Delivery por mapa (geolocalizacion), Recogida en tienda (pick-up), Entrega por zonas con precios configurables
- **4 metodos de pago**: Pago Movil (Bs), Zelle (USD), Efectivo, Transferencia bancaria
- **Monedero dual**: Precios en USD con conversion automatica a Bs segun tasa BCV en tiempo real
- **Cupones de descuento** con limite de uso y fecha de expiracion
- **Perfil de usuario** con historial de pedidos, timeline de seguimiento y tiempo estimado de entrega
- **Notificaciones push** en tiempo real para cada cambio de estatus del pedido
- **PWA (Progressive Web App)**: Se instala como app nativa en Android e iOS sin pasar por Play Store/App Store

### 1.2 Panel de Administracion
- **Dashboard con metricas**: Ventas del dia, pedidos pendientes, productos con stock bajo, graficas de tendencia
- **Gestion de pedidos**: Avance de estatus en tiempo real (Pendiente → Procesando → En preparacion → En camino → Entregado), impresion de tickets, edicion de items
- **Gestion de inventario**: Alta, baja, edicion rapida, control de stock, activacion/desactivacion de productos, multiples imagenes por producto
- **Control de categorias**: Creacion, renombrado y eliminacion con cascada automatica
- **Cupones**: Crear, editar, activar/desactivar, limitar usos
- **Configuracion de delivery**: Zonas con nombre/costo/distancia, costo por km, envio nacional, recogida en tienda
- **Configuracion de pago**: Habilitar/deshabilitar metodos, datos de cuentas, descuentos por metodo
- **Tasa de cambio BCV** actualizable en tiempo real
- **Notificaciones push**: Envio grupal a todos los clientes o personalizado a uno solo
- **Gestion de usuarios**: Ver clientes registrados, editar datos
- **Banners promocionales**: 3 banners configurables con imagen y texto
- **Personalizacion visual**: Logo, favicon, color primario de la marca
- **Credenciales admin**: Cambio seguro de usuario y contrasena

### 1.3 Tecnologia y Arquitectura
- **React + TypeScript + Tailwind CSS**: Codigo tipado, mantenible y escalable
- **Supabase**: Base de datos PostgreSQL en tiempo real con autenticacion y storage
- **Cloudflare Pages**: Hosting global con CDN, despliegue automatico desde GitHub
- **Leaflet + OpenStreetMap**: Mapa open source para geolocalizacion de delivery
- **Workbox + Service Worker**: Cache inteligente, modo offline, push notifications via Web Push API
- **VAPID Keys**: Notificaciones push nativas sin dependencia de Firebase
- **WhatsApp Integration**: Envio automatico del pedido completo al numero de soporte
- **Responsive Design**: Optimizada para movil y escritorio
- **SEO On-Page**: Meta tags dinamicos, JSON-LD Schema, Open Graph

---

## 2. Beneficios por Segmento

### 2.1 Para el Dueño del Supermercado
| Beneficio | Impacto |
|-----------|---------|
| Sin comisiones de marketplace | Ahorra 15-30% que cobran Rappi, PedidosYa, Cafeto |
| Marca propia, sin intermediarios | El cliente compra directamente de tu tienda |
| Pedidos en tiempo real via WhatsApp | Respuesta inmediata sin apps adicionales |
| Control total de precios y promociones | Sin depender de politicas de terceros |
| Datos de clientes propios | Email, telefono, historial de compra para remarketing |
| Dashboard con metricas en vivo | Decisiones basadas en datos, no en suposiciones |
| Costo fijo mensual predecible | Sin comisiones por transaccion |

### 2.2 Para el Cliente
| Beneficio | Impacto |
|-----------|---------|
| Delivery express calculado por mapa | Sabe exactamente cuanto cuesta el envio antes de comprar |
| Recogida en tienda gratis | Opcion para quien quiere pasar a buscar su pedido |
| Seguimiento en tiempo real | Sabe en que momento esta su pedido con timeline animada |
| Notificaciones push | Alertas de ofertas, cambios de estatus, promociones |
| Pago flexible | 4 metodos: Pago Movil, Zelle, Efectivo, Transferencia |
| Catalogo con fotos y precios reales | Compra informada sin sorpresas |
| App instalable en el celular | Acceso rapido como una app nativa |

### 2.3 Para el Motorizado / Repartidor
| Beneficio | Impacto |
|-----------|---------|
| Datos completos del pedido | Nombre, direccion, mapa, monto a cobrar |
| Zona de entrega identificada | Sabe a que zona pertenece el delivery |
| Costo de envio visible | Transparencia en el cobro |

---

## 3. Propuesta de Valor

### Frase Principal
> "Tu supermercado en el bolsillo de cada cliente. Sin comisiones. Sin intermediarios. Con control total."

### Frase Alternativa
> "La plataforma de delivery que tu supermercado necesita, sin pagarle a Rappi."

### Diferenciadores Clave
1. **Zero Commission**: A diferencia de Rappi/PedidosYa que cobran 15-30% por pedido, Marketo es costo fijo
2. **Marca Propia**: Tu tienda, tu nombre, tu logo. El cliente nunca ve otra marca
3. **WhatsApp Nativo**: El 95% de los latinos usan WhatsApp. El pedido se envia directo a tu numero
4. **PWA sin App Store**: No necesitas pagar $99/año a Apple ni esperar revision de Google. Tu clientes instalan la app desde el navegador
5. **Delivery Inteligente**: Geolocalizacion real con Leaflet, zonas configurables, costos transparentes
6. **Hecho para LATAM**: Tasa BCV, Pago Movil, Zelle, dialecto local. No es un adaptado de Shopify

---

## 4. Tacticas de Marketing para Ofrecer el Sistema

### 4.1 Canal Principal: WhatsApp Business
**Estrategia**: Contacto directo con dueños de supermercados y bodegones

**Mensaje de apertura (ejemplo)**:
```
Hola [Nombre], vi que tu supermercado [Nombre del Super] tiene muy buenos productos pero no tiene delivery propio. Te cuento que creamos una plataforma que convierte tu tienda en una app de delivery SIN comisiones a Rappi. Tus clientes piden desde el celular, tu recibes el pedido por WhatsApp y lo despachas. Costo fijo mensual, sin sorpresas. Quieres que te muestre como funciona?
```

**Secuencia de follow-up**:
1. **Dia 1**: Mensaje de presentacion + demo rapida (30 seg video)
2. **Dia 3**: "Hola [Nombre], te dejo un ejemplo de como se ve la tienda de [referencia]. Los clientes pueden pedir desde el celular y tu recibes todo por WhatsApp"
3. **Dia 7**: "Sabias que Rappi te cobra hasta 30% por cada pedido? Con tu propia app eso se queda en tu bolsillo. Puedo mostrarte los numeros?"
4. **Dia 14**: "Ultimo dato: los supermercados que tienen su propia app de delivery reportan un aumento del 40% en pedidos. Cuando quieras que hagamos la prueba?"

### 4.2 Canal Secundario: Instagram/Facebook Ads
**Publico objetivo**: Dueños de supermercados, bodegones, minimercados en Valencia, Carabobo

**Formato recomendado**: Video corto (15-30 seg) mostrando:
1. El telefono del cliente abriendo la app
2. Navegando el catalogo
3. Agregando al carrito
4. Seleccionando delivery
5. El dueño recibiendo el pedido por WhatsApp

**Copy para anuncio**:
```
Tu supermercado necesita su propia app de delivery.

Sin comisiones de Rappi. Sin intermediarios.
Tu marca. Tus precios. Tu cliente.

Pedidos por WhatsApp en tiempo real.
Geolocalizacion para delivery exacto.
Pago Movil, Zelle, Efectivo.

Desde $29/mes. Sin contratos largos.

[Boton: Solicita tu demo gratis]
```

### 4.3 Canal Terciario: Referidos y boca a boca
**Programa de referidos**:
- Por cada supermercado que se suscriba por tu referencia, ambos reciben 1 mes gratis
- El supermercado referido obtiene: Setup gratuito + migracion de productos
- Tu obtienes: $29 de credito mensual

**Script para vendedores externos**:
```
"Te voy a mostrar algo que va a cambiar la forma en que vendes. Imagina que tu supermercado tiene su propia app, como Rappi pero sin pagarle nada a nadie. Tus clientes abren la app, eligen lo que quieren, y tu recibes el pedido por WhatsApp listo para despachar. Y lo mejor: cuesta menos de lo que te cobra Rappi por UN SOLO pedido."
```

### 4.4 Contenido Educational (Inbound Marketing)
**Blog/YouTube**: Videos cortos tipo " Como modernizar tu supermercado en 2026"

Topics:
1. "5 razones por las que tu supermercado necesita su propia app"
2. "Cuanto pierdes con Rappi? Hacemos la cuenta"
3. "Como un bodegon de Valencia triplico sus pedidos con delivery propio"
4. "PWA vs App nativa: Por que no necesitas Play Store"
5. "Delivery por geolocalizacion: El futuro del supermercado"

---

## 5. Personal Buyers: Equipo de Ventas

### 5.1 Estructura del Equipo
| Rol | Funcion | Meta mensual |
|-----|---------|-------------|
| **Gerente de Ventas** | Cierra acuerdos, maneja objeciones, cierra contratos | 5 suscripciones activas/mes |
| **Ejecutivo de Campo** | Visita presencial a supermercados, demo en vivo | 15 visitas/semana, 3 demos/dia |
| **Agente WhatsApp** | Contacto inicial por WA Business, calificacion de leads | 50 contactos/dia, 10 calificados |
| **Social Media Manager** | Manejo de anuncios, contenido, comunidad | 20 leads calificados/mes |

### 5.2 Proceso de Venta (Pipeline)
```
Lead → Contacto → Demo → Prueba (7 dias) → Cierre → Onboarding → Activacion
  │        │         │          │              │           │            │
  │   WhatsApp    Video      Gratis      Contrato     Setup      Primera
  │   o visita    15 min    funcional    mensual     productos   venta
```

**Conversion esperada**:
- 100 contactos → 30 demos → 15 pruebas → 8 cierres = **8% conversion final**
- Ticket promedio: $29-79/mes
- LTV (Lifetime Value): $500-1,200 por cliente activo
- Churn esperado: <5% mensual (stickiness alto por pedidos diarios)

### 5.3 Herramientas del Equipo
| Herramienta | Uso |
|-------------|-----|
| **Demo en vivo** | Link a demo.marketo.com con datos de prueba |
| **PDF de funcionalidades** | Resumen visual para enviar por WhatsApp |
| **Video testimonial** | Caso de exito del primer supermercado |
| **Calculadora de ROI** | "Cuanto ganarias sin comisiones de Rappi" |
| **Contrato modelo** | Template estandar de suscripcion |

### 5.4 Script de Demostracion (5 minutos)
```
MINUTO 1: "Mira, aqui esta tu supermercado en el telefono de tu cliente. 
Ves? Tiene tu logo, tu nombre, tus colores."

MINUTO 2: "El cliente busca 'queso manojo', lo encuentra, ve el precio 
en dolares y en bolivares automaticamente. Lo agrega al carrito."

MINUTO 3: "En el checkout elige: llevarlo el, que se lo lleven a su casa, 
o pasarlo a buscar en la tienda. Si elige delivery, el mapa calcula 
la distancia y el costo automaticamente."

MINUTO 4: "Tu recibes el pedido AQUI por WhatsApp. Mira, llego ahora mismo. 
Tiene todo: productos, direccion, metodo de pago. Solo tienes que 
empaquetarlo y mandarlo."

MINUTO 5: "Y lo mejor: sin comisiones. Rappi te cobra $3-5 por cada pedido. 
Esto te cuesta $29 al mes. Con 10 pedidos al dia ya lo pagaste."
```

---

## 6. Objeciones Comunes y Respuestas

| Objecion | Respuesta |
|----------|-----------|
| "Rappi ya me funciona" | "Si, pero te cobra 15-30% por pedido. Si haces 30 pedidos/dia a $3 promedio, eso es $2,700/mes que le das a Rappi. Con Marketo pagas $29 fijos" |
| "Mis clientes no van a usar una app" | "No es una app que se descarga. Es una PWA: el cliente entra desde WhatsApp o el navegador y la instala con un toque. Parece una app pero sin Play Store" |
| "No tengo personal para manejar pedidos" | "El pedido te llega por WhatsApp como un mensaje mas. No necesitas aprender nada nuevo. Es como recibir un pedido por telefono pero con todo organizado" |
| "No se de tecnologia" | "Nosotros nos encargamos de todo. Tu solo nos das tus productos, precios y logo. En 48 horas tu tienda esta online" |
| "Es muy caro" | "El plan basico cuesta menos que UNA sola comision de Rappi en un mes. Y con tus primeros 10 pedidos ya lo pagaste" |

---

## 7. Plan de Monetizacion

### Plan Basico — $29/mes
- Hasta 200 productos
- Delivery por mapa + Recogida en tienda
- 2 metodos de pago
- Notificaciones push basicas
- Soporte por WhatsApp

### Plan Profesional — $49/mes
- Productos ilimitados
- 3 metodos de envio (mapa + zonas + pick-up)
- 4 metodos de pago
- Cupones de descuento
- Banner promocionales
- Notificaciones push avanzadas
- Dashboard con metricas
- Soporte prioritario

### Plan Enterprise — $79/mes
- Todo lo del Plan Profesional
- Multi-sucursal
- API de integracion
- Personalizacion de marca completa
- Migracion de datos incluida
- Soporte dedicado 24/7

### Setup Inicial (one-time)
- Migracion de productos: $50 (hasta 500 productos)
- Fotografia de productos: $100 (hasta 100 fotos)
- Branding completo (logo + colores): $150

---

## 8. Metricas de Exito (KPIs)

| Metrica | Meta Mes 1 | Meta Mes 3 | Meta Mes 6 |
|---------|-----------|-----------|-----------|
| Supermercados activos | 3 | 10 | 30 |
| Pedidos promedio/cliente/dia | 5 | 15 | 25 |
| Ingreso mensual recurrente (MRR) | $87 | $490 | $1,470 |
| Churn rate | <10% | <7% | <5% |
| NPS (Net Promoter Score) | >40 | >50 | >60 |
| CAC (Customer Acquisition Cost) | $50 | $40 | $30 |
| LTV/CAC ratio | >3x | >5x | >8x |

---

## 9. Roadmap de Marketing (Primeros 90 Dias)

### Semana 1-2: Preparacion
- [ ] Crear cuenta Instagram @marketo.delivery
- [ ] Crear landing page con demo interactiva
- [ ] Preparar PDF de funcionalidades (5 paginas)
- [ ] Grabar video demo de 60 segundos
- [ ] Configurar WhatsApp Business con catalogo

### Semana 3-4: Primeros Leads
- [ ] Contactar 50 supermercados en Valencia por WhatsApp
- [ ] Hacer 10 demos presenciales
- [ ] Ofrecer 5 pruebas gratuitas de 7 dias
- [ ] Publicar 4 posts en Instagram (tips de delivery)

### Semana 5-8: Primeros Clientes
- [ ] Cerrar 3 suscripciones del Plan Basico
- [ ] Hacer onboarding con 2 clientes activos
- [ ] Recopilar primer testimonio en video
- [ ] Lanzar primera campana de Facebook Ads ($50/presupuesto)
- [ ] Crear grupo de WhatsApp con clientes activos

### Semana 9-12: Escalamiento
- [ ] Reclutar 1 ejecutivo de campo
- [ ] Expandir a San Diego y Naguanagua
- [ ] Lanzar programa de referidos
- [ ] Publicar 2 casos de exito en blog
- [ ] Alcanzar 10 clientes activos
- [ ] Evaluar expansion a Maracay o Barquisimeto

---

## 10. Frases de Poder para Ventas

- "Rappi le cobra a tu cliente Y a ti. Marketo solo te cobra una cuota fija."
- "Tu supermercado ya tiene clientes. Marketo les da la forma de pedir desde el celular."
- "No es una app generica. Es TU supermercado, con TU nombre, en el telefono de TU cliente."
- "El delivery no es el futuro. Es el presente. Y el que no tiene, pierde clientes."
- "Con $29 al mes tienes mas funcionalidades que una app de $10,000 desarrollada a medida."
- "WhatsApp es donde ya estan tus clientes. Marketo pone tu tienda ahi."
- "Cada dia que tu supermercado no tiene delivery propio, Rappi se queda con tu dinero."
- "Tus productos son excelentes. Falta que lleguen a mas personas. Marketo es el puente."

---

*Documento generado para el equipo comercial de Marketo. Actualizar trimestralmente con nuevos casos de exito y metricas de mercado.*
