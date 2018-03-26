class IDBHelper {
	/**
	 * Returns true if the navigator supports IndexedDB
	 */
	static hasIDB() {
		return ('indexedDB' in window);
	}

	constructor(name) {
		this.name = name;
		this.version = 1;
		// Main configuration of the idb
		this.dbPromise = idb.open(name, this.version, function(upgradeDb) {
			switch(upgradeDb.oldVersion) {
				case 0:
					upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
			}
		});
	}

	/**
	 * Returns the promise of the IndexedDB
	 */
	dbPromise() {
		return this.dbPromise;
	}

	/**
	 * Returns a promise with the data from idb
	 * @param store: name of the store we want to look into
	 * @param key: key we're looking for
	 */
	get(store, key) {
		return this.dbPromise.then(function(db) {
			var tx = db.transaction(store);
			var keyValStore = tx.objectStore(store);
			return keyValStore.get(key);
		});
	}

	/**
	* Returns a promise with all the elements from store
	* @param store: name of the store we want to insert an element
	* @param index: index we want to search with
	* @param query: [Optional] values of index we want to get from the idb
	*/
	getAll(store, index, query) {
		return this.dbPromise.then(function(db) {
			var tx = db.transaction(store);
			var peopleStore = tx.objectStore(store);
			var animalIndex = peopleStore.index(index);

			return query ? animalIndex.getAll(query) : animalIndex.getAll();
		});
	}

	/**
	 * Returns a promise with the completion of the insertion
	 * @param store: name of the store we want to insert an element
	 * @param key: key of the new element
	 * @param value: value of the new element
	 * @param pairs: key-value pairs to insert
	 */
	put(store, data = {key, value, pairs}) {
		return this.dbPromise.then(function(db) {
			// We're sending pair data as a promise
			if (data.pairs) {
				return data.pairs.then(function(pairs) {
					// Once we have the pairs as a json we need to check
					// if there's more than one element
					var tx = db.transaction(store, 'readwrite');
					var keyValStore = tx.objectStore(store);
					if (Array.isArray(pairs)) {
						for (const pair of pairs) {
							keyValStore.put(pair);
						}
					}
					else{
						keyValStore.put(pairs);
					}
					return tx.complete;
				});
			}
			else if (data.key && data.value) {
				var tx = db.transaction(store, 'readwrite');
				var keyValStore = tx.objectStore(store);
				keyValStore.put(data.value, data.key);
				return tx.complete;
			}
		});
	}
}