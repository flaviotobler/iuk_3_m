"use strict";

self.addEventListener('fetch', function(event) {
	if(/\.jpg$|.png$/.test(event.request.url)){
		var supportsWebp = false;
		if(event.request.headers.has('accept')){
			supportsWebp = event.request.headers
				.get('accept')
				.includes('webp');
		}
		if(supportsWebp){
			var req = event.request.clone();
			var returnUrl = req.url.substr(0, req.url.lastIndexOf(".")) + ".webp";
			event.respondWith(
				fetch(returnUrl, {
					mode: 'no-cors'
				})
			);
		}
	}
});