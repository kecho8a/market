# TODO - Push PWA (Marketo)

- [ ] Paso 1: Corregir `public/sw.js` para notificaciones push robustas (try/catch, dedupe/tag, fallbacks de icon/badge, datos para navegación, manejo premium en background).
- [x] Paso 2: Corregir `push-notify.ts` para que envíe **Web Push real** a `push_subscriptions` usando VAPID y WebPush.

- [ ] Paso 3: Verificar/ajustar el endpoint para que el front pueda disparar una “prueba” (crear request desde UI o usar webhook existente).
- [ ] Paso 4: Asegurar que `push_subscriptions` guarda y se usa correctamente `endpoint`, `p256dh`, `auth_secret` (compatibilidad con la librería WebPush).
- [ ] Paso 5: Añadir diagnóstico en UI (estado permiso + si existe suscripción guardada) y botón de prueba real (no solo `new Notification`).
- [ ] Paso 6: Ejecutar build y probar:
  - [ ] Push con app en background: debe aparecer notificación.
  - [ ] Click en notificación: abre URL correcta.
  - [ ] Sonido: verificar limitaciones por plataforma (Android vs iOS/Chrome).

