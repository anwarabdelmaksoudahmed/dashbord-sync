const CACHE_NAME = 'sync-app-v1';
const BASE_PATH = '/dashbord-sync/';

const urlsToCache = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}vite.svg`,
  `${BASE_PATH}favicon.ico`,
  `${BASE_PATH}assets/index.css`,
  `${BASE_PATH}assets/index.js`,
  `${BASE_PATH}assets/Dashboard.css`,
  `${BASE_PATH}assets/Dashboard.js`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 