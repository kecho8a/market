// Custom Push Notifications Service Worker Extension for Marketo PWA
// Loaded via workbox importScripts (generateSW strategy)
// ⚠️  Audio API no está disponible en Service Workers — el sonido se delega al cliente vía postMessage

self.addEventListener('push', function(event) {
  try {
    if (!event.data) {
      console.warn('[SW Push] Evento push recibido sin payload de datos.');
      return;
    }

    const payload = event.data.json();
    console.log('[SW Push] Notificación recibida:', payload);

    // Mapeo flexible de campos en español (Supabase trigger) y en inglés (web-push estándar)
    const title  = payload.titulo  || payload.title  || 'Marketo Supermercado 🍏';
    const body   = payload.mensaje || payload.body   || '';
    const icon   = payload.icon   || '/icon.png';
    const badge  = '/badge.png';
    const image  = payload.imagen_url || payload.image || undefined;
    const urlToOpen = payload.link_url || payload.url || '/';
    const tag    = payload.tag || String(payload.id || Date.now());
    const soundUrl = payload.sound_url || payload.sound || '/sounds/notification.mp3';

    const options = {
      body: body,
      icon: icon,
      badge: badge,
      image: image,
      vibrate: [200, 100, 200],
      tag: tag,
      renotify: true,          // Vuelve a alertar aunque tenga el mismo tag
      requireInteraction: true, // Mantiene visible hasta que el usuario la descarte
      data: {
        url: urlToOpen,
        tag: tag,
        soundUrl: soundUrl
      },
      actions: [
        { action: 'open',  title: 'Ver Detalles 🛒' },
        { action: 'close', title: 'Cerrar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options).then(() => {
        // ✅ Delegar reproducción de sonido al cliente (única forma válida en SW)
        return self.clients
          .matchAll({ type: 'window', includeUncontrolled: true })
          .then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'PLAY_NOTIFICATION_SOUND',
                soundUrl: soundUrl
              });
            });
          });
      })
    );
  } catch (error) {
    console.error('[SW Push] Error procesando evento push:', error);
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PUSH_ERROR',
            error: '[SW Push] Error: ' + (error?.message || String(error))
          });
        });
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  try {
    event.notification.close();

    if (event.action === 'close') return;

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Reenfocar pestaña existente si la hay
        for (const client of clientList) {
          if ('focus' in client) {
            if (client.navigate) client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Si no hay pestaña abierta, abrir una nueva
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  } catch (error) {
    console.error('[SW Push] Error en clic de notificación:', error);
  }
});

// Escuchar mensajes de error del cliente
self.addEventListener('message', function(event) {
  if (event.data?.type === 'PUSH_CLIENT_ERROR') {
    console.error('[SW Push] Error reportado desde el cliente:', event.data.error);
  }
});
