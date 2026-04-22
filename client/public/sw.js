// Простой service worker: кеширует статику, для API — всегда сеть с фолбэком на кеш.
// Карточные тайлы (CartoDB) кешируются лениво — карта работает offline там, где уже смотрели.

const VERSION = 'v1';
const STATIC_CACHE = `blink-static-${VERSION}`;
const TILES_CACHE = `blink-tiles-${VERSION}`;
const RUNTIME_CACHE = `blink-runtime-${VERSION}`;

const STATIC_ASSETS = ['/', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, TILES_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

const isTileRequest = (url) => /basemaps\.cartocdn\.com|tile\.openstreetmap\.org/.test(url);
const isApiRequest = (url) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/') || url.pathname === '/health';
const isSameOrigin = (url) => url.origin === self.location.origin;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API и Sockets — всегда только сеть, не перехватываем
  if (isApiRequest(url)) return;

  // WebSocket и нестандартные схемы
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  // Тайлы карты — stale-while-revalidate
  if (isTileRequest(url.href)) {
    event.respondWith(
      caches.open(TILES_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((resp) => {
            if (resp.ok) cache.put(req, resp.clone());
            return resp;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Навигация по SPA — отдаём index из кеша, если сеть упала
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/') || new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Прочая статика своего origin — cache-first
  if (isSameOrigin(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          }
          return resp;
        });
      })
    );
  }
});
