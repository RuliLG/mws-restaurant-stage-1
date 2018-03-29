var idbHelper = null;
class IDBHelper {
	/**
	 * Returns an instance of IDBHelper
	 */
	static getIDB() {
		if (IDBHelper.hasIDB()) {
			if (idbHelper === null) {
				idbHelper = new IDBHelper('restaurants');
			}
		}
		return idbHelper;
	}
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
	*/
	getAll(store) {
		return this.dbPromise.then(function(db) {
			var tx = db.transaction(store);
			var objectStore = tx.objectStore(store);
			return objectStore.getAll();
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