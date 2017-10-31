self.addEventListener('fetch', function(event){
	if(/\.jpg$/.test(event.request.url)){
		event.respondWith(fetch('https://flaviotobler.github.io/iuk_3_m/images/unicorn.jpg'));
	}
});