// ========================================
// HANGMAN GAME - UTILITY FUNCTIONS
// ========================================

// Utility class for common game functions
class GameUtils {
  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  static saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      if (window.logger) window.logger.error("Error saving to localStorage:", error);
      return false;
    }
  }

  static loadFromLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      if (window.logger) window.logger.error("Error loading from localStorage:", error);
      return defaultValue;
    }
  }

  static clearLocalStorage(key) {
    try {
      if (key) {
        localStorage.removeItem(key);
      } else {
        localStorage.clear();
      }
      return true;
    } catch (error) {
      if (window.logger) window.logger.error("Error clearing localStorage:", error);
      return false;
    }
  }

  static debounce(func, wait) {
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

  static throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  static validateInput(input, type = "letter") {
    switch (type) {
      case "letter":
        return /^[a-zA-Z]$/.test(input);
      case "word":
        return /^[a-zA-Z\s]+$/.test(input);
      case "number":
        return /^\d+$/.test(input);
      default:
        return false;
    }
  }

  static sanitizeInput(input) {
    return input.toString().trim().toLowerCase();
  }

  // ========================================
  // ENHANCED INPUT VALIDATION SYSTEM
  // ========================================

  /**
   * Validates if input is a valid letter for hangman game
   * Supports English letters and common accented characters
   * @param {string} input - The input to validate
   * @returns {boolean} - True if valid letter
   */
  static isValidLetter(input) {
    if (!input || typeof input !== "string") return false;

    // Normalize the input first
    const normalized = this.normalizeLetter(input);

    // Check if it's a single character and a valid letter
    return normalized.length === 1 && /^[a-z]$/.test(normalized);
  }

  /**
   * Normalizes input to handle case-insensitive input and special characters
   * @param {string} input - The input to normalize
   * @returns {string} - Normalized letter
   */
  static normalizeLetter(input) {
    if (!input || typeof input !== "string") return "";

    // Convert to string and trim whitespace
    let normalized = input.toString().trim();

    // Handle empty input
    if (normalized.length === 0) return "";

    // Take only the first character
    normalized = normalized.charAt(0);

    // Convert to lowercase
    normalized = normalized.toLowerCase();

    // Handle accented characters and special cases
    normalized = this.convertAccentedCharacters(normalized);

    return normalized;
  }

  /**
   * Converts accented characters to their base form
   * @param {string} char - Character to convert
   * @returns {string} - Converted character
   */
  static convertAccentedCharacters(char) {
    const accentMap = {
      à: "a",
      á: "a",
      â: "a",
      ã: "a",
      ä: "a",
      å: "a",
      æ: "ae",
      è: "e",
      é: "e",
      ê: "e",
      ë: "e",
      ì: "i",
      í: "i",
      î: "i",
      ï: "i",
      ò: "o",
      ó: "o",
      ô: "o",
      õ: "o",
      ö: "o",
      ø: "o",
      ù: "u",
      ú: "u",
      û: "u",
      ü: "u",
      ý: "y",
      ÿ: "y",
      ñ: "n",
      ç: "c",
      ß: "ss",
    };

    return accentMap[char] || char;
  }

  /**
   * Validates and sanitizes input for hangman game
   * @param {string} input - Raw input from user
   * @returns {Object} - Validation result with sanitized input and error message
   */
  static validateHangmanInput(input) {
    const result = {
      isValid: false,
      sanitizedInput: "",
      errorMessage: "",
      originalInput: input,
    };

    // Check if input exists
    if (!input) {
      result.errorMessage = "Please enter a letter";
      return result;
    }

    // Normalize the input
    const normalized = this.normalizeLetter(input);

    // Check if normalized input is empty
    if (normalized.length === 0) {
      result.errorMessage = "Please enter a valid letter";
      return result;
    }

    // Check if it's a valid letter
    if (!this.isValidLetter(normalized)) {
      // Provide specific error messages based on input type
      const originalChar = input.toString().charAt(0);

      if (/[0-9]/.test(originalChar)) {
        result.errorMessage = "Numbers are not allowed. Please enter a letter.";
      } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(originalChar)) {
        result.errorMessage =
          "Special characters are not allowed. Please enter a letter.";
      } else if (originalChar.length > 1) {
        result.errorMessage = "Please enter only one letter at a time.";
      } else {
        result.errorMessage = "Invalid character. Please enter a letter (A-Z).";
      }
      return result;
    }

    // Input is valid
    result.isValid = true;
    result.sanitizedInput = normalized;
    return result;
  }

  /**
   * Checks if input contains only valid characters for hangman
   * @param {string} input - Input to check
   * @returns {boolean} - True if input contains only valid characters
   */
  static containsOnlyValidCharacters(input) {
    if (!input || typeof input !== "string") return false;

    // Check each character in the input
    for (let i = 0; i < input.length; i++) {
      const char = input.charAt(i);
      const normalized = this.normalizeLetter(char);

      // Allow spaces for multi-word phrases
      if (char === " ") continue;

      // Check if normalized character is valid
      if (!/^[a-z]$/.test(normalized)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets user-friendly error message for invalid input
   * @param {string} input - The invalid input
   * @returns {string} - User-friendly error message
   */
  static getInputErrorMessage(input) {
    if (!input) return "Please enter a letter";

    const char = input.toString().charAt(0);

    if (/[0-9]/.test(char)) {
      return "Numbers are not allowed. Please enter a letter.";
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(char)) {
      return "Special characters are not allowed. Please enter a letter.";
    } else if (input.length > 1) {
      return "Please enter only one letter at a time.";
    } else {
      return "Invalid character. Please enter a letter (A-Z).";
    }
  }

  static createElement(tag, className = "", textContent = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  static addClass(element, className) {
    if (element && className) {
      element.classList.add(className);
    }
  }

  static removeClass(element, className) {
    if (element && className) {
      element.classList.remove(className);
    }
  }

  static toggleClass(element, className) {
    if (element && className) {
      element.classList.toggle(className);
    }
  }

  static hasClass(element, className) {
    return element && element.classList.contains(className);
  }

  static getElement(selector) {
    return document.querySelector(selector);
  }

  static getElements(selector) {
    return document.querySelectorAll(selector);
  }

  static addEvent(element, event, handler) {
    if (element && event && handler) {
      element.addEventListener(event, handler);
    }
  }

  static removeEvent(element, event, handler) {
    if (element && event && handler) {
      element.removeEventListener(event, handler);
    }
  }

  static showElement(element) {
    if (element) {
      element.style.display = "block";
      element.classList.remove("hidden");
    }
  }

  static hideElement(element) {
    if (element) {
      element.style.display = "none";
      element.classList.add("hidden");
    }
  }

  static fadeIn(element, duration = 300) {
    if (element) {
      element.style.opacity = "0";
      element.style.display = "block";

      let start = performance.now();

      function animate(time) {
        let progress = (time - start) / duration;
        if (progress > 1) progress = 1;

        element.style.opacity = progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }

      requestAnimationFrame(animate);
    }
  }

  static fadeOut(element, duration = 300) {
    if (element) {
      let start = performance.now();

      function animate(time) {
        let progress = (time - start) / duration;
        if (progress > 1) progress = 1;

        element.style.opacity = 1 - progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.style.display = "none";
        }
      }

      requestAnimationFrame(animate);
    }
  }

  static animateElement(element, animation, duration = 500) {
    if (element) {
      element.style.animation = `${animation} ${duration}ms ease-in-out`;

      setTimeout(() => {
        element.style.animation = "";
      }, duration);
    }
  }

  static playSound(soundName) {
    // Placeholder for sound functionality
    if (window.logger) window.logger.debug(`Playing sound: ${soundName}`);
  }

  static vibrate(pattern = [100]) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  static isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  static getScreenSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  static isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  static scrollToElement(element, offset = 0) {
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }

  // ========================================
  // ERROR HANDLING UTILITIES
  // ========================================

  /**
   * Creates a user-friendly error message based on error type
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @returns {string} - User-friendly error message
   */
  static createUserFriendlyErrorMessage(error, context = "game") {
    const errorMessages = {
      network: {
        fetch:
          "Unable to load game data. Please check your internet connection and try again.",
        timeout: "The request is taking too long. Please try again.",
        offline:
          "You appear to be offline. Please check your internet connection.",
        server:
          "The game server is temporarily unavailable. Please try again later.",
        cors: "Unable to load game data due to security restrictions. Please try refreshing the page.",
      },
      storage: {
        quota:
          "Unable to save game data. Your browser storage is full. Please clear some space and try again.",
        disabled:
          "Unable to save game data. Please enable local storage in your browser settings.",
        corrupted:
          "Game data appears to be corrupted. Your progress will be reset.",
        access:
          "Unable to access saved game data. Please check your browser permissions.",
      },
      data: {
        invalid: "Game data is invalid or corrupted. Please refresh the page.",
        missing: "Required game data is missing. Please refresh the page.",
        format: "Game data format is not supported. Please refresh the page.",
        corrupted:
          "Game data appears to be corrupted. Please refresh the page.",
      },
      game: {
        initialization: "Unable to start the game. Please refresh the page.",
        state: "Game state error occurred. Please start a new game.",
        validation: "Invalid game data detected. Please refresh the page.",
        memory: "Game memory error occurred. Please refresh the page.",
      },
    };

    // Determine error type
    let errorType = "game";
    let errorSubtype = "initialization";

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorType = "network";
      errorSubtype = "fetch";
    } else if (error.name === "AbortError") {
      errorType = "network";
      errorSubtype = "timeout";
    } else if (error.name === "QuotaExceededError") {
      errorType = "storage";
      errorSubtype = "quota";
    } else if (error.name === "SecurityError") {
      errorType = "storage";
      errorSubtype = "access";
    } else if (error.message.includes("JSON")) {
      errorType = "data";
      errorSubtype = "format";
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      errorType = "network";
      errorSubtype = "fetch";
    }

    return (
      errorMessages[errorType]?.[errorSubtype] ||
      errorMessages.game.initialization
    );
  }

  /**
   * Determines if the user is offline
   * @returns {boolean} - True if offline
   */
  static isOffline() {
    return !navigator.onLine;
  }

  /**
   * Checks if localStorage is available and working
   * @returns {boolean} - True if localStorage is available
   */
  static isLocalStorageAvailable() {
    try {
      const testKey = "__localStorage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Safely executes a function with error handling
   * @param {Function} fn - Function to execute
   * @param {string} context - Context for error reporting
   * @param {*} fallbackValue - Value to return if function fails
   * @returns {*} - Function result or fallback value
   */
  static safeExecute(fn, context = "unknown", fallbackValue = null) {
    try {
      return fn();
    } catch (error) {
      if (window.logger) window.logger.error(`Error in ${context}:`, error);
      return fallbackValue;
    }
  }

  /**
   * Retries a function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} - Promise that resolves with function result
   */
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Creates a timeout promise
   * @param {number} ms - Timeout in milliseconds
   * @returns {Promise} - Promise that rejects after timeout
   */
  static createTimeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Operation timed out")), ms);
    });
  }

  /**
   * Fetches data with timeout and retry logic
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} - Promise that resolves with data
   */
  static async fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Retry with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} - Promise that resolves with function result
   */
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Check if device is offline
   * @returns {boolean} - True if offline
   */
  static isOffline() {
    return !navigator.onLine;
  }
}

// Export for use in other files
window.GameUtils = GameUtils;
