// ========================================
// HANGMAN GAME - CORE GAME LOGIC
// ========================================

class HangmanGame {
  constructor() {
    this.gameState = {
      currentWord: "",
      hiddenWord: "",
      guessedLetters: [],
      incorrectGuesses: [],
      maxIncorrectGuesses: 6,
      gameStatus: "playing", // 'playing', 'won', 'lost', 'paused'
      isPaused: false,
      score: 0,
      difficulty: "medium",
      category: "animals",
      gameStartTime: null,
      gameEndTime: null,
      // Timed mode configuration
      timedMode: false,
      timeLimit: 60000, // 60 seconds default
      timeRemaining: 60000,
      bestTimes: {},
      // Practice mode configuration
      practiceMode: {
        enabled: false,
        allowRepeats: true,
        endless: true,
        lockedDifficulty: null,
        maxMistakesOverride: null,
        wordLengthFilter: null, // { min: number, max: number }
        hintsUsed: 0,
        scorePenaltyMultiplier: 1,
        seenWordsByKey: {}, // key: `${difficulty}-${category}` -> Set of words
      },
    };

    // Initialize error middleware (will be set by main.js)
    this.errorMiddleware = null;

    // Statistics tracking
    this.statistics = this.loadStatistics();

    // Difficulty progression system
    this.difficultyProgression = {
      enabled: true,
      consecutiveWins: 0,
      difficultyThresholds: {
        easy: 0, // Start at easy
        medium: 3, // Advance to medium after 3 consecutive wins
        hard: 7, // Advance to hard after 7 consecutive wins
      },
      difficultyOrder: ["easy", "medium", "hard"],
    };

    // Achievement system
    this.achievements = this.loadAchievements();

    this.wordLists = {};
    this.wordsLoaded = false;
    this.isOfflineMode = false;
    this.retryCount = 0;
    this.maxRetries = 3;

    this.hangmanParts = [
      "beam",
      "rope",
      "head",
      "body",
      "left-arm",
      "right-arm",
      "left-leg",
      "right-leg",
    ];

    // Timer for timed mode
    this.timerInterval = null;

    this.loadWords();
    this.applySettingsFromThemeManager();
    this.practiceProgress = this.loadPracticeProgress();
  }

  /**
   * Apply settings from theme manager if available
   */
  applySettingsFromThemeManager() {
    // Wait for theme manager to be available
    setTimeout(() => {
      if (window.themeManager) {
        const settings = window.themeManager.getCurrentSettings();
        if (settings.difficulty) {
          this.gameState.difficulty = settings.difficulty;
        }
        if (settings.category) {
          this.gameState.category = settings.category;
        }
      }
    }, 100);
  }

  /**
   * Update game settings from theme manager
   */
  updateGameSettings() {
    if (window.themeManager) {
      const settings = window.themeManager.getCurrentSettings();
      if (
        settings.difficulty &&
        settings.difficulty !== this.gameState.difficulty
      ) {
        this.gameState.difficulty = settings.difficulty;
        console.log(`Difficulty changed to: ${settings.difficulty}`);
      }
      if (settings.category && settings.category !== this.gameState.category) {
        this.gameState.category = settings.category;
        console.log(`Category changed to: ${settings.category}`);
      }
    }
  }

  async loadWords() {
    try {
      // Check if we're offline first
      if (NetworkUtils.isOffline()) {
        throw new Error("Network connection lost");
      }

      // Try to load from cache first
      const cachedWords = this.loadCachedWords();
      if (cachedWords && !this.isOfflineMode) {
        this.wordLists = cachedWords;
        this.wordsLoaded = true;
        console.log("Words loaded from cache:", this.wordLists);
        this.init();
        return;
      }

      // Try to fetch from server with timeout and retry logic
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
      this.wordsLoaded = true;
      this.isOfflineMode = false;
      this.retryCount = 0;

      // Cache the words for offline use
      this.cacheWords(this.wordLists);

      console.log("Words loaded successfully from server:", this.wordLists);

      // Initialize the game once words are loaded
      this.init();
    } catch (error) {
      console.error("Error loading words:", error);

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
              console.log(
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
  }

  /**
   * Loads cached words from localStorage
   * @returns {Object|null} - Cached word list or null
   */
  loadCachedWords() {
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
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Error loading cached words:", error);
    }
    return null;
  }

  /**
   * Caches words to localStorage
   * @param {Object} words - Word list to cache
   */
  cacheWords(words) {
    if (!GameUtils.isLocalStorageAvailable()) return;

    try {
      localStorage.setItem("hangman_cached_words", JSON.stringify(words));
      localStorage.setItem("hangman_words_cache_time", Date.now().toString());
    } catch (error) {
      console.warn("Error caching words:", error);
    }
  }

  /**
   * Uses fallback word list when all else fails
   */
  useFallbackWordList() {
    this.wordLists = this.errorMiddleware
      ? this.errorMiddleware.getFallbackWordList()
      : this.getDefaultFallbackWords();
    this.wordsLoaded = true;
    this.isOfflineMode = true;
    this.init();

    const userMessage = NetworkUtils.isOffline()
      ? "You're offline. Using limited word list. Connect to internet for full features."
      : "Unable to load word list. Using fallback data. Please refresh the page.";

    this.showUserMessage("warning", userMessage);
  }

  /**
   * Get default fallback words if middleware is not available
   */
  getDefaultFallbackWords() {
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
  }

  /**
   * Shows user-friendly error messages
   * @param {string} type - Message type (error, warning, info, success)
   * @param {string} message - Message to show
   */
  showUserMessage(type, message) {
    if (window.ui) {
      window.ui.showFeedback(type, message);
    } else {
      // Fallback if UI is not available
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  init() {
    this.selectRandomWord();
    this.createHiddenWord();
    this.updateDisplay();
    this.startGameTimer();

    // Start countdown timer if timed mode is enabled
    if (this.gameState.timedMode) {
      this.gameState.timeRemaining = this.gameState.timeLimit;
      this.startCountdownTimer();
    }
  }

  selectRandomWord() {
    // Check if words are loaded
    if (
      !this.wordsLoaded ||
      !this.wordLists ||
      Object.keys(this.wordLists).length === 0
    ) {
      console.warn("Words not loaded yet, skipping word selection");
      return;
    }

    const difficultyWords = this.wordLists[this.gameState.difficulty];
    if (!difficultyWords) {
      console.error(`Invalid difficulty: ${this.gameState.difficulty}`);
      this.gameState.difficulty = "medium";
      return this.selectRandomWord();
    }

    const categoryWords = difficultyWords[this.gameState.category];
    if (!categoryWords || categoryWords.length === 0) {
      console.error(
        `Invalid category: ${this.gameState.category} for difficulty: ${this.gameState.difficulty}`
      );
      // Fallback to first available category
      const availableCategories = Object.keys(difficultyWords);
      this.gameState.category = availableCategories[0];
      return this.selectRandomWord();
    }

    let filtered = categoryWords.map((w) => w.toLowerCase());

    // Apply word-length filter in practice mode
    if (
      this.gameState.practiceMode.enabled &&
      this.gameState.practiceMode.wordLengthFilter
    ) {
      const { min, max } = this.gameState.practiceMode.wordLengthFilter;
      filtered = filtered.filter((w) => {
        const len = w.replace(/\s/g, "").length;
        return (min ? len >= min : true) && (max ? len <= max : true);
      });
    }

    // Apply repeat filtering in practice mode
    if (
      this.gameState.practiceMode.enabled &&
      this.gameState.practiceMode.allowRepeats === false
    ) {
      const key = `${this.gameState.difficulty}-${this.gameState.category}`;
      const seen = this.gameState.practiceMode.seenWordsByKey[key] || new Set();
      filtered = filtered.filter((w) => !seen.has(w));
      if (filtered.length === 0) {
        // Reset seen set if exhausted
        this.gameState.practiceMode.seenWordsByKey[key] = new Set();
        filtered = categoryWords.map((w) => w.toLowerCase());
      }
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    this.gameState.currentWord = filtered[randomIndex];

    // Mark as seen in practice mode
    if (this.gameState.practiceMode.enabled) {
      const key = `${this.gameState.difficulty}-${this.gameState.category}`;
      if (!this.gameState.practiceMode.seenWordsByKey[key]) {
        this.gameState.practiceMode.seenWordsByKey[key] = new Set();
      }
      this.gameState.practiceMode.seenWordsByKey[key].add(
        this.gameState.currentWord
      );
    }
  }

  createHiddenWord() {
    this.gameState.hiddenWord = this.gameState.currentWord
      .split("")
      .map((letter) => (letter === " " ? " " : "_"))
      .join(" ");
  }

  makeGuess(letter) {
    if (this.gameState.gameStatus !== "playing" || this.gameState.isPaused)
      return false;

    // Use enhanced input validation
    const validation = GameUtils.validateHangmanInput(letter);

    if (!validation.isValid) {
      // Show error message to user
      if (window.ui) {
        window.ui.showFeedback("error", validation.errorMessage);
      }
      return false;
    }

    // Use the sanitized input
    letter = validation.sanitizedInput;

    // Check if letter was already guessed
    if (this.gameState.guessedLetters.includes(letter)) {
      return false;
    }

    this.gameState.guessedLetters.push(letter);

    // Check if letter is in the word
    if (this.gameState.currentWord.includes(letter)) {
      this.revealLetter(letter);
      this.checkWinCondition();
      return true;
    } else {
      this.gameState.incorrectGuesses.push(letter);
      this.drawHangmanPart();
      this.checkLoseCondition();
      return false;
    }
  }

  revealLetter(letter) {
    const wordArray = this.gameState.hiddenWord.split(" ");
    const currentWordArray = this.gameState.currentWord.split("");

    currentWordArray.forEach((char, index) => {
      if (char === letter) {
        wordArray[index] = letter;
      }
    });

    this.gameState.hiddenWord = wordArray.join(" ");

    // Use animated display for letter reveals
    this.updateWordDisplayWithAnimation();
  }

  drawHangmanPart() {
    const partIndex = this.gameState.incorrectGuesses.length - 1;
    if (partIndex < this.hangmanParts.length) {
      const part = this.hangmanParts[partIndex];
      const element = document.querySelector(`.hangman-figure .${part}`);
      if (element) {
        element.classList.add("show");
      }
    }
  }

  checkWinCondition() {
    const hiddenLetters = this.gameState.hiddenWord.replace(/\s/g, "");
    const currentLetters = this.gameState.currentWord.replace(/\s/g, "");

    if (hiddenLetters === currentLetters) {
      this.gameState.gameStatus = "won";

      // Stop countdown timer
      this.stopCountdownTimer();

      // Calculate score based on difficulty and performance
      const baseScore = this.calculateScore();
      this.gameState.score += baseScore;

      // Record best time in timed mode
      if (this.gameState.timedMode) {
        const timeUsed =
          this.gameState.timeLimit - this.gameState.timeRemaining;
        this.recordBestTime(timeUsed);
      }

      // Update score display
      if (window.ui && window.ui.updateScoreDisplay) {
        window.ui.updateScoreDisplay();
      }

      // Update difficulty progression
      this.updateDifficultyProgression();

      // Check for achievements
      this.checkAchievements();

      // Add celebration effects
      this.triggerWinCelebration();

      this.updateStatistics("won");
      this.showGameOverModal("You Won!", this.gameState.currentWord);

      // Auto-continue in practice endless mode
      if (this.gameState.practiceMode.enabled && this.gameState.practiceMode.endless) {
        setTimeout(() => {
          this.hideGameOverModal();
          this.resetGame();
        }, 1200);
      }

      // Check for challenge completion
      this.checkChallengeCompletion();
    }
  }

  /**
   * Checks if current game completed any challenges
   */
  checkChallengeCompletion() {
    if (!window.challengeSystem) return;

    const gameResult = {
      won: this.gameState.gameStatus === "won",
      score: this.calculateScore(),
      time: this.endGameTimer(),
      difficulty: this.gameState.difficulty,
      category: this.gameState.category,
      incorrectGuesses: this.gameState.incorrectGuesses.length,
    };

    // Check daily challenge completion
    const dailySuccess =
      window.challengeSystem.completeDailyChallenge(gameResult);
    if (dailySuccess) {
      this.showFeedback("achievement", "🎉 Daily Challenge Completed!");
    }
  }

  triggerWinCelebration() {
    // Add celebration animation to word display
    const wordDisplay = document.getElementById("word-display");
    if (wordDisplay) {
      wordDisplay.classList.add("celebration");
      setTimeout(() => {
        wordDisplay.classList.remove("celebration");
      }, 2000);
    }

    // Create confetti effect
    if (window.ui && window.ui.createConfetti) {
      window.ui.createConfetti();
    }

    // Add celebration to all revealed letters
    const revealedLetters = document.querySelectorAll(".word-letter.revealed");
    revealedLetters.forEach((letter, index) => {
      setTimeout(() => {
        letter.classList.add("celebration-bounce");
        setTimeout(() => {
          letter.classList.remove("celebration-bounce");
        }, 600);
      }, index * 100);
    });
  }

  checkLoseCondition() {
    if (
      this.gameState.incorrectGuesses.length >=
      this.gameState.maxIncorrectGuesses
    ) {
      this.gameState.gameStatus = "lost";

      // Add failure effects
      this.triggerFailureEffect();

      this.updateStatistics("lost");
      this.showGameOverModal("Game Over!", this.gameState.currentWord);

      // Auto-continue in practice endless mode
      if (this.gameState.practiceMode.enabled && this.gameState.practiceMode.endless) {
        setTimeout(() => {
          this.hideGameOverModal();
          this.resetGame();
        }, 1200);
      }
    }
  }

  triggerFailureEffect() {
    // Add failure animation to word display
    const wordDisplay = document.getElementById("word-display");
    if (wordDisplay) {
      wordDisplay.classList.add("failure-shake");
      setTimeout(() => {
        wordDisplay.classList.remove("failure-shake");
      }, 500);
    }

    // Add failure animation to hangman figure
    const hangmanFigure = document.querySelector(".hangman-figure");
    if (hangmanFigure) {
      hangmanFigure.classList.add("failure-shake");
      setTimeout(() => {
        hangmanFigure.classList.remove("failure-shake");
      }, 500);
    }
  }

  showGameOverModal(result, word) {
    const modal = document.getElementById("game-over-modal");
    const resultElement = document.getElementById("game-result");
    const wordElement = document.getElementById("correct-word");

    if (modal && resultElement && wordElement) {
      resultElement.textContent = result;
      resultElement.className = result === "You Won!" ? "win" : "lose";
      wordElement.textContent = `The word was: ${word.toUpperCase()}`;
      modal.classList.add("show");
    }
  }

  hideGameOverModal() {
    const modal = document.getElementById("game-over-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  }

  resetGame() {
    // Stop countdown timer
    this.stopCountdownTimer();

    this.gameState = {
      currentWord: "",
      hiddenWord: "",
      guessedLetters: [],
      incorrectGuesses: [],
      maxIncorrectGuesses: 6,
      gameStatus: "playing",
      isPaused: false,
      score: this.gameState.score, // Keep score
      difficulty: this.gameState.difficulty,
      category: this.gameState.category,
      gameStartTime: null,
      gameEndTime: null,
      // Preserve timed mode settings
      timedMode: this.gameState.timedMode,
      timeLimit: this.gameState.timeLimit,
      timeRemaining: this.gameState.timedMode
        ? this.gameState.timeLimit
        : 60000,
      bestTimes: this.gameState.bestTimes,
    };

    // Reset hangman figure
    this.hangmanParts.forEach((part) => {
      const element = document.querySelector(`.hangman-figure .${part}`);
      if (element) {
        element.classList.remove("show");
      }
    });

    this.init();
  }

  updateDisplay() {
    this.updateWordDisplay();
    this.updateIncorrectLetters();
    this.updateKeyboard();

    // Update progress indicators if UI is available
    if (window.ui && window.ui.updateAllProgressIndicators) {
      window.ui.updateAllProgressIndicators();
    }
  }

  updateWordDisplay() {
    const wordDisplay = document.getElementById("word-display");
    if (wordDisplay) {
      wordDisplay.innerHTML = this.gameState.hiddenWord
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";
          const isRevealed = char !== "_";
          const letterClass = isRevealed
            ? "word-letter revealed"
            : "word-letter";
          return `<span class="${letterClass}">${char}</span>`;
        })
        .join("");
    }
  }

  updateWordDisplayWithAnimation() {
    const wordDisplay = document.getElementById("word-display");
    if (wordDisplay) {
      const currentLetters = wordDisplay.querySelectorAll(".word-letter");
      const newWord = this.gameState.hiddenWord.split("");

      newWord.forEach((char, index) => {
        if (char === " ") return;

        const currentLetter = currentLetters[index];
        const isRevealed = char !== "_";
        const wasHidden = currentLetter && currentLetter.textContent === "_";

        if (isRevealed && wasHidden) {
          // Letter was just revealed - add animation
          const newLetter = document.createElement("span");
          newLetter.className = "word-letter revealed";
          newLetter.textContent = char;
          newLetter.style.animation = "letterReveal 0.6s ease-out";

          if (currentLetter) {
            currentLetter.parentNode.replaceChild(newLetter, currentLetter);
          }
        }
      });
    }
  }

  updateIncorrectLetters() {
    const incorrectDisplay = document.getElementById("incorrect-letters");
    if (incorrectDisplay) {
      incorrectDisplay.textContent = this.gameState.incorrectGuesses.join(", ");
    }
  }

  updateKeyboard() {
    const keyboardKeys = document.querySelectorAll(".keyboard-key");
    keyboardKeys.forEach((key) => {
      const letter = key.textContent.toLowerCase();
      key.disabled = this.gameState.guessedLetters.includes(letter);

      // Remove previous state classes
      key.classList.remove("correct", "incorrect");

      if (this.gameState.guessedLetters.includes(letter)) {
        if (this.gameState.currentWord.includes(letter)) {
          key.classList.add("correct");
        } else {
          key.classList.add("incorrect");
        }
      }
    });
  }

  getHint() {
    if (this.gameState.gameStatus !== "playing" || this.gameState.isPaused)
      return;

    const unrevealedLetters = this.gameState.currentWord
      .split("")
      .filter((letter, index) => {
        return (
          letter !== " " && this.gameState.hiddenWord.split(" ")[index] === "_"
        );
      });

    if (unrevealedLetters.length > 0) {
      const randomLetter =
        unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
      this.makeGuess(randomLetter);

      // Practice mode: apply hint penalty
      if (this.gameState.practiceMode.enabled) {
        this.gameState.practiceMode.hintsUsed += 1;
        // -10% score per hint (multiplicative)
        this.gameState.practiceMode.scorePenaltyMultiplier *= 0.9;
      }
    }
  }

  pauseGame() {
    if (this.gameState.gameStatus === "playing" && !this.gameState.isPaused) {
      this.gameState.isPaused = true;
      this.gameState.gameStatus = "paused";
      return true;
    }
    return false;
  }

  resumeGame() {
    if (this.gameState.gameStatus === "paused" && this.gameState.isPaused) {
      this.gameState.isPaused = false;
      this.gameState.gameStatus = "playing";
      return true;
    }
    return false;
  }

  togglePause() {
    if (this.gameState.isPaused) {
      return this.resumeGame();
    } else {
      return this.pauseGame();
    }
  }

  // ========================================
  // DIFFICULTY PROGRESSION SYSTEM
  // ========================================

  updateDifficultyProgression() {
    // Disable progression in practice mode
    if (!this.difficultyProgression.enabled || this.gameState.practiceMode.enabled)
      return;

    this.difficultyProgression.consecutiveWins++;
    const currentDifficulty = this.gameState.difficulty;
    const currentIndex =
      this.difficultyProgression.difficultyOrder.indexOf(currentDifficulty);

    // Check if we should advance to next difficulty
    const nextDifficulty =
      this.difficultyProgression.difficultyOrder[currentIndex + 1];
    if (
      nextDifficulty &&
      this.difficultyProgression.consecutiveWins >=
        this.difficultyProgression.difficultyThresholds[nextDifficulty]
    ) {
      this.gameState.difficulty = nextDifficulty;
      this.showDifficultyAdvancement(nextDifficulty);

      // Update difficulty indicator
      if (window.ui && window.ui.updateDifficultyIndicator) {
        window.ui.updateDifficultyIndicator();
      }
    }
  }

  showDifficultyAdvancement(newDifficulty) {
    const difficultyNames = {
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
    };

    // This will be handled by the UI
    if (window.ui) {
      window.ui.showFeedback(
        "success",
        `🎉 Difficulty Advanced to ${difficultyNames[newDifficulty]}! You've won ${this.difficultyProgression.consecutiveWins} games in a row!`
      );
    }
  }

  resetDifficultyProgression() {
    this.difficultyProgression.consecutiveWins = 0;
    this.gameState.difficulty = "easy";
  }

  // ========================================
  // SCORING SYSTEM
  // ========================================

  calculateScore() {
    const difficultyMultipliers = {
      easy: 1,
      medium: 2,
      hard: 3,
    };

    const baseScore = 100;
    const difficultyMultiplier =
      difficultyMultipliers[this.gameState.difficulty] || 1;

    // Bonus for fewer incorrect guesses
    const incorrectGuesses = this.gameState.incorrectGuesses.length;
    const maxGuesses = this.gameState.maxIncorrectGuesses;
    const efficiencyBonus = Math.max(0, (maxGuesses - incorrectGuesses) * 10);

    let timeBonus = 0;

    // Time-based scoring for timed mode
    if (this.gameState.timedMode) {
      timeBonus = this.calculateTimeBonus();
    } else {
      // Regular time bonus (faster completion = more points)
      const playTime = this.endGameTimer();
      timeBonus = Math.max(0, Math.floor((30000 - playTime) / 1000) * 2);
    }

    let totalScore =
      (baseScore + efficiencyBonus + timeBonus) * difficultyMultiplier;

    // Apply practice hint penalties
    if (this.gameState.practiceMode.enabled) {
      totalScore = Math.round(totalScore * this.gameState.practiceMode.scorePenaltyMultiplier);
    }
    return Math.max(50, totalScore); // Minimum score of 50
  }

  // ========================================
  // ACHIEVEMENT SYSTEM
  // ========================================

  loadAchievements() {
    return GameUtils.safeExecute(
      () => {
        if (!GameUtils.isLocalStorageAvailable()) {
          throw new Error("localStorage not available");
        }

        const savedAchievements = localStorage.getItem("hangmanAchievements");
        if (savedAchievements) {
          const parsed = JSON.parse(savedAchievements);
          // Validate the structure
          if (this.validateAchievementsStructure(parsed)) {
            return parsed;
          } else {
            throw new Error("Invalid achievements structure");
          }
        }
        throw new Error("No saved achievements found");
      },
      "loadAchievements",
      this.getDefaultAchievements()
    );
  }

  /**
   * Validates achievements structure
   * @param {Object} achievements - Achievements object to validate
   * @returns {boolean} - True if valid
   */
  validateAchievementsStructure(achievements) {
    const requiredAchievements = [
      "firstWin",
      "streak5",
      "streak10",
      "perfectGame",
      "speedDemon",
      "difficultyMaster",
      "categoryExplorer",
      "scoreHunter",
    ];

    return requiredAchievements.every(
      (achievement) =>
        achievements.hasOwnProperty(achievement) &&
        achievements[achievement].hasOwnProperty("unlocked") &&
        achievements[achievement].hasOwnProperty("unlockedAt")
    );
  }

  /**
   * Gets default achievements structure
   * @returns {Object} - Default achievements
   */
  getDefaultAchievements() {
    return {
      firstWin: { unlocked: false, unlockedAt: null },
      streak5: { unlocked: false, unlockedAt: null },
      streak10: { unlocked: false, unlockedAt: null },
      perfectGame: { unlocked: false, unlockedAt: null },
      speedDemon: { unlocked: false, unlockedAt: null },
      difficultyMaster: { unlocked: false, unlockedAt: null },
      categoryExplorer: { unlocked: false, unlockedAt: null },
      scoreHunter: { unlocked: false, unlockedAt: null },
    };
  }

  saveAchievements() {
    const success = GameUtils.safeExecute(
      () => {
        if (!GameUtils.isLocalStorageAvailable()) {
          throw new Error("localStorage not available");
        }
        localStorage.setItem(
          "hangmanAchievements",
          JSON.stringify(this.achievements)
        );
        return true;
      },
      "saveAchievements",
      false
    );

    if (!success) {
      this.errorHandler.handleError(
        new Error("Failed to save achievements"),
        "storage_quota",
        { achievements: this.achievements }
      );
    }
  }

  checkAchievements() {
    // Disable achievements in practice mode
    if (this.gameState.practiceMode.enabled) {
      return;
    }
    const stats = this.statistics;
    const newAchievements = [];

    // First Win
    if (!this.achievements.firstWin.unlocked && stats.gamesWon >= 1) {
      this.achievements.firstWin.unlocked = true;
      this.achievements.firstWin.unlockedAt = new Date().toISOString();
      newAchievements.push("First Win");
    }

    // Streak Achievements
    if (!this.achievements.streak5.unlocked && stats.currentStreak >= 5) {
      this.achievements.streak5.unlocked = true;
      this.achievements.streak5.unlockedAt = new Date().toISOString();
      newAchievements.push("5-Game Streak");
    }

    if (!this.achievements.streak10.unlocked && stats.currentStreak >= 10) {
      this.achievements.streak10.unlocked = true;
      this.achievements.streak10.unlockedAt = new Date().toISOString();
      newAchievements.push("10-Game Streak");
    }

    // Perfect Game (no incorrect guesses)
    if (
      !this.achievements.perfectGame.unlocked &&
      this.gameState.incorrectGuesses.length === 0
    ) {
      this.achievements.perfectGame.unlocked = true;
      this.achievements.perfectGame.unlockedAt = new Date().toISOString();
      newAchievements.push("Perfect Game");
    }

    // Speed Demon (win in under 15 seconds)
    const playTime = this.endGameTimer();
    if (!this.achievements.speedDemon.unlocked && playTime < 15000) {
      this.achievements.speedDemon.unlocked = true;
      this.achievements.speedDemon.unlockedAt = new Date().toISOString();
      newAchievements.push("Speed Demon");
    }

    // Difficulty Master (win on hard difficulty)
    if (
      !this.achievements.difficultyMaster.unlocked &&
      this.gameState.difficulty === "hard"
    ) {
      this.achievements.difficultyMaster.unlocked = true;
      this.achievements.difficultyMaster.unlockedAt = new Date().toISOString();
      newAchievements.push("Difficulty Master");
    }

    // Category Explorer (play 5 different categories)
    const categoriesPlayed = Object.keys(stats.categoryStats).length;
    if (!this.achievements.categoryExplorer.unlocked && categoriesPlayed >= 5) {
      this.achievements.categoryExplorer.unlocked = true;
      this.achievements.categoryExplorer.unlockedAt = new Date().toISOString();
      newAchievements.push("Category Explorer");
    }

    // Score Hunter (reach 1000 total score)
    if (
      !this.achievements.scoreHunter.unlocked &&
      this.gameState.score >= 1000
    ) {
      this.achievements.scoreHunter.unlocked = true;
      this.achievements.scoreHunter.unlockedAt = new Date().toISOString();
      newAchievements.push("Score Hunter");
    }

    // Save achievements and show notifications
    if (newAchievements.length > 0) {
      this.saveAchievements();
      this.showAchievementNotification(newAchievements);
    }
  }

  showAchievementNotification(achievements) {
    if (window.ui) {
      achievements.forEach((achievement) => {
        window.ui.showFeedback(
          "achievement",
          `🏆 Achievement Unlocked: ${achievement}!`
        );
      });
    }
  }

  getAchievements() {
    return { ...this.achievements };
  }

  resetAchievements() {
    this.achievements = this.loadAchievements();
    this.achievements.firstWin.unlocked = false;
    this.achievements.streak5.unlocked = false;
    this.achievements.streak10.unlocked = false;
    this.achievements.perfectGame.unlocked = false;
    this.achievements.speedDemon.unlocked = false;
    this.achievements.difficultyMaster.unlocked = false;
    this.achievements.categoryExplorer.unlocked = false;
    this.achievements.scoreHunter.unlocked = false;
    this.saveAchievements();
  }

  // ========================================
  // STATISTICS MANAGEMENT
  // ========================================

  loadStatistics() {
    return GameUtils.safeExecute(
      () => {
        if (!GameUtils.isLocalStorageAvailable()) {
          throw new Error("localStorage not available");
        }

        const savedStats = localStorage.getItem("hangmanStatistics");
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          // Validate the structure
          if (this.validateStatisticsStructure(parsed)) {
            return parsed;
          } else {
            throw new Error("Invalid statistics structure");
          }
        }
        throw new Error("No saved statistics found");
      },
      "loadStatistics",
      this.getDefaultStatistics()
    );
  }

  /**
   * Validates statistics structure
   * @param {Object} stats - Statistics object to validate
   * @returns {boolean} - True if valid
   */
  validateStatisticsStructure(stats) {
    const requiredFields = [
      "gamesPlayed",
      "gamesWon",
      "gamesLost",
      "winPercentage",
      "totalGuesses",
      "averageGuessesPerGame",
      "fastestCompletionTime",
      "longestStreak",
      "currentStreak",
      "bestStreak",
      "totalPlayTime",
      "averagePlayTime",
      "difficultyStats",
      "categoryStats",
      "lastPlayed",
      "gameHistory",
      "dailyStats",
      "weeklyStats",
      "monthlyStats",
      "performanceMetrics",
      "streaks",
      "achievements",
    ];

    return requiredFields.every((field) => stats.hasOwnProperty(field));
  }

  /**
   * Gets default statistics structure
   * @returns {Object} - Default statistics
   */
  getDefaultStatistics() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winPercentage: 0,
      totalGuesses: 0,
      averageGuessesPerGame: 0,
      fastestCompletionTime: null,
      longestStreak: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPlayTime: 0,
      averagePlayTime: 0,
      difficultyStats: {
        easy: {
          played: 0,
          won: 0,
          lost: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: null,
        },
        medium: {
          played: 0,
          won: 0,
          lost: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: null,
        },
        hard: {
          played: 0,
          won: 0,
          lost: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: null,
        },
      },
      categoryStats: {},
      lastPlayed: null,
      // Enhanced data for dashboard
      gameHistory: [], // Array of individual game results
      dailyStats: {}, // Daily statistics for trends
      weeklyStats: {}, // Weekly statistics for trends
      monthlyStats: {}, // Monthly statistics for trends
      performanceMetrics: {
        accuracy: 0, // Percentage of correct guesses
        efficiency: 0, // Score per minute
        consistency: 0, // Standard deviation of completion times
        improvement: 0, // Trend over time
      },
      streaks: {
        current: 0,
        best: 0,
        longestLossStreak: 0,
        currentLossStreak: 0,
      },
      achievements: {
        totalUnlocked: 0,
        recentlyUnlocked: [],
      },
    };
  }

  saveStatistics() {
    const success = GameUtils.safeExecute(
      () => {
        if (!GameUtils.isLocalStorageAvailable()) {
          throw new Error("localStorage not available");
        }
        localStorage.setItem(
          "hangmanStatistics",
          JSON.stringify(this.statistics)
        );
        return true;
      },
      "saveStatistics",
      false
    );

    if (!success) {
      this.errorHandler.handleError(
        new Error("Failed to save statistics"),
        "storage_quota",
        { statistics: this.statistics }
      );
    }
  }

  startGameTimer() {
    this.gameState.gameStartTime = Date.now();
  }

  endGameTimer() {
    this.gameState.gameEndTime = Date.now();
    return this.gameState.gameEndTime - this.gameState.gameStartTime;
  }

  // ========================================
  // TIMED MODE SYSTEM
  // ========================================

  /**
   * Enables timed mode
   * @param {number} timeLimit - Time limit in milliseconds
   */
  enableTimedMode(timeLimit = 60000) {
    this.gameState.timedMode = true;
    this.gameState.timeLimit = timeLimit;
    this.gameState.timeRemaining = timeLimit;

    // Clear any existing timer
    this.stopCountdownTimer();
  }

  /**
   * Disables timed mode
   */
  disableTimedMode() {
    this.gameState.timedMode = false;
    this.stopCountdownTimer();
  }

  /**
   * Starts the countdown timer
   */
  startCountdownTimer() {
    if (!this.gameState.timedMode) return;

    // Clear any existing timer
    this.stopCountdownTimer();

    this.timerInterval = setInterval(() => {
      this.updateCountdownTimer();
    }, 100);
  }

  /**
   * Stops the countdown timer
   */
  stopCountdownTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Updates the countdown timer
   */
  updateCountdownTimer() {
    if (!this.gameState.timedMode) {
      this.stopCountdownTimer();
      return;
    }

    // Only count down when playing and not paused
    if (this.gameState.gameStatus === "playing" && !this.gameState.isPaused) {
      this.gameState.timeRemaining -= 100;

      // Update timer display
      if (window.ui && window.ui.updateTimerDisplay) {
        window.ui.updateTimerDisplay();
      }

      // Apply time pressure visual effects
      this.applyTimePressureEffects();

      // Check if time has run out
      if (this.gameState.timeRemaining <= 0) {
        this.gameState.timeRemaining = 0;
        this.handleTimeUp();
      }
    }
  }

  /**
   * Applies visual pressure effects when time is running low
   */
  applyTimePressureEffects() {
    const percentage = this.gameState.timeRemaining / this.gameState.timeLimit;
    const timerElement = document.getElementById("timer-display");

    if (timerElement) {
      // Add warning styles when time is running low
      if (percentage <= 0.2) {
        timerElement.classList.add("critical-time");
        if (percentage <= 0.1) {
          timerElement.classList.add("very-critical-time");
          // Add pulsing animation
          timerElement.classList.add("pulse");
        } else {
          timerElement.classList.remove("very-critical-time");
        }
      } else if (percentage <= 0.5) {
        timerElement.classList.add("warning-time");
        timerElement.classList.remove("critical-time", "very-critical-time");
      } else {
        timerElement.classList.remove(
          "warning-time",
          "critical-time",
          "very-critical-time"
        );
      }
    }

    // Add urgency to the word display
    const wordDisplay = document.getElementById("word-display");
    if (wordDisplay && percentage <= 0.2) {
      wordDisplay.classList.add("time-pressure");
    } else if (wordDisplay) {
      wordDisplay.classList.remove("time-pressure");
    }
  }

  /**
   * Handles when the time runs out
   */
  handleTimeUp() {
    this.stopCountdownTimer();
    this.gameState.gameStatus = "lost";
    this.gameState.isPaused = false;

    // Show time up message
    if (window.ui) {
      window.ui.showFeedback(
        "error",
        "⏰ Time's Up! The word was hidden too long."
      );
      this.showGameOverModal("Time's Up!", this.gameState.currentWord);
    }

    // Update statistics
    this.updateStatistics("lost");
  }

  /**
   * Calculates time bonus for scoring
   * @returns {number} - Time bonus points
   */
  calculateTimeBonus() {
    if (!this.gameState.timedMode) return 0;

    const percentageRemaining =
      this.gameState.timeRemaining / this.gameState.timeLimit;

    // Bonus based on how much time is left
    // 50 points if you finish with 50% time remaining
    // 100 points if you finish with 100% time remaining
    const timeBonus = Math.round(percentageRemaining * 100);

    return timeBonus;
  }

  /**
   * Records best time for a difficulty/category combination
   * @param {number} completionTime - Time taken to complete the game
   */
  recordBestTime(completionTime) {
    if (!this.gameState.timedMode) return;

    const key = `${this.gameState.difficulty}-${this.gameState.category}`;

    if (
      !this.gameState.bestTimes[key] ||
      completionTime < this.gameState.bestTimes[key]
    ) {
      this.gameState.bestTimes[key] = completionTime;
      this.saveBestTimes();

      if (window.ui) {
        window.ui.showFeedback("success", "🎉 New Best Time Record!");
      }
    }
  }

  /**
   * Gets best time for current difficulty/category
   * @returns {number|null} - Best time in milliseconds or null
   */
  getBestTime() {
    if (!this.gameState.timedMode) return null;

    const key = `${this.gameState.difficulty}-${this.gameState.category}`;
    return this.gameState.bestTimes[key] || null;
  }

  /**
   * Saves best times to localStorage
   */
  saveBestTimes() {
    if (!GameUtils.isLocalStorageAvailable()) return;

    try {
      localStorage.setItem(
        "hangmanBestTimes",
        JSON.stringify(this.gameState.bestTimes)
      );
    } catch (error) {
      console.warn("Error saving best times:", error);
    }
  }

  /**
   * Loads best times from localStorage
   */
  loadBestTimes() {
    if (!GameUtils.isLocalStorageAvailable()) return {};

    try {
      const saved = localStorage.getItem("hangmanBestTimes");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn("Error loading best times:", error);
      return {};
    }
  }

  updateStatistics(gameResult) {
    const playTime = this.endGameTimer();
    const totalGuesses = this.gameState.guessedLetters.length;
    const correctGuesses = this.gameState.guessedLetters.filter((letter) =>
      this.gameState.currentWord.includes(letter)
    ).length;
    const currentDate = new Date();
    const dateKey = currentDate.toISOString().split("T")[0];
    const weekKey = this.getWeekKey(currentDate);
    const monthKey = currentDate.toISOString().substring(0, 7);

    // Create game record for history
    const gameRecord = {
      id: Date.now(),
      result: gameResult,
      difficulty: this.gameState.difficulty,
      category: this.gameState.category,
      playTime: playTime,
      totalGuesses: totalGuesses,
      correctGuesses: correctGuesses,
      incorrectGuesses: this.gameState.incorrectGuesses.length,
      score: this.gameState.score,
      timestamp: currentDate.toISOString(),
      word: this.gameState.currentWord,
    };

    // Add to game history (keep last 100 games)
    this.statistics.gameHistory.push(gameRecord);
    if (this.statistics.gameHistory.length > 100) {
      this.statistics.gameHistory = this.statistics.gameHistory.slice(-100);
    }

    // Update basic counts
    this.statistics.gamesPlayed++;
    if (gameResult === "won") {
      this.statistics.gamesWon++;
      this.statistics.currentStreak++;
      this.statistics.bestStreak = Math.max(
        this.statistics.bestStreak,
        this.statistics.currentStreak
      );
      this.statistics.streaks.current = this.statistics.currentStreak;
      this.statistics.streaks.best = this.statistics.bestStreak;
      this.statistics.streaks.currentLossStreak = 0;
    } else if (gameResult === "lost") {
      this.statistics.gamesLost++;
      this.statistics.currentStreak = 0;
      this.statistics.streaks.current = 0;
      this.statistics.streaks.currentLossStreak++;
      this.statistics.streaks.longestLossStreak = Math.max(
        this.statistics.streaks.longestLossStreak,
        this.statistics.streaks.currentLossStreak
      );
      // Reset difficulty progression on loss
      this.difficultyProgression.consecutiveWins = 0;
    }

    // Update win percentage
    this.statistics.winPercentage =
      this.statistics.gamesPlayed > 0
        ? Math.round(
            (this.statistics.gamesWon / this.statistics.gamesPlayed) * 100
          )
        : 0;

    // Update guess statistics
    this.statistics.totalGuesses += totalGuesses;
    this.statistics.averageGuessesPerGame =
      this.statistics.gamesPlayed > 0
        ? Math.round(this.statistics.totalGuesses / this.statistics.gamesPlayed)
        : 0;

    // Update time statistics
    this.statistics.totalPlayTime += playTime;
    this.statistics.averagePlayTime =
      this.statistics.gamesPlayed > 0
        ? Math.round(
            this.statistics.totalPlayTime / this.statistics.gamesPlayed
          )
        : 0;

    // Update fastest completion time (only for wins)
    if (gameResult === "won") {
      if (
        !this.statistics.fastestCompletionTime ||
        playTime < this.statistics.fastestCompletionTime
      ) {
        this.statistics.fastestCompletionTime = playTime;
      }
    }

    // Update difficulty statistics
    const difficulty = this.gameState.difficulty;
    this.statistics.difficultyStats[difficulty].played++;
    this.statistics.difficultyStats[difficulty].totalTime += playTime;
    this.statistics.difficultyStats[difficulty].averageTime =
      this.statistics.difficultyStats[difficulty].played > 0
        ? Math.round(
            this.statistics.difficultyStats[difficulty].totalTime /
              this.statistics.difficultyStats[difficulty].played
          )
        : 0;

    if (gameResult === "won") {
      this.statistics.difficultyStats[difficulty].won++;
      if (
        !this.statistics.difficultyStats[difficulty].bestTime ||
        playTime < this.statistics.difficultyStats[difficulty].bestTime
      ) {
        this.statistics.difficultyStats[difficulty].bestTime = playTime;
      }
    } else if (gameResult === "lost") {
      this.statistics.difficultyStats[difficulty].lost++;
    }

    // Update category statistics
    const category = this.gameState.category;
    if (!this.statistics.categoryStats[category]) {
      this.statistics.categoryStats[category] = {
        played: 0,
        won: 0,
        lost: 0,
        totalTime: 0,
        averageTime: 0,
        bestTime: null,
      };
    }
    this.statistics.categoryStats[category].played++;
    this.statistics.categoryStats[category].totalTime += playTime;
    this.statistics.categoryStats[category].averageTime =
      this.statistics.categoryStats[category].played > 0
        ? Math.round(
            this.statistics.categoryStats[category].totalTime /
              this.statistics.categoryStats[category].played
          )
        : 0;

    if (gameResult === "won") {
      this.statistics.categoryStats[category].won++;
      if (
        !this.statistics.categoryStats[category].bestTime ||
        playTime < this.statistics.categoryStats[category].bestTime
      ) {
        this.statistics.categoryStats[category].bestTime = playTime;
      }
    } else if (gameResult === "lost") {
      this.statistics.categoryStats[category].lost++;
    }

    // Update daily statistics
    if (!this.statistics.dailyStats[dateKey]) {
      this.statistics.dailyStats[dateKey] = {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalTime: 0,
        totalScore: 0,
        averageTime: 0,
      };
    }
    this.statistics.dailyStats[dateKey].gamesPlayed++;
    this.statistics.dailyStats[dateKey].totalTime += playTime;
    this.statistics.dailyStats[dateKey].totalScore += this.gameState.score;
    this.statistics.dailyStats[dateKey].averageTime = Math.round(
      this.statistics.dailyStats[dateKey].totalTime /
        this.statistics.dailyStats[dateKey].gamesPlayed
    );

    if (gameResult === "won") {
      this.statistics.dailyStats[dateKey].gamesWon++;
    } else {
      this.statistics.dailyStats[dateKey].gamesLost++;
    }

    // Update performance metrics
    this.updatePerformanceMetrics();

    // Update last played
    this.statistics.lastPlayed = currentDate.toISOString();

    // Save to localStorage
    this.saveStatistics();

    // Practice progress tracking
    if (this.gameState.practiceMode.enabled) {
      this.updatePracticeProgress(gameResult);
      this.savePracticeProgress();
    }

    // Update streak indicator
    if (window.ui && window.ui.updateStreakIndicator) {
      window.ui.updateStreakIndicator();
    }
  }

  // ========================================
  // PRACTICE MODE
  // ========================================

  enablePracticeMode(config = {}) {
    this.gameState.practiceMode.enabled = true;
    this.gameState.practiceMode.allowRepeats =
      config.allowRepeats ?? this.gameState.practiceMode.allowRepeats;
    this.gameState.practiceMode.endless =
      config.endless ?? this.gameState.practiceMode.endless;
    this.gameState.practiceMode.lockedDifficulty =
      config.lockedDifficulty ?? this.gameState.practiceMode.lockedDifficulty;
    this.gameState.practiceMode.maxMistakesOverride =
      config.maxMistakesOverride ?? null;
    this.gameState.practiceMode.wordLengthFilter =
      config.wordLengthFilter ?? null;
    this.gameState.practiceMode.hintsUsed = 0;
    this.gameState.practiceMode.scorePenaltyMultiplier = 1;

    // Lock difficulty if provided
    if (this.gameState.practiceMode.lockedDifficulty) {
      this.gameState.difficulty = this.gameState.practiceMode.lockedDifficulty;
    }

    // Override max mistakes if provided
    if (this.gameState.practiceMode.maxMistakesOverride != null) {
      this.gameState.maxIncorrectGuesses = this.gameState.practiceMode.maxMistakesOverride;
    }
  }

  disablePracticeMode() {
    this.gameState.practiceMode.enabled = false;
    this.gameState.practiceMode.hintsUsed = 0;
    this.gameState.practiceMode.scorePenaltyMultiplier = 1;
    // Restore defaults
    this.gameState.maxIncorrectGuesses = 6;
  }

  updatePracticeProgress(gameResult) {
    const category = this.gameState.category;
    if (!this.practiceProgress.perCategory[category]) {
      this.practiceProgress.perCategory[category] = {
        played: 0,
        correct: 0,
        wrong: 0,
        masteredWords: [],
      };
    }
    const stats = this.practiceProgress.perCategory[category];
    stats.played += 1;
    if (gameResult === "won") stats.correct += 1;
    if (gameResult === "lost") stats.wrong += 1;

    // Mark mastered if won with <=1 incorrect guess
    if (
      gameResult === "won" &&
      this.gameState.incorrectGuesses.length <= 1 &&
      !stats.masteredWords.includes(this.gameState.currentWord)
    ) {
      stats.masteredWords.push(this.gameState.currentWord);
    }
  }

  loadPracticeProgress() {
    if (!GameUtils.isLocalStorageAvailable()) {
      return { perCategory: {} };
    }
    try {
      const raw = localStorage.getItem("hangmanPracticeProgress");
      return raw ? JSON.parse(raw) : { perCategory: {} };
    } catch (e) {
      return { perCategory: {} };
    }
  }

  savePracticeProgress() {
    if (!GameUtils.isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(
        "hangmanPracticeProgress",
        JSON.stringify(this.practiceProgress)
      );
    } catch (e) {}
  }

  /**
   * Gets week key for weekly statistics
   * @param {Date} date - Date to get week key for
   * @returns {string} - Week key in YYYY-WW format
   */
  getWeekKey(date) {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }

  /**
   * Gets week number of the year
   * @param {Date} date - Date to get week number for
   * @returns {number} - Week number
   */
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Updates performance metrics
   */
  updatePerformanceMetrics() {
    if (this.statistics.gameHistory.length === 0) return;

    // Calculate accuracy (percentage of correct guesses)
    const totalGuesses = this.statistics.totalGuesses;
    const correctGuesses = this.statistics.gameHistory.reduce(
      (sum, game) => sum + game.correctGuesses,
      0
    );
    this.statistics.performanceMetrics.accuracy =
      totalGuesses > 0 ? Math.round((correctGuesses / totalGuesses) * 100) : 0;

    // Calculate efficiency (score per minute)
    const totalScore = this.statistics.gameHistory.reduce(
      (sum, game) => sum + game.score,
      0
    );
    const totalMinutes = this.statistics.totalPlayTime / 60000;
    this.statistics.performanceMetrics.efficiency =
      totalMinutes > 0 ? Math.round(totalScore / totalMinutes) : 0;

    // Calculate consistency (standard deviation of completion times)
    const completionTimes = this.statistics.gameHistory
      .filter((game) => game.result === "won")
      .map((game) => game.playTime);

    if (completionTimes.length > 1) {
      const mean =
        completionTimes.reduce((sum, time) => sum + time, 0) /
        completionTimes.length;
      const variance =
        completionTimes.reduce(
          (sum, time) => sum + Math.pow(time - mean, 2),
          0
        ) / completionTimes.length;
      this.statistics.performanceMetrics.consistency = Math.round(
        Math.sqrt(variance)
      );
    }

    // Calculate improvement trend (comparing recent vs older games)
    if (this.statistics.gameHistory.length >= 10) {
      const recentGames = this.statistics.gameHistory.slice(-5);
      const olderGames = this.statistics.gameHistory.slice(-10, -5);

      const recentAvgTime =
        recentGames.reduce((sum, game) => sum + game.playTime, 0) /
        recentGames.length;
      const olderAvgTime =
        olderGames.reduce((sum, game) => sum + game.playTime, 0) /
        olderGames.length;

      this.statistics.performanceMetrics.improvement =
        olderAvgTime > 0
          ? Math.round(((olderAvgTime - recentAvgTime) / olderAvgTime) * 100)
          : 0;
    }
  }

  getStatistics() {
    return { ...this.statistics };
  }

  /**
   * Gets dashboard-specific statistics with enhanced data
   * @returns {Object} - Dashboard statistics
   */
  getDashboardStatistics() {
    const stats = this.getStatistics();
    const achievements = this.getAchievements();

    // Calculate additional dashboard metrics
    const unlockedAchievements = Object.values(achievements).filter(
      (achievement) => achievement.unlocked
    ).length;
    const totalAchievements = Object.keys(achievements).length;

    return {
      ...stats,
      achievements: {
        ...stats.achievements,
        totalUnlocked: unlockedAchievements,
        totalAvailable: totalAchievements,
        unlockedPercentage:
          totalAchievements > 0
            ? Math.round((unlockedAchievements / totalAchievements) * 100)
            : 0,
      },
      // Add trend data for charts
      trends: this.getTrendData(),
      // Add performance insights
      insights: this.getPerformanceInsights(),
    };
  }

  /**
   * Gets trend data for charts
   * @returns {Object} - Trend data
   */
  getTrendData() {
    const dailyData = Object.entries(this.statistics.dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Last 30 days
      .map(([date, data]) => ({
        date,
        gamesPlayed: data.gamesPlayed,
        gamesWon: data.gamesWon,
        winRate:
          data.gamesPlayed > 0
            ? Math.round((data.gamesWon / data.gamesPlayed) * 100)
            : 0,
        averageTime: data.averageTime,
        totalScore: data.totalScore,
      }));

    const weeklyData = this.getWeeklyTrendData();
    const monthlyData = this.getMonthlyTrendData();

    return {
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
    };
  }

  /**
   * Gets weekly trend data
   * @returns {Array} - Weekly trend data
   */
  getWeeklyTrendData() {
    const weeklyStats = {};

    // Aggregate daily stats into weekly stats
    Object.entries(this.statistics.dailyStats).forEach(([date, data]) => {
      const weekKey = this.getWeekKey(new Date(date));
      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = {
          week: weekKey,
          gamesPlayed: 0,
          gamesWon: 0,
          totalTime: 0,
          totalScore: 0,
        };
      }
      weeklyStats[weekKey].gamesPlayed += data.gamesPlayed;
      weeklyStats[weekKey].gamesWon += data.gamesWon;
      weeklyStats[weekKey].totalTime += data.totalTime;
      weeklyStats[weekKey].totalScore += data.totalScore;
    });

    return Object.values(weeklyStats)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12) // Last 12 weeks
      .map((week) => ({
        ...week,
        winRate:
          week.gamesPlayed > 0
            ? Math.round((week.gamesWon / week.gamesPlayed) * 100)
            : 0,
        averageTime:
          week.gamesPlayed > 0
            ? Math.round(week.totalTime / week.gamesPlayed)
            : 0,
      }));
  }

  /**
   * Gets monthly trend data
   * @returns {Array} - Monthly trend data
   */
  getMonthlyTrendData() {
    const monthlyStats = {};

    // Aggregate daily stats into monthly stats
    Object.entries(this.statistics.dailyStats).forEach(([date, data]) => {
      const monthKey = date.substring(0, 7); // YYYY-MM
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          gamesPlayed: 0,
          gamesWon: 0,
          totalTime: 0,
          totalScore: 0,
        };
      }
      monthlyStats[monthKey].gamesPlayed += data.gamesPlayed;
      monthlyStats[monthKey].gamesWon += data.gamesWon;
      monthlyStats[monthKey].totalTime += data.totalTime;
      monthlyStats[monthKey].totalScore += data.totalScore;
    });

    return Object.values(monthlyStats)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
      .map((month) => ({
        ...month,
        winRate:
          month.gamesPlayed > 0
            ? Math.round((month.gamesWon / month.gamesPlayed) * 100)
            : 0,
        averageTime:
          month.gamesPlayed > 0
            ? Math.round(month.totalTime / month.gamesPlayed)
            : 0,
      }));
  }

  /**
   * Gets performance insights
   * @returns {Object} - Performance insights
   */
  getPerformanceInsights() {
    const insights = {
      strengths: [],
      improvements: [],
      recommendations: [],
    };

    // Analyze performance metrics
    if (this.statistics.performanceMetrics.accuracy > 80) {
      insights.strengths.push("High accuracy in letter guessing");
    } else if (this.statistics.performanceMetrics.accuracy < 60) {
      insights.improvements.push(
        "Consider being more strategic with letter choices"
      );
    }

    if (this.statistics.performanceMetrics.efficiency > 50) {
      insights.strengths.push("Efficient scoring rate");
    } else if (this.statistics.performanceMetrics.efficiency < 20) {
      insights.improvements.push(
        "Try to complete games faster for better scores"
      );
    }

    if (this.statistics.performanceMetrics.consistency < 10000) {
      insights.strengths.push("Consistent completion times");
    } else {
      insights.improvements.push("Work on maintaining consistent performance");
    }

    if (this.statistics.performanceMetrics.improvement > 10) {
      insights.strengths.push("Improving over time");
    } else if (this.statistics.performanceMetrics.improvement < -10) {
      insights.improvements.push("Performance has declined recently");
    }

    // Generate recommendations
    if (this.statistics.winPercentage < 50) {
      insights.recommendations.push(
        "Try playing on easier difficulty to build confidence"
      );
    }

    if (
      this.statistics.streaks.current === 0 &&
      this.statistics.gamesPlayed > 5
    ) {
      insights.recommendations.push(
        "Focus on consistency to build winning streaks"
      );
    }

    if (this.statistics.averagePlayTime > 60000) {
      insights.recommendations.push(
        "Try to make faster decisions to improve your time"
      );
    }

    return insights;
  }

  /**
   * Exports statistics to JSON format
   * @returns {string} - JSON string of statistics
   */
  exportStatistics() {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      statistics: this.getDashboardStatistics(),
      achievements: this.getAchievements(),
      gameHistory: this.statistics.gameHistory,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exports statistics to CSV format
   * @returns {string} - CSV string of game history
   */
  exportStatisticsCSV() {
    if (this.statistics.gameHistory.length === 0) {
      return "No game history available for export";
    }

    const headers = [
      "Date",
      "Result",
      "Difficulty",
      "Category",
      "Play Time (ms)",
      "Total Guesses",
      "Correct Guesses",
      "Incorrect Guesses",
      "Score",
      "Word",
    ];

    const csvRows = [
      headers.join(","),
      ...this.statistics.gameHistory.map((game) =>
        [
          new Date(game.timestamp).toLocaleDateString(),
          game.result,
          game.difficulty,
          game.category,
          game.playTime,
          game.totalGuesses,
          game.correctGuesses,
          game.incorrectGuesses,
          game.score,
          `"${game.word}"`,
        ].join(",")
      ),
    ];

    return csvRows.join("\n");
  }

  resetStatistics() {
    this.statistics = this.loadStatistics();
    this.statistics.gamesPlayed = 0;
    this.statistics.gamesWon = 0;
    this.statistics.gamesLost = 0;
    this.statistics.winPercentage = 0;
    this.statistics.totalGuesses = 0;
    this.statistics.averageGuessesPerGame = 0;
    this.statistics.fastestCompletionTime = null;
    this.statistics.longestStreak = 0;
    this.statistics.currentStreak = 0;
    this.statistics.bestStreak = 0;
    this.statistics.totalPlayTime = 0;
    this.statistics.averagePlayTime = 0;
    this.statistics.difficultyStats = {
      easy: { played: 0, won: 0, lost: 0 },
      medium: { played: 0, won: 0, lost: 0 },
      hard: { played: 0, won: 0, lost: 0 },
    };
    this.statistics.categoryStats = {};
    this.statistics.lastPlayed = null;
    this.saveStatistics();
  }
}

// Export for use in other files
window.HangmanGame = HangmanGame;
