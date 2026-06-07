const CACHE_VERSION = '2026-06-01';
const ASSETS_TO_CACHE = [
  '/',
  '/style.css',
  '/loader.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_VERSION)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }

      const responseToCache = response.clone();
      caches.open(CACHE_VERSION).then((cache) => {
        cache.put(event.request, responseToCache);
      });

      return response;
    }).catch(() => {
      return caches.match(event.request).catch(() => {
        return new Response('リソースが取得できません', { status: 503 });
      });
    })
  );
});