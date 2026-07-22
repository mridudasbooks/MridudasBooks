/* MRIDU BOOK STUDIO — Service Worker v1.0.0 */
const CACHE_NAME = 'mridu-v1';
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/192.png',
  '/512.png'
];

/* Google Fonts — cache on first fetch, serve from cache thereafter */
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;700&family=Noto+Sans+Gujarati:wght@400;600;700&family=Noto+Serif+Gujarati:wght@400;700&family=Mukta:wght@400;600;700&family=Hind:wght@400;600;700&family=Baloo+2:wght@400;600;700&family=Merriweather:wght@400;700&family=EB+Garamond:wght@400;700&display=swap'
];

/* ── Install ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(SHELL_FILES).catch(err => {
        console.warn('[SW] Shell cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Navigation requests — serve shell */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(r => r || fetch(event.request))
    );
    return;
  }

  /* Google Fonts / external — network first, cache fallback */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  /* Everything else — cache first */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return response;
      }).catch(() => {
        /* offline fallback for HTML */
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

/* ── Background Sync placeholder ── */
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
});
