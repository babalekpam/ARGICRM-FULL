// OPTIMIZED SERVICE WORKER - Minimal navigation interference
const CACHE_NAME = 'nodecrm-v4-optimized';

// MINIMAL: Only cache essential offline assets
const CRITICAL_ASSETS = [
  '/offline.html'
];

// Install - cache only critical assets
self.addEventListener('install', event => {
  console.log('SW: Installing optimized service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CRITICAL_ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating optimized service worker');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch - MINIMAL interference
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // COMPLETE BYPASS: Don't intercept navigation or any module requests
  if (request.mode === 'navigate' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      url.pathname.includes('/@fs/') ||
      url.pathname.includes('/src/') ||
      url.pathname.includes('/node_modules/') ||
      url.pathname.endsWith('.tsx') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.ts') ||
      request.method !== 'GET') {
    // Let browser handle these completely
    return;
  }

  // Only handle offline fallback for HTML pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Let everything else pass through normally
});