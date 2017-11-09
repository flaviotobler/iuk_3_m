var cacheName = 'latestNews-v1';

// Cachen der Bekannten Ressourcen wärend der Installation
self.addEventListener('install', event => {
	event.waitUntil(
	caches.open(cacheName)
	.then(cache => cache.addAll([
		'./js/main.js',
		'./js/article.js',
		'./images/newspaper.svg',
		'./css/site.css',
		'./data/latest.json',
		'./data/data-1.json',
		'./article.html',
		'./index.html'
		]))
	);
});

// Cachen der noch nicht gespeicherten Ressourcen beim Aufruf
self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request, { ignoreSearch: true}).then(function(response){
			if(response){
				return response;
			}
			else if(event.request.headers.get('save-data')){
				if(event.request.url.includes('fonts.googleapis.com')){
					event.respondWith(new Response('',{status: 417, statusText: 'Ignore fonts to save data.'}));
				}
			}
			var requestToCache = event.request.clone();
			return fetch(requestToCache).then(function(response){
				if(!response || response.status !== 200){
					return response;
				}
				var responseToCache = response.clone();
				caches.open(cacheName).then(function(cache){
					cache.put(requestToCache, responseToCache);
				});
				return response;
			});
		})
		
	);
});