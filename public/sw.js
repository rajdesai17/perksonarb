// Service Worker for advanced caching strategies
const CACHE_NAME = 'buy-me-coffee-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/contract.json',
  '/_next/static/css/',
  '/_next/static/chunks/',
];

// Network-first resources (blockchain data)
const NETWORK_FIRST = [
  '/api/',
  'https://arb1.arbitrum.io/',
  'https://sepolia-rollup.arbitrum.io/',
];

// Cache-first resources (static assets)
const CACHE_FIRST = [
  '/_next/static/',
  '/favicon.ico',
  '/images/',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different caching strategies based on URL patterns
  if (NETWORK_FIRST.some(pattern => request.url.includes(pattern))) {
    // Network-first strategy for API calls and blockchain data
    event.respondWith(networkFirst(request));
  } else if (CACHE_FIRST.some(pattern => request.url.includes(pattern))) {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirst(request));
  } else if (url.origin === location.origin) {
    // Stale-while-revalidate for same-origin requests
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or error response
    return new Response('Network error and no cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch and cache:', error);
    return new Response('Resource not available', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignore network errors for background updates
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached version, wait for network
  return fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued actions when back online
  console.log('Background sync triggered');
  
  // You could implement queued transactions here
  // For now, just refresh critical data
  const cache = await caches.open(DYNAMIC_CACHE);
  
  // Clear old blockchain data to force refresh
  const keys = await cache.keys();
  const blockchainRequests = keys.filter(request => 
    request.url.includes('arbitrum.io') || 
    request.url.includes('/api/')
  );
  
  await Promise.all(blockchainRequests.map(request => cache.delete(request)));
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New coffee purchase!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'coffee-notification',
      renotify: true,
      actions: [
        {
          action: 'view',
          title: 'View Coffee'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Buy Me Coffee', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});