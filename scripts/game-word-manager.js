// ========================================
// HANGMAN GAME - WORD MANAGEMENT MODULE
// ========================================
// This module handles word loading, caching, and selection

/**
 * Word Management Mixin for HangmanGame
 * Extends HangmanGame with word-related functionality
 */
const WordManagerMixin = {
  async loadWords() {
    try {
      // Try to load from cache first (even if online)
      const cachedWords = this.loadCachedWords();
      if (cachedWords) {
        // Validate cached words
        if (this.dataValidator) {
          const validation = this.dataValidator.validateWordList(cachedWords);
          if (!validation.valid && validation.errors.length > 0) {
            if (window.logger) window.logger.warn(
              "Cached word list validation failed, fetching fresh data"
            );
            // Continue to fetch fresh data
          } else {
            if (validation.recovered) {
              if (window.logger) window.logger.debug("Cached word list was automatically recovered");
              this.cacheWords(cachedWords); // Save recovered version
            }
            this.wordLists = cachedWords;
            this.wordsLoaded = true;
            if (window.logger) window.logger.debug("Words loaded from cache:", this.wordLists);
            this.init();

            // If online, try to update cache in background
            if (
              this.offlineManager &&
              this.offlineManager.isCurrentlyOnline()
            ) {
              this.updateWordsInBackground();
            }
            return;
          }
        } else {
          this.wordLists = cachedWords;
          this.wordsLoaded = true;
          if (window.logger) window.logger.debug("Words loaded from cache:", this.wordLists);
          this.init();

          // If online, try to update cache in background
          if (this.offlineManager && this.offlineManager.isCurrentlyOnline()) {
            this.updateWordsInBackground();
          }
          return;
        }
      }

      // Check if we're offline
      if (this.offlineManager && !this.offlineManager.isCurrentlyOnline()) {
        throw new Error("Network connection lost");
      }

      if (NetworkUtils.isOffline()) {
        throw new Error("Network connection lost");
      }

      // Try to fetch from separate difficulty files using WordLoader
      // Use offline manager if available
      if (this.offlineManager) {
        // Create a fetch wrapper for offline manager
        const fetchWrapper = async (url, options, cacheKey) => {
          return await this.offlineManager.fetchWithFallback(
            url,
            options,
            cacheKey
          );
        };
        this.wordLists = await WordLoader.loadAllWords({}, fetchWrapper);
      } else {
        // Use WordLoader with retry logic
        try {
          this.wordLists = await NetworkUtils.retryWithBackoff(
            async () => {
              return await WordLoader.loadAllWords();
            },
            this.maxRetries,
            1000
          );
        } catch (error) {
          // Fallback to old single file if new structure fails
          if (window.logger) window.logger.warn(
            "Failed to load from separate files, trying legacy format:",
            error
          );
          const response = await NetworkUtils.retryWithBackoff(
            async () => {
              return await NetworkUtils.fetchWithTimeout(
                "data/words.json",
                {},
                10000
              );
            },
            this.maxRetries,
            1000
          );
          this.wordLists = await response.json();
        }
      }

      // Validate word list
      if (this.dataValidator) {
        const validation = this.dataValidator.validateWordList(this.wordLists);
        if (!validation.valid) {
          if (window.logger) window.logger.warn("Word list validation errors:", validation.errors);
          if (validation.errors.length > 0 && this.strictMode !== false) {
            throw new Error(
              "Word list validation failed: " + validation.errors.join(", ")
            );
          }
        }
        if (validation.warnings.length > 0) {
          if (window.logger) window.logger.warn("Word list validation warnings:", validation.warnings);
        }
        if (validation.recovered) {
          if (window.logger) window.logger.debug("Word list was automatically recovered");
        }
      }

      this.wordsLoaded = true;
      this.isOfflineMode = false;
      this.retryCount = 0;

      // Cache the words for offline use
      this.cacheWords(this.wordLists);

      if (window.logger) window.logger.debug("Words loaded successfully from server:", this.wordLists);

      // Initialize the game once words are loaded
      this.init();
    } catch (error) {
      if (window.logger) window.logger.error("Error loading words:", error);

      // Handle the error with recovery strategies
      const recoveryResult = this.errorMiddleware
        ? this.errorMiddleware.handleError(error, "network_fetch", {
            retryCount: this.retryCount,
            isOffline: NetworkUtils.isOffline(),
          })
        : { success: false, message: "No error middleware available" };

      if (recoveryResult.success) {
        switch (recoveryResult.action) {
          case "retry":
            this.retryCount++;
            if (this.retryCount <= this.maxRetries) {
              if (window.logger) window.logger.debug(
                `Retrying word loading (attempt ${this.retryCount})...`
              );
              setTimeout(() => this.loadWords(), 1000 * this.retryCount);
              return;
            }
            break;
          case "use_cached":
            this.wordLists = recoveryResult.data;
            this.wordsLoaded = true;
            this.init();
            this.showUserMessage(
              "info",
              "Using cached word list. Some features may be limited."
            );
            return;
          case "offline_mode":
            this.isOfflineMode = true;
            break;
          case "use_fallback":
            this.wordLists = recoveryResult.data;
            this.wordsLoaded = true;
            this.init();
            this.showUserMessage(
              "warning",
              "Using fallback word list. Please check your internet connection."
            );
            return;
        }
      }

      // If all recovery strategies fail, use fallback data
      this.useFallbackWordList();
    }
  },

  /**
   * Loads cached words from cache manager or localStorage fallback
   * @returns {Object|null} - Cached word list or null
   */
  loadCachedWords() {
    // Use cache manager if available
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      const cached = this.cacheManager.get("words");
      if (cached) {
        return cached;
      }
    }

    // Fallback to old localStorage method for migration
    if (!GameUtils.isLocalStorageAvailable()) return null;

    try {
      const cached = localStorage.getItem("hangman_cached_words");
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is not too old (24 hours)
        const cacheTime = localStorage.getItem("hangman_words_cache_time");
        if (
          cacheTime &&
          Date.now() - parseInt(cacheTime) < 24 * 60 * 60 * 1000
        ) {
          // Migrate to cache manager if available
          if (this.cacheManager) {
            this.cacheManager.set("words", parsed, {
              expiration: 24 * 60 * 60 * 1000,
            });
          }
          return parsed;
        }
      }
    } catch (error) {
      if (window.logger) window.logger.warn("Error loading cached words:", error);
    }
    return null;
  },

  /**
   * Caches words using cache manager or localStorage fallback
   * @param {Object} words - Word list to cache
   */
  cacheWords(words) {
    // Use cache manager if available
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      this.cacheManager.set("words", words, {
        expiration: 7 * 24 * 60 * 60 * 1000, // 7 days
        metadata: {
          source: "server",
          cachedAt: Date.now(),
        },
      });
      return;
    }

    // Fallback to old localStorage method
    if (!GameUtils.isLocalStorageAvailable()) return;

    try {
      localStorage.setItem("hangman_cached_words", JSON.stringify(words));
      localStorage.setItem("hangman_words_cache_time", Date.now().toString());
    } catch (error) {
      if (window.logger) window.logger.warn("Error caching words:", error);
    }
  },

  /**
   * Update words in background without blocking the UI
   */
  async updateWordsInBackground() {
    if (!this.offlineManager || !this.offlineManager.isCurrentlyOnline()) {
      return;
    }

    try {
      const response = await NetworkUtils.fetchWithTimeout(
        "data/words.json",
        {},
        10000
      );

      if (response.ok) {
        const words = await response.json();
        this.cacheWords(words);
        if (window.logger) window.logger.debug("Words cache updated in background");
      }
    } catch (error) {
      console.debug("Background word update failed:", error);
      // Silently fail - we already have cached words
    }
  },

  /**
   * Uses fallback word list when all else fails
   */
  useFallbackWordList() {
    // Try WordLoader first, then error middleware, then default
    if (window.WordLoader && WordLoader.getFallbackWords) {
      this.wordLists = WordLoader.getFallbackWords();
    } else if (this.errorMiddleware) {
      this.wordLists = this.errorMiddleware.getFallbackWordList();
    } else {
      this.wordLists = this.getDefaultFallbackWords();
    }
    this.wordsLoaded = true;
    this.isOfflineMode = true;
    this.init();

    const userMessage = NetworkUtils.isOffline()
      ? "You're offline. Using limited word list. Connect to internet for full features."
      : "Unable to load word list. Using fallback data. Please refresh the page.";

    this.showUserMessage("warning", userMessage);
  },

  /**
   * Get default fallback words if middleware is not available
   * Falls back to WordLoader if available, otherwise uses minimal hardcoded list
   */
  getDefaultFallbackWords() {
    // Use WordLoader if available
    if (window.WordLoader && WordLoader.getFallbackWords) {
      return WordLoader.getFallbackWords();
    }
    
    // Minimal fallback (should rarely be used if WordLoader is loaded)
    return {
      easy: {
        animals: ["cat", "dog", "bird", "fish", "lion"],
        colors: ["red", "blue", "green", "yellow", "black"],
        food: ["pizza", "cake", "soup", "rice", "meat"],
      },
      medium: {
        animals: ["elephant", "giraffe", "penguin", "dolphin", "tiger"],
        countries: ["france", "germany", "japan", "brazil", "canada"],
        food: ["burger", "pasta", "salad", "sushi", "tacos"],
      },
      hard: {
        animals: [
          "rhinoceros",
          "hippopotamus",
          "orangutan",
          "chameleon",
          "platypus",
        ],
        science: [
          "photosynthesis",
          "metamorphosis",
          "chromosome",
          "molecule",
          "ecosystem",
        ],
        literature: [
          "shakespeare",
          "hemingway",
          "dickens",
          "tolkien",
          "austen",
        ],
      },
    };
  },

  selectRandomWord() {
    // Ensure gameState and practiceMode are initialized
    if (!this.gameState) {
      if (window.logger) window.logger.error("gameState is not initialized");
      return;
    }
    if (!this.gameState.practiceMode) {
      this.gameState.practiceMode = {
        enabled: false,
        allowRepeats: true,
        endless: true,
        lockedDifficulty: null,
        maxMistakesOverride: null,
        wordLengthFilter: null,
        hintsUsed: 0,
        scorePenaltyMultiplier: 1,
        seenWordsByKey: {},
      };
    }

    // Check if words are loaded
    if (
      !this.wordsLoaded ||
      !this.wordLists ||
      Object.keys(this.wordLists).length === 0
    ) {
      if (window.logger) window.logger.warn("Words not loaded yet, skipping word selection");
      return;
    }

    const difficultyWords = this.wordLists[this.gameState.difficulty];
    if (!difficultyWords) {
      if (window.logger) window.logger.error(`Invalid difficulty: ${this.gameState.difficulty}`);
      // Try to find a valid difficulty
      const validDifficulties = Object.keys(this.wordLists).filter((d) => {
        const diffWords = this.wordLists[d];
        return diffWords && Object.keys(diffWords).length > 0;
      });

      if (validDifficulties.length > 0) {
        this.gameState.difficulty = validDifficulties[0];
        // Prevent infinite recursion by limiting retries
        if (!this._selectWordRetryCount) {
          this._selectWordRetryCount = 0;
        }
        this._selectWordRetryCount++;
        if (this._selectWordRetryCount < 5) {
          return this.selectRandomWord();
        }
      }
      if (window.logger) window.logger.error("No valid difficulty found. Cannot select word.");
      this._selectWordRetryCount = 0;
      return;
    }

    // Reset retry count on successful difficulty lookup
    this._selectWordRetryCount = 0;

    const categoryWords = difficultyWords[this.gameState.category];
    if (!categoryWords || categoryWords.length === 0) {
      if (window.logger) window.logger.error(
        `Invalid category: ${this.gameState.category} for difficulty: ${this.gameState.difficulty}`
      );
      // Fallback to first available category
      const availableCategories = Object.keys(difficultyWords);
      if (availableCategories.length === 0) {
        if (window.logger) window.logger.error(
          "No categories available for difficulty:",
          this.gameState.difficulty
        );
        // Try to fallback to a different difficulty
        const allDifficulties = Object.keys(this.wordLists);
        const fallbackDifficulty = allDifficulties.find((d) => {
          const diffWords = this.wordLists[d];
          return diffWords && Object.keys(diffWords).length > 0;
        });
        if (fallbackDifficulty) {
          this.gameState.difficulty = fallbackDifficulty;
          const fallbackCategories = Object.keys(
            this.wordLists[fallbackDifficulty]
          );
          if (fallbackCategories.length > 0) {
            this.gameState.category = fallbackCategories[0];
            return this.selectRandomWord();
          }
        }
        if (window.logger) window.logger.error("No valid words available. Cannot select word.");
        return;
      }
      this.gameState.category = availableCategories[0];
      return this.selectRandomWord();
    }

    let filtered = categoryWords.map((w) => w.toLowerCase());

    // Apply word-length filter in practice mode
    if (
      this.gameState.practiceMode?.enabled &&
      this.gameState.practiceMode?.wordLengthFilter
    ) {
      const { min, max } = this.gameState.practiceMode.wordLengthFilter;
      filtered = filtered.filter((w) => {
        const len = w.replace(/\s/g, "").length;
        return (min ? len >= min : true) && (max ? len <= max : true);
      });
    }

    // Apply repeat filtering in practice mode
    if (
      this.gameState.practiceMode?.enabled &&
      this.gameState.practiceMode?.allowRepeats === false
    ) {
      const key = `${this.gameState.difficulty}-${this.gameState.category}`;
      const seen =
        this.gameState.practiceMode.seenWordsByKey?.[key] || new Set();
      filtered = filtered.filter((w) => !seen.has(w));
      if (filtered.length === 0) {
        // Reset seen set if exhausted
        if (!this.gameState.practiceMode.seenWordsByKey) {
          this.gameState.practiceMode.seenWordsByKey = {};
        }
        this.gameState.practiceMode.seenWordsByKey[key] = new Set();
        filtered = categoryWords.map((w) => w.toLowerCase());
      }
    }

    // Safety check: ensure we have words to select from
    if (filtered.length === 0) {
      if (window.logger) window.logger.error(
        "No words available after filtering. Resetting filter and retrying."
      );
      // Reset seen words if in practice mode to allow retry
      if (
        this.gameState.practiceMode?.enabled &&
        this.gameState.practiceMode?.allowRepeats === false
      ) {
        const key = `${this.gameState.difficulty}-${this.gameState.category}`;
        if (this.gameState.practiceMode.seenWordsByKey?.[key]) {
          this.gameState.practiceMode.seenWordsByKey[key] = new Set();
        }
        // Retry with reset seen words
        return this.selectRandomWord();
      }
      if (window.logger) window.logger.error(
        "Cannot select word: filtered list is empty and cannot reset."
      );
      return;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    this.gameState.currentWord = filtered[randomIndex];

    // Final safety check
    if (!this.gameState.currentWord) {
      if (window.logger) window.logger.error("Selected word is undefined. This should not happen.");
      return;
    }

    // Mark as seen in practice mode
    if (this.gameState.practiceMode?.enabled) {
      const key = `${this.gameState.difficulty}-${this.gameState.category}`;
      if (!this.gameState.practiceMode.seenWordsByKey) {
        this.gameState.practiceMode.seenWordsByKey = {};
      }
      if (!this.gameState.practiceMode.seenWordsByKey[key]) {
        this.gameState.practiceMode.seenWordsByKey[key] = new Set();
      }
      this.gameState.practiceMode.seenWordsByKey[key].add(
        this.gameState.currentWord
      );
    }
  },

  createHiddenWord() {
    this.gameState.hiddenWord = this.gameState.currentWord
      .split("")
      .map((letter) => (letter === " " ? " " : "_"))
      .join(" ");
  },
};

// Export for use in game.js
if (typeof window !== "undefined") {
  window.WordManagerMixin = WordManagerMixin;
}

