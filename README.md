<div align="center">
  <h2>🍏 Marketo - Supermercado Express Premium 🍏</h2>
  <p><strong>Plataforma e-Commerce premium optimizada para PC y móvil inspirada en Farmatodo y Woolworths</strong></p>
  <p><i>Ubicación del Proyecto: Naguanagua y San Diego, Valencia, Estado Carabobo, Venezuela</i></p>
</div>

---

## 📋 Resumen del Proyecto

**Marketo** es una Single Page Application (SPA) ultra reactiva construida con **React**, **TypeScript** y **Tailwind CSS**. Rediseñada desde cero para reflejar un supermercado moderno con dialecto local venezolano (víveres, pasillos, estantes, origen nacional/importado), permitiendo compras fluidas con delivery calculado en base a geolocalización o retiro en tienda (Pick-up).

La plataforma incluye un **Panel Administrativo completo** para gestionar productos, pedidos en tiempo real, tasas de cambio (BCV), métodos de pago (Pago Móvil, Zelle, Efectivo), notificaciones push web y el **control dinámico de categorías/departamentos**.

---

## ✨ Características Principales

1. **Aesthetics Ultra-Premium (Violeta Estético):** Diseño moderno, gradientes suaves, micro-animaciones dinámicas y tipografías pulidas sin emojis genéricos (usando iconos unicolor de `lucide-react`).
2. **Dialecto y Operación Venezolana:**
   - Visualización de precios dual (USD $ / Bs. digital) calculada dinámicamente según la tasa del BCV configurada.
   - Términos adaptados: *Pasillos* en lugar de marcas de carro, *Estantes* en lugar de modelos, *Víveres/Frescos/Delicatessen* en lugar de autopartes, *Origen (Nacional/Importado)* en lugar de condición (Nuevo/Usado).
3. **Panel Administrativo de Última Generación:**
   - **Gestión de Inventario:** Creación, edición rápida, desactivación y control de stock de productos.
   - **Pedidos en Tiempo Real:** Monitorización de estatus (Recibido, Aprobado, Empaquetado, En Camino, Entregado, Cancelado), actualización de tiempos estimados de delivery y asignación de motorizados.
   - **Ajustes del Sistema:** Modificación de tasa BCV, métodos de pago, datos de cuenta para Pago Móvil / Zelle, costos de delivery por kilómetro, y carga de banners promocionales.
   - **Categorías Dinámicas:** Creación, edición y eliminación de departamentos con cascada automática que previene que los productos queden huérfanos.
4. **Buscador Inteligente:** Filtros por Pasillo, Estante, Preferencia/Dieta, Duración y Categoría, junto a un escáner integrado de código de barras SKU.
5. **Notificaciones Push y Web:** Sistema de notificaciones en tiempo real para alertar a los usuarios sobre el progreso de sus despachos y nuevas ofertas.

---

## 🛠️ Estructura del Código

El proyecto está organizado de forma escalable:
*   [src/types/store.ts](file:///e:/market1/src/types/store.ts) $\rightarrow$ Definición de modelos de datos (`AutoPart` para productos, `Order` para pedidos, `StoreConfig` para parámetros de configuración).
*   [src/store/AppContext.tsx](file:///e:/market1/src/store/AppContext.tsx) $\rightarrow$ Proveedor de estado global que maneja la persistencia en `localStorage`, la lógica comercial de pedidos, actualización de inventario, tasas de cambio y operaciones CRUD de categorías.
*   [src/pages/Admin.tsx](file:///e:/market1/src/pages/Admin.tsx) $\rightarrow$ Interfaz administrativa con pestañas de Pedidos, Inventario, Reportes Financieros y Configuración.
*   [src/pages/Home.tsx](file:///e:/market1/src/pages/Home.tsx) $\rightarrow$ Página de aterrizaje con carrusel de banners, burbujas de categorías dinámicas y colecciones destacadas (Promociones, Más Vendidos, Nuevos).
*   [src/pages/Catalog.tsx](file:///e:/market1/src/pages/Catalog.tsx) $\rightarrow$ Vista de cuadrícula con filtros de búsqueda avanzados en PC y móvil.
*   [src/pages/UserProfile.tsx](file:///e:/market1/src/pages/UserProfile.tsx) $\rightarrow$ Panel del cliente para revisar historial de pedidos, registrarse/iniciar sesión y configurar alertas.
*   [database_schema.sql](file:///e:/market1/database_schema.sql) $\rightarrow$ Script PostgreSQL DDL optimizado para base de datos de producción en Supabase.
*   [INTEGRATION.md](file:///e:/market1/INTEGRATION.md) $\rightarrow$ Manual paso a paso para el despliegue integrado en Supabase + GitHub + Cloudflare Pages.

---

## 🚀 Instalación y Desarrollo Local

### Prerrequisitos
*   [Node.js](https://nodejs.org) (versión 16 o superior)
*   Navegador moderno con soporte para Geolocalización y Notificaciones API.

### Paso 1: Clonar e Instalar dependencias
```bash
npm install
```

### Paso 2: Ejecutar el Servidor de Desarrollo
```bash
npm run dev
```
Abre tu navegador en [http://localhost:5173](http://localhost:5173).

### Paso 3: Compilar para Producción
```bash
npm run build
```
Esto generará los archivos optimizados en la carpeta `dist/`.

---

## 🔒 Credenciales de Acceso por Defecto (Entorno de Demostración)

*   **Acceso Cliente de Prueba:**
    *   **Teléfono:** `04124976451`
    *   **Contraseña:** `123456`
*   **Acceso Panel Administrativo:**
    *   **Usuario:** `admin`
    *   **Contraseña:** `admin123`

---

## 🌐 Despliegue en la Nube
Para configurar integraciones automáticas y bases de datos en la nube en **Supabase** y **Cloudflare Pages**, consulta la guía de integración detallada en:
👉 [INTEGRATION.md](file:///e:/market1/INTEGRATION.md)
