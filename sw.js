
const CACHE_NAME = 'hora-do-frango-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalação: Cacheia os arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Busca: Tenta Rede, se falhar tenta Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições de extensões ou esquemas estranhos
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, guarda uma cópia no cache (opcional para ativos estáticos)
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se a rede falhar, busca no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Se for uma navegação e não tiver no cache, retorna a página inicial
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
