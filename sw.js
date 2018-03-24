var staticCacheName = 'restaurant-reviews-v4';
var contentImgsCache = 'restaurant-reviews-imgs-v2';
var allCaches = [
	staticCacheName,
	contentImgsCache
];

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache) {
			return cache.addAll([
				'/',
				'js/main.js',
				'js/restaurant_info.js',
				'css/styles.css'
			]);
		})
	);
});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {
					return cacheName.startsWith('restaurant-reviews-') &&
						!allCaches.includes(cacheName);
				}).map(function(cacheName) {
					return caches.delete(cacheName);
				})
			);
		})
	);
});

self.addEventListener('fetch', function(event) {
	var requestUrl = new URL(event.request.url);
	console.log(requestUrl.pathname);
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
		caches.match(event.request).then(function(response) {
			if (response) return response;

			return caches.open(staticCacheName).then(function(cache) {
				return fetch(event.request).then(function(networkResponse) {
					cache.put(event.request.url, networkResponse.clone());
					return networkResponse;
				});
			});
		})
	);
});

function servePhoto(request) {
	var storageUrl = request.url;

	return caches.open(contentImgsCache).then(function(cache) {
		return cache.match(storageUrl).then(function(response) {
			if (response) return response;

			return fetch(request).then(function(networkResponse) {
				cache.put(storageUrl, networkResponse.clone());
				return networkResponse;
			});
		});
	});
}

self.addEventListener('message', function(event) {
	if (event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}
});