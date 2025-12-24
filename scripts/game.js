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
      // Multiplayer configuration
      multiplayer: {
        enabled: false,
        players: [], // Array of { name: string, score: number, wins: number }
        currentPlayerIndex: 0,
        roundsPlayed: 0,
        totalRounds: null, // null = play until all players have had equal turns
        passAndPlay: true,
      },
    };

    // Initialize error middleware (will be set by main.js)
    this.errorMiddleware = null;

    // Statistics tracking - safely call mixin method if available
    if (typeof this.loadStatistics === "function") {
      this.statistics = this.loadStatistics();
    } else if (typeof this.getDefaultStatistics === "function") {
      this.statistics = this.getDefaultStatistics();
    } else {
      // Fallback default statistics structure
      this.statistics = {
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
        gameHistory: [],
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {},
        performanceMetrics: {
          accuracy: 0,
          efficiency: 0,
          consistency: 0,
          improvement: 0,
        },
        streaks: {
          current: 0,
          best: 0,
          longestLossStreak: 0,
          currentLossStreak: 0,
        },
        achievements: { totalUnlocked: 0, recentlyUnlocked: [] },
      };
    }

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

    // Achievement system - safely call mixin method if available
    this.achievements =
      typeof this.loadAchievements === "function"
        ? this.loadAchievements()
        : {};

    this.wordLists = {};
    this.wordsLoaded = false;
    this.isOfflineMode = false;
    this.retryCount = 0;
    this.maxRetries = 3;

    // Gallows (beam, rope) are always visible - only body parts are drawn
    this.hangmanParts = [
      "head",
      "body",
      "left-arm",
      "right-arm",
      "left-leg",
      "right-leg",
    ];

    // Timer for timed mode
    this.timerInterval = null;

    // Load words - safely call mixin method if available
    if (typeof this.loadWords === "function") {
      this.loadWords();
    }

    this.applySettingsFromThemeManager();

    // Load practice progress - safely call mixin method if available
    if (typeof this.loadPracticeProgress === "function") {
      this.practiceProgress = this.loadPracticeProgress();
    } else {
      this.practiceProgress = { perCategory: {} };
    }
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
        if (window.logger)
          window.logger.debug(`Difficulty changed to: ${settings.difficulty}`);
      }
      if (settings.category && settings.category !== this.gameState.category) {
        this.gameState.category = settings.category;
        if (window.logger)
          window.logger.debug(`Category changed to: ${settings.category}`);
      }
    }
  }

  // Word management methods moved to game-word-manager.js mixin

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
      if (window.logger)
        window.logger.debug(`${type.toUpperCase()}: ${message}`);
    }
  }

  init() {
    // Safely call mixin methods if available
    if (typeof this.selectRandomWord === "function") {
      this.selectRandomWord();
    }
    if (typeof this.createHiddenWord === "function") {
      this.createHiddenWord();
    }
    this.updateDisplay();

    // Start game timer if method is available
    if (typeof this.startGameTimer === "function") {
      this.startGameTimer();
    } else {
      // Fallback: manually set start time
      this.gameState.gameStartTime = Date.now();
    }

    // Start countdown timer if timed mode is enabled
    if (this.gameState.timedMode) {
      this.gameState.timeRemaining = this.gameState.timeLimit;
      if (typeof this.startCountdownTimer === "function") {
        this.startCountdownTimer();
      }
    }
  }

  // Word selection methods moved to game-word-manager.js mixin

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
      // Play audio feedback for correct guess
      if (this.audioManager) {
        const remaining =
          this.gameState.maxIncorrectGuesses -
          this.gameState.incorrectGuesses.length;
        this.audioManager.playCorrectGuess(letter, {
          remainingGuesses: remaining,
        });
      }
      this.checkWinCondition();
      return true;
    } else {
      this.gameState.incorrectGuesses.push(letter);
      this.drawHangmanPart();
      // Play audio feedback for incorrect guess
      if (this.audioManager) {
        const remaining =
          this.gameState.maxIncorrectGuesses -
          this.gameState.incorrectGuesses.length;
        this.audioManager.playIncorrectGuess(letter, {
          remainingGuesses: remaining,
        });
      }
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
      if (typeof this.stopCountdownTimer === "function") {
        this.stopCountdownTimer();
      }

      // Calculate score based on difficulty and performance
      const baseScore =
        typeof this.calculateScore === "function" ? this.calculateScore() : 0;
      this.gameState.score += baseScore;

      // Record best time in timed mode
      if (this.gameState.timedMode) {
        const timeUsed =
          this.gameState.timeLimit - this.gameState.timeRemaining;
        if (typeof this.recordBestTime === "function") {
          this.recordBestTime(timeUsed);
        }
      }

      // Update score display
      if (window.ui && window.ui.updateScoreDisplay) {
        window.ui.updateScoreDisplay();
      }

      // Update difficulty progression
      if (typeof this.updateDifficultyProgression === "function") {
        this.updateDifficultyProgression();
      }

      // Check for achievements
      if (typeof this.checkAchievements === "function") {
        this.checkAchievements();
      }

      // Add celebration effects
      this.triggerWinCelebration();

      if (typeof this.updateStatistics === "function") {
        this.updateStatistics("won");
      }

      // Announce win to screen readers and play audio
      if (this.accessibilityManager) {
        this.accessibilityManager.announceGameState("won", {
          word: this.gameState.currentWord,
        });
      }
      if (this.audioManager) {
        this.audioManager.playWin({ word: this.gameState.currentWord });
      }

      // Handle multiplayer scoring
      if (this.gameState.multiplayer.enabled) {
        const currentPlayer =
          this.gameState.multiplayer.players[
            this.gameState.multiplayer.currentPlayerIndex
          ];
        const roundScore =
          typeof this.calculateScore === "function" ? this.calculateScore() : 0;
        currentPlayer.score += roundScore;
        currentPlayer.wins += 1;

        // Check if multiplayer game should end after this round
        // We check BEFORE advancing to next player
        const willEndAfterThisRound =
          this.shouldEndMultiplayerGameAfterAdvance();

        this.showGameOverModal("You Won!", this.gameState.currentWord);

        // Auto-advance to next player in multiplayer mode, or end game
        setTimeout(() => {
          this.hideGameOverModal();
          if (willEndAfterThisRound) {
            this.endMultiplayerGame();
          } else {
            this.advanceToNextPlayer();
          }
        }, 2500);
        return;
      }

      this.showGameOverModal("You Won!", this.gameState.currentWord);

      // Auto-continue in practice endless mode
      if (
        this.gameState.practiceMode?.enabled &&
        this.gameState.practiceMode?.endless
      ) {
        setTimeout(() => {
          this.hideGameOverModal();
          this.resetGame();
        }, 1200);
      }

      // Check for challenge completion
      if (typeof this.checkChallengeCompletion === "function") {
        this.checkChallengeCompletion();
      }
    }
  }

  /**
   * Checks if current game completed any challenges
   */
  checkChallengeCompletion() {
    if (!window.challengeSystem) return;

    const gameResult = {
      won: this.gameState.gameStatus === "won",
      score:
        typeof this.calculateScore === "function" ? this.calculateScore() : 0,
      time: typeof this.endGameTimer === "function" ? this.endGameTimer() : 0,
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

      if (typeof this.updateStatistics === "function") {
        this.updateStatistics("lost");
      }

      // Announce loss to screen readers and play audio
      if (this.accessibilityManager) {
        this.accessibilityManager.announceGameState("lost", {
          word: this.gameState.currentWord,
        });
      }
      if (this.audioManager) {
        this.audioManager.playLose({ word: this.gameState.currentWord });
      }

      // Handle multiplayer - player lost this round
      if (this.gameState.multiplayer.enabled) {
        // Check if multiplayer game should end after this round
        const willEndAfterThisRound =
          this.shouldEndMultiplayerGameAfterAdvance();

        this.showGameOverModal("Game Over!", this.gameState.currentWord);

        // Auto-advance to next player in multiplayer mode, or end game
        setTimeout(() => {
          this.hideGameOverModal();
          if (willEndAfterThisRound) {
            this.endMultiplayerGame();
          } else {
            this.advanceToNextPlayer();
          }
        }, 2500);
        return;
      }

      this.showGameOverModal("Game Over!", this.gameState.currentWord);

      // Auto-continue in practice endless mode
      if (
        this.gameState.practiceMode?.enabled &&
        this.gameState.practiceMode?.endless
      ) {
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
    const resultElement = document.getElementById("game-result");
    const wordElement = document.getElementById("correct-word");

    if (resultElement && wordElement) {
      resultElement.textContent = result;
      resultElement.className = result === "You Won!" ? "win" : "lose";
      wordElement.textContent = `The word was: ${word.toUpperCase()}`;
    }

    if (window.modalManager) {
      window.modalManager.show("game-over-modal");
    } else {
      // Fallback
      const modal = document.getElementById("game-over-modal");
      if (modal) {
        modal.classList.add("show");
      }
    }
  }

  hideGameOverModal() {
    if (window.modalManager) {
      window.modalManager.hide("game-over-modal");
    } else {
      // Fallback
      const modal = document.getElementById("game-over-modal");
      if (modal) {
        modal.classList.remove("show");
      }
    }
  }

  resetGame() {
    // Stop countdown timer
    if (typeof this.stopCountdownTimer === "function") {
      this.stopCountdownTimer();
    }

    // Preserve nested objects before reset - ensure they're always properly initialized
    const existingPracticeMode = this.gameState?.practiceMode;
    const practiceMode = {
      enabled: existingPracticeMode?.enabled ?? false,
      allowRepeats: existingPracticeMode?.allowRepeats ?? true,
      endless: existingPracticeMode?.endless ?? true,
      lockedDifficulty: existingPracticeMode?.lockedDifficulty ?? null,
      maxMistakesOverride: existingPracticeMode?.maxMistakesOverride ?? null,
      wordLengthFilter: existingPracticeMode?.wordLengthFilter ?? null,
      hintsUsed: existingPracticeMode?.hintsUsed ?? 0,
      scorePenaltyMultiplier: existingPracticeMode?.scorePenaltyMultiplier ?? 1,
      seenWordsByKey: existingPracticeMode?.seenWordsByKey
        ? { ...existingPracticeMode.seenWordsByKey }
        : {},
    };

    const existingMultiplayer = this.gameState?.multiplayer;
    const multiplayer = {
      enabled: existingMultiplayer?.enabled ?? false,
      players: existingMultiplayer?.players
        ? [...existingMultiplayer.players]
        : [],
      currentPlayerIndex: existingMultiplayer?.currentPlayerIndex ?? 0,
      roundsPlayed: existingMultiplayer?.roundsPlayed ?? 0,
      totalRounds: existingMultiplayer?.totalRounds ?? null,
      passAndPlay: existingMultiplayer?.passAndPlay ?? true,
    };

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
      // Preserve practice mode and multiplayer settings
      practiceMode: practiceMode,
      multiplayer: multiplayer,
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
      const isGuessed = this.gameState.guessedLetters.includes(letter);
      key.disabled = isGuessed;

      // Optimize tab order: remove disabled keys from tab sequence
      if (isGuessed) {
        key.setAttribute("tabindex", "-1");
        key.setAttribute("aria-disabled", "true");
      } else {
        key.setAttribute("tabindex", "0");
        key.setAttribute("aria-disabled", "false");
      }

      // Remove previous state classes
      key.classList.remove("correct", "incorrect");

      if (isGuessed) {
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

      // Play audio feedback for hint
      if (this.audioManager) {
        this.audioManager.playHint();
      }

      // Practice mode: apply hint penalty
      if (this.gameState.practiceMode?.enabled) {
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

      // Save progress when pausing
      if (this.progressManager) {
        this.progressManager.saveProgress(this.gameState, this);
      }

      // Announce pause
      if (this.audioManager) {
        this.audioManager.announceGameState("paused");
      }

      return true;
    }
    return false;
  }

  resumeGame() {
    if (this.gameState.gameStatus === "paused" && this.gameState.isPaused) {
      this.gameState.isPaused = false;
      this.gameState.gameStatus = "playing";

      // Announce resume
      if (this.audioManager) {
        this.audioManager.announceGameState("resumed");
      }

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
    if (
      !this.difficultyProgression.enabled ||
      this.gameState.practiceMode?.enabled
    )
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
  // Scoring methods moved to game-scoring.js mixin

  // ========================================
  // ACHIEVEMENT SYSTEM
  // ========================================
  // Achievement methods moved to game-achievements.js mixin

  // ========================================
  // STATISTICS MANAGEMENT
  // ========================================
  // Statistics methods moved to game-statistics.js mixin

  // Statistics and game modes methods moved to separate modules:
  // - Statistics: game-statistics.js
  // - Game Modes: game-modes.js
}

// Apply mixins to extend HangmanGame functionality
if (typeof window !== "undefined") {
  // Apply word manager mixin
  if (window.WordManagerMixin) {
    Object.assign(HangmanGame.prototype, WordManagerMixin);
  }

  // Apply scoring mixin
  if (window.ScoringMixin) {
    Object.assign(HangmanGame.prototype, ScoringMixin);
  }

  // Apply achievement mixin
  if (window.AchievementMixin) {
    Object.assign(HangmanGame.prototype, AchievementMixin);
  }

  // Apply statistics mixin
  if (window.StatisticsMixin) {
    Object.assign(HangmanGame.prototype, StatisticsMixin);
  }

  // Apply game modes mixin
  if (window.GameModesMixin) {
    Object.assign(HangmanGame.prototype, GameModesMixin);
  }
}

// Export for use in other files
window.HangmanGame = HangmanGame;
