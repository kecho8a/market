## Plan aplicado: Push PWA Marketo

### Paso 1 (primordial): `public/sw.js`
- Mejorar `push` handler para:
  - try/catch y log
  - deduplicación por `data.tag` o `data.id`
  - opciones más robustas: `renotify`, `requireInteraction` (si aplica), `image`, `badge`
  - fallback de `icon/badge`
  - `event.waitUntil()` con promesa real

### Paso 2 (faltantes críticos): `push-notify.ts`
- Convertir el handler en un endpoint que realmente:
  - busca todas las suscripciones de `push_subscriptions`
  - envía Web Push con `web-push` (o equivalente) usando VAPID
  - soporta target opcional por usuario/teléfono
  - maneja errores por suscripción individual y devuelve resultados

### Validación final
- Build + prueba en móvil:
  - push en 2º plano
  - sonido (limitado por SO)
  - clic abre URL

