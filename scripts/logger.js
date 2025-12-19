// ========================================
// HANGMAN GAME - LOGGING UTILITY
// ========================================
// Centralized logging with production mode support

/**
 * Logger utility for consistent logging across the application
 * Automatically disables in production builds
 */
class Logger {
  constructor() {
    // Check if we're in production mode
    // In production, console logs should be minimal
    this.isProduction = 
      typeof window !== "undefined" && 
      (window.location.hostname !== "localhost" && 
       window.location.hostname !== "127.0.0.1" &&
       !window.location.hostname.startsWith("192.168."));
    
    // Allow override via localStorage for debugging
    if (typeof window !== "undefined" && window.localStorage) {
      const debugMode = localStorage.getItem("hangman_debug_mode");
      if (debugMode === "true") {
        this.isProduction = false;
      }
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(...args) {
    if (!this.isProduction && console.debug) {
      console.debug("[Hangman]", ...args);
    }
  }

  /**
   * Log info messages
   */
  info(...args) {
    if (!this.isProduction && console.info) {
      console.info("[Hangman]", ...args);
    }
  }

  /**
   * Log warnings (always shown, but can be filtered)
   */
  warn(...args) {
    if (console.warn) {
      console.warn("[Hangman]", ...args);
    }
  }

  /**
   * Log errors (always shown)
   */
  error(...args) {
    if (console.error) {
      console.error("[Hangman]", ...args);
    }
  }

  /**
   * Log performance metrics
   */
  performance(label, duration, ...args) {
    if (!this.isProduction && console.log) {
      console.log(`[Hangman Performance] ${label}: ${duration}ms`, ...args);
    }
  }

  /**
   * Group related logs
   */
  group(label) {
    if (!this.isProduction && console.group) {
      console.group(`[Hangman] ${label}`);
    }
  }

  /**
   * End log group
   */
  groupEnd() {
    if (!this.isProduction && console.groupEnd) {
      console.groupEnd();
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export for use in other files
if (typeof window !== "undefined") {
  window.Logger = Logger;
  window.logger = logger;
}

