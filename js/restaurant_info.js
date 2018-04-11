let restaurant, cacheShown = false;
var map;

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
		cacheShown = true;
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
	if (!cacheShown) {
		const title = document.createElement('h3');
		title.innerHTML = 'Reviews';
		container.appendChild(title);
	}

	if (!document.getElementById('new-review')) {
		const form = document.createElement('form');
		form.id = 'new-review';
		form.setAttribute('method', 'post');
		form.setAttribute('action', 'restaurant.html');
		form.addEventListener('submit', sendReview);

		const label = document.createElement('label');
		label.classList.add('label');
		label.innerHTML = 'Want to say something?';
		label.setAttribute('for', 'new-review-textarea');

		const textarea = document.createElement('textarea');
		textarea.id = 'new-review-textarea';
		textarea.required = true;
		textarea.setAttribute('rows', 4);
		textarea.setAttribute('placeholder', 'Write your review here');
		textarea.classList.add('form-control');

		const submit = document.createElement('button');
		submit.classList.add('btn');
		submit.innerHTML = 'Submit review';

		form.appendChild(label);
		form.appendChild(textarea);
		form.appendChild(submit);
		container.appendChild(form);
	}

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}

	const ul = document.getElementById('reviews-list');
	ul.innerHTML = '';
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
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
	if (cacheShown) {
		breadcrumb.querySelector('[aria-current]').remove();
	}
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

	if (!navigator.onLine) {
		// TODO: Save for later, man
		alert('Oops! No connectivity!');
		return;
	}

	// TODO: Add Name field and Stars selector
	const params = {
		restaurant_id: self.restaurant.id,
		name: 'Raúl López',
		rating: 5,
		comments: review
	};

	fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
			body: JSON.stringify(params),
			headers: {
				'Content-Type': 'application/json'
			},
			method: 'POST',
			referrer: 'no-referrer'
		})
		.then((data) => {
			return data.json();
		})
		.then((json) => {
			self.restaurant.reviews.push(json);
			fillReviewsHTML(self.restaurant.reviews);
			document.getElementById('new-review-textarea').value = '';
		})
		.catch((error) => {
			alert(error);
		});
};

document.getElementById('skip-content').addEventListener('click', function (event) {
	event.preventDefault();
	var target = event.srcElement.getAttribute('data-focus');
	document.getElementById(target).focus();
});
