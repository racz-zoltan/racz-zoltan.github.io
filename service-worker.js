
const CACHE_NAME = 'carrypass-shell-v1';
const CONFIG_CACHE = 'carrypass-configs-v1';
const ALLOWED_DOMAIN = 'https://carrypass.net';

const urlsToCache = [
  '/', '/index.html',
  'jquery.min.js', 'argon2-bundled.min.js', 'crypto-js.min.js', 'carrypass.min.js',
  'qrcode.min.js', 'lucide.min.js',
  'carrypass-gold-transparent.png',
  'carrypass-icon.webp',
  'favicon.ico',
  'favicon.svg',
  'favicon-96x96.png',
  'apple-touch-icon.png',
  'carrypass-qr-code.svg',
  'carrypass-theme.css',
  'member_finalize_qr.png',
  'site.webmanifest',
  '/fonts/Inter_18pt-Regular.ttf',
  '/fonts/Inter_18pt-Medium.ttf',
  '/fonts/Inter_18pt-SemiBold.ttf',
  '/fonts/Inter_24pt-Bold.ttf',
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

  // ✅ Always allow vault fetches
  if (url.pathname.startsWith('/vault/')) {
    event.respondWith(handleConfigRequest(request));
    return;
  }

  // ✅ Allow local dev over HTTP
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

  // ✅ Allow from allowed domains
  if (url.origin === ALLOWED_DOMAIN || url.origin === self.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          return response;
        });
      })
    );
  } else {
    event.respondWith(fetch(request));
  }
});

async function handleConfigRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (!networkResponse || networkResponse.status !== 200) return networkResponse;

    const headers = new Headers(networkResponse.headers);
    headers.set('x-cached-at', new Date().toISOString());

    const cache = await caches.open(CONFIG_CACHE);
    await cache.put(request, networkResponse.clone());

    return new Response(networkResponse.body, {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers: headers
    });
  } catch (error) {
    const cache = await caches.open(CONFIG_CACHE);
    return cache.match(request);
  }
}
