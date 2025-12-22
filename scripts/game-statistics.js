// ========================================
// HANGMAN GAME - STATISTICS MANAGEMENT MODULE
// ========================================
// This module handles statistics loading, saving, updating, and reporting

/**
 * Statistics Mixin for HangmanGame
 * Extends HangmanGame with statistics-related functionality
 */
const StatisticsMixin = {
  loadStatistics() {
    // Use cache manager if available
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      const cached = this.cacheManager.get("statistics");
      if (cached) {
        // Validate with data validator if available
        if (this.dataValidator) {
          const validation = this.dataValidator.validateStatistics(cached);
          if (validation.valid || validation.recovered) {
            if (validation.recovered && validation.fixes.length > 0) {
              if (window.logger) window.logger.debug(
                "Statistics were automatically fixed:",
                validation.fixes
              );
              // Save fixed statistics
              this.cacheManager.set("statistics", cached);
            }
            return cached;
          } else {
            if (window.logger) window.logger.warn("Statistics validation failed, using defaults");
          }
        } else if (this.validateStatisticsStructure(cached)) {
          return cached;
        }
      }
    }

    // Fallback to old localStorage method
    return GameUtils.safeExecute(
      () => {
        if (!GameUtils.isLocalStorageAvailable()) {
          throw new Error("localStorage not available");
        }

        const savedStats = localStorage.getItem("hangmanStatistics");
        if (savedStats) {
          const parsed = JSON.parse(savedStats);

          // Validate with data validator if available
          if (this.dataValidator) {
            const validation = this.dataValidator.validateStatistics(parsed);
            if (validation.valid || validation.recovered) {
              if (validation.recovered && validation.fixes.length > 0) {
                if (window.logger) window.logger.debug(
                  "Statistics were automatically fixed:",
                  validation.fixes
                );
              }
              // Migrate to cache manager if available
              if (this.cacheManager) {
                this.cacheManager.set("statistics", parsed);
              }
              return parsed;
            } else {
              if (window.logger) window.logger.warn("Statistics validation failed:", validation.errors);
            }
          } else if (this.validateStatisticsStructure(parsed)) {
            // Migrate to cache manager if available
            if (this.cacheManager) {
              this.cacheManager.set("statistics", parsed);
            }
            return parsed;
          } else {
            throw new Error("Invalid statistics structure");
          }
        }
        return this.getDefaultStatistics();
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
    // Use data validator if available for comprehensive validation
    if (this.dataValidator) {
      const validation = this.dataValidator.validateStatistics(stats);
      return validation.valid;
    }

    // Fallback to basic structure check
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
    // Use cache manager if available
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      const success = this.cacheManager.set("statistics", this.statistics, {
        metadata: {
          lastSaved: Date.now(),
          version: this.statistics.version || "1.0.0",
        },
      });

      if (success) {
        // Also save backup periodically (every 10th save)
        if (!this._statisticsSaveCount) {
          this._statisticsSaveCount = 0;
        }
        this._statisticsSaveCount++;

        if (this._statisticsSaveCount % 10 === 0) {
          this.cacheManager.set("statistics_backup", this.statistics, {
            expiration: 30 * 24 * 60 * 60 * 1000, // 30 days
            metadata: { isBackup: true },
          });
        }
        return;
      }
    }

    // Fallback to old localStorage method
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
    if (this.gameState.practiceMode?.enabled) {
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
};

// Export for use in other files
if (typeof window !== "undefined") {
  window.StatisticsMixin = StatisticsMixin;
}
