/**
 * Common database helper functions.
 */
class DBHelper {

	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static get DATABASE_URL() {
		const port = 1337; // Change this to your server port
		return `http://localhost:${port}`;
	}

	/**
	 * Fetch all restaurants.
	 */
	static fetchRestaurants(id, useIDB = false) {
		let endpoint = `${DBHelper.DATABASE_URL}/restaurants`;
		if (Boolean(id)) {
			endpoint = `${endpoint}/${id}`;
		}
		
		// Use IDB if we are asked to
		if (useIDB && IDBHelper.hasIDB()) {
			var idbHelper = IDBHelper.getIDB();
			if (Boolean(id)) {
				return idbHelper.get('restaurants', parseInt(id));
			}
			return idbHelper.getAll('restaurants');
		}
		
		return fetch(endpoint)
			.then((data) => {
				var json = data.json();
				if (idbHelper) {
					idbHelper.put('restaurants', {pairs: json});
				}
				return json;
			});
	}

	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id, callback, useIDB = false) {
		DBHelper.fetchRestaurants(id, useIDB).then((restaurant) => {
				if (restaurant) { // Got the restaurant
					callback(null, restaurant);
				} else { // Restaurant does not exist in the database
					callback('Restaurant does not exist', null);
				}
			})
			.catch((error) => {
				callback(error, null);
			});
	}

	/**
	 * Fetch restaurants by a cuisine type with proper error handling.
	 */
	static fetchRestaurantByCuisine(cuisine, callback, useIDB = false) {
		DBHelper.fetchRestaurants(null, useIDB).then((restaurants) => {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter(r => r.cuisine_type == cuisine);
				callback(null, results);
			})
			.catch((error) => {
				callback(error, null);
			});
	}

	/**
	 * Fetch restaurants by a neighborhood with proper error handling.
	 */
	static fetchRestaurantByNeighborhood(neighborhood, callback, useIDB = false) {
		DBHelper.fetchRestaurants(null, useIDB).then((restaurants) => {
				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter(r => r.neighborhood == neighborhood);
				callback(null, results);
			})
			.catch((error) => {
				callback(error, null);
			});
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback, useIDB = false) {
		DBHelper.fetchRestaurants(null, useIDB).then((restaurants) => {
				let results = restaurants
				if (cuisine != 'all') { // filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') { // filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			})
			.catch((error) => {
				callback(error, null);
			});
	}

	/**
	 * Fetch all neighborhoods with proper error handling.
	 */
	static fetchNeighborhoods(callback, useIDB = false) {
		DBHelper.fetchRestaurants(null, useIDB).then((restaurants) => {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
				callback(null, uniqueNeighborhoods);
			})
			.catch((error) => {
				callback(error, null);
			});
	}

	/**
	 * Fetch all cuisines with proper error handling.
	 */
	static fetchCuisines(callback, useIDB = false) {
		DBHelper.fetchRestaurants(null, useIDB).then((restaurants) => {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
				callback(null, uniqueCuisines);
			})
			.catch((error) => {
				callback(error, null);
			});
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		return restaurant.photograph ? `/img/${restaurant.photograph}.jpg` : `/img/default.jpg`;
	}

	/**
	 * Restaurant large image URL.
	 */
	static largeImageUrlForRestaurant(restaurant) {
		return restaurant.photograph ? `/img/${restaurant.photograph}_large.jpg` : `/img/default_large.jpg`;
	}

	/**
	 * Restaurant webp image URL.
	 */
	static webpImageUrlForRestaurant(restaurant) {
		return restaurant.photograph ? `/img/webp/${restaurant.photograph}.webp` : `/img/webp/default.webp`;
	}

	/**
	 * Restaurant webp large image URL.
	 */
	static webpLargeImageUrlForRestaurant(restaurant) {
		return restaurant.photograph ? `/img/webp/${restaurant.photograph}_large.webp` : `/img/webp/default_large.webp`;
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP
		});
		return marker;
	}
}
