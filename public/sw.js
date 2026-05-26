// Listener para recibir la notificación push
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const payload = event.data.json();
  
  const options = {
    body: payload.mensaje,
    icon: payload.imagen_url || '/icon.png',
    badge: '/badge.png', // Icono pequeño en la barra de estado
    image: payload.imagen_url || null,
    vibrate: [100, 50, 100],
    data: {
      url: payload.link_url || '/'
    },
    actions: [
      { action: 'open', title: 'Ver ahora' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.titulo, options)
  );
});

// Listener para cuando el usuario hace clic en la notificación
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});