// Service Worker - Marketo Realtime Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'Marketo Supermercado';
  
  const options = {
    body: data.body,
    icon: '/icon.png', // Asegúrate de tener este icono en public
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    // La propiedad sound apunta a un archivo local
    // Nota: El soporte varía. En Android funciona mejor si el archivo es pequeño.
    sound: '/sounds/notification.mp3', 
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Ver Pedido' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});