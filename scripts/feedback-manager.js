// ========================================
// FEEDBACK MANAGER - HANGMAN GAME
// ========================================

/**
 * FeedbackManager class for user feedback, bug reporting, feature requests, and analytics
 */
class FeedbackManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.cacheManager = options.cacheManager || null;
    this.preferencesManager = options.preferencesManager || null;
    
    // Feedback storage
    this.feedbackQueue = [];
    this.bugReports = [];
    this.featureRequests = [];
    
    // Analytics
    this.analytics = {
      enabled: options.analyticsEnabled !== false,
      events: [],
      sessionStart: Date.now(),
      pageViews: 0,
      gameStarts: 0,
      gameCompletions: 0,
      averageGameTime: 0,
      mostUsedFeatures: {},
      errorCount: 0,
      userActions: []
    };
    
    // Configuration
    this.maxQueueSize = options.maxQueueSize || 100;
    this.flushInterval = options.flushInterval || 30000; // 30 seconds
    this.autoFlush = options.autoFlush !== false;
    
    // Load existing feedback
    this.loadFeedback();
    
    // Start auto-flush if enabled
    if (this.autoFlush && this.enabled) {
      this.startAutoFlush();
    }
    
    // Track page view
    this.trackPageView();
  }

  /**
   * Load feedback from storage
   */
  loadFeedback() {
    if (!this.cacheManager || !this.cacheManager.isStorageAvailable()) {
      return;
    }

    try {
      const savedFeedback = this.cacheManager.get('feedback_queue');
      if (savedFeedback && Array.isArray(savedFeedback)) {
        this.feedbackQueue = savedFeedback;
      }

      const savedBugs = this.cacheManager.get('bug_reports');
      if (savedBugs && Array.isArray(savedBugs)) {
        this.bugReports = savedBugs;
      }

      const savedFeatures = this.cacheManager.get('feature_requests');
      if (savedFeatures && Array.isArray(savedFeatures)) {
        this.featureRequests = savedFeatures;
      }

      const savedAnalytics = this.cacheManager.get('analytics');
      if (savedAnalytics) {
        this.analytics = { ...this.analytics, ...savedAnalytics };
      }
    } catch (error) {
      console.warn('[FeedbackManager] Error loading feedback:', error);
    }
  }

  /**
   * Save feedback to storage
   */
  saveFeedback() {
    if (!this.cacheManager || !this.cacheManager.isStorageAvailable()) {
      return;
    }

    try {
      this.cacheManager.set('feedback_queue', this.feedbackQueue, {
        expiration: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      this.cacheManager.set('bug_reports', this.bugReports, {
        expiration: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      this.cacheManager.set('feature_requests', this.featureRequests, {
        expiration: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      this.cacheManager.set('analytics', this.analytics, {
        expiration: 90 * 24 * 60 * 60 * 1000 // 90 days
      });
    } catch (error) {
      console.warn('[FeedbackManager] Error saving feedback:', error);
    }
  }

  /**
   * Submit user feedback
   * @param {string} type - Feedback type: 'general', 'suggestion', 'complaint', 'praise'
   * @param {string} message - Feedback message
   * @param {Object} metadata - Additional metadata
   */
  submitFeedback(type, message, metadata = {}) {
    if (!this.enabled || !message || message.trim().length === 0) {
      return false;
    }

    const feedback = {
      id: this.generateId(),
      type: type || 'general',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      gameState: this.getGameStateSnapshot(),
      ...metadata
    };

    this.feedbackQueue.push(feedback);

    // Limit queue size
    if (this.feedbackQueue.length > this.maxQueueSize) {
      this.feedbackQueue.shift();
    }

    this.saveFeedback();
    this.trackEvent('feedback_submitted', { type, messageLength: message.length });

    return true;
  }

  /**
   * Report a bug
   * @param {string} description - Bug description
   * @param {string} steps - Steps to reproduce
   * @param {Error} error - Error object if available
   * @param {Object} metadata - Additional metadata
   */
  reportBug(description, steps = '', error = null, metadata = {}) {
    if (!this.enabled || !description || description.trim().length === 0) {
      return false;
    }

    const bugReport = {
      id: this.generateId(),
      description: description.trim(),
      stepsToReproduce: steps.trim(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      gameState: this.getGameStateSnapshot(),
      browserInfo: this.getBrowserInfo(),
      ...metadata
    };

    this.bugReports.push(bugReport);

    // Limit bug reports
    if (this.bugReports.length > this.maxQueueSize) {
      this.bugReports.shift();
    }

    this.saveFeedback();
    this.trackEvent('bug_reported', { descriptionLength: description.length });
    this.analytics.errorCount++;

    return true;
  }

  /**
   * Request a feature
   * @param {string} title - Feature title
   * @param {string} description - Feature description
   * @param {string} category - Feature category
   * @param {Object} metadata - Additional metadata
   */
  requestFeature(title, description, category = 'general', metadata = {}) {
    if (!this.enabled || !title || title.trim().length === 0) {
      return false;
    }

    const featureRequest = {
      id: this.generateId(),
      title: title.trim(),
      description: description.trim(),
      category: category,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      votes: 1, // User's own vote
      status: 'pending',
      ...metadata
    };

    this.featureRequests.push(featureRequest);

    // Limit feature requests
    if (this.featureRequests.length > this.maxQueueSize) {
      this.featureRequests.shift();
    }

    this.saveFeedback();
    this.trackEvent('feature_requested', { title, category });

    return true;
  }

  /**
   * Track analytics event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  trackEvent(eventName, data = {}) {
    if (!this.analytics.enabled || !this.enabled) {
      return;
    }

    const event = {
      name: eventName,
      timestamp: Date.now(),
      data: data,
      sessionId: this.getSessionId(),
      page: window.location.pathname
    };

    this.analytics.events.push(event);

    // Update specific analytics
    this.updateAnalytics(eventName, data);

    // Limit events array size
    if (this.analytics.events.length > 1000) {
      this.analytics.events = this.analytics.events.slice(-1000);
    }

    this.saveFeedback();
  }

  /**
   * Track page view
   */
  trackPageView() {
    if (!this.analytics.enabled || !this.enabled) {
      return;
    }

    this.analytics.pageViews++;
    this.trackEvent('page_view', {
      path: window.location.pathname,
      referrer: document.referrer
    });
  }

  /**
   * Track game start
   */
  trackGameStart() {
    this.analytics.gameStarts++;
    this.trackEvent('game_start', {
      difficulty: window.game?.gameState?.difficulty,
      category: window.game?.gameState?.category
    });
  }

  /**
   * Track game completion
   * @param {string} result - 'won' or 'lost'
   * @param {number} duration - Game duration in ms
   */
  trackGameCompletion(result, duration) {
    this.analytics.gameCompletions++;
    
    // Update average game time
    const totalGames = this.analytics.gameCompletions;
    const currentAvg = this.analytics.averageGameTime;
    this.analytics.averageGameTime = Math.round(
      ((currentAvg * (totalGames - 1)) + duration) / totalGames
    );

    this.trackEvent('game_complete', {
      result,
      duration,
      difficulty: window.game?.gameState?.difficulty,
      category: window.game?.gameState?.category,
      score: window.game?.gameState?.score
    });
  }

  /**
   * Track user action
   * @param {string} action - Action name
   * @param {Object} context - Action context
   */
  trackUserAction(action, context = {}) {
    this.analytics.userActions.push({
      action,
      timestamp: Date.now(),
      context
    });

    // Limit actions array
    if (this.analytics.userActions.length > 500) {
      this.analytics.userActions = this.analytics.userActions.slice(-500);
    }

    this.trackEvent('user_action', { action, ...context });
  }

  /**
   * Update analytics based on event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  updateAnalytics(eventName, data) {
    // Track most used features
    if (eventName.startsWith('feature_') || eventName.startsWith('button_')) {
      const feature = eventName.replace(/^(feature_|button_)/, '');
      this.analytics.mostUsedFeatures[feature] = 
        (this.analytics.mostUsedFeatures[feature] || 0) + 1;
    }
  }

  /**
   * Get analytics summary
   * @returns {Object} Analytics summary
   */
  getAnalyticsSummary() {
    return {
      sessionDuration: Date.now() - this.analytics.sessionStart,
      pageViews: this.analytics.pageViews,
      gameStarts: this.analytics.gameStarts,
      gameCompletions: this.analytics.gameCompletions,
      averageGameTime: this.analytics.averageGameTime,
      errorCount: this.analytics.errorCount,
      mostUsedFeatures: { ...this.analytics.mostUsedFeatures },
      totalEvents: this.analytics.events.length,
      totalUserActions: this.analytics.userActions.length
    };
  }

  /**
   * Export feedback data
   * @returns {Object} Exported feedback data
   */
  exportFeedback() {
    return {
      exportedAt: new Date().toISOString(),
      feedback: [...this.feedbackQueue],
      bugReports: [...this.bugReports],
      featureRequests: [...this.featureRequests],
      analytics: this.getAnalyticsSummary()
    };
  }

  /**
   * Get all feedback
   * @returns {Object} All feedback data
   */
  getAllFeedback() {
    return {
      feedback: [...this.feedbackQueue],
      bugReports: [...this.bugReports],
      featureRequests: [...this.featureRequests]
    };
  }

  /**
   * Clear all feedback
   */
  clearFeedback() {
    this.feedbackQueue = [];
    this.bugReports = [];
    this.featureRequests = [];
    this.saveFeedback();
  }

  /**
   * Get game state snapshot for bug reports
   * @returns {Object} Game state snapshot
   */
  getGameStateSnapshot() {
    if (!window.game) {
      return null;
    }

    return {
      gameStatus: window.game.gameState.gameStatus,
      difficulty: window.game.gameState.difficulty,
      category: window.game.gameState.category,
      score: window.game.gameState.score,
      guessedLetters: window.game.gameState.guessedLetters.length,
      incorrectGuesses: window.game.gameState.incorrectGuesses.length,
      wordsLoaded: window.game.wordsLoaded
    };
  }

  /**
   * Get browser information
   * @returns {Object} Browser info
   */
  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Start auto-flush timer
   */
  startAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Flush feedback to server (placeholder for future implementation)
   */
  flush() {
    // In a real implementation, this would send feedback to a server
    // For now, we just save to local storage
    this.saveFeedback();
  }

  /**
   * Enable/disable analytics
   * @param {boolean} enabled - Whether to enable analytics
   */
  setAnalyticsEnabled(enabled) {
    this.analytics.enabled = enabled;
    if (this.preferencesManager) {
      this.preferencesManager.set('analytics', enabled);
    }
    this.saveFeedback();
  }

  /**
   * Get status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      enabled: this.enabled,
      analyticsEnabled: this.analytics.enabled,
      feedbackQueueSize: this.feedbackQueue.length,
      bugReportsCount: this.bugReports.length,
      featureRequestsCount: this.featureRequests.length,
      analyticsEvents: this.analytics.events.length
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackManager;
}

