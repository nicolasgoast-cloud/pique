// Pique: guarda la app para usarla sin señal. El pronóstico se guarda aparte, en la propia app.
const VERSION = 'pique-v2';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.endsWith('open-meteo.com')) return; // siempre a la red; la app guarda la última respuesta
  const esFuente = url.hostname.includes('fonts.g') || url.hostname === 'cdnjs.cloudflare.com';
  if (url.origin === location.origin || esFuente) {
    // Red primero para la página (así llegan las actualizaciones), caché si no hay señal
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); }
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
    );
  }
});
