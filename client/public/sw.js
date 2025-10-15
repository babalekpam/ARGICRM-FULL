// Service Worker for NODE CRM Offline Capabilities
// Provides caching, background sync, and offline functionality

const CACHE_NAME = 'node-crm-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline use
const STATIC_RESOURCES = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/assets/colored-logo.png',
  '/assets/transparent-logo.png',
  '/offline.html'
];

// API endpoints that should work offline
const API_CACHE_PATTERNS = [
  /^\/api\/contacts/,
  /^\/api\/leads/,
  /^\/api\/deals/,
  /^\/api\/accounts/,
  /^\/api\/tasks/,
  /^\/api\/appointments/,
  /^\/api\/campaigns/,
  /^\/api\/projects/
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with cache-first or network-first strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

    // Skip service worker caching in development mode
  if (url.hostname.includes('replit.dev') || url.hostname.includes('replit.com') || url.port === '5173') {
    // In development, bypass service worker and go directly to network
    event.respondWith(fetch(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first, cache-fallback strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isOfflineCacheable = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));

  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests for offline use
    if (networkResponse.ok && request.method === 'GET' && isOfflineCacheable) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache for GET requests
    if (request.method === 'GET' && isOfflineCacheable) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('Serving API request from cache:', request.url);
        return cachedResponse;
      }
    }
    
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'This request failed because you are offline' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Network failed, return cached page or offline page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch static resource:', request.url);
    return new Response('Resource not available offline', { status: 404 });
  }
}

// Background sync for offline changes
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(syncOfflineChanges());
  }
});

// Sync offline changes when back online
async function syncOfflineChanges() {
  try {
    // Notify all clients to sync their offline changes
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_OFFLINE_CHANGES' });
    });
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications for when back online
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/colored-logo.png',
      badge: '/assets/transparent-logo.png',
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

console.log('Service Worker loaded for NODE CRM offline capabilities');