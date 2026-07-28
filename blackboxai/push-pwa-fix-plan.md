# Plan de Corrección: Push Notifications en PWA Móvil

## Problema
En móvil con PWA instalada: el sonido se reproduce pero la notificación nativa NO aparece.

## Causa Raíz
`self.registration.showNotification()` está fallando silenciosamente debido a:
1. `image: undefined` pasado explícitamente en las opciones
2. Icono por defecto `/icon-192.png` inexistente
3. Falta `requireInteraction: true`

## Archivos a modificar

### 1. `public/sw-push.js` - Service Worker Push Handler
**Cambios:**
- Eliminar la propiedad `image` si es `undefined` (no pasarla al objeto options)
- Cambiar icono por defecto de `/icon-192.png` a `/icon.png`
- Actualizar `badge` por defecto a `/badge.png` (existe en el proyecto)
- Agregar `requireInteraction: true` para mantener visible la notificación
- En el catch block, reintentar `showNotification` con el icono corregido antes de hacer fallback a in-app

### 2. `functions/api/push-notify.ts` - Cloudflare Function
**Cambios:**
- No incluir `image` en `payloadForSW` si `record.imagen_url` es falsy
- Asegurar que `icon` y `badge` usen rutas que existen (`/icon.png`)

### 3. `src/App.tsx` - In-App Toast
**Cambios:**
- Mejorar manejo del mensaje `SHOW_IN_APP_NOTIFICATION` desde SW
- Asegurar que el toast in-app funcione como respaldo

### 4. `public/manifest.json` - Opcional
- Verificar que los iconos referenciados existan

## Pruebas
1. Probar en Chrome DevTools con emulación móvil
2. Probar en PWA instalada en Android
3. Verificar que `showNotification` ya no lance error en consola SW

