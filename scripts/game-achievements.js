// ========================================
// HANGMAN GAME - ACHIEVEMENT SYSTEM MODULE
// ========================================
// This module handles achievement tracking and unlocking

/**
 * Achievement Mixin for HangmanGame
 * Extends HangmanGame with achievement-related functionality
 */
const AchievementMixin = {
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
  },

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
  },

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
  },

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
      if (this.errorHandler) {
        this.errorHandler.handleError(
          new Error("Failed to save achievements"),
          "storage_quota",
          { achievements: this.achievements }
        );
      }
    }
  },

  checkAchievements() {
    // Disable achievements in practice mode
    if (this.gameState.practiceMode?.enabled) {
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
  },

  showAchievementNotification(achievements) {
    if (window.ui) {
      achievements.forEach((achievement) => {
        window.ui.showFeedback(
          "achievement",
          `🏆 Achievement Unlocked: ${achievement}!`
        );
      });
    }
  },

  getAchievements() {
    return { ...this.achievements };
  },

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
  },
};

// Export for use in game.js
if (typeof window !== "undefined") {
  window.AchievementMixin = AchievementMixin;
}

