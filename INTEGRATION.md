# Guía de Integración Cloud: Supabase, GitHub y Cloudflare Pages

Esta guía explica paso a paso cómo conectar la aplicación de **Marketo** con una arquitectura cloud profesional, utilizando **Supabase** como base de datos en tiempo real, **GitHub** para control de versiones y CI/CD, y **Cloudflare Pages** para hosting global rápido y seguro.

---

## 1. Integración con Supabase (Base de Datos)

Supabase proporciona una base de datos PostgreSQL, autenticación y almacenamiento de archivos.

### Paso 1: Configurar el proyecto en Supabase
1. Ve a [Supabase.com](https://supabase.com) e inicia sesión.
2. Haz clic en **New Project** y selecciona tu organización.
3. Escribe el nombre del proyecto (`Marketo`), establece una contraseña segura para la base de datos y elige la región más cercana a tus clientes (ej. `us-east-1` o `sa-east-1`).
4. Haz clic en **Create new project** y espera a que la base de datos se inicialice.

### Paso 2: Ejecutar el Esquema de Base de Datos
1. Una vez cargado el panel, navega a la sección **SQL Editor** en la barra lateral izquierda.
2. Haz clic en **New Query** $\rightarrow$ **Blank Query**.
3. Copia el contenido completo del archivo local [database_schema.sql](file:///e:/market1/database_schema.sql).
4. Pégalo en el editor SQL de Supabase y haz clic en **Run**.
5. Esto creará todas las tablas (`store_config`, `users`, `products`, `orders`, `order_items`, `notifications`), políticas RLS, índices, y poblará los datos de muestra iniciales (arepas, quesos, tocineta, etc.).

### Paso 3: Conectar la aplicación (React + TypeScript)
Instala las dependencias necesarias de Supabase en el proyecto:
```bash
npm install @supabase/supabase-js
```

Crea un cliente de Supabase en `src/store/supabaseClient.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 2. Configuración de Control de Versiones con GitHub

### Paso 1: Inicializar el repositorio Git local
Si no está inicializado, ejecuta en tu terminal:
```bash
git init
git add .
git commit -m "feat: migración completa a supermercado Marketo con categorías dinámicas"
```

### Paso 2: Crear el repositorio en GitHub
1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio llamado `marketo-supermarket` (público o privado).
3. Vincula tu repositorio local y sube la rama principal:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/marketo-supermarket.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Despliegue en Cloudflare Pages

Cloudflare Pages ofrece distribución a través de CDN global ultrarrápida, ideal para Single Page Applications (SPA).

### Paso 1: Crear el archivo de redirección SPA
Para evitar errores `404 Not Found` al recargar páginas secundarias (como `/catalog` o `/admin`), crea un archivo llamado `_redirects` en la carpeta `public/` de tu proyecto con la siguiente línea:
```text
/*    /index.html   200
```

### Paso 2: Conectar Cloudflare con GitHub
1. Entra a tu panel de [Cloudflare](https://dash.cloudflare.com).
2. Ve a **Workers & Pages** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
3. Autoriza tu cuenta de GitHub y selecciona el repositorio `marketo-supermarket`.
4. Configura los parámetros de compilación:
   - **Framework preset**: `Vite` (o `Create React App` si corresponde)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist` (o `build`)
5. En **Environment variables**, agrega las credenciales de Supabase que obtuviste en el paso 1:
   - `VITE_SUPABASE_URL` = `https://tu-id-de-proyecto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `tu-clave-anonima-publica`
6. Haz clic en **Save and Deploy**.

### Paso 3: Flujo CI/CD Automático
¡Listo! Cada vez que hagas un `git push` a la rama `main` en GitHub, Cloudflare detectará el cambio automáticamente, compilará el proyecto en menos de 2 minutos y actualizará la aplicación globalmente sin interrupción de servicio.
