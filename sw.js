const CACHE_NAME = 'macro-meal-v2';

// 1. Instalação do Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// 2. Ativação: Limpa os caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Busca primeiro na rede (internet); se falhar/offline, busca no cache
self.addEventListener('fetch', (e) => {
  // Ignora requisições de APIs externas (como a do Open Food Facts) para não travar a busca
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Se conseguir buscar da internet, atualiza a cópia no cache
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Se estiver offline, entrega o que está salvo no cache
        return caches.match(e.request);
      })
  );
});
