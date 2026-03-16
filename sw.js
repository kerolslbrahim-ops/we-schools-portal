const CACHE_NAME = 'we-portal-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/assets/logo-moe.png',
  '/assets/logo-we-community-square.png',
  '/assets/logo-partners.png',
  '/assets/icon-user.png',
  '/assets/icon-pass.png',
  '/assets/pattern.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets');
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch Assets
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
