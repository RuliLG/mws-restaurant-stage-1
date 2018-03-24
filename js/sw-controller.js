registerServiceWorker = () => {
	if (!navigator.serviceWorker) return;
	navigator.serviceWorker.register('/sw.js').then(function(reg){
	}).catch(function(err) {
		console.log(err);
	});
}

registerServiceWorker();