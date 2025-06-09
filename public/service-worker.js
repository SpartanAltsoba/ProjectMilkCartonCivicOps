const CACHE_NAME = "civic-trace-ops-v1";
const API_CACHE_NAME = "civic-trace-ops-api-v1";

// Assets to cache immediately on service worker install
const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/manifest.json",
  "/_next/static/", // Next.js static files
  "/images/",
];

// API routes to cache with network-first strategy
const API_ROUTES = ["/api/data/states-counties", "/api/data/risk-scores"];

// Install event - cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Create API cache
      caches.open(API_CACHE_NAME),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name !== CACHE_NAME && name !== API_CACHE_NAME;
          })
          .map(name => {
            return caches.delete(name);
          })
      );
    })
  );
});

// Helper function to determine if a request is for an API route
const isApiRoute = url => {
  return API_ROUTES.some(route => url.pathname.startsWith(route));
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = url => {
  return STATIC_ASSETS.some(asset => url.pathname.startsWith(asset));
};

// Network-first strategy for API requests
const networkFirst = async request => {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Clone the response before caching it
    const responseToCache = networkResponse.clone();

    // Cache the response
    const cache = await caches.open(API_CACHE_NAME);
    await cache.put(request, responseToCache);

    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Cache-first strategy for static assets
const cacheFirst = async request => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // If not in cache, fetch from network
  const networkResponse = await fetch(request);

  // Cache the response for future
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, networkResponse.clone());

  return networkResponse;
};

// Fetch event - handle requests
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Handle API requests with network-first strategy
  if (isApiRoute(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Default to network-first for other requests
  event.respondWith(networkFirst(event.request));
});

// Handle background sync for offline form submissions
self.addEventListener("sync", event => {
  if (event.tag === "sync-forms") {
    event.waitUntil(syncForms());
  }
});

// Background sync function for forms
async function syncForms() {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();

    const formRequests = requests.filter(
      request => request.method === "POST" && request.headers.get("x-background-sync")
    );

    await Promise.all(
      formRequests.map(async request => {
        try {
          await fetch(request.clone());
          await cache.delete(request);
        } catch (error) {
          console.error("Background sync failed for request:", error);
        }
      })
    );
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Handle push notifications
self.addEventListener("push", event => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/images/icon-192x192.png",
    badge: "/images/badge-72x72.png",
    data: data.url,
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", event => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});
