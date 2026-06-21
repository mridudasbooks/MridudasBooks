// Service Worker for MRIDUDAS BOOKS
// Versioned cache – update VERSION on every new deployment
const VERSION = 'v3';
const CACHE_NAME = `mridudas-books-${VERSION}`;

// Files to cache for offline shell
const STATIC_ASSETS = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Install event – cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: failed to cache some assets', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event – remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Message handler – process SKIP_WAITING from the app
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event – serve static from cache, network for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navigation requests (HTML pages) – network-first, then cache, then offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('index.html', clone));
        return response;
      }).catch(() => {
        return caches.match('index.html').then((cached) => {
          return cached || new Response(
            '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,sans-serif;background:#fffbeb;color:#1c1917;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px}</style></head><body><div><h1>MRIDUDAS BOOKS</h1><p>You are offline.</p><p>Please connect to the internet and try again.</p></div></body></html>',
            { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // For other static assets defined above, use cache-first strategy
  if (STATIC_ASSETS.some((asset) => request.url.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // All other requests (including Supabase) – go directly to network
  event.respondWith(fetch(request));
});