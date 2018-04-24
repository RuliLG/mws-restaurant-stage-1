let restaurants,
	neighborhoods,
	cuisines,
	shouldShowAriaSize;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	shouldShowAriaSize = false;
	showCachedRestaurants();
	DBHelper.checkOfflineReviews();
	fetchNeighborhoods();
	fetchCuisines();
});

/**
 * Fetchs restaurants, neighbourhoods and cuisines from IDB and updates the HTML
 */
showCachedRestaurants = () => {
	DBHelper.fetchRestaurants(null, true).then((restaurants) => {
		// If they're already showing, do nothing
		if (self.restaurants) return;
		self.restaurants = restaurants;
		fillRestaurantsHTML();
	});
	fetchNeighborhoods(true);
	fetchCuisines(true);
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = (useIDB = false) => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	}, useIDB);
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	
	const firstOption = select.querySelector('option');
	select.innerHTML = '';
	select.appendChild(firstOption);
	
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.appendChild(option);
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = (useIDB = false) => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	}, useIDB);
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	const firstOption = select.querySelector('option');
	select.innerHTML = '';
	select.appendChild(firstOption);
	
	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.appendChild(option);
	});
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});
	updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			shouldShowAriaSize = true;
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	})
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach((restaurant, index) => {
		ul.appendChild(createRestaurantHTML(restaurant, index));
	});
	addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant, index) => {
	const li = document.createElement('li');
	li.setAttribute('tabindex', '0');
	li.setAttribute('aria-label', `${restaurant.cuisine_type} Restaurant: ${restaurant.name}`);
	
	const favoriteButton = document.createElement('button');
	favoriteButton.classList.add('favorite');
	favoriteButton.innerHTML = '&#10084;';
	favoriteButton.setAttribute('aria-selected', restaurant.is_favorite);
	favoriteButton.setAttribute('data-restaurant', restaurant.id);
	favoriteButton.setAttribute('aria-label', restaurant.is_favorite ? `Unmark ${restaurant.name} restaurant as favorite` : `Mark ${restaurant.name} restaurant as favorite`)
	favoriteButton.addEventListener('click', function() {
		DBHelper.clickFavorite(this);
	});
	li.appendChild(favoriteButton);
	
	const imageLink = document.createElement('a');
	imageLink.href = DBHelper.urlForRestaurant(restaurant);
	imageLink.setAttribute("tabindex", "-1");
	li.appendChild(imageLink);
	
	const picture = document.createElement('picture');
	const sourceWebp = document.createElement('source');
	sourceWebp.setAttribute('type', 'image/webp');
	sourceWebp.setAttribute('srcset', DBHelper.webpImageUrlForRestaurant(restaurant));
	const image = document.createElement('img');
	image.className = 'restaurant-img';
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	
	picture.appendChild(sourceWebp);
	picture.appendChild(image);
	
	if (restaurant.photograph) {
		image.setAttribute('alt', `${restaurant.cuisine_type} Restaurant: ${restaurant.name}`);
	}
	else {
		image.setAttribute('alt', `Placeholder image for ${restaurant.name}, ${restaurant.cuisine_type} Restaurant`);
	}
	imageLink.appendChild(picture);

	const contentWrapper = document.createElement('div');
	contentWrapper.classList.add("content");
	li.appendChild(contentWrapper);

	const name = document.createElement('h2');
	name.innerHTML = restaurant.name;
	contentWrapper.appendChild(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	contentWrapper.appendChild(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	contentWrapper.appendChild(address);

	const more = document.createElement('a');
	more.classList.add('btn');
	if (index%2) {
		more.classList.add('btn-alt');
	}
	more.innerHTML = 'View details';
	more.setAttribute('aria-label', `View details about ${restaurant.name} restaurant`)
	more.href = DBHelper.urlForRestaurant(restaurant);
	if (shouldShowAriaSize) {
		li.setAttribute('aria-setsize', self.restaurants.length);
		li.setAttribute('aria-posinset', index+1);
	}
	contentWrapper.appendChild(more);

	return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	if (typeof google === 'undefined') return;
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url
		});
		self.markers.push(marker);
	});
};

document.getElementById('skip-content').addEventListener('click', function(event) {
	event.preventDefault();
	var target = event.srcElement.getAttribute('data-focus');
	document.getElementById(target).focus();
});