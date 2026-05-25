// Service Worker - Marketo Realtime Notifications (Premium)

const safeJsonParse = (value) => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
};

const getFallbacks = () => {
  return {
    icon: '/icon.png',
    badge: '/badge.png'
  };
};

self.addEventListener('push', (event) => {
  try {
    if (!event.data) return;

    const raw = event.data.json();
    const data = safeJsonParse(raw) || raw || {};

    const title = data.title || 'Marketo Supermercado';
    const body = data.body || '';

    const { icon, badge } = getFallbacks();

    // Dedupe: usa tag/id si viene
    const tag = data.tag || data.id || `marketo-${title}`;

    const urlToOpen = data.url || data.link_url || data.orderUrl || '/';

    const options = {
      body,
      icon,
      badge,
      vibrate: [200, 100, 200],
      renotify: true,
      requireInteraction: !!data.requireInteraction,
      // iOS/Chrome Android pueden ignorar sound desde Web Push (depende del SO).
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
  // hook opcional
});

