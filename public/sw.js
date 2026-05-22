// Service worker básico para permitir la instalación como PWA
const CACHE_NAME = 'ihasia-erp-v1';

self.addEventListener('install', (event) => {
  // Fuerza al SW a activarse inmediatamente sin esperar a que se cierren otras pestañas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simplemente responde con la petición de red (passthrough)
  // Requerido por Chrome para calificar como PWA instalable
  event.respondWith(fetch(event.request));
});
