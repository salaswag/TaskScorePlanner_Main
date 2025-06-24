
const CACHE_NAME = 'taskmaster-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch((error) => {
          console.log('Fetch failed; returning offline page instead.', error);
          // For navigation requests, return the cached index page
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});
