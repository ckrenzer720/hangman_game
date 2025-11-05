// ========================================
// CACHE MANAGER - HANGMAN GAME
// ========================================

/**
 * CacheManager class for unified caching strategy
 * Handles word list caching, settings persistence, statistics caching, and offline capability
 */
class CacheManager {
  constructor(options = {}) {
    this.storagePrefix = options.storagePrefix || 'hangman_';
    this.defaultExpiration = options.defaultExpiration || 24 * 60 * 60 * 1000; // 24 hours
    this.version = options.version || '1.0.0';
    this.maxCacheSize = options.maxCacheSize || 5 * 1024 * 1024; // 5MB
    this.enableCompression = options.enableCompression !== false;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };

    this.init();
  }

  /**
   * Initialize cache manager
   */
  init() {
    this.checkStorageAvailability();
    this.migrateOldCache();
    this.cleanupExpiredCache();
  }

  /**
   * Check if storage is available
   * @returns {boolean} True if storage is available
   */
  checkStorageAvailability() {
    try {
      const testKey = `${this.storagePrefix}test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.storageAvailable = true;
      return true;
    } catch (error) {
      this.storageAvailable = false;
      console.warn('[CacheManager] Storage not available:', error);
      return false;
    }
  }

  /**
   * Check if storage is available
   * @returns {boolean} True if storage is available
   */
  isStorageAvailable() {
    return this.storageAvailable !== false;
  }

  /**
   * Get cache key with prefix
   * @param {string} key - Cache key
   * @returns {string} Prefixed cache key
   */
  getCacheKey(key) {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {Object} options - Cache options
   * @returns {boolean} True if successful
   */
  set(key, value, options = {}) {
    if (!this.isStorageAvailable()) {
      this.cacheStats.errors++;
      return false;
    }

    try {
      const expiration = options.expiration || this.defaultExpiration;
      const version = options.version || this.version;
      const timestamp = Date.now();

      const cacheEntry = {
        value: value,
        version: version,
        timestamp: timestamp,
        expiration: timestamp + expiration,
        metadata: options.metadata || {}
      };

      const serialized = JSON.stringify(cacheEntry);
      
      // Check size before storing
      if (serialized.length > this.maxCacheSize) {
        console.warn(`[CacheManager] Cache entry too large: ${key}`);
        this.cacheStats.errors++;
        return false;
      }

      localStorage.setItem(this.getCacheKey(key), serialized);
      this.cacheStats.sets++;
      return true;
    } catch (error) {
      console.error(`[CacheManager] Error setting cache ${key}:`, error);
      this.cacheStats.errors++;
      
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
      
      return false;
    }
  }

  /**
   * Get cache entry
   * @param {string} key - Cache key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Cached value or default
   */
  get(key, defaultValue = null) {
    if (!this.isStorageAvailable()) {
      this.cacheStats.misses++;
      return defaultValue;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        this.cacheStats.misses++;
        return defaultValue;
      }

      const cacheEntry = JSON.parse(cached);
      
      // Check expiration
      if (Date.now() > cacheEntry.expiration) {
        this.delete(key);
        this.cacheStats.misses++;
        return defaultValue;
      }

      // Check version compatibility (optional, log warning if version mismatch)
      if (cacheEntry.version !== this.version) {
        console.warn(`[CacheManager] Version mismatch for ${key}: cached=${cacheEntry.version}, current=${this.version}`);
        // Still return value, but consider it stale
      }

      this.cacheStats.hits++;
      return cacheEntry.value;
    } catch (error) {
      console.error(`[CacheManager] Error getting cache ${key}:`, error);
      this.cacheStats.errors++;
      this.cacheStats.misses++;
      
      // Clean up corrupted cache entry
      try {
        localStorage.removeItem(this.getCacheKey(key));
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return defaultValue;
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   * @returns {boolean} True if successful
   */
  delete(key) {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(this.getCacheKey(key));
      this.cacheStats.deletes++;
      return true;
    } catch (error) {
      console.error(`[CacheManager] Error deleting cache ${key}:`, error);
      this.cacheStats.errors++;
      return false;
    }
  }

  /**
   * Check if cache entry exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean} True if exists and valid
   */
  has(key) {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return false;
      }

      const cacheEntry = JSON.parse(cached);
      
      // Check expiration
      if (Date.now() > cacheEntry.expiration) {
        this.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all cache entries with prefix
   * @param {string} pattern - Optional pattern to match keys
   * @returns {number} Number of entries cleared
   */
  clear(pattern = null) {
    if (!this.isStorageAvailable()) {
      return 0;
    }

    let cleared = 0;
    const keysToRemove = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          if (!pattern || key.includes(pattern)) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        cleared++;
      });

      return cleared;
    } catch (error) {
      console.error('[CacheManager] Error clearing cache:', error);
      return cleared;
    }
  }

  /**
   * Clean up expired cache entries
   * @returns {number} Number of entries cleaned up
   */
  cleanupExpiredCache() {
    if (!this.isStorageAvailable()) {
      return 0;
    }

    let cleaned = 0;
    const keysToRemove = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheEntry = JSON.parse(cached);
              if (Date.now() > cacheEntry.expiration) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // Corrupted entry, remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        cleaned++;
      });

      return cleaned;
    } catch (error) {
      console.error('[CacheManager] Error cleaning up cache:', error);
      return cleaned;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    if (!this.isStorageAvailable()) {
      return { ...this.cacheStats, available: false };
    }

    let totalSize = 0;
    let entryCount = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              totalSize += value.length;
              entryCount++;
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.cacheStats,
      available: true,
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      entryCount: entryCount,
      hitRate: `${hitRate}%`,
      maxSize: this.maxCacheSize,
      maxSizeKB: (this.maxCacheSize / 1024).toFixed(2)
    };
  }

  /**
   * Handle quota exceeded error by cleaning up old cache
   */
  handleQuotaExceeded() {
    console.warn('[CacheManager] Storage quota exceeded, cleaning up...');
    
    // Clean up expired entries first
    this.cleanupExpiredCache();
    
    // If still over quota, remove oldest entries
    const entries = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheEntry = JSON.parse(cached);
              entries.push({
                key: key,
                timestamp: cacheEntry.timestamp
              });
            }
          } catch (error) {
            // Ignore corrupted entries
          }
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 25% of entries
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }

      console.log(`[CacheManager] Removed ${toRemove} oldest cache entries`);
    } catch (error) {
      console.error('[CacheManager] Error handling quota exceeded:', error);
    }
  }

  /**
   * Migrate old cache format to new format
   */
  migrateOldCache() {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      // Migrate word list cache
      const oldWordCache = localStorage.getItem('hangman_cached_words');
      const oldWordCacheTime = localStorage.getItem('hangman_words_cache_time');
      
      if (oldWordCache && !this.has('words')) {
        try {
          const words = JSON.parse(oldWordCache);
          const timestamp = oldWordCacheTime ? parseInt(oldWordCacheTime) : Date.now();
          const expiration = timestamp + this.defaultExpiration;
          
          if (Date.now() < expiration) {
            this.set('words', words, {
              expiration: expiration - Date.now(),
              metadata: { migrated: true }
            });
            console.log('[CacheManager] Migrated word list cache');
          }
        } catch (error) {
          console.warn('[CacheManager] Error migrating word cache:', error);
        }
      }

      // Migrate statistics cache
      const oldStats = localStorage.getItem('hangmanStatistics');
      if (oldStats && !this.has('statistics')) {
        try {
          const stats = JSON.parse(oldStats);
          this.set('statistics', stats, {
            metadata: { migrated: true }
          });
          console.log('[CacheManager] Migrated statistics cache');
        } catch (error) {
          console.warn('[CacheManager] Error migrating statistics cache:', error);
        }
      }

      // Migrate theme settings
      const oldThemeSettings = localStorage.getItem('hangman-theme-settings');
      if (oldThemeSettings && !this.has('settings')) {
        try {
          const settings = JSON.parse(oldThemeSettings);
          this.set('settings', settings, {
            metadata: { migrated: true }
          });
          console.log('[CacheManager] Migrated theme settings cache');
        } catch (error) {
          console.warn('[CacheManager] Error migrating theme settings cache:', error);
        }
      }
    } catch (error) {
      console.error('[CacheManager] Error during migration:', error);
    }
  }

  /**
   * Export cache data for backup
   * @param {Array} keys - Optional array of keys to export (all if not specified)
   * @returns {Object} Backup data
   */
  exportBackup(keys = null) {
    if (!this.isStorageAvailable()) {
      return null;
    }

    const backup = {
      version: this.version,
      timestamp: Date.now(),
      data: {}
    };

    try {
      const keysToExport = keys || this.getAllKeys();
      
      keysToExport.forEach(key => {
        if (this.has(key)) {
          const cacheKey = this.getCacheKey(key);
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            backup.data[key] = JSON.parse(cached);
          }
        }
      });

      return backup;
    } catch (error) {
      console.error('[CacheManager] Error exporting backup:', error);
      return null;
    }
  }

  /**
   * Import cache data from backup
   * @param {Object} backup - Backup data
   * @param {boolean} overwrite - Whether to overwrite existing entries
   * @returns {Object} Import result
   */
  importBackup(backup, overwrite = false) {
    if (!this.isStorageAvailable() || !backup || !backup.data) {
      return { success: false, error: 'Invalid backup data' };
    }

    const result = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: 0
    };

    try {
      Object.keys(backup.data).forEach(key => {
        if (!overwrite && this.has(key)) {
          result.skipped++;
          return;
        }

        try {
          const cacheEntry = backup.data[key];
          // Validate cache entry structure
          if (cacheEntry && cacheEntry.value !== undefined) {
            localStorage.setItem(this.getCacheKey(key), JSON.stringify(cacheEntry));
            result.imported++;
          } else {
            result.errors++;
          }
        } catch (error) {
          console.error(`[CacheManager] Error importing ${key}:`, error);
          result.errors++;
        }
      });

      return result;
    } catch (error) {
      console.error('[CacheManager] Error importing backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all cache keys
   * @returns {Array} Array of cache keys (without prefix)
   */
  getAllKeys() {
    if (!this.isStorageAvailable()) {
      return [];
    }

    const keys = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          keys.push(key.substring(this.storagePrefix.length));
        }
      }
    } catch (error) {
      console.error('[CacheManager] Error getting keys:', error);
    }

    return keys;
  }

  /**
   * Validate cache entry
   * @param {string} key - Cache key
   * @param {Function} validator - Validation function
   * @returns {boolean} True if valid
   */
  validate(key, validator) {
    if (!this.has(key)) {
      return false;
    }

    try {
      const value = this.get(key);
      return validator ? validator(value) : true;
    } catch (error) {
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheManager;
}

