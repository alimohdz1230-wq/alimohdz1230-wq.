const CACHE_NAME = 'halaqat-v6';
const SCOPE_URL = new URL('./', self.location.href);
const INDEX_URL = new URL('./index.html', SCOPE_URL).href;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './pwa-144x144.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './apple-touch-icon.png',
  './assets/aistudio/1795538688943_0884cac0.jpg',
].map((asset) => new URL(asset, SCOPE_URL).href);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin === location.origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    const isManifestOrHtml =
      request.mode === 'navigate' ||
      url.href === SCOPE_URL.href ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('manifest.json');

    if (isManifestOrHtml) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(async () => {
            const matched = await caches.match(request);
            if (matched) return matched;
            return (await caches.match(INDEX_URL)) || (await caches.match(SCOPE_URL.href));
          })
      );
      return;
    }

    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
