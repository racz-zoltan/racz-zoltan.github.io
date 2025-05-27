
const CACHE_NAME = 'carrypass-shell-v1';
const CONFIG_CACHE = 'carrypass-configs-v1';
const ALLOWED_DOMAIN = 'https://carrypass.net';

const urlsToCache = [
  '/', '/index.html',
  'argon2-bundled.min.js', 'crypto-js.min.js', 'carrypass.min.js',
  'qrcode.min.js', 'lucide.min.js', 'html5-qrcode.min.js', 'eff_words_real.js',
  'carrypass-gold-transparent.png',
  'icon-192.png',
  'icon-512.png',
  'favicon.ico',
  'favicon.svg',
  'favicon-96x96.png',
  'apple-touch-icon.png',
  'carrypass-qr-code.svg',
  'carrypass-theme.css',
  'member_finalize_qr.png',
  'site.webmanifest',
  '/vault/README.md',
  '/vault/team-vault.json',
  '/splash-640x1136.png',
  '/splash-750x1334.png',
  '/splash-1125x2436.png',
  '/splash-1242x2688.png',
  '/splash-1536x2048.png',
  '/splash-2048x2732.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (![CACHE_NAME, CONFIG_CACHE].includes(key)) {
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});


self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // ✅ Handle vault files with special logic
  if (url.pathname.startsWith('/vault/')) {
    event.respondWith(handleConfigRequest(request));
    return;
  }

  // ✅ HTTPS enforcement (skip localhost)
  if (
    url.protocol !== 'https:' &&
    url.hostname !== 'localhost' &&
    url.hostname !== '127.0.0.1'
  ) {
    event.respondWith(
      new Response('HTTPS is required for this app.', {
        status: 403,
        statusText: 'Forbidden'
      })
    );
    return;
  }

  // ✅ Main fetch logic (cache-first for static assets)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // Only cache valid basic responses (not opaque, not errors)
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone);
        });

        return response;
      }).catch(() => {
        // ✅ Fallback: serve index.html if navigation request and offline
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        // Optional: fallback to offline.html or blank response
        return new Response("Offline and no cached version found.", {
          status: 503,
          statusText: "Service Unavailable"
        });
      });
    })
  );
});



async function handleConfigRequest(request) {
  const cache = await caches.open(CONFIG_CACHE);

  try {
    // Force bypass of internal HTTP cache
    const networkResponse = await fetch(request, { cache: "no-store" });

    if (!networkResponse || networkResponse.status !== 200) {
      throw new Error("Network fetch failed");
    }

    const headers = new Headers(networkResponse.headers);
    headers.set("x-cached-at", new Date().toISOString()); 
    headers.set("x-cache-source", "network");

    await cache.put(
      request,
      new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers
      })
    );

  
    return new Response(networkResponse.body, {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers
    });

  } catch (error) {
    const cached = await cache.match(request);

    if (cached) {
     
      const blob = await cached.blob();

      const originalHeaders = cached.headers;
      const cachedAt = originalHeaders.get("x-cached-at") || "unknown";

      const headers = new Headers(originalHeaders);
      headers.set("x-cached-at", cachedAt);
      headers.set("x-cache-source", "cache");

      return new Response(blob, {
        status: cached.status,
        statusText: cached.statusText,
        headers
      });
    }

    return new Response("Vault not available offline", { status: 404 });
  }
}

