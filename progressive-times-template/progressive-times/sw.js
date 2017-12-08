const cacheName = 'latestNews-v1';
const offlineUrl = 'offline-page.html';

self.addEventListener('install', event => {
	self.skipWaiting();
	event.waitUntil(
		caches.open(cacheName)
			.then(cache => cache.addAll([
				'./js/main.js',
				'./images/newspaper.svg',
				'./css/site.css',
				'./header.html',
				'./footer.html',
				'offline-page.html'
			]))
	);
});

self.addEventListener('activate', function(event) {
	self.clients.claim();
});

function timeout(delay) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(new Response('', {
        status: 408,
        statusText: 'Request timed out.'
      }));
    }, delay);
  });
}

function resolveFirstPromise(promises) {
  return new Promise((resolve, reject) => {

    promises = promises.map(p => Promise.resolve(p));

    promises.forEach(p => p.then(resolve));

    promises.reduce((a, b) => a.catch(() => b))
    .catch(() => reject(Error("All failed")));
  });
};

function streamArticle(url) {
  try {
	  new ReadableStream({});
  }
  catch(e){
	  return new Response("Stream not supported");
  }
  const stream = new ReadableStream({
	  start(controller){
			const startFetch = caches.match('header.html');
			const bodyData = fetch('data/${url}.html')
			.catch(() => new Response('Body fetch failed'));
			const endFetch = caches.match('footer.html');
			
			function pushStream(stream){
				const reader = stream.getReader();
				function read(){
					return reader.read().then(result => {
						if(result.done) return;
						controller.enqueue(result.value);
						return read();
					});
				}
				return read();
			}
			startFetch
			.then(response => pushStream(response.body))
			.then(() => bodyData)
			.then(response => pushStream(response.body))
			.then(() => endFetch)
			.then(response => pushStream(response.body))
			.then(() => controller.close());
	  }
  });
  return new Response(stream, {
	headers: { 'Content-Type': 'text/html'}
  })
}

function getQueryString ( field, url = window.location.href ) {
  const reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i' );
  const result = reg.exec(url);
  return result ? result[1] : null;
};


self.addEventListener('fetch', function (event) {

  const url = new URL(event.request.url);

  if (url.pathname.endsWith('/article.html')) {

    const articleId = getQueryString('id');
	 const articleURL = 'data-${articleId}';
	 event.respondWith(streamArticle(articleUrl));

  } else if (url.pathname.endsWith('/index.html')) {
    const indexUrl = 'data-index';

    // Respond with a stream
    event.respondWith(streamArticle(indexUrl));

  } else if (/googleapis/.test(event.request.url)) {

    // Check for the googleapis domain
    event.respondWith(
      resolveFirstPromise([
        timeout(500),
        fetch(event.request)
      ])
    );

  } else {

    // Else process all other requests as expected
    event.respondWith(
      caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            if(!response || response.status !== 200) {
              return response;
            }

            var responseToCache = response.clone();
            caches.open(cacheName)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

            return response;
          }
        ).catch(error => {
          // Check if the user is offline first and is trying to navigate to a web page
          if (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html')) {
            // Return the offline page
            return caches.match(offlineUrl);
          }
        });
      })
    );

  }
});
