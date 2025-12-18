// ========================================
// OFFLINE MANAGER - HANGMAN GAME
// ========================================

/**
 * OfflineManager class for handling offline capability
 * Provides fallback mechanisms and offline detection
 */
class OfflineManager {
  constructor(options = {}) {
    this.cacheManager = options.cacheManager || null;
    this.onlineCallbacks = [];
    this.offlineCallbacks = [];
    this.isOnline = navigator.onLine;
    this.retryQueue = [];
    this.retryInterval = options.retryInterval || 5000; // 5 seconds
    this.maxRetries = options.maxRetries || 3;

    this.init();
  }

  /**
   * Initialize offline manager
   */
  init() {
    this.setupEventListeners();
    this.checkNetworkStatus();
    this.startRetryQueue();
  }

  /**
   * Setup online/offline event listeners
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Also check periodically for network status
    setInterval(() => {
      this.checkNetworkStatus();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check network status
   */
  async checkNetworkStatus() {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Try to fetch a small resource to verify connectivity
      const response = await fetch('data/words.json', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
    }

    // Update based on navigator.onLine as fallback
    if (navigator.onLine && !this.isOnline) {
      // Navigator says online but fetch failed, trust navigator
      this.isOnline = true;
    }

    return this.isOnline;
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    console.log('[OfflineManager] Network connection restored');
    
    // Execute online callbacks
    this.onlineCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[OfflineManager] Error in online callback:', error);
      }
    });

    // Process retry queue
    this.processRetryQueue();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    console.log('[OfflineManager] Network connection lost');
    
    // Execute offline callbacks
    this.offlineCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[OfflineManager] Error in offline callback:', error);
      }
    });
  }

  /**
   * Check if currently online
   * @returns {boolean} True if online
   */
  isCurrentlyOnline() {
    return this.isOnline && navigator.onLine;
  }

  /**
   * Register callback for online event
   * @param {Function} callback - Callback function
   */
  onOnline(callback) {
    if (typeof callback === 'function') {
      this.onlineCallbacks.push(callback);
    }
  }

  /**
   * Register callback for offline event
   * @param {Function} callback - Callback function
   */
  onOffline(callback) {
    if (typeof callback === 'function') {
      this.offlineCallbacks.push(callback);
    }
  }

  /**
   * Add task to retry queue
   * @param {Function} task - Task function to retry
   * @param {Object} options - Retry options
   */
  addToRetryQueue(task, options = {}) {
    const retryTask = {
      task: task,
      retries: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      priority: options.priority || 0,
      metadata: options.metadata || {}
    };

    this.retryQueue.push(retryTask);
    
    // Sort by priority (higher priority first)
    this.retryQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (!this.isCurrentlyOnline() || this.retryQueue.length === 0) {
      return;
    }

    const tasksToRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const retryTask of tasksToRetry) {
      if (retryTask.retries >= retryTask.maxRetries) {
        console.warn('[OfflineManager] Task exceeded max retries, removing from queue');
        continue;
      }

      try {
        await retryTask.task();
        console.log('[OfflineManager] Successfully retried task');
      } catch (error) {
        retryTask.retries++;
        console.warn(`[OfflineManager] Task failed, will retry (${retryTask.retries}/${retryTask.maxRetries})`);
        
        if (retryTask.retries < retryTask.maxRetries) {
          this.retryQueue.push(retryTask);
        }
      }
    }
  }

  /**
   * Start retry queue processor
   */
  startRetryQueue() {
    setInterval(() => {
      if (this.isCurrentlyOnline()) {
        this.processRetryQueue();
      }
    }, this.retryInterval);
  }

  /**
   * Get offline status
   * @returns {Object} Offline status information
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      navigatorOnline: navigator.onLine,
      queueLength: this.retryQueue.length,
      hasCache: this.cacheManager ? this.cacheManager.isStorageAvailable() : false
    };
  }

  /**
   * Try to fetch with offline fallback
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @param {string} cacheKey - Cache key for fallback
   * @returns {Promise} Fetch promise
   */
  async fetchWithFallback(url, options = {}, cacheKey = null) {
    // Try online first
    if (this.isCurrentlyOnline()) {
      try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        ...options,
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          // Cache the data if cache key provided
          if (cacheKey && this.cacheManager) {
            this.cacheManager.set(cacheKey, data, {
              expiration: 24 * 60 * 60 * 1000 // 24 hours
            });
          }

          return data;
        }
      } catch (error) {
        console.warn('[OfflineManager] Online fetch failed, trying cache:', error);
      }
    }

    // Fallback to cache
    if (cacheKey && this.cacheManager) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        console.log('[OfflineManager] Using cached data');
        return cached;
      }
    }

    throw new Error('Unable to fetch data and no cache available');
  }

  /**
   * Get fallback word list
   * Uses WordLoader if available, otherwise returns minimal fallback
   * @returns {Object} Fallback word list
   */
  getFallbackWordList() {
    // Use WordLoader if available (centralized fallback words)
    if (typeof window !== "undefined" && window.WordLoader && WordLoader.getFallbackWords) {
      return WordLoader.getFallbackWords();
    }
    
    // Minimal fallback if WordLoader not loaded
    return {
      easy: {
        animals: ["cat", "dog", "bird", "fish", "lion", "bear", "wolf", "deer"],
        colors: ["red", "blue", "green", "yellow", "black", "white", "pink", "purple"],
        food: ["pizza", "cake", "soup", "rice", "meat", "milk", "bread", "cheese"],
      },
      medium: {
        animals: ["elephant", "giraffe", "penguin", "dolphin", "tiger", "eagle", "shark", "butterfly"],
        countries: ["france", "germany", "japan", "brazil", "canada", "australia", "italy", "spain"],
        food: ["burger", "pasta", "salad", "sushi", "tacos", "curry", "pizza", "sandwich"],
      },
      hard: {
        animals: ["rhinoceros", "hippopotamus", "orangutan", "chameleon", "platypus", "armadillo"],
        science: ["photosynthesis", "metamorphosis", "chromosome", "molecule", "ecosystem", "laboratory"],
        literature: ["shakespeare", "hemingway", "dickens", "tolkien", "austen", "twain"],
      },
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineManager;
}

