// Service worker: red primero y caché de respaldo, para instalar la app y usarla sin conexión
// sin quedarse con versiones antiguas cuando hay red.

const NOMBRE_CACHE = 'alondra-v1';
const ARCHIVOS_BASE = ['./', './index.html', './manifest.webmanifest', './css/index.css', './js/app.js', './iconos/icono.svg'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(NOMBRE_CACHE)
      .then((cache) => cache.addAll(ARCHIVOS_BASE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((nombre) => nombre !== NOMBRE_CACHE).map((nombre) => caches.delete(nombre))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(NOMBRE_CACHE).then((cache) => cache.put(request, copia));
        }
        return respuesta;
      })
      .catch(() => caches.match(request).then((guardada) => guardada ?? caches.match('./index.html'))),
  );
});
