// ========================================
// PROGRESS MANAGER - HANGMAN GAME
// ========================================

/**
 * ProgressManager class for saving and restoring game progress
 */
class ProgressManager {
  constructor(options = {}) {
    this.cacheManager = options.cacheManager || null;
    this.autoSaveInterval = options.autoSaveInterval || 30000; // 30 seconds
    this.autoSaveEnabled = options.autoSaveEnabled !== false;
    this.maxSavedGames = options.maxSavedGames || 5;
    this.autoSaveTimer = null;
  }

  /**
   * Save current game progress
   * @param {Object} gameState - Current game state
   * @param {Object} gameInstance - Game instance (optional)
   * @returns {boolean} True if successful
   */
  saveProgress(gameState, gameInstance = null) {
    if (!gameState || gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
      return false; // Don't save completed games
    }

    const progress = {
      gameState: {
        currentWord: gameState.currentWord,
        hiddenWord: gameState.hiddenWord,
        guessedLetters: [...gameState.guessedLetters],
        incorrectGuesses: [...gameState.incorrectGuesses],
        maxIncorrectGuesses: gameState.maxIncorrectGuesses,
        gameStatus: gameState.gameStatus,
        isPaused: gameState.isPaused,
        score: gameState.score,
        difficulty: gameState.difficulty,
        category: gameState.category,
        gameStartTime: gameState.gameStartTime,
        timedMode: gameState.timedMode,
        timeLimit: gameState.timeLimit,
        timeRemaining: gameState.timeRemaining,
        practiceMode: gameState.practiceMode ? { ...gameState.practiceMode } : null,
        multiplayer: gameState.multiplayer ? { ...gameState.multiplayer } : null
      },
      timestamp: Date.now(),
      version: '1.0.0'
    };

    // Use cache manager if available
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      const success = this.cacheManager.set('current_progress', progress, {
        expiration: 7 * 24 * 60 * 60 * 1000, // 7 days
        metadata: {
          difficulty: progress.gameState.difficulty,
          category: progress.gameState.category,
          score: progress.gameState.score
        }
      });

      if (success) {
        // Also save to history
        this.saveToHistory(progress);
        return true;
      }
    }

    // Fallback to localStorage
    try {
      localStorage.setItem('hangman_current_progress', JSON.stringify(progress));
      this.saveToHistory(progress);
      return true;
    } catch (error) {
      console.error('[ProgressManager] Error saving progress:', error);
      return false;
    }
  }

  /**
   * Load saved game progress
   * @returns {Object|null} Saved progress or null
   */
  loadProgress() {
    // Use cache manager if available
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      const progress = this.cacheManager.get('current_progress');
      if (progress && this.validateProgress(progress)) {
        return progress;
      }
    }

    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('hangman_current_progress');
      if (saved) {
        const progress = JSON.parse(saved);
        if (this.validateProgress(progress)) {
          return progress;
        }
      }
    } catch (error) {
      console.error('[ProgressManager] Error loading progress:', error);
    }

    return null;
  }

  /**
   * Check if saved progress exists
   * @returns {boolean} True if progress exists
   */
  hasProgress() {
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      return this.cacheManager.has('current_progress');
    }

    try {
      return !!localStorage.getItem('hangman_current_progress');
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete saved progress
   * @returns {boolean} True if successful
   */
  deleteProgress() {
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      return this.cacheManager.delete('current_progress');
    }

    try {
      localStorage.removeItem('hangman_current_progress');
      return true;
    } catch (error) {
      console.error('[ProgressManager] Error deleting progress:', error);
      return false;
    }
  }

  /**
   * Validate progress structure
   * @param {Object} progress - Progress object to validate
   * @returns {boolean} True if valid
   */
  validateProgress(progress) {
    if (!progress || !progress.gameState) {
      return false;
    }

    const requiredFields = [
      'currentWord',
      'hiddenWord',
      'guessedLetters',
      'incorrectGuesses',
      'gameStatus',
      'difficulty',
      'category'
    ];

    return requiredFields.every(field => progress.gameState.hasOwnProperty(field));
  }

  /**
   * Save progress to history
   * @param {Object} progress - Progress to save
   */
  saveToHistory(progress) {
    if (!this.cacheManager || !this.cacheManager.isStorageAvailable()) {
      return;
    }

    try {
      const history = this.cacheManager.get('progress_history', []);
      
      // Add to history
      history.unshift({
        ...progress,
        savedAt: Date.now()
      });

      // Keep only last N games
      if (history.length > this.maxSavedGames) {
        history.splice(this.maxSavedGames);
      }

      this.cacheManager.set('progress_history', history, {
        expiration: 30 * 24 * 60 * 60 * 1000, // 30 days
        metadata: { type: 'history' }
      });
    } catch (error) {
      console.warn('[ProgressManager] Error saving to history:', error);
    }
  }

  /**
   * Get progress history
   * @returns {Array} Array of saved progress
   */
  getHistory() {
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      return this.cacheManager.get('progress_history', []);
    }
    return [];
  }

  /**
   * Start auto-save
   * @param {Function} getGameState - Function that returns current game state
   * @param {Object} gameInstance - Game instance (optional)
   */
  startAutoSave(getGameState, gameInstance = null) {
    if (!this.autoSaveEnabled) {
      return;
    }

    this.stopAutoSave();

    this.autoSaveTimer = setInterval(() => {
      const gameState = getGameState();
      if (gameState && gameState.gameStatus === 'playing') {
        this.saveProgress(gameState, gameInstance);
      }
    }, this.autoSaveInterval);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Restore game from progress
   * @param {Object} gameInstance - Game instance to restore to
   * @param {Object} progress - Progress to restore (optional, loads current if not provided)
   * @returns {boolean} True if successful
   */
  restoreGame(gameInstance, progress = null) {
    if (!progress) {
      progress = this.loadProgress();
    }

    if (!progress || !this.validateProgress(progress)) {
      return false;
    }

    try {
      // Restore game state
      Object.assign(gameInstance.gameState, progress.gameState);
      
      // Restore any additional state
      if (progress.gameState.timedMode && progress.gameState.timeRemaining) {
        gameInstance.gameState.timeRemaining = progress.gameState.timeRemaining;
      }

      return true;
    } catch (error) {
      console.error('[ProgressManager] Error restoring game:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressManager;
}

