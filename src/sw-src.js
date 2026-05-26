// Custom Service Worker - Marketo Push Notifications
// self.__WB_MANIFEST será inyectado por vite-plugin-pwa (injectManifest mode)

self.addEventListener('push', (event) => {
  try {
    if (!event.data) return;

    const data = event.data.json();

    const title = data.title || 'Marketo Supermercado';
    const body = data.body || '';
    const tag = data.tag || data.id || `marketo-${title}`;
    const urlToOpen = data.url || data.link_url || data.orderUrl || '/';

    const options = {
      body,
      icon: '/icon.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200],
      renotify: true,
      requireInteraction: !!data.requireInteraction,
      sound: data.sound || '/sounds/notification.mp3',
      image: data.image || undefined,
      tag,
      data: {
        url: urlToOpen,
        tag,
        orderId: data.orderId || data.order_id || undefined
      },
      actions: Array.isArray(data.actions)
        ? data.actions
        : [{ action: 'open', title: 'Ver pedido' }]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('SW push handler error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  try {
    event.notification.close();

    const urlToOpen = event.notification?.data?.url || '/';

    event.waitUntil(clients.openWindow(urlToOpen));
  } catch (err) {
    console.error('SW notificationclick error:', err);
  }
});

self.addEventListener('notificationclose', () => {
  // cleanup opcional
});