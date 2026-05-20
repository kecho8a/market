# Documentación del Sistema - TuRepuestoValencia

Esta documentación proporciona una guía detallada sobre la arquitectura, instalación, configuración y mantenimiento del sistema de gestión de repuestos automotrices.

---

## 1. Guía de Instalación

### Requisitos Previos
- **Node.js**: Versión 18.0 o superior.
- **NPM**: Manejador de paquetes de Node.

### Pasos de Instalación
1. **Clonar o Cargar el Proyecto**: Asegúrate de tener los archivos en tu directorio de trabajo.
2. **Instalar Dependencias**: Ejecuta el siguiente comando en la raíz del proyecto:
   ```bash
   npm install
   ```
3. **Iniciar Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```
   El sistema estará disponible por defecto en `http://localhost:3000`.

---

## 2. Arquitectura del Sistema

El sistema es actualmente una **Single Page Application (SPA)** construida con:
- **React 19**: Biblioteca principal de UI.
- **Vite**: Herramienta de construcción y servidor de desarrollo.
- **Tailwind CSS**: Framework de estilos.
- **Lucide React**: Biblioteca de iconos.
- **Motion**: Biblioteca para animaciones.
- **AppContext**: Manejo de estado global y persistencia inicial mediante `localStorage`.

---

## 3. Conexión con Supabase (Persistencia Real)

Actualmente, el sistema utiliza `localStorage` para guardar datos, lo que significa que los datos son locales al navegador de cada usuario. Para una persistencia multi-usuario real, se recomienda conectar con **Supabase**.

### Pasos para Conectar Supabase:

#### A. Configuración en el Panel de Supabase
1. Crea una cuenta en [Supabase](https://supabase.com).
2. Crea un nuevo proyecto llamado `TuRepuestoValencia`.
3. Ve a la sección **SQL Editor** y ejecuta el contenido del archivo `/supabase/schema.sql`. Esto creará las tablas necesarias (parts, orders, users, config, notifications).

#### B. Instalación del Cliente
Instala la biblioteca del cliente en tu proyecto:
```bash
npm install @supabase/supabase-js
```

#### C. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto (basado en `.env.example`):
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

#### D. Implementación del Cliente
Crea un archivo `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### E. Migración de AppContext
Debes reemplazar los `useEffect` que guardan en `localStorage` en `src/store/AppContext.tsx` por llamadas asíncronas a Supabase usando `supabase.from('table').select/insert/update`.

---

## 4. Funcionamiento del Buscador Inteligente

El sistema incluye un buscador inteligente en `AppContext.tsx` (`searchPartsSemantically`) que utiliza:
- **Tokenización**: Divide la consulta en palabras clave.
- **Detección de Año**: Reconoce años del 1980 al 2026 en el texto.
- **Lógica de Filtros**: Combina marca, modelo, motor y año para ofrecer compatibilidad exacta.

---

## 5. Corrección de Errores Comunes

### Errores de Construcción (Build Errors)
Si `npm run build` falla:
- Verifica que no haya errores de TypeScript ejecutando `npm run lint`.
- Asegúrate de que todas las imágenes externas en `config` tengan una política de referer adecuada si falla la carga.

### Error: "ReferenceError: X is not defined"
Esto sucede usualmente cuando se usa un componente de `lucide-react` sin importarlo.
**Solución**: Verifica la línea de importación al principio del archivo y añade el icono faltante.

### Error: "AppContext must be used inside an AppProvider"
Esto ocurre si intentas usar el hook `useApp()` fuera de los componentes envueltos por `<AppProvider>` en `main.tsx`.

---

## 6. Optimización SEO

El sistema utiliza un componente autogestionado llamado `SEOHead.tsx` que:
- **Páginas de Producto**: Genera Meta Tags dinámicos basados en el nombre, código y compatibilidad del repuesto.
- **Páginas de Catálogo**: Optimiza las keywords según los filtros de marca y modelo activos.
- **Ubicación**: Inserta automáticamente "Valencia, Venezuela" y zonas específicas (San Diego, Naguanagua) en las descripciones para posicionamiento local.

---

## 7. Características Especiales

### Escáner de Códigos OEM (Barras)
El sistema incluye un módulo de escaneo avanzado (`BarcodeScanner.tsx`):
- **Cámara Real**: Intenta acceder a la cámara del dispositivo (`environment mode`) para escanear etiquetas físicas.
- **Emulador Integrado**: Debido a restricciones de seguridad en algunos navegadores/iframes, se incluye un emulador que permite seleccionar repuestos del stock para simular el escaneo exitoso.
- **Feedback Auditivo**: Utiliza la Web Audio API para emitir un "beep" de confirmación al detectar un código válido.

### Gestión Automática de Inventario
- **Alertas de Stock**: El sistema genera notificaciones automáticas inmediatas al administrador cuando un producto baja de 5 unidades.
- **Descuentos Dinámicos**: Los descuentos por método de pago (Zelle, Pago Móvil, etc.) se calculan automáticamente en el checkout basándose en la configuración global.
- **Tasa BCV Automática**: Al cargar, el sistema consulta `ve.dolarapi.com` para mantener los precios en Bolívares (Bs) sincronizados con la tasa oficial.

---

## 8. Consejos para Funcionamiento Óptimo

1. **Imágenes de Productos**: Usa imágenes optimizadas (WebP preferiblemente) y alojadas en servicios rápidos o en el almacenamiento de Supabase.
2. **Actualización de Tasa de Cambio**: El sistema intenta obtener la tasa BCV automáticamente desde una API externa al iniciar. Si falla, el administrador puede ajustarla manualmente desde el panel.
3. **PWA**: El sistema está configurado para comportarse como una Web App en móviles. Asegúrate de configurar un `manifest.json` completo para mejorar la experiencia de instalación.
4. **Seguridad**: Si implementas Supabase, asegúrate de activar **Row Level Security (RLS)** en tus tablas para que solo el admin pueda modificar productos y los usuarios solo puedan ver sus propios pedidos.

---

## 9. Administración del Sistema

### Acceso al Panel Administrativo
- **Ruta**: Puedes acceder haciendo clic en el icono de "Llave" o "Admin" (en el footer o menú).
- **Credenciales por Defecto**:
  - **Usuario**: `admin`
  - **Contraseña**: `admin123`
- **Funcionalidades**:
  - Gestión completa de inventario (CRUD).
  - Configuración de la tienda (Banners, Tasas, Datos de Pago).
  - Gestión de pedidos en tiempo real (Cambio de estados y notificaciones).
  - Visualización de estadísticas de ventas.

---

## 10. Conclusión
Este sistema está diseñado para ser ligero, rápido y fácil de escalar a una base de datos real. Siguiendo esta guía, podrás mantener el catálogo actualizado y ofrecer una experiencia de compra premium para repuestos automotrices en Valencia.
