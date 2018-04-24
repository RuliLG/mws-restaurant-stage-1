let restaurant, cacheShown = false;
var map;

// TODO: Offline Indicator

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Fetchs restaurant from IDB and updates the HTML
 */
showCachedRestaurants = () => {
	const id = getParameterByName('id');
	DBHelper.fetchRestaurants(id, true).then((restaurant) => {
		// If they're already showing, do nothing
		if (self.restaurant || !restaurant) return;
		changePageTitle(restaurant);
		fillBreadcrumb(restaurant);
		fillRestaurantHTML(restaurant);
		DBHelper.checkOfflineReviews().then(() => {
			DBHelper.fetchReviews(restaurant.id, true).then((reviews) => {
				fillReviewsHTML(reviews);
				cacheShown = true;
			});
		});
	});
}

showCachedRestaurants();

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant)
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL'
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			changePageTitle();
			fillRestaurantHTML();
			callback(null, restaurant)
		});
	}
};

/**
 * Changes the page title
 */
changePageTitle = (restaurant = self.restaurant) => {
	document.title = `${restaurant.name} Restaurant Reviews`;
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;
	address.setAttribute('tabindex', '0');

	const largeImageSource = document.getElementById('restaurant-large-source');
	largeImageSource.setAttribute('srcset', DBHelper.largeImageUrlForRestaurant(restaurant));

	const imageWebp = document.getElementById('restaurant-webp');
	imageWebp.setAttribute('srcset', DBHelper.webpImageUrlForRestaurant(restaurant));

	const largeImageWebp = document.getElementById('restaurant-large-source-webp');
	largeImageWebp.setAttribute('srcset', DBHelper.webpLargeImageUrlForRestaurant(restaurant));

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	if (restaurant.photograph) {
		image.setAttribute('alt', `${restaurant.cuisine_type} Restaurant: ${restaurant.name}`);
	} else {
		image.setAttribute('alt', `Placeholder image for ${restaurant.name}, ${restaurant.cuisine_type} Restaurant`);
	}
	image.src = DBHelper.imageUrlForRestaurant(restaurant);

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;
	cuisine.setAttribute('tabindex', '0');

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML(restaurant.operating_hours);
	}
	// fill reviews
	DBHelper.fetchReviews(restaurant.id)
		.then((reviews) => {
			restaurant.reviews = reviews;
			fillReviewsHTML(reviews);
		});
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	hours.innerHTML = '';
	const tableHeader = document.createElement('thead');
	const rowHeader = document.createElement('tr');
	const dayHeader = document.createElement('th');
	dayHeader.innerHTML = 'Day of week';
	dayHeader.setAttribute('tabindex', '0');
	rowHeader.appendChild(dayHeader);

	const timeHeader = document.createElement('th');
	timeHeader.innerHTML = 'Open and close hours';
	timeHeader.setAttribute('tabindex', '0');
	rowHeader.appendChild(timeHeader);

	tableHeader.appendChild(rowHeader);
	hours.appendChild(tableHeader);

	const tableBody = document.createElement('tbody');

	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		day.setAttribute('tabindex', '0');
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		time.setAttribute('tabindex', '0');
		row.appendChild(time);

		tableBody.appendChild(row);
	}
	hours.appendChild(tableBody);
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
	const container = document.getElementById('reviews-container');
	container.innerHTML = '';
	const title = document.createElement('h3');
	title.innerHTML = 'Reviews';
	container.appendChild(title);
	
	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}

	const ul = document.createElement('ul');
	ul.id = 'reviews-list';
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);

	const form = document.createElement('form');
	form.id = 'new-review';
	form.setAttribute('method', 'post');
	form.setAttribute('action', 'restaurant.html');
	form.addEventListener('submit', sendReview);
	
	const nameLabel = document.createElement('label');
	nameLabel.classList.add('label');
	nameLabel.innerHTML = 'What\'s your name?';
	nameLabel.setAttribute('for', 'new-review-name');
	
	const nameInput = document.createElement('input');
	nameInput.id = 'new-review-name';
	nameInput.classList.add('form-control');
	nameInput.required = true;
	nameInput.setAttribute('placeholder', 'John Doe');
	nameInput.setAttribute('type', 'text');
	
	const starsLabel = document.createElement('label');
	starsLabel.classList.add('label');
	starsLabel.innerHTML = 'How would you score this restaurant?';
	starsLabel.setAttribute('for', 'new-review-stars');

	const messageLabel = document.createElement('label');
	messageLabel.classList.add('label');
	messageLabel.innerHTML = 'Want to say something?';
	messageLabel.setAttribute('for', 'new-review-textarea');

	const textarea = document.createElement('textarea');
	textarea.id = 'new-review-textarea';
	textarea.required = true;
	textarea.setAttribute('rows', 4);
	textarea.setAttribute('placeholder', 'Write your review here');
	textarea.classList.add('form-control');

	const submit = document.createElement('button');
	submit.classList.add('btn');
	submit.setAttribute('type', 'submit');
	submit.innerHTML = 'Submit review';

	form.appendChild(nameLabel);
	form.appendChild(nameInput);
	form.appendChild(starsLabel);
	form.appendChild(createStarSelector());
	form.appendChild(messageLabel);
	form.appendChild(textarea);
	form.appendChild(submit);
	container.appendChild(form);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');

	const starWrapper = document.createElement('div');
	starWrapper.classList.add('star');
	starWrapper.innerHTML = "&#9733;";
	li.appendChild(starWrapper);

	const nameAndDateContainer = document.createElement('div');
	nameAndDateContainer.classList.add('name-date-container');
	li.appendChild(nameAndDateContainer);

	const name = document.createElement('p');
	name.innerHTML = `&#128113; ${review.name}`;
	nameAndDateContainer.appendChild(name);

	let parsedTime = new Date(review.updatedAt);
	parsedTime = `${parsedTime.getMonth()+1}/${parsedTime.getDate()}/${parsedTime.getFullYear()}`;
	const date = document.createElement('p');
	date.innerHTML = `&#128467; ${parsedTime}`;
	nameAndDateContainer.appendChild(date);

	const rating = document.createElement('p');
	rating.innerHTML = `Rating: ${getReviewStars(review.rating)}`;
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
};

/**
 * Returns the rating as stars
 */
getReviewStars = (stars) => {
	if (stars > 5) stars = 5;
	if (stars < 1) stars = 1;
	let starsHTML = ``;
	for (let i = 0; i < stars; i++) {
		starsHTML += `&#9733;`;
	}
	return starsHTML;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumbNav = document.getElementById('breadcrumb');
	const breadcrumb = breadcrumbNav.querySelector('ol');
	if (breadcrumb.querySelector('[aria-current]')) return;
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	li.setAttribute('aria-current', 'page');
	breadcrumb.appendChild(li);
};

/**
 * Sends a review to the server
 */
sendReview = (event) => {
	event.preventDefault();
	let review = document.getElementById('new-review-textarea').value;
	review = review.trim();

	if (!review.length) {
		alert('Please, fill the review');
		return;
	}
	
	let name = document.getElementById('new-review-name').value;
	name = name.trim();

	if (!name.length) {
		alert('Please, enter a valid name');
		return;
	}
	
	let reviewScore = document.getElementById('new-review-stars').value;
	reviewScore = parseInt(reviewScore);
	if (Number.isNaN(review) || reviewScore <= 0 || reviewScore > 5) {
		alert('Please, enter a valid score');
		return;
	}

	const params = {
		restaurant_id: self.restaurant.id,
		name: name,
		rating: reviewScore,
		comments: review,
		updatedAt: Date.now()
	};

	if (!navigator.onLine) {
		// TODO: Show alert
		idbHelper.put('offline-reviews', {
			value: params
		});

		self.restaurant.reviews.push(params);
		fillReviewsHTML(self.restaurant.reviews);
		document.getElementById('new-review-textarea').value = '';
		return;
	}
	
	

	DBHelper.writeReview(params)
		.then((json) => {
			idbHelper.put('reviews', {
				value: json
			});
		
			self.restaurant.reviews.push(json);
			fillReviewsHTML(self.restaurant.reviews);
			document.getElementById('new-review-textarea').value = '';
		});
};

/**
 * Creates a star selector with the id passed by parameter
 */
createStarSelector = (id = 'new-review-stars') => {
	const input = document.createElement('input');
	input.setAttribute('type', 'hidden');
	input.setAttribute('aria-hidden', 'true');
	input.id = id;
	
	const starWrapper = document.createElement('div');
	starWrapper.classList.add('stars');
	
	starWrapper.appendChild(input);
	for (let i = 1; i <= 5; i++) {
		const star = document.createElement('button');
		star.classList.add('star');
		star.setAttribute('type', 'button');
		star.setAttribute('data-value', i);
		star.innerHTML = '&#9733;';
		
		star.addEventListener('click', _bindStar);
		starWrapper.appendChild(star);
	}
	return starWrapper;
};

_bindStar = (e) => {
	const starButton = e.srcElement;
	const starWrapper = starButton.parentNode;
	const stars = starWrapper.querySelectorAll('.star');
	const value = parseInt(starButton.getAttribute('data-value'));
	for (const star of stars) {
		if (parseInt(star.getAttribute('data-value')) <= value) {
			star.classList.add('active');
		}
		else {
			star.classList.remove('active');
		}
	}
	starWrapper.querySelector('input').value = value;
};

document.getElementById('skip-content').addEventListener('click', function (event) {
	event.preventDefault();
	var target = event.srcElement.getAttribute('data-focus');
	document.getElementById(target).focus();
});
