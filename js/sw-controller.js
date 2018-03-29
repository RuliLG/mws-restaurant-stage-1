class Controller {
	constructor() {
		this.registerServiceWorker();
	}
	
	registerServiceWorker() {
		if (!navigator.serviceWorker || !navigator.onLine) return;
		
		navigator.serviceWorker.register('/sw.js').then(function(reg){
		}).catch(function(err) {
			console.error(err);
		});
	}
}

new Controller();