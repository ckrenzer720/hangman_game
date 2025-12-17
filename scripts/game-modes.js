// ========================================
// HANGMAN GAME - GAME MODES MODULE
// ========================================
// This module handles timed mode, practice mode, and multiplayer mode

/**
 * Game Modes Mixin for HangmanGame
 * Extends HangmanGame with game mode functionality
 */
const GameModesMixin = {
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

  // calculateTimeBonus moved to game-scoring.js mixin

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
  // ========================================
  // PRACTICE MODE
  // ========================================

  enablePracticeMode(config = {}) {
    // Ensure practiceMode is initialized
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
      this.gameState.maxIncorrectGuesses =
        this.gameState.practiceMode.maxMistakesOverride;
    }
  }

  disablePracticeMode() {
    // Ensure practiceMode is initialized
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

  // ========================================
  // MULTIPLAYER MODE
  // ========================================

  enableMultiplayerMode(playerNames, totalRounds = null) {
    this.gameState.multiplayer.enabled = true;
    this.gameState.multiplayer.players = playerNames.map((name) => ({
      name: name.trim() || `Player ${playerNames.indexOf(name) + 1}`,
      score: 0,
      wins: 0,
    }));
    this.gameState.multiplayer.currentPlayerIndex = 0;
    this.gameState.multiplayer.roundsPlayed = 0;
    this.gameState.multiplayer.totalRounds = totalRounds;

    // Update UI to show multiplayer indicators
    if (window.ui && window.ui.showMultiplayerIndicator) {
      window.ui.showMultiplayerIndicator();
    }
  }

  disableMultiplayerMode() {
    this.gameState.multiplayer.enabled = false;
    this.gameState.multiplayer.players = [];
    this.gameState.multiplayer.currentPlayerIndex = 0;
    this.gameState.multiplayer.roundsPlayed = 0;

    // Hide multiplayer indicators
    if (window.ui && window.ui.hideMultiplayerIndicator) {
      window.ui.hideMultiplayerIndicator();
    }
  }

  getCurrentPlayer() {
    if (
      !this.gameState.multiplayer.enabled ||
      this.gameState.multiplayer.players.length === 0
    ) {
      return null;
    }
    return this.gameState.multiplayer.players[
      this.gameState.multiplayer.currentPlayerIndex
    ];
  }

  advanceToNextPlayer() {
    if (!this.gameState.multiplayer.enabled) return;

    this.gameState.multiplayer.roundsPlayed += 1;

    // Move to next player
    this.gameState.multiplayer.currentPlayerIndex =
      (this.gameState.multiplayer.currentPlayerIndex + 1) %
      this.gameState.multiplayer.players.length;

    // Reset game for next player
    this.resetGame();

    // Update UI
    if (window.ui && window.ui.updateMultiplayerIndicator) {
      window.ui.updateMultiplayerIndicator();
    }

    // Show feedback
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer && window.ui) {
      window.ui.showFeedback("info", `Now playing: ${currentPlayer.name}`);
    }
  }

  shouldEndMultiplayerGame() {
    // This method is kept for backwards compatibility but not used
    return this.shouldEndMultiplayerGameAfterAdvance();
  }

  shouldEndMultiplayerGameAfterAdvance() {
    if (!this.gameState.multiplayer.enabled) return false;

    // Calculate what the roundsPlayed will be after advancing
    const nextRoundsPlayed = this.gameState.multiplayer.roundsPlayed + 1;

    // If totalRounds is set, check if we've reached it
    if (this.gameState.multiplayer.totalRounds !== null) {
      const roundsCompleted = Math.floor(
        nextRoundsPlayed / this.gameState.multiplayer.players.length
      );
      return roundsCompleted >= this.gameState.multiplayer.totalRounds;
    }

    // For unlimited play, don't auto-end (users can end manually)
    return false;
  }

  endMultiplayerGame() {
    if (!this.gameState.multiplayer.enabled) return;

    // Determine winner(s)
    const players = [...this.gameState.multiplayer.players];
    players.sort((a, b) => {
      // Sort by score first, then by wins
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.wins - a.wins;
    });

    const winner = players[0];
    const winners = players.filter(
      (p) => p.score === winner.score && p.wins === winner.wins
    );

    // Show winner modal
    if (window.ui && window.ui.showMultiplayerWinner) {
      window.ui.showMultiplayerWinner(winners, players);
    }

    // Disable multiplayer mode
    this.disableMultiplayerMode();
  }

  getMultiplayerScores() {
    if (!this.gameState.multiplayer.enabled) {
      return [];
    }
    return [...this.gameState.multiplayer.players];
  }
};

// Export for use in other files
if (typeof window !== "undefined") {
  window.GameModesMixin = GameModesMixin;
}
