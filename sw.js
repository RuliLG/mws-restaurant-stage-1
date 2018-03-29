var staticCacheName = 'restaurant-reviews-v8';
var contentImgsCache = 'restaurant-reviews-imgs-v5';
var allCaches = [
    staticCacheName,
    contentImgsCache
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll([
                '/',
                'restaurant.html',
                'js/main.js',
                'js/idb.js',
                'js/indexeddb.js',
                'js/dbhelper.js',
                'js/restaurant_info.js',
                'js/picturefill.min.js',
                'css/styles.css'
            ]).then(function () {
                return caches.open(contentImgsCache).then(function (imgCache) {
                    return imgCache.addAll([
                        'img/1.jpg',
                        'img/1_large.jpg',
                        'img/2.jpg',
                        'img/2_large.jpg',
                        'img/3.jpg',
                        'img/3_large.jpg',
                        'img/4.jpg',
                        'img/4_large.jpg',
                        'img/5.jpg',
                        'img/5_large.jpg',
                        'img/6.jpg',
                        'img/6_large.jpg',
                        'img/7.jpg',
                        'img/7_large.jpg',
                        'img/8.jpg',
                        'img/8_large.jpg',
                        'img/9.jpg',
                        'img/9_large.jpg',
                        'img/10.jpg',
                        'img/10_large.jpg',
                        'img/default.jpg',
                        'img/default_large.jpg',
                        'img/webp/1.webp',
                        'img/webp/1_large.webp',
                        'img/webp/2.webp',
                        'img/webp/2_large.webp',
                        'img/webp/3.webp',
                        'img/webp/3_large.webp',
                        'img/webp/4.webp',
                        'img/webp/4_large.webp',
                        'img/webp/5.webp',
                        'img/webp/5_large.webp',
                        'img/webp/6.webp',
                        'img/webp/6_large.webp',
                        'img/webp/7.webp',
                        'img/webp/7_large.webp',
                        'img/webp/8.webp',
                        'img/webp/8_large.webp',
                        'img/webp/9.webp',
                        'img/webp/9_large.webp',
                        'img/webp/10.webp',
                        'img/webp/10_large.webp',
                        'img/webp/default.webp',
                        'img/webp/default_large.webp',
                        'img/logo.svg'
                    ]);
                });
            });
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('restaurant-reviews-') &&
                        !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/img/') || requestUrl.pathname.startsWith('/icons/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
    }

    // Ignore map requests
    if (requestUrl.pathname.startsWith('/map')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) return response;

            return caches.open(staticCacheName).then(function (cache) {
                return fetch(event.request).then(function (networkResponse) {
                    cache.put(event.request.url, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});

function servePhoto(request) {
    var storageUrl = request.url;

    return caches.open(contentImgsCache).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

self.addEventListener('message', function (event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
