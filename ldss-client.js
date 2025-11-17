/**
 * LDSS - Local Distributed Storage System
 * Version: 0.1.0 (Experimental)
 * Author: Daouda Abdoul Anzize
 * Company: Nexus Studio
 * License: MIT
 * GitHub: https://github.com/Tryboy869/ldss
 */

// ============================================
// LDSS Main Class
// ============================================

class LDSS {
  constructor(config) {
    if (!config || !config.projectName) {
      throw new Error('[LDSS] projectName is required in config');
    }

    this.projectName = config.projectName;
    this.version = '0.1.0';
    this.mode = 'local'; // Hardcoded for v0.1.0
    this.workers = {};
    this.initialized = false;

    console.log(`[LDSS v${this.version}] Instance created for project: ${this.projectName}`);
  }

  /**
   * Initialize LDSS with 3 workers
   * Must be called before any operations
   */
  async init() {
    if (this.initialized) {
      console.warn('[LDSS] Already initialized');
      return this;
    }

    console.log(`[LDSS] Initializing for "${this.projectName}"...`);

    try {
      // Worker 1: IndexedDB (via Dexie.js wrapper concept)
      console.log('[LDSS] Initializing IndexedDB worker...');
      this.workers.db = await this._initIndexedDB();
      console.log('✅ [LDSS] IndexedDB worker ready');

      // Worker 2: Cache (localStorage wrapper)
      console.log('[LDSS] Initializing Cache worker...');
      this.workers.cache = await this._initCache();
      console.log('✅ [LDSS] Cache worker ready');

      // Worker 3: Search (in-memory)
      console.log('[LDSS] Initializing Search worker...');
      this.workers.search = await this._initSearch();
      console.log('✅ [LDSS] Search worker ready');

      this.initialized = true;
      console.log('✅ [LDSS] All workers initialized successfully');

      // Display capacity info
      await this._displayCapacity();

      return this;
    } catch (error) {
      console.error('❌ [LDSS] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store data in a collection
   * @param {string} collection - Collection name
   * @param {object} data - Data to store
   * @returns {Promise<object>} Result with id
   */
  async store(collection, data) {
    this._checkInitialized();

    if (!collection || typeof collection !== 'string') {
      throw new Error('[LDSS] collection must be a non-empty string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('[LDSS] data must be an object');
    }

    try {
      // Generate ID if not provided
      const id = data.id || this._generateId();
      const record = { ...data, id, _createdAt: Date.now() };

      // Store in IndexedDB
      await this.workers.db.store(collection, record);

      // Index searchable fields
      const searchableText = this._extractSearchableText(record);
      if (searchableText) {
        this.workers.search.index(collection, id, searchableText);
      }

      console.log(`[LDSS] Stored in ${collection}:`, id);
      return { success: true, id };
    } catch (error) {
      console.error('[LDSS] Store failed:', error);
      throw error;
    }
  }

  /**
   * Get a single item by ID
   * @param {string} collection - Collection name
   * @param {string|number} id - Item ID
   * @returns {Promise<object|null>} Item or null if not found
   */
  async get(collection, id) {
    this._checkInitialized();

    try {
      const item = await this.workers.db.get(collection, id);
      return item || null;
    } catch (error) {
      console.error('[LDSS] Get failed:', error);
      throw error;
    }
  }

  /**
   * Get all items from a collection
   * @param {string} collection - Collection name
   * @returns {Promise<Array>} Array of items
   */
  async getAll(collection) {
    this._checkInitialized();

    try {
      const items = await this.workers.db.getAll(collection);
      return items || [];
    } catch (error) {
      console.error('[LDSS] GetAll failed:', error);
      throw error;
    }
  }

  /**
   * Delete an item
   * @param {string} collection - Collection name
   * @param {string|number} id - Item ID
   * @returns {Promise<object>} Result
   */
  async delete(collection, id) {
    this._checkInitialized();

    try {
      await this.workers.db.delete(collection, id);
      this.workers.search.remove(collection, id);

      console.log(`[LDSS] Deleted from ${collection}:`, id);
      return { success: true };
    } catch (error) {
      console.error('[LDSS] Delete failed:', error);
      throw error;
    }
  }

  /**
   * Search across all collections
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async search(query) {
    this._checkInitialized();

    if (!query || typeof query !== 'string') {
      return [];
    }

    try {
      const results = this.workers.search.search(query);
      return results;
    } catch (error) {
      console.error('[LDSS] Search failed:', error);
      return [];
    }
  }

  /**
   * Clear all data from a collection
   * @param {string} collection - Collection name
   * @returns {Promise<object>} Result
   */
  async clear(collection) {
    this._checkInitialized();

    try {
      await this.workers.db.clear(collection);
      this.workers.search.clearCollection(collection);

      console.log(`[LDSS] Cleared collection: ${collection}`);
      return { success: true };
    } catch (error) {
      console.error('[LDSS] Clear failed:', error);
      throw error;
    }
  }

  /**
   * Get statistics about storage usage
   * @returns {Promise<object>} Storage stats
   */
  async getStats() {
    this._checkInitialized();

    try {
      const dbStats = await this.workers.db.getStats();
      const searchStats = this.workers.search.getStats();

      return {
        version: this.version,
        projectName: this.projectName,
        collections: dbStats.collections,
        totalItems: dbStats.totalItems,
        searchIndexSize: searchStats.indexSize,
        estimatedSize: dbStats.estimatedSize
      };
    } catch (error) {
      console.error('[LDSS] GetStats failed:', error);
      return null;
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  _checkInitialized() {
    if (!this.initialized) {
      throw new Error('[LDSS] Not initialized. Call await db.init() first.');
    }
  }

  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  _extractSearchableText(record) {
    const searchableFields = ['title', 'name', 'text', 'content', 'description'];
    const parts = [];

    for (const field of searchableFields) {
      if (record[field] && typeof record[field] === 'string') {
        parts.push(record[field]);
      }
    }

    return parts.join(' ').toLowerCase();
  }

  async _displayCapacity() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = ((usage / quota) * 100).toFixed(2);

      console.log(`[LDSS] Storage capacity: ${this._formatBytes(usage)} / ${this._formatBytes(quota)} (${percentUsed}%)`);
    }
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // ============================================
  // Worker Implementations
  // ============================================

  async _initIndexedDB() {
    const dbName = `ldss_${this.projectName}`;
    const version = 1;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;

        resolve({
          db,
          async store(collection, record) {
            const tx = db.transaction([collection], 'readwrite');
            const store = tx.objectStore(collection);
            await store.put(record);
          },

          async get(collection, id) {
            const tx = db.transaction([collection], 'readonly');
            const store = tx.objectStore(collection);
            return new Promise((resolve, reject) => {
              const request = store.get(id);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
          },

          async getAll(collection) {
            const tx = db.transaction([collection], 'readonly');
            const store = tx.objectStore(collection);
            return new Promise((resolve, reject) => {
              const request = store.getAll();
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
          },

          async delete(collection, id) {
            const tx = db.transaction([collection], 'readwrite');
            const store = tx.objectStore(collection);
            await store.delete(id);
          },

          async clear(collection) {
            const tx = db.transaction([collection], 'readwrite');
            const store = tx.objectStore(collection);
            await store.clear();
          },

          async getStats() {
            const collections = Array.from(db.objectStoreNames);
            let totalItems = 0;

            for (const collection of collections) {
              const tx = db.transaction([collection], 'readonly');
              const store = tx.objectStore(collection);
              const count = await new Promise((resolve) => {
                const request = store.count();
                request.onsuccess = () => resolve(request.result);
              });
              totalItems += count;
            }

            return {
              collections: collections.length,
              totalItems,
              estimatedSize: totalItems * 1024 // Rough estimate
            };
          }
        });
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create default collections
        const defaultCollections = ['default', 'todos', 'notes'];

        for (const name of defaultCollections) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        }
      };
    });
  }

  async _initCache() {
    const cachePrefix = `ldss_cache_${this.projectName}`;

    return {
      async get(key) {
        const value = localStorage.getItem(`${cachePrefix}_${key}`);
        return value ? JSON.parse(value) : null;
      },

      async set(key, value, ttl = 3600000) {
        const item = {
          value,
          expires: Date.now() + ttl
        };
        localStorage.setItem(`${cachePrefix}_${key}`, JSON.stringify(item));
      },

      async delete(key) {
        localStorage.removeItem(`${cachePrefix}_${key}`);
      },

      async clear() {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(cachePrefix)) {
            localStorage.removeItem(key);
          }
        }
      }
    };
  }

  async _initSearch() {
    const searchIndex = new Map();

    return {
      index(collection, id, text) {
        const key = `${collection}:${id}`;
        searchIndex.set(key, {
          collection,
          id,
          text: text.toLowerCase(),
          indexed: Date.now()
        });
      },

      search(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];

        for (const [key, entry] of searchIndex.entries()) {
          if (entry.text.includes(lowerQuery)) {
            results.push({
              collection: entry.collection,
              id: entry.id,
              score: this._calculateScore(entry.text, lowerQuery)
            });
          }
        }

        return results.sort((a, b) => b.score - a.score);
      },

      remove(collection, id) {
        const key = `${collection}:${id}`;
        searchIndex.delete(key);
      },

      clearCollection(collection) {
        for (const [key, entry] of searchIndex.entries()) {
          if (entry.collection === collection) {
            searchIndex.delete(key);
          }
        }
      },

      getStats() {
        return {
          indexSize: searchIndex.size
        };
      },

      _calculateScore(text, query) {
        const position = text.indexOf(query);
        if (position === 0) return 100; // Exact start match
        if (position > 0) return 50; // Substring match
        return 10; // Fuzzy match (already filtered by includes)
      }
    };
  }
}

// ============================================
// Export for different environments
// ============================================

// Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LDSS;
}

// ES6 Module
if (typeof exports !== 'undefined') {
  exports.LDSS = LDSS;
}

// Browser global
if (typeof window !== 'undefined') {
  window.LDSS = LDSS;
}