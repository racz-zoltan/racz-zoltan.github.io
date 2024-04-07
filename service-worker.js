const CACHE_NAME = 'key-generator-cache-v1';
const urlsToCache = [
  '/',
  'bootstrap.min.css',
  'keygen_styles.css',
  'bootstrap.bundle.min.js',
  'jquery.min.js',
  'jquery-3.5.1.min.js',
  'crypto-js.min.js',
  'carrypass.js',
  // Add more files you want to cache here
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request to make a fetch request
        let fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response to cache it
            let responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
