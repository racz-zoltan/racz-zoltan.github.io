const CACHE_NAME = 'carrypass-shell-v1';
const CONFIG_CACHE = 'carrypass-configs-v1';
const ALLOWED_DOMAIN = 'https://carrypass.net';

// List of files to cache for offline use
const urlsToCache = [
  '/pwa-carrypass-password.html',
  '/pwa-carrypass-text-encryption.html',
  '/pwa-carrypass-file-encryption.html',
  '/pwa-carrypass-teams.html',
  'jquery.min.js',
  'jquery-3.5.1.min.js',
  'crypto-js.min.js',
  'carrypass.min.js',
  'carrypass-teams.min.js',
  'qrcode.min.js',
  'lucide.min.js',
  'carrypass-multicolumn-theme.css',
  'carrypass-gold-transparent.png',
  'carrypass-gold.webp',
  'sample_QR.png',
  'favicon.ico',
  '/fonts/Inter_18pt-Regular.ttf',
  '/fonts/Inter_18pt-Medium.ttf',
  '/fonts/Inter_18pt-SemiBold.ttf',
  '/fonts/Inter_24pt-Bold.ttf',
  'configs/README.md',
  'configs/carrypass-pad.txt',
  'configs/carrypass-configs.json',
  'configs/carrypass-carrypass.encrypted.json'
];

// Install: Cache the app shell files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Skip waiting and activate immediately
});




// Service Worker activation: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (![CACHE_NAME, CONFIG_CACHE].includes(k)) {
            return caches.delete(k); // Delete old caches
          }
        })
      )
    )
  );
  self.clients.claim(); // Take control of the page immediately
});

// Handle caching for the files in the /configs/ folder
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // If the request is for a config file
  if (url.pathname.startsWith('/configs/')) {
    event.respondWith(handleConfigRequest(request)); // Handle the request with the new async function
    return;
  }

  // Default cache-first behavior for other resources (shell assets)
  event.respondWith(
    caches.match(request).then(cached => {
      return (
        cached ||
        fetch(request).then(networkResponse => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone); // Cache the network response
          });

          return networkResponse;
        })
      );
    })
  );
});

// Handle fetching and caching for config files
async function handleConfigRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // If no valid response, return the network response
    if (!networkResponse || networkResponse.status !== 200) {
      return networkResponse;
    }

    // Clone the response and add custom headers
    const headers = new Headers(networkResponse.headers);
    headers.set('x-cached-at', new Date().toISOString());

    // Open the CONFIG_CACHE and put the response in it
    const cache = await caches.open(CONFIG_CACHE);
    await cache.put(request, networkResponse.clone()); // Store the fresh response in cache

    // Return a new response with updated headers
    return new Response(networkResponse.body, {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers: headers
    });
  } catch (error) {
    // If network fails, serve the file from cache
    const cache = await caches.open(CONFIG_CACHE);
    return cache.match(request); // Return cached response
  }
}


// ENFORCE HTTPS AND TRUSTED DOMAIN

// Fetch event to intercept network requests
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Enforce HTTPS: if the request is not HTTPS, respond with an error.
  if (requestUrl.protocol !== 'https:') {
    event.respondWith(
      new Response('HTTPS is required for this app.', {
        status: 403,
        statusText: 'Forbidden'
      })
    );
    return;
  }

  // Only cache requests from the allowed domain
  if (requestUrl.origin === ALLOWED_DOMAIN) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          console.log('Serving from cache: ', event.request.url);
          return cachedResponse; // Serve from cache if available
        }

        // If not cached, fetch the resource and add it to cache
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            const clonedResponse = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clonedResponse);  // Cache the new file
            });
          }
          return networkResponse;  // Return the response from network
        });
      })
    );
  } else {
    // If the request is from a different domain, don't cache it
    console.log('Blocked non-trusted domain: ', requestUrl.origin);
    event.respondWith(fetch(event.request));  // Just fetch without caching
  }
});

