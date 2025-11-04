// ========================================
// LAZY LOADER - HANGMAN GAME
// ========================================

/**
 * LazyLoader class for dynamically loading scripts and stylesheets
 * Reduces initial bundle size by loading resources on demand
 */
class LazyLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.loadedStylesheets = new Set();
    this.loadingPromises = new Map();
    this.failedLoads = new Set();
  }

  /**
   * Load a script dynamically
   * @param {string} src - Script source path
   * @param {Object} options - Loading options
   * @returns {Promise} Promise that resolves when script is loaded
   */
  loadScript(src, options = {}) {
    // Return cached promise if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Return immediately if already loaded
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // Don't retry failed loads unless explicitly requested
    if (this.failedLoads.has(src) && !options.retry) {
      return Promise.reject(new Error(`Script ${src} previously failed to load`));
    }

    const promise = new Promise((resolve, reject) => {
      // Check if script already exists in DOM
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        this.loadedScripts.add(src);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer || false;
      
      if (options.type) {
        script.type = options.type;
      }

      script.onload = () => {
        this.loadedScripts.add(src);
        this.loadingPromises.delete(src);
        this.failedLoads.delete(src);
        resolve();
      };

      script.onerror = () => {
        this.failedLoads.add(src);
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load script: ${src}`));
      };

      // Add to document
      const target = options.target || document.head || document.body;
      target.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Load multiple scripts in parallel
   * @param {string[]} sources - Array of script sources
   * @param {Object} options - Loading options
   * @returns {Promise} Promise that resolves when all scripts are loaded
   */
  loadScripts(sources, options = {}) {
    return Promise.all(
      sources.map(src => this.loadScript(src, options))
    );
  }

  /**
   * Load a stylesheet dynamically
   * @param {string} href - Stylesheet href
   * @param {Object} options - Loading options
   * @returns {Promise} Promise that resolves when stylesheet is loaded
   */
  loadStylesheet(href, options = {}) {
    // Return immediately if already loaded
    if (this.loadedStylesheets.has(href)) {
      return Promise.resolve();
    }

    // Check if stylesheet already exists in DOM
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      this.loadedStylesheets.add(href);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      
      if (options.media) {
        link.media = options.media;
      }

      link.onload = () => {
        this.loadedStylesheets.add(href);
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${href}`));
      };

      // Add to document head
      const target = options.target || document.head;
      target.appendChild(link);
    });
  }

  /**
   * Load multiple stylesheets in parallel
   * @param {string[]} sources - Array of stylesheet sources
   * @param {Object} options - Loading options
   * @returns {Promise} Promise that resolves when all stylesheets are loaded
   */
  loadStylesheets(sources, options = {}) {
    return Promise.all(
      sources.map(href => this.loadStylesheet(href, options))
    );
  }

  /**
   * Preload a resource (script or stylesheet)
   * @param {string} href - Resource href
   * @param {string} type - Resource type ('script' or 'style')
   * @returns {void}
   */
  preloadResource(href, type = 'script') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    
    if (type === 'script') {
      link.as = 'script';
    } else if (type === 'style') {
      link.as = 'style';
    }

    document.head.appendChild(link);
  }

  /**
   * Check if a script is loaded
   * @param {string} src - Script source
   * @returns {boolean} True if script is loaded
   */
  isScriptLoaded(src) {
    return this.loadedScripts.has(src);
  }

  /**
   * Check if a stylesheet is loaded
   * @param {string} href - Stylesheet href
   * @returns {boolean} True if stylesheet is loaded
   */
  isStylesheetLoaded(href) {
    return this.loadedStylesheets.has(href);
  }

  /**
   * Get loading status
   * @returns {Object} Loading status information
   */
  getStatus() {
    return {
      loadedScripts: Array.from(this.loadedScripts),
      loadedStylesheets: Array.from(this.loadedStylesheets),
      loadingCount: this.loadingPromises.size,
      failedLoads: Array.from(this.failedLoads)
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}

