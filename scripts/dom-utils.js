// ========================================
// DOM UTILITIES - HANGMAN GAME
// ========================================

/**
 * DOMUtils - Centralized DOM manipulation utilities
 * Consolidates repetitive DOM operations across the codebase
 */
class DOMUtils {
  /**
   * Get element by ID with optional error handling
   * @param {string} id - Element ID
   * @param {boolean} throwError - Whether to throw error if not found
   * @returns {HTMLElement|null}
   */
  static getElementById(id, throwError = false) {
    const element = document.getElementById(id);
    if (!element && throwError) {
      throw new Error(`Element with ID "${id}" not found`);
    }
    return element;
  }

  /**
   * Query selector with optional error handling
   * @param {string} selector - CSS selector
   * @param {HTMLElement} context - Context element (default: document)
   * @returns {HTMLElement|null}
   */
  static querySelector(selector, context = document) {
    return context.querySelector(selector);
  }

  /**
   * Query selector all
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

