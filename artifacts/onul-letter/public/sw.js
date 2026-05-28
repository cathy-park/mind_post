// 오늘의 편지 — Service Worker for Web Push

self.addEventListener('push', event => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: '오늘의 편지', body: event.data.text() }; }

  const title = data.title ?? '오늘의 편지 💌';
  const options = {
    body: data.body ?? '오늘 하루는 어떤 감정이었나요?',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'onul-reminder',
    renotify: true,
    data: { url: data.url ?? '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
