// ========================================
// UI EVENT HANDLERS
// ========================================

class GameUI {
  constructor(game) {
    this.game = game;
    this.init();
  }

  init() {
    this.createVirtualKeyboard();
    this.bindEvents();
    this.initializeProgressIndicators();
    this.setupSettingsListeners();
  }

  createVirtualKeyboard() {
    const keyboard = document.getElementById("keyboard");
    if (!keyboard) return;

    // Define keyboard layout as shown in the image
    const keyboardLayout = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY", "Z"];

    keyboard.innerHTML = "";

    keyboardLayout.forEach((row) => {
      const rowElement = document.createElement("div");
      rowElement.className = "keyboard-row";

      row.split("").forEach((letter) => {
        const key = document.createElement("button");
        key.className = "keyboard-key";
        key.textContent = letter;
        key.setAttribute("data-letter", letter.toLowerCase());
        rowElement.appendChild(key);
      });

      keyboard.appendChild(rowElement);
    });
  }

  bindEvents() {
    // New Game Button
    const newGameBtn = document.getElementById("new-game");
    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => this.startNewGame());
    }

    // Hint Button
    const hintBtn = document.getElementById("hint");
    if (hintBtn) {
      hintBtn.addEventListener("click", () => this.game.getHint());
    }

    // Help Button
    const helpBtn = document.getElementById("help");
    if (helpBtn) {
      helpBtn.addEventListener("click", () => this.showHelp());
    }

    // Challenge Button
    const challengeBtn = document.getElementById("challenge");
    if (challengeBtn) {
      challengeBtn.addEventListener("click", () => this.showChallenge());
    }

    // Pause/Resume Button
    const pauseResumeBtn = document.getElementById("pause-resume");
    if (pauseResumeBtn) {
      pauseResumeBtn.addEventListener("click", () => this.togglePause());
    }

    // Quit Button
    const quitBtn = document.getElementById("quit");
    if (quitBtn) {
      quitBtn.addEventListener("click", () => this.quitGame());
    }

    // Play Again Button (in modal)
    const playAgainBtn = document.getElementById("play-again");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => this.startNewGame());
    }

    // Resume Button (in pause overlay)
    const resumeBtn = document.getElementById("resume-game");
    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => this.resumeGame());
    }

    // Statistics Button
    const statisticsBtn = document.getElementById("statistics");
    if (statisticsBtn) {
      statisticsBtn.addEventListener("click", () => this.showStatistics());
    }

    // Close Statistics Buttons
    const closeStatsBtn = document.getElementById("close-statistics");
    if (closeStatsBtn) {
      closeStatsBtn.addEventListener("click", () => this.hideStatistics());
    }

    const closeStatsBtn2 = document.getElementById("close-statistics-2");
    if (closeStatsBtn2) {
      closeStatsBtn2.addEventListener("click", () => this.hideStatistics());
    }

    // Reset Statistics Button
    const resetStatsBtn = document.getElementById("reset-statistics");
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener("click", () => this.resetStatistics());
    }

    // Achievements Button
    const achievementsBtn = document.getElementById("achievements");
    if (achievementsBtn) {
      achievementsBtn.addEventListener("click", () => this.showAchievements());
    }

    // Close Achievements Button
    const closeAchievementsBtn = document.getElementById("close-achievements");
    if (closeAchievementsBtn) {
      closeAchievementsBtn.addEventListener("click", () =>
        this.hideAchievements()
      );
    }

    // Settings Button
    const settingsBtn = document.getElementById("settings");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => this.showSettings());
    }

    // Close Settings Button
    const closeSettingsBtn = document.getElementById("close-settings");
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener("click", () => this.hideSettings());
    }

    // Reset Settings Button
    const resetSettingsBtn = document.getElementById("reset-settings");
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener("click", () => this.resetSettings());
    }

    // Help Button handlers
    const closeHelpBtn = document.getElementById("close-help");
    if (closeHelpBtn) {
      closeHelpBtn.addEventListener("click", () => this.hideHelp());
    }

    // Challenge Button handlers
    const closeChallengeBtn = document.getElementById("close-challenge");
    if (closeChallengeBtn) {
      closeChallengeBtn.addEventListener("click", () => this.hideChallenge());
    }

    // Virtual Keyboard
    const keyboard = document.getElementById("keyboard");
    if (keyboard) {
      keyboard.addEventListener("click", (e) => {
        if (e.target.classList.contains("keyboard-key")) {
          this.handleLetterClick(e.target);
        }
      });
    }

    // Physical Keyboard
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));

    // Modal close on background click
    const modal = document.getElementById("game-over-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.game.hideGameOverModal();
        }
      });
    }

    // Statistics modal close on background click
    const statsModal = document.getElementById("statistics-modal");
    if (statsModal) {
      statsModal.addEventListener("click", (e) => {
        if (e.target === statsModal) {
          this.hideStatistics();
        }
      });
    }

    // Settings modal close on background click
    const settingsModal = document.getElementById("settings-modal");
    if (settingsModal) {
      settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) {
          this.hideSettings();
        }
      });
    }

    // Help modal close on background click
    const helpModal = document.getElementById("help-modal");
    if (helpModal) {
      helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) {
          this.hideHelp();
        }
      });
    }
  }

  handleLetterClick(keyElement) {
    if (keyElement.disabled) return;

    const letter = keyElement.getAttribute("data-letter");

    // Use enhanced input validation even for virtual keyboard clicks
    const validation = GameUtils.validateHangmanInput(letter);

    if (validation.isValid) {
      this.makeGuess(validation.sanitizedInput);
    } else {
      // This shouldn't happen with virtual keyboard, but handle gracefully
      this.showFeedback("error", "Invalid input detected");
    }
  }

  handleKeyPress(event) {
    const key = event.key;

    // Handle pause/resume with space key (works in any game state except won/lost)
    if (
      key === " " &&
      this.game.gameState.gameStatus !== "won" &&
      this.game.gameState.gameStatus !== "lost"
    ) {
      event.preventDefault();
      this.togglePause();
      return;
    }

    // Only handle other keys if game is playing and not paused
    if (
      this.game.gameState.gameStatus !== "playing" ||
      this.game.gameState.isPaused
    )
      return;

    // Use enhanced input validation for letter keys
    if (key.length === 1) {
      const validation = GameUtils.validateHangmanInput(key);

      if (validation.isValid) {
        event.preventDefault();
        this.makeGuess(validation.sanitizedInput);
      } else {
        // Show error feedback for invalid input
        this.showFeedback("error", validation.errorMessage);
        event.preventDefault();
      }
    }

    // Handle special keys
    if (key === "Enter") {
      event.preventDefault();
      this.startNewGame();
    }

    if (key.toLowerCase() === "h") {
      event.preventDefault();
      this.game.getHint();
    }
  }

  makeGuess(letter) {
    const success = this.game.makeGuess(letter);

    // Add immediate visual feedback to the keyboard key
    const keyElement = document.querySelector(`[data-letter="${letter}"]`);
    if (keyElement) {
      // Add key press animation
      this.addKeyPressAnimation(keyElement);

      if (success) {
        keyElement.classList.add("correct");
        this.addPulseAnimation(keyElement);
      } else if (this.game.gameState.guessedLetters.includes(letter)) {
        // Already guessed - no visual change needed
      } else {
        keyElement.classList.add("incorrect");
        this.addShakeAnimation(keyElement);
      }
    }

    if (success) {
      this.showFeedback(
        "success",
        `Great! "${letter.toUpperCase()}" is in the word!`
      );
    } else if (this.game.gameState.guessedLetters.includes(letter)) {
      this.showFeedback(
        "warning",
        `You already guessed "${letter.toUpperCase()}"!`
      );
    } else {
      this.showFeedback(
        "error",
        `Sorry, "${letter.toUpperCase()}" is not in the word.`
      );
    }

    this.game.updateDisplay();
    this.updateGameStatus();
    this.updateAllProgressIndicators();
  }

  startNewGame() {
    this.game.hideGameOverModal();

    // Hide pause overlay if it's showing
    const pauseOverlay = document.getElementById("pause-overlay");
    if (pauseOverlay) {
      pauseOverlay.classList.remove("show");
    }

    // Reset pause button text
    const pauseResumeBtn = document.getElementById("pause-resume");
    if (pauseResumeBtn) {
      pauseResumeBtn.textContent = "Pause";
    }

    this.game.resetGame();
    this.updateGameStatus();
    this.updateAllProgressIndicators();
    this.showFeedback("success", "New game started! Good luck!");
  }

  togglePause() {
    if (
      this.game.gameState.gameStatus === "won" ||
      this.game.gameState.gameStatus === "lost"
    ) {
      return; // Can't pause when game is over
    }

    const wasPaused = this.game.gameState.isPaused;
    const success = this.game.togglePause();

    if (success) {
      if (wasPaused) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    }
  }

  pauseGame() {
    const pauseOverlay = document.getElementById("pause-overlay");
    const pauseResumeBtn = document.getElementById("pause-resume");

    if (pauseOverlay) {
      pauseOverlay.classList.add("show");
    }

    if (pauseResumeBtn) {
      pauseResumeBtn.textContent = "Resume";
    }

    // Disable keyboard input
    this.disableKeyboardInput();
    this.updateGameStatus();
    this.showFeedback(
      "warning",
      "Game paused. Press Space or click Resume to continue."
    );
  }

  resumeGame() {
    const pauseOverlay = document.getElementById("pause-overlay");
    const pauseResumeBtn = document.getElementById("pause-resume");

    if (pauseOverlay) {
      pauseOverlay.classList.remove("show");
    }

    if (pauseResumeBtn) {
      pauseResumeBtn.textContent = "Pause";
    }

    // Re-enable keyboard input
    this.enableKeyboardInput();
    this.updateGameStatus();
    this.showFeedback("success", "Game resumed!");
  }

  disableKeyboardInput() {
    const keyboardKeys = document.querySelectorAll(".keyboard-key");
    keyboardKeys.forEach((key) => {
      key.disabled = true;
    });
  }

  enableKeyboardInput() {
    const keyboardKeys = document.querySelectorAll(".keyboard-key");
    keyboardKeys.forEach((key) => {
      const letter = key.textContent.toLowerCase();
      key.disabled = this.game.gameState.guessedLetters.includes(letter);
    });
  }

  quitGame() {
    if (confirm("Are you sure you want to quit? Your progress will be lost.")) {
      this.game.gameState.gameStatus = "quit";
      this.showFeedback(
        "warning",
        'Game quit. Click "New Game" to start again.'
      );
    }
  }

  updateGameStatus() {
    const status = this.game.gameState.gameStatus;
    const isPaused = this.game.gameState.isPaused;
    const incorrectCount = this.game.gameState.incorrectGuesses.length;
    const maxIncorrect = this.game.gameState.maxIncorrectGuesses;

    // Update any status indicators if they exist
    const statusElement = document.getElementById("game-status");
    if (statusElement) {
      if (isPaused) {
        statusElement.textContent = "Game Paused - Press Space to resume";
      } else {
        switch (status) {
          case "playing":
            statusElement.textContent = `Guesses left: ${
              maxIncorrect - incorrectCount
            }`;
            break;
          case "won":
            statusElement.textContent = "Congratulations! You won!";
            break;
          case "lost":
            statusElement.textContent = "Game Over! Better luck next time.";
            break;
          case "quit":
            statusElement.textContent =
              "Game quit. Start a new game to continue.";
            break;
        }
      }
    }
  }

  showFeedback(type, message) {
    try {
      // Create or update feedback element
      let feedbackElement = document.getElementById("game-feedback");
      if (!feedbackElement) {
        feedbackElement = document.createElement("div");
        feedbackElement.id = "game-feedback";
        feedbackElement.className = "toast";
        document.body.appendChild(feedbackElement);
      }

      feedbackElement.textContent = message;
      feedbackElement.className = `toast ${type} show`;

      // Special styling for different message types
      this.applyFeedbackStyling(feedbackElement, type);

      // Auto-hide after appropriate delay
      const hideDelay = this.getFeedbackHideDelay(type);
      setTimeout(() => {
        if (feedbackElement && feedbackElement.classList) {
          feedbackElement.classList.remove("show");
        }
      }, hideDelay);
    } catch (error) {
      // Fallback to console if DOM manipulation fails
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Applies styling based on feedback type
   * @param {HTMLElement} element - Feedback element
   * @param {string} type - Feedback type
   */
  applyFeedbackStyling(element, type) {
    const styles = {
      achievement: {
        background: "linear-gradient(45deg, #ffd700, #ffed4e)",
        color: "#000",
        fontWeight: "bold",
        animation: "achievementPulse 0.6s ease-in-out",
      },
      error: {
        background: "linear-gradient(45deg, #ff6b6b, #ff8e8e)",
        color: "#fff",
        fontWeight: "bold",
      },
      warning: {
        background: "linear-gradient(45deg, #ffa726, #ffb74d)",
        color: "#fff",
        fontWeight: "bold",
      },
      info: {
        background: "linear-gradient(45deg, #42a5f5, #64b5f6)",
        color: "#fff",
        fontWeight: "bold",
      },
      success: {
        background: "linear-gradient(45deg, #66bb6a, #81c784)",
        color: "#fff",
        fontWeight: "bold",
      },
    };

    const style = styles[type];
    if (style) {
      Object.assign(element.style, style);
    }
  }

  /**
   * Gets hide delay based on feedback type
   * @param {string} type - Feedback type
   * @returns {number} - Hide delay in milliseconds
   */
  getFeedbackHideDelay(type) {
    const delays = {
      achievement: 5000,
      error: 4000,
      warning: 3500,
      info: 3000,
      success: 3000,
    };
    return delays[type] || 3000;
  }

  // Animation helpers
  addPulseAnimation(element) {
    if (element) {
      element.classList.add("pulse");
      setTimeout(() => {
        element.classList.remove("pulse");
      }, 500);
    }
  }

  addShakeAnimation(element) {
    if (element) {
      element.classList.add("shake");
      setTimeout(() => {
        element.classList.remove("shake");
      }, 500);
    }
  }

  addKeyPressAnimation(element) {
    if (element) {
      element.classList.add("press-animation");
      setTimeout(() => {
        element.classList.remove("press-animation");
      }, 150);
    }
  }

  addLetterRevealAnimation(element) {
    if (element) {
      element.classList.add("letter-reveal");
      element.style.animation = "letterReveal 0.6s ease-out";
      setTimeout(() => {
        element.classList.remove("letter-reveal");
        element.style.animation = "";
      }, 600);
    }
  }

  addCelebrationAnimation(element) {
    if (element) {
      element.classList.add("celebration-bounce");
      setTimeout(() => {
        element.classList.remove("celebration-bounce");
      }, 600);
    }
  }

  addFailureAnimation(element) {
    if (element) {
      element.classList.add("failure-shake");
      setTimeout(() => {
        element.classList.remove("failure-shake");
      }, 500);
    }
  }

  createConfetti() {
    const container = document.querySelector(".game-container");
    if (!container) return;

    // Create confetti particles
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.top = "50%";
      confetti.style.animationDelay = Math.random() * 0.5 + "s";
      container.appendChild(confetti);

      // Remove confetti after animation
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 3000);
    }
  }

  // ========================================
  // PROGRESS INDICATORS
  // ========================================

  initializeProgressIndicators() {
    this.updateDifficultyIndicator();
    this.updateStreakIndicator();
    this.updateScoreDisplay();
    this.updateGameProgress();
  }

  updateGameProgress() {
    const progressFill = document.getElementById("game-progress-fill");
    const progressText = document.getElementById("game-progress-text");

    if (!progressFill || !progressText) return;

    const currentWord = this.game.gameState.currentWord;
    const hiddenWord = this.game.gameState.hiddenWord;

    if (!currentWord) {
      progressFill.style.width = "0%";
      progressText.textContent = "0%";
      return;
    }

    // Calculate progress based on revealed letters
    const totalLetters = currentWord.replace(/\s/g, "").length;
    const revealedLetters = hiddenWord
      .replace(/\s/g, "")
      .replace(/_/g, "").length;
    const progressPercentage = Math.round(
      (revealedLetters / totalLetters) * 100
    );

    // Update progress bar with animation
    progressFill.style.setProperty(
      "--progress-width",
      progressPercentage + "%"
    );
    progressFill.classList.add("animate");
    progressText.textContent = progressPercentage + "%";

    // Remove animation class after animation completes
    setTimeout(() => {
      progressFill.classList.remove("animate");
    }, 800);
  }

  updateDifficultyIndicator() {
    const difficultyIndicator = document.getElementById("difficulty-indicator");
    if (!difficultyIndicator) return;

    const difficulty = this.game.gameState.difficulty;
    const difficultyNames = {
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
    };

    difficultyIndicator.textContent = difficultyNames[difficulty] || "Medium";
    difficultyIndicator.className = `stat-value difficulty-indicator ${difficulty}`;

    // Add animation for difficulty changes
    this.addValueChangeAnimation(difficultyIndicator);
  }

  updateStreakIndicator() {
    const streakIndicator = document.getElementById("streak-indicator");
    if (!streakIndicator) return;

    const stats = this.game.getStatistics();
    const currentStreak = stats.currentStreak || 0;

    streakIndicator.textContent = currentStreak.toString();

    // Add animation for streak changes
    this.addValueChangeAnimation(streakIndicator);
  }

  updateScoreDisplay() {
    const scoreDisplay = document.getElementById("score-display");
    if (!scoreDisplay) return;

    const currentScore = this.game.gameState.score || 0;
    scoreDisplay.textContent = currentScore.toString();

    // Add animation for score changes
    this.addValueChangeAnimation(scoreDisplay);
  }

  addValueChangeAnimation(element) {
    if (!element) return;

    element.classList.add("animate");
    setTimeout(() => {
      element.classList.remove("animate");
    }, 300);
  }

  // Method to update all progress indicators
  updateAllProgressIndicators() {
    this.updateGameProgress();
    this.updateDifficultyIndicator();
    this.updateStreakIndicator();
    this.updateScoreDisplay();
  }

  // ========================================
  // STATISTICS MANAGEMENT
  // ========================================

  showStatistics() {
    const modal = document.getElementById("statistics-modal");
    if (modal) {
      this.populateStatisticsDashboard();
      modal.classList.add("show");
    }
  }

  hideStatistics() {
    const modal = document.getElementById("statistics-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  }

  populateStatisticsDashboard() {
    const content = document.getElementById("statistics-content");
    if (!content) return;

    try {
      const stats = this.game.getDashboardStatistics();
      this.renderStatisticsDashboard(content, stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
      this.renderStatisticsError(content, error);
    }
  }

  /**
   * Renders comprehensive statistics dashboard
   * @param {HTMLElement} content - Content container
   * @param {Object} stats - Dashboard statistics data
   */
  renderStatisticsDashboard(content, stats) {
    content.innerHTML = `
      <div class="dashboard-container">
        <!-- Header with key metrics -->
        <div class="dashboard-header">
          <h2>📊 Statistics Dashboard</h2>
          <div class="key-metrics">
            <div class="metric-card">
              <div class="metric-icon">🎮</div>
              <div class="metric-content">
                <div class="metric-value">${stats.gamesPlayed}</div>
                <div class="metric-label">Games Played</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">🏆</div>
              <div class="metric-content">
                <div class="metric-value">${stats.winPercentage}%</div>
                <div class="metric-label">Win Rate</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">🔥</div>
              <div class="metric-content">
                <div class="metric-value">${stats.streaks.current}</div>
                <div class="metric-label">Current Streak</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">⭐</div>
              <div class="metric-content">
                <div class="metric-value">${this.game.gameState.score}</div>
                <div class="metric-label">Total Score</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Charts Section -->
        <div class="dashboard-section">
          <h3>📈 Performance Trends</h3>
          <div class="charts-container">
            <div class="chart-card">
              <h4>Win Rate Over Time</h4>
              <div class="chart-placeholder" id="win-rate-chart">
                ${this.renderWinRateChart(stats.trends.daily)}
              </div>
            </div>
            <div class="chart-card">
              <h4>Games Played Daily</h4>
              <div class="chart-placeholder" id="games-daily-chart">
                ${this.renderGamesDailyChart(stats.trends.daily)}
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Statistics Grid -->
        <div class="dashboard-section">
          <h3>📋 Detailed Statistics</h3>
          <div class="stats-grid">
            <div class="stat-group">
              <h4>Game Performance</h4>
              <div class="stat-item">
                <span class="stat-label">Games Won</span>
                <span class="stat-value">${stats.gamesWon}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Games Lost</span>
                <span class="stat-value">${stats.gamesLost}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Best Streak</span>
                <span class="stat-value">${stats.streaks.best}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Longest Loss Streak</span>
                <span class="stat-value">${
                  stats.streaks.longestLossStreak
                }</span>
              </div>
            </div>

            <div class="stat-group">
              <h4>Time Performance</h4>
              <div class="stat-item">
                <span class="stat-label">Fastest Time</span>
                <span class="stat-value">${this.formatTime(
                  stats.fastestCompletionTime
                )}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Average Time</span>
                <span class="stat-value">${this.formatTime(
                  stats.averagePlayTime
                )}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Time</span>
                <span class="stat-value">${this.formatTime(
                  stats.totalPlayTime
                )}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Last Played</span>
                <span class="stat-value">${this.formatDate(
                  stats.lastPlayed
                )}</span>
              </div>
            </div>

            <div class="stat-group">
              <h4>Accuracy & Efficiency</h4>
              <div class="stat-item">
                <span class="stat-label">Guess Accuracy</span>
                <span class="stat-value">${
                  stats.performanceMetrics.accuracy
                }%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Score Efficiency</span>
                <span class="stat-value">${
                  stats.performanceMetrics.efficiency
                }/min</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Consistency</span>
                <span class="stat-value">${this.formatConsistency(
                  stats.performanceMetrics.consistency
                )}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Improvement</span>
                <span class="stat-value">${this.formatImprovement(
                  stats.performanceMetrics.improvement
                )}</span>
              </div>
            </div>

            <div class="stat-group">
              <h4>Achievements</h4>
              <div class="stat-item">
                <span class="stat-label">Unlocked</span>
                <span class="stat-value">${stats.achievements.totalUnlocked}/${
      stats.achievements.totalAvailable
    }</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Progress</span>
                <span class="stat-value">${
                  stats.achievements.unlockedPercentage
                }%</span>
              </div>
              <div class="achievement-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${
                    stats.achievements.unlockedPercentage
                  }%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Difficulty & Category Breakdown -->
        <div class="dashboard-section">
          <h3>🎯 Performance by Difficulty & Category</h3>
          <div class="breakdown-grid">
            <div class="breakdown-card">
              <h4>Difficulty Performance</h4>
              ${this.renderDifficultyBreakdown(stats.difficultyStats)}
            </div>
            <div class="breakdown-card">
              <h4>Category Performance</h4>
              ${this.renderCategoryBreakdown(stats.categoryStats)}
            </div>
          </div>
        </div>

        <!-- Performance Insights -->
        <div class="dashboard-section">
          <h3>💡 Performance Insights</h3>
          <div class="insights-container">
            ${this.renderPerformanceInsights(stats.insights)}
          </div>
        </div>

        <!-- Export Section -->
        <div class="dashboard-section">
          <h3>📤 Export Data</h3>
          <div class="export-container">
            <button class="btn btn-secondary" onclick="ui.exportStatistics('json')">
              📄 Export as JSON
            </button>
            <button class="btn btn-secondary" onclick="ui.exportStatistics('csv')">
              📊 Export as CSV
            </button>
            <button class="btn btn-secondary" onclick="ui.printStatistics()">
              🖨️ Print Statistics
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renders statistics error message
   * @param {HTMLElement} content - Content container
   * @param {Error} error - Error that occurred
   */
  renderStatisticsError(content, error) {
    const userMessage = ErrorMessageFactory.createUserFriendlyMessage(
      error,
      "data_corrupted"
    );

    content.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <h3 style="color: #ff6b6b; margin-bottom: 15px;">Unable to Load Statistics</h3>
        <p style="margin-bottom: 20px;">${userMessage}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #999;">
            Your statistics may have been corrupted or are temporarily unavailable.
          </p>
        </div>
        <button onclick="location.reload()" 
                style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }

  formatTime(milliseconds) {
    if (!milliseconds || milliseconds === 0) return "--:--";

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  resetStatistics() {
    if (
      confirm(
        "Are you sure you want to reset all statistics? This action cannot be undone."
      )
    ) {
      this.game.resetStatistics();
      this.game.resetAchievements();
      this.populateStatisticsDashboard();
      this.showFeedback("success", "Statistics have been reset!");
    }
  }

  /**
   * Exports statistics in specified format
   * @param {string} format - Export format ('json' or 'csv')
   */
  exportStatistics(format) {
    try {
      let data, filename, mimeType;

      if (format === "json") {
        data = this.game.exportStatistics();
        filename = `hangman-statistics-${
          new Date().toISOString().split("T")[0]
        }.json`;
        mimeType = "application/json";
      } else if (format === "csv") {
        data = this.game.exportStatisticsCSV();
        filename = `hangman-game-history-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        mimeType = "text/csv";
      } else {
        this.showFeedback("error", "Invalid export format");
        return;
      }

      // Create and download file
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showFeedback(
        "success",
        `Statistics exported as ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error("Error exporting statistics:", error);
      this.showFeedback("error", "Failed to export statistics");
    }
  }

  /**
   * Prints statistics
   */
  printStatistics() {
    try {
      const stats = this.game.getDashboardStatistics();
      const printWindow = window.open("", "_blank");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Hangman Game Statistics</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .stat-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .chart-placeholder { background: #f5f5f5; padding: 20px; text-align: center; margin: 10px 0; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Hangman Game Statistics</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h2>Key Metrics</h2>
            <div class="stat-grid">
              <div class="stat-item">
                <span>Games Played:</span>
                <span>${stats.gamesPlayed}</span>
              </div>
              <div class="stat-item">
                <span>Win Rate:</span>
                <span>${stats.winPercentage}%</span>
              </div>
              <div class="stat-item">
                <span>Current Streak:</span>
                <span>${stats.streaks.current}</span>
              </div>
              <div class="stat-item">
                <span>Best Streak:</span>
                <span>${stats.streaks.best}</span>
              </div>
              <div class="stat-item">
                <span>Total Score:</span>
                <span>${this.game.gameState.score}</span>
              </div>
              <div class="stat-item">
                <span>Fastest Time:</span>
                <span>${this.formatTime(stats.fastestCompletionTime)}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Performance Metrics</h2>
            <div class="stat-grid">
              <div class="stat-item">
                <span>Guess Accuracy:</span>
                <span>${stats.performanceMetrics.accuracy}%</span>
              </div>
              <div class="stat-item">
                <span>Score Efficiency:</span>
                <span>${stats.performanceMetrics.efficiency}/min</span>
              </div>
              <div class="stat-item">
                <span>Consistency:</span>
                <span>${this.formatConsistency(
                  stats.performanceMetrics.consistency
                )}</span>
              </div>
              <div class="stat-item">
                <span>Improvement:</span>
                <span>${this.formatImprovement(
                  stats.performanceMetrics.improvement
                )}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Achievements</h2>
            <div class="stat-item">
              <span>Unlocked:</span>
              <span>${stats.achievements.totalUnlocked}/${
        stats.achievements.totalAvailable
      } (${stats.achievements.unlockedPercentage}%)</span>
            </div>
          </div>

          <div class="section">
            <h2>Difficulty Performance</h2>
            ${Object.entries(stats.difficultyStats)
              .map(([difficulty, data]) => {
                const winRate =
                  data.played > 0
                    ? Math.round((data.won / data.played) * 100)
                    : 0;
                return `
                <div class="stat-item">
                  <span>${difficulty.toUpperCase()}:</span>
                  <span>${data.played} games, ${winRate}% win rate</span>
                </div>
              `;
              })
              .join("")}
          </div>

          <div class="section">
            <h2>Category Performance</h2>
            ${Object.entries(stats.categoryStats)
              .sort(([, a], [, b]) => b.played - a.played)
              .slice(0, 5)
              .map(([category, data]) => {
                const winRate =
                  data.played > 0
                    ? Math.round((data.won / data.played) * 100)
                    : 0;
                return `
                  <div class="stat-item">
                    <span>${category}:</span>
                    <span>${data.played} games, ${winRate}% win rate</span>
                  </div>
                `;
              })
              .join("")}
          </div>

          <div class="section no-print">
            <p><em>This report was generated by the Hangman Game Statistics Dashboard.</em></p>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

      this.showFeedback("success", "Statistics sent to printer");
    } catch (error) {
      console.error("Error printing statistics:", error);
      this.showFeedback("error", "Failed to print statistics");
    }
  }

  // ========================================
  // ACHIEVEMENTS MANAGEMENT
  // ========================================

  showAchievements() {
    const modal = document.getElementById("achievements-modal");
    if (modal) {
      this.populateAchievements();
      modal.classList.add("show");
    }
  }

  hideAchievements() {
    const modal = document.getElementById("achievements-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  }

  populateAchievements() {
    const content = document.getElementById("achievements-content");
    if (!content) return;

    try {
      const achievements = this.game.getAchievements();
      const stats = this.game.getStatistics();
      this.renderAchievementsContent(content, achievements, stats);
    } catch (error) {
      console.error("Error loading achievements:", error);
      this.renderAchievementsError(content, error);
    }
  }

  /**
   * Renders achievements content
   * @param {HTMLElement} content - Content container
   * @param {Object} achievements - Achievements data
   * @param {Object} stats - Statistics data
   */
  renderAchievementsContent(content, achievements, stats) {
    const achievementData = [
      {
        id: "firstWin",
        name: "First Win",
        description: "Win your first game",
        icon: "🎯",
        unlocked: achievements.firstWin.unlocked,
        unlockedAt: achievements.firstWin.unlockedAt,
        progress: stats.gamesWon >= 1 ? 100 : 0,
      },
      {
        id: "streak5",
        name: "5-Game Streak",
        description: "Win 5 games in a row",
        icon: "🔥",
        unlocked: achievements.streak5.unlocked,
        unlockedAt: achievements.streak5.unlockedAt,
        progress: Math.min(100, (stats.currentStreak / 5) * 100),
      },
      {
        id: "streak10",
        name: "10-Game Streak",
        description: "Win 10 games in a row",
        icon: "💪",
        unlocked: achievements.streak10.unlocked,
        unlockedAt: achievements.streak10.unlockedAt,
        progress: Math.min(100, (stats.currentStreak / 10) * 100),
      },
      {
        id: "perfectGame",
        name: "Perfect Game",
        description: "Win a game with no incorrect guesses",
        icon: "⭐",
        unlocked: achievements.perfectGame.unlocked,
        unlockedAt: achievements.perfectGame.unlockedAt,
        progress: achievements.perfectGame.unlocked ? 100 : 0,
      },
      {
        id: "speedDemon",
        name: "Speed Demon",
        description: "Win a game in under 15 seconds",
        icon: "⚡",
        unlocked: achievements.speedDemon.unlocked,
        unlockedAt: achievements.speedDemon.unlockedAt,
        progress: achievements.speedDemon.unlocked ? 100 : 0,
      },
      {
        id: "difficultyMaster",
        name: "Difficulty Master",
        description: "Win a game on hard difficulty",
        icon: "👑",
        unlocked: achievements.difficultyMaster.unlocked,
        unlockedAt: achievements.difficultyMaster.unlockedAt,
        progress: achievements.difficultyMaster.unlocked ? 100 : 0,
      },
      {
        id: "categoryExplorer",
        name: "Category Explorer",
        description: "Play 5 different categories",
        icon: "🗺️",
        unlocked: achievements.categoryExplorer.unlocked,
        unlockedAt: achievements.categoryExplorer.unlockedAt,
        progress: Math.min(
          100,
          (Object.keys(stats.categoryStats).length / 5) * 100
        ),
      },
      {
        id: "scoreHunter",
        name: "Score Hunter",
        description: "Reach 1000 total score",
        icon: "💰",
        unlocked: achievements.scoreHunter.unlocked,
        unlockedAt: achievements.scoreHunter.unlockedAt,
        progress: Math.min(100, (this.game.gameState.score / 1000) * 100),
      },
    ];

    content.innerHTML = `
      <div class="achievements-grid">
        ${achievementData
          .map(
            (achievement) => `
          <div class="achievement-item ${
            achievement.unlocked ? "unlocked" : "locked"
          }">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
              <h4>${achievement.name}</h4>
              <p>${achievement.description}</p>
              ${
                achievement.unlocked
                  ? `<div class="achievement-unlocked">Unlocked ${this.formatDate(
                      achievement.unlockedAt
                    )}</div>`
                  : `<div class="achievement-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${
                      achievement.progress
                    }%"></div>
                  </div>
                  <span class="progress-text">${Math.round(
                    achievement.progress
                  )}%</span>
                </div>`
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  /**
   * Renders achievements error message
   * @param {HTMLElement} content - Content container
   * @param {Error} error - Error that occurred
   */
  renderAchievementsError(content, error) {
    const userMessage = ErrorMessageFactory.createUserFriendlyMessage(
      error,
      "data_corrupted"
    );

    content.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
        <h3 style="color: #ff6b6b; margin-bottom: 15px;">Unable to Load Achievements</h3>
        <p style="margin-bottom: 20px;">${userMessage}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #999;">
            Your achievements may have been corrupted or are temporarily unavailable.
          </p>
        </div>
        <button onclick="location.reload()" 
                style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }

  formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  /**
   * Renders win rate chart
   * @param {Array} dailyData - Daily trend data
   * @returns {string} - HTML for win rate chart
   */
  renderWinRateChart(dailyData) {
    if (!dailyData || dailyData.length === 0) {
      return '<div class="no-data">No data available for chart</div>';
    }

    const maxWinRate = Math.max(...dailyData.map((d) => d.winRate));
    const chartHeight = 120;

    return `
      <div class="simple-chart">
        <svg width="100%" height="${chartHeight}" viewBox="0 0 300 ${chartHeight}">
          <polyline
            fill="none"
            stroke="#4CAF50"
            stroke-width="2"
            points="${dailyData
              .map(
                (d, i) =>
                  `${(i / (dailyData.length - 1)) * 280},${
                    chartHeight -
                    (d.winRate / maxWinRate) * (chartHeight - 20) +
                    10
                  }`
              )
              .join(" ")}"
          />
          ${dailyData
            .map(
              (d, i) =>
                `<circle cx="${(i / (dailyData.length - 1)) * 280}" cy="${
                  chartHeight -
                  (d.winRate / maxWinRate) * (chartHeight - 20) +
                  10
                }" r="2" fill="#4CAF50" />`
            )
            .join("")}
        </svg>
        <div class="chart-labels">
          <span>0%</span>
          <span>${maxWinRate}%</span>
        </div>
      </div>
    `;
  }

  /**
   * Renders games daily chart
   * @param {Array} dailyData - Daily trend data
   * @returns {string} - HTML for games daily chart
   */
  renderGamesDailyChart(dailyData) {
    if (!dailyData || dailyData.length === 0) {
      return '<div class="no-data">No data available for chart</div>';
    }

    const maxGames = Math.max(...dailyData.map((d) => d.gamesPlayed));
    const chartHeight = 120;

    return `
      <div class="simple-chart">
        <svg width="100%" height="${chartHeight}" viewBox="0 0 300 ${chartHeight}">
          ${dailyData
            .map((d, i) => {
              const barHeight = (d.gamesPlayed / maxGames) * (chartHeight - 20);
              return `<rect x="${(i / dailyData.length) * 280}" y="${
                chartHeight - barHeight + 10
              }" width="${
                280 / dailyData.length - 2
              }" height="${barHeight}" fill="#2196F3" />`;
            })
            .join("")}
        </svg>
        <div class="chart-labels">
          <span>0</span>
          <span>${maxGames}</span>
        </div>
      </div>
    `;
  }

  /**
   * Renders difficulty breakdown
   * @param {Object} difficultyStats - Difficulty statistics
   * @returns {string} - HTML for difficulty breakdown
   */
  renderDifficultyBreakdown(difficultyStats) {
    return Object.entries(difficultyStats)
      .map(([difficulty, data]) => {
        const winRate =
          data.played > 0 ? Math.round((data.won / data.played) * 100) : 0;
        return `
          <div class="breakdown-item">
            <div class="breakdown-header">
              <span class="breakdown-name">${difficulty.toUpperCase()}</span>
              <span class="breakdown-value">${winRate}%</span>
            </div>
            <div class="breakdown-details">
              <span>${data.played} games</span>
              <span>${data.won} wins</span>
              <span>${data.lost} losses</span>
            </div>
            <div class="breakdown-bar">
              <div class="breakdown-fill" style="width: ${winRate}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /**
   * Renders category breakdown
   * @param {Object} categoryStats - Category statistics
   * @returns {string} - HTML for category breakdown
   */
  renderCategoryBreakdown(categoryStats) {
    const sortedCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b.played - a.played)
      .slice(0, 5);

    return sortedCategories
      .map(([category, data]) => {
        const winRate =
          data.played > 0 ? Math.round((data.won / data.played) * 100) : 0;
        return `
          <div class="breakdown-item">
            <div class="breakdown-header">
              <span class="breakdown-name">${category}</span>
              <span class="breakdown-value">${winRate}%</span>
            </div>
            <div class="breakdown-details">
              <span>${data.played} games</span>
              <span>${data.won} wins</span>
            </div>
            <div class="breakdown-bar">
              <div class="breakdown-fill" style="width: ${winRate}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /**
   * Renders performance insights
   * @param {Object} insights - Performance insights
   * @returns {string} - HTML for performance insights
   */
  renderPerformanceInsights(insights) {
    return `
      <div class="insights-grid">
        <div class="insight-card strengths">
          <h4>💪 Strengths</h4>
          <ul>
            ${insights.strengths
              .map((strength) => `<li>${strength}</li>`)
              .join("")}
            ${
              insights.strengths.length === 0
                ? "<li>Keep playing to discover your strengths!</li>"
                : ""
            }
          </ul>
        </div>
        <div class="insight-card improvements">
          <h4>🎯 Areas for Improvement</h4>
          <ul>
            ${insights.improvements
              .map((improvement) => `<li>${improvement}</li>`)
              .join("")}
            ${
              insights.improvements.length === 0
                ? "<li>Great job! Keep up the excellent work!</li>"
                : ""
            }
          </ul>
        </div>
        <div class="insight-card recommendations">
          <h4>💡 Recommendations</h4>
          <ul>
            ${insights.recommendations
              .map((recommendation) => `<li>${recommendation}</li>`)
              .join("")}
            ${
              insights.recommendations.length === 0
                ? "<li>Continue playing to get personalized recommendations!</li>"
                : ""
            }
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Formats consistency value
   * @param {number} consistency - Consistency value
   * @returns {string} - Formatted consistency
   */
  formatConsistency(consistency) {
    if (consistency < 5000) return "Very Consistent";
    if (consistency < 10000) return "Consistent";
    if (consistency < 20000) return "Moderate";
    return "Variable";
  }

  /**
   * Formats improvement value
   * @param {number} improvement - Improvement percentage
   * @returns {string} - Formatted improvement
   */
  formatImprovement(improvement) {
    if (improvement > 10) return `+${improvement}% Improving`;
    if (improvement > 0) return `+${improvement}% Slight Improvement`;
    if (improvement === 0) return "Stable";
    if (improvement > -10) return `${improvement}% Slight Decline`;
    return `${improvement}% Declining`;
  }

  /**
   * Shows the settings modal
   */
  showSettings() {
    const modal = document.getElementById("settings-modal");
    const content = document.getElementById("settings-content");

    if (!modal || !content) return;

    // Get theme manager from global scope
    const themeManager = window.themeManager;
    if (!themeManager) {
      console.error("Theme manager not available");
      return;
    }

    // Populate settings content
    content.innerHTML = themeManager.createSettingsUI();

    // Show modal
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Update theme previews after content is rendered
    setTimeout(() => {
      themeManager.updateThemePreviews();
    }, 100);
  }

  /**
   * Hides the settings modal
   */
  hideSettings() {
    const modal = document.getElementById("settings-modal");
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "";
    }
  }

  /**
   * Shows the help modal
   */
  showHelp() {
    const modal = document.getElementById("help-modal");
    const content = document.getElementById("help-content");

    if (!modal || !content) return;

    // Initialize help system if not already done
    if (!window.helpSystem) {
      window.helpSystem = new HelpSystem();
      window.helpSystem.initialize();
    }

    // Show modal
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  /**
   * Hides the help modal
   */
  hideHelp() {
    const modal = document.getElementById("help-modal");
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "";
    }
  }

  // ========================================
  // CHALLENGE SYSTEM UI
  // ========================================

  /**
   * Shows the challenge modal
   */
  showChallenge() {
    const modal = document.getElementById("challenge-modal");
    if (modal) {
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
      this.populateChallengeModal();
    }
  }

  /**
   * Hides the challenge modal
   */
  hideChallenge() {
    const modal = document.getElementById("challenge-modal");
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "";
    }
  }

  /**
   * Populates the challenge modal with current challenges
   */
  populateChallengeModal() {
    const content = document.getElementById("challenge-content");
    if (!content) return;

    // Initialize challenge system if not already done
    if (!window.challengeSystem) {
      window.challengeSystem = new ChallengeSystem();
    }

    const challenges = window.challengeSystem.getCurrentChallenges();
    const leaderboard = window.challengeSystem.getLeaderboard("daily");

    content.innerHTML = this.renderChallengeContent(challenges, leaderboard);
  }

  /**
   * Renders the challenge content
   * @param {Object} challenges - Current challenges
   * @param {Array} leaderboard - Leaderboard data
   * @returns {string} - HTML content
   */
  renderChallengeContent(challenges, leaderboard) {
    return `
      <div class="challenge-container">
        ${this.renderDailyChallenge(challenges.daily)}
        ${this.renderWeeklyTournament(challenges.weekly)}
        ${this.renderThemedChallenges(challenges.themed)}
        ${this.renderLeaderboard(leaderboard)}
      </div>
    `;
  }

  /**
   * Renders daily challenge section
   * @param {Object} dailyChallenge - Daily challenge data
   * @returns {string} - HTML content
   */
  renderDailyChallenge(dailyChallenge) {
    if (!dailyChallenge) return "";

    return `
      <div class="challenge-section">
        <h3>📅 Daily Challenge</h3>
        <div class="challenge-card daily-challenge">
          <div class="challenge-header">
            <h4>${dailyChallenge.description}</h4>
            <span class="challenge-type">${dailyChallenge.type.toUpperCase()}</span>
          </div>
          <div class="challenge-details">
            <div class="challenge-detail">
              <span class="detail-label">Word:</span>
              <span class="detail-value">${dailyChallenge.word}</span>
            </div>
            <div class="challenge-detail">
              <span class="detail-label">Difficulty:</span>
              <span class="detail-value">${dailyChallenge.difficulty}</span>
            </div>
            <div class="challenge-detail">
              <span class="detail-label">Time Limit:</span>
              <span class="detail-value">${Math.round(
                dailyChallenge.timeLimit / 1000
              )}s</span>
            </div>
            <div class="challenge-detail">
              <span class="detail-label">Target Score:</span>
              <span class="detail-value">${dailyChallenge.targetScore}</span>
            </div>
          </div>
          <div class="challenge-rewards">
            <h5>Rewards:</h5>
            <div class="reward-item">
              <span class="reward-icon">💰</span>
              <span class="reward-text">+${
                dailyChallenge.rewards.points
              } points</span>
            </div>
            <div class="reward-item">
              <span class="reward-icon">🏆</span>
              <span class="reward-text">${dailyChallenge.rewards.badge}</span>
            </div>
          </div>
          <button class="btn btn-primary" onclick="ui.startDailyChallenge()">
            Start Challenge
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renders weekly tournament section
   * @param {Object} weeklyTournament - Weekly tournament data
   * @returns {string} - HTML content
   */
  renderWeeklyTournament(weeklyTournament) {
    if (!weeklyTournament) return "";

    return `
      <div class="challenge-section">
        <h3>🏆 Weekly Tournament</h3>
        <div class="challenge-card weekly-tournament">
          <div class="tournament-header">
            <h4>${weeklyTournament.name}</h4>
            <span class="tournament-theme">${weeklyTournament.theme}</span>
          </div>
          <div class="tournament-details">
            <div class="tournament-detail">
              <span class="detail-label">Max Attempts:</span>
              <span class="detail-value">${
                weeklyTournament.rules.maxAttempts
              }</span>
            </div>
            <div class="tournament-detail">
              <span class="detail-label">Time Limit:</span>
              <span class="detail-value">${Math.round(
                weeklyTournament.rules.timeLimit / 1000
              )}s</span>
            </div>
            <div class="tournament-detail">
              <span class="detail-label">Difficulty:</span>
              <span class="detail-value">${
                weeklyTournament.rules.difficulty
              }</span>
            </div>
          </div>
          <div class="tournament-prizes">
            <h5>Prizes:</h5>
            ${weeklyTournament.prizes
              .map(
                (prize) => `
              <div class="prize-item">
                <span class="prize-position">${prize.position}</span>
                <span class="prize-reward">${prize.reward}</span>
                <span class="prize-points">+${prize.points} points</span>
              </div>
            `
              )
              .join("")}
          </div>
          <button class="btn btn-primary" onclick="ui.startWeeklyTournament()">
            Join Tournament
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renders themed challenges section
   * @param {Array} themedChallenges - Themed challenges data
   * @returns {string} - HTML content
   */
  renderThemedChallenges(themedChallenges) {
    if (!themedChallenges || themedChallenges.length === 0) return "";

    return `
      <div class="challenge-section">
        <h3>🎨 Themed Challenges</h3>
        <div class="themed-challenges-grid">
          ${themedChallenges
            .map(
              (theme) => `
            <div class="challenge-card themed-challenge">
              <div class="theme-header">
                <span class="theme-icon">${theme.icon}</span>
                <h4>${theme.name}</h4>
              </div>
              <div class="theme-categories">
                ${theme.categories
                  .map(
                    (category) => `
                  <span class="category-tag">${category}</span>
                `
                  )
                  .join("")}
              </div>
              <button class="btn btn-secondary" onclick="ui.startThemedChallenge('${
                theme.name
              }')">
                Play ${theme.name}
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Renders leaderboard section
   * @param {Array} leaderboard - Leaderboard data
   * @returns {string} - HTML content
   */
  renderLeaderboard(leaderboard) {
    return `
      <div class="challenge-section">
        <h3>🏅 Leaderboard</h3>
        <div class="challenge-card leaderboard">
          <div class="leaderboard-header">
            <h4>Daily Top Players</h4>
          </div>
          <div class="leaderboard-list">
            ${
              leaderboard.length > 0
                ? leaderboard
                    .slice(0, 10)
                    .map(
                      (entry, index) => `
              <div class="leaderboard-entry">
                <span class="rank">${index + 1}</span>
                <span class="player">${entry.player}</span>
                <span class="score">${entry.score}</span>
                <span class="time">${Math.round(entry.time / 1000)}s</span>
              </div>
            `
                    )
                    .join("")
                : '<div class="no-entries">No entries yet</div>'
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Starts a daily challenge
   */
  startDailyChallenge() {
    if (!window.challengeSystem) return;

    const challenge = window.challengeSystem.challenges.daily.currentChallenge;
    if (!challenge) return;

    // Configure game for challenge
    window.game.gameState.difficulty = challenge.difficulty;
    window.game.gameState.category = challenge.category;

    // Enable timed mode if it's a speed challenge
    if (challenge.type === "speed") {
      window.game.enableTimedMode(challenge.timeLimit);
    }

    // Start new game
    window.game.resetGame();
    window.game.init();

    // Hide challenge modal
    this.hideChallenge();

    // Show challenge info
    this.showFeedback("info", `Starting ${challenge.type} challenge!`);
  }

  /**
   * Starts a weekly tournament
   */
  startWeeklyTournament() {
    if (!window.challengeSystem) return;

    const tournament =
      window.challengeSystem.challenges.weekly.currentTournament;
    if (!tournament) return;

    // Configure game for tournament
    window.game.gameState.difficulty = tournament.rules.difficulty;
    window.game.enableTimedMode(tournament.rules.timeLimit);

    // Start new game
    window.game.resetGame();
    window.game.init();

    // Hide challenge modal
    this.hideChallenge();

    // Show tournament info
    this.showFeedback("info", `Joining ${tournament.name}!`);
  }

  /**
   * Starts a themed challenge
   * @param {string} themeName - Name of the theme
   */
  startThemedChallenge(themeName) {
    if (!window.challengeSystem) return;

    const theme = window.challengeSystem.challenges.themed.activeThemes.find(
      (t) => t.name === themeName
    );
    if (!theme) return;

    // Set random category from theme
    const randomCategory =
      theme.categories[Math.floor(Math.random() * theme.categories.length)];
    window.game.gameState.category = randomCategory;
    window.game.gameState.difficulty = "medium";

    // Start new game
    window.game.resetGame();
    window.game.init();

    // Hide challenge modal
    this.hideChallenge();

    // Show theme info
    this.showFeedback("info", `Starting ${themeName} challenge!`);
  }

  /**
   * Resets settings to default values
   */
  resetSettings() {
    const themeManager = window.themeManager;
    if (!themeManager) {
      console.error("Theme manager not available");
      return;
    }

    // Reset to default settings
    themeManager.resetToDefault();

    // Update the settings UI
    const content = document.getElementById("settings-content");
    if (content) {
      content.innerHTML = themeManager.createSettingsUI();
      setTimeout(() => {
        themeManager.updateThemePreviews();
      }, 100);
    }

    // Show confirmation
    this.showFeedback("success", "Settings reset to default values");
  }

  /**
   * Setup listeners for settings changes
   */
  setupSettingsListeners() {
    // Listen for theme changes
    document.addEventListener("themeChanged", (event) => {
      const { difficulty, category } = event.detail;

      // Update game settings if they changed
      if (difficulty && difficulty !== this.game.gameState.difficulty) {
        this.game.gameState.difficulty = difficulty;
        this.updateDifficultyIndicator();
        this.showFeedback("info", `Difficulty changed to ${difficulty}`);
      }

      if (category && category !== this.game.gameState.category) {
        this.game.gameState.category = category;
        this.showFeedback("info", `Category changed to ${category}`);
      }
    });
  }
}

// Export for use in other files
window.GameUI = GameUI;
