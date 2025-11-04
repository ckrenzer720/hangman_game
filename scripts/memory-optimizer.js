// ========================================
// MEMORY OPTIMIZER - HANGMAN GAME
// ========================================

/**
 * MemoryOptimizer class for optimizing memory usage and DOM queries
 */
class MemoryOptimizer {
  constructor() {
    this.domCache = new Map();
    this.eventListeners = new WeakMap();
    this.cleanupTasks = [];
    this.cacheMaxSize = 100;
  }

  /**
   * Get or cache DOM element query
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (optional)
   * @returns {Element|null} DOM element
   */
  querySelector(selector, context = document) {
    const cacheKey = `${context === document ? 'doc' : context.id || 'ctx'}:${selector}`;
    
    if (this.domCache.has(cacheKey)) {
      const cached = this.domCache.get(cacheKey);
      // Verify element still exists
      if (cached && document.contains(cached)) {
        return cached;
      } else {
        // Remove stale cache entry
        this.domCache.delete(cacheKey);
      }
    }

    const element = context.querySelector(selector);
    
    if (element) {
      // Limit cache size
      if (this.domCache.size >= this.cacheMaxSize) {
        const firstKey = this.domCache.keys().next().value;
        this.domCache.delete(firstKey);
      }
      
      this.domCache.set(cacheKey, element);
    }

    return element;
  }

  /**
   * Get or cache multiple DOM elements
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (optional)
   * @returns {NodeList|Array} DOM elements
   */
  querySelectorAll(selector, context = document) {
    const cacheKey = `all:${context === document ? 'doc' : context.id || 'ctx'}:${selector}`;
    
    if (this.domCache.has(cacheKey)) {
      const cached = this.domCache.get(cacheKey);
      // Verify elements still exist (check first element)
      if (cached && cached.length > 0 && document.contains(cached[0])) {
        return cached;
      } else {
        this.domCache.delete(cacheKey);
      }
    }

    const elements = context.querySelectorAll(selector);
    
    if (elements.length > 0) {
      // Limit cache size
      if (this.domCache.size >= this.cacheMaxSize) {
        const firstKey = this.domCache.keys().next().value;
        this.domCache.delete(firstKey);
      }
      
      // Convert NodeList to Array for consistent caching
      const elementsArray = Array.from(elements);
      this.domCache.set(cacheKey, elementsArray);
      return elementsArray;
    }

    return elements;
  }

  /**
   * Get element by ID with caching
   * @param {string} id - Element ID
   * @returns {Element|null} DOM element
   */
  getElementById(id) {
    return this.querySelector(`#${id}`);
  }

  /**
   * Clear DOM cache
   * @param {string} pattern - Optional pattern to clear specific cache entries
   */
  clearCache(pattern = null) {
    if (pattern) {
      // Clear entries matching pattern
      for (const key of this.domCache.keys()) {
        if (key.includes(pattern)) {
          this.domCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.domCache.clear();
    }
  }

  /**
   * Add event listener with automatic cleanup tracking
   * @param {Element} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   * @returns {Function} Cleanup function
   */
  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);

    // Track for cleanup
    const cleanup = () => {
      element.removeEventListener(event, handler, options);
    };

    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push(cleanup);

    return cleanup;
  }

  /**
   * Remove all event listeners for an element
   * @param {Element} element - Target element
   */
  removeEventListeners(element) {
    const listeners = this.eventListeners.get(element);
    if (listeners) {
      listeners.forEach(cleanup => cleanup());
      this.eventListeners.delete(element);
    }
  }

  /**
   * Register cleanup task
   * @param {Function} cleanupFn - Cleanup function
   */
  registerCleanup(cleanupFn) {
    this.cleanupTasks.push(cleanupFn);
  }

  /**
   * Execute all cleanup tasks
   */
  cleanup() {
    // Execute all cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('[MemoryOptimizer] Cleanup task failed:', error);
      }
    });
    this.cleanupTasks = [];

    // Clear DOM cache
    this.clearCache();

    // Clear event listeners (WeakMap will handle garbage collection)
    // Note: We can't iterate WeakMap, so we rely on GC
  }

  /**
   * Optimize array by removing duplicates and null/undefined values
   * @param {Array} array - Array to optimize
   * @returns {Array} Optimized array
   */
  optimizeArray(array) {
    return array.filter((item, index) => 
      item != null && array.indexOf(item) === index
    );
  }

  /**
   * Deep clone an object (for preventing memory leaks with circular references)
   * @param {*} obj - Object to clone
   * @param {WeakMap} visited - Visited objects map
   * @returns {*} Cloned object
   */
  deepClone(obj, visited = new WeakMap()) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (visited.has(obj)) {
      return visited.get(obj); // Return existing clone for circular references
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      const clone = [];
      visited.set(obj, clone);
      obj.forEach(item => {
        clone.push(this.deepClone(item, visited));
      });
      return clone;
    }

    if (obj instanceof Object) {
      const clone = {};
      visited.set(obj, clone);
      Object.keys(obj).forEach(key => {
        clone[key] = this.deepClone(obj[key], visited);
      });
      return clone;
    }

    return obj;
  }

  /**
   * Debounce function to reduce function call frequency
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function to limit function call frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Get memory statistics
   * @returns {Object} Memory statistics
   */
  getStats() {
    return {
      cacheSize: this.domCache.size,
      cacheMaxSize: this.cacheMaxSize,
      cleanupTasksCount: this.cleanupTasks.length,
      memoryInfo: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usedMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
        totalMB: (performance.memory.totalJSHeapSize / 1048576).toFixed(2)
      } : null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoryOptimizer;
}

