
const CACHE_NAME = 'taskmaster-v3';

// Only cache truly static shell assets — NOT index.html or JS bundles
const SHELL_ASSETS = [
  '/manifest.json',
  '/icon.svg'
];

// Install: cache only the minimal shell
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately, don't wait for old tabs to close
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
  );
});

// Activate: delete all old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim()) // Take control of all open tabs
  );
});

// Fetch: network-first for everything
// Only fall back to cache if the network is truly offline
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls — never cache dynamic data
  if (request.url.includes('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Got a fresh response — cache it for offline fallback (except HTML)
        if (networkResponse.ok && !request.url.endsWith('.html') && request.destination !== 'document') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline) — try cache as fallback
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // For page navigations when offline, could show an offline page
          if (request.destination === 'document') {
            return new Response('<h1>Offline</h1><p>Check your connection and refresh.</p>', {
              headers: { 'Content-Type': 'text/html' }
            });
          }
        });
      })
  );
});
