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

    this.loadWords();
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

    const randomIndex = Math.floor(Math.random() * categoryWords.length);
    this.gameState.currentWord = categoryWords[randomIndex].toLowerCase();
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

      // Calculate score based on difficulty and performance
      const baseScore = this.calculateScore();
      this.gameState.score += baseScore;

      // Update difficulty progression
      this.updateDifficultyProgression();

      // Check for achievements
      this.checkAchievements();

      this.updateStatistics("won");
      this.showGameOverModal("You Won!", this.gameState.currentWord);
    }
  }

  checkLoseCondition() {
    if (
      this.gameState.incorrectGuesses.length >=
      this.gameState.maxIncorrectGuesses
    ) {
      this.gameState.gameStatus = "lost";
      this.updateStatistics("lost");
      this.showGameOverModal("Game Over!", this.gameState.currentWord);
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
    if (!this.difficultyProgression.enabled) return;

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

    // Time bonus (faster completion = more points)
    const playTime = this.endGameTimer();
    const timeBonus = Math.max(0, Math.floor((30000 - playTime) / 1000) * 2); // 2 points per second under 30 seconds

    const totalScore =
      (baseScore + efficiencyBonus + timeBonus) * difficultyMultiplier;
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
        easy: { played: 0, won: 0, lost: 0 },
        medium: { played: 0, won: 0, lost: 0 },
        hard: { played: 0, won: 0, lost: 0 },
      },
      categoryStats: {},
      lastPlayed: null,
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

  updateStatistics(gameResult) {
    const playTime = this.endGameTimer();
    const totalGuesses = this.gameState.guessedLetters.length;

    // Update basic counts
    this.statistics.gamesPlayed++;
    if (gameResult === "won") {
      this.statistics.gamesWon++;
      this.statistics.currentStreak++;
      this.statistics.bestStreak = Math.max(
        this.statistics.bestStreak,
        this.statistics.currentStreak
      );
    } else if (gameResult === "lost") {
      this.statistics.gamesLost++;
      this.statistics.currentStreak = 0;
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
    if (gameResult === "won") {
      this.statistics.difficultyStats[difficulty].won++;
    } else if (gameResult === "lost") {
      this.statistics.difficultyStats[difficulty].lost++;
    }

    // Update category statistics
    const category = this.gameState.category;
    if (!this.statistics.categoryStats[category]) {
      this.statistics.categoryStats[category] = { played: 0, won: 0, lost: 0 };
    }
    this.statistics.categoryStats[category].played++;
    if (gameResult === "won") {
      this.statistics.categoryStats[category].won++;
    } else if (gameResult === "lost") {
      this.statistics.categoryStats[category].lost++;
    }

    // Update last played
    this.statistics.lastPlayed = new Date().toISOString();

    // Save to localStorage
    this.saveStatistics();
  }

  getStatistics() {
    return { ...this.statistics };
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
