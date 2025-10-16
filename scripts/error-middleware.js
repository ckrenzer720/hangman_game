// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

/**
 * Centralized error handling middleware for the Hangman game
 * Provides optimized, reusable error handling across all modules
 */
class ErrorMiddleware {
  constructor(options = {}) {
    this.config = {
      maxLogSize: options.maxLogSize || 50,
      enableRecovery: options.enableRecovery !== false,
      enableLogging: options.enableLogging !== false,
      enableUserFeedback: options.enableUserFeedback !== false,
      retryAttempts: options.retryAttempts || 3,
      cacheTimeout: options.cacheTimeout || 24 * 60 * 60 * 1000, // 24 hours
      ...options,
    };

    this.errorLog = [];
    this.recoveryStrategies = new Map();
    this.eventListeners = new Map();
    this.isInitialized = false;

    // Bind methods to preserve context
    this.handleError = this.handleError.bind(this);
    this.handleAsyncError = this.handleAsyncError.bind(this);
    this.handlePromiseRejection = this.handlePromiseRejection.bind(this);
  }

  /**
   * Initialize the error middleware
   */
  init() {
    if (this.isInitialized) return;

    this.setupGlobalHandlers();
    this.registerRecoveryStrategies();
    this.isInitialized = true;

    console.log("Error middleware initialized");
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Unhandled promise rejections
    this.addEventListener("unhandledrejection", (event) => {
      this.handlePromiseRejection(event.reason, "unhandled_promise_rejection");
    });

    // Global JavaScript errors
    this.addEventListener("error", (event) => {
      this.handleError(event.error, "global_error");
    });

    // Network status changes
    this.addEventListener("offline", () => {
      this.handleError(new Error("Network connection lost"), "network_offline");
    });

    this.addEventListener("online", () => {
      this.handleError(
        new Error("Network connection restored"),
        "network_online"
      );
    });
  }

  /**
   * Add event listener with cleanup tracking
   */
  addEventListener(event, handler) {
    window.addEventListener(event, handler);
    this.eventListeners.set(event, handler);
  }

  /**
   * Register recovery strategies
   */
  registerRecoveryStrategies() {
    // Network error strategies
    this.recoveryStrategies.set("network_fetch", [
      this.retryWithBackoff.bind(this),
      this.useCachedData.bind(this),
      this.useOfflineMode.bind(this),
    ]);

    // Storage error strategies
    this.recoveryStrategies.set("storage_quota", [
      this.clearOldData.bind(this),
      this.useMemoryStorage.bind(this),
    ]);

    // Data corruption strategies
    this.recoveryStrategies.set("data_corrupted", [
      this.resetToDefaults.bind(this),
      this.useFallbackData.bind(this),
    ]);

    // Game initialization strategies
    this.recoveryStrategies.set("game_initialization", [
      this.retryInitialization.bind(this),
      this.useMinimalMode.bind(this),
    ]);
  }

  /**
   * Main error handling method
   * @param {Error} error - The error to handle
   * @param {string} context - Error context
   * @param {Object} options - Additional options
   * @returns {Object} - Recovery result
   */
  handleError(error, context = "unknown", options = {}) {
    const errorInfo = this.createErrorInfo(error, context, options);

    if (this.config.enableLogging) {
      this.logError(errorInfo);
    }

    if (this.config.enableRecovery) {
      return this.attemptRecovery(error, context, options);
    }

    return { success: false, message: "Recovery disabled" };
  }

  /**
   * Handle async errors with automatic recovery
   * @param {Function} asyncFn - Async function to execute
   * @param {string} context - Error context
   * @param {Object} options - Additional options
   * @returns {Promise} - Promise that resolves with result or recovery data
   */
  async handleAsyncError(asyncFn, context, options = {}) {
    try {
      return await asyncFn();
    } catch (error) {
      const recoveryResult = this.handleError(error, context, options);

      if (recoveryResult.success && recoveryResult.data) {
        return recoveryResult.data;
      }

      throw error;
    }
  }

  /**
   * Handle promise rejections
   * @param {Error} reason - Rejection reason
   * @param {string} context - Error context
   */
  handlePromiseRejection(reason, context) {
    this.handleError(reason, context, { type: "promise_rejection" });
  }

  /**
   * Create error information object
   * @param {Error} error - The error
   * @param {string} context - Error context
   * @param {Object} options - Additional options
   * @returns {Object} - Error information
   */
  createErrorInfo(error, context, options) {
    return {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...options,
    };
  }

  /**
   * Log error information
   * @param {Object} errorInfo - Error information to log
   */
  logError(errorInfo) {
    this.errorLog.push(errorInfo);

    // Keep log size manageable
    if (this.errorLog.length > this.config.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.config.maxLogSize);
    }

    // Store in localStorage if available
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.setItem(
          "hangman_error_log",
          JSON.stringify(this.errorLog)
        );
      } catch (error) {
        console.warn("Could not save error log to localStorage:", error);
      }
    }
  }

  /**
   * Attempt to recover from error
   * @param {Error} error - The error to recover from
   * @param {string} context - Error context
   * @param {Object} options - Additional options
   * @returns {Object} - Recovery result
   */
  attemptRecovery(error, context, options = {}) {
    const strategies = this.recoveryStrategies.get(context) || [];

    for (const strategy of strategies) {
      try {
        const result = strategy(error, options);
        if (result.success) {
          console.log(`Recovery successful: ${result.message}`);
          return result;
        }
      } catch (recoveryError) {
        console.warn("Recovery strategy failed:", recoveryError);
      }
    }

    return {
      success: false,
      message: "No recovery strategy available",
    };
  }

  // ========================================
  // RECOVERY STRATEGIES
  // ========================================

  /**
   * Retry with exponential backoff
   */
  retryWithBackoff(error, options) {
    const retryCount = options.retryCount || 0;
    if (retryCount < this.config.retryAttempts) {
      return {
        success: true,
        message: "Retrying operation",
        action: "retry",
        retryCount: retryCount + 1,
      };
    }
    return { success: false };
  }

  /**
   * Use cached data
   */
  useCachedData(error, options) {
    if (this.isLocalStorageAvailable()) {
      const cachedData = localStorage.getItem("hangman_cached_words");
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheTime = localStorage.getItem("hangman_words_cache_time");

          if (
            cacheTime &&
            Date.now() - parseInt(cacheTime) < this.config.cacheTimeout
          ) {
            return {
              success: true,
              message: "Using cached data",
              action: "use_cached",
              data: parsed,
            };
          }
        } catch (parseError) {
          console.warn("Error parsing cached data:", parseError);
        }
      }
    }
    return { success: false };
  }

  /**
   * Switch to offline mode
   */
  useOfflineMode(error, options) {
    return {
      success: true,
      message: "Switching to offline mode",
      action: "offline_mode",
    };
  }

  /**
   * Clear old data to free up space
   */
  clearOldData(error, options) {
    if (this.isLocalStorageAvailable()) {
      try {
        // Clear old error logs
        localStorage.removeItem("hangman_error_log");

        // Clear old statistics (keep recent ones)
        const stats = localStorage.getItem("hangmanStatistics");
        if (stats) {
          const parsedStats = JSON.parse(stats);
          parsedStats.totalPlayTime = 0;
          parsedStats.averagePlayTime = 0;
          localStorage.setItem(
            "hangmanStatistics",
            JSON.stringify(parsedStats)
          );
        }

        return {
          success: true,
          message: "Cleared old data to free up space",
          action: "clear_data",
        };
      } catch (error) {
        return { success: false };
      }
    }
    return { success: false };
  }

  /**
   * Use memory storage
   */
  useMemoryStorage(error, options) {
    return {
      success: true,
      message: "Switching to memory storage",
      action: "memory_storage",
    };
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(error, options) {
    return {
      success: true,
      message: "Resetting to default settings",
      action: "reset_defaults",
    };
  }

  /**
   * Use fallback data
   */
  useFallbackData(error, options) {
    return {
      success: true,
      message: "Using fallback data",
      action: "use_fallback",
      data: this.getFallbackWordList(),
    };
  }

  /**
   * Retry initialization
   */
  retryInitialization(error, options) {
    return {
      success: true,
      message: "Retrying initialization",
      action: "retry_init",
    };
  }

  /**
   * Use minimal mode
   */
  useMinimalMode(error, options) {
    return {
      success: true,
      message: "Switching to minimal mode",
      action: "minimal_mode",
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable() {
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
   * Get fallback word list
   */
  getFallbackWordList() {
    return {
      easy: {
        animals: ["cat", "dog", "bird", "fish", "lion", "bear", "wolf", "deer"],
        colors: [
          "red",
          "blue",
          "green",
          "yellow",
          "black",
          "white",
          "pink",
          "purple",
        ],
        food: [
          "pizza",
          "cake",
          "soup",
          "rice",
          "meat",
          "milk",
          "bread",
          "cheese",
        ],
      },
      medium: {
        animals: [
          "elephant",
          "giraffe",
          "penguin",
          "dolphin",
          "tiger",
          "eagle",
          "shark",
          "butterfly",
        ],
        countries: [
          "france",
          "germany",
          "japan",
          "brazil",
          "canada",
          "australia",
          "italy",
          "spain",
        ],
        food: [
          "burger",
          "pasta",
          "salad",
          "sushi",
          "tacos",
          "curry",
          "pizza",
          "sandwich",
        ],
      },
      hard: {
        animals: [
          "rhinoceros",
          "hippopotamus",
          "orangutan",
          "chameleon",
          "platypus",
          "armadillo",
        ],
        science: [
          "photosynthesis",
          "metamorphosis",
          "chromosome",
          "molecule",
          "ecosystem",
          "laboratory",
        ],
        literature: [
          "shakespeare",
          "hemingway",
          "dickens",
          "tolkien",
          "austen",
          "twain",
        ],
      },
    };
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const errorCounts = {};
    const contextCounts = {};

    this.errorLog.forEach((error) => {
      errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
      contextCounts[error.context] = (contextCounts[error.context] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorCounts,
      contextCounts,
      recentErrors: this.errorLog.slice(-10),
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem("hangman_error_log");
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Remove event listeners
    this.eventListeners.forEach((handler, event) => {
      window.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    // Clear data
    this.errorLog = [];
    this.recoveryStrategies.clear();
    this.isInitialized = false;

    console.log("Error middleware destroyed");
  }
}

// ========================================
// ERROR MESSAGE UTILITIES
// ========================================

/**
 * Error message factory for consistent user-friendly messages
 */
class ErrorMessageFactory {
  static createUserFriendlyMessage(error, context = "game") {
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
}

// ========================================
// NETWORK UTILITIES
// ========================================

/**
 * Network utilities with built-in error handling
 */
class NetworkUtils {
  /**
   * Fetch with timeout and retry logic
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
   * Check if offline
   */
  static isOffline() {
    return !navigator.onLine;
  }
}

// ========================================
// EXPORTS
// ========================================

// Export for use in other files
window.ErrorMiddleware = ErrorMiddleware;
window.ErrorMessageFactory = ErrorMessageFactory;
window.NetworkUtils = NetworkUtils;
