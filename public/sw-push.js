// Custom Push Notifications Service Worker Extension for Marketo PWA
// Loaded dynamically via importScripts in the PWA Workbox SW

self.addEventListener('push', function(event) {
  try {
    if (!event.data) {
      console.warn('[SW Push] Evento push recibido sin payload de datos.');
      return;
    }

    const payload = event.data.json();
    console.log('[SW Push] Notificación recibida:', payload);

    // Mapeo flexible de campos en español (Supabase trigger) y en inglés (web-push estándar)
    const title = payload.titulo || payload.title || 'Marketo Supermercado 🍏';
    const body = payload.mensaje || payload.body || '';
    const icon = payload.icon || '/icon.png';
    const badge = '/badge.png'; // Icono monocromático pequeño para la barra de estado en móviles
    const image = payload.imagen_url || payload.image || null;
    const urlToOpen = payload.link_url || payload.url || '/';
    const tag = payload.tag || payload.id || `marketo-notif-${Date.now()}`;

    const options = {
      body: body,
      icon: icon,
      badge: badge,
      image: image,
      vibrate: [200, 100, 200], // Patrón de vibración tipo app nativa
      tag: tag,
      renotify: true, // Si llega una nueva con el mismo tag, vuelve a alertar con vibración/sonido
      requireInteraction: true, // Mantiene la notificación visible hasta que el usuario la descarte
      data: {
        url: urlToOpen
      },
      actions: [
        { action: 'open', title: 'Ver Detalles 🛒' },
        { action: 'close', title: 'Cerrar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW Push] Error procesando evento push:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  try {
    event.notification.close();

    if (event.action === 'close') {
      return;
    }

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Si hay una pestaña abierta de Marketo, reenfocarla y navegar a la URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url && 'focus' in client) {
            if (client.navigate) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        // Si no hay pestañas abiertas, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  } catch (error) {
    console.error('[SW Push] Error en clic de notificación:', error);
  }
});
