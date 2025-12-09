// ========================================
// DOM UTILITIES - HANGMAN GAME
// ========================================

/**
 * DOMUtils - Centralized DOM manipulation utilities
 * Consolidates repetitive DOM operations across the codebase
 * Includes caching for frequently accessed elements
 */
class DOMUtils {
  // Cache for frequently accessed elements
  static _elementCache = new Map();
  static _cacheEnabled = true;
  static _maxCacheSize = 100;

  /**
   * Clear the element cache (useful when DOM changes significantly)
   */
  static clearCache() {
    this._elementCache.clear();
  }

  /**
   * Enable or disable caching
   * @param {boolean} enabled - Whether to enable caching
   */
  static setCacheEnabled(enabled) {
    this._cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Get cache key for selector
   * @private
   */
  static _getCacheKey(selector, context) {
    const contextId = context === document ? 'doc' : (context.id || context.className || 'ctx');
    return `${contextId}:${selector}`;
  }

  /**
   * Get element by ID with optional error handling and caching
   * @param {string} id - Element ID
   * @param {boolean} throwError - Whether to throw error if not found
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {HTMLElement|null}
   */
  static getElementById(id, throwError = false, useCache = true) {
    const cacheKey = `id:${id}`;
    
    if (this._cacheEnabled && useCache && this._elementCache.has(cacheKey)) {
      const cached = this._elementCache.get(cacheKey);
      // Verify element still exists in DOM
      if (cached && document.contains(cached)) {
        return cached;
      } else {
        // Element was removed, clear from cache
        this._elementCache.delete(cacheKey);
      }
    }

    const element = document.getElementById(id);
    
    if (!element && throwError) {
      throw new Error(`Element with ID "${id}" not found`);
    }

    // Cache the element if found and caching is enabled
    if (element && this._cacheEnabled && useCache) {
      // Limit cache size
      if (this._elementCache.size >= this._maxCacheSize) {
        // Remove oldest entry (simple FIFO)
        const firstKey = this._elementCache.keys().next().value;
        this._elementCache.delete(firstKey);
      }
      this._elementCache.set(cacheKey, element);
    }

    return element;
  }

  /**
   * Query selector with optional error handling and caching
   * @param {string} selector - CSS selector
   * @param {HTMLElement} context - Context element (default: document)
   * @param {boolean} useCache - Whether to use cache (default: true for ID selectors)
   * @returns {HTMLElement|null}
   */
  static querySelector(selector, context = document, useCache = null) {
    // Auto-detect if we should cache (ID selectors are safe to cache)
    const shouldCache = useCache !== null ? useCache : (this._cacheEnabled && selector.startsWith('#'));
    const cacheKey = this._getCacheKey(selector, context);
    
    if (shouldCache && this._elementCache.has(cacheKey)) {
      const cached = this._elementCache.get(cacheKey);
      // Verify element still exists in DOM
      if (cached && (context === document ? document.contains(cached) : context.contains(cached))) {
        return cached;
      } else {
        // Element was removed, clear from cache
        this._elementCache.delete(cacheKey);
      }
    }

    const element = context.querySelector(selector);

    // Cache the element if found and caching is enabled (only for ID selectors by default)
    if (element && shouldCache) {
      // Limit cache size
      if (this._elementCache.size >= this._maxCacheSize) {
        const firstKey = this._elementCache.keys().next().value;
        this._elementCache.delete(firstKey);
      }
      this._elementCache.set(cacheKey, element);
    }

    return element;
  }

  /**
   * Query selector all (not cached as results can change)
   * @param {string} selector - CSS selector
   * @param {HTMLElement} context - Context element (default: document)
   * @returns {NodeList}
   */
  static querySelectorAll(selector, context = document) {
    return context.querySelectorAll(selector);
  }

  /**
   * Add class to element(s)
   * @param {string|HTMLElement|NodeList} element - Element(s) to modify
   * @param {string} className - Class name to add
   */
  static addClass(element, className) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (!element) return;

    if (element instanceof NodeList) {
      element.forEach(el => el?.classList?.add(className));
    } else if (element.classList) {
      element.classList.add(className);
    }
  }

  /**
   * Remove class from element(s)
   * @param {string|HTMLElement|NodeList} element - Element(s) to modify
   * @param {string} className - Class name to remove
   */
  static removeClass(element, className) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (!element) return;

    if (element instanceof NodeList) {
      element.forEach(el => el?.classList?.remove(className));
    } else if (element.classList) {
      element.classList.remove(className);
    }
  }

  /**
   * Toggle class on element(s)
   * @param {string|HTMLElement|NodeList} element - Element(s) to modify
   * @param {string} className - Class name to toggle
   * @param {boolean} force - Force add/remove
   */
  static toggleClass(element, className, force) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (!element) return;

    if (element instanceof NodeList) {
      element.forEach(el => el?.classList?.toggle(className, force));
    } else if (element.classList) {
      element.classList.toggle(className, force);
    }
  }

  /**
   * Check if element has class
   * @param {string|HTMLElement} element - Element to check
   * @param {string} className - Class name to check
   * @returns {boolean}
   */
  static hasClass(element, className) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    return element?.classList?.contains(className) || false;
  }

  /**
   * Set element text content
   * @param {string|HTMLElement} element - Element to modify
   * @param {string} text - Text content
   */
  static setText(element, text) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Get element text content
   * @param {string|HTMLElement} element - Element to read
   * @returns {string}
   */
  static getText(element) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    return element?.textContent || '';
  }

  /**
   * Set element inner HTML
   * @param {string|HTMLElement} element - Element to modify
   * @param {string} html - HTML content
   */
  static setHTML(element, html) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * Get element inner HTML
   * @param {string|HTMLElement} element - Element to read
   * @returns {string}
   */
  static getHTML(element) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    return element?.innerHTML || '';
  }

  /**
   * Set element attribute
   * @param {string|HTMLElement} element - Element to modify
   * @param {string} name - Attribute name
   * @param {string} value - Attribute value
   */
  static setAttribute(element, name, value) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (element) {
      element.setAttribute(name, value);
    }
  }

  /**
   * Get element attribute
   * @param {string|HTMLElement} element - Element to read
   * @param {string} name - Attribute name
   * @returns {string|null}
   */
  static getAttribute(element, name) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    return element?.getAttribute(name) || null;
  }

  /**
   * Remove element attribute
   * @param {string|HTMLElement} element - Element to modify
   * @param {string} name - Attribute name
   */
  static removeAttribute(element, name) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (element) {
      element.removeAttribute(name);
    }
  }

  /**
   * Create element with attributes
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Attributes object
   * @param {string|HTMLElement} content - Content (text or element)
   * @returns {HTMLElement}
   */
  static createElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else {
        element.setAttribute(key, value);
      }
    });

    if (content) {
      if (typeof content === 'string') {
        element.textContent = content;
      } else if (content instanceof HTMLElement) {
        element.appendChild(content);
      }
    }

    return element;
  }

  /**
   * Append child to parent
   * @param {string|HTMLElement} parent - Parent element
   * @param {HTMLElement} child - Child element
   */
  static appendChild(parent, child) {
    if (typeof parent === 'string') {
      parent = this.getElementById(parent);
    }
    if (parent && child) {
      parent.appendChild(child);
    }
  }

  /**
   * Remove element from DOM
   * @param {string|HTMLElement} element - Element to remove
   */
  static removeElement(element) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * Focus element
   * @param {string|HTMLElement} element - Element to focus
   * @param {number} delay - Delay in milliseconds
   */
  static focus(element, delay = 0) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (element && typeof element.focus === 'function') {
      if (delay > 0) {
        setTimeout(() => element.focus(), delay);
      } else {
        element.focus();
      }
    }
  }

  /**
   * Scroll element into view
   * @param {string|HTMLElement} element - Element to scroll
   * @param {Object} options - ScrollIntoView options
   */
  static scrollIntoView(element, options = {}) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        ...options
      });
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMUtils;
}

