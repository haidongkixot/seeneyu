/* eslint-disable no-restricted-globals */
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'seeneyu'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { deepLink: data.deepLink || '/' },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    tag: data.triggerType || 'default',
    renotify: true,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const deepLink = event.notification.data?.deepLink || '/'
  event.waitUntil(clients.openWindow(deepLink))
})
